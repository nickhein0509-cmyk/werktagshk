import { cloudProxy } from '../server/assistance-cloud.mjs';
export const config = { maxDuration: 60 };
export default async function ai(req, res) {
  return cloudProxy(req, res, 'ai');
}
