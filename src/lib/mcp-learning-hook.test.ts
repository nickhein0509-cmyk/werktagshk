import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest';
import originalMigration from '../../supabase/migrations/20261110200000_nick_mcp_oauth_hook.sql?raw';
import permissionsMigration from '../../supabase/migrations/20261110223000_nick_mcp_learning_permissions.sql?raw';

const owner = '22222222-2222-4222-8222-222222222222';
const client = '11111111-1111-4111-8111-111111111111';
const audience = 'https://mcp.example.test/mcp';
const permissions = ['knowledge:read', 'learning:read', 'learning:submit', 'learning:review', 'learning:sync', 'learning:ack'];
const ordinary = { user_id: owner, claims: { sub: owner, aud: 'authenticated', role: 'authenticated', scope: 'openid email offline_access' } };
const db = new PGlite();
type HookResult = { claims?: Record<string, unknown>; error?: { http_code: number } };
const run = async (event: object) => (await db.query<{ result: HookResult }>(
  'select public.nick_mcp_access_token_hook($1::jsonb) as result', [JSON.stringify(event)],
)).rows[0].result;
const configure = (grants: string[]) => db.query('update mcp_private.oauth_clients set permissions = $1::text[]', [grants]);

beforeAll(async () => {
  await db.exec('create role anon; create role authenticated; create role supabase_auth_admin; create schema auth; create table auth.users(id uuid primary key);');
  await db.exec(originalMigration);
  await db.query('insert into auth.users values ($1)', [owner]);
  // This row predates the new migration, just like the existing live configuration.
  await db.query('insert into mcp_private.oauth_clients values ($1,$2,$3,true)', [client, owner, audience]);
  await db.exec(permissionsMigration);
});
beforeEach(async () => {
  await db.exec('reset role');
  await db.query('update mcp_private.oauth_clients set enabled = true, permissions = default');
});
afterAll(async () => { await db.close(); });

test('migration preserves client, owner and audience without enabling learning writes', async () => {
  const row = (await db.query('select * from mcp_private.oauth_clients')).rows[0];
  expect(row).toEqual({ client_id: client, owner_id: owner, audience, enabled: true, permissions: ['knowledge:read'] });
  expect((await run({ ...ordinary, client_id: client })).claims?.mcp_permissions).toEqual(['knowledge:read']);
});

test('only the explicitly configured permissions reach the owner token', async () => {
  await configure(permissions);
  const result = await run({ ...ordinary, client_id: client });
  expect(result.claims).toEqual({ ...ordinary.claims, aud: audience, client_id: client, mcp_permissions: permissions });
  await configure(['learning:read', 'learning:sync']);
  expect((await run({ ...ordinary, client_id: client })).claims?.mcp_permissions).toEqual(['learning:read', 'learning:sync']);
});

test('requested scopes and incoming claims cannot escalate the configured grants', async () => {
  const claims = { ...ordinary.claims, scope: 'openid learning:submit knowledge:write', mcp_permissions: permissions };
  const result = await run({ ...ordinary, claims, client_id: client });
  expect(result.claims?.mcp_permissions).toEqual(['knowledge:read']);
  expect(result.claims?.scope).toBe(claims.scope);
});

test.each([
  ['unknown grant', ['knowledge:write']],
  ['wildcard grant', ['learning:*']],
  ['Google administration grant', ['roles/owner']],
  ['empty grants', []],
  ['null grant', [null]],
] as const)('configuration rejects %s', async (_label, grants) => {
  await expect(db.query('update mcp_private.oauth_clients set permissions = $1::text[]', [grants])).rejects.toThrow(/nick_mcp_permissions_allowlist/);
});

test('ordinary, unrelated and disabled client tokens remain unchanged', async () => {
  expect(await run(ordinary)).toEqual(ordinary);
  const unrelated = { ...ordinary, client_id: '33333333-3333-4333-8333-333333333333' };
  expect(await run(unrelated)).toEqual(unrelated);
  await db.exec('update mcp_private.oauth_clients set enabled = false');
  const disabled = { ...ordinary, client_id: client };
  expect(await run(disabled)).toEqual(disabled);
});

test('both user identity and subject must match the configured owner', async () => {
  await configure(permissions);
  expect((await run({ ...ordinary, user_id: 'foreign', client_id: client })).error?.http_code).toBe(403);
  expect((await run({ ...ordinary, claims: { ...ordinary.claims, sub: 'foreign' }, client_id: client })).error?.http_code).toBe(403);
  expect((await run({ ...ordinary, claims: {}, client_id: client })).error?.http_code).toBe(403);
});

test.each(['anon', 'authenticated'])('%s cannot inspect or change grants or invoke the hook', async role => {
  await db.exec(`set role ${role}`);
  await expect(db.query('select permissions from mcp_private.oauth_clients')).rejects.toThrow(/permission denied/);
  await expect(configure(permissions)).rejects.toThrow(/permission denied/);
  await expect(run({ ...ordinary, client_id: client })).rejects.toThrow(/permission denied/);
});

test('Supabase Auth can still execute the restricted hook', async () => {
  await configure(permissions);
  await db.exec('set role supabase_auth_admin');
  expect((await run({ ...ordinary, client_id: client })).claims?.mcp_permissions).toEqual(permissions);
});
