import { useId, useState } from 'react';
import { Calculator, ArrowDownLeft } from 'lucide-react';
import { calculateExpression, formatCalculatorResult } from '../lib/calculator';
import '../design/calculation-workspace.css';

export interface WorkpadDraft {
  given: string;
  approach: string;
  working: string;
  result: string;
  notes: string;
}

export const emptyWorkpad = (): WorkpadDraft => ({
  given: '',
  approach: '',
  working: '',
  result: '',
  notes: '',
});

const fields: { key: keyof WorkpadDraft; label: string; rows: number; placeholder: string }[] = [
  {
    key: 'given',
    label: 'Gegeben & gesucht',
    rows: 3,
    placeholder: 'Werte mit Einheiten und gesuchte Größe …',
  },
  {
    key: 'approach',
    label: 'Ansatz & Einheiten',
    rows: 3,
    placeholder: 'Formel auswählen, umstellen, Einheiten umrechnen …',
  },
  {
    key: 'working',
    label: 'Rechenweg',
    rows: 6,
    placeholder: 'Deine Teilschritte und Zwischenergebnisse …',
  },
  {
    key: 'result',
    label: 'Ergebnis & Kontrolle',
    rows: 3,
    placeholder: 'Ergebnis mit Einheit, Rundung und Plausibilitätskontrolle …',
  },
  {
    key: 'notes',
    label: 'Notizen',
    rows: 3,
    placeholder: 'Eigene Gedanken, Skizzenhinweise oder offene Fragen …',
  },
];

function WorkpadCalculator() {
  const id = useId();
  const [expression, setExpression] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const keys = [
    '7',
    '8',
    '9',
    '÷',
    '4',
    '5',
    '6',
    '×',
    '1',
    '2',
    '3',
    '−',
    '0',
    ',',
    '%',
    '+',
    '(',
    ')',
    'sqrt(',
    '^2',
  ];
  function update(value: string) {
    setExpression(value);
    setAnswer('');
    setError('');
  }
  function calculate() {
    try {
      setAnswer(formatCalculatorResult(calculateExpression(expression)));
      setError('');
    } catch (reason) {
      setAnswer('');
      setError(reason instanceof Error ? reason.message : 'Prüfe deine Rechnung.');
    }
  }
  return (
    <details className="workpad-calculator">
      <summary>
        <Calculator size={18} aria-hidden="true" />
        <span>Taschenrechner</span>
        <span className="workpad-calculator-summary">aufklappen</span>
      </summary>
      <div className="workpad-calculator-body">
        <label htmlFor={`${id}-expression`}>Rechnung</label>
        <input
          id={`${id}-expression`}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          value={expression}
          placeholder="z. B. (12 + 8) × 3"
          maxLength={512}
          aria-describedby={`${id}-rules${error ? ` ${id}-error` : ''}`}
          aria-invalid={!!error}
          onChange={(event) => update(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              calculate();
            }
          }}
        />
        <div
          className="workpad-calculator-keys"
          role="group"
          aria-label="Rechenzeichen und Ziffern"
        >
          {keys.map((key) => (
            <button
              type="button"
              key={key}
              onClick={() => update(expression + key)}
              aria-label={
                key === 'sqrt('
                  ? 'Quadratwurzel einfügen'
                  : key === '^2'
                    ? 'Quadrat einfügen'
                    : undefined
              }
            >
              {key === 'sqrt(' ? '√' : key === '^2' ? 'x²' : key}
            </button>
          ))}
        </div>
        <div className="workpad-calculator-actions">
          <button type="button" onClick={() => update('')}>
            Löschen
          </button>
          <button
            type="button"
            onClick={() => update(expression.slice(0, -1))}
            aria-label="Letztes Zeichen löschen"
          >
            ⌫
          </button>
          <button type="button" className="workpad-calculate" onClick={calculate}>
            = Berechnen
          </button>
        </div>
        <div className="workpad-calculator-output" aria-live="polite" aria-atomic="true">
          {error ? (
            <p className="workpad-calculator-error" id={`${id}-error`}>
              {error}
            </p>
          ) : answer ? (
            <>
              <span>Ergebnis</span>
              <output>{answer}</output>
              <button type="button" onClick={() => update(answer)}>
                <ArrowDownLeft size={15} aria-hidden="true" /> Weiterrechnen
              </button>
            </>
          ) : (
            <p>Mit Enter oder „Berechnen“ auswerten.</p>
          )}
        </div>
        <p className="workpad-calculator-rules" id={`${id}-rules`}>
          Komma oder Punkt als Dezimalzeichen. Keine Tausendertrennzeichen. % bedeutet geteilt durch
          100; Wurzel als sqrt(…). Anzeige: bis zu 12 gültige Ziffern.
        </p>
      </div>
    </details>
  );
}

export function CalculationWorkspace({
  draft,
  onChange,
}: {
  draft: WorkpadDraft;
  onChange: (draft: WorkpadDraft) => void;
}) {
  const id = useId();
  return (
    <section className="calculation-workspace" aria-labelledby={`${id}-heading`}>
      <div className="workpad-heading">
        <div>
          <h3 id={`${id}-heading`}>Dein Rechenblatt</h3>
          <p>Schritt für Schritt. Platz für deinen eigenen Lösungsweg.</p>
        </div>
      </div>
      <div className="workpad-layout">
        <div className="workpad-fields">
          {fields.map(({ key, label, rows, placeholder }, index) => (
            <label
              className={`workpad-field workpad-field-${key}`}
              key={key}
              htmlFor={`${id}-${key}`}
            >
              <span>
                <span className="workpad-step" aria-hidden="true">
                  {key === 'notes' ? '＋' : String(index + 1).padStart(2, '0')}
                </span>
                {label}
              </span>
              <textarea
                id={`${id}-${key}`}
                rows={rows}
                value={draft[key]}
                placeholder={placeholder}
                maxLength={12000}
                onChange={(event) => onChange({ ...draft, [key]: event.target.value })}
              />
            </label>
          ))}
        </div>
        <WorkpadCalculator />
      </div>
    </section>
  );
}
