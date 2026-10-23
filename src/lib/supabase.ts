import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Keep the deployed storage key so existing sessions continue to work.
// Browser configuration must contain a publishable key, never a secret/service key.
export const supabase =
  url && key ? createClient(url, key, { auth: { storageKey: 'werktag-learning-auth' } }) : null;
