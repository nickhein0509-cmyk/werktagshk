// Run only on the authorized owner's machine. Catalogue contents and tokens are never logged.
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { CATALOGUE_FILES, CATALOGUE_SOURCE_SHA256, validateCatalogueResource } from '../supabase/functions/assistance/catalog.mjs';

const EXPECTED_ADAPTER = 'ff78461cd47fc5648284d8814a4d0057293d7fb0f0cba7d420c54b9c506b467d';
const EXPECTED_ENDPOINT = 'https://hrqaxsbddpmphblmoyly.supabase.co/functions/v1/assistance';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function replaceOnce(text, before, after) {
  if (text.split(before).length !== 2) throw new Error('The verified catalogue view has changed.');
  return text.replace(before, after);
}
function args() {
  const values = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const name = process.argv[i], value = process.argv[i + 1];
    if (!['--config', '--adapter', '--catalogue', '--endpoint', '--evidence'].includes(name) || !value || values[name]) throw new Error('Expected explicit config, adapter, catalogue and optional evidence paths.');
    values[name] = value;
  }
  for (const name of ['--config', '--adapter', '--catalogue']) if (!values[name] || !path.isAbsolute(values[name])) throw new Error('Absolute source paths are required.');
  if (values['--endpoint'] && values['--endpoint'] !== EXPECTED_ENDPOINT) throw new Error('Unexpected cloud project endpoint.');
  if (values['--evidence'] && !path.isAbsolute(values['--evidence'])) throw new Error('An absolute evidence path is required.');
  return values;
}
async function main() {
  const options = args(), source = await readFile(options['--catalogue']);
  if (hash(source) !== CATALOGUE_SOURCE_SHA256 || hash(await readFile(options['--adapter'])) !== EXPECTED_ADAPTER) throw new Error('The verified catalogue or adapter does not match.');
  const config = JSON.parse((await readFile(options['--config'], 'utf8')).replace(/^\uFEFF/, ''));
  if (typeof config.mapEditToken !== 'string' || !/^[A-Za-z0-9_-]{43,128}$/.test(config.mapEditToken)) throw new Error('Existing owner access is required.');
  const { createComponentsRoutes } = await import(pathToFileURL(options['--adapter']).href);
  // Materialize only the buffer whose original hash was checked, even if another work changes its source concurrently.
  const stage = await mkdtemp(path.join(path.dirname(options['--config']), 'catalogue-stage-'));
  try {
  const snapshot = path.join(stage, 'catalogue.html');
  await writeFile(snapshot, source, { mode: 0o600 });
  const handle = createComponentsRoutes({ cataloguePath: snapshot });
  const evidence = { sourceSha256: CATALOGUE_SOURCE_SHA256, startedAt: new Date().toISOString(), resources: [], largestBytes: 0 };
  // HTML is last; the server also withholds the whole version until all49 resources exist.
  for (const file of [...CATALOGUE_FILES.filter(file => file !== 'index.html'), 'index.html']) {
    const target = '/map/components' + (file === 'index.html' ? '' : '/' + file);
    const res = { statusCode: null, headers: {}, setHeader(name, value) { this.headers[name.toLowerCase()] = value; }, end(bytes) { this.bytes = Buffer.from(bytes ?? ''); } };
    if (!await handle({ method: 'GET' }, res, new URL(target, 'https://fixture.invalid')) || res.statusCode !== 200) throw new Error('A verified catalogue resource could not be materialized.');
    let body = new TextDecoder('utf-8', { fatal: true }).decode(res.bytes);
    const originalResourceSha256 = hash(res.bytes);
    if (file === 'index.html') {
      if (body.split('./components/').length !== 6) throw new Error('The verified catalogue references have changed.');
      body = body.replaceAll('./components/', '/assistenz/components/');
      body = replaceOnce(body, 'Die Daten werden geschützt von deinem PC geladen.', 'Die Daten werden geschützt aus deiner privaten Cloud geladen.');
      body = replaceOnce(body, '</head>', '<script defer src="/assistance-assets/catalog-session.js"></script></head>');
    }
    const resource = await validateCatalogueResource({ path: file, body, contentType: res.headers['content-type'], sha256: hash(Buffer.from(body, 'utf8')), sourceSha256: CATALOGUE_SOURCE_SHA256 });
    const { bytes, ...payload } = resource;
    const requestBody = JSON.stringify({ ownerToken: config.mapEditToken, ...payload });
    if (Buffer.byteLength(requestBody) > 2 * 1024 * 1024) throw new Error('Catalogue request exceeds the safe byte limit.');
    const response = await fetch(EXPECTED_ENDPOINT + '?route=import-catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('Catalogue upload failed (HTTP ' + response.status + ').');
    const result = await response.json();
    if (result.ok !== true || result.sourceSha256 !== CATALOGUE_SOURCE_SHA256) throw new Error('Catalogue upload was not acknowledged.');
    evidence.resources.push({ path: file, sha256: resource.sha256, originalResourceSha256, bytes, stored: result.stored });
    evidence.largestBytes = Math.max(evidence.largestBytes, bytes);
    evidence.ready = result.ready; evidence.resourceCount = result.resourceCount;
  }
  evidence.sourceUnchanged = hash(await readFile(options['--catalogue'])) === CATALOGUE_SOURCE_SHA256;
  evidence.completedAt = new Date().toISOString();
  if (!evidence.sourceUnchanged || !evidence.ready || evidence.resourceCount !== 49) throw new Error('Catalogue transfer did not complete safely.');
  const evidencePath = options['--evidence'] ?? path.join(path.dirname(options['--config']), 'cloud-catalog-import.json');
  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, JSON.stringify(evidence, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify({ ok: true, resourceCount: evidence.resourceCount, ready: evidence.ready, largestBytes: evidence.largestBytes, sourceSha256: evidence.sourceSha256, sourceUnchanged: evidence.sourceUnchanged }));
  } finally { await rm(stage, { recursive: true, force: true }); }
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main().catch(() => { console.error(JSON.stringify({ ok: false, error: 'Private catalogue transfer failed. Inspect source hashes, owner access and server status without exposing credentials.' })); process.exitCode = 1; });
