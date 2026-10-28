const $ = id => document.getElementById(id);
const berlinDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const validDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') && value >= '2000-01-01' && value <= '2100-12-31' && Number.isFinite(Date.parse(value)) && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;
const shifted = (day, count) => { const date = new Date(day + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + count); return date.toISOString().slice(0, 10); };
const dateLabel = value => new Date(value + 'T12:00:00Z').toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', day: 'numeric', month: 'short', year: 'numeric' });
const element = (tag, text, className) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; };
const editableEntry = entry => Object.fromEntries(['id', 'kind', 'title', 'note', 'at', 'status', 'dueDate'].filter(key => entry[key] !== undefined).map(key => [key, entry[key]]));

export function createWorkspace({ onLocked, onChanged, onDay, onOwner }) {
  $('workspace-view').innerHTML = `
    <div class="workspace-heading"><div><p class="eyebrow">DEIN PERSÖNLICHER ASSISTENT</p><h2 id="workspace-heading">Wichtiges bleibt bei dir.</h2><p id="workspace-intro" class="panel-intro">Notizen festhalten. Aufgaben erledigen. Deinen Alltag überblicken.</p></div><span id="workspace-access" class="pill">Zugriff wird geprüft</span></div>
    <div class="workspace-overview" aria-label="Gespeicherte Notizen und Aufgaben"><article><span>OFFENE AUFGABEN</span><strong id="workspace-open-count">–</strong><small>Im gewählten Zeitraum</small></article><article><span>NOTIZEN</span><strong id="workspace-note-count">–</strong><small>Bewusst festgehalten</small></article><article><span>ERLEDIGT</span><strong id="workspace-done-count">–</strong><small>Von dir abgehakt</small></article></div>
    <section id="workspace-focus" class="workspace-focus" aria-labelledby="workspace-focus-title"><div class="workspace-focus-heading"><div><p class="eyebrow">DEIN FOKUS</p><h3 id="workspace-focus-title">Was als Nächstes ansteht.</h3></div><p id="workspace-focus-scope" class="subtle">Aufgaben im gewählten Zeitraum.</p></div><div class="workspace-focus-actions"><button id="workspace-focus-today" type="button"><span>Heute fällig</span><strong>–</strong><small>Offene Aufgaben</small></button><button id="workspace-focus-overdue" type="button"><span>Überfällig</span><strong>–</strong><small>In Ruhe neu planen</small></button><button id="workspace-focus-undated" type="button"><span>Ohne Termin</span><strong>–</strong><small>Wenn du Zeit hast</small></button></div><p id="workspace-focus-message" class="workspace-focus-message"></p></section>
    <div class="workspace-layout"><section class="workspace-capture" aria-labelledby="workspace-capture-title"><div class="workspace-card-heading"><span class="workspace-step">+</span><div><h3 id="workspace-capture-title">Kurz festhalten</h3><p class="subtle">Privat aufbewahrt. Auch ohne GPS.</p></div></div>
      <a id="workspace-account-link" href="/konto">Mein Konto öffnen →</a><p id="workspace-permission" class="workspace-permission" role="status"></p><button id="workspace-owner" type="button" hidden>Bearbeiten freigeben</button>
      <div class="workspace-quick-actions" aria-label="Für heute festhalten"><button id="workspace-quick-note" type="button">Neue Notiz</button><button id="workspace-quick-task" type="button">Neue Aufgabe</button></div>
      <form id="workspace-form"><fieldset id="workspace-edit-fields" disabled><div class="workspace-form-row"><label for="workspace-kind">Eintrag<select id="workspace-kind"><option value="note">Notiz</option><option value="task">Aufgabe</option></select></label><label for="workspace-date">Tag · Berliner Zeit<input id="workspace-date" type="date" min="2000-01-01" max="2100-12-31" required></label></div>
        <label for="workspace-title" id="workspace-title-label">Titel · optional<input id="workspace-title" type="text" maxlength="120" autocomplete="off" placeholder="Worum geht es?"></label>
        <label for="workspace-note" id="workspace-note-label">Deine Notiz<textarea id="workspace-note" rows="5" maxlength="2000" placeholder="Gedanke, Gespräch, Idee oder etwas, das du behalten möchtest …" required></textarea></label>
        <div id="workspace-task-fields" class="workspace-form-row" hidden><label for="workspace-due-date">Fällig am · optional<input id="workspace-due-date" type="date" min="2000-01-01" max="2100-12-31"></label><label for="workspace-task-status">Status<select id="workspace-task-status"><option value="open">Offen</option><option value="done">Erledigt</option></select></label></div>
        <p id="workspace-draft-status" class="subtle">Ungespeicherte Entwürfe bleiben nur in diesem geöffneten Tab.</p><div class="workspace-form-actions"><button id="workspace-save" class="primary" type="submit">Notiz speichern</button><button id="workspace-reset" type="button">Entwurf verwerfen</button><button id="workspace-rebase" type="button" hidden>Aktuellen Stand geprüft · Entwurf behalten</button></div>
      </fieldset></form>
    </section><section class="workspace-library" aria-labelledby="workspace-library-title"><div class="workspace-library-heading"><div><h3 id="workspace-library-title">Deine letzten Einträge</h3><p id="workspace-range-label" class="subtle">Gespeicherter Zeitraum wird geprüft.</p></div><button id="workspace-refresh" type="button">Aktualisieren</button></div>
      <div id="workspace-tools" class="workspace-tools" hidden><label class="workspace-search-label" for="workspace-search">Einträge durchsuchen<input id="workspace-search" type="search" placeholder="Titel oder Notiz suchen" maxlength="2000"></label><div class="workspace-form-row"><label for="workspace-period">Zeitraum<select id="workspace-period"><option value="7">Letzte 7 Tage</option><option value="30" selected>Letzte 30 Tage</option><option value="90">Letzte 90 Tage</option></select></label><label for="workspace-range-end">Bis einschließlich<input id="workspace-range-end" type="date" min="2000-01-01" max="2100-12-31" required></label></div><div class="workspace-range-navigation" aria-label="Aufzeichnungszeitraum wechseln"><button id="workspace-range-previous" type="button">← Vorheriger Zeitraum</button><button id="workspace-range-today" type="button">Bis heute</button><button id="workspace-range-next" type="button">Nächster Zeitraum →</button></div><div class="workspace-form-row"><label for="workspace-filter">Anzeigen<select id="workspace-filter"><option value="all">Notizen und Aufgaben</option><option value="note">Nur Notizen</option><option value="task-open">Offene Aufgaben</option><option value="task-today">Heute fällige Aufgaben</option><option value="task-overdue">Überfällige Aufgaben</option><option value="task-next7">Fällig in den nächsten 7 Tagen</option><option value="task-undated">Aufgaben ohne Termin</option><option value="task-done">Erledigte Aufgaben</option></select></label><label for="workspace-sort">Sortieren<select id="workspace-sort"><option value="updated">Zuletzt geändert</option><option value="due">Fälligkeit zuerst</option><option value="oldest">Älteste Einträge zuerst</option></select></label></div></div>
      <p id="workspace-message" class="panel-message" role="status"></p><div id="workspace-list" class="workspace-list"></div><button id="workspace-more" type="button" hidden>Weitere Einträge anzeigen</button><button id="workspace-browse" type="button" class="workspace-browse">Notizen und Aufgaben durchsuchen →</button>
    </section></div><p class="workspace-scope">Manuelle Einträge sind deine eigenen Angaben. Fälligkeiten sind eine Übersicht und lösen keine automatische Erinnerung aus.</p>`;
  let session = { canRead: false, canWrite: false }, generation = 0, overview = true, loaded = false, busy = false, saving = false, visibleLimit = 50, rangeVersion = 0;
  let currentKey = '', selectedDay = berlinDay(), rangeDays = 30, rangeEnd = berlinDay(), loadedRange = '', rangeFailed = false;
  const documents = new Map(), drafts = new Map(), controllers = new Set();
  const draftKey = (date, kind, id) => [date, kind, id ?? 'new'].join(':');
  function draft() { return drafts.get(currentKey); }
  function message(text = '') { $('workspace-message').textContent = text; }
  function capture() {
    const state = draft(); if (!state) return;
    state.title = $('workspace-title').value; state.note = $('workspace-note').value;
    state.dueDate = $('workspace-due-date').value; state.status = $('workspace-task-status').value;
  }
  function chooseDraft(date = selectedDay, kind = 'note', entry = null) {
    capture(); selectedDay = date;
    currentKey = draftKey(date, kind, entry?.id);
    const existing = drafts.get(currentKey);
    // An explicit edit starts from the displayed current record unless a local draft needs preserving.
    if (!existing || entry && !existing.dirty && !existing.conflict) drafts.set(currentKey, { date, kind, title: entry?.title ?? '', note: entry?.note ?? '', dueDate: entry?.dueDate ?? '', status: entry?.status ?? 'open', id: entry?.id ?? null, at: entry?.at, baseRevision: documents.get(date)?.revision, dirty: false, conflict: false, pendingId: null });
    showDraft();
  }
  function showDraft() {
    const state = draft(); if (!state) return;
    $('workspace-kind').value = state.kind; $('workspace-date').value = state.date;
    $('workspace-title').value = state.title; $('workspace-note').value = state.note;
    $('workspace-due-date').value = state.dueDate; $('workspace-task-status').value = state.status;
    $('workspace-title').required = state.kind === 'task'; $('workspace-note').required = state.kind === 'note';
    $('workspace-title-label').firstChild.textContent = state.kind === 'task' ? 'Aufgabe' : 'Titel · optional';
    $('workspace-note-label').firstChild.textContent = state.kind === 'task' ? 'Zusätzliche Notiz · optional' : 'Deine Notiz';
    $('workspace-task-fields').hidden = state.kind !== 'task';
    $('workspace-capture-title').textContent = state.id ? 'Eintrag bearbeiten' : 'Kurz festhalten';
    $('workspace-save').textContent = state.id ? 'Änderung speichern' : state.kind === 'task' ? 'Aufgabe speichern' : 'Notiz speichern';
    $('workspace-rebase').hidden = !state.conflict;
    for (const kind of ['note', 'task']) $('workspace-quick-' + kind).setAttribute('aria-pressed', String(state.kind === kind && !state.id));
    $('workspace-draft-status').textContent = state.conflict ? 'Ein anderer Stand wurde gespeichert. Prüfe die aktuelle Liste; dein Entwurf bleibt erhalten.' : state.dirty ? 'Entwurf erhalten · noch nicht gespeichert · nur in diesem Tab.' : 'Ungespeicherte Entwürfe bleiben nur in diesem geöffneten Tab.';
  }
  function permission() {
    $('workspace-access').textContent = session.canWrite ? 'Privat · Bearbeiten möglich' : session.canRead ? 'Privat · Lesezugriff' : 'Geschützter Bereich';
    $('workspace-access').classList.toggle('owner-active', session.canWrite);
    $('workspace-edit-fields').disabled = !session.canWrite || saving; $('workspace-account-link').hidden = session.canWrite;
    $('workspace-quick-note').disabled = $('workspace-quick-task').disabled = !session.canWrite || saving;
    $('workspace-owner').hidden = !session.canRead || session.canWrite;
    $('workspace-permission').textContent = session.canWrite ? '' : session.canRead ? 'Du kannst deine Aufzeichnungen lesen. Zum Speichern brauchst du die persönliche Bearbeitungsfreigabe.' : 'Melde dich über Mein Konto an oder öffne deinen persönlichen Zugangslink. Deine Aufzeichnungen bleiben privat.';
  }
  async function request(url, options = {}) {
    const controller = new AbortController(); controllers.add(controller);
    const timer = setTimeout(() => controller.abort(), 12000);
    try { return await fetch(url, { ...options, credentials: 'same-origin', cache: 'no-store', signal: controller.signal }); }
    finally { clearTimeout(timer); controllers.delete(controller); }
  }
  const rangeStart = () => [shifted(rangeEnd, 1 - rangeDays), '2000-01-01'].sort().at(-1);
  const rangeReady = () => loaded && loadedRange === rangeStart() + ':' + rangeEnd;
  function records() {
    return [...documents.values()].filter(doc => doc.date >= rangeStart() && doc.date <= rangeEnd).flatMap(doc => doc.entries.map(entry => ({ ...entry, date: doc.date, revision: doc.revision }))).sort((a, b) => (b.updatedAt ?? b.createdAt ?? b.date).localeCompare(a.updatedAt ?? a.createdAt ?? a.date) || b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }
  function matchesFilter(entry, filter, today) {
    if (filter === 'all') return true;
    if (filter === 'note') return entry.kind === 'note';
    if (entry.kind !== 'task') return false;
    if (filter === 'task-done') return entry.status === 'done';
    if (entry.status !== 'open') return false;
    if (filter === 'task-open') return true;
    if (filter === 'task-today') return entry.dueDate === today;
    if (filter === 'task-overdue') return Boolean(entry.dueDate && entry.dueDate < today);
    if (filter === 'task-next7') return Boolean(entry.dueDate && entry.dueDate >= today && entry.dueDate <= shifted(today, 6));
    if (filter === 'task-undated') return !entry.dueDate;
    return false;
  }
  function renderFocus(all, today, ready) {
    const counts = {};
    for (const type of ['today', 'overdue', 'undated']) {
      counts[type] = all.filter(entry => matchesFilter(entry, 'task-' + type, today)).length;
      const button = $('workspace-focus-' + type);
      button.querySelector('strong').textContent = ready ? String(counts[type]) : '–';
      button.disabled = !ready || !session.canRead;
    }
    $('workspace-focus-scope').textContent = session.canRead ? 'Für Einträge vom ' + dateLabel(rangeStart()) + ' bis ' + dateLabel(rangeEnd) + '.' : 'Deine Aufgaben bleiben privat.';
    $('workspace-focus-message').textContent = !session.canRead ? 'Melde dich an, um deinen persönlichen Überblick zu sehen.' : !ready ? rangeFailed ? 'Der gewählte Zeitraum ist noch nicht vollständig geladen. Bitte aktualisieren.' : 'Deine gespeicherten Aufgaben werden geprüft …' : counts.today || counts.overdue ? 'Öffne einen Bereich, um deine Aufgaben zu prüfen oder abzuhaken.' : 'Im angezeigten Zeitraum sind keine offenen Aufgaben heute fällig oder überfällig. Ältere Einträge findest du über den Zeitraum.';
  }
  function render() {
    const ready = rangeReady(), all = ready ? records() : [], today = berlinDay(), query = overview ? '' : $('workspace-search').value.trim().toLocaleLowerCase('de-DE'), filter = overview ? 'all' : $('workspace-filter').value, sort = overview ? 'updated' : $('workspace-sort').value;
    $('workspace-open-count').textContent = ready ? String(all.filter(e => e.kind === 'task' && e.status === 'open').length) : '–';
    $('workspace-note-count').textContent = ready ? String(all.filter(e => e.kind === 'note').length) : '–';
    $('workspace-done-count').textContent = ready ? String(all.filter(e => e.kind === 'task' && e.status === 'done').length) : '–';
    renderFocus(all, today, ready);
    const matches = all.filter(entry => (!query || [entry.title, entry.note, entry.dueDate].filter(Boolean).join(' ').toLocaleLowerCase('de-DE').includes(query)) && matchesFilter(entry, filter, today));
    if (sort === 'due') matches.sort((a, b) => Number(!(a.kind === 'task' && a.status === 'open')) - Number(!(b.kind === 'task' && b.status === 'open')) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') || a.date.localeCompare(b.date));
    if (sort === 'oldest') matches.sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
    const shown = matches.slice(0, overview ? 4 : visibleLimit);
    $('workspace-library-title').textContent = overview ? 'Deine letzten Einträge' : 'Notizen und Aufgaben';
    $('workspace-range-label').textContent = session.canRead ? dateLabel(rangeStart()) + ' – ' + dateLabel(rangeEnd) + ' · ' + (ready ? matches.length + ' passende Einträge' : rangeFailed ? 'Nicht vollständig geladen' : 'Wird geladen') : 'Zugriff erforderlich';
    $('workspace-list').replaceChildren(...shown.map(card));
    if (!shown.length) $('workspace-list').append(element('div', !session.canRead ? 'Deine privaten Einträge erscheinen nach der Anmeldung.' : !ready ? rangeFailed ? 'Für diesen Zeitraum liegt kein vollständig geladener Stand vor. Bitte aktualisieren.' : 'Deine Aufzeichnungen werden geladen …' : query || filter !== 'all' ? 'Keine passenden Einträge. Passe Suche oder Filter an.' : 'Hier ist noch Platz für Wichtiges. Halte deine erste Notiz oder Aufgabe fest.', 'workspace-empty'));
    $('workspace-more').hidden = overview || matches.length <= visibleLimit;
    $('workspace-browse').hidden = !overview;
    $('workspace-tools').hidden = overview;
    $('workspace-focus').hidden = !overview;
    $('workspace-range-previous').disabled = rangeEnd <= '2000-01-01';
    $('workspace-range-next').disabled = rangeEnd >= '2100-12-31';
  }
  function card(entry) {
    const item = element('article', undefined, 'workspace-card' + (entry.kind === 'task' && entry.status === 'done' ? ' is-done' : ''));
    const heading = element('div', undefined, 'workspace-entry-heading');
    heading.append(element('span', entry.kind === 'task' ? entry.status === 'done' ? 'Aufgabe · erledigt' : 'Aufgabe · offen' : 'Notiz', 'workspace-entry-kind'), element('span', dateLabel(entry.date), 'workspace-entry-date')); item.append(heading);
    if (entry.title) item.append(element('h4', entry.title));
    if (entry.note) item.append(element('p', entry.note, 'workspace-entry-body'));
    if (entry.dueDate) {
      const late = entry.status === 'open' && entry.dueDate < berlinDay();
      item.append(element('p', (late ? 'Überfällig · ' : 'Fällig · ') + dateLabel(entry.dueDate), 'workspace-due' + (late ? ' is-late' : '')));
    }
    const actions = element('div', undefined, 'workspace-entry-actions');
    if (session.canWrite) {
      if (entry.kind === 'task') {
        const toggle = element('button', entry.status === 'done' ? 'Wieder öffnen' : 'Als erledigt markieren'); toggle.type = 'button'; toggle.disabled = saving;
        toggle.addEventListener('click', () => mutate(entry.date, entry.revision, 'upsert', { ...editableEntry(entry), status: entry.status === 'done' ? 'open' : 'done' })); actions.append(toggle);
      }
      const edit = element('button', 'Bearbeiten'); edit.type = 'button'; edit.disabled = saving; edit.addEventListener('click', () => { chooseDraft(entry.date, entry.kind, entry); $('workspace-title').focus(); $('workspace-form').scrollIntoView({ block: 'nearest', behavior: 'auto' }); });
      const remove = element('button', 'Löschen'); remove.type = 'button'; remove.disabled = saving; remove.addEventListener('click', () => {
        if (item.querySelector('.workspace-delete-confirmation')) return;
        const prompt = element('div', undefined, 'workspace-delete-confirmation'); prompt.append(element('span', 'Diesen Eintrag endgültig löschen?'));
        const yes = element('button', 'Ja, löschen'), no = element('button', 'Behalten'); yes.type = no.type = 'button';
        yes.addEventListener('click', () => mutate(entry.date, entry.revision, 'delete', null, entry.id)); no.addEventListener('click', () => prompt.remove()); prompt.append(yes, no); item.append(prompt); yes.focus();
      }); actions.append(edit, remove);
    }
    const day = element('button', 'Tag öffnen'); day.type = 'button'; day.addEventListener('click', () => onDay(entry.date)); actions.append(day); item.append(actions); return item;
  }
  async function loadRange() {
    if (!session.canRead) return;
    if (!validDay(rangeEnd)) { message('Bitte einen gültigen letzten Tag wählen.'); return; }
    const version = generation, requestVersion = ++rangeVersion, from = rangeStart(), to = rangeEnd;
    busy = true; rangeFailed = false; $('workspace-refresh').disabled = true; message('Aufzeichnungen werden geladen …'); render();
    try {
      const response = await request('/assistenz/context-range?' + new URLSearchParams({ from, to }));
      if (version !== generation || requestVersion !== rangeVersion) return;
      if (response.status === 401) { onLocked(); return; }
      if (response.status === 413) throw new Error('Der Zeitraum enthält zu viele Einträge. Wähle einen kürzeren Zeitraum.');
      if (!response.ok) throw new Error('Notizen und Aufgaben sind gerade nicht erreichbar. Dein Entwurf bleibt erhalten.');
      const value = await response.json(); if (version !== generation || requestVersion !== rangeVersion) return;
      if (value.schemaVersion !== 1 || value.timezone !== 'Europe/Berlin' || value.from !== from || value.to !== to || !Array.isArray(value.documents) || value.documents.some(doc => !validDay(doc.date) || doc.date < from || doc.date > to || !Number.isSafeInteger(doc.revision) || !Array.isArray(doc.entries) || doc.entries.some(e => !['note', 'task'].includes(e.kind)))) throw new Error('Die Aufzeichnungen konnten nicht vollständig gelesen werden. Bitte erneut laden.');
      documents.clear(); for (const doc of value.documents) documents.set(doc.date, doc); loaded = true; loadedRange = from + ':' + to;
      // Existing-record editors keep the revision matching their displayed text.
      // Advancing it during a background refresh would defeat conflict detection.
      for (const state of drafts.values()) if (!state.id && !state.dirty && !state.conflict) state.baseRevision = documents.get(state.date)?.revision;
      message(''); render();
    } catch (error) { if (version === generation && requestVersion === rangeVersion) { rangeFailed = true; message(error.name === 'AbortError' ? 'Der Abruf dauert zu lange. Erneut laden; dein Entwurf bleibt erhalten.' : error.message); render(); } }
    finally { if (version === generation && requestVersion === rangeVersion) { busy = false; $('workspace-refresh').disabled = false; } }
  }
  async function currentRevision(date) {
    const version = generation;
    const response = await request('/assistenz/context?' + new URLSearchParams({ date }));
    if (version !== generation) return null;
    if (response.status === 401) { onLocked(); return null; }
    if (!response.ok) throw new Error('Der aktuelle Tagesstand konnte nicht geladen werden. Dein Entwurf bleibt erhalten.');
    const value = await response.json(); if (version !== generation) return null; if (value.date !== date || !Number.isSafeInteger(value.revision)) throw new Error('Der Tagesstand ist unvollständig. Bitte erneut prüfen.'); return value.revision;
  }
  async function mutate(date, revision, operation, entry, id, state = null) {
    if (saving || !session.canWrite) return false;
    const version = generation; saving = true; permission(); render(); message('Wird gespeichert …');
    try {
      if (revision === undefined) revision = await currentRevision(date);
      if (version !== generation || revision === null) return false;
      const response = await request('/assistenz/context', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken ?? '' }, body: JSON.stringify({ date, expectedRevision: revision, operation, ...(entry ? { entry } : { id }) }) });
      if (version !== generation) return false;
      if (response.status === 401) { onLocked(); return false; }
      if (response.status === 403) { session.canWrite = false; permission(); throw new Error('Deine Bearbeitungsfreigabe ist abgelaufen. Erneut freigeben; dein Entwurf bleibt erhalten.'); }
      if (response.status === 409) { if (state) { state.conflict = true; state.dirty = true; } await loadRange(); showDraft(); throw new Error('Ein anderer Stand wurde gespeichert. Prüfe die aktuelle Liste. Dein Entwurf bleibt erhalten.'); }
      if (!response.ok) throw new Error('Speichern fehlgeschlagen. Dein Entwurf bleibt erhalten. Bitte erneut versuchen.');
      const value = await response.json(); if (version !== generation) return false;
      if (value.date !== date || !Number.isSafeInteger(value.revision) || !Array.isArray(value.entries)) throw new Error('Die Speicherbestätigung ist unvollständig. Bitte den aktuellen Stand prüfen.');
      documents.set(date, { date, revision: value.revision, entries: value.entries.filter(record => ['note', 'task'].includes(record.kind)) }); loaded = true; render();
      onChanged(date); if (date > rangeEnd || date < rangeStart()) { rangeEnd = date; $('workspace-range-end').value = date; }
      await loadRange(); if (version !== generation) return false;
      message(operation === 'delete' ? 'Eintrag gelöscht.' : 'Gespeichert. In deinem privaten Assistenten verfügbar.'); return true;
    } catch (error) { if (version === generation) message(error.name === 'AbortError' ? 'Speicherbestätigung fehlt. Dein Entwurf bleibt erhalten; mit erneutem Speichern entsteht keine zweite Kopie.' : error.message); return false; }
    finally { if (version === generation) { saving = false; permission(); render(); } }
  }
  $('workspace-form').addEventListener('input', event => { if (['workspace-kind', 'workspace-date'].includes(event.target.id)) return; const state = draft(); if (state) { state.dirty = true; capture(); $('workspace-draft-status').textContent = 'Entwurf erhalten · noch nicht gespeichert · nur in diesem Tab.'; } });
  $('workspace-form').addEventListener('change', event => { if (['workspace-kind', 'workspace-date'].includes(event.target.id)) return; const state = draft(); if (state) { state.dirty = true; capture(); } });
  $('workspace-kind').addEventListener('change', () => chooseDraft(selectedDay, $('workspace-kind').value));
  for (const kind of ['note', 'task']) $('workspace-quick-' + kind).addEventListener('click', () => {
    if (!session.canWrite || saving) return;
    chooseDraft(berlinDay(), kind);
    $('workspace-' + (kind === 'task' ? 'title' : 'note')).focus();
    $('workspace-form').scrollIntoView({ block: 'nearest', behavior: 'auto' });
  });
  $('workspace-date').addEventListener('change', () => { const date = $('workspace-date').value; if (validDay(date)) chooseDraft(date, draft()?.kind ?? 'note'); });
  $('workspace-form').addEventListener('submit', async event => {
    event.preventDefault(); if (!session.canWrite || saving || !$('workspace-form').reportValidity()) return; capture(); const state = draft();
    if (state.kind === 'note' && !state.note.trim()) { message('Bitte gib einen Notiztext ein.'); $('workspace-note').focus(); return; }
    if (state.kind === 'task' && !state.title.trim()) { message('Bitte benenne die Aufgabe.'); $('workspace-title').focus(); return; }
    if (state.conflict) { message('Bitte zuerst den geänderten Stand prüfen und unter dem Entwurf bestätigen.'); return; }
    const entry = { id: state.id ?? state.pendingId ?? crypto.randomUUID(), kind: state.kind }; state.pendingId = entry.id;
    if (state.title.trim()) entry.title = state.title.trim(); if (state.note.trim()) entry.note = state.note.trim();
    if (state.kind === 'task') { entry.status = state.status; if (state.dueDate) entry.dueDate = state.dueDate; }
    else if (state.at) entry.at = state.at;
    const key = currentKey;
    if (await mutate(state.date, state.baseRevision, 'upsert', entry, null, state)) { drafts.delete(key); if (currentKey === key) { currentKey = ''; chooseDraft(state.date, state.kind); } }
  });
  $('workspace-reset').addEventListener('click', () => { drafts.delete(currentKey); currentKey = ''; chooseDraft(selectedDay, $('workspace-kind').value); message('Entwurf verworfen.'); });
  $('workspace-rebase').addEventListener('click', async () => { const state = draft(), version = generation; try { const revision = await currentRevision(state.date); if (revision === null || version !== generation) return; state.baseRevision = revision; state.conflict = false; showDraft(); message('Aktueller Stand bestätigt. Dein Entwurf kann jetzt gespeichert werden.'); } catch (error) { message(error.message); } });
  $('workspace-period').addEventListener('change', () => { rangeDays = Number($('workspace-period').value); visibleLimit = 50; loadRange(); });
  $('workspace-range-end').addEventListener('change', () => { if (!validDay($('workspace-range-end').value)) return; rangeEnd = $('workspace-range-end').value; visibleLimit = 50; loadRange(); });
  for (const id of ['workspace-search', 'workspace-filter', 'workspace-sort']) $(id).addEventListener(id.endsWith('search') ? 'input' : 'change', () => { visibleLimit = 50; render(); });
  function moveRange(end) {
    rangeEnd = [end, '2000-01-01', '2100-12-31'].sort()[1]; $('workspace-range-end').value = rangeEnd; visibleLimit = 50; loadRange();
  }
  $('workspace-range-previous').addEventListener('click', () => moveRange(shifted(rangeEnd, -rangeDays)));
  $('workspace-range-next').addEventListener('click', () => moveRange(shifted(rangeEnd, rangeDays)));
  $('workspace-range-today').addEventListener('click', () => moveRange(berlinDay()));
  for (const type of ['today', 'overdue', 'undated']) $('workspace-focus-' + type).addEventListener('click', () => {
    $('view-workspace').click(); $('workspace-search').value = ''; $('workspace-filter').value = 'task-' + type; $('workspace-sort').value = 'due'; visibleLimit = 50; render();
    $('workspace-library-title').tabIndex = -1; $('workspace-library-title').focus();
  });
  $('workspace-more').addEventListener('click', () => { visibleLimit += 50; render(); });
  $('workspace-refresh').addEventListener('click', () => { if (!busy) loadRange(); });
  $('workspace-browse').addEventListener('click', () => document.getElementById('view-workspace').click());
  $('workspace-owner').addEventListener('click', () => onOwner());
  window.addEventListener('beforeunload', event => { if ([...drafts.values()].some(state => state.dirty)) { event.preventDefault(); event.returnValue = ''; } });
  $('workspace-range-end').value = rangeEnd; chooseDraft(); permission(); render();
  return {
    setSession(value) { const wasReadable = session.canRead; session = { canRead: value.canRead === true, canWrite: value.canWrite === true, csrfToken: value.csrfToken }; permission(); if (!session.canRead) return; if (!wasReadable || !loaded) return loadRange(); },
    setDay(date) { if (validDay(date)) chooseDraft(date, draft()?.kind ?? 'note'); },
    show(mode = 'overview') { overview = mode === 'overview'; $('workspace-view').hidden = !['overview', 'workspace'].includes(mode); $('workspace-heading').textContent = overview ? 'Wichtiges bleibt bei dir.' : 'Deine Notizen. Deine nächsten Schritte.'; visibleLimit = 50; render(); },
    refresh() { if (session.canRead && !busy && !saving) return loadRange(); },
    invalidate() { loaded = false; },
    reset() { generation++; rangeVersion++; controllers.forEach(c => c.abort()); controllers.clear(); documents.clear(); drafts.clear(); currentKey = ''; session = { canRead: false, canWrite: false }; busy = saving = loaded = false; loadedRange = ''; rangeFailed = false; $('workspace-search').value = ''; $('workspace-filter').value = 'all'; $('workspace-sort').value = 'updated'; $('workspace-note').value = ''; $('workspace-title').value = ''; selectedDay = berlinDay(); chooseDraft(); permission(); message(''); render(); }
  };
}
