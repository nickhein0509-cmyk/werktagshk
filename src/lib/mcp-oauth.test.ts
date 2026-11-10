import { describe, expect, it } from 'vitest';
import { authorizationId, safeMcpRedirect, allowedMcpRequest, MCP_CLIENT_ID, MCP_CALLBACK } from './mcp-oauth';
describe('MCP consent boundaries', () => {
  it('rejects absent, repeated and path-like authorization IDs', () => {
    expect(authorizationId('?authorization_id=valid-123')).toBe('valid-123');
    for (const value of ['', '?authorization_id=../x', '?authorization_id=a&authorization_id=b']) expect(authorizationId(value)).toBeNull();
  });
  it('only redirects to the exact registered HTTPS callback', () => {
    expect(safeMcpRedirect(MCP_CALLBACK + '?code=synthetic&state=example')).toBe(MCP_CALLBACK + '?code=synthetic&state=example');
    for (const url of ['javascript:alert(1)', 'https://chatgpt.com.evil.test/connector_platform_oauth_redirect', 'https://user@chatgpt.com/connector_platform_oauth_redirect', MCP_CALLBACK + '/extra', MCP_CALLBACK + '#fragment']) expect(safeMcpRedirect(url)).toBeNull();
  });
  it('does not trust app names, unrelated clients or broader scopes', () => {
    const request = { client: { id: MCP_CLIENT_ID }, redirect_uri: MCP_CALLBACK, scope: 'openid offline_access' };
    expect(allowedMcpRequest(request)).toBe(true);
    expect(allowedMcpRequest({ ...request, client: { id: 'foreign' } })).toBe(false);
    expect(allowedMcpRequest({ ...request, scope: 'openid email' })).toBe(false);
    expect(allowedMcpRequest({ ...request, redirect_uri: 'https://evil.test' })).toBe(false);
  });
});
