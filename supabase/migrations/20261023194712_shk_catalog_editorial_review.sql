-- Append editorial evidence separately; immutable questions and registry stay unchanged.
-- No question text, solutions, private IDs or learner records are part of this migration.
create table shk_private.question_editorial_reviews (
  question_id text not null,
  question_version integer not null,
  review_id text not null,
  reviewed_at timestamptz not null default clock_timestamp(),
  review jsonb not null,
  primary key (question_id,question_version,review_id),
  foreign key (question_id,question_version) references shk_private.questions(question_id,version),
  constraint question_editorial_review_shape check ((
    jsonb_typeof(review)='object'
    and review->>'rubricVersion'='werktag-demand/1'
    and jsonb_typeof(review->'difficulty')='number'
    and review->>'difficulty' in ('1','2','3','4')
    and review->>'taskKind' in ('calculation','context','knowledge')
    and review->>'status' in ('supported','qualified','needs_revision')
    and jsonb_typeof(review->'practiceEligible')='boolean'
    and jsonb_typeof(review->'reviewedAt')='string'
    and length(review->>'reviewedAt')>=10
    and review->>'contentFingerprint' ~ '^[0-9a-f]{32}$'
  ) is true)
);
create index question_editorial_reviews_latest
  on shk_private.question_editorial_reviews(question_id,question_version,reviewed_at desc,review_id desc);
alter table shk_private.question_editorial_reviews enable row level security;
revoke all on shk_private.question_editorial_reviews from public,anon,authenticated;
create trigger question_editorial_reviews_immutable before update or delete
  on shk_private.question_editorial_reviews for each row
  execute function shk_private.reject_learning_mutation();
comment on table shk_private.question_editorial_reviews is
  'Append-only private editorial evidence, linked to existing immutable questions. Learner RPCs expose only an answer-free projection.';

CREATE OR REPLACE FUNCTION shk_private.question_metadata(_question text, _version integer)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select coalesce((select jsonb_build_object('objectiveId',r.objective_id,'familyId',r.family_id,
    'demand',r.demand,'maxPoints',r.max_points,'allowedTools',r.allowed_tools,'variantId',r.external_id,
    'practiceEligible',case when e.review is null then true else
      coalesce(e.review->>'contentFingerprint'=md5(q.payload::text||q.solution::text||q.rule::text||coalesce(q.hint,''))
        and (e.review->>'practiceEligible')::boolean,false) end,
    'editorialReview',case when e.review->>'rubricVersion'='werktag-demand/1'
      and e.review->>'contentFingerprint'=md5(q.payload::text||q.solution::text||q.rule::text||coalesce(q.hint,''))
      then jsonb_build_object(
        'difficultyLevel',e.review->'difficulty','taskKind',e.review->'taskKind',
        'status',e.review->'status','reviewedAt',e.review->'reviewedAt',
        'rubricVersion',e.review->'rubricVersion',
        'practiceEligible',e.review->'practiceEligible') end)
    from shk_private.question_registry r join shk_private.questions q using(question_id,version)
    left join lateral (
      select er.review from shk_private.question_editorial_reviews er
      where er.question_id=r.question_id and er.question_version=r.version
      order by er.reviewed_at desc,er.review_id desc limit 1
    ) e on true
    where r.question_id=_question and r.version=_version
      and(r.owner_user_id is null or r.owner_user_id=auth.uid())),'{}'::jsonb)
$function$
;

CREATE OR REPLACE FUNCTION shk_private.index_question(_id text, _external text, _version integer, _topic text, _payload jsonb, _metadata jsonb, _review text, _active boolean, _excluded text)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select jsonb_strip_nulls(jsonb_build_object(
    'id',_id,'externalId',_external,'version',_version,'topic',_topic,
    'subtopic',_payload->'subtopic','title',_payload->'title','kind',_payload->'kind',
    'difficulty',_payload->'difficulty',
    'active',_active and coalesce((_metadata->>'practiceEligible')::boolean,true),'reviewStatus',_review,
    'editorialReview',_metadata->'editorialReview',
    'objectiveId',coalesce(_metadata->>'objectiveId','legacy-objective:'||_topic||':'||coalesce(_payload->>'subtopic',_id)),
    'familyId',coalesce(_metadata->>'familyId','legacy-family:'||_id),
    'demand',coalesce(_metadata->>'demand','foundation'),
    'maxPoints',coalesce(_metadata->'maxPoints','1'::jsonb),
    'allowedTools',coalesce(_metadata->'allowedTools','[]'::jsonb),
    'excludedReason',_excluded,
    'source',jsonb_strip_nulls(jsonb_build_object(
      'document',_payload->'source'->'document','materialId',_payload->'source'->'materialId',
      'pdfPage',_payload->'source'->'pdfPage','printedPage',_payload->'source'->'printedPage',
      'status',_payload->'source'->'status'))))
$function$
;

CREATE OR REPLACE FUNCTION shk_private.begin_learning(_selection jsonb, _request uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare _user uuid; _topic text; _objective text; _mode text; _normalized jsonb; _kind text;
  _field text; _answer_format text; _question text; _question_version integer; _difficulty integer;
  _task_kind text; _bank_difficulty text; _chosen jsonb; _count integer; _id uuid; _old public.shk_sessions; _learning shk_private.session_learning;
begin
  _user:=shk_private.require_learner();
  perform shk_private.assert_access('new_session');
  if _request is null then raise exception 'Vorgangskennung fehlt.' using errcode='22023'; end if;
  if _selection is null or jsonb_typeof(_selection)<>'object'
    or exists(select 1 from jsonb_object_keys(_selection) k where k not in('topic','objectiveId','mode','learningFieldId','learningMode','answerFormat',
      'questionId','questionVersion','difficultyLevel','taskKind','bankDifficulty')) then
    raise exception 'Bitte wähle ein Thema, ein Lernziel oder eine Überprüfungsrunde.' using errcode='22023';
  end if;

  if (_selection ? 'questionId') <> (_selection ? 'questionVersion')
    or (_selection ? 'questionId' and (jsonb_typeof(_selection->'questionId')<>'string'
      or length(trim(_selection->>'questionId')) not between 1 and 300
      or jsonb_typeof(_selection->'questionVersion')<>'number'
      or _selection->>'questionVersion' !~ '^[1-9][0-9]{0,8}$')) then
    raise exception 'Bitte wähle eine gültige Aufgabe mit ihrer genauen Fassung.' using errcode='22023'; end if;
  _question:=_selection->>'questionId';
  if _question is not null then _question_version:=(_selection->>'questionVersion')::integer; end if;
  if _selection ? 'difficultyLevel' and (jsonb_typeof(_selection->'difficultyLevel')<>'number'
    or _selection->>'difficultyLevel' !~ '^[1-4]$') then
    raise exception 'Bitte wähle eine Schwierigkeitsstufe von 1 bis 4.' using errcode='22023'; end if;
  if _selection ? 'difficultyLevel' then _difficulty:=(_selection->>'difficultyLevel')::integer; end if;
  if _selection ? 'taskKind' and (jsonb_typeof(_selection->'taskKind')<>'string'
    or _selection->>'taskKind' not in('calculation','context','knowledge')) then
    raise exception 'Bitte wähle eine unterstützte Aufgabenart.' using errcode='22023'; end if;
  _task_kind:=_selection->>'taskKind';
  if _selection ? 'bankDifficulty' and (jsonb_typeof(_selection->'bankDifficulty')<>'string'
    or _selection->>'bankDifficulty' not in('basic','applied')) then
    raise exception 'Bitte wähle eine gültige Bestandseinstufung.' using errcode='22023'; end if;
  _bank_difficulty:=_selection->>'bankDifficulty';

  if _selection ? 'answerFormat' and(jsonb_typeof(_selection->'answerFormat')<>'string'
    or _selection->>'answerFormat' is distinct from 'choice') then
    raise exception 'Bitte wähle ein unterstütztes Antwortformat.' using errcode='22023'; end if;
  _answer_format:=_selection->>'answerFormat';
  if _selection ? 'topic' and jsonb_typeof(_selection->'topic') not in('string','null') then
    raise exception 'Das Thema muss eine bekannte Themenkennung sein.' using errcode='22023'; end if;
  if _selection ? 'learningMode' and (_selection->>'learningMode' is distinct from 'practice' or jsonb_typeof(_selection->'learningMode')<>'string') then
    raise exception 'Der Lernmodus kann nicht vom Browser in einen Prüfungsmodus geändert werden.' using errcode='22023'; end if;
  if _selection ? 'learningFieldId' and(jsonb_typeof(_selection->'learningFieldId')<>'string'
    or length(trim(_selection->>'learningFieldId')) not between 1 and 100) then
    raise exception 'Bitte wähle eine gültige Lernfeldkennung.' using errcode='22023'; end if;
  _field:=_selection->>'learningFieldId';
  if _field is not null and not exists(select 1 from shk_private.visible_content('learning_field') e where e.id=_field) then
    raise exception 'Dieses Lernfeld ist noch nicht fachlich freigegeben oder nicht zugänglich.' using errcode='22023'; end if;
  _topic:=_selection->>'topic';
  if _topic is not null and _topic not in('trinkwasser','entwaesserung','heizung','waermeerzeuger','regelung','systemanalyse','fachrechnen','wiso') then
    raise exception 'Dieses Thema ist nicht verfügbar.' using errcode='22023'; end if;
  if _selection ? 'objectiveId' and(jsonb_typeof(_selection->'objectiveId')<>'string'
    or length(trim(_selection->>'objectiveId')) not between 1 and 300) then
    raise exception 'Bitte wähle eine gültige Lernzielkennung.' using errcode='22023'; end if;
  _objective:=_selection->>'objectiveId';
  if _objective is not null then
    if not exists(select 1 from shk_private.learning_objectives o where o.id=_objective
      and(o.owner_user_id is null or o.owner_user_id=_user)
      and(_topic is null or o.definition->>'topic'=_topic)) then
      raise exception 'Dieses Lernziel ist für das gewählte Thema nicht verfügbar.' using errcode='22023'; end if;
    if _topic is null then
      select o.definition->>'topic' into _topic from shk_private.learning_objectives o where o.id=_objective
        and(o.owner_user_id is null or o.owner_user_id=_user);
    end if;
  end if;
  if _selection ? 'mode' and jsonb_typeof(_selection->'mode')<>'string' then
    raise exception 'Die Übungsart ist ungültig.' using errcode='22023'; end if;
  _mode:=coalesce(_selection->>'mode','practice');
  if _mode not in('practice','verification') or(_mode='verification' and (_topic is null or _question is not null)) then
    raise exception 'Eine Überprüfungsrunde benötigt ein einzelnes Thema.' using errcode='22023'; end if;
  _normalized:=jsonb_build_object('topic',_topic,'mode',_mode)
    ||case when _objective is null then '{}'::jsonb else jsonb_build_object('objectiveId',_objective) end
    ||case when _field is null then '{}'::jsonb else jsonb_build_object('learningFieldId',_field) end
    ||case when _answer_format is null then '{}'::jsonb else jsonb_build_object('answerFormat',_answer_format) end
    ||case when _question is null then '{}'::jsonb else jsonb_build_object('questionId',_question,'questionVersion',_question_version) end
    ||case when _difficulty is null then '{}'::jsonb else jsonb_build_object('difficultyLevel',_difficulty) end
    ||case when _task_kind is null then '{}'::jsonb else jsonb_build_object('taskKind',_task_kind) end
    ||case when _bank_difficulty is null then '{}'::jsonb else jsonb_build_object('bankDifficulty',_bank_difficulty) end;
  _kind:=case when _mode='verification' then 'verification' when _objective is not null or _field is not null or _question is not null
      or _difficulty is not null or _task_kind is not null or _bank_difficulty is not null then 'targeted'
    when _topic is null then 'mixed' else 'topic' end;

  -- Serialize retries before looking up the unique user/request pair. A retry
  -- can only replay this exact topic/objective/mode/format, never create another round.
  perform pg_advisory_xact_lock(hashtextextended(_user::text||':learning:'||_request::text,0));
  select * into _old from public.shk_sessions where user_id=_user and request_id=_request for update;
  if _old.id is not null then
    select * into _learning from shk_private.session_learning where session_id=_old.id and user_id=_user;
    if _old.source_session_id is not null or _old.topic is distinct from _topic
      or(_learning.session_id is not null and(_learning.kind<>_kind or _learning.selection<>_normalized))
      or(_learning.session_id is null and(_mode<>'practice' or _objective is not null or _field is not null or _answer_format is not null
        or _question is not null or _difficulty is not null or _task_kind is not null or _bank_difficulty is not null)) then
      raise exception 'Vorgangskennung wurde für eine andere Abfrage verwendet.' using errcode='PT409'; end if;
    return shk_private.snapshot(_old.id);
  end if;

  with visible as materialized (
    select q.*,coalesce(m->>'variantId',q.question_id) as variant,
      coalesce(m->>'familyId','legacy-family:'||q.question_id) as family,
      (q.payload->>'kind'='numeric' and coalesce(shk_private.math_static_info(q.question_id,q.version)->>'coverage'='identity_only',false)) as exclusive_static
    from shk_private.visible_questions() q
    cross join lateral(select shk_private.question_metadata(q.question_id,q.version) m) meta
    where(_topic is null or q.topic=_topic or (_mode<>'verification' and coalesce(shk_private.question_assignment(q.question_id,q.version)->'secondaryTopicIds','[]'::jsonb) ? _topic))
      and(_answer_format is null or q.payload->>'kind'=_answer_format or (_answer_format='choice' and shk_private.math_is_choice(q.question_id,q.version)))
      and(_objective is null or m->>'objectiveId'=_objective)
      and(_mode<>'verification' or q.payload->>'kind'<>'self')
      and(_field is null or shk_private.question_learning_fields(q.question_id,q.version) ? _field)
      and (_question is null or (q.question_id=_question and q.version=_question_version))
      and (_difficulty is null or m->'editorialReview'->>'difficultyLevel'=_difficulty::text)
      and (_task_kind is null or m->'editorialReview'->>'taskKind'=_task_kind)
      and (_bank_difficulty is null or q.payload->>'difficulty'=_bank_difficulty)
      and coalesce((m->>'practiceEligible')::boolean,true)
      and shk_private.math_available(q.question_id,q.version)
  ), history as materialized (
    select coalesce(r.external_id,a.question_id) as variant,
      coalesce(r.family_id,'legacy-family:'||a.question_id) as family,a.answered_at as at
    from public.shk_attempts a left join shk_private.question_registry r
      on r.question_id=a.question_id and r.version=a.question_version where a.user_id=_user
    union all
    select coalesce(r.external_id,i.question_id),coalesce(r.family_id,'legacy-family:'||i.question_id),i.started_at
    from public.shk_session_items i left join shk_private.question_registry r
      on r.question_id=i.question_id and r.version=i.question_version
    where i.user_id=_user and i.started_at is not null
  ), candidates as (
    select v.*,(v.variant is not distinct from(select h.variant from history h order by h.at desc,h.variant limit 1)) as immediate_repeat,
      (select max(h.at) from history h where h.variant=v.variant) as variant_seen,
      (select max(h.at) from history h where h.family=v.family) as family_seen from visible v
  ), static_ranked as (
    -- Identity-only static numbers reserve their entire family when issued.
    -- Queueing another such question would make advancing the round impossible.
    select c.*,row_number() over(partition by family,exclusive_static order by immediate_repeat,variant_seen nulls first,random()) as static_family_rank from candidates c
  ), family_ranked as (
    select c.*,row_number() over(partition by family order by immediate_repeat,variant_seen nulls first,random()) as family_rank
    from static_ranked c where not exclusive_static or static_family_rank=1
  ), topic_ranked as (
    select f.*,row_number() over(partition by topic order by family_rank,immediate_repeat,
      (variant_seen is not null),family_seen nulls first,variant_seen nulls first,random()) as topic_rank
    from family_ranked f where _mode<>'verification' or family_rank=1
  ), chosen as (
    select * from topic_ranked order by topic_rank,family_rank,immediate_repeat,
      (variant_seen is not null),family_seen nulls first,variant_seen nulls first,random()
    limit case when _question is not null then 1 when _mode='verification' then 5 when _topic is null then 10 else 5 end
  ) select coalesce(jsonb_agg(jsonb_build_object('questionId',question_id,'version',version)
    order by topic_rank,family_rank,immediate_repeat,(variant_seen is not null),family_seen nulls first,variant_seen nulls first),'[]'::jsonb)
    into _chosen from chosen;
  _count:=jsonb_array_length(_chosen);
  if _mode='verification' and _count<>5 then
    if _answer_format='choice' then
      raise exception 'Für diese Überprüfung fehlen Auswahlfragen aus fünf unterschiedlichen geprüften Aufgabenfamilien.' using errcode='22023'; end if;
    raise exception 'Für diese Überprüfungsrunde fehlen mindestens fünf unterschiedliche, automatisch bewertbare und geprüfte Aufgabenfamilien.' using errcode='22023'; end if;
  if _count=0 then
    if _question is not null then
      raise exception 'Diese Aufgabenfassung ist nicht startbar. Sie ist nicht freigegeben, wird redaktionell geklärt oder ihr Rechenwertebereich ist bereits genutzt. Bestehende Runden bleiben erhalten.' using errcode='22023'; end if;
    if _answer_format='choice' then
      raise exception 'Für diese Auswahl sind aktuell keine weiteren geprüften Auswahlfragen verfügbar.' using errcode='22023'; end if;
    raise exception 'Für diese Auswahl sind noch keine weiteren passenden geprüften Aufgaben oder unbenutzten Rechenwerte verfügbar. Wähle ein anderes Thema; erschöpfte Wertebereiche benötigen neue geprüfte Varianten.' using errcode='22023'; end if;
  insert into public.shk_sessions(user_id,request_id,topic) values(_user,_request,_topic) returning id into _id;
  insert into shk_private.session_learning(session_id,user_id,kind,selection) values(_id,_user,_kind,_normalized);
  insert into public.shk_session_items(session_id,user_id,position,question_id,question_version)
    select _id,_user,ordinality::integer-1,row->>'questionId',(row->>'version')::integer
    from jsonb_array_elements(_chosen) with ordinality item(row,ordinality);
  update public.shk_sessions set total=_count where id=_id;
  update public.shk_session_items set started_at=clock_timestamp() where session_id=_id and position=0;
  return shk_private.snapshot(_id);
end $function$
;

notify pgrst, 'reload schema';
