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

test('Leere Bereichsfelder übernehmen keinen Text aus der nächsten Zeile', () => {
  const areas = ['Lernen', 'Assistent', 'Materialliste', 'Plattform'];
  for (const empty of areas) {
    for (const whitespace of ['', '  \t']) {
      for (const newline of ['\n', '\r\n']) {
        const fields = areas.map(area => `- ${area}:${area === empty ? whitespace : ' Ausführlich geprüft.'}`);
        const body = ['<!-- werktag-design-scope: general -->', ...fields, 'Eine andere längere Zeile'].join(newline);
        const errors = checkContext(body);
        assert.equal(errors.length, 1, `Fehler für ${empty} erwartet`);
        assert.match(errors[0], new RegExp(`^${empty}:`));
      }
    }
  }
});
test('Ein leeres Feld für begrenzten Umfang übernimmt keine Folgezeile', () => {
  for (const newline of ['\n', '\r\n']) {
    const body = ['<!-- werktag-design-scope: limited -->', '- Begrenzter Bereich:   ', 'Eine andere längere Zeile'].join(newline);
    assert.equal(checkContext(body).length, 1);
  }
});
