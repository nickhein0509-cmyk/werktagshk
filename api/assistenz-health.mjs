import { cloudProxy } from '../server/assistance-cloud.mjs';
export const config = { maxDuration: 60 };
export default async function health(req, res) {
  const url = new URL(req.url ?? '/', 'https://werk-tag.com');
  const route = req.query?.route ?? url.searchParams.get('route');
  return cloudProxy(req, res, typeof route === 'string' ? 'health/' + route : '');
}
