import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createAiHandler } from './handler.mjs';

const user = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
let db;
before(async () => {
  db = new PGlite();
  await db.exec(`create schema auth; create table auth.users(id uuid primary key);
    create role anon; create role authenticated; create role service_role bypassrls;`);
  await db.exec(await readFile(new URL('../../migrations/20261029023000_werktag_ai_budget.sql', import.meta.url), 'utf8'));
});
after(async () => { await db?.close(); });
beforeEach(async () => {
  await db.exec(`reset role; truncate public.werktag_ai_reservations, public.werktag_ai_access, auth.users;
    insert into auth.users values ('${user}'), ('${other}');
    insert into public.werktag_ai_access(user_id, lernen, assistent) values ('${user}',true,false), ('${other}',true,true);
    update public.werktag_ai_policy set enabled=true, model='test-model', max_output_tokens=100,
      input_micro_usd_per_token=1, output_micro_usd_per_token=2,
      monthly_micro_usd=10000, user_monthly_micro_usd=5000, user_requests_per_minute=30;`);
});
async function reserve(owner = user, product = 'lernen', tokens = 100, id = crypto.randomUUID()) {
  const result = await db.query('select public.werktag_ai_reserve($1,$2,$3,$4) as result', [owner, product, tokens, id]);
  return result.rows[0].result;
}

test('migration defaults keep integration disabled and constraints reject incomplete activation', async () => {
  await db.exec('delete from public.werktag_ai_policy; insert into public.werktag_ai_policy(singleton) values(true);');
  assert.equal((await reserve()).code, 'AI_NOT_CONFIGURED');
  await assert.rejects(db.exec('update public.werktag_ai_policy set enabled=true;'), /check constraint/);
});

test('only service role can execute reservation; browser roles cannot read any accounting or policy', async () => {
  for (const role of ['anon', 'authenticated']) {
    await db.exec('set role ' + role);
    await assert.rejects(reserve(), /permission denied/);
    for (const table of ['werktag_ai_policy', 'werktag_ai_access', 'werktag_ai_reservations']) {
      await assert.rejects(db.exec('select * from public.' + table), /permission denied/);
    }
    await db.exec('reset role');
  }
  await db.exec('set role service_role');
  assert.equal((await reserve()).allowed, true);
  await assert.rejects(db.exec('delete from public.werktag_ai_reservations'), /permission denied/);
});

test('account and product allowlist are enforced independently', async () => {
  assert.equal((await reserve(user, 'assistent')).code, 'AI_FORBIDDEN');
  assert.equal((await reserve('33333333-3333-4333-8333-333333333333')).code, 'AI_FORBIDDEN');
  assert.equal((await reserve(other, 'assistent')).allowed, true);
  assert.equal((await reserve(user, 'lernen')).allowed, true);
});

test('user budget persists between calls and is separate from the global cap', async () => {
  await db.exec('update public.werktag_ai_policy set user_monthly_micro_usd=500;');
  assert.equal((await reserve()).allowed, true); // 100 + 100*2 = 300 micro USD
  assert.equal((await reserve()).code, 'AI_BUDGET');
  assert.equal((await reserve(other)).allowed, true);
  assert.equal((await db.query('select sum(reserved_micro_usd)::int as used from public.werktag_ai_reservations')).rows[0].used, 600);
});

test('admission never exceeds shared budget across a burst of requests', async () => {
  await db.exec('update public.werktag_ai_policy set monthly_micro_usd=900;');
  const results = await Promise.all(Array.from({ length: 12 }, (_, i) => reserve(i % 2 ? user : other)));
  assert.equal(results.filter(r => r.allowed).length, 3);
  assert.equal(results.filter(r => r.code === 'AI_BUDGET').length, 9);
  assert.equal((await db.query('select sum(reserved_micro_usd)::int as used from public.werktag_ai_reservations')).rows[0].used, 900);
});

test('rolling minute rate limit applies across products', async () => {
  await db.exec('update public.werktag_ai_policy set user_requests_per_minute=1;');
  assert.equal((await reserve(other, 'lernen')).allowed, true);
  assert.equal((await reserve(other, 'assistent')).code, 'AI_RATE_LIMIT');
  assert.equal((await reserve(user)).allowed, true);
  await db.exec("update public.werktag_ai_reservations set created_at=clock_timestamp()-interval '61 seconds';");
  assert.equal((await reserve(other)).allowed, true);
});

test('prior months do not consume current budget and deleting a user does not refund global spend', async () => {
  await db.exec('update public.werktag_ai_policy set monthly_micro_usd=300;');
  assert.equal((await reserve()).allowed, true);
  await db.exec("update public.werktag_ai_reservations set created_at=date_trunc('month',clock_timestamp() at time zone 'UTC') at time zone 'UTC' - interval '1 second';");
  assert.equal((await reserve()).allowed, true);
  await db.exec(`delete from auth.users where id='${user}';`);
  assert.equal((await reserve(other)).code, 'AI_BUDGET');
});

test('reused IDs and invalid direct RPC arguments cannot obtain a second admission', async () => {
  const id = crypto.randomUUID();
  assert.equal((await reserve(user, 'lernen', 100, id)).allowed, true);
  assert.equal((await reserve(other, 'lernen', 100, id)).code, 'AI_INVALID_REQUEST');
  for (const [owner, product, tokens] of [[user, 'material', 1], [user, null, 1], [null, 'lernen', 1], [user, 'lernen', 0], [user, 'lernen', 16385], [user, 'lernen', null]]) {
    assert.equal((await reserve(owner, product, tokens)).code, 'AI_INVALID_REQUEST');
  }
});

test('fractional pricing rounds reservations up, never down', async () => {
  await db.exec('update public.werktag_ai_policy set input_micro_usd_per_token=0.000001, output_micro_usd_per_token=0.000001;');
  assert.equal((await reserve()).allowed, true);
  assert.equal((await db.query('select reserved_micro_usd::int as amount from public.werktag_ai_reservations')).rows[0].amount, 1);
});

test('handler uses the real reservation contract and never calls provider after budget denial', async () => {
  let calls = 0;
  await db.exec('update public.werktag_ai_policy set user_requests_per_minute=30, user_monthly_micro_usd=3000;');
  const handler = createAiHandler({
    supabaseUrl: 'https://test.supabase.co', serviceKey: 'service-only', apiKey: 'provider-only',
    fetcher: async (url, options) => {
      if (url.endsWith('/auth/v1/user')) return Response.json({ id: user });
      if (url.endsWith('/rpc/werktag_ai_reserve')) {
        const p = JSON.parse(options.body);
        return Response.json(await reserve(p.p_user_id, p.p_product, p.p_input_tokens, p.p_request_id));
      }
      assert.equal(url, 'https://api.openai.com/v1/responses');
      assert.equal(JSON.parse(options.body).model, 'test-model');
      calls++;
      return Response.json({ status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Synthetische Erklärung.' }] }] });
    },
  });
  const request = () => handler(new Request('https://test.supabase.co/functions/v1/ai', {
    method: 'POST', headers: { origin: 'https://werk-tag.com', authorization: 'Bearer user-token', 'content-type': 'application/json' },
    body: JSON.stringify({ product: 'lernen', confirmed: true, selection: [{ id: 'example', text: 'Einheiten erklären.' }] }),
  }));
  assert.equal((await request()).status, 200);
  assert.equal((await (await request()).json()).error, 'AI_BUDGET');
  assert.equal(calls, 1);
});
