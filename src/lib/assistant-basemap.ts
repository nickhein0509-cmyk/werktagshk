import { Map as VectorMap, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';

// Vite emits a real same-origin worker: no remote script or blob worker is needed.
setWorkerUrl(workerUrl);

type Point = { x: number; y: number };
type Host = {
  getCenter(): { lat: number; lng: number };
  getZoom(): number;
  getSize(): Point;
  getPane(name: string): HTMLElement;
  containerPointToLayerPoint(point: [number, number]): Point;
  on(events: string, callback: () => void): void;
  off(events: string, callback: () => void): void;
};
type Layer = { addTo(map: Host): Layer; remove(): void };
type Leaflet = {
  Layer: { extend(methods: {
    onAdd(map: Host): void;
    onRemove(): void;
    getAttribution(): string;
  }): new () => Layer };
  DomUtil: { setPosition(element: HTMLElement, point: Point): void };
};
export type BasemapState = 'loading' | 'ready' | 'error';

// This deliberately small adapter uses public Leaflet/MapLibre APIs. Leaflet
// owns gestures and measured route overlays; MapLibre only paints the basemap.
// A second imported Leaflet instance would break the existing capability app.
export function createVectorLayer({ L, onState }: {
  L: Leaflet;
  onState(state: BasemapState): void;
}): Layer {
  let host: Host | undefined, container: HTMLDivElement | undefined;
  let vector: VectorMap | undefined, removed = false, failed = false, sourceContent = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let lastSize = '', lastView = '';
  const state = (value: BasemapState) => { if (!removed) onState(value); };
  const fail = () => { failed = true; clearTimeout(timeout); state('error'); };
  const loading = () => {
    if (removed || failed) return;
    state('loading'); clearTimeout(timeout); timeout = setTimeout(fail, 20000);
  };
  const update = () => {
    if (!host || !container || !vector || removed) return;
    const size = host.getSize(), center = host.getCenter();
    // Cancel the moving Leaflet pane's offset, keeping GL's viewport aligned.
    L.DomUtil.setPosition(container, host.containerPointToLayerPoint([0, 0]));
    const sizeKey = size.x + ':' + size.y;
    if (sizeKey !== lastSize) {
      container.style.width = size.x + 'px'; container.style.height = size.y + 'px';
      vector.resize(); lastSize = sizeKey;
    }
    const viewKey = center.lng + ':' + center.lat + ':' + host.getZoom();
    if (viewKey !== lastView) {
      // MapLibre's 512px world tiles correspond to Leaflet zoom minus one.
      vector.jumpTo({ center: [center.lng, Math.max(-85.051129, Math.min(85.051129, center.lat))], zoom: host.getZoom() - 1 });
      lastView = viewKey;
    }
  };
  const finish = () => {
    if (!vector || removed || failed || !sourceContent || !vector.isStyleLoaded() || !vector.areTilesLoaded()) return;
    // A downloaded style or a blank background is not proof of a usable map.
    if (!vector.queryRenderedFeatures().some(feature => feature.source && vector?.getSource(feature.source)?.type === 'vector')) return;
    clearTimeout(timeout); state('ready');
  };
  const LayerClass = L.Layer.extend({
    onAdd(map) {
      host = map; removed = false; state('loading');
      container = document.createElement('div');
      container.className = 'werktag-vector-basemap';
      container.setAttribute('aria-hidden', 'true');
      const size = host.getSize();
      container.style.width = size.x + 'px'; container.style.height = size.y + 'px';
      host.getPane('tilePane').append(container);
      L.DomUtil.setPosition(container, host.containerPointToLayerPoint([0, 0]));
      try {
        const center = host.getCenter();
        vector = new VectorMap({
          container, style: 'https://tiles.openfreemap.org/styles/liberty',
          center: [center.lng, center.lat], zoom: host.getZoom() - 1,
          interactive: false, attributionControl: false, trackResize: false,
          fadeDuration: 0, renderWorldCopies: true,
        });
        vector.on('error', fail);
        vector.on('idle', finish);
        vector.on('load', () => {
          const style = vector?.getStyle();
          // A downloaded but unusable/empty style can fail immediately rather
          // than leaving a blank surface labelled as a working street map.
          if (!style?.layers.some(layer => 'source' in layer && typeof layer.source === 'string' && style.sources[layer.source]?.type === 'vector')) fail();
          else finish();
        });
        vector.on('sourcedataloading', loading);
        vector.on('sourcedata', event => {
          if (event.sourceDataType === 'content' && event.source.type === 'vector') sourceContent = true;
        });
        vector.getCanvas().addEventListener('webglcontextlost', fail);
        host.on('move zoom resize viewreset', update);
        update();
        loading();
      } catch {
        fail();
      }
    },
    onRemove() {
      removed = true; clearTimeout(timeout);
      host?.off('move zoom resize viewreset', update);
      try { vector?.remove(); }
      finally {
        vector = undefined; container?.remove(); container = undefined; host = undefined;
      }
    },
    getAttribution() {
      return '<a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> · © <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';
    },
  });
  return new LayerClass();
}
