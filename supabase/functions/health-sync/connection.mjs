import { freddyClient, validApiKey } from './freddy.mjs';
import { freddyMcpClient, validMcpConnection } from './freddy-mcp.mjs';

export function connectionFromBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  if (Object.keys(body).length === 1 && validApiKey(body.apiKey)) return body.apiKey;
  const connection = {kind:'mcp',url:body.mcpUrl,token:body.mcpToken};
  return Object.keys(body).length === 2 && validMcpConnection(connection) ? JSON.stringify(connection) : null;
}
export function healthConnectionClient(stored, fetcher) {
  if (validApiKey(stored)) return freddyClient(stored, fetcher);
  let value;
  try { value = JSON.parse(stored); } catch { /* safe typed error below */ }
  return freddyMcpClient(value, fetcher);
}
