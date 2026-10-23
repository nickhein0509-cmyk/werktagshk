/** A newer app may own this record; an older app must never overwrite it. */
export function isFutureLearningRecord(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const value: unknown = JSON.parse(raw);
    return (
      typeof value === 'object' &&
      value !== null &&
      'version' in value &&
      typeof value.version === 'number' &&
      value.version > 1
    );
  } catch {
    return false;
  }
}

export const futureDataWarning =
  'Dieser Lernstand stammt aus einer neueren App-Version und ist hier schreibgeschützt. Öffne die neuere Version oder exportiere die unveränderte Rohdatensicherung im Werkzeugkoffer.';
