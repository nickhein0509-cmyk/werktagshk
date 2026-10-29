# WerkTag für iPhone · 0.2

Native SwiftUI-App ab iOS 17 mit Heute, Wege und Verbindung. Apple-Systemschrift,
Dynamic Type, Hell-/Dunkelmodus und MapKit mit Petrol-/Kupfergestaltung. Der
gewünschte Verteilungsweg ist zunächst internes **TestFlight**; Einrichtung und
Upload: [TESTFLIGHT.md](TESTFLIGHT.md).

## Enthalten

- Bestehendes WerkTag-Konto mit serverseitiger Besitzerprüfung. Gespeicherte
  Anmeldung, aktuell bestätigte Verbindung und Übertragungsquittung bleiben unterscheidbar.
- Dauerhafte lokale Warteschlange je Konto; Standortaufnahme erst mit bereitgestelltem
  Speicher. Identische Ereignisse werden dedupliziert, widersprüchliche IDs abgelehnt.
- Bestätigten Tagesverlauf des eigenen Recorders vom Server laden und mit lokalen
  ausstehenden Punkten zusammenführen. Keine Vermischung mit OwnTracks-Geräten.
- Getrennte Wegabschnitte bei schlechter GPS-Genauigkeit, Zeitlücken oder unmöglichen
  Sprüngen. Keine erfundenen Straßenverläufe oder durch Lücken gezogenen Linien.
- Bewusst gestartete Standortaufnahme und getrennte Health-Freigabe für Schritte,
  aktive Energie und mittleren Puls. Fehlende Werte bleiben fehlend.
- Wiederholungen bei Netzfehlern/429/5xx; sichtbare Anmelde-/Datenkonflikte und
  Erhalt nicht quittierter Ereignisse auch bei Abmeldung.

## Bauen und prüfen

Auf einem Mac mit Xcode und XcodeGen:

```sh
cd ios
swift test
xcodegen generate
xcodebuild -project WerkTag.xcodeproj -scheme WerkTag -sdk iphonesimulator -configuration Debug -derivedDataPath build CODE_SIGN_IDENTITY=- CODE_SIGNING_ALLOWED=YES build
```

`.github/workflows/ios.yml` prüft die portable Swift-Logik, Empfänger-/Gateway-
Verträge, PostgreSQL-Transaktionen, Signing-Profilvalidierung und die native
Oberfläche auf einem frischen iPhone-Simulator. Screenshots verwenden ausschließlich
synthetische oder leere Daten. Das Artefakt `werktag-ios-simulator` enthält den
Quell-SHA; es ist **nicht auf einem iPhone installierbar**. Der getrennte
TestFlight-Workflow benötigt Apple-Konfiguration und einen geprüften Release-Tag.

## Backend bereitstellen

**Projektwechsel beauftragt:** Vor diesen Schritten den
[Migrationsstand](../docs/supabase-project-migration.md) prüfen. Ziel ist
`mvkksfecimpjnytvbrrb`; die bisherigen Konto-UUIDs und Installationsdaten müssen
aus `hrqaxsbddpmphblmoyly` übernommen und geprüft sein. Aktuell ist noch kein
Transfer bestätigt. Diese Anleitung allein richtet das neue Projekt nicht ein.

1. `20261029010000_assistance_native_ingestion.sql` nach den vorhandenen Assistance-
   Migrationen prüfen und anwenden; danach
   `20261029020000_assistance_native_journey.sql` für konsistente Tagesabfragen.
   Bestehende RLS-/Ownergrenzen erhalten.
2. Aktualisierte Funktion `assistance` einschließlich `semantics/recorders.js`
   bereitstellen, bevor native Recorder live Daten hinzufügen. Dadurch werden
   parallele Quellen in der Webkarte/Statistik nicht als ein Weg kombiniert.
3. Neue Edge-Funktion `assistance-native` mit `verify_jwt=false` bereitstellen.
   Sie validiert JWTs selbst mit `auth.getUser` und prüft die Besitzerzuordnung.
   `ASSISTANCE_INSTALLATION_ID` muss auf die bestehende Installation zeigen.
4. Vercel nutzt `ASSISTANCE_NATIVE_URL`, falls gesetzt. Sonst wird der feste
   Schwesterpfad `/functions/v1/assistance-native` aus der validierten bestehenden
   `ASSISTANCE_CLOUD_URL` mit Pfad `/functions/v1/assistance` abgeleitet.
   `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY` müssen zum selben
   geprüften Projekt gehören wie die Funktionsziele. Erst beim abgenommenen
   Projektumzug gemeinsam auf die Zielwerte umstellen und den Webbuild erneuern.
5. Gateway veröffentlichen; Konfiguration, Besitzeranmeldung, idempotenten Upload
   und anschließenden Tagesabruf prüfen. Ohne gültige Anmeldung keine Wegdaten.

Native Journey-API: GET `?action=journey&date=YYYY-MM-DD&deviceId=UUID`; Datum in
Europe/Berlin. Nur `werktag_ios` und das gewählte Gerät, maximal 10.000 Punkte und
4 MiB. Größere Tage liefern 413, niemals eine unbemerkte Teilroute. Der Webverlauf
bleibt der Ausweg für solche Tage.

Kein Service-Role-Schlüssel, Apple-Schlüssel oder Passwort gehört in die App oder
Git. Native Health-Snapshots bleiben getrennt von Freddy und werden nicht in dessen
Webstatistik addiert. Vorhandene GPS-Rohdaten und Archivstände bleiben erhalten.

## Geräteabnahme

- Berechtigung ablehnen/widerrufen; keine automatische Wiederfreigabe.
- Flugmodus: eigene Messung erfassen, neu öffnen, Queue unverändert erhalten.
- Netz wieder einschalten: Quittung kontrollieren, Wiederholung ohne Doppelzählung.
- Nach Upload App neu öffnen: bestätigten Tagesverlauf erneut laden können.
- Während Upload neue Punkte erfassen: nur quittierte IDs verschwinden.
- Abgelaufene Anmeldung/gesperrtes Gerät: keine stille Löschung der Queue.
- Konto wechseln: keine Übertragung fremder Restdaten oder falsche Verbunden-Anzeige.
- Health leer/gesperrt: keine falschen Nullwerte oder Erfolgsmeldungen.
- Tages-/Abschnittswahl, große Schrift, VoiceOver, Hell/Dunkel und Treffflächen prüfen.

Ein erfolgreicher Simulatorbuild ersetzt diese Abnahme nicht. iOS bestimmt
Hintergrundlaufzeiten; nach erzwungenem Beenden muss die Aufzeichnung bewusst erneut
gestartet werden. Health wird manuell, beim Öffnen und bei erlaubter Hintergrundzeit
gelesen. Kalender, Erinnerungen, Watch und externe AI sind nicht Teil dieses Releases.
