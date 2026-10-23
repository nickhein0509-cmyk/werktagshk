import { useEffect, useRef, useState } from 'react';
import {
  cloudTopics,
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
import type { CloudLearning, CloudSnapshot, CloudDraft, JsonRecord } from './lib/cloud-practice';

const formats = {
  choice: 'Auswahlfrage',
  numeric: 'Rechenaufgabe',
  short: 'Kurzantwort',
  self: 'Selbstvergleich',
};

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(Date.now());
  const alive = useRef(false);
  const lock = useRef(false);
  const sequence = useRef(0);
  const pending = useRef<{ key: string; operation: string } | null>(null);

  useEffect(() => {
    alive.current = true;
    const generation = ++sequence.current;
    setLearning(null);
    setSnapshot(null);
    setDraft(emptyDraft());
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
  async function begin(selectedTopic: string) {
    const generation = sequence.current;
    const next = parseSnapshot(
      await cloudRpc('shk_begin_learning', {
        _selection: { mode: 'practice', ...(selectedTopic ? { topic: selectedTopic } : {}) },
        _request: operation(`begin:${selectedTopic}`),
      }),
    );
    if (!alive.current || sequence.current !== generation) return;
    pending.current = null;
    accept(next);
    await refreshLearning();
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
  const catalog =
    (learning ? latestCatalog(learning.catalog) : []).filter(
      (q) =>
        (!topic || q.topic === topic) &&
        `${q.title} ${q.id}`.toLocaleLowerCase('de').includes(query.toLocaleLowerCase('de')),
    ) ?? [];
  const q = snapshot?.question;
  const feedbackLabels: Record<string, string> = {
    correct: 'Richtig',
    partial: 'Teilweise richtig',
    incorrect: 'Noch nicht richtig',
    unknown: 'Nicht beantwortet',
    self: 'Selbstvergleich gespeichert',
  };

  return (
    <section className="cloud-practice" aria-label="Privater Fragenbestand">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DEIN BESTEHENDER FRAGENBESTAND</p>
          <h1>
            Meine Aufgaben<span>.</span>
          </h1>
          <p>
            Deine bisherigen Fragen und Lernrunden bleiben im privaten Konto erhalten. Die neuen
            Modellaufgaben findest du zusätzlich in der Lernwerkstatt.
          </p>
        </div>
      </div>
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
              Fragen durchsuchen
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => void action(() => begin(topic))}
            >
              {topic ? 'Themenrunde starten' : 'Gemischte Runde starten'}
            </button>
          </div>
          <p>
            Die Auswahl erfolgt aus den für dich verfügbaren Fragen: bis zu fünf je Thema oder zehn
            in einer gemischten Runde. Ausgeschlossene Fassungen bleiben im Verzeichnis sichtbar.
          </p>
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
            <section className="cloud-round" aria-label="Laufende Lernrunde">
              <div className="section-heading">
                <h2>
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
                      {formats[q.kind]} · Fassung {q.version}
                    </p>
                    <p className="cloud-preformatted">{q.prompt}</p>
                    <QuestionFigures
                      key={`${snapshot.id}:${snapshot.position}`}
                      figures={q.figures}
                      onReady={setFiguresReady}
                    />
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
            <div className="exercise-grid">
              {catalog.slice(0, limit).map((entry) => (
                <article key={`${entry.id}:${entry.version}`} className="exercise-card">
                  <h3>{entry.title}</h3>
                  <p>
                    {cloudTopics[entry.topic] ?? entry.topic} · {formats[entry.kind]} · Fassung{' '}
                    {entry.version}
                  </p>
                  <p>
                    {entry.excludedReason
                      ? `Derzeit ausgeschlossen: ${entry.excludedReason}`
                      : entry.active
                        ? entry.reviewStatus === 'checked'
                          ? 'Aktive geprüfte Fassung'
                          : 'Aktive Fassung · Prüfung offen'
                        : 'Frühere Fassung'}
                  </p>
                </article>
              ))}
            </div>
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
