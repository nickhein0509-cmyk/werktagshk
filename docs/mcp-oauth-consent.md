# MCP-Zustimmung in WerkTag

## Live-Stand nach ausdrücklicher Freigabe am 10.11.2026

PR #34 ist integriert. Vercel-Produktion für `werk-tag.com` meldete für
Merge-Commit `557fb57dbd33f8468d0676133d42f88d9f8ca25e` READY.
`/oauth/consent` liefert HTTP 200 mit `no-store` und `no-referrer`.

Die private Konfigurationszeile für den unten genannten MCP-Client ist aktiviert
und enthält das mit dem angemeldeten WerkTag-Konto abgeglichene Besitzerkonto.
`public.nick_mcp_access_token_hook` ist als Custom Access Token Hook im
Supabase-Dashboard aktiviert. SQL-Vertragsprüfung: MCP-Audience und
Leseberechtigung korrekt, gewöhnliches Login-Ereignis unverändert. Owner-ID
und Tokens bleiben außerhalb des Repositorys.

Der eigene Cloud-Run-Service ist unter
`https://nick-mcp-c4xkjyryfq-ey.a.run.app/mcp` bereitgestellt. Discovery liefert
HTTP 200; anonyme und ungültig authentifizierte MCP-Aufrufe werden mit HTTP 401
abgewiesen. Das private ChatGPT-Plugin ist angelegt, dessen Wissenswerkzeuge
waren beim Verbindungstest aber noch nicht verfügbar. Echte OAuth-Anmeldung,
Suche und Abruf aus ChatGPT sind deshalb weiterhin nicht abgenommen.

Diese Dokumentationsfortsetzung verwendet Basis
`557fb57dbd33f8468d0676133d42f88d9f8ca25e`, Branch
`docs/mcp-auth-live-status`, Worktree `/workspace/werktag-mcp-live-docs`.
Eigene Änderung ausschließlich diese Datei, keine neuen Abhängigkeiten.
Die folgenden Abschnitte dokumentieren die Vorbereitung vor der Aktivierung.

## Vorbereitung und Implementierung

Auftrag: privates Projektwissen über Nick Cloud MCP mit ChatGPT verbinden.
Bereich PLATTFORM; keine neue Lernfunktion. Basis `d0c3eb09a3e4ef63b99d7837e44486b57b8012fc`,
Branch `feat/mcp-oauth-consent`, separate Arbeitskopie `/workspace/werktag-mcp-consent`.
Eigene Dateien: Zustimmungsseite, isolierte OAuth-Helfer/Tests, Route, Vercel-
Rewrite/Sicherheitsheader und dieses Protokoll. Bestehende Pakete wiederverwendet.

Am 10.11.2026 über Remote Desktop Commander im angemeldeten Supabase-Dashboard
geprüft: OAuth-Server aktiv, dynamische Registrierung aktiv, Site-URL
`https://werk-tag.com`, Authorization Path `/oauth/consent`. Keine vorhandenen
OAuth-Apps oder Auth-Hooks sichtbar. Die Zustimmungsroute war im aktuellen
Produktionsquellcode nicht implementiert.

Separaten öffentlichen OAuth-Client `Nick Cloud MCP` angelegt und in der Liste
zurückgeprüft: Client-ID `7a171f80-0e72-481a-a269-e9f16630a1e3`, Public, Manual.
Exakter Callback: `https://chatgpt.com/connector_platform_oauth_redirect`.
Die Client-ID ist öffentlich; es wurde kein Client-Secret erzeugt oder kopiert.
PKCE wird vom OAuth-Anbieter geprüft. Vor Live-Verbindung die Unterstützung
öffentlicher Clients in der ChatGPT-Konfiguration abnehmen.

Die neue Seite akzeptiert ausschließlich diesen Client, den registrierten
Callback und `openid`/`offline_access`. Sie lädt die Anfrage vom Auth-Server,
zeigt den Zugriff auf Projektwissen und verlangt explizites Erlauben/Ablehnen.
Keine Freigabe durch Anmeldung allein. Weiterleitung nur an den exakten
ChatGPT-Callback, auch bei bereits bestätigten Anfragen. Bestehende
WerkTag-Sitzung und Anmeldung werden verwendet, keine neuen Konten automatisch
angelegt. Fehler enthalten keine Rohantworten, Tokens oder Auth-Codes.

Die separate MCP-API muss Client-ID, Besitzer, Ressourcen-Audience und die
Berechtigung `knowledge:read` in einem spezifischen Claim prüfen. Ein erst noch
zu konfigurierender, eng auf den MCP-Client begrenzter Access-Token-Hook muss
Audience und Berechtigung ausstellen. Normale WerkTag-Tokens bleiben unverändert.
Keine pauschale Änderung der allgemeinen JWT-Audience oder vorhandener RLS-Regeln.

Abhängigkeit: https://github.com/nickhein0509-cmyk/nick-cloud-mcp/pull/21
Der offene WerkTag-PR #33 betrifft einen anderen Supabase-Wissensspeicher und
wird nicht stillschweigend integriert. Der aktuelle Auftrag nutzt Firestore.

Rückweg: OAuth-Verbindung/Client deaktivieren und vorherige WerkTag-Revision
wiederherstellen. Keine privaten Daten geändert. Eine veröffentlichte
Zustimmungsseite allein bedeutet keine funktionsfähige MCP-Verbindung.

## Geprüfter Umsetzungsstand

Neue Migration `nick_mcp_oauth_hook` am 10.11.2026 auf dem bestehenden Zielprojekt
angewendet. Sie legt eine zunächst leere, nicht öffentlich lesbare Client-
Konfiguration und einen nur für Supabase Auth ausführbaren Hook an. **Nicht als
Auth-Hook aktiviert; keine Besitzerkonfiguration eingetragen.** Keine Änderung
an bestehenden Tokens ohne explizit aktivierte Konfigurationszeile.

Validierung: Produktionsbuild erfolgreich; 266 Unit-Tests, 180 Browser-Tests,
38 Gateway-, 132 Cloud-Funktions- und 7 Workflow-Tests bestanden. Hook in lokalem
Postgres/PGlite getestet: normale und fremde Client-Tokens unverändert,
falscher Besitzer abgewiesen, nur Zielclient bekommt Audience/Leseberechtigung,
keine Ausführung durch anon/authenticated. Nach Ergänzung des Hook-Tests
Build und Unit-Tests erneut erfolgreich; Browsercode unverändert.

Google-CLI und Google-Cloud-Plugin liefern derzeit wiederholte OAuth-
Anmeldeaufforderungen. Dadurch noch kein MCP-Deployment oder End-to-End-Test.
