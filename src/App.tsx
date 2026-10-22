import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleHelp,
  Droplets,
  Flame,
  HardDrive,
  LayoutGrid,
  Lightbulb,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Target,
  Upload,
  Wind,
  Wrench,
  X,
} from 'lucide-react';
import { exercises, topics } from './data';
import type { Exercise, TopicId } from './data';
import {
  createInitialState,
  getDueExercises,
  getMasteredIds,
  getStreak,
  getTodayCount,
  validateState,
} from './lib/learning';
import type { LearningState } from './lib/learning';

type Page = 'dashboard' | 'library' | 'review' | 'plan' | 'tools';
const STORAGE_KEY = 'werktag-learning-v1';
const topicIcons = { heizung: Flame, sanitaer: Droplets, klima: Wind, wiso: BriefcaseBusiness };
const navItems: { id: Page; label: string; icon: typeof Flame }[] = [
  { id: 'dashboard', label: 'Übersicht', icon: LayoutGrid },
  { id: 'library', label: 'Lernwerkstatt', icon: BookOpen },
  { id: 'review', label: 'Wiederholen', icon: RotateCcw },
  { id: 'plan', label: 'Mein Lernplan', icon: CalendarDays },
  { id: 'tools', label: 'Werkzeugkoffer', icon: Wrench },
];

function loadState(): { state: LearningState; warning: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: createInitialState(), warning: '' };
    const validated = validateState(JSON.parse(raw));
    if (validated) return { state: validated, warning: '' };
  } catch {
    /* Preserve an unreadable record; write only after an explicit action. */
  }
  return {
    state: createInitialState(),
    warning:
      'Vorhandene Lerndaten konnten nicht gelesen werden. Sie bleiben gespeichert, bis du neue Daten ausdrücklich speicherst. Exportiere vorher die Rohdatensicherung im Werkzeugkoffer.',
  };
}

function App() {
  const [loaded] = useState(loadState);
  const [state, setState] = useState(loaded.state);
  const [warning, setWarning] = useState(loaded.warning);
  const [page, setPage] = useState<Page>('dashboard');
  const [topicFilter, setTopicFilter] = useState<TopicId | 'all'>('all');
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [toast, setToast] = useState('');
  const mainRef = useRef<HTMLElement>(null);
  const due = getDueExercises(state);
  const mastered = getMasteredIds(state);
  const todayCount = getTodayCount(state);

  function updateState(next: LearningState) {
    setState(next);
    try {
      if (
        loaded.warning &&
        localStorage.getItem(STORAGE_KEY) &&
        !localStorage.getItem(`${STORAGE_KEY}-recovery`)
      ) {
        localStorage.setItem(`${STORAGE_KEY}-recovery`, localStorage.getItem(STORAGE_KEY)!);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setWarning('');
    } catch {
      setWarning(
        'Dein Browser erlaubt gerade keine lokale Speicherung. Dein Fortschritt bleibt für diese Sitzung erhalten. Exportiere ihn im Werkzeugkoffer.',
      );
    }
  }

  function navigate(next: Page, topic: TopicId | 'all' = 'all') {
    setPage(next);
    setTopicFilter(topic);
    window.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() => mainRef.current?.focus());
  }

  function bookmark(id: string) {
    updateState({
      ...state,
      bookmarks: state.bookmarks.includes(id)
        ? state.bookmarks.filter((x) => x !== id)
        : [...state.bookmarks, id],
    });
  }

  function answer(exercise: Exercise, selected: number) {
    updateState({
      ...state,
      attempts: [
        ...state.attempts,
        {
          id: crypto.randomUUID(),
          exerciseId: exercise.id,
          answer: selected,
          correct: selected === exercise.correctIndex,
          answeredAt: new Date().toISOString(),
        },
      ],
    });
  }

  useEffect(() => {
    document.title = `${navItems.find((x) => x.id === page)?.label} · WerkTag SHK`;
  }, [page]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Zum Inhalt springen
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('dashboard');
          }}
          aria-label="WerkTag Startseite"
        >
          <span className="brand-mark">
            <svg viewBox="0 0 40 40" aria-hidden="true">
              <path d="m7 12 6 17 7-13 7 13 6-17" />
            </svg>
          </span>
          <span>
            <strong>
              WerkTag<span className="brand-dot">.</span>
            </strong>
            <small>DEIN SHK LERNBUDDY</small>
          </span>
        </a>
        <p className="nav-caption">DEINE WERKSTATT</p>
        <nav className="main-nav" aria-label="Hauptnavigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? 'active' : ''}`}
              onClick={() => navigate(id)}
              aria-current={page === id ? 'page' : undefined}
            >
              <Icon size={19} strokeWidth={1.7} />
              <span>{label}</span>
              {id === 'review' && due.length > 0 && <span className="nav-badge">{due.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-icon">
            <Wrench size={22} />
          </span>
          <strong>
            Können kommt
            <br />
            vom Machen.
          </strong>
          <p>
            Ein bisschen lernen.
            <br />
            Jeden Tag weiterkommen.
          </p>
          <span className="note-rule" />
        </div>
        <div className="sidebar-footer">
          <ShieldCheck size={16} />
          <span>Dein Wissen. Dein Tempo.</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            Deine Werkstatt <span>/</span>{' '}
            <strong>{navItems.find((x) => x.id === page)?.label}</strong>
          </div>
          <div className="topbar-right">
            <span className="storage-label">
              <HardDrive size={14} /> Fortschritt auf diesem Gerät
            </span>
            <span className="avatar" aria-label="Dein persönlicher Lernbereich">
              N
            </span>
          </div>
        </header>
        <main id="main" ref={mainRef} tabIndex={-1} className="main-content">
          {warning && (
            <div className="notice warning" role="status">
              <CircleHelp size={20} />
              <span>{warning}</span>
            </div>
          )}
          {page === 'dashboard' && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">WILLKOMMEN IN DEINER LERNWERKSTATT</p>
                  <h1>
                    Dein Handwerk.
                    <br className="mobile-break" /> Dein nächster Schritt<span>.</span>
                  </h1>
                  <p>Verstehen. Anwenden. Mit einem guten Gefühl in die Praxis.</p>
                </div>
                <span className="heading-stamp">
                  SANITÄR
                  <br />
                  HEIZUNG
                  <br />
                  KLIMA
                  <ArrowUpRight size={17} />
                </span>
              </div>
              <div className="dashboard-grid">
                <div className="dashboard-main">
                  <section className="focus-card" aria-labelledby="focus-title">
                    <div className="hero-copy">
                      <span className="hero-label">
                        <span className="tiny-square" /> DEIN HEUTIGER FOKUS
                      </span>
                      <h2 id="focus-title">
                        Wärme verstehen.
                        <br />
                        Sauber anwenden.
                      </h2>
                      <p>
                        Vom Wärmekreislauf bis zur Berechnung.
                        <br />
                        Bring dein Heizungswissen auf Temperatur.
                      </p>
                      <button
                        className="button lime"
                        onClick={() =>
                          setActiveExercise(
                            exercises.find(
                              (x) => x.topicId === 'heizung' && !mastered.includes(x.id),
                            ) ?? exercises[0],
                          )
                        }
                      >
                        Lerneinheit starten <ArrowUpRight size={19} />
                      </button>
                      <span className="hero-meta">
                        3 Aufgaben <span>·</span> In deinem Tempo
                      </span>
                    </div>
                    <HeatingDiagram />
                  </section>
                  <section className="topics-section" aria-labelledby="topics-title">
                    <div className="section-heading">
                      <h2 id="topics-title">Deine Lernfelder</h2>
                      <button className="text-button" onClick={() => navigate('library')}>
                        Alle entdecken <ArrowRight size={15} />
                      </button>
                    </div>
                    <div className="topic-grid">
                      {topics.map((topic) => {
                        const Icon = topicIcons[topic.id];
                        const total = exercises.filter((x) => x.topicId === topic.id).length;
                        const done = exercises.filter(
                          (x) => x.topicId === topic.id && mastered.includes(x.id),
                        ).length;
                        return (
                          <button
                            className={`topic-card ${topic.id}`}
                            key={topic.id}
                            onClick={() => navigate('library', topic.id)}
                          >
                            <div className="topic-top">
                              <span className="topic-icon">
                                <Icon size={23} strokeWidth={1.6} />
                              </span>
                              <ArrowUpRight size={17} className="card-arrow" />
                            </div>
                            <h3>{topic.name}</h3>
                            <p>{topic.subtitle}</p>
                            <div className="topic-progress">
                              <span>
                                {done} von {total} zuletzt richtig
                              </span>
                              <div className="progress-track">
                                <span style={{ width: `${(done / total) * 100}%` }} />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <section className="next-section">
                    <div className="section-heading">
                      <h2>Für deinen nächsten Aha-Moment</h2>
                      <span className="quiet">WISSEN WIRD KÖNNEN</span>
                    </div>
                    <div className="bottom-grid">
                      <button
                        className="action-card"
                        onClick={() =>
                          setActiveExercise(
                            exercises.find((x) => !mastered.includes(x.id)) ?? exercises[0],
                          )
                        }
                      >
                        <span className="action-icon">
                          <Lightbulb size={25} strokeWidth={1.5} />
                        </span>
                        <div>
                          <small>KLEINER IMPULS, GROSSE WIRKUNG</small>
                          <h3>Eine Frage. Ein Stück weiter.</h3>
                          <p>Teste dein Verständnis mit einer Praxisaufgabe.</p>
                          <span className="inline-link">
                            Aufgabe öffnen <ArrowRight size={16} />
                          </span>
                        </div>
                      </button>
                      <button className="action-card tool-card" onClick={() => navigate('tools')}>
                        <span className="action-icon">
                          <Wrench size={25} strokeWidth={1.5} />
                        </span>
                        <div>
                          <small>GUT AUSGERÜSTET</small>
                          <h3>Dein digitaler Werkzeugkoffer</h3>
                          <p>Formeln nachschlagen. Zusammenhänge berechnen.</p>
                          <span className="inline-link">
                            Werkzeuge ansehen <ArrowRight size={16} />
                          </span>
                        </div>
                      </button>
                    </div>
                  </section>
                  <div className="content-footnote">
                    <span className="status-dot" /> Eigene Übungsaufgaben für deinen Neustart. Dein
                    Fortschritt beginnt bei dir.
                  </div>
                </div>
                <aside className="dashboard-rail" aria-label="Lernübersicht">
                  <section className="goal-card">
                    <div className="rail-label">
                      <span>DEIN LERNRHYTHMUS</span>
                      <Target size={17} />
                    </div>
                    <div className="goal-ring">
                      <svg viewBox="0 0 150 150" aria-hidden="true">
                        <circle cx="75" cy="75" r="62" />
                        <circle
                          className="ring-fill"
                          cx="75"
                          cy="75"
                          r="62"
                          strokeDasharray={`${Math.min(todayCount / state.dailyGoal, 1) * 390} 390`}
                        />
                      </svg>
                      <div>
                        <strong>
                          {todayCount}
                          <span>/{state.dailyGoal}</span>
                        </strong>
                        <small>AUFGABEN HEUTE</small>
                      </div>
                    </div>
                    <h2>
                      Kleine Schritte.
                      <br />
                      Großer Unterschied.
                    </h2>
                    <p>
                      {todayCount >= state.dailyGoal
                        ? 'Tagesziel geschafft. Gut gemacht!'
                        : `${Math.max(state.dailyGoal - todayCount, 0)} ${state.dailyGoal - todayCount === 1 ? 'Aufgabe fehlt' : 'Aufgaben fehlen'} noch zu deinem Tagesziel.`}
                    </p>
                    <WeekDots state={state} />
                    <div className="goal-footer">
                      <span>
                        <Flame size={15} /> {getStreak(state)}{' '}
                        {getStreak(state) === 1 ? 'Lerntag' : 'Lerntage'} in Folge
                      </span>
                      <button
                        className="icon-button"
                        aria-label="Tagesziel im Lernplan ändern"
                        onClick={() => navigate('plan')}
                      >
                        <Settings2 size={17} />
                      </button>
                    </div>
                  </section>
                  <section className="review-card">
                    <div className="review-symbol">
                      <RotateCcw size={25} strokeWidth={1.5} />
                      <span>{due.length}</span>
                    </div>
                    <h2>
                      Damit Wissen
                      <br />
                      hängen bleibt.
                    </h2>
                    <p>
                      {due.length > 0
                        ? `${due.length} ${due.length === 1 ? 'Aufgabe wartet' : 'Aufgaben warten'} auf eine Wiederholung.`
                        : 'Was du heute übst, vertiefst du später. Dein Kopf wird’s dir danken.'}
                    </p>
                    <button
                      className="text-button"
                      onClick={() => navigate(due.length ? 'review' : 'library')}
                    >
                      {due.length ? 'Jetzt wiederholen' : 'Erste Aufgabe entdecken'}{' '}
                      <ArrowRight size={16} />
                    </button>
                  </section>
                  <div className="rail-note">
                    <span className="small-grid-mark">✳</span>
                    <p>
                      Für die Prüfung lernen.
                      <br />
                      <strong>Fürs Handwerk verstehen.</strong>
                    </p>
                  </div>
                </aside>
              </div>
            </>
          )}
          {page === 'library' && (
            <Library
              state={state}
              filter={topicFilter}
              onFilter={setTopicFilter}
              onStart={setActiveExercise}
              onBookmark={bookmark}
            />
          )}
          {page === 'review' && (
            <>
              <PageHeading
                eyebrow="WIEDERHOLUNG MACHT DEN UNTERSCHIED"
                title="Wissen, das bleibt."
                description="Falsche Antworten übst du direkt erneut. Richtige Aufgaben kommen nach drei Tagen zurück."
              />
              {due.length ? (
                <div className="exercise-grid">
                  {due.map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      state={state}
                      onStart={setActiveExercise}
                      onBookmark={bookmark}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<RotateCcw size={32} />}
                  title="Gerade nichts zu wiederholen."
                  description={
                    state.attempts.length
                      ? 'Deine richtig gelösten Aufgaben werden nach drei Tagen wieder fällig. Bis dahin wartet neues Wissen auf dich.'
                      : 'Starte mit einer Aufgabe. Danach findest du hier die passenden Wiederholungen.'
                  }
                >
                  <button className="button primary" onClick={() => navigate('library')}>
                    Zur Lernwerkstatt <ArrowRight size={17} />
                  </button>
                </EmptyState>
              )}
            </>
          )}
          {page === 'plan' && (
            <Plan state={state} onUpdate={updateState} onStart={setActiveExercise} />
          )}
          {page === 'tools' && (
            <Tools
              state={state}
              onImport={(next) => {
                updateState(next);
                setToast('Dein Lernstand wurde importiert.');
              }}
            />
          )}
        </main>
        <footer className="workspace-footer">
          <span>WerkTag · Mit Kopf. Mit Hand. Mit dir.</span>
          <span>
            SHK LERNBUDDY <span className="footer-version">/ 01</span>
          </span>
        </footer>
      </div>
      {activeExercise && (
        <ExerciseDialog
          key={activeExercise.id}
          exercise={activeExercise}
          bookmarked={state.bookmarks.includes(activeExercise.id)}
          onBookmark={() => bookmark(activeExercise.id)}
          onAnswer={(selected) => answer(activeExercise, selected)}
          onClose={() => setActiveExercise(null)}
          onNext={() => {
            const topicExercises = exercises.filter((x) => x.topicId === activeExercise.topicId);
            const index = topicExercises.findIndex((x) => x.id === activeExercise.id);
            if (index === topicExercises.length - 1) {
              setActiveExercise(null);
              navigate('library', activeExercise.topicId);
            } else setActiveExercise(topicExercises[index + 1]);
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
        </div>
      )}
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}

function HeatingDiagram() {
  return (
    <div className="heating-diagram">
      <svg viewBox="0 0 365 290" role="img" aria-labelledby="diagram-title">
        <title id="diagram-title">
          Prinzipzeichnung eines geschlossenen Heizkreislaufs mit Wärmeerzeuger und Heizkörper
        </title>
        <defs>
          <pattern id="dot-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r=".7" fill="#c4ddd0" opacity=".22" />
          </pattern>
          <linearGradient id="unit-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#377369" />
            <stop offset="1" stopColor="#174b44" />
          </linearGradient>
        </defs>
        <rect width="365" height="290" fill="url(#dot-grid)" />
        <path
          className="pipe-shadow"
          d="M104 116V62q0-12 12-12h158q14 0 14 14v48M104 184v40q0 12 12 12h158q14 0 14-14v-46"
        />
        <path className="hot-pipe" d="M104 116V62q0-12 12-12h158q14 0 14 14v48" />
        <path className="cold-pipe" d="M104 184v40q0 12 12 12h158q14 0 14-14v-46" />
        <path d="m190 45 7 5-7 5" className="flow-arrow" />
        <path d="m203 231-7 5 7 5" className="flow-arrow" />
        <rect className="heat-unit" x="55" y="103" width="99" height="91" rx="10" />
        <rect className="unit-panel" x="65" y="114" width="79" height="45" rx="5" />
        <circle cx="104" cy="136" r="16" className="fan-circle" />
        <path
          d="M104 122c11 9 2 16 0 14m14 3c-13 7-15-4-14-3m-7 10c0-15 10-10 7-10"
          className="fan-blades"
        />
        <circle cx="104" cy="136" r="3" fill="#cfdfc1" />
        <path d="M69 172h43m-43 6h43" stroke="#6e9e8e" strokeWidth="2" />
        <circle cx="134" cy="176" r="3" fill="#e5efa8" />
        <g className="radiator">
          <rect x="244" y="109" width="83" height="73" rx="6" />
          {[255, 268, 281, 294, 307].map((x) => (
            <path key={x} d={`M${x} 117v56`} />
          ))}
        </g>
        <circle cx="288" cy="89" r="7" className="valve" />
        <path d="m284 85 8 8m0-8-8 8" stroke="#f9b088" strokeWidth="1.5" />
        <text x="144" y="35" className="diagram-label">
          VORLAUF
        </text>
        <text x="143" y="263" className="diagram-label">
          RÜCKLAUF
        </text>
        <text x="61" y="217" className="diagram-small">
          WÄRMEERZEUGER
        </text>
        <text x="245" y="204" className="diagram-small">
          HEIZKÖRPER
        </text>
        <g transform="translate(174,126)">
          <circle r="20" fill="#244e44" stroke="#5b7d63" strokeDasharray="3 4" />
          <text className="delta-label" textAnchor="middle" y="5">
            ΔT
          </text>
        </g>
      </svg>
      <div className="diagram-caption">
        <span>PRINZIPSKIZZE</span>
        <strong>Q = m · c · ΔT</strong>
      </div>
    </div>
  );
}

function WeekDots({ state }: { state: LearningState }) {
  const now = new Date();
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - ((now.getDay() + 6) % 7),
  );
  return (
    <div className="week-dots" aria-label="Deine Lerntage in dieser Woche">
      {['M', 'D', 'M', 'D', 'F', 'S', 'S'].map((label, index) => {
        const day = new Date(monday);
        day.setDate(day.getDate() + index);
        const active = state.attempts.some(
          (x) => new Date(x.answeredAt).toDateString() === day.toDateString(),
        );
        const today = day.toDateString() === now.toDateString();
        return (
          <span
            className={`week-day ${today ? 'today' : ''} ${active ? 'done' : ''}`}
            key={index}
            aria-label={`${day.toLocaleDateString('de-DE', { weekday: 'long' })}${today ? ', heute' : ''}: ${active ? 'gelernt' : 'noch keine Aufgabe'}`}
          >
            <span>{active ? <Check size={14} /> : label}</span>
            <i />
          </span>
        );
      })}
    </div>
  );
}

function ExerciseCard({
  exercise,
  state,
  onStart,
  onBookmark,
}: {
  exercise: Exercise;
  state: LearningState;
  onStart: (exercise: Exercise) => void;
  onBookmark: (id: string) => void;
}) {
  const Icon = topicIcons[exercise.topicId];
  const isMastered = getMasteredIds(state).includes(exercise.id);
  return (
    <article className={`exercise-card ${exercise.topicId}`}>
      <div className="exercise-card-top">
        <span className="topic-icon">
          <Icon size={22} />
        </span>
        <button
          className={`icon-button bookmark-button ${state.bookmarks.includes(exercise.id) ? 'is-bookmarked' : ''}`}
          aria-label={`${exercise.title} ${state.bookmarks.includes(exercise.id) ? 'aus Merkliste entfernen' : 'merken'}`}
          aria-pressed={state.bookmarks.includes(exercise.id)}
          onClick={() => onBookmark(exercise.id)}
        >
          <Bookmark size={19} />
        </button>
      </div>
      <span className="exercise-category">
        {topics.find((x) => x.id === exercise.topicId)?.name} <span>·</span> {exercise.level}
      </span>
      <h2>{exercise.title}</h2>
      <p>{exercise.context}</p>
      <div className="exercise-card-bottom">
        <span>
          {isMastered ? (
            <>
              <CheckCircle2 size={15} /> Zuletzt richtig
            </>
          ) : (
            `ca. ${exercise.estimatedMinutes} Min · Zeitvorschlag`
          )}
        </span>
        <button className="text-button" onClick={() => onStart(exercise)}>
          Üben <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );
}

function Library({
  state,
  filter,
  onFilter,
  onStart,
  onBookmark,
}: {
  state: LearningState;
  filter: TopicId | 'all';
  onFilter: (id: TopicId | 'all') => void;
  onStart: (exercise: Exercise) => void;
  onBookmark: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [onlySaved, setOnlySaved] = useState(false);
  const filtered = exercises.filter(
    (x) =>
      (filter === 'all' || x.topicId === filter) &&
      (!onlySaved || state.bookmarks.includes(x.id)) &&
      `${x.title} ${x.context} ${x.question} ${topics.find((t) => t.id === x.topicId)?.name}`
        .toLocaleLowerCase('de')
        .includes(search.toLocaleLowerCase('de')),
  );
  return (
    <>
      <PageHeading
        eyebrow="DEINE LERNWERKSTATT"
        title="Wissen, das in der Praxis sitzt."
        description="Wähle dein Lernfeld. Denk selbst nach. Verstehe den Lösungsweg."
      />
      <div className="library-toolbar">
        <div className="search-field">
          <Search size={19} />
          <input
            aria-label="Aufgaben durchsuchen"
            placeholder="Thema oder Frage suchen …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="icon-button" aria-label="Suche leeren" onClick={() => setSearch('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className={`button secondary ${onlySaved ? 'selected' : ''}`}
          aria-pressed={onlySaved}
          onClick={() => setOnlySaved(!onlySaved)}
        >
          <Bookmark size={17} /> Gemerkt <span>{state.bookmarks.length}</span>
        </button>
      </div>
      <div className="filter-row" aria-label="Lernfeld filtern">
        <button
          className={`filter-chip ${filter === 'all' ? 'selected' : ''}`}
          aria-pressed={filter === 'all'}
          onClick={() => onFilter('all')}
        >
          Alle Lernfelder
        </button>
        {topics.map((x) => (
          <button
            key={x.id}
            className={`filter-chip ${filter === x.id ? 'selected' : ''}`}
            aria-pressed={filter === x.id}
            onClick={() => onFilter(x.id)}
          >
            {x.name}
          </button>
        ))}
      </div>
      <div className="results-label">
        <span>
          {filtered.length} {filtered.length === 1 ? 'Aufgabe' : 'Aufgaben'}
        </span>
        <span>Eigene Übungsaufgaben · keine offiziellen Prüfungen</span>
      </div>
      {filtered.length ? (
        <div className="exercise-grid">
          {filtered.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              state={state}
              onStart={onStart}
              onBookmark={onBookmark}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search size={30} />}
          title="Hier ist noch Platz für Wissen."
          description={
            onlySaved
              ? 'Du hast noch keine passende Aufgabe gemerkt. Speichere Aufgaben über das Lesezeichen.'
              : 'Unter diesem Suchbegriff wurde keine Aufgabe gefunden. Versuche einen anderen Begriff.'
          }
        />
      )}
    </>
  );
}

function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}

function ExerciseDialog({
  exercise,
  bookmarked,
  onBookmark,
  onAnswer,
  onClose,
  onNext,
}: {
  exercise: Exercise;
  bookmarked: boolean;
  onBookmark: () => void;
  onAnswer: (selected: number) => void;
  onClose: () => void;
  onNext: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [selection, setSelection] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);
  const [hintVisible, setHintVisible] = useState(false);
  const titleId = useId();
  const radioName = useId();
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      opener?.focus();
    };
  }, []);
  function submit() {
    if (selection === null || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);
    onAnswer(selection);
  }
  const correct = selection === exercise.correctIndex;
  return (
    <dialog
      ref={ref}
      className="exercise-dialog"
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) {
          const rect = ref.current.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className="dialog-top">
        <span>
          <span className={`topic-dot ${exercise.topicId}`} />
          {topics.find((x) => x.id === exercise.topicId)?.name}{' '}
          <span className="dialog-divider">/</span> {exercise.level}
        </span>
        <div>
          <button
            className={`icon-button ${bookmarked ? 'is-bookmarked' : ''}`}
            onClick={onBookmark}
            aria-label={bookmarked ? 'Aufgabe nicht mehr merken' : 'Aufgabe merken'}
            aria-pressed={bookmarked}
          >
            <Bookmark size={20} />
          </button>
          <button className="icon-button" onClick={onClose} aria-label="Aufgabe schließen">
            <X size={21} />
          </button>
        </div>
      </div>
      <div className="dialog-body">
        <p className="eyebrow">DEIN WISSEN IST GEFRAGT</p>
        <h2 id={titleId}>{exercise.title}</h2>
        <p className="task-context">{exercise.context}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <fieldset disabled={submitted}>
            <legend>{exercise.question}</legend>
            <div className="answer-options">
              {exercise.options.map((option, index) => (
                <label
                  className={`answer-option ${selection === index ? 'chosen' : ''} ${submitted && index === exercise.correctIndex ? 'correct' : ''} ${submitted && selection === index && !correct ? 'incorrect' : ''}`}
                  key={index}
                >
                  <input
                    type="radio"
                    name={radioName}
                    value={index}
                    checked={selection === index}
                    onChange={() => setSelection(index)}
                  />
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span>{option}</span>
                  {submitted && index === exercise.correctIndex && <CheckCircle2 size={19} />}
                </label>
              ))}
            </div>
          </fieldset>
          {!submitted && (
            <div className="exercise-controls">
              <button
                type="button"
                className="text-button"
                onClick={() => setHintVisible(!hintVisible)}
                aria-expanded={hintVisible}
              >
                <Lightbulb size={17} /> {hintVisible ? 'Hinweis ausblenden' : 'Kleiner Denkanstoß'}
              </button>
              <button className="button primary" type="submit" disabled={selection === null}>
                Antwort prüfen <ArrowRight size={17} />
              </button>
            </div>
          )}
        </form>
        {hintVisible && !submitted && (
          <div className="hint">
            <Lightbulb size={18} />
            <p>{exercise.hint}</p>
          </div>
        )}
        {submitted && (
          <div className={`answer-feedback ${correct ? 'success' : 'try-again'}`} role="status">
            <div className="feedback-title">
              {correct ? <CheckCircle2 size={23} /> : <Lightbulb size={23} />}
              <h3>
                {correct ? 'Richtig. Das sitzt!' : 'Noch nicht ganz. Hier kommt der Zusammenhang.'}
              </h3>
            </div>
            {exercise.formula && <div className="formula">{exercise.formula}</div>}
            <p className="explanation">{exercise.explanation}</p>
            <button className="button primary" onClick={onNext}>
              Weiterlernen <ArrowRight size={17} />
            </button>
          </div>
        )}
        <div className="source-note">
          <ShieldCheck size={15} />
          <span>{exercise.sourceLabel} · Lösungsweg im Übungsmodus nach der Antwort sichtbar.</span>
        </div>
      </div>
    </dialog>
  );
}

function Plan({
  state,
  onUpdate,
  onStart,
}: {
  state: LearningState;
  onUpdate: (state: LearningState) => void;
  onStart: (exercise: Exercise) => void;
}) {
  const mastered = getMasteredIds(state);
  const [saved, setSaved] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="DEIN TEMPO. DEIN PLAN."
        title="Dranbleiben beginnt mit einem Schritt."
        description="Ein überschaubares Tagesziel und vier Lernfelder – so wird aus einem Vorhaben eine Routine."
      />
      <div className="plan-layout">
        <section className="surface plan-settings">
          <span className="topic-icon">
            <Target size={25} />
          </span>
          <h2>Dein persönliches Tagesziel</h2>
          <p>
            Wie viele unterschiedliche Aufgaben möchtest du pro Tag bearbeiten? Jede abgegebene
            Antwort zählt. Richtig oder falsch: Beides bringt dich weiter.
          </p>
          <label htmlFor="daily-goal">Aufgaben pro Tag</label>
          <select
            id="daily-goal"
            value={state.dailyGoal}
            onChange={(e) => {
              onUpdate({ ...state, dailyGoal: Number(e.target.value) });
              setSaved(true);
            }}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'Aufgabe' : 'Aufgaben'}
              </option>
            ))}
          </select>
          {saved && (
            <span className="saved-label" role="status">
              <Check size={15} /> Tagesziel aktualisiert
            </span>
          )}
          <div className="plan-stat">
            <strong>
              {getTodayCount(state)}
              <span>/{state.dailyGoal}</span>
            </strong>
            <span>heute bearbeitet</span>
          </div>
          <div className="plan-stat">
            <strong>
              {mastered.length}
              <span>/{exercises.length}</span>
            </strong>
            <span>Aufgaben zuletzt richtig</span>
          </div>
        </section>
        <section className="surface plan-path">
          <div className="section-heading">
            <h2>Dein Weg durch die Lernfelder</h2>
            <span className="tag">VORSCHLAG</span>
          </div>
          <p className="quiet">Frei einteilbar. Kein Prüfungszeitplan, keine festen Termine.</p>
          {topics.map((topic, index) => {
            const Icon = topicIcons[topic.id];
            const topicTasks = exercises.filter((x) => x.topicId === topic.id);
            const done = topicTasks.filter((x) => mastered.includes(x.id)).length;
            return (
              <div className="path-step" key={topic.id}>
                <span className={`path-number ${done === topicTasks.length ? 'completed' : ''}`}>
                  {done === topicTasks.length ? <Check size={17} /> : `0${index + 1}`}
                </span>
                <div>
                  <span className="path-subtitle">
                    <Icon size={15} /> {topic.subtitle}
                  </span>
                  <h3>{topic.name}</h3>
                  <p>{topic.description}</p>
                  <span className="quiet">
                    {done} von {topicTasks.length} zuletzt richtig
                  </span>
                </div>
                <button
                  className="icon-button"
                  aria-label={`${topic.name} üben`}
                  onClick={() =>
                    onStart(topicTasks.find((x) => !mastered.includes(x.id)) ?? topicTasks[0])
                  }
                >
                  <ArrowUpRight size={21} />
                </button>
              </div>
            );
          })}
        </section>
      </div>
    </>
  );
}

function download(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Tools({
  state,
  onImport,
}: {
  state: LearningState;
  onImport: (state: LearningState) => void;
}) {
  const [mass, setMass] = useState('100');
  const [delta, setDelta] = useState('20');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState<LearningState | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const m = Number(mass.replace(',', '.'));
  const d = Number(delta.replace(',', '.'));
  const valid =
    mass.trim() !== '' &&
    delta.trim() !== '' &&
    Number.isFinite(m) &&
    Number.isFinite(d) &&
    m > 0 &&
    d >= 0 &&
    m <= 1e9 &&
    d <= 100;
  const energy = m * 4.18 * d;
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    setMessage('');
    setPending(null);
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 5_000_000)
        throw new Error('Die Datei ist zu groß. Maximal 5 MB sind möglich.');
      const validated = validateState(JSON.parse(await file.text()));
      if (!validated)
        throw new Error(
          'Die Datei enthält keinen gültigen WerkTag-Lernstand. Dein aktueller Stand bleibt erhalten.',
        );
      setPending(validated);
    } catch (error) {
      setMessage(
        error instanceof SyntaxError
          ? 'Die Datei ist kein lesbares JSON. Dein aktueller Lernstand bleibt erhalten.'
          : error instanceof Error
            ? error.message
            : 'Die Datei konnte nicht gelesen werden.',
      );
    }
    event.target.value = '';
  }
  function exportRaw() {
    try {
      const raw =
        localStorage.getItem(`${STORAGE_KEY}-recovery`) ?? localStorage.getItem(STORAGE_KEY);
      if (raw) download(raw, 'werktag-rohdatensicherung.json');
      else setMessage('Noch keine gespeicherten Rohdaten vorhanden.');
    } catch {
      setMessage('Die Browserdaten sind nicht zugänglich. Nutze den normalen Lernstand-Export.');
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="GUT AUSGERÜSTET"
        title="Dein digitaler Werkzeugkoffer."
        description="Zusammenhänge greifbar machen. Formeln verstehen. Deinen Lernstand sichern."
      />
      <div className="tools-grid">
        <section className="surface calculator">
          <div className="section-heading">
            <h2>Wärmeenergie berechnen</h2>
            <Flame size={22} />
          </div>
          <p>Wie viel Energie braucht Wasser, um wärmer zu werden?</p>
          <div className="formula large">Q = m · c · ΔT</div>
          <div className="calculator-inputs">
            <label>
              Wassermasse <span>in kg</span>
              <input
                inputMode="decimal"
                value={mass}
                onChange={(e) => setMass(e.target.value)}
                aria-describedby="calculator-assumptions"
              />
            </label>
            <label>
              Temperaturdifferenz <span>in K</span>
              <input
                inputMode="decimal"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                aria-describedby="calculator-assumptions"
              />
            </label>
          </div>
          <div className="calculator-result" aria-live="polite">
            {valid ? (
              <>
                <span>Benötigte Wärmeenergie</span>
                <strong>
                  {(energy / 3600).toLocaleString('de-DE', { maximumFractionDigits: 3 })}{' '}
                  <small>kWh</small>
                </strong>
                <span>{energy.toLocaleString('de-DE', { maximumFractionDigits: 1 })} kJ</span>
              </>
            ) : (
              <p>
                Bitte eine positive Masse und eine Temperaturdifferenz von 0 bis 100 K eingeben.
              </p>
            )}
          </div>
          <p className="tool-assumptions" id="calculator-assumptions">
            Modellrechnung für flüssiges Wasser: c = 4,18 kJ/(kg · K). Ohne Wärmeverluste und
            Phasenwechsel. 1 kWh = 3.600 kJ.
          </p>
        </section>
        <section className="surface formula-reference">
          <div className="section-heading">
            <h2>Griffbereit: Grundformeln</h2>
            <BookOpen size={21} />
          </div>
          <dl>
            <div>
              <dt>Wärmeenergie</dt>
              <dd>
                <strong>Q = m · c · ΔT</strong>
                <span>m in kg, c in kJ/(kg · K), ΔT in K → Q in kJ</span>
              </dd>
            </div>
            <div>
              <dt>Volumenstrom</dt>
              <dd>
                <strong>V̇ = V / t</strong>
                <span>V in Litern, t in Minuten → V̇ in l/min</span>
              </dd>
            </div>
            <div>
              <dt>Luftwechsel</dt>
              <dd>
                <strong>n = V̇ / V</strong>
                <span>V̇ in m³/h, Raumvolumen V in m³ → n in h⁻¹</span>
              </dd>
            </div>
            <div>
              <dt>Gefälle</dt>
              <dd>
                <strong>i = Δh / l · 100 %</strong>
                <span>Höhenunterschied und waagerechte Bezugslänge in gleicher Einheit</span>
              </dd>
            </div>
          </dl>
          <p className="tool-assumptions">
            Grundlagen für Modellaufgaben. Anlagenplanung und konkrete Arbeitsausführung benötigen
            die passenden aktuellen Fachquellen.
          </p>
        </section>
        <section className="surface data-tools">
          <div>
            <span className="topic-icon">
              <HardDrive size={23} />
            </span>
            <h2>Dein Lernstand gehört dir.</h2>
            <p>
              Antworten, Merkliste und Tagesziel liegen in diesem Browser. Exportiere eine
              Sicherung, bevor du das Gerät wechselst oder Browserdaten löschst.
            </p>
          </div>
          <div className="data-buttons">
            <button
              className="button primary"
              onClick={() =>
                download(
                  JSON.stringify(state, null, 2),
                  `werktag-lernstand-${new Date().toISOString().slice(0, 10)}.json`,
                )
              }
            >
              <ArrowDownToLine size={17} /> Lernstand exportieren
            </button>
            <button className="button secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={17} /> Sicherung importieren
            </button>
            <input
              type="file"
              accept="application/json,.json"
              ref={fileRef}
              onChange={importFile}
              className="visually-hidden"
              aria-label="Lernstanddatei auswählen"
              tabIndex={-1}
            />
            <button className="text-button quiet" onClick={exportRaw}>
              Rohdatensicherung exportieren
            </button>
          </div>
          {message && (
            <p className="import-message" role="alert">
              {message}
            </p>
          )}
          {pending && (
            <div className="import-confirm">
              <h3>Diese Sicherung übernehmen?</h3>
              <p>
                Sie enthält {pending.attempts.length} Antworten und {pending.bookmarks.length}{' '}
                gemerkte Aufgaben. Dein aktueller Lernstand wird ersetzt. Exportiere ihn vorher,
                wenn du ihn behalten möchtest.
              </p>
              <button
                className="button primary"
                onClick={() => {
                  onImport(pending);
                  setPending(null);
                }}
              >
                Lernstand ersetzen
              </button>
              <button className="button secondary" onClick={() => setPending(null)}>
                Abbrechen
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default App;
