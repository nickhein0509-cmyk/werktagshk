import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
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
  ShieldCheck,
  Target,
  Upload,
  Wind,
  Wrench,
  X,
} from 'lucide-react';
import { exercises, topics } from './data';
import { examAreas, getExamAreas, isExamCase } from './exam';
import type { ExamAreaId } from './exam';
import type { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { FlowDashboard } from './components/FlowDashboard';
import { ExamPractice } from './components/ExamPractice';
import { CalculationWorkspace } from './components/CalculationWorkspace';
import {
  DifficultyBadge,
  DifficultyControls,
  DifficultyLegend,
  matchesDifficulty,
} from './components/Difficulty';
import type { DifficultyFilter, DifficultySort } from './components/Difficulty';
import {
  compareExerciseDifficulty,
  difficultyLevels,
  getExerciseDifficulty,
} from './lib/difficulty';
import { exerciseKindLabels, getExerciseKind } from './lib/exercise-kind';
import type { ExerciseKind } from './lib/exercise-kind';
import { loadWorkpad, saveWorkpad } from './lib/workpad-storage';
import type { Exercise, TopicId } from './data';
import {
  createInitialState,
  getDueExercises,
  getMasteredIds,
  getTodayCount,
  validateState,
} from './lib/learning';
import type { LearningState } from './lib/learning';
import { isFutureLearningRecord, futureDataWarning } from './lib/storage';

const CloudAccount = lazy(() =>
  import('./components/CloudAccount').then((module) => ({ default: module.CloudAccount })),
);
const CloudPractice = lazy(() =>
  import('./CloudPractice').then((module) => ({ default: module.CloudPractice })),
);
const FormulaWorkbench = lazy(() =>
  import('./components/FormulaWorkbench').then((module) => ({ default: module.FormulaWorkbench })),
);

type Page = 'dashboard' | 'cloud' | 'library' | 'exam' | 'review' | 'plan' | 'tools';
const STORAGE_KEY = 'werktag-learning-v1';
const topicIcons = { heizung: Flame, sanitaer: Droplets, klima: Wind, wiso: BriefcaseBusiness };
const navItems: { id: Page; label: string; icon: typeof Flame }[] = [
  { id: 'dashboard', label: 'Übersicht', icon: LayoutGrid },
  { id: 'cloud', label: 'Mein Fragenbestand', icon: ShieldCheck },
  { id: 'library', label: 'Lernwerkstatt', icon: BookOpen },
  { id: 'exam', label: 'Prüfungsbereich', icon: ClipboardList },
  { id: 'review', label: 'Wiederholen', icon: RotateCcw },
  { id: 'plan', label: 'Mein Lernplan', icon: CalendarDays },
  { id: 'tools', label: 'Werkzeugkoffer', icon: Wrench },
];

function loadState(storageKey = STORAGE_KEY): { state: LearningState; warning: string } {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { state: createInitialState(), warning: '' };
    if (isFutureLearningRecord(raw))
      return { state: createInitialState(), warning: futureDataWarning };
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
  const [loaded, setLoaded] = useState(() => loadState());
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const accountId = useRef<string | null | undefined>(undefined);
  const storageKey = user ? `${STORAGE_KEY}:${user.id}` : STORAGE_KEY;
  const [state, setState] = useState(loaded.state);
  const [warning, setWarning] = useState(loaded.warning);
  const [page, setPage] = useState<Page>('dashboard');
  const [topicFilter, setTopicFilter] = useState<TopicId | 'all'>('all');
  const [examArea, setExamArea] = useState<ExamAreaId | 'all'>('all');
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const exerciseQueue = useRef<Exercise[] | null>(null);
  const [toast, setToast] = useState('');
  const mainRef = useRef<HTMLElement>(null);
  const due = getDueExercises(state);
  const mastered = useMemo(() => getMasteredIds(state), [state]);
  const todayCount = getTodayCount(state);

  function startExercise(exercise: Exercise, queue?: Exercise[]) {
    exerciseQueue.current = queue ?? null;
    setActiveExercise(exercise);
  }

  function updateState(next: LearningState) {
    // An auth callback can switch accounts before an old sync promise unmounts.
    if (accountId.current !== undefined && accountId.current !== (user?.id ?? null)) return false;
    try {
      if (isFutureLearningRecord(localStorage.getItem(storageKey))) {
        setWarning(futureDataWarning);
        return false;
      }
    } catch {
      /* Unavailable storage is handled below; keep session practice usable. */
    }
    setState(next);
    try {
      if (
        loaded.warning &&
        localStorage.getItem(storageKey) &&
        !localStorage.getItem(`${storageKey}-recovery`)
      ) {
        localStorage.setItem(`${storageKey}-recovery`, localStorage.getItem(storageKey)!);
      }
      localStorage.setItem(storageKey, JSON.stringify(next));
      setWarning('');
    } catch {
      setWarning(
        'Dein Browser erlaubt gerade keine lokale Speicherung. Dein Fortschritt bleibt für diese Sitzung erhalten. Exportiere ihn im Werkzeugkoffer.',
      );
    }
    return true;
  }

  function navigate(next: Page, topic: TopicId | 'all' = 'all', area: ExamAreaId | 'all' = 'all') {
    setPage(next);
    setTopicFilter(topic);
    setExamArea(area);
    window.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }));
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
    return answerBatch([{ exercise, selected }]);
  }

  function answerBatch(answers: { exercise: Exercise; selected: number; attemptId?: string }[]) {
    const knownIds = new Set(state.attempts.map((attempt) => attempt.id));
    const pending = answers.filter((entry) => !entry.attemptId || !knownIds.has(entry.attemptId));
    if (!pending.length) return true;
    return updateState({
      ...state,
      attempts: [
        ...state.attempts,
        ...pending.map(({ exercise, selected, attemptId }) => ({
          id: attemptId ?? crypto.randomUUID(),
          exerciseId: exercise.id,
          answer: selected,
          correct: selected === exercise.correctIndex,
          answeredAt: new Date().toISOString(),
        })),
      ],
    });
  }

  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      if (accountId.current !== (nextUser?.id ?? null)) {
        accountId.current = nextUser?.id ?? null;
        const next = loadState(nextUser ? `${STORAGE_KEY}:${nextUser.id}` : STORAGE_KEY);
        setUser(nextUser);
        setLoaded(next);
        setState(next.state);
        setWarning(next.warning);
        setActiveExercise(null);
        setPage((current) => (current === 'cloud' ? 'cloud' : 'dashboard'));
        setToast('');
      }
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.title = `${navItems.find((x) => x.id === page)?.label} · WerkTag SHK`;
  }, [page]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!authReady)
    return (
      <main className={`main-content ${page === 'dashboard' ? 'main-content-dashboard' : ''}`}>
        <p role="status">Dein Lernkonto wird geladen …</p>
      </main>
    );

  return (
    <div className="app-shell" data-design="flow" data-design-version="2">
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
        <nav className="main-nav" aria-label="Hauptnavigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? 'active' : ''}`}
              onClick={() => navigate(id)}
              aria-current={page === id ? 'page' : undefined}
            >
              <Icon size={19} strokeWidth={1.7} />
              <span className="nav-label">{label}</span>
              <span className="nav-label-short" aria-hidden="true">
                {
                  {
                    dashboard: 'Start',
                    cloud: 'Bestand',
                    library: 'Üben',
                    exam: 'Prüfung',
                    review: 'Nochmal',
                    plan: 'Plan',
                    tools: 'Tools',
                  }[id]
                }
              </span>
              {id === 'review' && due.length > 0 && <span className="nav-badge">{due.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <ShieldCheck size={16} />
          <span>Dein Wissen. Dein Tempo.</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button
            className="mobile-brand"
            onClick={() => navigate('dashboard')}
            aria-label="WerkTag Startseite"
          >
            WerkTag<span>.</span>
          </button>
          <div className="breadcrumb">{navItems.find((x) => x.id === page)?.label}</div>
          <button
            className="daily-progress"
            onClick={() => navigate('plan')}
            aria-label="Tagesziel im Lernplan ändern"
          >
            <span>
              <strong>
                {todayCount}/{state.dailyGoal}
              </strong>{' '}
              Aufgaben<span className="daily-progress-suffix"> heute</span>
            </span>
            <progress
              value={Math.min(todayCount, state.dailyGoal)}
              max={state.dailyGoal}
              aria-label="Tagesziel"
            />
          </button>
        </header>
        <main
          id="main"
          ref={mainRef}
          tabIndex={-1}
          className={`main-content ${page === 'dashboard' ? 'main-content-dashboard' : ''}`}
        >
          {warning && (
            <div className="notice warning" role="status">
              <CircleHelp size={20} />
              <span>{warning}</span>
            </div>
          )}
          {page === 'cloud' && (
            <>
              <PageHeading
                eyebrow="DEIN BESTEHENDER LERNBUDDY"
                title="Mein Fragenbestand"
                description={
                  user
                    ? 'Öffne eine Aufgabe direkt oder stelle dir eine Runde nach Thema, Aufgabenart und Stufe zusammen.'
                    : 'Deine Fragen, Rechenaufgaben und Übungsrunden. Melde dich mit deinem vorhandenen Lernkonto an.'
                }
              />
              <Suspense fallback={<p role="status">Dein Fragenbestand wird vorbereitet …</p>}>
                <CloudAccount
                  key={`account:${user?.id ?? 'guest'}`}
                  user={user}
                  state={state}
                  onLoad={updateState}
                />
                {user && <CloudPractice key={`questions:${user.id}`} userId={user.id} />}
              </Suspense>
            </>
          )}
          {page === 'dashboard' && (
            <FlowDashboard
              state={state}
              dueCount={due.length}
              weekDots={<WeekDots state={state} />}
              onLibrary={(topic = 'all') => navigate('library', topic)}
              onArea={(area) => navigate('library', 'all', area)}
              onCloud={() => navigate('cloud')}
              onExam={() => navigate('exam')}
              onReview={() => navigate(due.length ? 'review' : 'library')}
              onPlan={() => navigate('plan')}
              onStart={startExercise}
            />
          )}
          {page === 'library' && (
            <Library
              state={state}
              mastered={mastered}
              filter={topicFilter}
              onFilter={setTopicFilter}
              area={examArea}
              onArea={setExamArea}
              onStart={startExercise}
              onBookmark={bookmark}
              onExam={() => navigate('exam')}
              onPrivate={() => navigate('cloud')}
            />
          )}
          <div hidden={page !== 'exam'}>
            <ExamPractice
              key={`exam:${user?.id ?? 'guest'}`}
              storageScope={user?.id ?? 'guest'}
              onSubmit={answerBatch}
            />
          </div>
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
                      isMastered={mastered.includes(exercise.id)}
                      onStart={startExercise}
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
            <Plan
              state={state}
              mastered={mastered}
              onUpdate={updateState}
              onStart={startExercise}
            />
          )}
          {page === 'tools' && (
            <Tools
              storageKey={storageKey}
              state={state}
              onImport={(next) => {
                const saved = updateState(next);
                if (saved) setToast('Dein Lernstand wurde importiert.');
                return saved;
              }}
            />
          )}
        </main>
        <footer className="workspace-footer">
          <span>WerkTag · Mit Kopf. Mit Hand. Mit dir.</span>
          <span>
            WerkTag Flow <span className="footer-version">/ 0.7.0</span>
          </span>
        </footer>
      </div>
      {activeExercise && (
        <ExerciseDialog
          key={activeExercise.id}
          exercise={activeExercise}
          storageKey={`${storageKey}:workpad:${activeExercise.id}`}
          bookmarked={state.bookmarks.includes(activeExercise.id)}
          onBookmark={() => bookmark(activeExercise.id)}
          onAnswer={(selected) => answer(activeExercise, selected)}
          onClose={() => setActiveExercise(null)}
          onNext={() => {
            const topicExercises =
              exerciseQueue.current ??
              exercises.filter(
                (x) =>
                  x.topicId === activeExercise.topicId &&
                  getExerciseKind(x) === getExerciseKind(activeExercise),
              );
            const index = topicExercises.findIndex((x) => x.id === activeExercise.id);
            if (index === topicExercises.length - 1) {
              setActiveExercise(null);
              if (!exerciseQueue.current) navigate('library', activeExercise.topicId);
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
  isMastered,
  onStart,
  onBookmark,
}: {
  exercise: Exercise;
  state: LearningState;
  isMastered: boolean;
  onStart: (exercise: Exercise) => void;
  onBookmark: (id: string) => void;
}) {
  const Icon = topicIcons[exercise.topicId];
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
        {topics.find((x) => x.id === exercise.topicId)?.name}{' '}
        <DifficultyBadge exercise={exercise} />
      </span>
      <span className={`exercise-kind kind-${getExerciseKind(exercise)}`}>
        {exerciseKindLabels[getExerciseKind(exercise)]}
        {isExamCase(exercise) && <span> · Prüfungsfall</span>}
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
        <button
          className="text-button"
          aria-label={`${exercise.title} üben`}
          onClick={() => onStart(exercise)}
        >
          Üben <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );
}

function Library({
  state,
  mastered,
  filter,
  onFilter,
  area,
  onArea,
  onStart,
  onBookmark,
  onExam,
  onPrivate,
}: {
  state: LearningState;
  mastered: string[];
  filter: TopicId | 'all';
  onFilter: (id: TopicId | 'all') => void;
  area: ExamAreaId | 'all';
  onArea: (id: ExamAreaId | 'all') => void;
  onStart: (exercise: Exercise, queue?: Exercise[]) => void;
  onBookmark: (id: string) => void;
  onExam: () => void;
  onPrivate: () => void;
}) {
  const [search, setSearch] = useState('');
  const [onlySaved, setOnlySaved] = useState(false);
  const [kind, setKind] = useState<ExerciseKind | 'all'>('all');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [sort, setSort] = useState<DifficultySort>('recommended');
  const query = search.trim().toLocaleLowerCase('de');
  const filtered = exercises
    .filter(
      (x) =>
        (filter === 'all' || x.topicId === filter) &&
        (area === 'all' || getExamAreas(x).includes(area)) &&
        (kind === 'all' || getExerciseKind(x) === kind) &&
        matchesDifficulty(x, difficulty) &&
        (!onlySaved || state.bookmarks.includes(x.id)) &&
        `${x.title} ${x.context} ${x.question} ${topics.find((t) => t.id === x.topicId)?.name}`
          .toLocaleLowerCase('de')
          .includes(query),
    )
    .sort((a, b) =>
      sort === 'recommended'
        ? Number(isExamCase(b)) - Number(isExamCase(a))
        : compareExerciseDifficulty(a, b, sort),
    );
  return (
    <section className="practice-library" aria-label="Lernwerkstatt">
      <PageHeading
        eyebrow="DEINE VORBEREITUNG AUF TEIL 2"
        title="Was möchtest du üben?"
        description="Rechnen, Zusammenhänge verstehen oder Wissen abrufen. Wähle die Aufgabenart und deinen Schwerpunkt."
      />
      <p className="library-source-entry">
        Hier übst du mit den eigenen Aufgaben.{' '}
        <button className="text-button" onClick={onPrivate}>
          Alle Fragen aus deinem Lernkonto öffnen <ArrowRight size={16} aria-hidden="true" />
        </button>
      </p>
      <div className="library-exam-entry">
        <span>Eine Aufgabenrunde mit Zeitmessung bearbeiten</span>
        <button className="text-button" onClick={onExam}>
          Zum Prüfungsbereich <ArrowRight size={17} />
        </button>
      </div>
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
      <div className="filter-row kind-filter-row" role="group" aria-label="Aufgabenart filtern">
        {(['all', 'calculation', 'context', 'knowledge'] as const).map((value) => (
          <button
            key={value}
            className={`filter-chip ${kind === value ? 'selected' : ''}`}
            aria-pressed={kind === value}
            onClick={() => setKind(value)}
          >
            {value === 'all' ? 'Alle Aufgabenarten' : exerciseKindLabels[value] + 'n'}
          </button>
        ))}
      </div>
      <div className="filter-row exam-filter-row" role="group" aria-label="Prüfungsbereich filtern">
        <button
          className={`filter-chip ${area === 'all' ? 'selected' : ''}`}
          aria-pressed={area === 'all'}
          onClick={() => onArea('all')}
        >
          Alle Prüfungsbereiche
        </button>
        {examAreas.map((exam) => (
          <button
            key={exam.id}
            className={`filter-chip ${area === exam.id ? 'selected' : ''}`}
            aria-pressed={area === exam.id}
            onClick={() => onArea(exam.id)}
          >
            {exam.title}
          </button>
        ))}
      </div>
      <div className="filter-row" role="group" aria-label="Lernfeld filtern">
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
      <DifficultyControls
        value={difficulty}
        onChange={setDifficulty}
        sort={sort}
        onSort={setSort}
      />
      <DifficultyLegend />
      <div className="results-label">
        <span aria-live="polite" aria-atomic="true">
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
              isMastered={mastered.includes(exercise.id)}
              onStart={(selected) => onStart(selected, filtered)}
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
        >
          <button
            className="button primary"
            onClick={() => {
              setSearch('');
              setOnlySaved(false);
              setKind('all');
              setDifficulty('all');
              setSort('recommended');
              onFilter('all');
              onArea('all');
            }}
          >
            Filter zurücksetzen <RotateCcw size={16} />
          </button>
        </EmptyState>
      )}
    </section>
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
  storageKey,
  bookmarked,
  onBookmark,
  onAnswer,
  onClose,
  onNext,
}: {
  exercise: Exercise;
  storageKey: string;
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
  const [loadedWorkpad] = useState(() => loadWorkpad(storageKey));
  const [workpad, setWorkpad] = useState(loadedWorkpad.draft);
  const [workpadWarning, setWorkpadWarning] = useState(loadedWorkpad.warning);
  const kind = getExerciseKind(exercise);
  const difficultyAssessment = getExerciseDifficulty(exercise);
  function changeWorkpad(next: typeof workpad) {
    setWorkpad(next);
    if (!saveWorkpad(storageKey, next))
      setWorkpadWarning(
        'Deine Notizen bleiben in dieser geöffneten Aufgabe. Der Browserentwurf konnte nicht gespeichert werden; vorhandene Daten bleiben erhalten.',
      );
  }
  const titleId = useId();
  const radioName = useId();
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      opener?.focus({ preventScroll: true });
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
      className={`exercise-dialog ${kind === 'calculation' ? 'calculation-dialog' : ''}`}
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
          <span className="dialog-divider">/</span> <DifficultyBadge exercise={exercise} />
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
        <p className="eyebrow">{exerciseKindLabels[kind]} · Üben</p>
        <h2 id={titleId}>{exercise.title}</h2>
        {difficultyAssessment && (
          <p className="difficulty-reason">
            Anforderung:{' '}
            {submitted
              ? difficultyAssessment.reason
              : difficultyLevels.find((entry) => entry.id === difficultyAssessment.level)!
                  .description}
          </p>
        )}
        <div className="practice-task-layout">
          <div className="task-question-panel">
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
                    <Lightbulb size={17} />{' '}
                    {hintVisible ? 'Hinweis ausblenden' : 'Kleiner Denkanstoß'}
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
                    {correct
                      ? 'Richtig. Das sitzt!'
                      : 'Noch nicht ganz. Hier kommt der Zusammenhang.'}
                  </h3>
                </div>
                {exercise.formula && <div className="formula">{exercise.formula}</div>}
                <p className="explanation">{exercise.explanation}</p>
                <button className="button primary" onClick={onNext}>
                  Weiterlernen <ArrowRight size={17} />
                </button>
              </div>
            )}
          </div>
          <aside className="task-work-panel" aria-label="Dein Arbeitsbereich">
            {kind === 'calculation' ? (
              <CalculationWorkspace draft={workpad} onChange={changeWorkpad} />
            ) : (
              <label className="practice-notes">
                Notizen
                <textarea
                  value={workpad.notes}
                  maxLength={15000}
                  rows={7}
                  placeholder="Gedanken, Begründungen und offene Fragen …"
                  onChange={(event) => changeWorkpad({ ...workpad, notes: event.target.value })}
                />
              </label>
            )}
            <p className="workpad-storage-note" role={workpadWarning ? 'status' : undefined}>
              {workpadWarning ||
                'Dein Entwurf bleibt in diesem Browser gespeichert. Er wird nicht bewertet.'}
            </p>
          </aside>
        </div>
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
  mastered,
  onUpdate,
  onStart,
}: {
  state: LearningState;
  mastered: string[];
  onUpdate: (state: LearningState) => void;
  onStart: (exercise: Exercise) => void;
}) {
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
  storageKey,
  state,
  onImport,
}: {
  storageKey: string;
  state: LearningState;
  onImport: (state: LearningState) => boolean;
}) {
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState<LearningState | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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
        localStorage.getItem(`${storageKey}-recovery`) ?? localStorage.getItem(storageKey);
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
        <Suspense fallback={<p role="status">Deine Formelwerkstatt wird geladen …</p>}>
          <FormulaWorkbench />
        </Suspense>
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
                  if (onImport(pending)) setPending(null);
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
