import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { entryReport, staticEntries } from './check-entry-budgets.mjs';

function fixture() {
  return {
    'index.html': { file: 'main.js', imports: ['shared'], dynamicImports: ['src/App.tsx', 'src/components/AccountPage.tsx'] },
    shared: { file: 'shared.js', imports: ['index.html'] },
    'src/App.tsx': { file: 'learning.js', src: 'src/App.tsx', isDynamicEntry: true },
    'src/components/AccountPage.tsx': { file: 'account.js', src: 'src/components/AccountPage.tsx', isDynamicEntry: true, imports: ['shared'] },
  };
}

test('transitive static imports are counted once, lazy imports excluded, cycles terminate', () => {
  const manifest = fixture();
  assert.equal(staticEntries(manifest, ['index.html', 'shared']).length, 2);
  assert.equal(entryReport(manifest, () => Buffer.from('code'))[1].files, 3);
});

test('a missing manifest edge cannot silently lower the budget', () => {
  const manifest = fixture();
  delete manifest.shared;
  assert.throws(() => staticEntries(manifest, ['index.html']), /Missing build entry/);
});

test('accidental transitive learning or account imports fail even below the size budget', () => {
  for (const edge of ['src/App.tsx', 'src/components/AccountPage.tsx', 'content', 'auth']) {
    const manifest = fixture();
    manifest.content = { file: 'content.js', name: 'practice-content' };
    manifest.auth = { file: 'auth.js', name: 'supabase' };
    manifest.shared.imports.push(edge);
    assert.throws(() => entryReport(manifest, () => Buffer.from('code')), /loads/);
  }
});

test('oversized compressed assets fail the production budget', () => {
  assert.throws(() => entryReport(fixture(), () => randomBytes(100 * 1024)), /exceed/);
});

test('removing the dynamic route boundary fails the check', () => {
  const manifest = fixture();
  manifest['src/App.tsx'].isDynamicEntry = false;
  assert.throws(() => entryReport(manifest, () => Buffer.from('code')), /no longer lazy/);
});
