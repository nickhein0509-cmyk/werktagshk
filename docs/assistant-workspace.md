# WerkTag Assistent auf Handy und Desktop

Produkt: **ASSISTENT**, Version 0.12.0. Einstieg: `/assistenz`.
Produktauftrag und Aufgaben: [werktag-assistent](https://github.com/nickhein0509-cmyk/werktag-assistent).
Der produktive Code bleibt entsprechend der [Produktkarte](product-map.md) in
diesem gemeinsamen Repository. Der Ausbau verschiebt keine Lern- oder Materialdaten.

## Benutzen

- **Übersicht:** eine Notiz oder Aufgabe schnell festhalten und letzte Einträge sehen.
- **Notizen und Aufgaben:** Titel und Text durchsuchen, offene/erledigte Aufgaben
  filtern, nach Fälligkeit ordnen, bearbeiten, bewusst löschen oder abhaken. Die
  Fokusübersicht zeigt heute fällige, überfällige und terminlose offene Aufgaben im
  vollständig geladenen Suchzeitraum. Bei einem Abruffehler zeigt sie keine falschen
  Nullstände. Fälligkeiten sind Datumsangaben;
  es werden dadurch keine Benachrichtigungen oder Termine außerhalb des Assistenten angelegt.
- **Mein Tag:** verknüpfte Karte und chronologische [Tageszeitachse](assistant-timeline.md),
  vorhandene Wege, Aufenthalte, Health-Werte und weitere manuelle
  Tagesangaben. Ein Kalender erlaubt auch Tage ohne GPS-Aufzeichnung.
- **Statistik:** bestehende Tages-/Wochen-/Monatsauswertungen; manuelle Notizen und
  Aufgaben bleiben von tatsächlichen Sensorwerten getrennt.

Die Suche umfasst wahlweise 7, 30 oder 90 Tage bis zu einem gewählten Enddatum.
Ältere Zeiträume lassen sich über dieses Datum öffnen. Die Aufgabenanzahl bezieht
sich auf den angezeigten Zeitraum. Fehlende Health- oder GPS-Werte sind keine Nullwerte.

## Zugang und Speicherung

Bestehende private Zugangslinks funktionieren weiter. Eine persönliche
Bearbeitungsfreigabe erlaubt Einträge; ein reiner Leselink erlaubt keine Änderungen.
Unter `/konto` wird die eigene Assistenz ausdrücklich einem verifizierten Konto
zugeordnet. Danach können Handy und Desktop dieselbe Kontoanmeldung verwenden.
Ein Verbindungs-/Besitzerlink kann geschützt eingegeben werden; reine Leselinks
werden für die Zuordnung abgewiesen. Ein neuer Link in einer bereits geöffneten
Assistenz startet die Zugangsprüfung erneut und entfernt den privaten Fragmentteil.

„Passwort vergessen“ und die bestätigte Passwortänderung nach dem Recovery-Link
gehören zum vorhandenen Supabase-Login. Die Oberfläche verschickt erst auf eine
ausdrückliche Nutzeraktion eine Wiederherstellungsanfrage; die automatische
Prüfung verwendet ausschließlich synthetische Mailadressen und Antworten.

Notizen und Aufgaben werden im vorhandenen geschützten Cloud-Kontext gespeichert.
Ein erfolgreicher GPS-Abruf ist dafür nicht erforderlich. Änderungen benötigen
dieselbe Schreibfreigabe, einen CSRF-Nachweis und die aktuelle Tagesrevision.
Konflikte behalten den Entwurf und verlangen einen bewussten Abgleich. Ein erneuter
Speicherversuch nach fehlender Antwort verwendet dieselbe Eintrags-ID.

Ungespeicherte Entwürfe bleiben nur im geöffneten Tab. Sie werden nicht in
`localStorage` geschrieben und gehen beim Schließen verloren. Sperren/Abmelden
leert private Ansichten und Entwürfe. Dies ist kein Offline-Archiv oder Offline-Sync.
Die Karte und ihre externen Kacheln starten erst beim ausdrücklichen Öffnen von „Mein Tag“.

## Datenvertrag und Rückweg

Die bestehende JSONB-Speicherung und Schemafassung 1 bleiben erhalten:

- `note`: erforderlicher `note`-Text bis 2.000 Zeichen, optionaler `title` bis
  120 Zeichen und optionales `at` innerhalb des gewählten Berliner Tages.
- `task`: erforderlicher `title`, `status` als `open` oder `done`, optionales
  `dueDate` sowie optionale eigene Notiz. Fälligkeit ist kein Ausführungsnachweis.
- `GET /assistenz/context-range?from=YYYY-MM-DD&to=YYYY-MM-DD`: höchstens 90 Tage,
  2.000 Einträge und 3 MiB, mit geschützter Sitzung. Liefert ausschließlich
  Notizen/Aufgaben samt Tagesrevisionen und keine GPS-/Health-Payloads.
- Bestehendes `GET/POST /assistenz/context` bleibt für manuelle Tagesdaten zuständig.
  Ein optional nicht lesbarer GPS-Bezug wird als ungeprüft markiert und macht
  einen bereits erfolgreich gespeicherten Eintrag nicht nachträglich zum Fehler.

Es ist keine neue SQL-Migration erforderlich. Die aktualisierte Edge-Funktion
`assistance` muss vor der neuen Oberfläche bereitstehen. Nach ersten echten
Notizen/Aufgaben darf ein Rückweg deren Validierung nicht entfernen: alte
Backendfassungen kennen die neuen Arten noch nicht. Eine Vorwärtskorrektur oder
eine Oberfläche auf dem kompatiblen Backend erhält die Daten.

## Prüfung

`npm run check` führt Build, App-/Gateway-/Cloud-/Workflow- und Chromiumprüfungen
aus. `playwright.assistant-webkit.config.ts` prüft die Assistenten- und Kontoabläufe
zusätzlich mit mobiler WebKit-Engine. Das ist eine Browserengine-Prüfung und kein
Nachweis an einem physischen iPhone.

Neue Browsertests nutzen die wirkliche Oberfläche mit isolierten synthetischen
Datendiensten: Notiz-/Aufgaben-CRUD, Wiederladen, Suche/Zeitraum, fehlendes GPS,
Konflikte, unbestätigtes Speichern, Sperren und 320/390/1440-Pixel-Ansichten.
Die einzigen hochgeladenen Prüfbilder sind ausdrücklich synthetische Ansichten
unter `test-results/assistant-ui/`. Keine echten persönlichen Inhalte in CI.

Health-Aktivierung und Kontozuordnung bleiben getrennte, tatsächlich zu prüfende
Einrichtungsschritte. Der Ausbau aktiviert keine neue externe KI und keine
zusätzliche Standorterfassung. Offizielle Auth-Verträge:
[Recovery](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail),
[Passwort ändern](https://supabase.com/docs/reference/javascript/auth-updateuser).
