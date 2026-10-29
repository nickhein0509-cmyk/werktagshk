const $ = id => document.getElementById(id);
const labels = { activity: 'Ort / Tätigkeit benennen', workout: 'Training', checkin: 'Tages-Check-in', hydration: 'Trinkmenge', nutrition: 'Ernährung', weight: 'Körpergewicht', planned_event: 'Geplanter Termin', note: 'Notiz', task: 'Aufgabe' };
const sports = { basketball: 'Basketball', calisthenics: 'Calisthenics', skateboarding: 'Skateboard', walking: 'Gehen', running: 'Laufen', cycling: 'Radfahren', other: 'Andere Sportart' };
const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });
const localFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const localTime = iso => iso ? localFormatter.format(new Date(iso)).replace(' ', 'T') : '';
const displayTime = iso => new Date(iso).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export function berlinInputToIso(value, occurrence = 'first') {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Bitte eine gültige Uhrzeit in Berliner Zeit angeben.');
  const naive = Date.parse(value + ':00Z'), matches = [];
  for (const offset of [-180, -120, -60, 0, 60, 120, 180]) {
    const candidate = naive + offset * 60000;
    if (localTime(new Date(candidate).toISOString()) === value) matches.push(candidate);
  }
  matches.sort((a, b) => a - b);
  if (!matches.length) throw new Error('Diese Berliner Uhrzeit gibt es wegen der Zeitumstellung nicht. Bitte korrigieren.');
  return new Date(occurrence === 'second' ? matches.at(-1) : matches[0]).toISOString();
}
const entryFields = {
  activity: ['label', 'startAt', 'endAt', 'segmentRef'],
  workout: ['sport', 'startAt', 'endAt', 'sets', 'reps', 'rpe'],
  checkin: ['energy', 'mood', 'soreness'],
  hydration: ['amountMl', 'at'],
  nutrition: ['energyKcal', 'proteinG', 'carbsG', 'fatG', 'at'],
  weight: ['kg', 'at'],
  planned_event: ['title', 'startAt', 'endAt'],
  note: ['title', 'at'],
  task: ['title', 'status', 'dueDate']
};
function node(tag, text, className) { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (className) e.className = className; return e; }
const field = (name, title, type = 'number', options = '') => '<label>' + title + '<input name="' + name + '" type="' + type + '" ' + options + '></label>';
function fieldsMarkup(kind) {
  const interval = field('startAt', 'Beginn · Berliner Zeit', 'datetime-local', 'required') + field('endAt', 'Ende · Berliner Zeit', 'datetime-local', 'required');
  const at = field('at', 'Zeitpunkt · optional · Berliner Zeit', 'datetime-local');
  const score = (name, label) => '<label>' + label + '<select name="' + name + '"><option value="">Keine Angabe</option>' + [1, 2, 3, 4, 5].map(v => '<option value="' + v + '">' + v + (v === 1 ? ' · niedrig' : v === 5 ? ' · hoch' : '') + '</option>').join('') + '</select></label>';
  if (kind === 'activity') return field('label', 'Deine Bezeichnung', 'text', 'required maxlength="120" placeholder="z. B. Lernen, Zuhause oder Arbeit"') + interval;
  if (kind === 'workout') return '<label>Sportart<select name="sport">' + Object.entries(sports).map(([value, label]) => '<option value="' + value + '">' + label + '</option>').join('') + '</select></label>' + interval + field('sets', 'Sätze · optional', 'number', 'min="1" max="200" step="1"') + field('reps', 'Wiederholungen · optional', 'number', 'min="1" max="10000" step="1"') + field('rpe', 'Anstrengung · optional · 1 bis 10', 'number', 'min="1" max="10" step="0.5"');
  if (kind === 'checkin') return score('energy', 'Energie · Selbstauskunft') + score('mood', 'Stimmung · Selbstauskunft') + score('soreness', 'Muskelkater · Selbstauskunft');
  if (kind === 'hydration') return field('amountMl', 'Getrunkene Menge · ml', 'number', 'required min="1" max="10000" step="1"') + at;
  if (kind === 'nutrition') return field('energyKcal', 'Energie · kcal', 'number', 'required min="0" max="20000" step="0.1"') + field('proteinG', 'Eiweiß · g · optional', 'number', 'min="0" max="5000" step="0.1"') + field('carbsG', 'Kohlenhydrate · g · optional', 'number', 'min="0" max="5000" step="0.1"') + field('fatG', 'Fett · g · optional', 'number', 'min="0" max="5000" step="0.1"') + at;
  if (kind === 'weight') return field('kg', 'Körpergewicht · kg', 'number', 'required min="1" max="1000" step="0.1"') + at;
  if (kind === 'note') return field('title', 'Titel · optional', 'text', 'maxlength="120"') + at;
  if (kind === 'task') return field('title', 'Aufgabe', 'text', 'required maxlength="120"') + '<label>Status<select name="status"><option value="open">Offen</option><option value="done">Erledigt</option></select></label>' + field('dueDate', 'Fällig am · optional', 'date', 'min="2000-01-01" max="2100-12-31"');
  return field('title', 'Titel des geplanten Termins', 'text', 'required maxlength="120"') + interval;
}
export function createContext({ onLocked, onChanged, onAccessChanged = () => {} }) {
  $('context-view').innerHTML = '<div class="panel-heading"><div><p class="eyebrow">DEIN PERSÖNLICHER KONTEXT</p><h2>Was war heute?</h2><p class="panel-intro">Bewusst ergänzt. Getrennt von den Sensordaten.</p></div><span id="context-owner-status" class="pill">Nur lesen</span></div><p id="context-message" class="panel-message" role="status"></p><div id="context-entry-list" class="context-entry-list"></div><div id="context-owner"><details id="context-owner-details"><summary>Einträge zum Bearbeiten freigeben</summary><form id="context-owner-form" class="owner-form"><label for="context-owner-token">Persönliche Besitzerfreigabe</label><input id="context-owner-token" type="password" autocomplete="off" spellcheck="false" required placeholder="Besitzerlink oder Freigabe einfügen"><button type="submit">Bearbeiten freigeben</button></form><p class="subtle">Dein normaler Kartenlink bleibt ein Lesezugang. Die Freigabe gilt für diesen Browser.</p></details></div><div id="context-editor" hidden><div class="context-create-heading"><h3 id="context-form-title">Eintrag ergänzen</h3><button id="context-use-segment" type="button" hidden>Ausgewählten Abschnitt benennen</button></div><label class="context-kind">Was möchtest du festhalten?<select id="context-kind">' + Object.entries(labels).map(([kind, title]) => '<option value="' + kind + '">' + title + '</option>').join('') + '</select></label><p id="context-segment-note" class="subtle"></p><form id="context-form"><div id="context-fields" class="context-fields"></div><label class="context-note">Notiz · optional<textarea name="note" rows="2" maxlength="2000" placeholder="Deine eigene Ergänzung"></textarea></label><details class="time-occurrence"><summary>Doppelte Uhrzeit bei Zeitumstellung</summary><label>Bei zweimal vorkommenden Uhrzeiten<select name="occurrence"><option value="first">Erste Uhrzeit verwenden</option><option value="second">Zweite Uhrzeit verwenden</option></select></label></details><p id="context-form-message" class="panel-message" role="status"></p><div class="form-actions"><button id="context-save" type="submit" class="primary">Eintrag speichern</button><button id="context-new" type="button">Neuen Eintrag beginnen</button><button id="context-rebase" type="button" hidden>Aktuellen Stand geprüft · Entwurf behalten</button></div></form><p class="subtle">Alle Einträge sind manuelle Angaben. Ein geplanter Termin bestätigt weder Anwesenheit noch Training. Entwürfe bleiben beim Tageswechsel in diesem geöffneten Tab erhalten.</p></div>';
  let day = null, segment = null, journal = null, recorder = null, archiveRevision = null, session = { canRead: false, canWrite: false }, loadingVersion = 0, securityVersion = 0, saving = false, currentForm = null;
  const documents = new Map(), drafts = new Map(), fetched = new Map();
  const validDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '');
  function draft(date = day) { if (!drafts.has(date)) drafts.set(date, { kind: 'activity', fields: {}, editing: null, dirty: false, baseRevision: documents.get(date)?.revision ?? 0, conflict: false, pendingId: null }); return drafts.get(date); }
  function feedback(text = '') { $('context-message').textContent = text; }
  function formFeedback(text = '') { $('context-form-message').textContent = text; }
  function capture() {
    if (!day || !currentForm || currentForm.date !== day) return;
    const state = draft(), values = {};
    for (const input of $('context-form').elements) if (input.name) values[input.name] = input.value;
    state.fields[state.kind] = values;
  }
  function updateAccess() {
    $('context-owner-status').textContent = session.canWrite ? 'Bearbeiten freigegeben' : 'Nur lesen';
    $('context-owner-status').classList.toggle('owner-active', Boolean(session.canWrite));
    $('context-owner').hidden = Boolean(session.canWrite) || !validDay(day);
    $('context-editor').hidden = !session.canWrite || !validDay(day);
  }
  function showForm() {
    if (!validDay(day)) return;
    const state = draft(), values = state.fields[state.kind] ?? {};
    $('context-kind').value = state.kind;
    $('context-fields').innerHTML = fieldsMarkup(state.kind);
    $('context-form').reset();
    $('context-form').elements.namedItem('note').required = state.kind === 'note';
    for (const [name, value] of Object.entries(values)) { const input = $('context-form').elements.namedItem(name); if (input) input.value = value; }
    $('context-form-title').textContent = state.editing ? 'Eintrag bearbeiten' : 'Eintrag ergänzen';
    $('context-save').textContent = state.editing ? 'Änderung speichern' : 'Eintrag speichern';
    $('context-rebase').hidden = !state.conflict;
    const ref = state.segmentRef;
    $('context-segment-note').textContent = ref && state.kind === 'activity' ? 'Bezug: ausgewählter GPS-Abschnitt bei Erstellung. Die Bezeichnung bleibt deine bewusste Zuordnung.' : '';
    currentForm = { date: day, kind: state.kind };
    formFeedback(state.conflict ? 'Der gespeicherte Stand hat sich geändert. Prüfe die Einträge oben; dein Entwurf ist erhalten. Bestätige den aktuellen Stand vor erneutem Speichern.' : state.dirty ? 'Entwurf für diesen Tag erhalten.' : '');
  }
  function refUncertain(entry) {
    // The server also checks the original segment ID and point fingerprint.
    // Equal timestamps alone cannot override its stale/unverified verdict.
    if (entry.needsReview === true) return true;
    if (entry.segmentStatus === 'matched') return false;
    const ref = entry.segmentRef;
    if (!ref || !journal) return false;
    return ![...(journal.trips ?? []), ...(journal.stays ?? [])].some(part => part.kind === ref.segmentKind && part.startTimestamp === ref.startTimestamp && part.endTimestamp === ref.endTimestamp);
  }
  function description(entry) {
    if (entry.kind === 'note') return entry.title || 'Notiz';
    if (entry.kind === 'task') return entry.title;
    if (entry.kind === 'activity') return entry.label;
    if (entry.kind === 'workout') return sports[entry.sport] ?? entry.sport;
    if (entry.kind === 'checkin') return [['energy', 'Energie'], ['mood', 'Stimmung'], ['soreness', 'Muskelkater']].filter(([key]) => Number.isFinite(entry[key])).map(([key, title]) => title + ' ' + entry[key] + '/5').join(' · ') || 'Tagesnotiz';
    if (entry.kind === 'hydration') return number.format(entry.amountMl) + ' ml';
    if (entry.kind === 'nutrition') return number.format(entry.energyKcal) + ' kcal' + (Number.isFinite(entry.proteinG) ? ' · ' + number.format(entry.proteinG) + ' g Eiweiß' : '');
    if (entry.kind === 'weight') return number.format(entry.kg) + ' kg';
    return entry.title;
  }
  function editEntry(entry) {
    capture(); const state = draft(); state.kind = entry.kind; state.editing = entry.id; state.pendingId = null; state.segmentRef = entry.segmentRef ? { ...entry.segmentRef } : null;
    state.baseRevision = documents.get(day).revision; state.conflict = false; state.dirty = false;
    const values = { note: entry.note ?? '', occurrence: ['startAt','at'].some(key => entry[key] && berlinInputToIso(localTime(entry[key]), 'second') === entry[key] && berlinInputToIso(localTime(entry[key]), 'first') !== entry[key]) ? 'second' : 'first' };
    for (const key of entryFields[entry.kind]) if (key !== 'segmentRef' && entry[key] !== undefined) values[key] = ['startAt', 'endAt', 'at'].includes(key) ? localTime(entry[key]) : String(entry[key]);
    state.fields[entry.kind] = values; showForm(); $('context-form-title').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function renderEntries() {
    const entries = documents.get(day)?.entries ?? [];
    if (!entries.length) { $('context-entry-list').replaceChildren(node('p', 'Für diesen Tag sind noch keine persönlichen Einträge gespeichert.', 'subtle')); return; }
    $('context-entry-list').replaceChildren(...entries.map(entry => {
      const card = node('article', undefined, 'context-entry'), heading = node('div', undefined, 'context-entry-heading'), label = node('span', labels[entry.kind] ?? 'Eintrag', 'eyebrow');
      heading.append(label, node('span', entry.kind === 'planned_event' ? 'Geplant · manuell' : 'Manuell ergänzt', 'pill')); card.append(heading, node('strong', description(entry)));
      if (entry.startAt) card.append(node('p', displayTime(entry.startAt) + ' – ' + displayTime(entry.endAt), 'subtle'));
      else if (entry.at) card.append(node('p', displayTime(entry.at), 'subtle'));
      if (entry.kind === 'task') card.append(node('p', (entry.status === 'done' ? 'Erledigt' : 'Offen') + (entry.dueDate ? ' · Fällig am ' + new Date(entry.dueDate + 'T12:00:00Z').toLocaleDateString('de-DE') : ''), 'subtle'));
      if (entry.note) card.append(node('p', entry.note, 'context-entry-note'));
      if (refUncertain(entry)) card.append(node('p', 'Zuordnung prüfen: Der GPS-Abschnitt hat sich seit deiner Ergänzung geändert.', 'context-warning'));
      if (session.canWrite) {
        const actions = node('div', undefined, 'entry-actions'), edit = node('button', 'Bearbeiten'), remove = node('button', 'Löschen');
        edit.type = remove.type = 'button'; edit.addEventListener('click', () => editEntry(entry));
        remove.addEventListener('click', () => {
          if (card.querySelector('.delete-confirmation')) return;
          const confirmation = node('div', undefined, 'delete-confirmation'), text = node('span', 'Diesen manuellen Eintrag löschen?'), yes = node('button', 'Ja, löschen'), no = node('button', 'Behalten');
          yes.type = no.type = 'button'; yes.addEventListener('click', () => write('delete', entry.id)); no.addEventListener('click', () => confirmation.remove()); confirmation.append(text, yes, no); card.append(confirmation);
        });
        actions.append(edit, remove); card.append(actions);
      }
      return card;
    }));
  }
  async function refreshSession() {
    const version = securityVersion;
    const r = await fetch('/assistenz/session', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (version !== securityVersion) return false;
    if (r.status === 401) { session = { canRead: false, canWrite: false }; updateAccess(); onLocked(); return false; }
    if (!r.ok) throw new Error('Die Besitzerfreigabe konnte nicht geprüft werden.');
    const next = await r.json(); if (version !== securityVersion) return false; session = next; updateAccess(); return true;
  }
  async function load(date = day, force = false) {
    if (!validDay(date)) return;
    if (!force && Date.now() - (fetched.get(date) ?? 0) < 60000) return;
    const version = ++loadingVersion;
    try {
      const r = await fetch('/assistenz/context?' + new URLSearchParams({ date }), { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (version !== loadingVersion) return;
      if (r.status === 401) { onLocked(); return; }
      if (!r.ok) throw new Error();
      const value = await r.json(); if (version !== loadingVersion) return;
      documents.set(date, value); fetched.set(date, Date.now()); const state = draft(date);
      // Keep an existing editor bound to the revision of its displayed fields.
      if (!state.editing && !state.dirty && !state.conflict) state.baseRevision = value.revision;
      if (date === day) { feedback(''); renderEntries(); }
    } catch { if (date === day && version === loadingVersion) feedback('Tageseinträge vorübergehend nicht erreichbar. Dein Entwurf bleibt erhalten.'); }
  }
  function buildEntry() {
    const state = draft(), values = state.fields[state.kind] ?? {}, occurrence = values.occurrence ?? 'first';
    const entry = { id: state.editing ?? state.pendingId ?? crypto.randomUUID(), kind: state.kind };
    state.pendingId = entry.id;
    for (const key of entryFields[state.kind]) {
      if (key === 'segmentRef') { if (state.segmentRef) entry.segmentRef = { ...state.segmentRef }; continue; }
      const value = values[key]; if (value === undefined || value === '') continue;
      if (['startAt', 'endAt', 'at'].includes(key)) entry[key] = berlinInputToIso(value, occurrence);
      else entry[key] = ['label', 'title', 'sport', 'status', 'dueDate'].includes(key) ? value.trim() : Number(value);
    }
    if (values.note?.trim()) entry.note = values.note.trim();
    if (entry.startAt && dayFormatter.format(new Date(entry.startAt)) !== day) throw new Error('Der Beginn muss zum gewählten Tag in Berliner Zeit gehören.');
    if (entry.at && dayFormatter.format(new Date(entry.at)) !== day) throw new Error('Der Zeitpunkt muss zum gewählten Tag in Berliner Zeit gehören.');
    if (entry.startAt && Date.parse(entry.endAt) <= Date.parse(entry.startAt)) throw new Error('Das Ende muss nach dem Beginn liegen.');
    return entry;
  }
  async function write(operation, id) {
    if (saving || !session.canWrite || !validDay(day)) return;
    capture(); const version = securityVersion, date = day, state = draft(), revision = operation === 'delete' ? documents.get(day)?.revision : state.baseRevision;
    if (state.conflict && operation !== 'delete') { formFeedback('Bitte zuerst den geänderten gespeicherten Stand prüfen. Dein Entwurf ist erhalten.'); return; }
    let entry; try { if (operation === 'upsert') entry = buildEntry(); } catch (error) { formFeedback(error.message); return; }
    saving = true; $('context-save').disabled = true; feedback('Wird gespeichert …');
    try {
      const r = await fetch('/assistenz/context', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken ?? '' }, body: JSON.stringify({ date, expectedRevision: revision, operation, ...(entry ? { entry } : { id }) }), signal: AbortSignal.timeout(10000) });
      const response = await r.json().catch(() => ({}));
      if (version !== securityVersion) return;
      if (r.status === 409) {
        state.conflict = true; state.dirty = true;
        if (date === day) { await load(date, true); $('context-rebase').hidden = false; formFeedback('Ein anderer Stand wurde gespeichert. Dein Entwurf ist erhalten. Prüfe die Einträge und bestätige den aktuellen Stand vor erneutem Speichern.'); } return;
      }
      if (r.status === 401) { onLocked(); return; }
      if (r.status === 403) { await refreshSession(); throw new Error('Die Besitzerfreigabe ist abgelaufen. Bitte erneut freigeben; dein Entwurf bleibt erhalten.'); }
      if (!r.ok) throw new Error(response.error ?? response.message ?? 'Der Eintrag konnte nicht gespeichert werden.');
      if (Array.isArray(response.entries) && response.date === date) documents.set(date, response);
      else { fetched.delete(date); await load(date, true); }
      if (operation === 'upsert' || state.editing === id) {
        state.editing = null; state.pendingId = null; state.segmentRef = null; state.fields[state.kind] = {}; state.dirty = false; state.conflict = false;
      }
      if (version !== securityVersion) return;
      state.baseRevision = documents.get(date)?.revision ?? state.baseRevision; onChanged(date);
      if (date === day) { renderEntries(); showForm(); feedback(operation === 'delete' ? 'Eintrag gelöscht.' : 'Eintrag gespeichert.'); }
    } catch (error) { if (date === day) feedback(typeof error.message === 'string' ? error.message : 'Speichern fehlgeschlagen. Dein Entwurf bleibt erhalten.'); }
    finally { saving = false; $('context-save').disabled = false; }
  }
  async function enableOwner(token) {
    let value = token.trim();
    if (value.includes('#')) value = new URLSearchParams(new URL(value).hash.slice(1)).get('owner') ?? '';
    if (!value) throw new Error('Bitte die persönliche Besitzerfreigabe angeben.');
    const r = await fetch('/assistenz/owner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: value }), signal: AbortSignal.timeout(10000) }); value = '';
    if (!r.ok) throw new Error(r.status === 429 ? 'Bitte kurz warten und die Freigabe erneut versuchen.' : 'Die Besitzerfreigabe ist ungültig oder abgelaufen.');
    if (!await refreshSession()) return; renderEntries(); showForm(); feedback('Bearbeiten ist in diesem Browser freigegeben.'); onAccessChanged();
  }
  $('context-owner-form').addEventListener('submit', async event => {
    event.preventDefault(); let token = $('context-owner-token').value; $('context-owner-token').value = '';
    try { await enableOwner(token); } catch (error) { feedback(error.message); } finally { token = ''; }
  });
  $('context-kind').addEventListener('change', () => { capture(); const state = draft(); state.kind = $('context-kind').value; state.editing = null; state.pendingId = null; state.segmentRef = null; state.baseRevision = documents.get(day)?.revision ?? 0; state.conflict = false; showForm(); });
  $('context-form').addEventListener('input', () => { draft().dirty = true; capture(); });
  $('context-form').addEventListener('change', () => { draft().dirty = true; capture(); });
  $('context-form').addEventListener('submit', event => { event.preventDefault(); if ($('context-form').reportValidity()) write('upsert'); });
  $('context-new').addEventListener('click', () => { capture(); const state = draft(); state.editing = null; state.pendingId = null; state.segmentRef = null; state.baseRevision = documents.get(day)?.revision ?? 0; state.conflict = false; showForm(); });
  $('context-rebase').addEventListener('click', () => { const state = draft(); state.baseRevision = documents.get(day)?.revision ?? state.baseRevision; state.conflict = false; $('context-rebase').hidden = true; formFeedback('Aktueller Stand bestätigt. Dein Entwurf kann jetzt gespeichert werden.'); });
  $('context-use-segment').addEventListener('click', () => {
    if (!segment || !validDay(day)) return;
    capture(); const state = draft(); state.kind = 'activity'; state.editing = null; state.pendingId = null; state.dirty = true; state.conflict = false; state.baseRevision = documents.get(day)?.revision ?? 0;
    state.segmentRef = { journalIdAtCreation: segment.id, archiveRevisionAtCreation: archiveRevision ?? null, algorithmVersion: 1, startTimestamp: segment.startTimestamp, endTimestamp: segment.endTimestamp, segmentKind: segment.kind, anchorFingerprint: segment.kind + ':' + segment.startTimestamp + ':' + segment.endTimestamp + ':' + segment.pointCount, ...(recorder ? { source: recorder.source, device: recorder.device } : {}) };
    state.fields.activity = { ...(state.fields.activity ?? {}), startAt: localTime(new Date(segment.startTimestamp * 1000).toISOString()), endAt: localTime(new Date(segment.endTimestamp * 1000).toISOString()) };
    showForm(); $('context-fields').querySelector('input')?.focus();
  });
  window.addEventListener('beforeunload', event => { if ([...drafts.values()].some(state => state.dirty)) { event.preventDefault(); event.returnValue = ''; } });
  return {
    async setDay(value) {
      const next = value.date;
      segment = value.segment ?? null; journal = value.journal ?? null; recorder = value.recorder ?? null; archiveRevision = value.archiveRevision ?? null;
      $('context-use-segment').hidden = !segment || !session.canWrite || !validDay(next);
      if (next !== day) {
        capture(); day = next; currentForm = null;
        updateAccess(); $('context-entry-list').replaceChildren();
        if (!validDay(day)) { feedback('Wähle einen einzelnen Tag für persönliche Einträge.'); return; }
        draft(); showForm(); renderEntries(); await load(day, true); if (day === next && !draft().dirty) showForm();
      } else { renderEntries(); if (validDay(day) && !draft().dirty) await load(day); }
    },
    async unlock() { try { if (await refreshSession()) { renderEntries(); if (validDay(day)) { await load(day, true); showForm(); } } } catch (error) { feedback(error.message); } },
    enableOwner,
    refresh() { if(validDay(day) && !draft().dirty) load(day); },
    reset() {
      loadingVersion++; securityVersion++; day = null; segment = journal = recorder = null; currentForm = null; session = { canRead: false, canWrite: false };
      documents.clear(); drafts.clear(); fetched.clear(); $('context-entry-list').replaceChildren(); $('context-fields').replaceChildren(); $('context-form').reset(); $('context-owner-token').value = ''; updateAccess(); feedback('Öffne deinen persönlichen Kartenlink für deine Tageseinträge.');
    }
  };
}
