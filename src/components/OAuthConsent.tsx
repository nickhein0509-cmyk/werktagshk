import { useEffect, useRef, useState } from 'react';
import type { OAuthAuthorizationDetails, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { allowedMcpRequest, authorizationId, safeMcpRedirect } from '../lib/mcp-oauth';
import './account-page.css';

export function OAuthConsent() {
  const [id] = useState(() => authorizationId(window.location.search));
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null);
  const [resume, setResume] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const currentUser = useRef<string | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    document.title = 'Nick Cloud MCP · Lernzugriff freigeben';
    if (!supabase) { setReady(true); return; }
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      currentUser.current = next?.user.id ?? null;
      setSession(next); setReady(true);
      setDetails(null); setResume(null);
    });
    return () => { active = false; currentUser.current = null; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabase || !session || !id) return;
    let active = true;
    setMessage('Anfrage wird geprüft …');
    void supabase.auth.oauth.getAuthorizationDetails(id).then(({ data, error }) => {
      if (!active) return;
      if (error || !data) throw new Error();
      if ('redirect_url' in data) {
        const next = safeMcpRedirect(data.redirect_url);
        if (!next) throw new Error();
        setResume(next); setMessage('Die Freigabe wurde bereits erteilt. Du kannst zu ChatGPT zurückkehren.');
      } else {
        if (!allowedMcpRequest(data) || data.authorization_id !== id || data.user.id !== session.user.id) throw new Error();
        setDetails(data); setMessage('');
      }
    }).catch(() => { if (active) setMessage('Diese Anfrage ist abgelaufen oder für diese Verbindung nicht freigegeben. Starte die Verbindung in ChatGPT erneut.'); });
    return () => { active = false; };
  }, [session, id]);

  async function login() {
    if (!supabase || submitting.current) return;
    submitting.current = true; setBusy(true); setMessage('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error();
      setPassword('');
    } catch { setMessage('Anmeldung nicht möglich. Prüfe deine Zugangsdaten und versuche es erneut.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  async function decide(approve: boolean) {
    if (!supabase || !details || !session || !id || submitting.current) return;
    const owner = session.user.id;
    submitting.current = true; setBusy(true); setMessage('');
    try {
      // Refresh account identity before a consequential consent decision.
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || user?.id !== owner || currentUser.current !== owner) throw new Error();
      const { data, error } = await (approve
        ? supabase.auth.oauth.approveAuthorization(id, { skipBrowserRedirect: true })
        : supabase.auth.oauth.denyAuthorization(id, { skipBrowserRedirect: true }));
      if (error || !data || currentUser.current !== owner) throw new Error();
      const next = safeMcpRedirect(data.redirect_url);
      if (!next) throw new Error();
      window.location.assign(next);
    } catch { setMessage('Die Entscheidung konnte nicht abgeschlossen werden. Starte die Verbindung in ChatGPT erneut.'); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <div className="account-page">
    <a className="account-skip" href="#consent-main">Zur Freigabe</a>
    <header className="account-header"><a href="/projekte">WerkTag · Projekte</a><a href="/konto">Mein Konto</a></header>
    <main className="account-main" id="consent-main" tabIndex={-1}>
      <p className="account-eyebrow">DEINE ENTSCHEIDUNG</p>
      <h1>Deine SHK-Lerneinheiten mit ChatGPT verbinden.</h1>
      <p className="account-intro">Für deinen persönlichen Lernbereich nutzt Nick Cloud MCP dein bestehendes Konto. WerkTag bleibt ein separates, vorerst pausiertes Projekt.</p>
      {!id ? <section className="account-card"><h2>Keine gültige Verbindungsanfrage</h2><p>Starte die Verbindung in ChatGPT. Danach kommst du für die Freigabe hierher zurück.</p></section>
        : !supabase ? <section className="account-card"><h2>Anmeldung nicht eingerichtet</h2><p>Die Kontoverbindung ist hier noch nicht verfügbar.</p></section>
        : !ready ? <p role="status">Anmeldung wird geprüft …</p>
        : !session ? <section className="account-card"><h2>Mit deinem WerkTag-Konto anmelden</h2>
          <form onSubmit={event => { event.preventDefault(); void login(); }}>
            <label>E-Mail-Adresse<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
            <label>Passwort<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
            <button className="account-primary" disabled={busy}>{busy ? 'Bitte warten …' : 'Anmelden'}</button>
          </form><p>Verwende dein bestehendes Konto. Die Anmeldung allein erteilt noch keine Freigabe.</p>
        </section> : <section className="account-card">
          <h2>Nick Cloud MCP</h2><p>Angemeldet als <strong>{session.user.email}</strong></p>
          <h3>Deine persönlichen SHK-Lerneinheiten</h3>
          <p>Mit deiner Freigabe darf die Verbindung deinen Lernplan, Aufgaben und Abgaben lesen.</p>
          <p>Sie darf neue Originalabgaben speichern, fachliche Auswertungen ergänzen und daraus abgeleitete Änderungen am persönlichen Lernplan übernehmen.</p>
          <p>Sie darf den Abgleich mit PC, Web-App oder Notion vorbereiten und eine tatsächlich geprüfte Übernahme bestätigen. Diese Freigabe allein überträgt noch keine Daten an diese Ziele. Bereits abgegebene Originalantworten bleiben unverändert geschützt.</p>
          <h3>WerkTag-Projektwissen</h3>
          <p>Freigegebene Projekteinträge darf die Verbindung weiterhin nur suchen und lesen, nicht ändern oder löschen. Health-Daten gehören nicht zu diesem Zugriff.</p>
          {details?.scope.split(' ').includes('email') && <p>Zur Zuordnung deines Kontos erhält ChatGPT außerdem deine E-Mail-Adresse.</p>}
          <p>Nach deiner Entscheidung kehrst du zu <strong>chatgpt.com</strong> zurück. Die Freigabe gilt nur für das berechtigte Besitzerkonto; sie erteilt keine Google-Administrationsrechte.</p>
          {details && <div className="account-actions"><button disabled={busy} onClick={() => void decide(false)}>Ablehnen</button><button className="account-primary" disabled={busy} onClick={() => void decide(true)}>Lesen und Lernen speichern erlauben</button></div>}
          {resume && <button className="account-primary" onClick={() => window.location.assign(resume)}>Zurück zu ChatGPT</button>}
        </section>}
      <p role="status" aria-label="Verbindungsstatus">{message}</p>
    </main>
  </div>;
}
