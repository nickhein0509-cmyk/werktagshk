import { createHealthSyncHandler } from './handler.mjs';

// Deploy with verify_jwt=false: user JWTs are checked with Auth, cron uses its own Vault secret.
// Both checks happen before fetching credentials or any health data.
Deno.serve(createHealthSyncHandler({
  supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
  serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  publicOrigin: Deno.env.get('ASSISTANCE_PUBLIC_ORIGIN') ?? 'https://werk-tag.com',
}));
