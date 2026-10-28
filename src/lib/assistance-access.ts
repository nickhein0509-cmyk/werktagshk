const missingProof = 'Bitte füge deinen persönlichen Verbindungs- oder Besitzerlink ein.';
const readOnlyProof = 'Dieser Kartenlink ist nur zum Lesen. Für die Kontozuordnung brauchst du deinen Verbindungs- oder Besitzerlink.';

/** Extract an owner capability without ever accepting a map's read key. */
export function assistanceOwnerProof(value: string): string {
  const input = value.trim();
  if (!input) throw new Error(missingProof);
  if (input.length > 4096 || /[\r\n\u0000]/.test(input)) {
    throw new Error('Der persönliche Link ist ungültig. Bitte prüfe die Eingabe.');
  }

  let proof = input;
  if (input.startsWith('#') || input.includes('://') || input.includes('#')) {
    let fragment: URLSearchParams;
    try {
      if (input.startsWith('#')) fragment = new URLSearchParams(input.slice(1));
      else {
        const url = new URL(input);
        if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
        fragment = new URLSearchParams(url.hash.slice(1));
      }
    } catch {
      throw new Error('Der persönliche Link ist ungültig. Bitte füge den vollständigen Link ein.');
    }
    const connections = fragment.getAll('connect');
    const owners = fragment.getAll('owner');
    if (connections.length > 1 || owners.length > 1 || (connections.length && owners.length && connections[0] !== owners[0])) {
      throw new Error('Der Link enthält widersprüchliche Freigaben. Bitte verwende deinen ursprünglichen Besitzerlink.');
    }
    proof = connections[0] ?? owners[0] ?? '';
    if (!proof) throw new Error(fragment.has('key') ? readOnlyProof : missingProof);
  }

  if (!proof || proof.length > 512 || /\s|[\u0000-\u001f\u007f]/.test(proof)) {
    throw new Error('Die persönliche Freigabe ist ungültig. Bitte prüfe den Besitzerlink.');
  }
  return proof;
}
