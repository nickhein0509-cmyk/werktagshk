import { useId } from 'react';
import type { Exercise } from '../data';
import { difficultyLevels, getExerciseDifficulty } from '../lib/difficulty';
import type { DifficultyLevel } from '../lib/difficulty';
import '../design/difficulty.css';

export type DifficultyFilter = DifficultyLevel | 'all' | 'unrated';
export type DifficultySort = 'recommended' | 'asc' | 'desc';

export function matchesDifficulty(exercise: Exercise, filter: DifficultyFilter): boolean {
  const assessment = getExerciseDifficulty(exercise);
  return (
    filter === 'all' || (filter === 'unrated' ? assessment === null : assessment?.level === filter)
  );
}

export function DifficultyBadge({ exercise }: { exercise: Exercise }) {
  const assessment = getExerciseDifficulty(exercise);
  if (!assessment)
    return <span className="difficulty-badge is-unrated">Noch nicht eingestuft</span>;
  const level = difficultyLevels.find((entry) => entry.id === assessment.level)!;
  return (
    <span className="difficulty-badge" data-difficulty={assessment.level} title={level.description}>
      Stufe {assessment.level} · {level.label}
    </span>
  );
}

export function DifficultyControls({
  value,
  onChange,
  sort,
  onSort,
}: {
  value: DifficultyFilter;
  onChange: (value: DifficultyFilter) => void;
  sort?: DifficultySort;
  onSort?: (sort: DifficultySort) => void;
}) {
  const id = useId();
  return (
    <div className="difficulty-controls">
      <label htmlFor={`${id}-difficulty`}>
        Schwierigkeit
        <select
          id={`${id}-difficulty`}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value === 'all' || event.target.value === 'unrated'
                ? event.target.value
                : (Number(event.target.value) as DifficultyLevel),
            )
          }
        >
          <option value="all">Alle Stufen</option>
          {difficultyLevels.map((level) => (
            <option key={level.id} value={level.id}>
              Stufe {level.id} · {level.label}
            </option>
          ))}
          <option value="unrated">Noch nicht eingestuft</option>
        </select>
      </label>
      {sort !== undefined && onSort && (
        <label htmlFor={`${id}-sort`}>
          Sortierung
          <select
            id={`${id}-sort`}
            value={sort}
            onChange={(event) => onSort(event.target.value as DifficultySort)}
          >
            <option value="recommended">Prüfungsfälle zuerst</option>
            <option value="asc">Leicht nach schwer</option>
            <option value="desc">Schwer nach leicht</option>
          </select>
        </label>
      )}
    </div>
  );
}

export function DifficultyLegend() {
  return (
    <details className="difficulty-legend">
      <summary>Was bedeuten die Schwierigkeitsstufen?</summary>
      <p>
        Redaktionelle Einschätzung der Aufgabenanforderung. Entscheidend sind Denkweg, Methodenwahl
        und verknüpfte Bedingungen. Die Stufe misst weder dein Können noch deine Prüfungsreife.
      </p>
      <ol>
        {difficultyLevels.map((level) => (
          <li key={level.id}>
            <strong>
              Stufe {level.id} · {level.label}
            </strong>
            <span>{level.description}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
