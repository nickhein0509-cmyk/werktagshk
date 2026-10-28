# AI Assistance auf WerkTag

Stand: Entwicklung vom 28.10.2026, Basis Webapp 0.8.1. Der SHK Lernbuddy bleibt auf `/`. `/projekte` bietet drei Einstiege: Lernen, AI Assistance und Komponentenliste. Die bestehende private GPS-/Health-/Statistikoberfläche wird unter `/assistenz` durch einen eng begrenzten Server-Proxy erreichbar. Die Komponentenliste verwendet `/assistenz/components` und dieselbe private Sitzung. Es gibt keine Zusammenführung von Lernständen, Konten oder Gesundheitsdaten. Bereitstellung und Prüfung des privaten Katalogdienstes: [Komponentenliste](components.md).

## Änderung in 0.8.1

Die vorhandene Verbindungshilfe erklärt den erhaltenden URL-Wechsel, die getrennte HTTP-/Intent-Authentifizierung und die Wiederverwendung der bestehenden Kurzbefehle. Unter `/owntracks/WerkTag-OwnTracks.otrc` liegt eine öffentliche Teilkonfiguration mit ausschließlich `_type` und der festen Zieladresse. Sie enthält keine Zugangsdaten oder Geräteinformationen. Die Website und ihre Versionskennung werden aktualisiert; ein iPhone-App-Update oder die Installation eines Kurzbefehls erfolgt dadurch nicht. Eine Korrektur im privaten PC-Launcher wird nicht durch diesen Webapp-Release verteilt.

Vor einem Verbindungswechsel OwnTracks mindestens auf 27.0.1 aktualisieren; die am 28.10.2026 geprüfte aktuelle Version ist 27.1.2. Seit 27.0.1 bleiben Warteschlange und Wegpunkte beim Wechsel erhalten. Für den Dateiimport muss externe Konfiguration unter Remote Control am Gerät vorübergehend freigegeben werden. Der vorhandene Intent Auth Key und die Intent-Steuerung werden am Gerät verwaltet; die Teilkonfiguration kann sie nicht setzen. Im Importvergleich nur die URL-Änderung bestätigen. Bereits passende Einstellungen bleiben erhalten.

Primärquellen: [OwnTracks-Versionshinweise](https://github.com/owntracks/ios/blob/master/CHANGELOG.md), [Sicherheit](https://owntracks.org/booklet/features/security/), [Teilkonfiguration](https://owntracks.org/booklet/features/remoteconfig/), [JSON-Vertrag](https://owntracks.org/booklet/tech/json/).

## Betrieb

Vercel-Projekt: `werktag-app`, Domain `werk-tag.com`. Servervariablen:

- `ASSISTANCE_PUBLIC_ORIGIN`: `https://werk-tag.com`
- `ASSISTANCE_UPSTREAM_ORIGIN`: aktueller HTTPS-Ursprung des bereits laufenden privaten PC-Empfängers, ohne Pfad oder Zugangsdaten.

Neue feste OwnTracks-Zieladresse: `https://werk-tag.com/api/assistenz/owntracks`. Der vorhandene HTTP-Benutzer und das HTTP-Passwort bleiben erforderlich. Der Intent Auth Key ist kein HTTP-Passwort. Das iPhone muss die neue URL einmal übernehmen.

Datenspeicherung, Archivierung, Health-Import und eigener Kontext bleiben beim vorhandenen Empfänger. Daher müssen PC, Empfänger und Tunnel laufen. Ein veränderter temporärer Tunnel benötigt die Aktualisierung der Servervariable und eine neue Bereitstellung; die iPhone-Adresse bleibt gleich. Diese Integration ist kein unabhängiger Cloud-Datenbetrieb.

## Geschützter Zugang

Der persönliche Kartenlink wird als Fragment `/assistenz#key=…&owner=…` am eigenen Gerät geöffnet. Die Kartenanwendung tauscht diese Werte gegen getrennte HttpOnly-/Secure-/SameSite-Cookies und entfernt den Fragmentteil. Die Schlüssel werden nicht im Repository oder in öffentlichen Assets gespeichert. Ohne gültige Kartensitzung liefert der Empfänger keine privaten API-Daten. Ein beliebiges SHK-Lernkonto erhält dadurch keinen Assistenzzugriff.

Der Proxy erlaubt ausschließlich die vorhandenen Karten-Assets und API-Pfade sowie den schreibenden OwnTracks-Endpunkt. `/status`, `/export`, `/setup`, unbekannte Pfade und Methoden werden nicht weitergeleitet. Nur die zwei Kartencookies werden zum PC übertragen. Schreibende Browser-Anfragen benötigen exakt den konfigurierten WerkTag-Origin; die vorhandene Owner-/CSRF-Prüfung bleibt beim Empfänger. HTTP-Standortmeldungen benötigen Basic-Authentifizierung und keine Browser-Cookies.

HTML-/JS-/CSS-Pfade der Assistenz und Cookie-Paths werden von `/map` auf `/assistenz` umgesetzt. Die Komponentenliste und ihre komprimierten Datenblöcke werden ohne Textänderung weitergeleitet. JSON, GPX, Messwerte und Kontextinhalte bleiben unverändert. Es gibt keinen iframe und keine Abschwächung der vorhandenen Frame-Sperre. Fehlerseiten nennen die PC-Abhängigkeit ohne Daten preiszugeben.

## Prüfung

`npm run check` enthält App-Build, bestehende Tests, gezielte Proxy-Schutztests und Chromium-Interaktionstests. Live-Prüfungen erfolgen zusätzlich ohne Login und über eine echte geschützte Kartenanmeldung. Es werden keine künstlichen Standortpunkte an die produktive Ablage gesendet.

### Veröffentlichungsprüfung

Am 27.10.2026: Build, 250 App-Tests, acht gezielte Gatewaytests und 62 Chromium-Interaktionstests bestanden. Vercel-Produktion wurde bereitgestellt. Live: Projektauswahl und Assistenz-HTML 200; ohne Kartensitzung private Daten 401; fremder Browser-Origin 403; ohne Basic-Anmeldung Standortempfang 401. Kartenanmeldung, geschützter Datenabruf und getrennte Owner-Sitzung erfolgreich geprüft. Es wurden keine künstlichen Standortpunkte geschrieben. Die iPhone-Übernahme der festen URL ist ein eigener Geräteschritt.
