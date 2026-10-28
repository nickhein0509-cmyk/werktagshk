import { ArrowRight, ArrowUpRight, BookOpen, Boxes, Compass, LockKeyhole, Wrench } from 'lucide-react';
import './project-hub.css';

/** Independent entry points for learning, personal assistance and the private catalogue. */
export function ProjectHub() {
  return (
    <div className="project-hub">
      <a className="project-hub__skip" href="#project-hub-main">
        Zur Projektauswahl
      </a>
      <header className="project-hub__header">
        <a className="project-hub__brand" href="/" aria-label="WerkTag SHK Lernbuddy öffnen">
          <span className="project-hub__brand-icon" aria-hidden="true">
            <Wrench size={22} strokeWidth={1.8} />
          </span>
          <span>
            WerkTag<span className="project-hub__brand-dot">.</span>
          </span>
        </a>
        <span className="project-hub__header-label">Projektübersicht</span>
      </header>

      <main className="project-hub__main" id="project-hub-main" tabIndex={-1}>
        <div className="project-hub__intro">
          <p className="project-hub__eyebrow">DEIN ARBEITSBEREICH</p>
          <h1>Deine Projekte.</h1>
          <p>
            Wähle, womit du weitermachen möchtest: Lernen, persönliche Assistenz oder deine
            Komponentenliste.
          </p>
        </div>

        <nav className="project-hub__projects" aria-label="Projekte auswählen">
          <a className="project-hub__project" href="/" aria-labelledby="project-hub-learning-title">
            <div className="project-hub__project-top" aria-hidden="true">
              <span className="project-hub__project-icon">
                <BookOpen size={27} strokeWidth={1.6} />
              </span>
              <ArrowUpRight className="project-hub__arrow" size={24} strokeWidth={1.6} />
            </div>
            <span className="project-hub__category">01 · LERNEN</span>
            <h2 id="project-hub-learning-title">
              WerkTag SHK
              <br />
              Lernbuddy
            </h2>
            <p>
              Deine Vorbereitung auf die Gesellenprüfung. Übungen, Fachwissen und Werkzeuge an einem
              Ort.
            </p>
            <span className="project-hub__project-link">
              Zum Lernbuddy <ArrowRight size={18} aria-hidden="true" />
            </span>
          </a>

          <a
            className="project-hub__project project-hub__project--personal"
            href="/assistenz"
            aria-labelledby="project-hub-assistance-title"
          >
            <div className="project-hub__project-top" aria-hidden="true">
              <span className="project-hub__project-icon">
                <Compass size={27} strokeWidth={1.6} />
              </span>
              <ArrowUpRight className="project-hub__arrow" size={24} strokeWidth={1.6} />
            </div>
            <span className="project-hub__category">02 · PERSÖNLICH</span>
            <h2 id="project-hub-assistance-title">AI Assistance</h2>
            <p>Der eigene Bereich für deine Wege, Standortdaten und persönliche Übersicht.</p>
            <span className="project-hub__privacy">
              <LockKeyhole size={15} aria-hidden="true" /> Eigene geschützte Sitzung
            </span>
            <span className="project-hub__project-link">
              Zur privaten Assistenz <ArrowRight size={18} aria-hidden="true" />
            </span>
          </a>

          <a
            className="project-hub__project project-hub__project--components"
            href="/assistenz/components"
            aria-labelledby="project-hub-components-title"
          >
            <div className="project-hub__project-top" aria-hidden="true">
              <span className="project-hub__project-icon">
                <Boxes size={27} strokeWidth={1.6} />
              </span>
              <ArrowUpRight className="project-hub__arrow" size={24} strokeWidth={1.6} />
            </div>
            <span className="project-hub__category">03 · NACHSCHLAGEN</span>
            <h2 id="project-hub-components-title">Komponentenliste</h2>
            <p>
              Dein SHK-Katalog mit Herstellern, Rohrtypen und Bauteilen. Durchsuchen, filtern und
              technische Angaben mit ihrem Prüfstand nachschlagen.
            </p>
            <span className="project-hub__privacy">
              <LockKeyhole size={15} aria-hidden="true" /> Über deinen privaten Zugang
            </span>
            <span className="project-hub__project-link">
              Zur Komponentenliste <ArrowRight size={18} aria-hidden="true" />
            </span>
          </a>
        </nav>

        <aside className="project-hub__separation" aria-label="Getrennte Projektbereiche">
          <LockKeyhole size={19} aria-hidden="true" />
          <p>
            Dein Lernstand bleibt im Lernbuddy. Assistenz und Komponentenliste sind über deinen
            privaten Zugang erreichbar.
          </p>
        </aside>
      </main>
      <footer className="project-hub__footer">WerkTag · Ein klarer Platz für jedes Projekt.</footer>
    </div>
  );
}
