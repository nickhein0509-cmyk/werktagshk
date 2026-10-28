import { cloudProxy } from '../server/assistance-cloud.mjs';
export const config = { maxDuration: 30 };
export default async function account(req, res) {
  const url = new URL(req.url ?? '/', 'https://werk-tag.com');
  const route = req.query?.route ?? url.searchParams.get('route');
  return cloudProxy(req, res, typeof route === 'string' ? 'account/' + route : '');
}
