import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import './account-page.css';

// Remove only our private connection parameter. Supabase must still receive its
// authentication callback fragment; keep the connection key only in memory.
let pendingConnection = '';
if (/^\/konto\/?$/.test(window.location.pathname) && window.location.hash) {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  if (fragment.has('connect')) {
    pendingConnection = fragment.get('connect') ?? '';
    fragment.delete('connect');
    const remaining = fragment.toString();
    window.history.replaceState(null, '', window.location.pathname + window.location.search + (remaining ? '#' + remaining : ''));
  }
}

type LinkStatus = { linked: boolean; canRead: boolean };
type HealthStatus = {
  status: string;
  configured: boolean;
  enabled: boolean;
  cronActive?: boolean;
  intervalMinutes: number;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  sourceLastSyncAt: string | null;
  sourceLastDataAt: string | null;
  nextCheckAt: string | null;
  errorCode: string | null;
};

function readableTime(value: string | null | undefined) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Noch nicht verfügbar';
  return new Date(value).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
}

async function accountRequest<T>(
  endpoint: string,
  token: string,
  payload?: object,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(endpoint, {
    method: payload === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Bitte melde dich erneut an.'
        : response.status === 409
          ? 'Diese Assistenz ist bereits einem anderen Konto zugeordnet.'
          : 'Die Verbindung konnte nicht hergestellt werden. Bitte erneut versuchen.',
    );
  }
  return response.status === 204 ? {} as T : response.json() as Promise<T>;
}

export function AccountPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [ownerKey, setOwnerKey] = useState(() => pendingConnection);
  const [link, setLink] = useState<LinkStatus | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [linkMessage, setLinkMessage] = useState('');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [healthBusy, setHealthBusy] = useState(false);
  const [healthMessage, setHealthMessage] = useState('');
  const [reload, setReload] = useState(0);
  const currentAccount = useRef<string | null>(null);
  const mutations = useRef(new Set<AbortController>());

  useEffect(() => {
    pendingConnection = '';
    document.title = 'Dein Konto · WerkTag';
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      const nextAccount = next?.user.id ?? null;
      if (currentAccount.current !== nextAccount) {
        for (const request of mutations.current) request.abort();
        mutations.current.clear();
        setBusy(false);
        setHealthBusy(false);
      }
      currentAccount.current = nextAccount;
      setSession(next);
      setAuthReady(true);
      setApiKey('');
    });
    return () => {
      subscription.unsubscribe();
      for (const request of mutations.current) request.abort();
      mutations.current.clear();
      currentAccount.current = null;
    };
  }, []);

  useEffect(() => {
    setLink(null);
    setMapReady(false);
    setHealth(null);
    setHealthMessage('');
    setLinkMessage('');
    if (!session) return;
    const controller = new AbortController();
    const token = session.access_token;
    setLinkMessage('Deine Assistenz wird geprüft …');
    void (async () => {
      try {
        const status = await accountRequest<LinkStatus>('/api/assistenz-account?route=status', token, undefined, controller.signal);
        if (controller.signal.aborted) return;
        setLink(status);
        if (status.linked && status.canRead) {
          await accountRequest('/api/assistenz-account?route=session', token, {}, controller.signal);
          if (controller.signal.aborted) return;
          setMapReady(true);
          setLinkMessage('Deine private Assistenz ist mit diesem Konto verbunden.');
          try {
            const next = await accountRequest<HealthStatus>('/api/assistenz-health?route=status', token, undefined, controller.signal);
            if (!controller.signal.aborted) setHealth(next);
          } catch {
            if (!controller.signal.aborted) setHealthMessage('Der Health-Status ist gerade nicht erreichbar.');
          }
        } else setLinkMessage('Diesem Konto ist noch keine private Assistenz zugeordnet.');
      } catch (error) {
        if (!controller.signal.aborted) setLinkMessage(error instanceof Error ? error.message : 'Die Assistenz ist gerade nicht erreichbar.');
      }
    })();
    return () => controller.abort();
  }, [session?.access_token, reload]);

  async function authenticate() {
    if (!supabase) return;
    setBusy(true);
    setMessage('');
    try {
      const result = register
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/konto` } })
        : await supabase.auth.signInWithPassword({ email, password });
      setMessage(result.error
        ? 'Anmeldung fehlgeschlagen. Prüfe E-Mail, Passwort und gegebenenfalls die Bestätigungsmail.'
        : register && !result.data.session
          ? 'Bitte bestätige deine E-Mail-Adresse über den Link in deinem Postfach. Öffne danach deinen privaten Verbindungslink erneut.'
          : 'Angemeldet.');
    } catch {
      setMessage('Anmeldung gerade nicht erreichbar. Bitte erneut versuchen.');
    } finally {
      setPassword('');
      setBusy(false);
    }
  }

  async function claim() {
    if (!session || !ownerKey) return;
    const account = session.user.id;
    const controller = new AbortController();
    mutations.current.add(controller);
    setBusy(true);
    try {
      await accountRequest('/api/assistenz-account?route=claim', session.access_token, { ownerKey }, controller.signal);
      if (controller.signal.aborted || currentAccount.current !== account) return;
      setOwnerKey('');
      setReload((value) => value + 1);
    } catch (error) {
      if (!controller.signal.aborted && currentAccount.current === account) setLinkMessage(error instanceof Error ? error.message : 'Zuordnung fehlgeschlagen.');
    } finally {
      mutations.current.delete(controller);
      if (currentAccount.current === account) setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    try {
      const cleared = await fetch('/assistenz/logout', { method: 'POST', credentials: 'same-origin' });
      if (!cleared.ok) throw new Error();
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      setOwnerKey('');
      setMessage('Abgemeldet.');
    } catch { setMessage('Abmelden nicht abgeschlossen. Bitte erneut versuchen.'); }
    finally { setBusy(false); }
  }

  async function configureHealth(disable = false) {
    if (!session || (!disable && !apiKey.trim())) return;
    const account = session.user.id;
    const controller = new AbortController();
    mutations.current.add(controller);
    const submittedKey = apiKey.trim();
    setApiKey('');
    setHealthBusy(true);
    setHealthMessage('');
    try {
      const next = await accountRequest<HealthStatus>(`/api/assistenz-health?route=${disable ? 'disable' : 'configure'}`, session.access_token, disable ? {} : { apiKey: submittedKey }, controller.signal);
      if (controller.signal.aborted || currentAccount.current !== account) return;
      setHealth(next);
      setHealthMessage(disable ? 'Automatischer Health-Abgleich ausgeschaltet. Gespeicherte Daten bleiben erhalten.' : 'Einstellungen gespeichert. Der angezeigte Status zeigt, ob der automatische Abgleich aktiv ist.');
    } catch {
      if (!controller.signal.aborted && currentAccount.current === account) setHealthMessage('Health-Verbindung fehlgeschlagen. Prüfe deinen persönlichen Freddy-API-Schlüssel und versuche es erneut.');
    } finally {
      mutations.current.delete(controller);
      if (currentAccount.current === account) setHealthBusy(false);
    }
  }

  const healthActive = health?.configured === true && health.enabled === true && health.cronActive === true;
  return (
    <div className="account-page">
      <a className="account-skip" href="#account-main">Zum Konto</a>
      <header className="account-header"><a href="/projekte">WerkTag · Projekte</a><a href="/">Zum SHK Lernbuddy</a></header>
      <main id="account-main" className="account-main" tabIndex={-1}>
        <p className="account-eyebrow">DEIN PERSÖNLICHER BEREICH</p>
        <h1>Dein Konto.</h1>
        <p className="account-intro">Ein bestehendes WerkTag-Konto für deine Anmeldung. Lernstand und persönliche Assistenz bleiben getrennt.</p>
        {!authReady ? <p role="status">Dein Konto wird geladen …</p> : !supabase ? <section className="account-card"><h2>Anmeldung nicht eingerichtet</h2><p>Die Kontoverbindung ist in dieser Umgebung noch nicht verfügbar.</p></section> : !session ? (
          <section className="account-card" aria-labelledby="account-login-title">
            <h2 id="account-login-title">{register ? 'Konto erstellen' : 'Anmelden'}</h2>
            {ownerKey && <p>Dein privater Verbindungslink ist vorbereitet. Melde dich an und bestätige anschließend die Zuordnung zu deinem Konto.</p>}
            <div className="account-actions" role="group" aria-label="Anmeldung auswählen">
              <button type="button" aria-pressed={!register} onClick={() => setRegister(false)}>Ich habe ein Konto</button>
              <button type="button" aria-pressed={register} onClick={() => setRegister(true)}>Neues Konto</button>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); void authenticate(); }}>
              <label>E-Mail-Adresse<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label>Passwort<input type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              <button className="account-primary" disabled={busy}>{busy ? 'Bitte warten …' : register ? 'Konto erstellen' : 'Anmelden'}</button>
            </form>
          </section>
        ) : (
          <>
            <section className="account-card"><h2>Dein Profil</h2><p>Angemeldet als <strong className="account-email">{session.user.email}</strong></p><button type="button" disabled={busy} onClick={() => void signOut()}>Abmelden</button></section>
            <section className="account-card" aria-labelledby="account-assistance-title">
              <h2 id="account-assistance-title">Deine private Assistenz</h2>
              <p role="status">{linkMessage}</p>
              {mapReady ? <a className="account-primary" href="/assistenz">Private Karte öffnen</a> : link && !link.linked && ownerKey ? <button className="account-primary" type="button" disabled={busy} onClick={() => void claim()}>Private Assistenz zuordnen</button> : !link?.linked && !ownerKey ? <p>Für die einmalige Zuordnung öffne deinen persönlichen Verbindungslink. Deine Zugangsdaten gehören nicht in öffentliche Nachrichten.</p> : null}
              {!mapReady && <button type="button" disabled={busy} onClick={() => setReload((value) => value + 1)}>Verbindung erneut prüfen</button>}
            </section>
            {mapReady && (
              <section className="account-card" aria-labelledby="account-health-title">
                <h2 id="account-health-title">Apple Health über Freddy</h2>
                <p className="account-health-state">{healthActive ? 'Automatischer Abgleich aktiv' : health?.status === 'disabled' ? 'Automatischer Abgleich ausgeschaltet' : 'Noch nicht aktiviert'}</p>
                <p>WerkTag prüft bei aktiviertem Cloud-Takt alle 15 Minuten die bei Freddy verfügbaren Daten. Neue iPhone-Messungen erscheinen erst, wenn Apple Health und Freddy sie synchronisiert haben.</p>
                <dl className="account-times">
                  <div><dt>Letzte Cloud-Prüfung</dt><dd>{readableTime(health?.lastAttemptAt)}</dd></div>
                  <div><dt>Letzter erfolgreicher Abruf</dt><dd>{readableTime(health?.lastSuccessAt)}</dd></div>
                  <div><dt>Letzte Synchronisierung der Quelle</dt><dd>{readableTime(health?.sourceLastSyncAt)}</dd></div>
                  <div><dt>Neueste verfügbare Quelldaten</dt><dd>{readableTime(health?.sourceLastDataAt)}</dd></div>
                  <div><dt>Nächste geplante Cloud-Prüfung</dt><dd>{readableTime(health?.nextCheckAt)}</dd></div>
                </dl>
                {health?.errorCode && <p>Die Quelle meldet ein Verbindungsproblem. Prüfe die Freddy-Verbindung und aktualisiere den Status.</p>}
                <p>Öffne <a href="https://freddy.coach/app" target="_blank" rel="noopener noreferrer">Freddy</a> und dort „AI apps“ → „API keys“. <a href="https://freddy.coach/help/personal-api" target="_blank" rel="noopener noreferrer">Hilfe zum persönlichen API-Schlüssel</a></p>
                <form onSubmit={(event) => { event.preventDefault(); void configureHealth(); }}>
                  <label>Persönlicher Freddy-API-Schlüssel<input type="password" autoComplete="off" spellCheck={false} required value={apiKey} onChange={(event) => setApiKey(event.target.value)} /></label>
                  <p>Der Schlüssel wird einmalig geschützt an den Server übertragen und nicht im Browserspeicher abgelegt. Deine bestehenden Kurzbefehle bleiben bestehen.</p>
                  <button className="account-primary" disabled={healthBusy || !apiKey.trim()}>Health-Abgleich einrichten</button>
                </form>
                <div className="account-actions"><button type="button" disabled={healthBusy} onClick={() => setReload((value) => value + 1)}>Health-Status aktualisieren</button>{health?.configured && <button type="button" disabled={healthBusy} onClick={() => void configureHealth(true)}>Automatischen Health-Abgleich ausschalten</button>}</div>
                <p role="status">{healthMessage}</p>
              </section>
            )}
          </>
        )}
        <p role="status">{message}</p>
      </main>
    </div>
  );
}
