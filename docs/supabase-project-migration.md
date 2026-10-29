# WerkTag vollständig auf das neue Supabase-Projekt übertragen

Stand: **29. Oktober 2026**, Zeitzone Europe/Berlin. Verantwortlich für die
technische Vorbereitung: Codex; Kontoinhaber: Nick. Gemeinsame Plattformänderung
für Lernapp, Assistent, Materialliste und native iOS-Anbindung.
[Verbindliche Aufgabe und Ausführungsstatus](https://github.com/nickhein0509-cmyk/projektzentrale/issues/15).

## Aktualisierung bei der PR-Integration am 29.10.2026

Der nachfolgende Vorbereitungsbericht hält die frühere Prüfung um 05:24 MEZ
fest. Sein damaliger Blocker ist **kein aktueller Laufzeitstatus**: PR #20 ist
in `main` (`ef9f8b36220914bb1d137207ca3df7d471cdb46d`) enthalten. Vercel meldet
für `werk-tag.com` genau diesen Produktionscommit als READY. Ein erneuter
öffentlicher Konfigurationsabruf bei dieser Integration liefert HTTP 200 und
`supabaseURL=https://mvkksfecimpjnytvbrrb.supabase.co`.
Der [spätere Qualitätsbericht](supabase-quality-20261029.md) dokumentiert den
Zielzugriff und die dort vorhandenen Funktionen. Eine erneute Umschaltung oder
ein erneuter Restore darf daraus nicht abgeleitet werden. Vollständigkeit aller
privaten Daten, Auth-/Vault-/Storage-Abhängigkeiten und persönliche Geräteabläufe
sind durch den öffentlichen Konfigurationsabruf weiterhin nicht bewiesen.
Vor weiteren Backendarbeiten den aktuellen Zielbestand und die Live-Historie
prüfen; die folgenden Schritte dienen als historische Migrationscheckliste.

## Ursprüngliche Entscheidung und damaliger Status

| Rolle | Projekt-ID | Projekt-URL |
| --- | --- | --- |
| Quelle, bei der Prüfung noch produktiv | `hrqaxsbddpmphblmoyly` | `https://hrqaxsbddpmphblmoyly.supabase.co` |
| Neues, ausdrücklich beauftragtes Ziel | `mvkksfecimpjnytvbrrb` | `https://mvkksfecimpjnytvbrrb.supabase.co` |

Nick hat ausdrücklich **alle WerkTag-Daten auf das neue Projekt** beauftragt.
Dies ersetzt die frühere Entscheidung „bestehendes Projekt weiterverwenden“.
Die IDs bezeichnen Projekte, keine Benutzerkonten oder Supabase-Organisationen.
Zugehörigkeit und Zugriffsrechte des Zielprojekts sind noch zu verifizieren.
Ein Organisationswechsel des alten Projekts würde die beauftragte neue Projekt-ID
nicht herstellen und ist deshalb nicht der hier vorgesehene Ablauf.

**Status: Vorbereitung dokumentiert; Ausführung vor dem ersten Export blockiert.**
In diesem Auftrag wurden weder Produktionsdatensätze übertragen noch gelöscht,
Benutzer umgehängt, Schlüssel ersetzt oder Produktionsvariablen umgestellt.
Die folgende Anleitung ist kein Nachweis einer bereits durchgeführten Migration.

| Prüfung am 29.10.2026, ca. 05:24 MEZ | Tatsächlicher Befund |
| --- | --- |
| Öffentlicher Gateway `GET https://werk-tag.com/api/assistenz-native?action=config` | HTTP 200, `schemaVersion=1`, `supabaseURL` zeigt auf **Quelle**; Schlüsselwert nicht protokolliert |
| Werkzeuge dieser Sitzung | Kein Supabase-MCP-Werkzeug verfügbar |
| `codex mcp list` in der Cloud | `No MCP servers configured yet` |
| Aktive Cloud-Konfiguration, Revision 4 | Keine Secrets oder ausgehenden Identitäten eingerichtet |
| Gespeicherter Cloud-Entwurf | `SUPABASE_ACCESS_TOKEN` vorgesehen, `has_saved_binding=false`; noch kein nutzbarer Zugang |
| Quell- und Zieldatenbank, Auth, Storage, Vault | Mangels privilegierten Zugangs **nicht abgefragt** |
| Ziel leer / Ziel gehört Nick / gleiche Datenbankversion | **Unbekannt**, nicht vorausgesetzt |

Arbeitsbasis: frisch geladenes `origin/main`
`27ff92accc4ee79d50a1f6795bed25eb6685f56b`, Aufgabenbranch
`docs/supabase-project-migration-20261029`, separate Arbeitskopie.
Eigene Änderungen: dieses Protokoll und Verweise in `AGENTS.md`, `README.md`,
`docs/deployment-recovery.md`, `docs/cloud-assistance.md`, `ios/README.md` und
`ios/TESTFLIGHT.md`. Kein Anwendungscode und keine Datenbankmigration geändert.
Die offenen PRs 15 (AI), 17 (Vertragskonsolidierung), 18 (Archive) sind keine
stillen Abhängigkeiten; ihre späteren Live-Änderungen vor Ausführung neu erfassen.

## Benötigter Zugang

1. `SUPABASE_ACCESS_TOKEN` über die sicheren Cloud-Umgebungseinstellungen
   hinterlegen, Änderungen speichern und die Umgebung veröffentlichen. Die
   bestehende Secret-Anforderung gilt für `api.supabase.com`. Danach die tatsächlich
   aktive Bindung und Lesezugriffe auf **beide** Projekt-IDs prüfen. Ein Token für
   nur eine Organisation reicht gegebenenfalls nicht. Ein Publishable Key oder
   eine maskierte Zeichenfolge ist kein administrativer Migrationszugang.
2. Den geeigneten Export-/Restore-Weg anhand Datenmenge, Tarif und Berechtigungen
   festlegen. Ein Management-Token allein beweist keinen PostgreSQL-/Storage-Zugang.
   Für logische Dumps werden erreichbare direkte oder Session-Pooler-Verbindungen
   und passende Datenbankberechtigungen benötigt; niemals Passwörter ungefragt
   zurücksetzen. Die aktuelle Cloud weist keine freigegebenen TCP-Ziele aus.
   Benötigte Netzwerkziele über die unterstützte Konfiguration freigeben oder
   einen bereits autorisierten ausführenden Rechner nutzen; keine Proxyumgehung.
3. Zielbezogenen Server-/Storage-Zugang und Zugriff auf die produktiven
   Hostingvariablen prüfen. Projektbezogene Service-Schlüssel nicht vertauschen.
   Neue projektspezifische Standard-Secrets im Ziel verwenden. Keine Secrets in
   `VITE_`-Variablen, Quellcode, öffentliche Issues oder CI-Artefakte schreiben.

MCP ist ein möglicher Verwaltungszugang, keine vollständige Kopierfunktion.
Die fehlenden Zugänge sind der Ausführungsblocker; Nick hat die Migration bereits
beauftragt. Keine zusätzliche pauschale Freigabe ist für ihre normalen Schritte
erforderlich. Falls im Ziel unabhängige Daten vorliegen, diese erhalten und den
konkreten Konflikt klären statt sie durch einen Restore zu überschreiben.

## Bestandsaufnahme: was vollständig mitkommen muss

Die folgende Liste ist aus dem Repository abgeleitet. Sie ist **kein Live-Inventar**
und muss gegen alle tatsächlichen Quell- und Zielobjekte abgeglichen werden.
Die sieben SQL-Dateien unter `supabase/migrations` sind additive Änderungen;
die frühere private Lernplattform und ihr vollständiges Basisschema fehlen dort.
Ein frisches `supabase db push` oder Seeding allein ist deshalb kein Umzug.

| Bereich | Zu erhalten / zusätzlich zu prüfen |
| --- | --- |
| Auth und Kontozuordnung | Benutzer-UUIDs, Identitäten, Passwort-Hashes, Bestätigungsstatus, Metadaten, MFA-Abhängigkeiten, vorhandene Eigentümerbeziehungen; keine Ersatzkonten anhand gleicher E-Mail anlegen |
| Privater Fragen- und Wissensbestand | Vollständiges `shk_private` und alle weiteren tatsächlich verwendeten Schemas, alte und aktuelle Fragenversionen, Reviews, Rechenvorlagen, Referenzfälle, Quellen-/Bildbezüge, Artikel, Berechtigungen und RPC-Abhängigkeiten |
| Lernen und Synchronisierung | Gespeicherte Runden, Entwürfe, Antworten, Reservierungen, Revisionen, Zeit-/Hilfe-/Lernereignisse und Modellübungszustände unverändert; keine Umdeutung als neue Lernversuche |
| Assistenzbesitz | `public.assistance_installations` einschließlich `id`, `owner_user_id`, Salts und vorhandener Hashes; Eigentümer-UUIDs müssen weiterhin auf dieselben Auth-Benutzer zeigen |
| GPS und Empfang | `assistance_points`, `assistance_receipts`, Mess- und Empfangszeiten, Punkt-IDs, Quellen-/Gerätezuordnung und ursprüngliche Payloads |
| Kontext und Archive | `assistance_contexts`, `assistance_archives`, Notizen/Aufgaben, Revisionen und exakte `original_json`-/GPX-Inhalte; keine Neuberechnung historischer Archive |
| Health | `assistance_health_days`, `assistance_health_sync`, `assistance_private.health_scheduler` und referenzierte Vault-Secrets; native und Freddy-Messwerte getrennt erhalten |
| Materialliste | `assistance_catalog_resources` einschließlich Textbytes, Pfaden, `sha256`, `bytes`, `source_sha256`; der aktuelle Vertrag verlangt 49 Ressourcen je vollständiger Katalogversion |
| Native iOS-Daten | Falls live vorhanden: `assistance_native_events`, `assistance_native_health_days`, Empfangsbelege und idempotente Ereignis-IDs. Vorhandensein der Tabellen ist noch ungeprüft |
| Sitzungen | Supabase-Auth-Sitzungen und `assistance_sessions` getrennt inventarisieren; Projektwechsel ist keine Garantie weiter gültiger Access-/Refresh-Tokens oder Cookies |
| Storage | Alle Buckets, Dateiinhalte, Pfade, Content-Types, Metadaten, Eigentümer, private/öffentliche Einstellung, Größenlimits und Policies; auch tatsächlich vorhandene zusätzliche Storage-Produkte gesondert erfassen |
| Datenbankverträge | Tabellen, Sequenzen, Views/materialisierte Views, Typen, Constraints, Indizes, Trigger, Funktionen, Owner, Grants, RLS, Default Privileges, Erweiterungen und exposed schemas |
| Betrieb | Edge Functions samt Konfiguration/Import Maps, Vault/pgsodium, Cron/Webhooks, Realtime-Publikationen, Auth-/SMTP-/OAuth-Konfiguration, Redirects, Secrets und Migrationshistorie |

Historische Berichte nennen beispielsweise 631 Fragen und später 748 Fassungen.
Diese Zahlen dürfen **nicht** als aktuelle Sollwerte übernommen werden. Für jede
Tabelle/Dateimenge werden neue, konsistente Quell- und Zielmessungen gebraucht.
Auch verborgene/private Schemas und mehr als eine API-Ergebnisseite berücksichtigen.

Browserlokale Gastlernstände, Arbeitsblätter und nicht synchronisierte iPhone-
Queues liegen nicht automatisch in Supabase. Sie bleiben auf den Geräten erhalten;
vor Projektwechsel Export-/Wiederanmelde-/Nachsynchronisierungsweg prüfen. Eine
Cloudmigration darf nicht als bereits erfolgte Übertragung dieser lokalen Daten
ausgegeben werden. Unabhängige Originaldateien auf Nicks PC sind ebenfalls kein
automatischer Bestandteil eines Datenbankdumps.

## Ablauf mit überprüfbaren Freigabepunkten

### 1. Inventar und Sicherung

- Tatsächliche Quell-/Zielorganisation, PostgreSQL-/Auth-Versionen, Extensions,
  Tabellen, Funktionen, Dateien und Datenvolumen erfassen. Bestehendes Ziel vor
  jeder Änderung sichern. Vorhandene Zieldaten bedeuten keinen Freibrief zum Löschen.
- Geschützten Sicherungsort außerhalb von Git/öffentlichen Artefakten verwenden;
  Dumps enthalten Kontodaten und Passwort-Hashes. Verschlüsselte Aufbewahrung,
  eingeschränkten Zugriff, Dateigrößen und SHA-256-Nachweise festhalten.
- Vollständige Schema-/Rollen-/Datensicherung inklusive benötigter verwalteter
  Schema-Daten und eigener Anpassungen sowie separater `supabase_migrations`-
  Historie planen. Exportumfang am tatsächlichen Dump prüfen, nicht am Dateinamen.
- Ohne bewiesenen Wiederherstellungsweg keine Umschaltung. Ein Restore-Test im
  abgeschirmten Ziel muss Schemas, Auth-Beziehungen und private Zugriffe erhalten.

### 2. Konsistenter Datenstand und laufende Schreiber

- Erstkopie bei großen Beständen vorbereiten; vor Schlussabgleich eine kontrollierte
  Schreibpause für Web, Auth-Änderungen, OwnTracks, manuelle Health-Abrufe, Cron,
  Storage und native Uploads herstellen. Bereits laufende Transaktionen auslaufen
  lassen. Tatsächliche Writer und direkte Edge-Zugriffe im Live-Inventar erfassen.
- Quell-Cron deaktivieren, vorherigen Zustand protokollieren. Ziel-Cron bis nach
  Abnahme inaktiv lassen. Noch aktive Quell-Schreiber müssen durch eine belastbare
  Delta-Erfassung einschließlich Änderungen/Löschungen abgedeckt sein; nur neue IDs
  oder `max(timestamp)` genügen nicht für einen vollständigen Schlussabgleich.
- Aufzeichnungspuffer/Retry auf den tatsächlichen Geräten prüfen. Während der Pause
  keine erfolgreiche Speicherung bestätigen, wenn nichts dauerhaft geschrieben
  wurde. Kein angenommenes HTTP-200 als Ersatz für eine Empfangsbestätigung.
- Schnittzeitpunkt mit UTC und Europe/Berlin dokumentieren. Alle Tabellen und
  Storage-Dateien auf denselben finalen Stand bringen; Paging unter laufenden
  Änderungen oder getrennte Dumps ohne Schreibpause sind kein konsistenter Snapshot.

### 3. Datenbank, Auth und Verschlüsselung wiederherstellen

- Den aktuellen offiziellen Supabase-Restore-Weg an die inventarisierten Versionen
  anpassen. Rollen, Schema und Daten kontrolliert einspielen; Restore bei Fehlern
  abbrechen (`ON_ERROR_STOP`), keine Fehlermeldungen pauschal ignorieren.
- Die in der offiziellen Anleitung beschriebene Triggerunterdrückung verhindert
  unter anderem doppelte Verschlüsselung. Falls verwendet, anschließend Trigger,
  Fremdschlüsselbeziehungen und weitere Integritätsregeln ausdrücklich prüfen;
  bereits als validiert markierte Constraints beweisen keine geprüften Importzeilen.
- Auth-Benutzer und Identitäten mit ursprünglichen UUIDs übernehmen. Eigene Auth-
  Trigger dürfen beim Import keine Profile duplizieren oder bereits zugeordnete
  Installationen verändern. Keine produktiven Testversuche im Lernkonto erzeugen.
- **Vault/pgsodium gesondert behandeln:** Ein logischer Dump enthält verschlüsselte
  Daten, nicht automatisch den Projekt-Wurzelschlüssel. Die aktuelle offizielle
  Anleitung beschreibt dessen sichere Übernahme zwischen aktiven Projekten.
  Das Überschreiben eines bereits verwendeten Ziel-Wurzelschlüssels würde dortige
  verschlüsselte Daten unlesbar machen. Deshalb vorher Zielbestand und Schlüssel-
  Abhängigkeiten prüfen; keine ungeprüfte Übernahme und keine Klartextausgabe.
- Falls ein geprüfter anderer Übertragungsweg Vault-Secrets neu anlegt, alle
  referenzierenden Secret-IDs vollständig abbilden und die Entschlüsselbarkeit
  testen. Ein vorhandener `key_secret_id` allein beweist keinen funktionierenden
  Freddy-Zugang. Quellprojekt und Schlüssel bis zur Abnahme erhalten.
- Nach Restore eventuell fehlende native Migrationen einzeln gegen die tatsächliche
  Migrationshistorie prüfen. Nicht bereits übertragene Tabellen erneut anlegen oder
  alle Repository-Migrationen blind ausführen.

### 4. Dateien und Dienste übernehmen

- Storage-Dateien über einen unterstützten, vollständigen Kopierweg übertragen.
  Datenbank-/Storage-Metadaten allein enthalten nicht die gespeicherten Datei-Bytes.
  Verschachtelte Pfade und alle Seiten erfassen; Liste, Bytes und Inhaltsprüfsummen
  Quelle/Ziel abgleichen. Vorhandene Zieldateien nicht mit blindem Upsert ersetzen.
- Den vollständigen **live** bereitgestellten Edge-Bestand erfassen, einschließlich
  Funktionen außerhalb dieses Repositorys. Repo kennt `assistance`, `health-sync`
  und `assistance-native`; das beweist weder ihre Live-Version noch Vollständigkeit.
- Secrets und externe Provider-Konfiguration geschützt neu binden. Die drei
  genannten Funktionen verwenden eigene Authentifizierung und benötigen laut
  geprüftem Quellcode `verify_jwt=false`; diese Einstellung nicht pauschal auf
  unbekannte Funktionen übertragen. Owner-/JWT-/Cron-Prüfungen erhalten und testen.
- `ASSISTANCE_INSTALLATION_ID` ausdrücklich auf die übertragene Installation setzen;
  nicht nur auf einen historischen Code-Fallback vertrauen. `assistance` mit
  Recorder-Trennung vor nativen Uploads bereitstellen.
- Auth-Site-URL, erlaubte Redirects, E-Mail-Vorlagen, SMTP, OAuth-Provider und deren
  externe Callback-Freigaben übernehmen/anpassen. Neue projektbezogene Signier-/API-
  Schlüssel und neue JWT-Issuer beachten. Erneute Anmeldung einplanen; Fortbestand
  von Passwort-Login/MFA praktisch prüfen, nicht aus einer Tabellenkopie ableiten.
- `assistance_private.health_scheduler.function_url` auf das Ziel umstellen und
  Cron-/Webhook-Ziele prüfen. Genau einen zuständigen aktiven Scheduler nach Abnahme
  zulassen. Quell- und Zieljobs dürfen nicht gleichzeitig Daten weiterentwickeln.

### 5. Abnahme vor der Produktionsumschaltung

| Nachweis | Akzeptanzkriterium |
| --- | --- |
| Datensätze | Vollständige Primärschlüsselmengen und Anzahlen je Tabelle stimmen zum Schnittzeitpunkt überein; Unterschiede begründet und einzeln dokumentiert |
| Inhalt | Vollständiger deterministischer Inhaltsvergleich bzw. chunkweise SHA-256-Prüfung; Typen, NULL, Zeitwerte, JSON-Normalisierung und Sortierung explizit festlegen; bei Tabellen ohne PK Zeilenmultimengen einschließlich Duplikaten vergleichen |
| Beziehungen | Keine verwaisten Owner-/Nutzer-/Frage-/Installations-/Secret-Referenzen; Sequenzstände passen zu vorhandenen IDs |
| Katalog und Archive | Bestehende Hashes und Bytezahlen stimmen; Original-JSON-/GPX-Strings unverändert; keine stillen Archivkonvertierungen |
| Storage | Vollständiges Manifest stimmt: Bucket/Pfad, Bytes, Inhaltschecksumme, benötigte Metadaten und Zugriffsschutz |
| Zugriff | Anonym und fremdes Konto erhalten keine privaten Lern-, Katalog-, GPS- oder Health-Daten; zugeordnetes Konto behält seinen Zugriff |
| Funktionen | RPC-Signaturen, relevante RLS/Grants, Auth-Trigger und Edge-Verträge entsprechen dem geprüften Stand |
| Web/iOS | Anmeldung, private Lesepfade, Geräte-/Recorderauswahl und native Kontozuordnung funktionieren mit dem Ziel; Offline-Queue bleibt erhalten |
| Hintergrund | Vault-Secrets verwendbar, Ziel-URLs korrekt, Quelle pausiert; aktiver Zieljob erst nach Abnahme und nachweislich erfolgreichem Lauf |

Diese Kriterien brauchen echte Quell-/Zielnachweise. Lokale Tests und frühere
grüne CI-Läufe ersetzen sie nicht. Synthetische Schreib-/Replay-Tests in isolierter
Testinstallation durchführen; keine erfundenen produktiven GPS-/Health-Messungen
oder Lernversuche erzeugen. Einen echten neu anfallenden Empfang nach Umschaltung
gesondert nachweisen. Prüfsummenmanifeste mit privaten Datensatzschlüsseln bleiben
geschützt, im öffentlichen Protokoll nur Ergebnis und Referenz hinterlegen.

### 6. Website und iOS gemeinsam umschalten

Erst nach vollständiger Datenabnahme die zusammengehörenden Produktionswerte ändern:

| Einstellung | Zielwert / Behandlung |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://mvkksfecimpjnytvbrrb.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Öffentlich verwendbarer Schlüssel **des Zielprojekts**, sicher aus dessen Konfiguration übernehmen |
| `ASSISTANCE_CLOUD_URL` | `https://mvkksfecimpjnytvbrrb.supabase.co/functions/v1/assistance` |
| `ASSISTANCE_HEALTH_URL` | `https://mvkksfecimpjnytvbrrb.supabase.co/functions/v1/health-sync` |
| `ASSISTANCE_NATIVE_URL`, falls gesetzt | `https://mvkksfecimpjnytvbrrb.supabase.co/functions/v1/assistance-native`; bei Fallback ebenfalls neues Cloud-Ziel prüfen |
| `ASSISTANCE_PUBLIC_ORIGIN` | Weiterhin `https://werk-tag.com`, solange die öffentliche Domain gleich bleibt |

- Vite-Werte sind im Browserbuild eingebettet: alleinige Variablenänderung genügt
  nicht, einen neuen geprüften Build bereitstellen. Browserbuild und Server-Gateway
  müssen auf dasselbe Projekt zeigen. Preview-Konfiguration getrennt behandeln.
- Der Swift-Client lädt die öffentliche Konfiguration vom WerkTag-Gateway. Bereits
  gespeicherte Sitzungen/Queues gesondert mit Wiederanmeldung prüfen. Gleiche Nutzer-
  UUIDs erhalten die Kontozuordnung, beweisen aber keine gültigen alten Tokens.
- Browser-Sitzungsschlüssel `werktag-learning-auth` bewusst behandeln: alte Tokens
  nicht mit neuen Projektwerten als gültig ansehen. Keine pauschale Löschung aller
  Browserdaten oder lokalen Lernstände zur Fehlerbehebung.
- OwnTracks verwendet bereits `https://werk-tag.com/api/assistenz/owntracks`.
  Dieser öffentliche Pfad kann bleiben; neue Gateway-/Empfängerzuordnung und
  bestehende Zugangshashes müssen trotzdem geprüft werden.
- `scripts/materialize-catalog-cloud.mjs` enthält eine feste Schutzbindung an die
  **Quelle**. Für diese Migration bestehende Katalogzeilen unverändert übertragen;
  das alte Importskript nicht für das neue Ziel aufrufen oder Schutzprüfungen
  entfernen. Eine spätere Neumaterialisierung benötigt eine gesondert geprüfte
  Anpassung der Zielbindung.
- Konfigurationsantwort auf Ziel-ID, ausgelieferten Commit/Version und echte
  private Abläufe kontrollieren. TestFlight-Bereitstellung bleibt zusätzlich von
  Apple-App-Eintrag, Signierung und erfolgreichem Upload abhängig.

### 7. Rückweg und Abschluss

Vor ersten produktiven Ziel-Schreibvorgängen kann der geprüfte alte Deployment-
und Konfigurationsstand wieder aktiviert werden. Jobs/Schreiber dabei koordiniert
umschalten; Quelle nur mit konsistentem Zustand wieder freigeben.

**Nach neuen Ziel-Schreibvorgängen genügt ein URL-Rollback nicht.** Zunächst
Zielschreiber pausieren, alle seit dem Schnitt entstandenen/aktualisierten/
gelöschten Daten und Dateien sichern und einen geprüften Rückabgleich einschließlich
Konflikten durchführen. Unbestätigte iOS-/OwnTracks-Ereignisse nicht verlieren.
Nie gleichzeitig zwei produktive Datenbestände ohne Synchronisierung fortführen.

Quelle nicht löschen, pausieren oder Schlüssel unbrauchbar machen, solange
Wiederherstellung, Verschlüsselung oder Nachprüfung davon abhängen. Ihre spätere
Stilllegung ist ein separat zu protokollierender Betriebsschritt. Erst bei
bestätigtem Zielbetrieb alle offenen Punkte abschließen und Migration als erledigt
melden. Ein Dokumentations-PR oder grüner Build bedeutet keine Datenübertragung.

## Ausführungsprotokoll — nach tatsächlichem Ergebnis ergänzen

| Schritt | Status jetzt | Erforderlicher Nachweis |
| --- | --- | --- |
| Entscheidung Quelle → Ziel | Bestätigt durch Nick | Obige Zuordnung, Aufgabe 15 |
| Repository-/Gatewayprüfung | Erledigt | Basis-SHA und öffentliche Konfiguration oben |
| Administrativer Zugriff auf beide Projekte | **Blockiert** | Aktive Zugangsbindung, erfolgreiche Projektprüfung ohne Secret-Ausgabe |
| Live-Inventar / Zielbestand | Nicht ausgeführt | Geschütztes Inventar, Versionen, Mengen und Abweichungen |
| Sicherung / Wiederherstellungstest | Nicht ausgeführt | Sicherungsreferenzen, Hashes und Restore-Nachweis |
| Finaler Snapshot / Transfer | Nicht ausgeführt | Schnittzeitpunkt, Writerstatus, Kopier-/Restore-Ergebnisse |
| Daten-/Datei-/Auth-Abnahme | Nicht ausgeführt | Vergleichsbericht und Benutzer-/Zugriffstests |
| Deployment / Umschaltung | Nicht ausgeführt | Konfigurationsstand, Commit, Deployment, Zielprobe |
| Neuer Empfang / Jobs / iOS | Nicht ausgeführt | Reale Empfangsbestätigung, Zieljob und Queue-Nachweis |
| Abschluss / Quelle stilllegen | Offen | Betriebsabnahme und Aufbewahrungsentscheidung |

Nach jedem Schritt Beginn/Ende (UTC und Europe/Berlin), verwendete Werkzeugversion,
Ergebnis, geschützte Belegreferenz und verbleibende Abweichungen ergänzen. Keine
Passwörter, Vault-Klartexte, Tokens, Frageninhalte oder personenbezogenen Datensätze
in diese Datei übernehmen. „Unbekannt“, „nicht ausgeführt“ und „fehlgeschlagen“
nicht als Nullbestand oder Erfolg darstellen.

## Quellen und überprüfte Grundlage

Am 29.10.2026 aus dem offiziellen Supabase-Dokumentationsrepository abgerufen:

- [Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore): Datenbank, Migrationshistorie, Auth-/Storage-Anpassungen, Vault-/pgsodium-Wurzelschlüssel, Edge Functions und Dateiübertragung.
- [Migrating within Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase): Abgrenzung Wiederherstellung und Organisationsübertragung.

Quellcode: `supabase/migrations`, `supabase/functions`, `src/lib/supabase.ts`,
`server/assistance-cloud.mjs`, `api/assistenz-native.mjs`,
`scripts/materialize-catalog-cloud.mjs`, `ios/WerkTag/Services/Connection.swift`.
Die offizielle Anleitung vor der tatsächlichen Ausführung erneut gegen die
eingesetzten Versionen prüfen; ihre Beispiele nicht ungeprüft gegen ein befülltes
Ziel ausführen.
