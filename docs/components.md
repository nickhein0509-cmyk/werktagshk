# Komponentenliste als drittes WerkTag-Projekt

Entwicklungsstand 28.10.2026, Basis `93cbd6d7ad6811de3df3aee53f572a000d94d95c`. Die Projektauswahl unter `/projekte` führt zu Lernen, AI Assistance und Komponentenliste. Die dritte Karte öffnet `/assistenz/components`.

Die bestehende Komponentenliste V9 bleibt der Datenbestand. Originaldatei, Datensatz-IDs, Quellen, Prüfkennzeichnungen, Filter und Exporte werden nicht durch einen neuen Katalog ersetzt. Katalogdaten, Herstellerbilder und private Quelldateien gehören nicht ins öffentliche Repository. Eine technische Integration erteilt keine neue fachliche Freigabe.

## Privater Dienst

Die Katalogansicht und alle zugehörigen Dateien benötigen dieselbe gültige private Kartensitzung wie die Assistenz. Ein SHK-Lernkonto erteilt diesen Zugriff nicht. Ohne Sitzung muss die Katalogseite einen verständlichen Hinweis mit Rückweg zu Projekten und privater Anmeldung zeigen; Datenblöcke dürfen keine Inhalte liefern. Bestehenden privaten Zugang zuerst öffnen, falls noch keine Sitzung besteht.

Der private PC-Dienst liefert eine angepasste Ansicht der vorhandenen Offline-Datei. Er muss vor jeder Katalogroute seine bestehende Sitzungsprüfung ausführen. Weder ein allgemeiner Dateiserver noch ein neuer öffentlicher Downloadpfad wird benötigt. Die Offline-Datei selbst bleibt unverändert.

Der Web-Gateway erlaubt nur folgende GET-Pfade:

| WerkTag | PC-Dienst |
| --- | --- |
| `/assistenz/components` | `/map/components` |
| `/assistenz/components/app.js`, `inflate.js` | entsprechende Dateien unter `/map/components/` |
| `/assistenz/components/style-0.css`, `style-1.css`, `chrome.css` | entsprechende Dateien unter `/map/components/` |
| `/assistenz/components/blocks/shk-offline-index.b64` | gleicher Dateiname unter `/map/components/blocks/` |
| `/assistenz/components/blocks/shk-shard-0.b64` bis `shk-shard-41.b64` | gleiche Dateinamen unter `/map/components/blocks/` |

Die große Offline-Datei überschreitet die bestehende Antwortgrenze von 4 MiB. Deshalb lädt die Ansicht Index und benötigte Datenblöcke einzeln. Die Grenze bleibt erhalten. Alle Katalogantworten werden unverändert mit `no-store` weitergegeben, einschließlich der CSP des privaten Dienstes. Unbekannte Pfade, weitere Dateien und schreibende Methoden bleiben gesperrt. Nur die beiden vorhandenen Assistenz-Cookies werden an den PC übertragen.

## Integration und Abnahme

Webänderung und privater Adapter müssen zusammen bereitgestellt werden. Die aktuelle Entwicklungsarbeit installiert oder startet den produktiven Empfänger nicht automatisch. PC und Tunnel bleiben Betriebsabhängigkeiten.

Vor Freigabe prüfen:

- Build, App-Tests, Gatewaytests und Chromiumtests.
- Drei Projektkarten, richtige Ziele und Darstellung bei 320, 390, 768, 1024 und 1440 px.
- Private Katalogansicht mit dem tatsächlichen V9-Bestand: Suche, Filter, Details, Rücknavigation und Export.
- Ohne Sitzung weder Ansicht noch Index/Datenblöcke; unbekannte Pfade bleiben gesperrt.
- Durch den echten Gateway stimmen Inhalte und CSP weiterhin; jede Antwort bleibt unter 4 MiB.

Tests mit simuliertem Navigationsziel belegen die Projektverlinkung. Sie ersetzen nicht die Prüfung des privaten Adapters und des gemeinsamen Ablaufs.
