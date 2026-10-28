# WerkTag für iPhone · 0.1

Native SwiftUI-App ab iOS 17. Apple-Systemschrift, native Tabs/Navigation/Formulare,
SF Symbols, Dynamic Type und Hell-/Dunkelmodus. Native MapKit-Karte.

## Enthalten

- Anmeldung mit dem bestehenden, der Assistenz zugeordneten WerkTag-Konto.
- Standortaufzeichnung nach bewusstem Start, inklusive erlaubter Hintergrundaufzeichnung.
- Apple Health: Schritte, aktive Energie und mittlerer Puls der letzten sieben Tage.
- Atomare lokale Warteschlange je Konto, stabile Ereignis-IDs, Serverquittung vor Entfernung.
- Exponentielle Wiederholung bei Netzfehlern/429/5xx, sichtbare Auth-/Datenkonflikte.
- Nach Abmeldung bleiben ausstehende Daten ausschließlich dem ursprünglichen Konto zugeordnet.
- Health-Werte fehlen bei fehlender Lesefreigabe oder fehlenden Daten; niemals erfundene Nullwerte.

## Bauen

Auf einem Mac mit Xcode und XcodeGen:

```sh
cd ios
swift test
xcodegen generate
xcodebuild -project WerkTag.xcodeproj -scheme WerkTag -sdk iphonesimulator -configuration Debug -derivedDataPath build CODE_SIGNING_ALLOWED=NO build
```

Der vorbereitete GitHub-Workflow führt genau diese Prüfung sowie PostgreSQL-Tests aus.
Er veröffentlicht keine App und benötigt keine Apple-Zugangsdaten. Simulator-Screenshots
werden ausschließlich aus einer frischen Installation ohne Konto oder persönliche Daten erzeugt.
Der Workflow läuft bei Änderungen an der nativen App in Pull Requests.

Für ein echtes iPhone eigene Apple-Team-ID/Signierung und HealthKit-Capability einrichten.
TestFlight benötigt die bezahlte Apple-Mitgliedschaft. Ein Produktionsicon und
App-Store-Datenschutzangaben fehlen noch; dies ist ein Entwicklungsstand.

## Backend zuerst bereitstellen

1. Neue SQL-Migration nach den vorhandenen Assistance-Migrationen prüfen/anwenden.
2. Neue Supabase Edge-Funktion `assistance-native` mit `verify_jwt=false` deployen.
   Sie validiert JWTs selbst mit `auth.getUser` und prüft die Besitzerzuordnung.
3. `ASSISTANCE_INSTALLATION_ID` muss auf die bestehende Installation zeigen.
4. Vercel: `ASSISTANCE_NATIVE_URL=https://<projekt>.supabase.co/functions/v1/assistance-native`.
   Bestehende öffentliche `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY` verwenden.
5. Neuen Gateway `api/assistenz-native.mjs` veröffentlichen.
6. App installieren, anmelden, Health und Standort einzeln freigeben.

Kein Service-Role-Schlüssel, privater Apple-Schlüssel oder Passwort gehört in diese App oder Git.
Neue Integration lässt bestehende Web-/OwnTracks-/Freddy-Routen unverändert.

## Grenzen

Swift-Tests und Xcode-Simulatorbuild werden im macOS-CI geprüft. Die Abnahme auf einem echten iPhone steht noch aus.
iOS entscheidet über Hintergrundzeiten; keine Zusage für einen festen 15-Minuten-Takt.
Standortaufzeichnung nach erzwungenem Beenden muss bewusst erneut gestartet werden.
Health wird manuell, beim Öffnen und bei von iOS gewährter Hintergrundaktualisierung gelesen.
Keine HealthKit-Observer-Hintergrundzusage.
Kalender, Erinnerungen, Watch und externe AI sind in dieser Version nicht enthalten.
Standorte fließen nach Freischaltung in den bestehenden WerkTag-Wegverlauf.
Health-Snapshots werden separat aufbewahrt und über die native API gelesen; die vorhandene
Freddy-Webstatistik zeigt sie noch nicht an. Keine Summierung paralleler Quellen.
Karte: nur letzte 1.000 Punkte der Sitzung/ausstehenden Queue, kein vollständiges Archiv.

## Geräteabnahme

- Berechtigung ablehnen/widerrufen; keine automatische Wiederfreigabe.
- Flugmodus: echte eigene Daten erfassen, App neu öffnen, Queue unverändert.
- Netz wieder einschalten: Serverquittung kontrollieren; Wiederholung ohne Doppelzählung.
- Während Upload neue Punkte erfassen: nur quittierte IDs verschwinden.
- Gesperrtes iPhone und abgelaufene Anmeldung; keine Löschung der Queue bei Fehlern.
- Abmelden/anderes Konto: keine Übertragung fremder Restdaten.
- Gesundheit leer/gesperrt: keine falsche Erfolgs- oder Nullwertanzeige.
- Große Schrift, VoiceOver, Hell/Dunkel und 44-Punkt-Systembedienelemente prüfen.
