import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import {
  registerAccount,
  requestAccountPasswordReset,
  signInAccount,
  signOutAccount,
  updateAccountPassword,
} from './account-actions';

function accountClient() {
  const auth = {
    signInWithPassword: vi
      .fn()
      .mockResolvedValue({ data: { session: null, user: null }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { session: null, user: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  };
  return { client: { auth } as unknown as Pick<SupabaseClient, 'auth'>, auth };
}

describe('shared account actions', () => {
  it('forwards password sign-in credentials without adding registration options', async () => {
    const { client, auth } = accountClient();
    await signInAccount(client, {
      email: 'account@example.invalid',
      password: 'synthetic-password',
    });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'account@example.invalid',
      password: 'synthetic-password',
    });
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it.each([
    'https://werk-tag.com',
    'https://werk-tag.com/konto',
    'https://preview.example.invalid/konto?source=registration#callback',
  ])('preserves the explicit registration redirect %s', async (emailRedirectTo) => {
    const { client, auth } = accountClient();
    await registerAccount(client, {
      email: 'new-account@example.invalid',
      password: 'synthetic-password',
      emailRedirectTo,
    });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'new-account@example.invalid',
      password: 'synthetic-password',
      options: { emailRedirectTo },
    });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('keeps reset and update parameters explicit and unchanged', async () => {
    const { client, auth } = accountClient();
    const redirectTo = 'https://werk-tag.com/konto?source=recovery#callback';
    await requestAccountPasswordReset(client, ' recovery@example.invalid ', redirectTo);
    await updateAccountPassword(client, 'synthetic-new-password');
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(' recovery@example.invalid ', {
      redirectTo,
    });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'synthetic-new-password' });
  });

  it('revokes the private session before signing out the local account', async () => {
    const { client, auth } = accountClient();
    const events: string[] = [];
    const signal = new AbortController().signal;
    const fetcher = vi.fn(async () => {
      events.push('private:revoked');
      return { ok: true } as Response;
    });
    auth.signOut.mockImplementation(async () => {
      events.push('account:signed-out');
      return { error: null };
    });

    await signOutAccount(client, fetcher, signal);

    expect(fetcher).toHaveBeenCalledWith('/assistenz/logout', {
      method: 'POST',
      credentials: 'same-origin',
      signal,
    });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(events).toEqual(['private:revoked', 'account:signed-out']);
  });

  it.each(['http', 'network'] as const)(
    'fails closed after a private-session %s error',
    async (failure) => {
      const { client, auth } = accountClient();
      const fetcher = vi.fn(() =>
        failure === 'network'
          ? Promise.reject(new Error('Synthetic network failure'))
          : Promise.resolve({ ok: false } as Response),
      );

      await expect(signOutAccount(client, fetcher, new AbortController().signal)).rejects.toThrow();
      expect(auth.signOut).not.toHaveBeenCalled();
    },
  );
});
