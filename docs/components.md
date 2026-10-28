# Komponentenliste als drittes WerkTag-Projekt

Die Projektauswahl unter `/projekte` führt zu Lernen, AI Assistance und Komponentenliste. Der dritte Einstieg `/assistenz/components` ist eine leere öffentliche Anmeldeseite. Nach Prüfung der vorhandenen Kontositzung und der privaten Kartensitzung öffnet sie die geschützte Katalogansicht `/assistenz/components/view`.

Die bestehende Komponentenliste V9 bleibt der Datenbestand. Originaldatei, Datensatz-IDs, Quellen, fünf Prüfstatusachsen, Filter und Exporte bleiben erhalten. Katalogdaten, Herstellerbilder und private Quelldateien gehören nicht ins öffentliche Repository. Eine technische Integration erteilt keine zusätzliche fachliche Freigabe.

## Privater Cloud-Dienst

Ansicht und alle Ressourcen benötigen dieselbe gültige private Sitzung wie die Assistenz. Das zugeordnete WerkTag-Konto kann diese Sitzung aufbauen; ein beliebiges anderes Lernkonto erhält keinen Zugriff. Ohne gültige Sitzung zeigen die privaten HTML-Pfade nur einen Anmeldehinweis mit `/konto`-Verweis. Datenblöcke liefern dann keine Kataloginhalte.

Der Cloud-Empfänger prüft die bestehende Sitzung vor jeder Ressourcenabfrage. Die Ressourcen liegen in einer eigenen Tabelle mit RLS und ohne direkten Zugriff für PUBLIC, anon und authenticated. Ausschließlich die serverseitige Rolle darf die eingeschränkten Import-/Lesefunktionen aufrufen. Kein öffentlicher Bucket, frei wählbarer Dateipfad oder signierter Downloadlink ist erforderlich.

Das Supabase-Gateway setzt HTML-Antworten auf Klartext mit Sandbox. Der WerkTag-Proxy stellt ausschließlich für die fest erlaubten Katalogrouten den vertraglichen MIME-Typ und die restriktive Katalog-CSP wieder her. Zugriffskontrolle, Status und unveränderte Antwortbytes bleiben erhalten; technische Fehler bleiben JSON.

Die überprüfte Originaldatei wird einmalig mit `scripts/materialize-catalog-cloud.mjs` kopierend übernommen. Das Skript benötigt ausdrücklich die vorhandenen privaten Konfigurations-, Adapter- und Originalpfade; es liest den Besitzerbeweis ausschließlich aus der Konfiguration. Weder Zugangsdaten noch Kataloginhalte werden protokolliert. Original und Adapter müssen ihren bereits geprüften Hash besitzen. Der Transfer verändert die Originaldatei nicht und erhält alle 43 komprimierten Datenblöcke bytegleich.

Die 49 festen Ressourcen werden an den verifizierten Originalhash gebunden und unveränderlich gespeichert. Identische Wiederholungen sind zulässig; ein veränderter Inhalt am selben Pfad wird mit Konflikt abgewiesen. Der Cloud-Dienst gibt keine Teile aus, bevor die gesamte Version vollständig vorliegt. Ein späterer Katalogwechsel benötigt eine ausdrücklich geprüfte neue Versionsstrategie; der Import überschreibt keine vorhandene Version.

## Feste Routen und Sicherheitsgrenzen

| WerkTag | Geschützter Empfänger |
| --- | --- |
| `/assistenz/components/view` | `map/components/view` → gespeicherte index.html |
| `/assistenz/components/app.js`, inflate.js | gleiche Dateinamen unter map/components/ |
| `/assistenz/components/style-0.css`, style-1.css, chrome.css | gleiche Dateinamen unter map/components/ |
| `/assistenz/components/blocks/shk-offline-index.b64` | gleicher Dateiname unter map/components/blocks/ |
| `/assistenz/components/blocks/shk-shard-0.b64` bis shk-shard-41.b64 | gleiche Dateinamen unter map/components/blocks/ |

Der Cloud-Proxy erlaubt genau diese GET-/HEAD-Routen und die private HTML-Rootaliasroute. Zusätzliche Parameter, unbekannte Dateien und Schreibmethoden bleiben gesperrt. Nur die bestehende __Secure-werktag-assistance-Sitzung wird weitergegeben; HTTP-Basic und Konto-Bearer-Token werden an Katalogleserouten nicht übertragen.

Jeder Ressourceninhalt wird beim Import und vor der Ausgabe nach UTF-8-Bytezahl und SHA-256 geprüft. Die einzelne Ressource bleibt unter 2 MiB und damit unter der vorhandenen 4-MiB-Gatewaygrenze. Der größte Originalblock umfasst 1.297.568 Bytes. Alle Antworten nutzen no-store, nosniff, no-referrer, X-Frame-Options: DENY und eine restriktive Same-Origin-CSP. Es erfolgt keine allgemeine Textänderung an Katalogblöcken. Nur die private HTML-Kopie erhält absolute Ressourcenpfade für /view, den zutreffenden Cloud-Hinweis und den öffentlichen Sitzungswächter für Kontowechsel.

## Prüfung und Integration

Die Cloud-Portierung ist mit synthetischen Ressourcen auf Besitzerbeweis, Sitzungsbesitz, unvollständige Version, unveränderliche Wiederholungen, falsche Hashes, Größenbegrenzung, Routing, CSP und bytegleiche Ausgabe geprüft. Die Datenbankmigration und der echte Besitzerimport sind getrennte Integrationsschritte. Erst danach ist der tatsächliche Katalogzugriff als bereitgestellt zu bezeichnen.

Am gemeinsamen Stand zusätzlich prüfen: Build und bestehende Tests; drei Projektkarten bei 320/390/768/1024/1440 px; Suche, Filter, Details, Rücknavigation und vollständige Exporte am tatsächlichen V9-Bestand; anonyme Abweisung von Ansicht und Datenblöcken. Tests mit einem simulierten Navigationsziel belegen nur die Projektverlinkung.

Für den Cloud-Katalog werden weder PC-Empfänger noch Cloudflare-Tunnel gestartet. GPS-/Health-Aufzeichnungen und Lernstände werden durch diese Ressourcenübernahme nicht verändert.
