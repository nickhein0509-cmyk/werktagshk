# Private Assistenz in der Cloud · 0.9.0

Produktbereiche: **Assistent** und die ausdrücklich geteilten Plattformverträge. Die Materialliste ist ein eigenständiges Produkt, das aktuell noch denselben Dienst verwendet. Zuständigkeiten: [Produktkarte](product-map.md).

OwnTracks behält `https://werk-tag.com/api/assistenz/owntracks`, HTTP-Basic-Zugang und Gerätekennung. Das WerkTag-Gateway leitet ausschließlich erlaubte Anfragen an die Supabase-Funktion `assistance` weiter. Der Empfang bestätigt erst nach der atomaren Datenbankspeicherung mit `[]`; Wiederholungen werden anhand der bisherigen Punkt-ID dedupliziert. Ein PC oder Cloudflare-Tunnel ist für diesen Cloud-Pfad nicht erforderlich.

## Konto und Zugriff

`/konto` stellt Anmeldung und Registrierung über den bestehenden Supabase-Client bereit. Der bisherige Sitzungsschlüssel `werktag-learning-auth` bleibt bestehen. Die Kontoseite synchronisiert keine Lerndaten. Lernkonto und private Assistenz speichern ihre Inhalte getrennt.

Die bestehende Installation bleibt bis zu ihrer einmaligen Zuordnung unbeansprucht. Ein privater Link `/konto#connect=…` enthält den bestehenden Besitzerbeweis. Die Seite entfernt das Fragment sofort und hält den Schlüssel ausschließlich flüchtig. Erst die ausdrückliche Bestätigung mit einer serverseitig geprüften Anmeldung ordnet die Installation atomar dieser `auth.users.id` zu. Ein bereits zugeordnetes Konto kann nicht durch Wiederverwenden des Links ersetzt werden. Der Leseschlüssel allein berechtigt nicht zur Kontozuordnung.

Danach kann das angemeldete Konto eine geschützte HttpOnly-Kartensitzung erhalten. Die Karten-Brücke verwendet die bestehende Supabase-Sitzung und leert alte Kontositzungen beim Nutzerwechsel. Anmeldung bleibt bei abgelaufener oder gelöschter Sitzung erforderlich; der private Kartenlink muss nicht erneut eingefügt werden. Bisherige private Leselinks funktionieren weiterhin als getrennte Freigabe.

Alle Assistenz-Tabellen haben RLS und entziehen `anon`, `authenticated` und `PUBLIC` den direkten Zugriff. Die Edge-Funktion prüft jeden Zugriff auf die feste Installation gegen Anmeldung oder Kartensitzung. Privilegierte RPCs sind ausschließlich für `service_role` freigegeben. Besitzer-, Karten- und HTTP-Geheimnisse stehen nur als gesalzene Hashes in der Installation; der Service-Schlüssel bleibt serverseitig.

## Bestand und Archive

Der private Import übernimmt kanonische Rohpunkte, vorhandene Health-Tage und Tageseinträge sowie originale JSON-/GPX-Archive. Bereits vorhandene Datensätze werden beim Import nicht überschrieben. Der Import verändert keine Dateien auf dem ursprünglichen PC. Er erhält Punkt-IDs, Messzeiten, Empfangszeiten und originale Archivstrings.

Neue Cloud-Punkte bleiben fortlaufend in der Datenbank. Abgeschlossene Tage werden bei einem Kartenabruf als dauerhafte [Tagesarchive v2](assistant-archive-v2.md) ergänzt; dafür ist kein Mitternachts-Timer auf dem PC erforderlich. Mehrere Recorder bleiben darin als getrennte Journale erhalten. Vorhandene v1-Archive und ihre originalen JSON-/GPX-Bytes werden weder ersetzt noch neu erzeugt. GPS-Abstände sind Näherungen; bereinigte Tagesansicht und ausdrücklich bezeichnete Rohdatenstatistik können voneinander abweichen. Datenlücken und unbekannte Genauigkeiten bleiben sichtbar.

## Health im 15-Minuten-Takt

Die vorhandene Verbindung Apple Health → Freddy bleibt erhalten. Unter `/konto` kann der zugeordnete Besitzer einen Freddy Personal API-Schlüssel geschützt eintragen. Der Schlüssel gehört nicht in Chat, Git, öffentliche Dateien oder Browserspeicher. Die Funktion `health-sync` prüft den Schlüssel und die bestehende Apple-Health-Quelle, speichert ihn in Supabase Vault und richtet genau einen Cronjob `*/15 * * * *` ein. Ohne erfolgreichen Einrichtungsschritt gibt es keinen aktivierten Takt.

Der Abgleich liest die vorhandenen freigegebenen Tagesmetriken vollständig mit Pagination. Merged-Tageswerte werden nicht aus einzelnen Apps addiert; VO₂max bleibt eine tatsächliche zeitgestempelte Beobachtung. Eine transaktionale Zusammenführung erhält frühere Tage und fehlende Werte. Überholte oder fehlgeschlagene Läufe ersetzen keine neueren Daten. Ausschalten beendet die geplanten Abrufe und erhält gespeicherte Werte.

Cloud-Abruf, erfolgreicher Import, letzter Quellen-Sync und letzte Quelldaten sind getrennte Zeitpunkte. Ein Abruf alle 15 Minuten erzwingt keine neue iPhone-Messung: iOS steuert die Hintergrundausführung und den Zugriff auf gesperrte Health-Daten.

## Bereitstellung und Prüfung

Seit dem Auftrag vom 29.10.2026 ist `mvkksfecimpjnytvbrrb` das Ziel des
[vollständigen Projektumzugs](supabase-project-migration.md); PR #20 und die aktuelle
öffentliche Konfiguration verwenden bereits dieses Ziel. Die SQL-Dateien allein bilden keine
vollständige Datenbank ab. Erst nach Bestandsübertragung die tatsächlich fehlenden
Migrationen gegen die Live-Historie prüfen und die Funktionen bereitstellen.
`assistance` und `health-sync` verwenden eigene zwingende Authentifizierung und benötigen daher `verify_jwt=false` am Plattform-Gateway. Browser erhalten niemals einen Service-Schlüssel. Die serverseitigen Vercel-Variablen `ASSISTANCE_CLOUD_URL` und `ASSISTANCE_HEALTH_URL` verweisen auf die jeweiligen Supabase-Funktionen. Ein Zurücksetzen des Webdeployments allein kopiert neue Cloud-Daten nicht zurück auf den PC oder in das Quellprojekt.

`npm run check` prüft Build, bestehende Lernfunktionen, beide Gatewaypfade, die Cloud-Backendlogik und Browserabläufe mit isolierten synthetischen Daten. Reale Standort-Empfangsnachweise sind separat am Produktionsspeicher zu prüfen; keine erfundenen GPS-Punkte für einen Produktionstest senden. Ein aktivierter Cronjob beweist noch keinen neuen Health-Quellenstand. Ein vollständiger echter Health-API-Test setzt den privaten Nutzerschlüssel voraus.

Offizielle Quellen: [Supabase Scheduling](https://supabase.com/docs/guides/functions/schedule-functions), [Freddy Personal API](https://freddy.coach/help/personal-api), [Freddy Apple Health](https://freddy.coach/help/connect-apple-health).
