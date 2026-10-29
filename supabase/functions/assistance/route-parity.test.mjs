import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Edge/Deno deploys the canonical semantics/route.js. The static browser entry
// needs a copy under public/. Change the canonical file first, copy it verbatim,
// and keep this test in the normal test:cloud-assistance suite to prevent drift.
test('browser route distribution is byte-identical to canonical Edge semantics', async () => {
  const [canonical, browser] = await Promise.all([
    readFile(new URL('./semantics/route.js', import.meta.url)),
    readFile(new URL('../../../public/assistance-assets/route.js', import.meta.url)),
  ]);
  assert.deepEqual(browser, canonical, 'Copy supabase/functions/assistance/semantics/route.js verbatim to public/assistance-assets/route.js after changing route semantics.');
});
