import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, Lightbulb } from 'lucide-react';
import { exercises } from '../data';
import type { Exercise } from '../data';
import { examAreas, getExamAreas, isExamCase } from '../exam';
import type { ExamAreaId } from '../exam';
import { exerciseKindLabels, getExerciseKind } from '../lib/exercise-kind';
import type { ExerciseKind } from '../lib/exercise-kind';
import { elapsedMilliseconds, formatElapsed, selectPracticeTasks } from '../lib/exam-session';
import { CalculationWorkspace, emptyWorkpad } from './CalculationWorkspace';
import type { WorkpadDraft } from './CalculationWorkspace';
import '../design/exam-practice.css';

interface PracticeRound {
  version: 1;
  roundId: string;
  taskIds: string[];
  area: ExamAreaId;
  position: number;
  startedAt: number;
  endedAt: number | null;
  examMode: boolean;
  usedLearningMode: boolean;
  answers: Record<string, number>;
  workpads: Record<string, WorkpadDraft>;
  hints: string[];
  saveFailed: boolean;
}

export interface ExamAnswer {
  exercise: Exercise;
  selected: number;
  attemptId: string;
}

const knownTasks = new Map(exercises.map((task) => [task.id, task]));
const kinds: ExerciseKind[] = ['calculation', 'context', 'knowledge'];
const workpadFields: (keyof WorkpadDraft)[] = ['given', 'approach', 'working', 'result', 'notes'];

function loadRound(key: string): PracticeRound | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const data = value as Record<string, unknown>;
    if (
      data.version !== 1 ||
      (data.roundId !== undefined &&
        (typeof data.roundId !== 'string' || !data.roundId.trim() || data.roundId.length > 80)) ||
      !Array.isArray(data.taskIds) ||
      !data.taskIds.length ||
      data.taskIds.length > 6 ||
      !data.taskIds.every((id) => typeof id === 'string' && knownTasks.has(id)) ||
      new Set(data.taskIds).size !== data.taskIds.length ||
      !examAreas.some((area) => area.id === data.area) ||
      !Number.isInteger(data.position) ||
      (data.position as number) < 0 ||
      (data.position as number) >= data.taskIds.length ||
      typeof data.startedAt !== 'number' ||
      !Number.isFinite(data.startedAt) ||
      data.startedAt <= 0 ||
      data.startedAt > Date.now() + 60_000 ||
      !(
        data.endedAt === null ||
        (typeof data.endedAt === 'number' &&
          Number.isFinite(data.endedAt) &&
          data.endedAt >= data.startedAt)
      ) ||
      typeof data.examMode !== 'boolean' ||
      typeof data.usedLearningMode !== 'boolean' ||
      !data.answers ||
      typeof data.answers !== 'object' ||
      Array.isArray(data.answers) ||
      !data.workpads ||
      typeof data.workpads !== 'object' ||
      Array.isArray(data.workpads) ||
      !Array.isArray(data.hints) ||
      !data.hints.every((id) => (data.taskIds as unknown[]).includes(id))
    )
      return null;
    for (const [id, answer] of Object.entries(data.answers)) {
      const task = knownTasks.get(id);
      if (
        !data.taskIds.includes(id) ||
        !task ||
        !Number.isInteger(answer) ||
        (answer as number) < 0 ||
        (answer as number) >= task.options.length
      )
        return null;
    }
    for (const [id, workpad] of Object.entries(data.workpads)) {
      if (
        !data.taskIds.includes(id) ||
        !workpad ||
        typeof workpad !== 'object' ||
        Array.isArray(workpad)
      )
        return null;
      if (
        !workpadFields.every(
          (field) => typeof (workpad as Record<string, unknown>)[field] === 'string',
        )
      )
        return null;
    }
    return {
      ...(data as unknown as PracticeRound),
      roundId: typeof data.roundId === 'string' ? data.roundId : `legacy-${data.startedAt}`,
      saveFailed: data.saveFailed === true,
    };
  } catch {
    // Preserve an unreadable stored draft until the user explicitly starts a new round.
    return null;
  }
}

export function ExamPractice({
  onSubmit,
  storageScope = 'guest',
}: {
  onSubmit: (answers: ExamAnswer[]) => boolean | void;
  storageScope?: string;
}) {
  const storageKey = `werktag-exam-session-v1:${encodeURIComponent(storageScope)}`;
  const [round, setRound] = useState<PracticeRound | null>(() => loadRound(storageKey));
  const [area, setArea] = useState<ExamAreaId>(round?.area ?? 'arbeitsplanung');
  const [kind, setKind] = useState<ExerciseKind | 'all'>('all');
  const [examMode, setExamMode] = useState(round?.examMode ?? false);
  const [now, setNow] = useState(Date.now);
  const [storageWarning, setStorageWarning] = useState('');
  const [selectionOffset, setSelectionOffset] = useState(0);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const submitting = useRef(false);
  const candidates = useMemo(
    () =>
      exercises
        .filter(
          (task) =>
            getExamAreas(task).includes(area) && (kind === 'all' || getExerciseKind(task) === kind),
        )
        .sort((a, b) => Number(isExamCase(b)) - Number(isExamCase(a))),
    [area, kind],
  );
  const selectedTasks = useMemo(
    () => selectPracticeTasks(candidates, selectionOffset),
    [candidates, selectionOffset],
  );
  const tasks = round?.taskIds.map((id) => knownTasks.get(id)!) ?? [];
  const task = round ? tasks[round.position] : null;
  const ended = round?.endedAt !== null && round !== null;
  const currentMode = round?.examMode ?? examMode;
  const elapsed = round ? elapsedMilliseconds(round.startedAt, round.endedAt, now) : 0;
  const answered = round ? Object.keys(round.answers).length : 0;
  const areaTitle = examAreas.find((entry) => entry.id === (round?.area ?? area))!.title;
  const roundRef = useRef(round);
  roundRef.current = round;

  useEffect(() => {
    if (!round || round.endedAt !== null) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [round?.startedAt, round?.endedAt]);

  function persist(next: PracticeRound | null) {
    roundRef.current = next;
    setRound(next);
    try {
      if (next) sessionStorage.setItem(storageKey, JSON.stringify(next));
      else sessionStorage.removeItem(storageKey);
      setStorageWarning('');
    } catch {
      setStorageWarning('Der Rundenentwurf bleibt nur in dieser geöffneten Ansicht erhalten.');
    }
  }

  function start() {
    if (!selectedTasks.length) return;
    const startedAt = Date.now();
    submitting.current = false;
    setNow(startedAt);
    persist({
      version: 1,
      roundId: crypto.randomUUID(),
      taskIds: selectedTasks.map((entry) => entry.id),
      area,
      position: 0,
      startedAt,
      endedAt: null,
      examMode,
      usedLearningMode: !examMode,
      answers: {},
      workpads: {},
      hints: [],
      saveFailed: false,
    });
  }

  function changeMode() {
    const active = roundRef.current;
    const nextMode = !(active?.examMode ?? examMode);
    setExamMode(nextMode);
    if (active && active.endedAt === null)
      persist({
        ...active,
        examMode: nextMode,
        usedLearningMode: active.usedLearningMode || !nextMode,
      });
  }

  function updateWorkpad(draft: WorkpadDraft) {
    const active = roundRef.current;
    if (!active || !task || active.endedAt !== null) return;
    persist({ ...active, workpads: { ...active.workpads, [task.id]: draft } });
  }

  function move(position: number) {
    const active = roundRef.current;
    if (!active) return;
    persist({ ...active, position });
    requestAnimationFrame(() => questionRef.current?.focus({ preventScroll: true }));
  }

  function submitRound() {
    const active = roundRef.current;
    if (!active || active.endedAt !== null || submitting.current) return;
    submitting.current = true;
    const stoppedAt = Date.now();
    const next = { ...active, endedAt: stoppedAt };
    // Mark this session submitted before calling out; recovery never replays attempts.
    persist(next);
    setNow(stoppedAt);
    let saved = true;
    const answers = tasks.flatMap((exercise) => {
      const selected = active.answers[exercise.id];
      return selected === undefined
        ? []
        : [{ exercise, selected, attemptId: `exam:${active.roundId}:${exercise.id}` }];
    });
    try {
      if (answers.length) saved = onSubmit(answers) !== false;
    } catch {
      saved = false;
    }
    if (!saved) persist({ ...next, saveFailed: true });
    requestAnimationFrame(() => questionRef.current?.focus({ preventScroll: true }));
  }

  const correctCount = round
    ? tasks.filter((entry) => round.answers[entry.id] === entry.correctIndex).length
    : 0;
  const workpad = task && round ? (round.workpads[task.id] ?? emptyWorkpad()) : emptyWorkpad();

  return (
    <section className="exam-practice" aria-label="Prüfungsbereich">
      <header className="exam-page-heading">
        <p className="eyebrow">DEINE PRÜFUNGSVORBEREITUNG</p>
        <h1>Dein Prüfungsbereich.</h1>
        <p>
          Übe mit Platz für deinen Rechenweg oder schalte die Lernhilfen für eine Prüfungsrunde aus.
        </p>
      </header>

      <div className="exam-mode-bar">
        <div>
          <strong>{currentMode ? 'Prüfungsmodus' : 'Lernmodus'}</strong>
          <p>
            {currentMode
              ? 'Ohne Lernhilfen. Benutze deinen eigenen Taschenrechner.'
              : 'Mit Teilschritten, Notizen, Hinweisen und Taschenrechner.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={currentMode}
          aria-label="Prüfungsmodus"
          className="exam-mode-switch"
          onClick={changeMode}
          disabled={ended}
        >
          <span aria-hidden="true" className="exam-switch-track">
            <span />
          </span>
          <span>Prüfungsmodus {currentMode ? 'an' : 'aus'}</span>
        </button>
      </div>
      {storageWarning && (
        <p className="exam-session-warning" role="status">
          {storageWarning}
        </p>
      )}

      {!round ? (
        <div className="exam-setup">
          <div className="exam-setup-fields">
            <label>
              Prüfungsbereich
              <select value={area} onChange={(event) => setArea(event.target.value as ExamAreaId)}>
                {examAreas.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Aufgabenart
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as ExerciseKind | 'all')}
              >
                <option value="all">Alle Aufgabenarten</option>
                {kinds.map((entry) => (
                  <option key={entry} value={entry}>
                    {exerciseKindLabels[entry]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="exam-start-row">
            <div>
              <h2>{selectedTasks.length} Aufgaben für diese Runde</h2>
              <p>
                Aus {candidates.length} passenden eigenen Übungen. Die Zeit startet erst mit deinem
                Klick und läuft bis zur Abgabe.
              </p>
            </div>
            <button
              type="button"
              className="button primary"
              onClick={start}
              disabled={!selectedTasks.length}
            >
              Runde starten <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
          <p className="exam-source-note">
            Aufbau an deinen bekannten Prüfungsbögen orientiert. Eigene Übungsaufgaben mit
            Antwortauswahl; keine Originalprüfung, keine amtlichen Punkte oder Zeitvorgaben.
          </p>
        </div>
      ) : (
        <>
          <div className="exam-round-status">
            <div>
              <strong>{round.usedLearningMode ? 'Übungsrunde' : 'Prüfungsrunde'}</strong>
              <span>
                {areaTitle} · {answered} von {tasks.length} beantwortet
              </span>
              {round.usedLearningMode && currentMode && (
                <small>Lernmodus war in dieser Runde aktiv.</small>
              )}
            </div>
            <div
              className="exam-clock"
              role="timer"
              aria-label="Gemessene Bearbeitungszeit"
              aria-live="off"
            >
              <Clock3 size={18} aria-hidden="true" />
              <div>
                <strong data-testid="exam-elapsed">{formatElapsed(elapsed)}</strong>
                <span>{ended ? 'Zeit gestoppt' : 'Zeit läuft'}</span>
              </div>
            </div>
          </div>

          {ended && (
            <section className="exam-round-result" aria-label="Rundenergebnis">
              <h2>Runde abgegeben</h2>
              <p>
                {correctCount} von {answered} abgegebenen Antworten stimmen mit dem Lösungsschlüssel
                überein. {tasks.length - answered} Aufgaben bleiben unbeantwortet.
              </p>
              <p>
                Gemessene Zeit: {formatElapsed(elapsed)}.{' '}
                {round.usedLearningMode
                  ? 'Diese Runde wurde mit aktiviertem Lernmodus bearbeitet.'
                  : 'Diese Runde wurde ohne Lernhilfen bearbeitet.'}
              </p>
              {round.saveFailed && (
                <p role="status">
                  Die Antworten konnten nicht in deinen Lernstand übernommen werden. Deine
                  Rundenauswertung bleibt hier erhalten.
                </p>
              )}
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setSelectionOffset((value) => value + tasks.length);
                  persist(null);
                }}
              >
                Neue Runde vorbereiten <ArrowRight size={16} aria-hidden="true" />
              </button>
            </section>
          )}

          <nav className="exam-question-nav" aria-label="Aufgaben der Runde">
            {tasks.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                aria-label={`Aufgabe ${index + 1}${round.answers[entry.id] !== undefined ? ', beantwortet' : ', offen'}`}
                aria-current={round.position === index ? 'step' : undefined}
                onClick={() => move(index)}
                className={round.position === index ? 'current' : ''}
              >
                {index + 1}
                {round.answers[entry.id] !== undefined && <Check size={12} aria-hidden="true" />}
              </button>
            ))}
          </nav>

          {task && (
            <article className="exam-paper" aria-labelledby="exam-task-title">
              <header className="exam-paper-heading">
                <span>
                  Aufgabe {round.position + 1} / {tasks.length}
                </span>
                <span>{exerciseKindLabels[getExerciseKind(task)]}</span>
              </header>
              <div className="exam-paper-body">
                <h2 id="exam-task-title" ref={questionRef} tabIndex={-1}>
                  {task.title}
                </h2>
                <p className="exam-task-context">{task.context}</p>
                <fieldset className="exam-answers" disabled={ended}>
                  <legend>{task.question}</legend>
                  {task.options.map((option, index) => (
                    <label
                      key={`${task.id}:${index}`}
                      className={round.answers[task.id] === index ? 'selected' : ''}
                    >
                      <input
                        type="radio"
                        name={`exam-answer-${task.id}`}
                        value={index}
                        checked={round.answers[task.id] === index}
                        onChange={() =>
                          persist({ ...round, answers: { ...round.answers, [task.id]: index } })
                        }
                      />
                      <span className="exam-option-letter" aria-hidden="true">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span>{option}</span>
                    </label>
                  ))}
                </fieldset>

                {!ended && !currentMode && (
                  <>
                    <div className="exam-hint-controls">
                      <button
                        type="button"
                        className="text-button"
                        aria-expanded={round.hints.includes(task.id)}
                        onClick={() =>
                          persist({
                            ...round,
                            hints: round.hints.includes(task.id)
                              ? round.hints.filter((id) => id !== task.id)
                              : [...round.hints, task.id],
                          })
                        }
                      >
                        <Lightbulb size={17} aria-hidden="true" />
                        {round.hints.includes(task.id) ? 'Hinweis schließen' : 'Hinweis anzeigen'}
                      </button>
                    </div>
                    {round.hints.includes(task.id) && (
                      <div className="exam-hint">
                        <p>{task.hint}</p>
                        {task.formula && <p className="exam-formula">{task.formula}</p>}
                      </div>
                    )}
                    {getExerciseKind(task) === 'calculation' ? (
                      <CalculationWorkspace draft={workpad} onChange={updateWorkpad} />
                    ) : (
                      <label className="exam-notes-label">
                        Notizen zur Aufgabe
                        <textarea
                          value={workpad.notes}
                          rows={6}
                          onChange={(event) =>
                            updateWorkpad({ ...workpad, notes: event.target.value })
                          }
                        />
                      </label>
                    )}
                  </>
                )}

                {!ended && currentMode && getExerciseKind(task) === 'calculation' && (
                  <label className="exam-free-working">
                    Freier Rechenweg
                    <textarea
                      rows={10}
                      value={workpad.working}
                      onChange={(event) =>
                        updateWorkpad({ ...workpad, working: event.target.value })
                      }
                    />
                  </label>
                )}

                {ended && (
                  <section className="exam-task-solution" aria-label="Auswertung dieser Aufgabe">
                    <h3>
                      {round.answers[task.id] === undefined
                        ? 'Unbeantwortet'
                        : round.answers[task.id] === task.correctIndex
                          ? 'Antwort richtig'
                          : 'Antwort noch nicht richtig'}
                    </h3>
                    <p className="exam-explanation">{task.explanation}</p>
                    {workpadFields.some((field) => workpad[field].trim()) && (
                      <details>
                        <summary>Deine gespeicherten Notizen und Rechenschritte</summary>
                        <dl>
                          {workpadFields
                            .filter((field) => workpad[field].trim())
                            .map((field) => (
                              <div key={field}>
                                <dt>
                                  {
                                    {
                                      given: 'Gegeben & gesucht',
                                      approach: 'Ansatz & Einheiten',
                                      working: 'Rechenweg',
                                      result: 'Ergebnis & Kontrolle',
                                      notes: 'Notizen',
                                    }[field]
                                  }
                                </dt>
                                <dd>{workpad[field]}</dd>
                              </div>
                            ))}
                        </dl>
                      </details>
                    )}
                  </section>
                )}
              </div>
              <footer className="exam-paper-footer">
                <button
                  type="button"
                  className="button secondary"
                  disabled={round.position === 0}
                  onClick={() => move(round.position - 1)}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Zurück
                </button>
                {round.position < tasks.length - 1 ? (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => move(round.position + 1)}
                  >
                    Nächste Aufgabe <ArrowRight size={16} aria-hidden="true" />
                  </button>
                ) : (
                  <span>Letzte Aufgabe</span>
                )}
              </footer>
            </article>
          )}

          {!ended && (
            <div className="exam-hand-in">
              <p>
                Du kannst zwischen allen Aufgaben wechseln. Lösungen erscheinen nach der Abgabe.
              </p>
              <button type="button" className="button primary" onClick={submitRound}>
                Runde abgeben <Check size={17} aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
