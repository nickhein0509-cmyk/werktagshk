import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cloudRpc, cloudTopics } from '../lib/cloud-practice';
import {
  filterKnowledge,
  knowledgeAllowed,
  parseKnowledgeCatalog,
  parseKnowledgeReading,
} from '../lib/cloud-knowledge';
import type {
  KnowledgeCatalog,
  KnowledgeItem,
  KnowledgeKind,
  KnowledgeLink,
  KnowledgeReading,
} from '../lib/cloud-knowledge';

const kindLabel = (kind: KnowledgeKind) => (kind === 'article' ? 'Fachartikel' : 'Begriff');
const keyOf = (item: KnowledgeLink) => `${item.kind}:${item.id}:${item.version}`;

function Paragraphs({ text, formula = false }: { text: string; formula?: boolean }) {
  const blocks: { heading: boolean; text: string }[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ heading: false, text: paragraph.join('\n') });
    paragraph = [];
  };
  for (const line of text.split('\n')) {
    const heading = /^#{1,6}\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      blocks.push({ heading: true, text: heading[1] });
    } else if (!line.trim()) flush();
    else paragraph.push(line);
  }
  flush();
  return blocks.map((block, index) =>
    block.heading ? (
      formula ? (
        <h5 key={index}>{block.text}</h5>
      ) : (
        <h4 key={index}>{block.text}</h4>
      )
    ) : (
      <p className="knowledge-text" key={index}>
        {block.text}
      </p>
    ),
  );
}

export function CloudKnowledge({
  userId,
  active,
  onQuestions,
  onRead,
}: {
  userId: string;
  active: boolean;
  onQuestions: () => void;
  onRead: () => void;
}) {
  const [catalog, setCatalog] = useState<KnowledgeCatalog | null>(null);
  const [reading, setReading] = useState<{
    data: KnowledgeReading;
    maskedAtOpen: boolean;
  } | null>(null);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('');
  const [kind, setKind] = useState<'all' | KnowledgeKind>('all');
  const [field, setField] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [focusRequest, setFocusRequest] = useState<{
    target: 'reader' | 'list';
    key: string;
  } | null>(null);
  const sequence = useRef(0);
  const readSequence = useRef(0);
  const catalogSequence = useRef(0);
  const locked = useRef(false);
  const pending = useRef<{ key: string; request: string } | null>(null);
  const readerHeading = useRef<HTMLHeadingElement>(null);
  const listHeading = useRef<HTMLHeadingElement>(null);
  const itemButtons = useRef(new Map<string, HTMLButtonElement>());
  const lastItem = useRef('');

  useLayoutEffect(() => {
    if (!focusRequest) return;
    if (focusRequest.target === 'reader') readerHeading.current?.focus();
    else {
      const button = itemButtons.current.get(focusRequest.key);
      if (button) button.focus();
      else listHeading.current?.focus();
    }
  }, [focusRequest]);

  async function fetchCatalog(generation: number) {
    const request = ++catalogSequence.current;
    let next: KnowledgeCatalog;
    try {
      next = parseKnowledgeCatalog(await cloudRpc('shk_knowledge_catalog', { _filter: {} }));
      if (!knowledgeAllowed(next.policy))
        throw new Error('Nachschlagen ist gerade nicht freigegeben. Bitte erneut laden.');
    } catch (cause) {
      if (generation !== sequence.current || request !== catalogSequence.current) return null;
      throw cause;
    }
    if (generation !== sequence.current || request !== catalogSequence.current) return null;
    setCatalog(next);
    setReading((current) => {
      if (!current) return null;
      const item = next.items.find(
        (entry) => entry.id === current.data.entry.id && entry.kind === current.data.entry.kind,
      );
      if (
        current.data.policy.epoch !== next.policy.epoch ||
        !item ||
        (!current.maskedAtOpen && item.masked)
      )
        return null;
      return { ...current, data: { ...current.data, policy: next.policy } };
    });
    return next;
  }

  useEffect(() => {
    const generation = ++sequence.current;
    readSequence.current++;
    pending.current = null;
    locked.current = false;
    setCatalog(null);
    setReading(null);
    setError('');
    setNotice('');
    setBusy(active);
    if (!active) return;
    let refreshing = false;
    async function refresh(initial = false) {
      if (refreshing || locked.current) return;
      refreshing = true;
      try {
        const current = await fetchCatalog(generation);
        if (!current) return;
        if (generation === sequence.current) setError('');
      } catch (cause) {
        if (generation === sequence.current) {
          setCatalog(null);
          setReading(null);
          setError(
            cause instanceof Error ? cause.message : 'Fachwissen ist gerade nicht verfügbar.',
          );
        }
      } finally {
        refreshing = false;
        if (initial && generation === sequence.current) setBusy(false);
      }
    }
    void refresh(true);
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden' && document.hasFocus()) void refresh();
    }, 3000);
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    function leave() {
      readSequence.current++;
      catalogSequence.current++;
      locked.current = false;
      setBusy(false);
      setReading(null);
      setCatalog(null);
      setNotice('Nach einem Fensterwechsel öffnest du den Eintrag bei Bedarf erneut.');
    }
    function focus() {
      if (document.visibilityState !== 'hidden') void refresh();
    }
    function visibility() {
      if (document.visibilityState === 'hidden') leave();
      else focus();
    }
    window.addEventListener('blur', leave);
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      sequence.current++;
      readSequence.current++;
      catalogSequence.current++;
      locked.current = false;
      window.clearInterval(timer);
      window.clearInterval(clock);
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', focus);
      document.removeEventListener('visibilitychange', visibility);
    };
    // The account and visible section define the lifetime of all private content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, active]);

  const allowed = active && knowledgeAllowed(catalog?.policy, now);
  useEffect(() => {
    if (!allowed) setReading(null);
  }, [allowed]);

  async function open(item: KnowledgeLink) {
    if (locked.current || !allowed) return;
    locked.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    setReading(null);
    const generation = sequence.current;
    const readGeneration = ++readSequence.current;
    const key = keyOf(item);
    const maskedWhenRequested = catalog?.items.find(
      (entry) => entry.id === item.id && entry.kind === item.kind,
    )?.masked;
    if (pending.current?.key !== key) pending.current = { key, request: crypto.randomUUID() };
    try {
      const data = parseKnowledgeReading(
        await cloudRpc('shk_knowledge_read', {
          _kind: item.kind,
          _id: item.id,
          _version: item.version,
          _request: pending.current.request,
          _session: null,
          _position: null,
        }),
      );
      if (
        keyOf(data.entry) !== key ||
        !knowledgeAllowed(data.policy) ||
        generation !== sequence.current ||
        readGeneration !== readSequence.current
      )
        throw new Error('Die Freigabe hat sich geändert. Bitte öffne den Eintrag erneut.');
      const current = await fetchCatalog(generation);
      if (!current) return;
      if (
        generation !== sequence.current ||
        readGeneration !== readSequence.current ||
        !document.hasFocus() ||
        document.visibilityState === 'hidden'
      )
        return;
      if (current.policy.epoch !== data.policy.epoch)
        throw new Error('Die Freigabe hat sich geändert. Bitte öffne den Eintrag erneut.');
      const metadata = current.items.find(
        (entry) => entry.id === item.id && entry.kind === item.kind,
      );
      if (!metadata) throw new Error('Dieser Eintrag ist nicht mehr im freigegebenen Bestand.');
      if (maskedWhenRequested !== true && metadata.masked)
        throw new Error(
          'Eine neue offene Aufgabe ist verknüpft. Bitte öffne den Eintrag erneut bewusst als Hilfe.',
        );
      pending.current = null;
      lastItem.current = key;
      setReading({ data: { ...data, policy: current.policy }, maskedAtOpen: metadata.masked });
      setFocusRequest({ target: 'reader', key });
      onRead();
    } catch (cause) {
      if (generation === sequence.current && readGeneration === readSequence.current) {
        setReading(null);
        setError(
          cause instanceof Error ? cause.message : 'Der Eintrag konnte nicht geöffnet werden.',
        );
      }
    } finally {
      if (generation === sequence.current && readGeneration === readSequence.current) {
        locked.current = false;
        setBusy(false);
      }
    }
  }

  function close() {
    setReading(null);
    setFocusRequest({ target: 'list', key: lastItem.current });
  }

  async function reload() {
    if (locked.current) return;
    const generation = sequence.current;
    setBusy(true);
    setError('');
    try {
      await fetchCatalog(generation);
    } catch (cause) {
      if (generation === sequence.current) {
        setCatalog(null);
        setReading(null);
        setError(cause instanceof Error ? cause.message : 'Bitte versuche es erneut.');
      }
    } finally {
      if (generation === sequence.current) setBusy(false);
    }
  }

  if (!active) return null;
  const entries =
    allowed && catalog ? filterKnowledge(catalog.items, { query, topic, kind, field }) : [];
  const entry =
    allowed && reading && knowledgeAllowed(reading.data.policy, now) ? reading.data.entry : null;
  const selectedField = catalog?.learningFields.find((item) => item.id === field);

  return (
    <section className="cloud-knowledge" aria-label="Privates Fachwissen">
      <p className="knowledge-intro">
        Zusammenhänge verstehen, Begriffe klären und Beispiele nachvollziehen. Das Nachschlagen kann
        bei offenen Aufgaben als Hilfe erfasst werden. Lesen allein zählt nicht als gelöste Aufgabe.
      </p>
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p className="notice warning" role="alert">
          {error}
        </p>
      )}
      {!allowed && (
        <div className="knowledge-unavailable">
          <p>
            {busy
              ? 'Dein Fachwissen wird geladen …'
              : 'Die Freigabe für Fachwissen wird geprüft. Im Prüfungsmodus können Lernhilfen gesperrt sein.'}
          </p>
          <button className="button secondary" disabled={busy} onClick={() => void reload()}>
            Fachwissen neu laden
          </button>
        </div>
      )}
      {entry ? (
        <article className="knowledge-reader">
          <button className="text-button" onClick={close}>
            ← Zur Wissensübersicht
          </button>
          <p className="eyebrow">
            {kindLabel(entry.kind)} · Fassung {entry.version}
          </p>
          <h2 ref={readerHeading} tabIndex={-1}>
            {entry.title}
          </h2>
          <p className="knowledge-summary">{entry.summary}</p>
          <section>
            <h3>Zusammenhang und Anwendung</h3>
            <Paragraphs text={entry.details.use} />
          </section>
          {entry.details.formulas.length > 0 && (
            <section>
              <h3>Formeln und Größen</h3>
              {entry.details.formulas.map((formula, index) => (
                <div className="knowledge-formula" key={index}>
                  <h4>{formula.title}</h4>
                  <Paragraphs text={formula.text} formula />
                </div>
              ))}
            </section>
          )}
          {entry.details.example && (
            <section>
              <h3>Durchgearbeitetes Beispiel</h3>
              <Paragraphs text={entry.details.example} />
            </section>
          )}
          {entry.details.distinctions.length > 0 && (
            <section>
              <h3>Wichtige Abgrenzungen</h3>
              <ul>
                {entry.details.distinctions.map((text, index) => (
                  <li key={index}>{text}</li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <h3>Den Denkweg üben</h3>
            <Paragraphs text={entry.details.practice} />
            <button className="button primary" onClick={onQuestions}>
              Fragen im Bestand auswählen
            </button>
          </section>
          {entry.related.length > 0 && (
            <section>
              <h3>Zusammenhängendes Wissen</h3>
              <div className="knowledge-related">
                {entry.related.map((link) => {
                  const target = catalog?.items.find(
                    (item) => item.id === link.id && item.kind === link.kind,
                  );
                  return (
                    <button
                      key={keyOf(link)}
                      className="button secondary"
                      disabled={busy}
                      onClick={() => void open(link)}
                    >
                      {target?.title ?? kindLabel(link.kind)} · Fassung {link.version}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
          <details className="knowledge-sources">
            <summary>Quellen und gespeicherter Prüfstand</summary>
            <p>
              Quellenvermerke gelten für die bezeichneten Stellen. Aktuelle Normen und
              Herstellerunterlagen bleiben für konkrete Anlagen maßgeblich.
            </p>
            {entry.review.checkedAt && (
              <p>Prüfvermerk vom {new Date(entry.review.checkedAt).toLocaleDateString('de-DE')}.</p>
            )}
            <ul>
              {entry.sources.map((source, index) => (
                <li key={index}>
                  {source.document}
                  {source.pdfPage ? ` · PDF-Seite ${source.pdfPage}` : ''}
                  {source.printedPage ? ` · Druckseite ${source.printedPage}` : ''}
                  {source.section ? ` · ${source.section}` : ''}
                  {source.note && <p>Historische Quellennotiz: {source.note}</p>}
                </li>
              ))}
            </ul>
          </details>
        </article>
      ) : allowed && catalog ? (
        <>
          <div className="knowledge-filters">
            <label>
              Suchen
              <input
                type="search"
                aria-label="Fachwissen durchsuchen"
                value={query}
                maxLength={300}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Begriff oder Thema …"
              />
            </label>
            <label>
              Thema
              <select value={topic} onChange={(event) => setTopic(event.target.value)}>
                <option value="">Alle Themen</option>
                {Object.entries(cloudTopics).map(([id, title]) => (
                  <option key={id} value={id}>
                    {title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Inhalt
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as 'all' | KnowledgeKind)}
              >
                <option value="all">Artikel und Begriffe</option>
                <option value="article">Fachartikel</option>
                <option value="term">Begriffe</option>
              </select>
            </label>
            <label>
              Lernfeld
              <select value={field} onChange={(event) => setField(event.target.value)}>
                <option value="">Alle Lernfelder</option>
                {catalog.learningFields.map((item) => (
                  <option key={item.id} value={item.id}>
                    LF {item.number} · {item.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {selectedField?.competencies && (
            <details className="knowledge-field">
              <summary>Was dieses Lernfeld verbindet</summary>
              <Paragraphs text={selectedField.competencies} />
            </details>
          )}
          <h2 ref={listHeading} tabIndex={-1}>
            Wissensübersicht ({entries.length})
          </h2>
          <p className="knowledge-counts">
            {catalog.items.filter((item) => item.kind === 'article').length} Fachartikel ·{' '}
            {catalog.items.filter((item) => item.kind === 'term').length} Begriffe in deinem
            freigegebenen Bestand.
          </p>
          <div className="knowledge-list">
            {entries.map((item: KnowledgeItem) => (
              <div className="knowledge-list-item" key={keyOf(item)}>
                <div>
                  <p className="eyebrow">
                    {kindLabel(item.kind)} ·{' '}
                    {item.topicIds.map((id) => cloudTopics[id] ?? id).join(' / ')}
                  </p>
                  <h3>{item.title}</h3>
                  {item.masked && (
                    <p>
                      Dieser Titel könnte eine offene Aufgabe verraten. Bewusstes Öffnen kann als
                      Hilfe zählen.
                    </p>
                  )}
                </div>
                <button
                  ref={(button) => {
                    if (button) itemButtons.current.set(keyOf(item), button);
                    else itemButtons.current.delete(keyOf(item));
                  }}
                  className="button secondary"
                  disabled={busy}
                  aria-label={`Nachschlagen: ${item.title}`}
                  onClick={() => void open(item)}
                >
                  Nachschlagen
                </button>
              </div>
            ))}
          </div>
          {entries.length === 0 && (
            <p>
              Kein Eintrag passt zu diesen Filtern. Versuche einen anderen Begriff oder wähle ein
              anderes Thema.
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}
