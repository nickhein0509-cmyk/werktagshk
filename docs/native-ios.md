# Native WerkTag-App

Produkt: Assistent. Native SwiftUI-App ab iOS 17 mit Heute, Wege und Verbindung.
Die Oberfläche verwendet Apple-Systemkomponenten, MapKit, SF Symbols, Dynamic Type
und Hell-/Dunkelmodus. Einrichtung, Build und Geräteabnahme: [iOS-Anleitung](../ios/README.md).

## Datenübertragung

Die App schreibt Standortereignisse und freigegebene Health-Tageswerte zuerst atomar
in eine dauerhafte, kontogebundene Warteschlange. Stabile Ereignis-IDs und eine
transaktionale Serverquittung verhindern doppelte Verarbeitung. Nur exakt quittierte
Ereignisse werden lokal entfernt. Netzfehler werden mit wachsender Wartezeit wiederholt;
Anmelde- und Datenkonflikte bleiben sichtbar. Tokens liegen im gerätegebundenen Keychain.

Der separate Gateway `api/assistenz-native.mjs` und die Supabase-Funktion
`assistance-native` prüfen Anmeldung und Besitzerzuordnung. Eine neue SQL-Migration
legt Empfangsquittungen und native Health-Snapshots mit RLS an. Standorte nutzen den
bestehenden Wegverlauf. Native Health-Daten bleiben von Freddy-Daten getrennt;
die bestehende Freddy-Webstatistik zeigt sie noch nicht an.

## Prüfung

Der Workflow `.github/workflows/ios.yml` prüft Empfängerverträge, echte PostgreSQL-
Transaktionen, die portable Swift-Warteschlange und einen mit Ad-hoc-Signierung erstellten Xcode-Simulatorbuild.
Ein frischer iPhone-Simulator prüft den fehlerfreien Start und die drei Tabs per UI-Test und erzeugt Screenshots ohne Anmeldung oder persönliche Daten.
Der bestehende Web-Workflow prüft weiterhin die gesamte Plattform.

Lokal bestanden 102 JavaScript-Tests, einschließlich zwölf neuer Vertrags-/Gatewaytests.
Die Ergebnisse für macOS, PostgreSQL und die Plattform stehen im jeweiligen PR-Check.
Ein erfolgreicher Simulator-Build ersetzt nicht die Abnahme auf einem echten iPhone.

## Einführung und Grenzen

Vor dem ersten Upload müssen Migration, Edge-Funktion und Gateway bereitgestellt sein.
Für ein iPhone folgen Apple-Signierung und individuelle Health-/Standortfreigaben.
TestFlight benötigt die kostenpflichtige Apple-Mitgliedschaft. Der CI-Build benötigt
keine Apple-Zugangsdaten und veröffentlicht keine installierbare App.

Standortaufnahme startet bewusst per Taste. iOS bestimmt Hintergrundlaufzeiten;
es gibt keine Zusage für einen festen Takt oder lückenlose Aufzeichnung. Nach
Vollbeenden der App muss die Aufzeichnung erneut gestartet werden. Health wird
manuell, beim Öffnen und bei erlaubter Hintergrundaktualisierung gelesen.
Kalender, Erinnerungen, Watch und externe AI sind nicht Teil dieser Version.

Die Änderung umfasst `ios/`, den nativen CI-Workflow, den nativen Gateway,
`supabase/functions/assistance-native/`, `supabase/functions/assistance/native.mjs`
und `supabase/migrations/20261029010000_assistance_native_ingestion.sql`.
Bestehende Web-/OwnTracks-/Freddy-Routen werden nicht geändert.
