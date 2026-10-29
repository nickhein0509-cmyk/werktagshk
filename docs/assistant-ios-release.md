# Assistent 0.15 / iOS 0.2 – Analyse und Integration

Auftrag vom 29. Oktober 2026: bestehendes Gesamtprojekt auf Dopplungen prüfen,
Assistent/Karte/Routen verfeinern und native iOS-App mit WerkTag verbinden.
Verantwortlich für Integration: Codex. [Kartenaufgabe](https://github.com/nickhein0509-cmyk/werktag-assistent/issues/10),
[iOS-Abnahme](https://github.com/nickhein0509-cmyk/werktag-assistent/issues/9).

Basis ist `main` **1c8d0a4ee101eb312b078148633140cce8863d2c**, Integrationsbranch
`release/20261029-assistant-ios`. Der vorhandene native PR13 mit Head
`04a94aea5702f53759b2ae3ba9b3400028e313fc` ist darin integriert. AI-PR15 bleibt
separat. Eigentum: Webkarte/Statistikdarstellung, GPS-Auswahlvertrag, native App,
nativer Gateway/Empfänger und Releaseablauf. Lerninhalte und Materialkatalog werden
nicht durch neue Kopien ersetzt.

## Analyse der sechs Repositories

Die drei Produkt-Repositories enthalten Aufträge und Übergaben; sie sind keine
Duplikate des laufenden App-Codes. `werktagshk` bleibt der gemeinsame ausführbare
Codebestand, `projektzentrale` koordiniert, `projekt-vorlage` liefert Vorlagen.

| Befund | Behandlung |
| --- | --- |
| OwnTracks/iOS können dieselbe Bewegung doppelt einrechnen | Pro Karte/Statistik genau einen Recorder auswählen; Quelle/Gerät im Antwortvertrag erhalten. |
| Zwei identische `route.js` | Edge-Datei bleibt kanonisch; dauerhafter Byteparitätstest schützt die Browserkopie. Keine Änderung historischer Routenalgorithmen. |
| 76 doppelte Zeilen Health-Validierung | Eigene Konsolidierungsaufgabe, Freddy/native Health bleiben getrennt. |
| Katalog-Dateiliste dreifach | Kanonische Liste in eigener Plattformaufgabe wiederverwenden. |
| Kontoaktionen in zwei Komponenten | Spätere gemeinsame Aktionen mit erhaltener Logout-Reihenfolge und Redirects. |
| Mehrere überlagerte CSS-Designstände | Betroffene Komponenten schrittweise konsolidieren; kein pauschaler Neuaufbau. |

Der Mehrquellenfehler ist synthetisch belegt: Zwei Recorder messen jeweils etwa
68,46 m, zusammengeführt entstanden 116,46 m. Es wurden dafür keine privaten
Produktionsaufzeichnungen kopiert. [Konsolidierungsaufgabe](https://github.com/nickhein0509-cmyk/projektzentrale/issues/12).

## Daten- und Routenvertrag

`map/data` und `map/statistics` akzeptieren `source` und `device` nur gemeinsam.
Ohne Auswahl wird der Recorder mit dem jüngsten Messzeitpunkt im Zeitraum gewählt;
Gleichstände sind deterministisch. Ein unbekanntes explizites Gerät liefert 404,
ein bekanntes ohne Daten im Zeitraum eine leere Auswahl. Kein stiller Ersatz.

Webkarte und Statistik erhalten `recorders`/`selectedRecorder`; Messpunkte behalten
`source`/`device`. Native Tagesabfrage ist zusätzlich auf `werktag_ios` und das
jeweilige Gerät beschränkt. Das native Konto muss Besitzer der Installation sein.

Bestehende Archive bleiben erhalten. Das alte v1-Format kann mehrere Recorder
nicht eindeutig abbilden: Solche Tage werden bis zur Versionierung nicht neu
archiviert; `deferredDates` macht dies im Vertrag sichtbar. Rohdaten bleiben
abrufbar. Alte Abschnittsverweise ohne eindeutige Quelle bleiben ungeprüft.
[Archiv-Folgeaufgabe](https://github.com/nickhein0509-cmyk/werktag-assistent/issues/11).

## Oberfläche und Fehlerbehebung

Die Karte erhält konturierte Wege, sichtbare Kontextstrecken, nummerierte Aufenthalte
und eine klarere Zeitachse. Start/Ende stammen aus akzeptierten Messungen statt aus
geglätteten Linien; Aufenthaltskreise werden vollständig eingepasst und Fokus bleibt
bei Aktualisierungen erhalten. Keine Straßenanpassung und keine erfundenen Strecken.

Native Aufnahme setzt eine funktionsfähige kontogebundene Queue voraus. Konflikte
bei Ereignis-IDs werden sichtbar statt still verworfen. Bestätigte Tageswege lassen
sich nach einem Neustart erneut laden. Getrennte GPS-Segmente verhindern Verbindungen
über schlechte Fixes, lange Pausen und unmögliche Sprünge.

## Veröffentlichung und Abnahme

Web, Supabase, Simulator und TestFlight sind getrennte Nachweise. Die konkreten
Quell-SHAs, Checks und Bereitstellungen werden im Release-PR/GitHub-Release verlinkt.
Ein Quellrelease oder Simulatorartefakt ist keine installierbare iPhone-Verteilung.

Nick hat Apple Developer, möchte **TestFlight zuerst** und hat noch keine App in
App Store Connect angelegt. [Einrichtung und benötigte Secrets](../ios/TESTFLIGHT.md).
Vor dem Upload fehlen im beobachteten Umgebungsstand Apple-Team-/Signing-Konfiguration
und Zugriff für die Supabase-Bereitstellung. Der Tokenbedarf ist im Cloud-Entwurf
vorgemerkt; dies aktiviert ihn noch nicht. Keine Schlüssel in Git oder Chat.
