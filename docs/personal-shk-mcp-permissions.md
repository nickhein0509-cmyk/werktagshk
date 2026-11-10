# Persönliche SHK-Lerneinheiten über den bestehenden MCP

## Auftrag und Grenze

Nick hat am 10. November 2026 ausdrücklich die Zusammenführung, Lern-Schreibrechte
und Live-Anbindung über den vorhandenen Server autorisiert. Seine persönlichen
SHK-Lerneinheiten bleiben vom vorerst pausierten WerkTag-Projekt getrennt. Der
lokale PC bleibt ein Lernort; die bestehende Web-App und Cloud-Anbindung sind
ergänzende Zugänge. Die gemeinsame Konto-/Domain-Infrastruktur verbindet diese
Bereiche technisch, nicht fachlich.

Dieser Beitrag ändert nur den bestehenden OAuth-Hook, seine Rechtekonfiguration,
die Zustimmungsanzeige und zugehörige Tests. Er richtet weder einen neuen Server
noch einen neuen OAuth-Client ein und aktiviert keine WerkTag-Produktentwicklung.
Er enthält keine privaten Originalabgaben, Besitzer-IDs oder Zugangsdaten.

Basis: `nickhein0509-cmyk/werktagshk`, `main`
`0a76433bded8790ede0c26d4e08c11f09614eddc`; eigener Branch
`feat/personal-shk-oauth-20261110`. Eigentum dieses Beitrags:

- `supabase/migrations/20261110223000_nick_mcp_learning_permissions.sql`
- `src/lib/mcp-learning-hook.test.ts`
- `src/components/OAuthConsent.tsx`
- `tests/e2e/mcp-consent.spec.ts`
- dieses Protokoll und der Verweis aus dem bisherigen OAuth-Protokoll

## Rechtevertrag

Die neue Migration ergänzt die nicht öffentlich lesbare Tabelle
`mcp_private.oauth_clients` um `permissions`. Vorhandene und neue Zeilen erhalten
weiterhin ausschließlich `knowledge:read`. Weder `enabled`, Besitzer, Client-ID
noch Ressourcen-Audience werden geändert. Die historische Migration bleibt
unverändert. Die Datenbank erlaubt nur eine nicht leere Liste folgender Rechte:

| Recht | Zweck im bestehenden Nick Cloud MCP |
| --- | --- |
| `knowledge:read` | Freigegebenes WerkTag-Projektwissen suchen und lesen |
| `learning:read` | Persönlichen Lernplan, Aufgaben und Abgaben lesen |
| `learning:submit` | Neue, unveränderliche Originalabgaben speichern |
| `learning:review` | Fachliche Auswertungen und daraus abgeleitete Planänderungen speichern |
| `learning:sync` | Abgleich mit bestehenden Zielsystemen vorbereiten |
| `learning:ack` | Geprüfte Übernahme in ein Zielsystem bestätigen |

Der Hook stellt exakt die serverseitig konfigurierte Liste als `mcp_permissions`
aus, nachdem OAuth-Client und Besitzer geprüft wurden. Angeforderte Scopes,
eingehende Berechtigungsclaims oder Benutzer-Metadaten können die Liste nicht
erweitern. Normale Anmeldungen, fremde Clients und deaktivierte Konfigurationen
bleiben unverändert. `anon` und `authenticated` können weder diese Konfiguration
lesen/ändern noch den Hook ausführen; die Hook-Ausführung bleibt Supabase Auth
vorbehalten. Bestehende RLS-Regeln werden nicht gelockert.

Diese Rechte sind keine Google-IAM-Rollen. Sie geben dem MCP keine zusätzlichen
Firestore-Datenrechte und richten weder einen PC-Zugriff noch einen Notion-
Transfer ein. Der Ressourcenserver muss jedes Werkzeug anhand seines eigenen
Rechts, der Ressourcen-Audience, des Clients und Besitzers prüfen. Originalschutz,
Revisionen, fachliche Auswertung und Synchronisationsbelege bleiben dortige
Verträge und werden durch diese SQL-Migration nicht umgangen.

## Zustimmung und produktive Anschlussarbeit

Die Seite zeigt den zunächst ausschließlich lesenden persönlichen SHK-Zugriff
getrennt vom weiterhin nur lesbaren WerkTag-Projektwissen. Originalabgaben,
Auswertungen, Planänderungen und Sync-Vorbereitung/-Bestätigung sind ausdrücklich
als noch gesperrte Schreibstufe beschrieben. Die
bestehenden beiden exakten ChatGPT-Callbacks sowie die OAuth-Scopes
`openid`, `email` und `offline_access` bleiben erhalten. Anmeldung allein löst
keine Zustimmung aus; Erlauben und Ablehnen verlangen weiterhin einen Klick und
eine erneut geprüfte Kontozuordnung.

Die explizite Freigabe für die aufgeführten Lernrechte liegt für diesen Auftrag
vor. Die Migration selbst aktiviert sie trotzdem nicht. Die automatische
Freigabeprüfung hat die Erweiterung der Google-Runtime-Schreibrechte blockiert;
diese Rechte bleiben daher unverändert und der Ressourcenserver zunächst
schreibgeschützt. Der Integrator konfiguriert gezielt nur `knowledge:read` und
`learning:read` am bestehenden Besitzer-Client. Die späteren Schreibrechte
benötigen eine geklärte Google-Freigabe, geprüften Ressourcenserver und passend
aktualisierte Zustimmungsanzeige. Keine pauschale Erweiterung anderer Clients
oder Konten und keine Umgehung der blockierten IAM-Änderung.

Vorhandene Zugriffstokens ändern sich nicht rückwirkend. Für die Lernrechte sind
frisch ausgestellte Tokens nötig; die konkrete ChatGPT-Verbindung und eine
gegebenenfalls erforderliche Neuautorisierung sind produktiv zu prüfen. Die
eigenen Berechtigungsclaims sind keine zusätzlichen Supabase-OAuth-Scopes:
eine Änderung der Konfiguration allein garantiert deshalb keine erneut gezeigte
Zustimmungsseite. Dieser Beitrag widerruft keine vorhandenen OAuth-Freigaben oder
WerkTag-Sitzungen und behauptet keine bereits erfolgreiche ChatGPT-Verbindung.

Rückweg: die gezielte Client-Konfiguration wieder auf `knowledge:read` setzen
und frisch ausgestellte Tokens prüfen. Bereits ausgestellte Tokens behalten
ihren Inhalt bis zum Ablauf; eine dringende Sperre muss deshalb zusätzlich am
Ressourcenserver erfolgen. Keine Lern- oder Projektdaten für einen Rückweg löschen.

## Tatsächliche Prüfung

Lokal mit Node 24.22.1 und den unveränderten Lockfile-Abhängigkeiten geprüft:
18 gezielte Tests der historischen Migration, neuen Rechtemigration und
OAuth-Callback-/Scope-Regeln bestanden. Die neue Migration wurde dafür in einem
lokalen Postgres/PGlite über eine bereits konfigurierte Bestandszeile angewendet.
Geprüft sind Default-Erhalt, Rechte-Teilmengen, Abweisung unbekannter/leer/null
gesetzter Rechte, fehlende Rechteausweitung durch Scopes/Claims, Besitzerprüfung,
unveränderte normale Tokens und Datenbank-Ausführungsrechte.

`npm run check` wurde gestartet. Produktionsbuild, 5 Bundle-Prüfungen,
280 Unit-Tests, 38 Gateway-/Assistenztests, 132 Cloud-Funktionstests und
7 Workflowtests bestanden (462 Prüfungen neben dem Build). Der Browserteil
scheitert in dieser Umgebung bereits beim Start von Chromium:
`process_singleton_posix.cc:297: socket() failed: Operation not permitted`.
Der Gesamtlauf wurde nach dieser Diagnose abgebrochen. Ein gezielter erneuter
Start von `tests/e2e/mcp-consent.spec.ts --max-failures=1` bestätigt denselben
Startfehler; keine Browserprüfung ist hier als bestanden gezählt.

Nach der Begrenzung auf den anfänglichen Lesezugriff bestanden Build und alle
18 gezielten OAuth-/Hooktests erneut. Die bestehenden sieben Consent-Browsertests enthalten weiterhin beide exakten
Callbacks, explizites Erlauben/Ablehnen, fremde Clients/Callbacks und 320-Pixel-
Breite. Sie prüfen nun zusätzlich die getrennten Lern-/WerkTag-Leserechte und
ausdrücklich gesperrten Schreib-/Sync-Rechte. Ihre Ausführung und die vollständige Browsersuite bleiben
auf einem Runner mit startfähigem Chromium zu bestätigen.

Produktive SQL-Anwendung, geänderte Client-Rechte, Veröffentlichung und echte
ChatGPT-/Google-Verbindung sind keine Ergebnisse dieses lokalen Beitrags.
