import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeIndex } from './context-index.mjs';
import { checkContext } from './check-pr-context.mjs';

const row = id => `| ${id} | Zweck | [Repo](https://github.com/test/${id}) | \`/${id}\` |`;
const table = `| ID | Produkt und Zweck | Produktauftrag und Aufgaben | Bestehender Einstieg |\n| --- | --- | --- | --- |\n${['LERNEN','ASSISTENT','MATERIAL','PLATTFORM'].map(row).join('\n')}\n`;
test('Produktindex wird deterministisch aus der ersten Produkttabelle erzeugt', () => {
  assert.equal(makeIndex(table), makeIndex(table));
  assert.match(makeIndex(table), /\| MATERIAL \|/);
  assert.throws(() => makeIndex(table.replace(row('MATERIAL') + '\n', '')), /genau einen/);
  assert.throws(() => makeIndex(table + row('LERNEN') + '\n'), /doppelter/);
});
test('Allgemeine Designaufträge verlangen eine Aussage pro Bereich', () => {
  const scope = '<!-- werktag-design-scope: general -->';
  assert.equal(checkContext(scope).length, 4);
  const filled = `${scope}\n- Lernen: Im Browser geprüft.\n- Assistent: Offen, nicht zugänglich.\n- Materialliste: Offen, nicht zugänglich.\n- Plattform: Navigation geprüft.`;
  assert.deepEqual(checkContext(filled), []);
  assert.notDeepEqual(checkContext(filled.replace('Plattform: Navigation geprüft.', 'Plattform: ausfüllen')), []);
});
test('Umfang muss bewusst und eindeutig erklärt werden', () => {
  assert.deepEqual(checkContext('Älterer PR ohne Kontextfeld'), []);
  assert.equal(checkContext('<!-- werktag-design-scope: pending -->').length, 1);
  assert.equal(checkContext('<!-- werktag-design-scope: limited -->').length, 1);
  assert.deepEqual(checkContext('<!-- werktag-design-scope: limited -->\n- Begrenzter Bereich: Nur Lernen, Navigation unverändert.'), []);
  assert.deepEqual(checkContext('<!-- werktag-design-scope: none -->'), []);
  assert.equal(checkContext('<!-- werktag-design-scope: none -->\n<!-- werktag-design-scope: general -->').length, 1);
});
