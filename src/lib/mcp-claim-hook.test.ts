import { PGlite } from '@electric-sql/pglite';
import { expect, test } from 'vitest';
import original from '../../supabase/migrations/20261110200000_nick_mcp_oauth_hook.sql?raw';
import permissions from '../../supabase/migrations/20261110223000_nick_mcp_learning_permissions.sql?raw';
import fix from '../../supabase/migrations/20261111152500_nick_mcp_claim_client.sql?raw';

test('real Supabase hook input issues exact MCP grants and preserves every identity boundary', async () => {
 const db = new PGlite();
 const owner = '22222222-2222-4222-8222-222222222222', client = '11111111-1111-4111-8111-111111111111';
 const grants = ['knowledge:read','learning:read','learning:submit','learning:review','learning:sync','learning:ack'];
 const ordinary = { user_id: owner, authentication_method: 'password', claims: { sub: owner, aud: 'authenticated', role: 'authenticated', scope: 'openid email offline_access' } };
 const event = { ...ordinary, authentication_method: 'oauth_provider/authorization_code', claims: { ...ordinary.claims, client_id: client } };
 const run = async (input: object) => (await db.query<{result: any}>('select public.nick_mcp_access_token_hook($1::jsonb) as result',[JSON.stringify(input)])).rows[0].result;
 try {
  await db.exec('create role anon; create role authenticated; create role supabase_auth_admin; create schema auth; create table auth.users(id uuid primary key);');
  await db.exec(original); await db.exec(permissions);
  await db.query('insert into auth.users values ($1)',[owner]);
  await db.query('insert into mcp_private.oauth_clients values ($1,$2,$3,true,$4::text[])',[client,owner,'https://mcp.example.test/mcp',grants]);
  const before = (await db.query('select * from mcp_private.oauth_clients')).rows;
  expect((await run(event)).claims.aud).toBe('authenticated'); // Reproduces the old failure.
  await db.exec(fix);
  expect((await db.query('select * from mcp_private.oauth_clients')).rows).toEqual(before);
  const expected = { ...event, claims: { ...event.claims, aud: 'https://mcp.example.test/mcp', mcp_permissions: grants } };
  expect(await run(event)).toEqual(expected);
  expect(await run({ ...event, authentication_method: 'token_refresh' })).toEqual({ ...expected, authentication_method: 'token_refresh' });
  expect(await run(ordinary)).toEqual(ordinary);
  const rootOnly = { ...ordinary, client_id: client };
  expect(await run(rootOnly)).toEqual(rootOnly);
  const metadataOnly = { ...ordinary, claims: { ...ordinary.claims, user_metadata: {client_id: client} } };
  expect(await run(metadataOnly)).toEqual(metadataOnly);
  const foreign = { ...event, client_id: client, claims: { ...event.claims, client_id: 'foreign' } };
  expect(await run(foreign)).toEqual(foreign);
  expect((await run({ ...event, user_id: 'foreign' })).error.http_code).toBe(403);
  expect((await run({ ...event, claims: { ...event.claims, sub: 'foreign' } })).error.http_code).toBe(403);
  expect((await run({ ...event, claims: { client_id: client } })).error.http_code).toBe(403);
  await db.query('update mcp_private.oauth_clients set permissions=$1::text[]',[['learning:read']]);
  expect((await run({ ...event, claims: {...event.claims, scope: 'admin:*', mcp_permissions: grants} })).claims.mcp_permissions).toEqual(['learning:read']);
  for (const role of ['anon','authenticated']) {
   await db.exec('set role '+role);
   await expect(run(event)).rejects.toThrow(/permission denied/);
   await expect(db.query('select * from mcp_private.oauth_clients')).rejects.toThrow(/permission denied/);
   await db.exec('reset role');
  }
  await db.exec('set role supabase_auth_admin');
  expect((await run(event)).claims.mcp_permissions).toEqual(['learning:read']);
  await db.exec('reset role; update mcp_private.oauth_clients set enabled=false');
  expect(await run(event)).toEqual(event);
 } finally { await db.close(); }
});
