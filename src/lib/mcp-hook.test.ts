import migration from '../../supabase/migrations/20261110200000_nick_mcp_oauth_hook.sql?raw';
import { PGlite } from '@electric-sql/pglite';
import { expect, test } from 'vitest';
test('MCP hook isolates OAuth client and owner without changing ordinary tokens', async () => {
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role supabase_auth_admin; create schema auth; create table auth.users(id uuid primary key);');
    await db.exec(migration);
    const owner = '22222222-2222-4222-8222-222222222222';
    const client = '11111111-1111-4111-8111-111111111111';
    await db.query('insert into auth.users values ($1)', [owner]);
    await db.query('insert into mcp_private.oauth_clients values ($1,$2,$3,true)', [client, owner, 'https://mcp.example.test/mcp']);
    const ordinary = { user_id: owner, claims: { sub: owner, aud: 'authenticated', role: 'authenticated', scope: 'openid' } };
    const run = async (event: object) => (await db.query<{result: any}>('select public.nick_mcp_access_token_hook($1::jsonb) as result', [JSON.stringify(event)])).rows[0].result;
    expect(await run(ordinary)).toEqual(ordinary);
    const otherClient = { ...ordinary, client_id: '33333333-3333-4333-8333-333333333333' };
    expect(await run(otherClient)).toEqual(otherClient);
    const result = await run({ ...ordinary, client_id: client });
    expect(result.claims.aud).toBe('https://mcp.example.test/mcp');
    expect(result.claims.mcp_permissions).toEqual(['knowledge:read']);
    expect(result.claims.scope).toBe('openid');
    expect(result.claims.role).toBe('authenticated');
    expect((await run({ ...ordinary, user_id: 'foreign', client_id: client })).error.http_code).toBe(403);
    await db.exec('set role authenticated');
    await expect(run(ordinary)).rejects.toThrow(/permission denied/);
    await db.exec('reset role; set role supabase_auth_admin');
    expect(await run(ordinary)).toEqual(ordinary);
  } finally { await db.close(); }
});
