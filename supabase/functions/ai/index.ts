import { createAiHandler } from './handler.mjs';

// verify_jwt=false: Auth validates the user's bearer token before any budget or provider request.
Deno.serve(createAiHandler({
  supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
  serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  apiKey: Deno.env.get('OPENAI_API_KEY') ?? '',
  publicOrigin: Deno.env.get('ASSISTANCE_PUBLIC_ORIGIN') ?? 'https://werk-tag.com',
}));
