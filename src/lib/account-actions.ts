import type { SupabaseClient } from '@supabase/supabase-js';

type AccountClient = Pick<SupabaseClient, 'auth'>;

export type PasswordCredentials = {
  email: string;
  password: string;
};

export type RegistrationCredentials = PasswordCredentials & {
  emailRedirectTo: string;
};

export function signInAccount(client: AccountClient, credentials: PasswordCredentials) {
  return client.auth.signInWithPassword(credentials);
}

export function registerAccount(client: AccountClient, credentials: RegistrationCredentials) {
  const { email, password, emailRedirectTo } = credentials;
  return client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });
}

export function requestAccountPasswordReset(
  client: AccountClient,
  email: string,
  redirectTo: string,
) {
  return client.auth.resetPasswordForEmail(email, { redirectTo });
}

export function updateAccountPassword(client: AccountClient, password: string) {
  return client.auth.updateUser({ password });
}

export async function signOutAccount(
  client: AccountClient,
  fetcher: typeof fetch = fetch,
  signal: AbortSignal = AbortSignal.timeout(8000),
) {
  const cleared = await fetcher('/assistenz/logout', {
    method: 'POST',
    credentials: 'same-origin',
    signal,
  });
  // Keep the account session until every private product session has been
  // revoked. A failed request must never leave a usable cookie behind an
  // apparently completed account logout.
  if (!cleared.ok) throw new Error('Private session revocation failed');
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw error;
}
