# AI Assistance auf WerkTag

Stand: 27.10.2026. Der SHK Lernbuddy bleibt auf `/`. `/projekte` bietet zwei getrennte Einstiege. Die bestehende private GPS-/Health-/Statistikoberfläche wird unter `/assistenz` durch einen eng begrenzten Server-Proxy erreichbar. Es gibt keine Zusammenführung von Lernständen, Konten oder Gesundheitsdaten.

## Betrieb

Vercel-Projekt: `werktag-app`, Domain `werk-tag.com`. Servervariablen:

- `ASSISTANCE_PUBLIC_ORIGIN`: `https://werk-tag.com`
- `ASSISTANCE_UPSTREAM_ORIGIN`: aktueller HTTPS-Ursprung des bereits laufenden privaten PC-Empfängers, ohne Pfad oder Zugangsdaten.

Neue feste OwnTracks-Zieladresse: `https://werk-tag.com/api/assistenz/owntracks`. Der vorhandene HTTP-Benutzer und das HTTP-Passwort bleiben erforderlich. Der Intent Auth Key ist kein HTTP-Passwort. Das iPhone muss die neue URL einmal übernehmen.

Datenspeicherung, Archivierung, Health-Import und eigener Kontext bleiben beim vorhandenen Empfänger. Daher müssen PC, Empfänger und Tunnel laufen. Ein veränderter temporärer Tunnel benötigt die Aktualisierung der Servervariable und eine neue Bereitstellung; die iPhone-Adresse bleibt gleich. Diese Integration ist kein unabhängiger Cloud-Datenbetrieb.

## Geschützter Zugang

Der persönliche Kartenlink wird als Fragment `/assistenz#key=…&owner=…` am eigenen Gerät geöffnet. Die Kartenanwendung tauscht diese Werte gegen getrennte HttpOnly-/Secure-/SameSite-Cookies und entfernt den Fragmentteil. Die Schlüssel werden nicht im Repository oder in öffentlichen Assets gespeichert. Ohne gültige Kartensitzung liefert der Empfänger keine privaten API-Daten. Ein beliebiges SHK-Lernkonto erhält dadurch keinen Assistenzzugriff.

Der Proxy erlaubt ausschließlich die vorhandenen Karten-Assets und API-Pfade sowie den schreibenden OwnTracks-Endpunkt. `/status`, `/export`, `/setup`, unbekannte Pfade und Methoden werden nicht weitergeleitet. Nur die zwei Kartencookies werden zum PC übertragen. Schreibende Browser-Anfragen benötigen exakt den konfigurierten WerkTag-Origin; die vorhandene Owner-/CSRF-Prüfung bleibt beim Empfänger. HTTP-Standortmeldungen benötigen Basic-Authentifizierung und keine Browser-Cookies.

HTML-/JS-/CSS-Pfade und Cookie-Paths werden von `/map` auf `/assistenz` umgesetzt. JSON, GPX, Messwerte und Kontextinhalte bleiben unverändert. Es gibt keinen iframe und keine Abschwächung der vorhandenen Frame-Sperre. Fehlerseiten nennen die PC-Abhängigkeit ohne Daten preiszugeben.

## Prüfung

`npm run check` enthält App-Build, bestehende Tests, gezielte Proxy-Schutztests und Chromium-Interaktionstests. Live-Prüfungen erfolgen zusätzlich ohne Login und über eine echte geschützte Kartenanmeldung. Es werden keine künstlichen Standortpunkte an die produktive Ablage gesendet.
