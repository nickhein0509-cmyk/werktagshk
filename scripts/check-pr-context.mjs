import { pathToFileURL } from 'node:url';

// This checks the author's declaration, not whether it is truthful or whether
// unmarked work is actually design. Reviewers must still judge the change.
export function checkContext(body) {
  const errors = [];
  const markers = [...body.matchAll(/<!--\s*werktag-design-scope:\s*([^\s]+)\s*-->/g)];
  // Older PRs predate the template; do not block them on missing metadata.
  if (markers.length === 0) return [];
  if (markers.length !== 1 || !['general', 'limited', 'none'].includes(markers[0]?.[1])) {
    return ['Genau einen Designumfang angeben: general, limited oder none.'];
  }
  if (markers[0][1] === 'general') {
    for (const area of ['Lernen', 'Assistent', 'Materialliste', 'Plattform']) {
      const match = body.match(new RegExp(`^- ${area}:\\s*(.+)$`, 'mi'));
      if (!match || match[1].trim().length < 12 || /^(?:ausfüllen|tbd|todo|n\/a)\b/i.test(match[1].trim())) {
        errors.push(`${area}: Prüfung, Ergebnis oder konkreten offenen Punkt angeben (mindestens 12 Zeichen).`);
      }
    }
  }
  if (markers[0][1] === 'limited') {
    const match = body.match(/^- Begrenzter Bereich:\s*(.+)$/mi);
    if (!match || match[1].trim().length < 12 || /^(?:ausfüllen|tbd|todo|n\/a)\b/i.test(match[1].trim())) errors.push('Begrenzten Bereich und Auswirkungen auf gemeinsame Elemente angeben.');
  }
  return errors;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = checkContext(process.env.WERKTAG_PR_BODY ?? '');
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else if (!/<!--\s*werktag-design-scope:/.test(process.env.WERKTAG_PR_BODY ?? '')) console.log('::warning::Kein Designumfang angegeben. Ältere PRs bleiben zulässig; Kontext manuell prüfen.');
  else console.log('Designumfang ist deklariert. Inhaltliche Prüfung bleibt Aufgabe der Review.');
}
