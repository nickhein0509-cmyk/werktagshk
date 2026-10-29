// Presentation only: the existing route analysis owns filtering and distances.
// Markers retain the first/last accepted measurement even when line smoothing
// suppresses a small movement. No coordinates or recording gaps are filled in.
export function measuredEndpoints(points) {
  const accepted = points.filter(point => point && Number.isFinite(point.tst) && point.tst >= 0 &&
    Number.isFinite(point.lat) && Math.abs(point.lat) <= 90 &&
    Number.isFinite(point.lon) && Math.abs(point.lon) <= 180 &&
    (point.acc === undefined || (Number.isFinite(point.acc) && point.acc >= 0 && point.acc <= 100)));
  return accepted.length ? { start: accepted[0], end: accepted.at(-1) } : null;
}

export function recorderKey(recorder) {
  return recorder && typeof recorder.source === 'string' && typeof recorder.device === 'string'
    ? JSON.stringify([recorder.source, recorder.device]) : '';
}

export function recorderLabel(recorder) {
  return (recorder.source === 'werktag_ios' ? 'WerkTag iPhone' : recorder.source) + ' · ' + recorder.device;
}

export function recorderQuery(date, recorder) {
  const query = new URLSearchParams({ date });
  if (recorderKey(recorder)) { query.set('source', recorder.source); query.set('device', recorder.device); }
  return query;
}

export function renderJourneyMap({ L, layers, data, models, selection, onSelect, time, date }) {
  const bounds = L.latLngBounds([]), journal = data.journal;
  const focusedMarker = document.activeElement?.classList.contains('journey-marker') ? document.activeElement.dataset.mapMarkerKey : null;
  layers.clearLayers();
  const addBounds = layer => {
    if (layer.getBounds) bounds.extend(layer.getBounds());
    else if (layer.getLatLng) bounds.extend(layer.getLatLng());
  };
  const trips = [...journal.trips].sort((a, b) => Number(a.id === selection?.id) - Number(b.id === selection?.id));
  for (const trip of trips) {
    const foreground = !selection || selection.id === trip.id;
    for (const part of models.get(trip.id).segments) {
      if (part.length < 2) continue;
      const coordinates = part.map(point => [point.lat, point.lon]);
      const selected = selection?.id === trip.id;
      L.polyline(coordinates, {
        className: 'journey-route-halo', color: '#fffdf8', weight: foreground ? (selected ? 12 : 10) : 6,
        opacity: foreground ? .96 : .65, lineCap: 'round', lineJoin: 'round', interactive: false,
      }).addTo(layers);
      const line = L.polyline(coordinates, {
        className: 'journey-route' + (foreground ? selected ? ' is-selected' : '' : ' is-context'),
        color: selected ? '#a55232' : '#174d51', weight: foreground ? (selected ? 6 : 4.5) : 2.5,
        opacity: foreground ? 1 : .4, lineCap: 'round', lineJoin: 'round',
      }).on('click', () => onSelect(trip.id)).addTo(layers);
      if (foreground) addBounds(line);
    }
  }
  const marker = (point, kind, text, title, entry, foreground = true) => {
    const badge = document.createElement('span');
    badge.className = 'journey-marker-badge'; badge.textContent = text; badge.setAttribute('aria-hidden', 'true');
    const icon = L.divIcon({
      className: 'journey-marker journey-marker--' + kind + (foreground ? '' : ' is-context'),
      html: badge, iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -18],
    });
    const pin = L.marker([point.lat, point.lon], { icon, title, alt: title, keyboard: true, zIndexOffset: kind === 'stay' ? 100 : 0 }).addTo(layers);
    pin.getElement()?.setAttribute('aria-label', title);
    if (pin.getElement()) pin.getElement().dataset.mapMarkerKey = entry?.id ?? kind;
    if (entry) {
      pin.getElement()?.setAttribute('aria-pressed', String(selection?.id === entry.id));
      pin.on('click', () => onSelect(entry.id));
    } else {
      const content = document.createElement('span'); content.textContent = title; pin.bindPopup(content);
    }
    // Leaflet supports Enter. Space gives these role=button markers the same
    // keyboard behavior as the linked, native timeline buttons.
    pin.getElement()?.addEventListener('keydown', event => {
      if (event.key === ' ') { event.preventDefault(); if (entry) onSelect(entry.id); else pin.openPopup(); }
    });
    if (foreground) addBounds(pin);
    return pin;
  };
  journal.stays.forEach((stay, index) => {
    const foreground = !selection || selection.id === stay.id;
    if (selection?.id === stay.id) {
      const circle = L.circle([stay.center.lat, stay.center.lon], {
        className: 'journey-stay-area', radius: journal.settings.radiusMetres,
        color: '#a55232', weight: 2, dashArray: '4 6', fillColor: '#c98b62', fillOpacity: .13, interactive: false,
      }).addTo(layers);
      addBounds(circle);
    }
    marker(stay.center, 'stay', String(index + 1), 'Aufenthalt ' + (index + 1) + ' · ' + time(stay.startTimestamp) + '–' + time(stay.endTimestamp) + ' Uhr', stay, foreground);
  });
  if (selection?.kind !== 'stay') {
    const points = selection ? data.points.slice(selection.startIndex, selection.endIndex + 1) : data.points;
    const endpoints = measuredEndpoints(points);
    if (endpoints) {
      const description = (label, point) => label + ' · ' + date(point.tst) + ' · ' + time(point.tst) + ' Uhr' +
        (point.acc === undefined ? ' · Genauigkeit unbekannt' : ' · Genauigkeit ±' + Math.round(point.acc) + ' m');
      if (endpoints.start.lat === endpoints.end.lat && endpoints.start.lon === endpoints.end.lon) {
        marker(endpoints.end, 'combined', 'S·E', description('Start ' + time(endpoints.start.tst) + ' Uhr / letzte Messung', endpoints.end));
      } else {
        marker(endpoints.start, 'start', 'S', description('Start', endpoints.start));
        marker(endpoints.end, 'end', 'E', description('Letzte gültige Messung', endpoints.end));
      }
    }
  }
  if (focusedMarker) layers.getLayers().find(layer => layer.getElement?.()?.dataset.mapMarkerKey === focusedMarker)?.getElement().focus({ preventScroll: true });
  return { bounds, hasContent: layers.getLayers().length > 0 };
}
