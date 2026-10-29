import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiHandler, readLimited } from './handler.mjs';
import { createCloudProxy } from '../../../server/assistance-cloud.mjs';

const userId = '11111111-1111-4111-8111-111111111111';
const base = 'https://test-werktag.supabase.co';
const selected = { product: 'lernen', confirmed: true, selection: [{ id: 'test-1', text: 'Wie rechnet man Liter in Kubikmeter um?' }] };
const completed = { status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: '1000 Liter sind 1 m³.' }] }] };
function setup(options = {}) {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, ...init });
    if (url.endsWith('/auth/v1/user')) return Response.json(options.user ?? { id: userId }, { status: options.authStatus ?? 200 });
    if (url.endsWith('/rpc/werktag_ai_reserve')) return Response.json(options.claim ?? { allowed: true, model: 'test-model', maxOutputTokens: 800 }, { status: options.dbStatus ?? 200 });
    assert.equal(url, 'https://api.openai.com/v1/responses');
    if (options.throwProvider) throw options.throwProvider;
    return Response.json(options.output ?? completed, { status: options.providerStatus ?? 200 });
  };
  const handle = createAiHandler({ supabaseUrl: base, serviceKey: 'service-only', apiKey: options.apiKey ?? 'provider-only', fetcher });
  const request = (body = selected, headers = {}, method = 'POST', query = '') => handle(new Request(base + '/functions/v1/ai' + query, {
    method, headers: { origin: 'https://werk-tag.com', authorization: 'Bearer user-token', 'content-type': 'application/json', ...headers },
    ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  }));
  return { calls, request, handle };
}

test('authenticated request reserves before sending only selected content to OpenAI', async () => {
  const { calls, request } = setup();
  const res = await request();
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, product: 'lernen', text: '1000 Liter sind 1 m³.', sourceIds: ['test-1'], generatedBy: 'openai' });
  assert.equal(calls.length, 3);
  const budget = JSON.parse(calls[1].body);
  assert.equal(budget.p_user_id, userId);
  assert.equal(budget.p_product, 'lernen');
  assert.ok(budget.p_input_tokens > new TextEncoder().encode(selected.selection[0].text).length);
  assert.equal(calls[2].headers.Authorization, 'Bearer provider-only');
  const payload = JSON.parse(calls[2].body);
  assert.equal(payload.store, false);
  assert.equal(payload.stream, false);
  assert.equal(payload.max_output_tokens, 800);
  assert.equal(payload.service_tier, 'default');
  assert.equal(payload.tools, undefined);
  assert.equal(payload.previous_response_id, undefined);
  assert.equal(payload.user, undefined);
  assert.deepEqual(JSON.parse(payload.input).selection, selected.selection);
  assert.ok(!calls[1].body.includes(selected.selection[0].text));
  assert.equal(res.headers.get('cache-control'), 'no-store');
});

test('assistant selections stay separate and produce no database writes to notes or tasks', async () => {
  const { calls, request } = setup();
  const res = await request({ product: 'assistent', confirmed: true, selection: [{ id: 'note-1', text: 'Ventil prüfen.' }, { id: 'note-2', text: 'Termin noch offen.' }] });
  assert.equal(res.status, 200);
  assert.equal(JSON.parse(calls[1].body).p_product, 'assistent');
  assert.deepEqual((await res.json()).sourceIds, ['note-1', 'note-2']);
  assert.equal(calls.filter(c => c.url.includes('/rest/')).length, 1);
});

test('missing setup, anonymous and service credentials never reach provider', async () => {
  for (const [opts, headers, code] of [
    [{ apiKey: '' }, {}, 'AI_NOT_CONFIGURED'],
    [{}, { authorization: '' }, 'AI_UNAUTHORIZED'],
    [{}, { authorization: 'Bearer service-only' }, 'AI_UNAUTHORIZED'],
    [{ authStatus: 401 }, {}, 'AI_UNAUTHORIZED'],
    [{ user: { id: 'not-a-user' } }, {}, 'AI_UNAUTHORIZED'],
    [{ authStatus: 503 }, {}, 'AI_UNAVAILABLE'],
  ]) {
    const { calls, request } = setup(opts);
    assert.equal((await (await request(selected, headers)).json()).error, code);
    assert.ok(calls.length <= 1);
  }
});

test('origin, method and query validation precede remote calls', async () => {
  for (const [headers, method, query] of [
    [{ origin: 'https://evil.example' }, 'POST', ''], [{ 'sec-fetch-site': 'cross-site' }, 'POST', ''],
    [{}, 'GET', ''], [{}, 'POST', '?userId=other'], [{}, 'POST', '?route=ai&route=ai'], [{}, 'POST', '?route=health'],
  ]) {
    const { calls, request } = setup();
    assert.ok((await request(selected, headers, method, query)).status >= 400);
    assert.equal(calls.length, 0);
  }
});

test('invalid, unconfirmed, mixed or excessive input cannot reserve or call provider', async () => {
  const cases = [null, [], '{bad', { ...selected, confirmed: false }, { ...selected, product: 'material' },
    { ...selected, userId }, { ...selected, health: {} }, { ...selected, selection: [] },
    { ...selected, selection: [selected.selection[0], selected.selection[0]] },
    { ...selected, selection: [{ id: 'x', text: '🛠'.repeat(5000) }] },
    { ...selected, selection: [{ id: 'x', text: '  ' }] },
    { ...selected, selection: [{ id: 'x', text: 'hi', url: 'https://evil.example' }] },
    { ...selected, question: 1 }, { ...selected, question: 'x'.repeat(1001) }, 'x'.repeat(33000)];
  for (const body of cases) {
    const { calls, request } = setup();
    assert.ok([400, 413].includes((await request(body)).status));
    assert.equal(calls.length, 1);
  }
});

test('stream byte limits cancel oversized chunks without buffering entire input', async () => {
  let cancelled = false;
  const stream = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(11)); }, cancel() { cancelled = true; } });
  await assert.rejects(readLimited(stream, 10), { code: 'AI_TOO_LARGE' });
  assert.equal(cancelled, true);
});

test('durable budget, allowlist and database failures stop before provider', async () => {
  for (const code of ['AI_BUDGET', 'AI_RATE_LIMIT', 'AI_FORBIDDEN', 'AI_NOT_CONFIGURED']) {
    const { calls, request } = setup({ claim: { allowed: false, code } });
    assert.equal((await (await request()).json()).error, code);
    assert.equal(calls.length, 2);
  }
  const { calls, request } = setup({ dbStatus: 500 });
  assert.equal((await request()).status, 503);
  assert.equal(calls.length, 2);
});

test('provider failure is redacted and never automatically retried or refunded', async () => {
  for (const [status, providerCode, expected] of [
    [401, '', 'AI_NOT_CONFIGURED'], [429, 'rate_limit_exceeded', 'AI_PROVIDER_RATE_LIMIT'],
    [429, 'insufficient_quota', 'AI_PROVIDER_QUOTA'], [500, '', 'AI_UNAVAILABLE'],
  ]) {
    const { calls, request } = setup({ providerStatus: status, output: { error: { code: providerCode, message: 'provider-only private selected text' } } });
    const res = await request(); const body = await res.json();
    assert.equal(body.error, expected);
    assert.ok(!JSON.stringify(body).includes('provider-only'));
    assert.equal(calls.length, 3);
  }
  const { calls, request } = setup({ throwProvider: new DOMException('secret text', 'TimeoutError') });
  assert.equal((await (await request()).json()).error, 'AI_TIMEOUT');
  assert.equal(calls.length, 3);
});

test('incomplete, missing or refused output is never a successful explanation', async () => {
  for (const output of [
    { ...completed, status: 'incomplete' }, { status: 'completed', output: [] },
    { status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'refusal', refusal: 'No' }] }] },
  ]) {
    const { request } = setup({ output });
    const res = await request();
    assert.ok(res.status >= 400);
    assert.equal((await res.json()).ok, false);
  }
});

test('gateway forwards user bearer but strips private assistance cookies from the AI service', async () => {
  const calls = [];
  const proxy = createCloudProxy({ endpoint: base + '/functions/v1/ai', fetchImpl: async (url, init) => {
    calls.push({ url: url.toString(), ...init });
    return Response.json({ ok: true }, { headers: { 'set-cookie': '__Secure-werktag-assistance=unwanted', 'content-type': 'application/json' } });
  } });
  const headers = {};
  const res = { setHeader(k, v) { headers[k] = v; }, end(body) { this.body = body; } };
  await proxy({ method: 'POST', url: '/api/ki', body: selected, headers: {
    origin: 'https://werk-tag.com', authorization: 'Bearer user-token', 'content-type': 'application/json', cookie: '__Secure-werktag-assistance=private-session',
  } }, res, 'ai');
  assert.equal(res.statusCode, 200);
  assert.equal(calls[0].headers.authorization, 'Bearer user-token');
  assert.equal(calls[0].headers.cookie, undefined);
  assert.equal(headers['Set-Cookie'], undefined);
  assert.equal(calls[0].url, base + '/functions/v1/ai?route=ai');
});

test('anonymous accounts cannot reserve budget or reach the provider', async () => {
  const {calls,request}=setup({user:{id:userId,is_anonymous:true}});
  const response=await request();
  assert.equal(response.status,401);
  assert.equal((await response.json()).error,'AI_UNAUTHORIZED');
  assert.equal(calls.length,1);
});
