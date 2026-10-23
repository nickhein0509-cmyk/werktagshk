import { useId, useState } from 'react';
import { BookOpen, Calculator, RefreshCw } from 'lucide-react';
import {
  convertFormulaEntry,
  createFormulaDraft,
  filterFormulas,
  formatFormulaNumber,
  formulaCatalog,
  formulaGroups,
  getFormula,
  solveFormula,
  supportedFormulaTargets,
} from '../lib/formulas';
import type { FormulaDraft, FormulaEntry, FormulaGroupId, FormulaId } from '../lib/formulas';
import '../design/formula-workbench.css';

export function FormulaWorkbench() {
  const id = useId();
  const [formulaId, setFormulaId] = useState<FormulaId>('heat');
  const [group, setGroup] = useState<FormulaGroupId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [drafts, setDrafts] = useState<Partial<Record<FormulaId, FormulaDraft>>>(() => ({
    heat: createFormulaDraft('heat'),
  }));
  const formula = getFormula(formulaId);
  const draft = drafts[formulaId] ?? createFormulaDraft(formulaId);
  const target = formula.variables.find((entry) => entry.id === draft.target)!;
  const inputFields = formula.variables.filter((entry) => entry.id !== target.id);
  const outputUnit = draft.outputUnits[target.id];
  const result = solveFormula(formulaId, target.id, draft.entries, outputUnit);
  const visibleFormulas = filterFormulas(group, query);

  function changeFilters(nextGroup: FormulaGroupId | 'all', nextQuery: string) {
    setGroup(nextGroup);
    setQuery(nextQuery);
    const matches = filterFormulas(nextGroup, nextQuery);
    if (matches.length && !matches.some((entry) => entry.id === formulaId)) {
      setFormulaId(matches[0].id);
    }
  }

  function update(next: FormulaDraft) {
    setDrafts((current) => ({ ...current, [formulaId]: next }));
  }
  function updateEntry(field: string, next: FormulaEntry) {
    update({ ...draft, entries: { ...draft.entries, [field]: next } });
  }
  function changeTarget(next: string) {
    // Carry the current result into the known quantities before rearranging.
    // This keeps the same physical example instead of silently restoring sample values.
    const entries = result.ok
      ? {
          ...draft.entries,
          [target.id]: {
            text: result.value.toString().replace('.', ','),
            unit: result.unit,
          },
        }
      : draft.entries;
    update({ ...draft, entries, target: next });
  }

  return (
    <>
      <section className="surface calculator formula-workbench" aria-labelledby={`${id}-heading`}>
        <div className="section-heading">
          <h2 id={`${id}-heading`}>Deine Formelwerkstatt</h2>
          <Calculator size={22} aria-hidden="true" />
        </div>
        <p>Formel wählen, gesuchte Größe umstellen und mit deinen Werten rechnen.</p>
        <p className="formula-scope">{formulaCatalog.length} Formeln · Auswahl zum Üben</p>
        <div className="formula-filters">
          <div>
            <label htmlFor={`${id}-group`}>Formelbereich</label>
            <select
              id={`${id}-group`}
              value={group}
              onChange={(event) =>
                changeFilters(event.target.value as FormulaGroupId | 'all', query)
              }
            >
              <option value="all">Alle Bereiche</option>
              {formulaGroups.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-search`}>Formeln durchsuchen</label>
            <input
              id={`${id}-search`}
              type="search"
              placeholder="z. B. Druck oder COP"
              value={query}
              onChange={(event) => changeFilters(group, event.target.value)}
            />
          </div>
        </div>
        {(group !== 'all' || query.trim()) && (
          <p className="formula-filter-status" role="status">
            {visibleFormulas.length
              ? `${visibleFormulas.length} passende Formeln`
              : 'Keine passende Formel. Die aktuelle Rechnung bleibt geöffnet.'}{' '}
            <button type="button" className="text-button" onClick={() => changeFilters('all', '')}>
              Filter zurücksetzen
            </button>
          </p>
        )}
        <div className="formula-selectors">
          <label htmlFor={`${id}-formula`}>Formel auswählen</label>
          <select
            id={`${id}-formula`}
            value={formulaId}
            disabled={!visibleFormulas.length}
            onChange={(event) => setFormulaId(event.target.value as FormulaId)}
          >
            {!visibleFormulas.length && <option value={formulaId}>{formula.title}</option>}
            {visibleFormulas.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </select>
          <label htmlFor={`${id}-target`}>Gesuchte Größe</label>
          <select
            id={`${id}-target`}
            value={target.id}
            onChange={(event) => changeTarget(event.target.value)}
          >
            {supportedFormulaTargets(formula).map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label} {entry.symbol}
              </option>
            ))}
          </select>
        </div>
        <p className="formula-workbench-description">{formula.description}</p>
        <div className="formula large" aria-label="Umgestellte Formel">
          {formula.rearrangements[target.id]}
        </div>

        <div className="calculator-inputs formula-inputs">
          {inputFields.map((field) => {
            const entry = draft.entries[field.id];
            const invalid = !result.ok && result.invalidFields.includes(field.id);
            return (
              <div className="formula-input-field" key={field.id}>
                <label htmlFor={`${id}-${field.id}`}>{field.label}</label>
                <span className="formula-symbol" aria-hidden="true">
                  {field.symbol}
                </span>
                <input
                  id={`${id}-${field.id}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={80}
                  value={entry.text}
                  aria-invalid={invalid}
                  aria-describedby={`${id}-assumptions${invalid ? ` ${id}-error` : ''}`}
                  onChange={(event) =>
                    updateEntry(field.id, { ...entry, text: event.target.value })
                  }
                />
                {field.units.length > 1 ? (
                  <select
                    aria-label={`Einheit ${field.symbol}`}
                    value={entry.unit}
                    onChange={(event) =>
                      updateEntry(field.id, convertFormulaEntry(field, entry, event.target.value))
                    }
                  >
                    {field.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="formula-unit-fixed">
                    {entry.unit === '1' ? 'dimensionslos' : entry.unit}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="formula-input-help">
          Komma oder Punkt als Dezimalzeichen, keine Tausendertrennzeichen. Einheitenwechsel rechnet
          vorhandene Werte um.
        </p>

        <div className="calculator-result" aria-live="polite" aria-atomic="true">
          {result.ok ? (
            <>
              <span>{result.label}</span>
              <strong>
                {formatFormulaNumber(result.value)}{' '}
                <small>{result.unit === '1' ? 'dimensionslos' : result.unit}</small>
              </strong>
              {result.alternatives.map((entry) => (
                <span key={entry.unit}>
                  {formatFormulaNumber(entry.value, entry.unit === 'kJ' ? 1 : 3)}{' '}
                  {entry.unit === '1' ? 'dimensionslos' : entry.unit}
                </span>
              ))}
            </>
          ) : (
            <p id={`${id}-error`}>{result.error}</p>
          )}
        </div>
        <div className="formula-result-controls">
          <label htmlFor={`${id}-output-unit`}>Ergebniseinheit</label>
          <select
            id={`${id}-output-unit`}
            value={outputUnit}
            onChange={(event) =>
              update({
                ...draft,
                outputUnits: { ...draft.outputUnits, [target.id]: event.target.value },
              })
            }
          >
            {target.units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.id}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="text-button"
            onClick={() => update(createFormulaDraft(formulaId))}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Beispielwerte zurücksetzen
          </button>
        </div>
        <p className="tool-assumptions" id={`${id}-assumptions`}>
          {formula.assumptions}
        </p>
        <p className="formula-input-help">
          Deine Werte bleiben beim Formelwechsel in dieser geöffneten Werkzeugansicht erhalten.
          Rechnen erzeugt keinen Lernversuch.
        </p>
      </section>

      <section
        className="surface formula-reference formula-workbench-reference"
        aria-labelledby={`${id}-reference`}
      >
        <div className="section-heading">
          <h2 id={`${id}-reference`}>Formel verstehen</h2>
          <BookOpen size={21} aria-hidden="true" />
        </div>
        <p className="formula-reference-caption">
          {formula.title} · {formula.equation}
        </p>
        <h3>Größen & Einheiten</h3>
        <dl>
          {formula.variables.map((field) => (
            <div key={field.id}>
              <dt>
                {field.symbol} · {field.label}
              </dt>
              <dd>
                <span>
                  {field.units.map((unit) => unit.id).join(' / ')}
                  {field.id === target.id ? ' · gesucht' : ''}
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="formula-base-units">{formula.baseUnits}</p>
        <h3>Dein Rechenweg</h3>
        {result.ok ? (
          <ol className="formula-steps">
            <li>
              <span>Formel nach {target.symbol} umstellen</span>
              <code>{formula.rearrangements[target.id]}</code>
            </li>
            {result.steps.map((step, index) => (
              <li key={`${formulaId}-${target.id}-${index}`}>
                <code>{step}</code>
              </li>
            ))}
          </ol>
        ) : (
          <p className="formula-reference-caption">
            Nach einer gültigen Eingabe siehst du hier die eingesetzten Werte und die Umrechnung.
          </p>
        )}
        <p className="tool-assumptions">
          Modellrechnungen zum Lernen. Konkrete Anlagenplanung und Arbeitsausführung benötigen
          passende aktuelle Fachquellen.
        </p>
      </section>
    </>
  );
}
