import '../design/dashboard-finish.css';
import '../design/dashboard-cockpit.css';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  ScanLine,
  Droplets,
  Flame,
  RotateCcw,
  ShieldCheck,
  Wind,
} from 'lucide-react';
import { exercises, topics } from '../data';
import type { Exercise, TopicId } from '../data';
import { examAreas, examDate } from '../exam';
import type { ExamAreaId } from '../exam';
import { getMasteredIds, getStreak, getTodayCount } from '../lib/learning';
import type { LearningState } from '../lib/learning';

const areaIcons = [ClipboardList, ScanLine, BriefcaseBusiness];

const topicIcons = { heizung: Flame, sanitaer: Droplets, klima: Wind, wiso: BriefcaseBusiness };

export function FlowDashboard({
  state,
  dueCount,
  weekDots,
  onLibrary,
  onArea,
  onCloud,
  onExam,
  onReview,
  onPlan,
  onStart,
}: {
  state: LearningState;
  dueCount: number;
  weekDots: ReactNode;
  onLibrary: (topic?: TopicId | 'all') => void;
  onArea: (area: ExamAreaId) => void;
  onCloud: () => void;
  onExam: () => void;
  onReview: () => void;
  onPlan: () => void;
  onStart: (exercise: Exercise) => void;
}) {
  const mastered = new Set(getMasteredIds(state));
  const todayCount = getTodayCount(state);
  const streak = getStreak(state);
  const nextExercise = exercises.find((exercise) => !mastered.has(exercise.id)) ?? exercises[0];

  return (
    <div className="flow-dashboard flow-cockpit">
      <div className="cockpit-main">
        <section className="flow-hero" aria-labelledby="flow-title">
          <div className="flow-hero-content">
            <p className="eyebrow flow-exam-eyebrow">SHK · ABSCHLUSSPRÜFUNG TEIL 2</p>
            <h1 id="flow-title">Dein Lernplatz.</h1>
            <div className="flow-hero-bottom">
              <div className="flow-focus">
                <p>Prüfungsfragen üben, Zusammenhänge verstehen und gezielt wiederholen.</p>
                <div className="flow-hero-actions">
                  <button className="button hero-action" onClick={() => onLibrary()}>
                    Prüfungsfragen öffnen <ArrowUpRight size={19} />
                  </button>
                  <button className="text-button" onClick={onExam}>
                    Runde mit Zeitmessung <ArrowRight size={17} />
                  </button>
                </div>
                <a className="text-button cockpit-jump" href="#routine-title">
                  Heute im Blick <ArrowRight size={16} />
                </a>
                <span className="hero-meta">
                  Eigene Übungsaufgaben · keine offiziellen Prüfungen
                </span>
              </div>
              <p className="cockpit-exam-date">
                Dein Prüfungstermin: <time dateTime={examDate}>7. Dezember 2026</time>
              </p>
            </div>
          </div>
        </section>

        <section className="flow-subjects" aria-labelledby="exam-areas-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">DEINE SCHRIFTLICHEN SCHWERPUNKTE</p>
              <h2 id="exam-areas-title">Womit möchtest du starten?</h2>
            </div>
            <button className="text-button" onClick={() => onLibrary()}>
              Alle Aufgaben <ArrowRight size={16} />
            </button>
          </div>
          <div className="exam-priority-grid">
            {examAreas.map((area, index) => {
              const AreaIcon = areaIcons[index];
              return (
                <button
                  className="exam-priority-card"
                  key={area.id}
                  onClick={() => onArea(area.id)}
                >
                  <div className="exam-priority-top">
                    <span className="exam-area-number">0{index + 1}</span>
                    <span className="exam-area-symbol" aria-hidden="true">
                      <AreaIcon size={28} strokeWidth={1.25} />
                    </span>
                  </div>
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                  <span className="inline-link">
                    Fragen üben <ArrowRight size={16} />
                  </span>
                </button>
              );
            })}
          </div>
          <p className="exam-priority-note">
            Redaktionelle Schwerpunkte zur Vorbereitung · keine Vorhersage von Prüfungsfragen.
          </p>
        </section>
        <section className="cockpit-topics" aria-labelledby="topics-title">
          <div className="flow-topics-heading">
            <h2 id="topics-title">Deine Lernfelder</h2>
            <span>DEINE MODELLÜBUNGEN</span>
          </div>
          <div className="topic-grid">
            {topics.map((topic, index) => {
              const Icon = topicIcons[topic.id];
              const topicExercises = exercises.filter((exercise) => exercise.topicId === topic.id);
              const done = topicExercises.filter((exercise) => mastered.has(exercise.id)).length;
              return (
                <button
                  className={`topic-card ${topic.id}`}
                  key={topic.id}
                  onClick={() => onLibrary(topic.id)}
                >
                  <div className="topic-top">
                    <span className="subject-object">
                      <Icon size={31} strokeWidth={1.5} />
                    </span>
                    <span className="subject-index">0{index + 1}</span>
                  </div>
                  <h3>{topic.name}</h3>
                  <p>{topic.subtitle}</p>
                  <div className="topic-progress">
                    <span>
                      {done} von {topicExercises.length} zuletzt richtig
                    </span>
                    <ArrowUpRight size={18} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
      <aside className="flow-routine" aria-labelledby="routine-title">
        <div className="section-heading">
          <h2 id="routine-title" tabIndex={-1}>
            Heute im Blick
          </h2>
        </div>
        <div className="routine-grid">
          <button
            className="routine-action routine-start"
            aria-labelledby="cockpit-start-label"
            onClick={() => onStart(nextExercise)}
          >
            <span className="routine-icon">
              <Flame size={25} strokeWidth={1.5} />
            </span>
            <span className="routine-count">ca. {nextExercise.estimatedMinutes} Min</span>
            <h3>Eine Aufgabe zum Einstieg</h3>
            <p>{nextExercise.title}</p>
            <span className="inline-link" id="cockpit-start-label">
              Lerneinheit starten <ArrowUpRight size={16} />
            </span>
          </button>
          <div className="routine-week">
            <span className="routine-icon">
              <CalendarDays size={25} strokeWidth={1.5} />
            </span>
            <h3>Dein Tagesziel</h3>
            <div className="goal-ring">
              <strong>
                {todayCount}/{state.dailyGoal}
              </strong>
              <span> Aufgaben heute</span>
            </div>
            <progress
              className="routine-goal-progress"
              value={Math.min(todayCount, state.dailyGoal)}
              max={state.dailyGoal}
              aria-label="Heutiges Tagesziel"
            />
            {weekDots}
            <p>
              {streak} {streak === 1 ? 'Lerntag' : 'Lerntage'} in Folge
            </p>
            <button className="text-button" onClick={onPlan}>
              Tagesziel anpassen <ArrowRight size={16} />
            </button>
          </div>
          <button className="routine-action" onClick={onReview}>
            <span className="routine-icon">
              <RotateCcw size={25} strokeWidth={1.5} />
            </span>
            <span className="routine-count">
              {dueCount} {dueCount === 1 ? 'Aufgabe fällig' : 'Aufgaben fällig'}
            </span>
            <h3>Gezielt wiederholen</h3>
            <p>
              {dueCount
                ? 'Greif offene Aufgaben noch einmal auf und vertiefe den Zusammenhang.'
                : 'Nach deinen ersten Antworten findest du hier die passenden Wiederholungen.'}
            </p>
            <span className="inline-link">
              {dueCount ? 'Jetzt wiederholen' : 'Erste Aufgabe entdecken'} <ArrowRight size={16} />
            </span>
          </button>
        </div>
        <button className="text-button cockpit-private" onClick={onCloud}>
          Mein Fragenbestand <ArrowRight size={16} />
        </button>
        <p className="content-footnote">
          <ShieldCheck size={14} /> Modellübungen und privater Fragenbestand führen ihren
          Fortschritt getrennt.
        </p>
      </aside>
    </div>
  );
}
