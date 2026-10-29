const $ = id => document.getElementById(id);
const dayNow = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
const node = (tag, text) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; return el; };
// Read-only composition of existing measurements. No inferred activities or writes.
export function createToday({ onLocked, onDay, onTrends }) {
  let allowed = false, visible = true, version = 0, controller, fetched = 0, busy = false;
  function clear(message) {
    $('today-content').replaceChildren(); $('today-content').hidden = true;
    $('today-message').textContent = message;
  }
  function render(model, date) {
    const day = model.days.find(item => item.date === date);
    if (!day) throw new Error('Missing requested day');
    const metrics = day.health?.metrics ?? {}, content = $('today-content');
    content.replaceChildren(); content.hidden = false;
    $('today-message').textContent = 'Heute · ' + new Date(date + 'T12:00:00Z').toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'long' }) + ' · noch unvollständig';
    const grid = node('div'); grid.className = 'overview-grid';
    for (const [key, title, unit, factor] of [['steps_total', 'Schritte', '', 1], ['sleep_total_seconds', 'Erfasster Schlaf', 'Std.', 1 / 3600], ['resting_heart_rate_merged_avg', 'Ruhepuls', 'bpm', 1], ['exercise_time_total', 'Training', 'Min.', 1]]) {
      const value = metrics[key]?.value, card = node('article');
      card.append(node('span', title), node('strong', Number.isFinite(value) ? number.format(value * factor) + (unit ? ' ' + unit : '') : '–'), node('small', Number.isFinite(value) ? 'Apple Health · heutiger Quelltag' : 'Heute noch kein Wert'));
      grid.append(card);
    }
    content.append(grid, node('h3', 'Aus deinen Aufzeichnungen'));
    const lines = node('ul');
    if (day.gps?.present) {
      if (Number.isFinite(day.gps.tripCount) && Number.isFinite(day.gps.stayCount)) lines.append(node('li', `${day.gps.tripCount} Wege und ${day.gps.stayCount} Aufenthalte aus GPS-Punkten abgeleitet. Der Zweck eines Aufenthalts ist unbekannt.`));
      if (day.gps.gaps) lines.append(node('li', `${day.gps.gaps} Aufzeichnungslücken. Dazwischen wird kein Verlauf ergänzt.`));
    } else lines.append(node('li', 'Heute ist noch kein GPS-Verlauf verfügbar. Health-Daten erscheinen unabhängig davon.'));
    const count = Object.values(metrics).filter(metric => Number.isFinite(metric?.value)).length;
    lines.append(node('li', count ? `${count} Gesundheitswerte einschließlich berechneter Werte sind für heute vorhanden. In den Verläufen findest du alle verfügbaren Metriken.` : 'Heute sind noch keine Health-Werte angekommen. Fehlende Messungen werden nicht als null gewertet.'));
    const previous = model.days.filter(item => item.date < date && Number.isFinite(item.health?.metrics?.resting_heart_rate_merged_avg?.value));
    const current = metrics.resting_heart_rate_merged_avg?.value;
    if (previous.length >= 3 && Number.isFinite(current)) {
      const mean = previous.reduce((sum, item) => sum + item.health.metrics.resting_heart_rate_merged_avg.value, 0) / previous.length;
      const delta = current - mean;
      lines.append(node('li', `Dein heutiger Ruhepuls liegt ${number.format(Math.abs(delta))} bpm ${delta < 0 ? 'unter' : 'über'} dem Mittel der ${previous.length} vorhandenen Vortage. Rechnerischer Vergleich, keine Aussage zur Ursache.`));
    }
    content.append(lines);
    const actions = node('div'); actions.className = 'today-actions';
    const trends = node('button', 'Gesundheitsverläufe ansehen'), timeline = node('button', 'Heutigen Verlauf öffnen');
    trends.type = timeline.type = 'button'; trends.addEventListener('click', onTrends); timeline.addEventListener('click', () => onDay(date));
    actions.append(trends, timeline); content.append(actions);
    const sync = day.health?.sourceLastSyncAt;
    const status = node('p', sync ? 'Health-Quelle zuletzt synchronisiert: ' + new Date(sync).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }) : 'Noch kein Synchronisierungszeitpunkt für die heutige Health-Quelle verfügbar.'); status.className = 'subtle'; content.append(status);
    const details = node('details'), summary = node('summary', 'Daten und Verbindungen'); details.append(summary, node('p', 'Diese Übersicht entsteht automatisch aus den bereits gespeicherten Quellen. Neue Informationen aus ChatGPT oder Automationen benötigen eine gesonderte Übertragung zu WerkTag.'));
    const link = node('a', 'Verbindungen im Konto prüfen'); link.href = '/konto'; details.append(link); content.append(details);
  }
  async function refresh(force = false) {
    if (!allowed || !visible || document.hidden || busy || (!force && Date.now() - fetched < 60000)) return;
    const request = ++version, date = dayNow(), from = new Date(date + 'T12:00:00Z'); from.setUTCDate(from.getUTCDate() - 6);
    controller?.abort(); controller = new AbortController(); busy = true;
    try {
      const response = await fetch('/assistenz/statistics?' + new URLSearchParams({ from: from.toISOString().slice(0, 10), to: date, bucket: 'day' }), { cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
      if (request !== version) return;
      if (response.status === 401) { reset(); onLocked(); return; }
      if (!response.ok) throw new Error();
      const model = await response.json(); if (request !== version) return;
      if (!Array.isArray(model.days) || model.from !== from.toISOString().slice(0, 10) || model.to !== date) throw new Error();
      render(model, date); fetched = Date.now();
    } catch (error) {
      if (request === version && error.name !== 'AbortError') clear('Dein Tagesüberblick ist gerade nicht erreichbar. Versuche es erneut.');
    } finally { if (request === version) busy = false; }
  }
  function reset() { allowed = false; retry.disabled = true; version++; controller?.abort(); busy = false; fetched = 0; clear('Melde dich an, um deinen Tagesüberblick zu sehen.'); }
  const retry = node('button', 'Überblick aktualisieren'); retry.type = 'button'; retry.disabled = true; retry.addEventListener('click', () => refresh(true)); $('today-overview').append(retry);
  return { refresh, reset, unlock() { allowed = true; retry.disabled = false; refresh(); }, show(value) { visible = value; $('today-overview').hidden = !value; if (value) refresh(); else { version++; controller?.abort(); busy = false; } } };
}
