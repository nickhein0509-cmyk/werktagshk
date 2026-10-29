import { Component } from 'react';
import type { ReactNode } from 'react';
import './route-boundary.css';

export function RouteLoading() {
  return (
    <main className="route-state" aria-labelledby="route-loading-title">
      <a href="/projekte" className="route-state__brand">WerkTag</a>
      <h1 id="route-loading-title">Dein Bereich wird geladen.</h1>
      <p role="status">Einen Moment bitte. WerkTag bereitet die Ansicht vor.</p>
      <a className="route-state__action" href="/projekte">Zur Projektauswahl</a>
    </main>
  );
}

/** A failed route import must leave a way back, without automatic reload loops. */
export class RouteBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="route-state" aria-labelledby="route-error-title">
        <a href="/projekte" className="route-state__brand">WerkTag</a>
        <div role="alert">
          <h1 id="route-error-title">Dieser Bereich konnte nicht geöffnet werden.</h1>
          <p>Prüfe deine Verbindung und lade die Seite erneut. Du kannst auch zur Projektauswahl zurückkehren.</p>
        </div>
        <div className="route-state__actions">
          <button className="route-state__action" onClick={() => window.location.reload()}>
            Seite neu laden
          </button>
          <a className="route-state__action route-state__action--secondary" href="/projekte">
            Zur Projektauswahl
          </a>
        </div>
      </main>
    );
  }
}
