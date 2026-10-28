const $ = id => document.getElementById(id);
const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const berlinDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const shortDate = day => new Date(day + 'T12:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', timeZone: 'Europe/Berlin' });
const shiftDay = (day, shift) => { const value = new Date(day + 'T12:00:00Z'); value.setUTCDate(value.getUTCDate() + shift); return value.toISOString().slice(0, 10); };
const metrics = [
  ['gps.distanceMetres', 'GPS-Strecke · Rohdaten', 'km', 0.001],
  ['steps_total', 'Schritte', '', 1],
  ['active_energy_total', 'Aktive Energie', 'kcal', 1],
  ['exercise_time_total', 'Trainingszeit', 'Min.', 1],
  ['distance_walk_run_total', 'Geh- / Laufstrecke · Health', 'km', 0.001],
  ['sleep_total_seconds', 'Erfasster Schlaf · Quelltag', 'Std.', 1 / 3600],
  ['heart_rate_merged_avg', 'Puls · Tagesmittel', 'bpm', 1],
  ['resting_heart_rate_merged_avg', 'Ruhepuls', 'bpm', 1],
  ['hrv_sdnn_merged_avg', 'HRV · SDNN', 'ms', 1],
  ['time_in_daylight_total', 'Zeit im Tageslicht', 'Min.', 1],
  ['respiratory_rate_merged_avg', 'Atemfrequenz · Tagesmittel', '/Min.', 1],
  ['vo2_max', 'VO₂max · übermittelter Wert', 'ml/kg/Min.', 1],
  ['stand_time_total', 'Stehzeit', 'Min.', 1],
  ['flights_climbed_total', 'Etagen', '', 1],
  ['basal_energy_total', 'Ruheenergie', 'kcal', 1]
];
const descriptor = key => metrics.find(item => item[0] === key) ?? metrics[0];
const valueOf = (item, key) => key === 'gps.distanceMetres' ? item?.gps?.distanceMetres : item?.health?.metrics?.[key]?.value;
const formatted = (value, key, withUnit = true) => {
  if (!Number.isFinite(value)) return '–';
  const [, , unit, factor] = descriptor(key);
  const formatter = ['steps_total', 'flights_climbed_total'].includes(key) ? integer : number;
  return formatter.format(value * factor) + (withUnit && unit ? ' ' + unit : '');
};
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
export function createStatistics({ onDay, onLocked }) {
  let visible = false, model = null, version = 0, controller, lastFingerprint = '', lastFetch = 0, selectedBucket = null;
  const message = text => { $('statistics-message').hidden = false; $('statistics-message').textContent = text; };
  function renderSummary() {
    const summary = model.summary, cards = [
      ['gps.distanceMetres', 'GPS-Strecke · Rohdaten', 'Ungeglättete Wege zwischen Messpunkten'],
      ['steps_total', 'Schritte', 'Gespeicherte Health-Tageswerte'],
      ['active_energy_total', 'Aktive Energie', 'Gespeicherte Health-Tageswerte'],
      ['exercise_time_total', 'Trainingszeit', 'Gespeicherte Health-Tageswerte']
    ];
    $('statistics-summary').replaceChildren(...cards.map(([key, title, note]) => {
      const card = element('article'), count = key.startsWith('gps.') ? summary?.gps?.presentDays : summary?.health?.metrics?.[key]?.presentDays;
      card.append(element('span', title), element('strong', formatted(valueOf(summary, key), key)), element('small', note + (Number.isInteger(count) ? ' · ' + count + '/' + model.quality.totalDays + ' Tage' : '')));
      return card;
    }));
  }
  function renderManualSummary() {
    const target = $('statistics-context-summary'), context = model.summary?.context;
    target.replaceChildren(element('h3', 'Weitere Einträge · manuell'));
    if (!context?.present) { target.append(element('p', 'Für diesen Zeitraum sind noch keine manuellen Einträge gespeichert.', 'subtle')); return; }
    const grid = element('div', undefined, 'manual-summary-grid');
    const card = (title, lines, extraClass = '') => {
      const item = element('article', undefined, extraClass); item.append(element('strong', title));
      for (const line of lines) item.append(element('p', line, 'subtle')); grid.append(item);
    };
    if (context.counts?.note) card('Notizen', [number.format(context.counts.note) + ' bewusst gespeicherte Notizen']);
    if (context.counts?.task) card('Aufgaben', [number.format(context.counts.task) + ' manuelle Aufgaben · kein Aktivitätsnachweis']);
    const sportNames = { basketball: 'Basketball', calisthenics: 'Calisthenics', skateboarding: 'Skateboard', walking: 'Gehen', running: 'Laufen', cycling: 'Radfahren', other: 'Andere Sportart' };
    if (context.workouts?.length) card('Training', context.workouts.map(entry => (sportNames[entry.sport] ?? entry.sport) + ' · ' + entry.count + ' Einträge · ' + number.format(entry.durationSeconds / 60) + ' Min.' + (entry.sets?.count ? ' · ' + number.format(entry.sets.value) + ' Sätze' : '') + (entry.reps?.count ? ' · ' + number.format(entry.reps.value) + ' Wiederholungen' : '') + (entry.rpe?.count ? ' · Anstrengung Ø ' + number.format(entry.rpe.value) + '/10 (Selbstauskunft)' : '')));
    if (context.activityLabels?.length) card('Deine Orts- / Tätigkeitslabels', context.activityLabels.map(entry => entry.label + ' · ' + entry.count + ' Einträge · ' + number.format(entry.durationSeconds / 60) + ' Min.'));
    const checkin = [['energy', 'Energie'], ['mood', 'Stimmung'], ['soreness', 'Muskelkater']].filter(([key]) => Number.isFinite(context.checkin?.[key]?.value)).map(([key, title]) => title + ' Ø ' + number.format(context.checkin[key].value) + '/5 · ' + context.checkin[key].count + ' Angaben');
    if (checkin.length) card('Check-ins · Mittel der Selbstauskünfte', checkin);
    if (Number.isFinite(context.hydration?.amountMl)) card('Trinkmenge', [number.format(context.hydration.amountMl) + ' ml · ' + context.hydration.count + ' manuelle Einträge']);
    const nutrition = [['energyKcal', 'Energie', 'kcal'], ['proteinG', 'Eiweiß', 'g'], ['carbsG', 'Kohlenhydrate', 'g'], ['fatG', 'Fett', 'g']].filter(([key]) => Number.isFinite(context.nutrition?.[key]?.value)).map(([key, title, unit]) => title + ': ' + number.format(context.nutrition[key].value) + ' ' + unit + ' · ' + context.nutrition[key].count + ' Angaben');
    if (nutrition.length) card('Ernährung · protokollierte Summen', nutrition);
    if (Number.isFinite(context.weight?.kg)) card('Körpergewicht · zuletzt datierter Eintrag', [number.format(context.weight.kg) + ' kg · ' + shortDate(context.weight.date), context.weight.chronologyAmbiguous ? 'Mehrere Angaben ohne eindeutige zeitliche Reihenfolge.' : context.weight.observedAt ? 'Erfasst: ' + new Date(context.weight.observedAt).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }) : 'Für diesen Eintrag ist keine Uhrzeit angegeben.']);
    if (context.planned?.count) card('Geplante Termine · separat', [context.planned.count + ' Termine · ' + number.format(context.planned.durationSeconds / 60) + ' geplante Min.', 'Kein Beleg für Anwesenheit, Training oder tatsächliche Dauer.'], 'planned-card');
    target.append(grid, element('p', 'Ausschließlich protokollierte manuelle Angaben. Zeiten zählen zum Eintragstag; überlappende Trainings- und Tätigkeitszeiten werden nicht als gesamte Bewegungszeit addiert.' + (context.needsReviewCount ? ' ' + context.needsReviewCount + ' Zuordnungen sollten geprüft werden.' : ''), 'subtle'));
  }
  function renderDays() {
    const key = $('statistics-metric').value, days = model.days.filter(day => !selectedBucket || day.date >= selectedBucket.from && day.date <= selectedBucket.to);
    $('statistics-value-heading').textContent = descriptor(key)[1];
    $('statistics-days-title').textContent = selectedBucket ? shortDate(selectedBucket.from) + ' – ' + shortDate(selectedBucket.to) : 'Einzelne Tage';
    $('statistics-all-days').hidden = !selectedBucket;
    $('statistics-days').replaceChildren(...days.map(day => {
      const row = element('tr'), dateCell = element('td'), button = element('button', shortDate(day.date));
      button.type = 'button'; button.className = 'day-link'; button.setAttribute('aria-label', 'Tag ' + shortDate(day.date) + ' in der Karte öffnen');
      button.addEventListener('click', () => onDay(day.date)); dateCell.append(button);
      if (day.provisional) dateCell.append(element('span', 'vorläufig', 'pill provisional'));
      const valueCell = element('td', formatted(valueOf(day, key), key)), evidence = [];
      if (day.gps?.present) evidence.push('GPS');
      if (day.health?.present) evidence.push('Health');
      const evidenceCell = element('td', evidence.length ? evidence.join(' · ') : 'Keine Daten', evidence.length ? 'subtle' : 'missing');
      row.append(dateCell, valueCell, evidenceCell); return row;
    }));
  }
  function renderChart() {
    const key = $('statistics-metric').value, buckets = model.buckets ?? [], data = buckets.map(bucket => valueOf(bucket, key));
    const max = Math.max(1, ...data.filter(Number.isFinite)), width = Math.max(300, Math.min(900, $('statistics-chart').clientWidth || 760)), height = 230, baseline = 186, left = 48, plot = width - left - 20;
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', descriptor(key)[1] + ' im gewählten Zeitraum; Details stehen in der Tabelle darunter.');
    const add = (tag, attrs, text) => { const node = document.createElementNS(ns, tag); for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value)); if (text !== undefined) node.textContent = text; return node; };
    svg.append(add('line', { x1: left, x2: width - 20, y1: baseline, y2: baseline, class: 'chart-axis' }));
    svg.append(add('text', { x: left - 8, y: 20, 'text-anchor': 'end', class: 'chart-label' }, formatted(max, key, false)));
    svg.append(add('text', { x: left - 8, y: baseline + 4, 'text-anchor': 'end', class: 'chart-label' }, '0'));
    buckets.forEach((bucket, i) => {
      const step = plot / Math.max(1, buckets.length), x = left + step * i + step / 2, value = data[i];
      const group = add('g', { class: 'chart-bucket', role: 'button', tabindex: 0, 'aria-label': shortDate(bucket.from) + (bucket.from !== bucket.to ? ' bis ' + shortDate(bucket.to) : '') + ': ' + formatted(value, key) + (bucket.provisional ? ', vorläufig' : '') });
      group.append(add('rect', { x: x - step / 2 + 2, y: 12, width: Math.max(1, step - 4), height: baseline - 6, fill: 'transparent' }));
      if (Number.isFinite(value)) {
        const h = Math.max(2, value / max * 150);
        group.append(add('rect', { x: x - Math.min(22, step * 0.32), y: baseline - h, width: Math.max(2, Math.min(44, step * 0.64)), height: h, rx: 3, class: bucket.provisional || bucket.partial ? 'chart-bar provisional-bar' : 'chart-bar' }));
      } else group.append(add('line', { x1: x, x2: x, y1: baseline - 16, y2: baseline - 2, class: 'chart-missing' }));
      group.append(add('title', {}, shortDate(bucket.from) + ': ' + (Number.isFinite(value) ? formatted(value, key) : 'Kein Wert gespeichert')));
      if (buckets.length <= 10 || i === 0 || i === buckets.length - 1 || i % Math.ceil(buckets.length / (width < 500 ? 4 : 7)) === 0) group.append(add('text', { x, y: baseline + 22, 'text-anchor': 'middle', class: 'chart-label' }, shortDate(bucket.from)));
      const choose = () => { if (bucket.from === bucket.to) onDay(bucket.from); else { selectedBucket = bucket; renderDays(); $('statistics-days-title').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } };
      group.addEventListener('click', choose);
      group.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); } }); svg.append(group);
    });
    $('statistics-chart').replaceChildren(svg);
    const average = model.buckets?.some(bucket => bucket.health?.metrics?.[key]?.aggregation === 'mean-of-daily-values');
    const latestObservation = key === 'vo2_max';
    $('statistics-chart-note').textContent = (latestObservation ? 'Letzte übermittelte Beobachtung je Zeitraum; kein Tagesmittel. ' : average ? 'Mittel der vorhandenen Tageswerte; kein Mittel aller Einzelmessungen. ' : 'Summen der vorhandenen Tage. ') + (key === 'gps.distanceMetres' ? 'GPS-Strecken sind ungeglättete Näherungen aus den Originalpunkten und können Fahrten enthalten. Die bereinigte Tagesansicht kann davon abweichen. ' : '') + 'Lücken bedeuten fehlende Werte. Umrandete Balken können unvollständig sein. Tippe einen Balken für die Tagesansicht.';
  }
  function render() {
    $('statistics-message').hidden = true; $('statistics-content').hidden = false;
    const currentMetric = $('statistics-metric').value, available = metrics.filter(([key]) => key.startsWith('gps.') || model.days.some(day => Number.isFinite(valueOf(day, key))));
    $('statistics-metric').replaceChildren(...available.map(([key, label]) => { const option = element('option', label); option.value = key; return option; }));
    $('statistics-metric').value = available.some(([key]) => key === currentMetric) ? currentMetric : available[0][0];
    $('statistics-coverage').textContent = model.quality.presentGpsDays + '/' + model.quality.totalDays + ' Tage mit GPS · ' + model.quality.presentHealthDays + '/' + model.quality.totalDays + ' mit Health';
    $('statistics-quality').textContent = 'Zeitraum ' + shortDate(model.from) + ' – ' + shortDate(model.to) + '. ' + (model.quality.provisional ? 'Der laufende Tag ist vorläufig. ' : '') + 'Vorhandene Tage belegen keine lückenlose Aufzeichnung. Health-Tageswerte gelten für den ganzen Quelltag und werden keiner GPS-Teilstrecke zugeordnet.';
    $('statistics-source').textContent = 'Berechnet: ' + new Date(model.computedAt).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }) + ' Uhr · Berliner Zeit · Wochenbeginn Montag';
    renderSummary(); renderManualSummary(); renderChart(); renderDays();
  }
  async function refresh(force = false) {
    if (!visible || document.hidden) return;
    if (!force && Date.now() - lastFetch < 60000) return;
    controller?.abort(); controller = new AbortController(); const requestVersion = ++version;
    const to = berlinDay(), from = shiftDay(to, -(Number($('statistics-period').value) - 1)), bucket = $('statistics-bucket').value;
    if (!model) message('Statistik wird geladen …');
    try {
      const r = await fetch('/assistenz/statistics?' + new URLSearchParams({ from, to, bucket }), { cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
      if (requestVersion !== version) return;
      if (r.status === 401) { reset(); onLocked(); return; }
      if (!r.ok) throw new Error();
      const next = await r.json(); if (requestVersion !== version) return;
      if (!Array.isArray(next.days) || !Array.isArray(next.buckets) || !next.quality) throw new Error();
      model = next; lastFetch = Date.now(); render();
    } catch (error) { if (requestVersion === version && error.name !== 'AbortError') message('Statistik vorübergehend nicht erreichbar. Erneuter Versuch folgt; gespeicherte Daten bleiben erhalten.'); }
  }
  function reset() {
    version++; controller?.abort(); model = null; lastFetch = 0; lastFingerprint = ''; selectedBucket = null;
    $('statistics-content').hidden = true; $('statistics-summary').replaceChildren(); $('statistics-days').replaceChildren(); $('statistics-chart').replaceChildren(); message('Öffne deinen persönlichen Kartenlink für die Statistik.');
  }
  $('statistics-period').addEventListener('change', () => { selectedBucket = null; refresh(true); });
  $('statistics-bucket').addEventListener('change', () => { selectedBucket = null; refresh(true); });
  $('statistics-metric').addEventListener('change', () => { if (model) { renderChart(); renderDays(); } });
  $('statistics-all-days').addEventListener('click', () => { selectedBucket = null; if (model) renderDays(); });
  return {
    show(value) { visible = value; $('statistics-view').hidden = !value; if (value) refresh(true); else { version++; controller?.abort(); } },
    refresh,
    invalidate(fingerprint) { if (fingerprint !== lastFingerprint) { lastFingerprint = fingerprint; lastFetch = 0; if (visible) refresh(); } },
    reset
  };
}
