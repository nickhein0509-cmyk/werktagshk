import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const source = 'docs/product-map.md';
const target = 'docs/generated-product-index.md';
const ids = ['LERNEN', 'ASSISTENT', 'MATERIAL', 'PLATTFORM'];

export function makeIndex(markdown) {
  const table = markdown.match(/\| ID \| Produkt und Zweck \| Produktauftrag und Aufgaben \| Bestehender Einstieg \|\r?\n(?:\|[^\n]*\r?\n)+/);
  if (!table) throw new Error('Produkttabelle fehlt in der Produktkarte.');
  const rows = table[0].split(/\r?\n/).filter(line => /^\|\s*(LERNEN|ASSISTENT|MATERIAL|PLATTFORM)\s*\|/.test(line));
  const indexed = new Map();
  for (const row of rows) {
    const cells = row.split('|').slice(1, -1).map(cell => cell.trim());
    if (cells.length !== 4 || indexed.has(cells[0]) || !cells[2].includes('](https://github.com/') || !cells[3].includes('`/')) {
      throw new Error(`Ungültiger oder doppelter Produkteintrag: ${cells[0]}`);
    }
    indexed.set(cells[0], row);
  }
  if (ids.some(id => !indexed.has(id)) || indexed.size !== ids.length) throw new Error('Produktkarte muss genau einen Eintrag pro Produkt und Plattform enthalten.');
  return `# WerkTag: Produktindex\n\nAutomatisch aus [der Produktkarte](product-map.md) erzeugt. Änderungen an der Karte mit \`node scripts/context-index.mjs --write\` übernehmen. Die Karte beschreibt Zuständigkeiten und tatsächliche Implementierungsorte; die Laufzeit muss separat geprüft werden.\n\n| ID | Produkt und Zweck | Produktauftrag und Aufgaben | Bestehender Einstieg |\n| --- | --- | --- | --- |\n${ids.map(id => indexed.get(id)).join('\n')}\n`;
}

async function main() {
  const expected = makeIndex(await readFile(source, 'utf8'));
  if (process.argv[2] === '--write') {
    await writeFile(target, expected);
    console.log(`Aktualisiert: ${target}`);
  } else if (process.argv[2] === '--check') {
    const actual = await readFile(target, 'utf8').catch(() => '');
    if (actual !== expected) throw new Error(`Produktindex veraltet. Korrigieren mit: node scripts/context-index.mjs --write`);
    console.log('Produktindex stimmt mit Produktkarte überein.');
  } else throw new Error('Verwendung: node scripts/context-index.mjs --check|--write');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
