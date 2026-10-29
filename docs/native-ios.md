# Native WerkTag-App

Der Assistent enthält eine SwiftUI-App ab iOS 17 mit Heute, Wege und Verbindung.
Sie nutzt das bestehende WerkTag-Konto und eine kontogebundene dauerhafte Queue.
Routen werden nach Messqualität segmentiert; bestätigte Tageswege des eigenen
Geräts können erneut vom Server geladen werden. Native Health-Snapshots bleiben
von Freddy getrennt. Es gibt keine automatische Addition paralleler Quellen.

- [Funktionen, Datenvertrag und Geräteabnahme](../ios/README.md)
- [TestFlight-Einrichtung und sicherer Upload](../ios/TESTFLIGHT.md)
- [Projektanalyse und Integrationsgrenzen](assistant-ios-release.md)

Der native Workflow prüft Swift, Xcode-Simulator, UI und echte PostgreSQL-
Transaktionen mit synthetischen Daten. Der separate TestFlight-Workflow prüft
Quellprovenienz und Signing-Metadaten, bevor er einen Gerätebuild hochlädt.
Ein Simulatorbuild ersetzt weder Apple-Verarbeitung noch persönliche Geräteabnahme.
