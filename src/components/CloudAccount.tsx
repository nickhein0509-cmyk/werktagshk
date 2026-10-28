// Behavior reconstructed from deployed index-CFJax_aZ.js, 2026-10-23.
// Original source was inaccessible; types and descriptive names restored editorially.
import { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { mergeLearningStates } from '../lib/sync';
import { validateState } from '../lib/learning';
import type { LearningState } from '../lib/learning';

export function CloudAccount({
  user,
  state,
  onLoad,
}: {
  user: User | null;
  state: LearningState;
  onLoad: (state: LearningState) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  if (!supabase)
    return (
      <details className="cloud-account" open={!user}>
        <summary>Lernkonto</summary>
        <p>
          Cloud-Anmeldung ist in dieser Umgebung nicht eingerichtet. Dein Lernstand bleibt lokal.
        </p>
      </details>
    );
  const client = supabase;
  async function authenticate(create: boolean) {
    setBusy(true);
    try {
      const result = create
        ? await client.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          })
        : await client.auth.signInWithPassword({ email, password });
      setMessage(
        result.error
          ? 'Anmeldung fehlgeschlagen. Prüfe E-Mail, Passwort und gegebenenfalls deine Bestätigungsmail.'
          : create && !result.data.session
            ? 'Bitte bestätige deine E-Mail-Adresse über den Link in deinem Postfach.'
            : 'Angemeldet.',
      );
      setPassword('');
    } catch {
      setMessage('Verbindung fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="cloud-account" open={!user}>
      <summary>{user ? 'Dein Lernkonto' : 'Anmelden & synchronisieren'}</summary>
      {user ? (
        <>
          <p>
            Angemeldet als <strong>{user.email}</strong>
          </p>
          <CloudProgress key={user.id} userId={user.id} state={state} onLoad={onLoad} />
          <button
            className="button secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setMessage('');
              try {
                const cleared = await fetch('/assistenz/logout', {
                  method: 'POST', credentials: 'same-origin', signal: AbortSignal.timeout(8000),
                });
                // Keep the account signed in until its private session is revoked.
                // Otherwise a failed request would leave a usable catalogue cookie.
                if (!cleared.ok) throw new Error('Private session revocation failed');
                const { error } = await client.auth.signOut({ scope: 'local' });
                if (error) throw error;
              } catch {
                setMessage('Abmelden nicht abgeschlossen. Bitte erneut versuchen.');
              } finally {
                setBusy(false);
              }
            }}
          >
            Abmelden
          </button>
        </>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void authenticate(false);
          }}
        >
          <p>
            Melde dich mit deinem bestehenden Werktag-Konto an oder erstelle ein Lernkonto. Ohne
            Anmeldung lernst du weiterhin lokal.
          </p>
          <label>
            E-Mail
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Passwort
            <input
              type="password"
              autoComplete="current-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <div className="cloud-actions">
            <button className="button primary" disabled={busy}>
              Anmelden
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={busy || !email || password.length < 8}
              onClick={() => void authenticate(true)}
            >
              Konto erstellen
            </button>
          </div>
        </form>
      )}
      <p role="status">{message}</p>
    </details>
  );
}

function CloudProgress({
  userId,
  state,
  onLoad,
}: {
  userId: string;
  state: LearningState;
  onLoad: (state: LearningState) => void;
}) {
  const [message, setMessage] = useState('Lernstand der Modellübungen noch nicht geladen.');
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const revision = useRef<number | null>(null);
  const lastSaved = useRef('');
  const latest = useRef(state);
  latest.current = state;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function connect(includeGuest = false) {
    if (!supabase) return;
    setBusy(true);
    setConnected(false);
    try {
      let local = latest.current;
      if (includeGuest) {
        const raw = localStorage.getItem('werktag-learning-v1');
        const guest = raw ? validateState(JSON.parse(raw)) : null;
        if (raw && !guest)
          throw Error(
            'Die Gastdaten sind beschädigt. Bitte zuerst die Rohdatensicherung exportieren.',
          );
        if (guest) local = mergeLearningStates(local, guest);
      }
      const { data, error } = await supabase
        .from('shk_learning_progress')
        .select('state,revision')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw Error('Cloud nicht erreichbar. Dein lokaler Lernstand bleibt erhalten.');
      if (!mounted.current) return;
      const remote = data ? validateState(data.state) : null;
      if (data && !remote)
        throw Error('Cloud-Daten haben ein unbekanntes Format. Sie werden nicht überschrieben.');
      local = mergeLearningStates(latest.current, local);
      const merged = remote ? mergeLearningStates(local, remote) : local;
      revision.current = data?.revision ?? null;
      lastSaved.current = data ? JSON.stringify(remote) : '';
      onLoad(merged);
      setConnected(true);
      setMessage('Modellübungen verbunden. Änderungen werden automatisch gespeichert.');
    } catch (error) {
      if (mounted.current)
        setMessage(
          error instanceof Error
            ? error.message
            : 'Synchronisieren fehlgeschlagen. Bitte erneut versuchen.',
        );
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  useEffect(() => {
    void connect();
  }, []);
  useEffect(() => {
    if (!connected || busy || JSON.stringify(state) === lastSaved.current) return;
    const timer = window.setTimeout(async () => {
      if (!supabase) return;
      const snapshot = JSON.stringify(latest.current);
      setBusy(true);
      setMessage('Wird synchronisiert …');
      try {
        const previous = revision.current;
        const record = {
          user_id: userId,
          state: JSON.parse(snapshot),
          revision: (previous ?? 0) + 1,
        };
        const result =
          previous === null
            ? await supabase
                .from('shk_learning_progress')
                .insert(record)
                .select('revision')
                .single()
            : await supabase
                .from('shk_learning_progress')
                .update({ state: record.state, revision: record.revision })
                .eq('user_id', userId)
                .eq('revision', previous)
                .select('revision')
                .single();
        if (result.error || !result.data)
          throw Error(
            'Cloud-Speichern fehlgeschlagen oder anderes Gerät war schneller. Lokal bleibt alles erhalten. Klicke auf „Lernstände verbinden“, um erneut abzugleichen.',
          );
        if (!mounted.current) return;
        revision.current = result.data.revision;
        lastSaved.current = snapshot;
        setMessage('In der Cloud gespeichert.');
      } catch (error) {
        if (mounted.current) {
          setConnected(false);
          setMessage(
            error instanceof Error
              ? error.message
              : 'Cloud nicht erreichbar. Bitte erneut verbinden.',
          );
        }
      } finally {
        if (mounted.current) setBusy(false);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [state, connected, busy, userId]);
  return (
    <div>
      <p role="status">{message}</p>
      <p>
        Beim Verbinden bleiben alle Antworten und Merkliste-Einträge erhalten. Dein Tagesziel auf
        diesem Gerät wird übernommen. Entfernte Merkeinträge können beim Zusammenführen wieder
        erscheinen.
      </p>
      <div className="cloud-actions">
        <button className="button primary" disabled={busy} onClick={() => void connect()}>
          Lernstände verbinden
        </button>
        <button className="button secondary" disabled={busy} onClick={() => void connect(true)}>
          Gast-Lernstand übernehmen
        </button>
      </div>
    </div>
  );
}
