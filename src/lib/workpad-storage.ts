import { emptyWorkpad } from '../components/CalculationWorkspace';
import type { WorkpadDraft } from '../components/CalculationWorkspace';

const fields = ['given', 'approach', 'working', 'result', 'notes'] as const;

export function loadWorkpad(key: string): {
  draft: WorkpadDraft;
  warning: string;
  writable: boolean;
} {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { draft: emptyWorkpad(), warning: '', writable: true };
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === 'object' &&
      value !== null &&
      'version' in value &&
      value.version === 1 &&
      'draft' in value
    ) {
      const draft = value.draft;
      if (
        typeof draft === 'object' &&
        draft !== null &&
        fields.every(
          (field) =>
            field in draft &&
            typeof (draft as WorkpadDraft)[field] === 'string' &&
            (draft as WorkpadDraft)[field].length <= 15000,
        )
      ) {
        return {
          draft: Object.fromEntries(
            fields.map((field) => [field, (draft as WorkpadDraft)[field]]),
          ) as unknown as WorkpadDraft,
          warning: '',
          writable: true,
        };
      }
    }
    return {
      draft: emptyWorkpad(),
      warning:
        'Ein vorhandener Rechenentwurf hat ein unbekanntes Format und bleibt unverändert. Neue Notizen bleiben in dieser geöffneten Aufgabe.',
      writable: false,
    };
  } catch {
    return {
      draft: emptyWorkpad(),
      warning:
        'Der Rechenentwurf konnte nicht geladen werden. Neue Notizen bleiben in dieser geöffneten Aufgabe.',
      writable: false,
    };
  }
}

export function saveWorkpad(key: string, draft: WorkpadDraft): boolean {
  // Recheck before writing so an unreadable or newer record remains recoverable.
  if (!loadWorkpad(key).writable) return false;
  try {
    localStorage.setItem(key, JSON.stringify({ version: 1, draft }));
    return true;
  } catch {
    return false;
  }
}
