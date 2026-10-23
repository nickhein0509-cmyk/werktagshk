import { useEffect, useRef, useState } from 'react';
import {
  cloudTopics,
  cloudDifficultyLabels,
  cloudDemandLabels,
  compareEditorialDifficulty,
  latestCatalog,
  cloudRpc,
  parseLearning,
  parseSnapshot,
  permitted,
  buildAnswer,
  emptyDraft,
  draftFromSnapshot,
  record,
} from './lib/cloud-practice';
import type {
  CloudLearning,
  CloudSnapshot,
  CloudDraft,
  JsonRecord,
  CloudDifficulty,
  CloudEditorialReview,
  CatalogQuestion,
} from './lib/cloud-practice';
import { difficultyLevels } from './lib/difficulty';
import { CalculationWorkspace, emptyWorkpad } from './components/CalculationWorkspace';
import type { WorkpadDraft } from './components/CalculationWorkspace';

const formats = {
  choice: 'Auswahlfrage',
  numeric: 'Zahleneingabe',
  short: 'Kurzantwort',
  self: 'Selbstvergleich',
};

type DirectoryKind = 'all' | CloudEditorialReview['taskKind'] | 'unknown';
type LevelFilter = 'all' | CloudEditorialReview['difficultyLevel'] | 'unknown';
const taskKinds = {
  calculation: 'Rechenaufgabe',
  context: 'Kontextaufgabe',
  knowledge: 'Wissensfrage',
};
function taskLabel(kind: keyof typeof formats, review?: CloudEditorialReview) {
  return `${review ? taskKinds[review.taskKind] : 'Aufgabenart offen'} · ${formats[kind]}`;
}
function levelLabel(review?: CloudEditorialReview) {
  const level = difficultyLevels.find((entry) => entry.id === review?.difficultyLevel);
  return level ? `Stufe ${level.id} · ${level.label}` : 'Stufe noch nicht eingestuft';
}
function unavailableReason(entry: CatalogQuestion) {
  if (entry.excludedReason) return `Derzeit ausgeschlossen: ${entry.excludedReason}`;
  if (!entry.active) return 'Diese Fassung ist nicht mehr aktiv.';
  if (entry.editorialReview?.practiceEligible === false)
    return 'Diese Fassung ist noch nicht zum Üben freigegeben.';
  if (entry.reviewStatus !== 'checked') return 'Die Prüfung dieser Fassung ist noch offen.';
  return '';
}

function SolutionText({ data }: { data: JsonRecord }) {
  function render(value: unknown): string {
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(render).filter(Boolean).join('\n');
    if (record(value))
      return ['text', 'label', 'description', 'criterion', 'answer']
        .map((k) => render(value[k]))
        .filter(Boolean)
        .join('\n');
    return '';
  }
  return (
    <>
      {['model', 'explanation', 'criteria', 'message'].map((key) => {
        const text = render(data[key]);
        return text ? (
          <p key={key} className="cloud-preformatted">
            {text}
          </p>
        ) : null;
      })}
    </>
  );
}

function QuestionFigures({
  figures,
  onReady,
}: {
  figures: JsonRecord[];
  onReady: (ready: boolean) => void;
}) {
  const [images, setImages] = useState<{ src: string; alt: string; caption: string }[]>([]);
  const [error, setError] = useState('');
  const descriptor = JSON.stringify(figures);
  const loaded = useRef(new Set<number>());
  useEffect(() => {
    let alive = true;
    const content = JSON.parse(descriptor) as JsonRecord[];
    loaded.current.clear();
    setImages([]);
    setError('');
    onReady(content.length === 0);
    if (!content.length) return;
    Promise.all(
      content.map(async (figure) => {
        if (Array.isArray(figure.labels) && figure.labels.length)
          throw new Error(
            'Diese Abbildung benötigt zusätzliche Beschriftungen, die hier noch nicht vollständig dargestellt werden.',
          );
        if (typeof figure.assetId !== 'string')
          throw new Error(
            'Die technische Skizze kann in dieser Ansicht noch nicht dargestellt werden.',
          );
        const asset = await cloudRpc('shk_asset', { _asset: figure.assetId });
        if (
          !record(asset) ||
          typeof asset.contentType !== 'string' ||
          !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(asset.contentType) ||
          typeof asset.base64 !== 'string' ||
          asset.base64.length > 14000000 ||
          !/^[A-Za-z0-9+/=\s]+$/.test(asset.base64)
        )
          throw new Error('Die Abbildung kann nicht sicher dargestellt werden.');
        return {
          src: `data:${asset.contentType};base64,${asset.base64}`,
          alt: typeof figure.alt === 'string' ? figure.alt : 'Abbildung zur Aufgabe',
          caption: typeof figure.caption === 'string' ? figure.caption : '',
        };
      }),
    )
      .then((next) => {
        if (alive) {
          setImages(next);
          setError('');
        }
      })
      .catch((cause: unknown) => {
        if (alive)
          setError(
            cause instanceof Error ? cause.message : 'Die Abbildung konnte nicht geladen werden.',
          );
      });
    return () => {
      alive = false;
    };
  }, [descriptor, onReady]);
  return (
    <>
      {error && (
        <div className="notice warning">
          {error} Ohne vollständige Abbildung bleibt die Antwortabgabe gesperrt. Du kannst die Runde
          neu laden.
        </div>
      )}
      {images.map((image, index) => (
        <figure key={`${descriptor}:${index}`}>
          <img
            src={image.src}
            alt={image.alt}
            style={{ maxWidth: '100%', height: 'auto' }}
            onLoad={() => {
              loaded.current.add(index);
              if (loaded.current.size === images.length) onReady(true);
            }}
            onError={() => {
              onReady(false);
              setError('Die Bilddatei konnte nicht angezeigt werden.');
            }}
          />
          {image.caption && <figcaption>{image.caption}</figcaption>}
        </figure>
      ))}
    </>
  );
}

export function CloudPractice({ userId }: { userId: string }) {
  const [learning, setLearning] = useState<CloudLearning | null>(null);
  const [snapshot, setSnapshot] = useState<CloudSnapshot | null>(null);
  const [draft, setDraft] = useState<CloudDraft>(emptyDraft);
  const [figuresReady, setFiguresReady] = useState(false);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(100);
  const [topic, setTopic] = useState('');
  const [kindFilter, setKindFilter] = useState<DirectoryKind>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<LevelFilter>('all');
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState<
    CloudDifficulty | 'all' | 'unknown'
  >('all');
  const [difficultyOrder, setDifficultyOrder] = useState<'source' | 'asc' | 'desc'>('asc');
  const [workpads, setWorkpads] = useState<Record<string, WorkpadDraft>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(Date.now());
  const alive = useRef(false);
  const lock = useRef(false);
  const sequence = useRef(0);
  const pending = useRef<{ key: string; operation: string } | null>(null);
  const roundHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    alive.current = true;
    const generation = ++sequence.current;
    setLearning(null);
    setSnapshot(null);
    setDraft(emptyDraft());
    setWorkpads({});
    setError('');
    setBusy(true);
    lock.current = true;
    cloudRpc('shk_learning_data')
      .then(parseLearning)
      .then((data) => {
        if (alive.current && sequence.current === generation) setLearning(data);
      })
      .catch((cause: unknown) => {
        if (alive.current && sequence.current === generation)
          setError(
            cause instanceof Error ? cause.message : 'Der Bestand konnte nicht geladen werden.',
          );
      })
      .finally(() => {
        if (alive.current && sequence.current === generation) {
          setBusy(false);
          lock.current = false;
        }
      });
    return () => {
      alive.current = false;
      sequence.current++;
      lock.current = false;
    };
  }, [userId]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    let cancelled = false;
    let refreshing = false;
    const id = snapshot.id;
    const position = snapshot.position;
    const revision = snapshot.revision;
    const generation = sequence.current;
    const timer = window.setInterval(() => {
      if (refreshing || lock.current) return;
      refreshing = true;
      cloudRpc('shk_session_policy', { _session: id })
        .then((policy) => {
          if (!record(policy)) throw new Error('Die Freigabe konnte nicht geprüft werden.');
          if (!cancelled && alive.current && generation === sequence.current)
            setSnapshot((current) =>
              current?.id === id && current.position === position && current.revision === revision
                ? { ...current, policy }
                : current,
            );
        })
        .catch(() => {
          if (!cancelled && alive.current && generation === sequence.current)
            setSnapshot((current) =>
              current?.id === id && current.position === position && current.revision === revision
                ? { ...current, policy: {} }
                : current,
            );
        })
        .finally(() => {
          refreshing = false;
        });
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [snapshot?.id, snapshot?.position, snapshot?.revision, userId]);

  function accept(next: CloudSnapshot, keepDraft = false) {
    setSnapshot(next);
    setNotice('');
    if (!keepDraft) setDraft(draftFromSnapshot(next));
  }
  async function action(work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const generation = sequence.current;
    try {
      await work();
    } catch (cause) {
      if (alive.current && sequence.current === generation)
        setError(
          cause instanceof Error ? cause.message : 'Die Aktion konnte nicht gespeichert werden.',
        );
    } finally {
      if (alive.current && sequence.current === generation) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  async function refreshLearning() {
    const generation = sequence.current;
    const data = parseLearning(await cloudRpc('shk_learning_data'));
    if (alive.current && sequence.current === generation) setLearning(data);
  }
  async function load(id: string, keepDraft = false) {
    const generation = sequence.current;
    const next = parseSnapshot(await cloudRpc('shk_load_session', { _session: id }));
    if (alive.current && sequence.current === generation)
      accept(next, keepDraft && snapshot?.position === next.position && snapshot?.id === next.id);
    return next;
  }
  function operation(key: string) {
    if (pending.current?.key !== key) pending.current = { key, operation: crypto.randomUUID() };
    return pending.current.operation;
  }
  async function begin(selection: JsonRecord) {
    const generation = sequence.current;
    const next = parseSnapshot(
      await cloudRpc('shk_begin_learning', {
        _selection: selection,
        _request: operation(`begin:${JSON.stringify(selection)}`),
      }),
    );
    if (!alive.current || sequence.current !== generation) return;
    pending.current = null;
    accept(next);
    await refreshLearning();
    if (alive.current && sequence.current === generation) roundHeading.current?.focus();
  }
  async function submit(unknown = false) {
    if (!snapshot) return;
    const answer = buildAnswer(snapshot, draft, unknown);
    const generation = sequence.current;
    const next = parseSnapshot(
      await cloudRpc('shk_submit', {
        _session: snapshot.id,
        _position: snapshot.position,
        _answer: answer,
        _revision: snapshot.revision,
        _operation: operation(
          `submit:${snapshot.id}:${snapshot.position}:${JSON.stringify(answer)}`,
        ),
      }),
    );
    if (!alive.current || sequence.current !== generation) return;
    pending.current = null;
    accept(next, true);
    await refreshLearning();
  }
  async function saveDraft() {
    if (!snapshot || snapshot.answerSubmitted) return;
    const generation = sequence.current;
    const next = parseSnapshot(
      await cloudRpc('shk_save_draft', {
        _session: snapshot.id,
        _position: snapshot.position,
        _revision: snapshot.revision,
        _draft: {
          text: draft.text,
          unit: draft.unit,
          selected: draft.selected,
          ...(draft.selfAssessment ? { selfAssessment: draft.selfAssessment } : {}),
        },
      }),
    );
    if (!alive.current || sequence.current !== generation) return;
    accept(next, true);
    setNotice('Entwurf im Konto gespeichert.');
  }
  async function help(kind: 'hint' | 'solution') {
    if (!snapshot) return;
    const original = snapshot;
    const generation = sequence.current;
    const fresh = await load(original.id, true);
    if (!alive.current || sequence.current !== generation) return;
    if (
      fresh.position !== original.position ||
      fresh.revision !== original.revision ||
      fresh.answerSubmitted
    ) {
      throw new Error(
        'Die Runde wurde auf einem anderen Gerät geändert. Prüfe den aktuellen Stand.',
      );
    }
    if (!permitted(fresh, kind === 'hint' ? 'hints' : 'earlySolution'))
      throw new Error('Diese Hilfe ist für die laufende Runde nicht freigegeben.');
    const next = parseSnapshot(
      await cloudRpc('shk_help', { _session: fresh.id, _position: fresh.position, _kind: kind }),
    );
    if (alive.current && sequence.current === generation) accept(next, true);
  }
  async function advance() {
    if (!snapshot) return;
    const generation = sequence.current;
    const next = parseSnapshot(
      await cloudRpc('shk_advance', { _session: snapshot.id, _position: snapshot.position }),
    );
    if (!alive.current || sequence.current !== generation) return;
    accept(next);
    await refreshLearning();
  }
  const allCatalog = learning ? latestCatalog(learning.catalog) : [];
  const filteredCatalog = allCatalog.filter(
    (q) =>
      (!topic || q.topic === topic) &&
      (kindFilter === 'all' ||
        (kindFilter === 'unknown'
          ? !q.editorialReview
          : q.editorialReview?.taskKind === kindFilter)) &&
      (difficultyFilter === 'all' ||
        (difficultyFilter === 'unknown'
          ? !q.editorialReview
          : q.editorialReview?.difficultyLevel === difficultyFilter)) &&
      (bankDifficultyFilter === 'all' ||
        (bankDifficultyFilter === 'unknown'
          ? !q.difficulty
          : q.difficulty === bankDifficultyFilter)),
  );
  const catalog = filteredCatalog
    .filter((entry) =>
      `${entry.title} ${entry.id}`.toLocaleLowerCase('de').includes(query.toLocaleLowerCase('de')),
    )
    .sort((a, b) =>
      difficultyOrder === 'source' ? 0 : compareEditorialDifficulty(a, b, difficultyOrder),
    );
  const unknownSelection =
    difficultyFilter === 'unknown' ||
    kindFilter === 'unknown' ||
    bankDifficultyFilter === 'unknown';
  const roundUnavailable = unknownSelection
    ? 'Ohne Einstufung ist nur der direkte Aufgabenstart verfügbar.'
    : !filteredCatalog.some((entry) => !unavailableReason(entry))
      ? 'Für diese Rundenauswahl ist aktuell keine Aufgabe zum Üben verfügbar.'
      : '';
  const roundSelection: JsonRecord = {
    mode: 'practice',
    ...(topic ? { topic } : {}),
    ...(typeof difficultyFilter === 'number' ? { difficultyLevel: difficultyFilter } : {}),
    ...(kindFilter !== 'all' && kindFilter !== 'unknown' ? { taskKind: kindFilter } : {}),
    ...(bankDifficultyFilter === 'basic' || bankDifficultyFilter === 'applied'
      ? { bankDifficulty: bankDifficultyFilter }
      : {}),
  };
  const difficultyCounts = {
    basic: allCatalog.filter((entry) => entry.difficulty === 'basic').length,
    applied: allCatalog.filter((entry) => entry.difficulty === 'applied').length,
    unknown: allCatalog.filter((entry) => !entry.difficulty).length,
  };
  const topicCounts = Object.entries(
    allCatalog.reduce<Record<string, number>>((counts, entry) => {
      counts[entry.topic] = (counts[entry.topic] ?? 0) + 1;
      return counts;
    }, {}),
  );
  const q = snapshot?.question;
  const questionCatalogEntry = q
    ? learning?.catalog.find((entry) => entry.id === q.id && entry.version === q.version)
    : undefined;
  const questionDifficulty = q?.difficulty ?? questionCatalogEntry?.difficulty;
  const questionDemand = q?.demand ?? questionCatalogEntry?.demand;
  const questionReview = q?.editorialReview ?? questionCatalogEntry?.editorialReview;
  const calculationQuestion =
    questionReview?.taskKind === 'calculation' || (!questionReview && q?.kind === 'numeric');
  const workpadKey =
    snapshot && q ? `${userId}:${snapshot.id}:${snapshot.position}:${q.id}:${q.version}` : '';
  const workpad = workpads[workpadKey] ?? emptyWorkpad();
  const workpadAllowed = snapshot && permitted(snapshot, 'hints', now);
  function updateWorkpad(next: WorkpadDraft) {
    setWorkpads((current) => ({ ...current, [workpadKey]: next }));
  }
  const feedbackLabels: Record<string, string> = {
    correct: 'Richtig',
    partial: 'Teilweise richtig',
    incorrect: 'Noch nicht richtig',
    unknown: 'Nicht beantwortet',
    self: 'Selbstvergleich gespeichert',
  };

  return (
    <section className="cloud-practice" aria-label="Privater Fragenbestand">
      <div className="cloud-actions">
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => void action(refreshLearning)}
        >
          Bestand neu laden
        </button>
        {busy && <span role="status">Wird geladen …</span>}
      </div>
      {notice && <p role="status">{notice}</p>}
      {error && (
        <div className="notice warning" role="alert">
          {error} Deine bisherige Eingabe bleibt hier erhalten. Lade die Runde neu, um den
          gespeicherten Stand zu prüfen.
        </div>
      )}
      {learning && (
        <>
          <p>
            {learning.catalog.length} Aufgabenfassungen im Konto ·{' '}
            {new Set(learning.catalog.map((entry) => entry.id)).size} Aufgaben ·{' '}
            {learning.rounds.length} gespeicherte Runden
          </p>
          <details className="cloud-catalog-summary">
            <summary>Bestand einordnen · {allCatalog.length} aktuelle Aufgaben</summary>
            <p className="cloud-native-scale">
              Gespeicherte Schwierigkeit: {difficultyCounts.basic} Basis ·{' '}
              {difficultyCounts.applied} Anwendung · {difficultyCounts.unknown} noch nicht
              eingestuft.
            </p>
            <p>
              Die vier Stufen beschreiben den redaktionell geprüften Denkweg der jeweiligen Aufgabe.
              Die bisherigen Kategorien Basis und Anwendung bleiben zusätzlich erhalten. Keine der
              Einstufungen misst dein persönliches Können oder deine Prüfungsreife.
            </p>
            <p>
              „Beleg/Präzisierung offen“ kennzeichnet offene Punkte beim Einzelreview. Die
              Einstufung einer Aufgabe ist keine Freigabe der gesamten Quelle.
            </p>
            <dl className="cloud-topic-counts" aria-label="Themenverteilung im geladenen Bestand">
              {topicCounts.map(([id, count]) => (
                <div key={id}>
                  <dt>{cloudTopics[id] ?? id}</dt>
                  <dd>{count}</dd>
                </div>
              ))}
            </dl>
          </details>
          <div className="cloud-actions">
            <label>
              Thema
              <select value={topic} onChange={(event) => setTopic(event.target.value)}>
                <option value="">Alle Themen</option>
                {Object.entries(cloudTopics).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Stufe
              <select
                value={difficultyFilter}
                onChange={(event) => {
                  const value = event.target.value;
                  setDifficultyFilter(
                    value === 'all' || value === 'unknown'
                      ? value
                      : (Number(value) as 1 | 2 | 3 | 4),
                  );
                  setLimit(100);
                }}
              >
                <option value="all">Alle Stufen</option>
                {difficultyLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    Stufe {level.id} · {level.label}
                  </option>
                ))}
                <option value="unknown">Noch nicht eingestuft</option>
              </select>
            </label>
            <label>
              Verzeichnis sortieren
              <select
                value={difficultyOrder}
                onChange={(event) => {
                  setDifficultyOrder(event.target.value as 'source' | 'asc' | 'desc');
                  setLimit(100);
                }}
              >
                <option value="source">Bestandsreihenfolge</option>
                <option value="asc">Stufe 1 bis 4</option>
                <option value="desc">Stufe 4 bis 1</option>
              </select>
            </label>
            <label>
              Aufgabenart
              <select
                value={kindFilter}
                onChange={(event) => {
                  setKindFilter(event.target.value as DirectoryKind);
                  setLimit(100);
                }}
              >
                <option value="all">Alle Aufgabenarten</option>
                <option value="calculation">Rechenaufgaben</option>
                <option value="context">Kontextaufgaben</option>
                <option value="knowledge">Wissensfragen</option>
                <option value="unknown">Noch nicht eingestuft</option>
              </select>
            </label>
            <label>
              Fragen durchsuchen
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
          <details className="cloud-native-options">
            <summary>Zusätzliche Bestandskategorie</summary>
            <label>
              Bestandseinstufung
              <select
                value={bankDifficultyFilter}
                onChange={(event) => {
                  setBankDifficultyFilter(
                    event.target.value as CloudDifficulty | 'all' | 'unknown',
                  );
                  setLimit(100);
                }}
              >
                <option value="all">Alle Bestandskategorien</option>
                <option value="basic">Basis · Bestand</option>
                <option value="applied">Anwendung · Bestand</option>
                <option value="unknown">Noch nicht eingestuft</option>
              </select>
            </label>
          </details>
          <div className="cloud-round-start">
            <button
              className="button primary"
              disabled={busy || Boolean(roundUnavailable)}
              aria-describedby="cloud-round-selection-note"
              onClick={() => void action(() => begin(roundSelection))}
            >
              Gefilterte Runde starten
            </button>
            <p id="cloud-round-selection-note" className="cloud-directory-note">
              {roundUnavailable ||
                'Thema, Stufe, Aufgabenart und Bestandskategorie bestimmen die neue Runde. Suche und Sortierung ordnen nur das Verzeichnis.'}{' '}
              Bis zu fünf Aufgaben je Thema oder zehn in einer gemischten Runde.
            </p>
          </div>
          {learning.rounds.some((round) => !round.completed) && (
            <section aria-label="Offene Lernrunden">
              <h2>Weiterlernen</h2>
              <div className="cloud-actions">
                {learning.rounds
                  .filter((round) => !round.completed)
                  .slice()
                  .reverse()
                  .map((round) => (
                    <button
                      key={round.id}
                      className="button secondary"
                      disabled={busy}
                      onClick={() => void action(() => load(round.id).then(() => undefined))}
                    >
                      {cloudTopics[round.topic ?? ''] ?? 'Gemischte Runde'} ·{' '}
                      {round.attemptIds.length} Antworten · fortsetzen
                    </button>
                  ))}
              </div>
            </section>
          )}
          {snapshot && (
            <section
              className={`cloud-round ${calculationQuestion ? 'cloud-round-calculation' : ''}`}
              aria-label="Laufende Lernrunde"
            >
              <div className="section-heading">
                <h2 ref={roundHeading} tabIndex={-1}>
                  {snapshot.completed
                    ? 'Runde abgeschlossen'
                    : `Aufgabe ${snapshot.position + 1} von ${snapshot.total}`}
                </h2>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => void action(() => load(snapshot.id, true).then(() => undefined))}
                >
                  Runde neu laden
                </button>
              </div>
              {snapshot.completed ? (
                <p>
                  Deine Antworten sind in deinem Konto gespeichert. Du kannst eine neue Runde
                  starten.
                </p>
              ) : (
                q && (
                  <>
                    <h3>{q.title}</h3>
                    <p>
                      {taskLabel(q.kind, questionReview)} · Fassung {q.version}
                    </p>
                    <p className="cloud-editorial-label">
                      {levelLabel(questionReview)}
                      {questionReview && questionReview.status !== 'supported' && (
                        <span> · Beleg/Präzisierung offen</span>
                      )}
                    </p>
                    {!questionReview && (
                      <p className="cloud-difficulty-label">
                        Bestandsschwierigkeit:{' '}
                        {questionDifficulty
                          ? cloudDifficultyLabels[questionDifficulty]
                          : 'Noch nicht eingestuft'}
                        {questionDemand && (
                          <span> · Anforderungszuordnung: {cloudDemandLabels[questionDemand]}</span>
                        )}
                      </p>
                    )}
                    {questionReview?.status === 'qualified' && (
                      <p className="cloud-review-note">
                        Einzelne Quellen- oder Bildbelege sind noch offen. Die Bewertung dieser
                        Angaben steht unter Vorbehalt.
                      </p>
                    )}
                    <p className="cloud-preformatted">{q.prompt}</p>
                    <QuestionFigures
                      key={`${snapshot.id}:${snapshot.position}`}
                      figures={q.figures}
                      onReady={setFiguresReady}
                    />
                    {workpadAllowed && (
                      <div className="cloud-workpad">
                        {calculationQuestion ? (
                          <CalculationWorkspace draft={workpad} onChange={updateWorkpad} />
                        ) : (
                          <label className="cloud-context-notes">
                            Eigene Notizen
                            <textarea
                              value={workpad.notes}
                              maxLength={15000}
                              onChange={(event) =>
                                updateWorkpad({ ...workpad, notes: event.target.value })
                              }
                            />
                          </label>
                        )}
                        <p className="cloud-workpad-note">
                          Rechenblatt und Notizen bleiben nur in dieser geöffneten Ansicht und
                          werden nicht im Konto gespeichert. Trage deine Antwort unten ein.
                        </p>
                      </div>
                    )}
                    {!workpadAllowed && calculationQuestion && (
                      <p className="cloud-workpad-note">
                        Rechenblatt und eingebauter Taschenrechner sind für diese Runde gerade nicht
                        freigegeben. Nutze deinen eigenen Taschenrechner.
                      </p>
                    )}
                    <fieldset disabled={busy || snapshot.answerSubmitted}>
                      <legend>Deine Antwort</legend>
                      {q.kind === 'choice' ? (
                        q.options.map((option) => (
                          <label key={option.id} className="cloud-option">
                            <input
                              type={q.multiple ? 'checkbox' : 'radio'}
                              name="cloud-answer"
                              value={option.id}
                              checked={draft.selected.includes(option.id)}
                              onChange={(event) =>
                                setDraft({
                                  ...draft,
                                  selected: q.multiple
                                    ? event.target.checked
                                      ? [...draft.selected, option.id]
                                      : draft.selected.filter((id) => id !== option.id)
                                    : [option.id],
                                })
                              }
                            />
                            {option.label}
                          </label>
                        ))
                      ) : (
                        <label>
                          {q.kind === 'numeric' ? 'Rechenergebnis' : 'Deine Erklärung'}
                          <textarea
                            aria-label={q.kind === 'numeric' ? 'Rechenergebnis' : 'Deine Erklärung'}
                            value={draft.text}
                            maxLength={15000}
                            onChange={(event) => setDraft({ ...draft, text: event.target.value })}
                          />
                        </label>
                      )}
                      {q.kind === 'numeric' && (
                        <label>
                          Einheit
                          <input
                            value={draft.unit}
                            maxLength={100}
                            onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
                          />
                        </label>
                      )}
                      {q.kind === 'self' && (
                        <label>
                          Selbstvergleich nach der Musterlösung
                          <select
                            value={draft.selfAssessment}
                            disabled={!snapshot.solutionViewed}
                            onChange={(event) =>
                              setDraft({ ...draft, selfAssessment: event.target.value })
                            }
                          >
                            <option value="">Bitte wählen</option>
                            <option value="correct">Meine Antwort stimmt überein</option>
                            <option value="partial">Meine Antwort stimmt teilweise überein</option>
                            <option value="incorrect">
                              Meine Antwort stimmt noch nicht überein
                            </option>
                          </select>
                        </label>
                      )}
                    </fieldset>
                    {!snapshot.answerSubmitted && (
                      <p>
                        Speichere deinen Entwurf, bevor du diese Ansicht verlässt. Erst „Antwort
                        abgeben“ bewertet deine Antwort.
                      </p>
                    )}
                    {!snapshot.answerSubmitted && (
                      <div className="cloud-actions">
                        <button
                          className="button secondary"
                          disabled={busy}
                          onClick={() => void action(saveDraft)}
                        >
                          Entwurf speichern
                        </button>
                        <button
                          className="button primary"
                          disabled={busy || (q.figures.length > 0 && !figuresReady)}
                          onClick={() => void action(() => submit())}
                        >
                          Antwort abgeben
                        </button>
                        <button
                          className="button secondary"
                          disabled={busy}
                          onClick={() => void action(() => submit(true))}
                        >
                          Weiß ich noch nicht
                        </button>
                        {snapshot.policy.hints === true && (
                          <button
                            className="button secondary"
                            disabled={busy}
                            onClick={() => void action(() => help('hint'))}
                          >
                            Hinweis öffnen
                          </button>
                        )}
                        {snapshot.policy.earlySolution === true && (
                          <button
                            className="button secondary"
                            disabled={busy}
                            onClick={() => void action(() => help('solution'))}
                          >
                            Musterlösung öffnen
                          </button>
                        )}
                      </div>
                    )}
                    {snapshot.hint && permitted(snapshot, 'hints', now) && (
                      <div className="notice">
                        <p className="cloud-preformatted">{snapshot.hint}</p>
                      </div>
                    )}
                    {snapshot.solution &&
                      (permitted(snapshot, 'earlySolution', now) ||
                        (snapshot.answerSubmitted && permitted(snapshot, 'feedback', now))) && (
                        <section className="cloud-solution">
                          <h3>Musterlösung</h3>
                          <SolutionText data={snapshot.solution} />
                        </section>
                      )}
                    {snapshot.answerSubmitted && (
                      <>
                        <div role="status">
                          <h3>
                            {snapshot.feedback && permitted(snapshot, 'feedback', now)
                              ? q.kind === 'self' || snapshot.feedback.method === 'self'
                                ? 'Selbstvergleich gespeichert'
                                : (feedbackLabels[String(snapshot.feedback.outcome)] ??
                                  'Antwort gespeichert')
                              : 'Antwort gespeichert'}
                          </h3>
                          {snapshot.feedback && permitted(snapshot, 'feedback', now) && (
                            <SolutionText data={snapshot.feedback} />
                          )}
                        </div>
                        <button
                          className="button primary"
                          disabled={busy}
                          onClick={() => void action(advance)}
                        >
                          {snapshot.position + 1 >= snapshot.total
                            ? 'Runde abschließen'
                            : 'Nächste Aufgabe'}
                        </button>
                      </>
                    )}
                    {(snapshot.hint || snapshot.solution || snapshot.feedback) &&
                      !permitted(snapshot, 'feedback', now) &&
                      !permitted(snapshot, 'earlySolution', now) &&
                      !permitted(snapshot, 'hints', now) && (
                        <p>Die Freigabe der Hilfen wird beim Neuladen der Runde erneut geprüft.</p>
                      )}
                  </>
                )
              )}
            </section>
          )}
          <section aria-label="Aufgabenverzeichnis">
            <h2>Aufgabenverzeichnis ({catalog.length})</h2>
            <p className="cloud-directory-note">
              Aufgabenart und Stufe folgen dem Einzelreview. Das Antwortformat steht zusätzlich
              dabei; auch eine Auswahlfrage kann eine Rechenaufgabe sein.
            </p>
            <div className="cloud-directory">
              {catalog.slice(0, limit).map((entry) => (
                <article key={`${entry.id}:${entry.version}`} className="cloud-directory-entry">
                  <h3>{entry.title}</h3>
                  <p>
                    {cloudTopics[entry.topic] ?? entry.topic} ·{' '}
                    {taskLabel(entry.kind, entry.editorialReview)} · Fassung {entry.version}
                  </p>
                  <p className="cloud-editorial-label">
                    {levelLabel(entry.editorialReview)}
                    {entry.editorialReview && entry.editorialReview.status !== 'supported' && (
                      <span> · Beleg/Präzisierung offen</span>
                    )}
                  </p>
                  {!entry.editorialReview && (
                    <p className="cloud-difficulty-label">
                      Bestandsschwierigkeit:{' '}
                      {entry.difficulty
                        ? cloudDifficultyLabels[entry.difficulty]
                        : 'Noch nicht eingestuft'}
                      {entry.demand && (
                        <span> · Anforderungszuordnung: {cloudDemandLabels[entry.demand]}</span>
                      )}
                    </p>
                  )}
                  <p>{unavailableReason(entry) || 'Aktive Fassung'}</p>
                  <button
                    className="button secondary cloud-question-start"
                    disabled={busy || Boolean(unavailableReason(entry))}
                    aria-label={`Aufgabe üben: ${entry.title}`}
                    onClick={() =>
                      void action(() =>
                        begin({
                          mode: 'practice',
                          questionId: entry.id,
                          questionVersion: entry.version,
                          topic: entry.topic,
                        }),
                      )
                    }
                  >
                    Aufgabe üben
                  </button>
                </article>
              ))}
            </div>
            {catalog.length === 0 && <p>Keine Aufgaben für diese Filter gefunden.</p>}
            {catalog.length > limit && (
              <button
                className="button secondary"
                onClick={() => setLimit((current) => current + 100)}
              >
                Weitere Aufgaben anzeigen
              </button>
            )}
          </section>
        </>
      )}
    </section>
  );
}
