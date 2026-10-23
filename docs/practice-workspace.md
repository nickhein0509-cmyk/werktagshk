# Rechenblatt und Prüfungsbereich · 23. Oktober 2026

Grundlage ist Flow 0.3.0 auf Commit `f406f05`, nicht die ältere Arbeitskopie mit
zwölf Modellaufgaben. Kontext stammt unter anderem aus den Codex-Chats
„Design und Effizienz verbessern“, „Neues Design ausarbeiten“ und der dort
beschriebenen Einbindung des bestehenden privaten Fragenbestands. Vorrang bleibt
die Vorbereitung auf Teil 2 am 7. Dezember 2026; der Spiel-Lernweg bleibt späterer
Ausbau.

## Tatsächlich geprüfte Gestaltungsvorlagen

Über SHK Lernwerkzeuge / Remote Desktop Commander wurden auf dem verbundenen
Rechner vorhandene Originalseiten-Renderings und Textauszüge gelesen. Keine
Prüfungsdateien, privaten Diagramme oder Lösungsschlüssel wurden ins Repository
kopiert. Bekanntheits- und Reservierungsregister wurde abgeglichen; nur bereits
bekannte Prüfungen wurden geöffnet.

| Quelle | Exakt betrachteter Ausschnitt | Gestalterische Beobachtung |
| --- | --- | --- |
| M13, Winter 2021/22 Arbeitsplanung, 19 PDF-Seiten | PDF 2 / Druckseite 1 und PDF 6 / Druckseite 5 | Fortlaufende Nummern, kleines Punktefeld rechts, große Zeichenfläche, Wertetabelle. |
| M14, Winter 2021/22 Systemanalyse und Instandhaltung, 11 PDF-Seiten | PDF 5 / Druckseite 5 | Kontext mit a–d und getrennten Antwortlinien; folgende Rechnung mit „Geg.“, „Ges.“, „Lösung“ und großzügigem Freiraum. |
| M20, Prüfung 4, 13 PDF-Seiten | PDF 6 / Druckseite 5 | Umrandete nummerierte Blöcke, mehrere Teilfragen, Erklärung und Rechnung im gemeinsamen Kundenkontext. |

Die neue Ansicht übernimmt Nummerierung, ruhige Umrandung und Schreibraum.
Die eigenen Auswahlaufgaben behalten ihr Format; es werden weder amtliche
Teilaufgaben/Punkte erfunden noch die Originalbögen vollständig nachgebildet.
Die direkte PDF-Lesefunktion meldete einen Parserfehler; geprüft wurden die
bereits vorhandenen Seitenbilder und Textauszüge. Document Control meldete keine
verbundenen Sitzungen und lieferte deshalb keine Prüfungsquelle.

## Bedienung und Gestaltung

- „Prüfungsmodus aus“: Üben mit geführtem Rechenblatt, Notizen, Hinweisen und
  aufklappbarem Taschenrechner. „An“: keine Lernhilfen, eigene Hardware, freier
  Rechenweg. Wechsel erhält Eingaben und Zeit. Jede Runde mit aktiviertem
  Lernmodus bleibt als Übungsrunde gekennzeichnet.
- Bis zu sechs unterschiedliche eigene Aufgaben werden nach Bereich und
  Aufgabenart zusammengestellt. Die Auswahl mischt vorhandene Aufgabenarten;
  weitere Runden verschieben die Auswahl. Keine amtliche Gesamtdauer oder
  Bestehensgrenze. Die Uhr misst verstrichene Zeit ab ausdrücklichem Start,
  einschließlich Navigation und Neuladen, bis zur Abgabe. Keine Pause.
- Antworten werden gesammelt abgegeben, unbeantwortete Aufgaben nicht als
  Versuche verbucht. Stabile IDs verhindern doppelte Versuche nach einer
  fehlgeschlagenen Rundensicherung. Freie Rechenwege werden nicht automatisch
  fachlich bewertet. Lösungen erscheinen nach der Rundenabgabe.
- Der aktive Aufgabenbereich erhält die helle Papierfläche. Listenzeilen,
  kleinere Metadaten und zurückgenommene Nebenaktionen ersetzen gleich stark
  betonte Karten. Das bestehende Petrol und die Kupferdetails bleiben erhalten.
- Der Katalog enthält jetzt 156 eigene Übungen: 112 Rechenaufgaben, 16
  Kontextaufgaben und 28 Wissensfragen. Zwölf neue Transferfälle und die
  unabhängig gerechneten Modelle stehen in `exam-transfer-review.md`.

## Speicherung und Grenzen

Die Modell-Rechenblätter sind pro Gast/Konto und Aufgabe separat browserlokal;
unbekannte oder neuere vorhandene Entwürfe werden nicht überschrieben. Die
Runde samt gemessener Zeit und Notizen liegt im aktuellen Tab (`sessionStorage`).
Das ist kein geräteübergreifendes Prüfungsarchiv. Nur abgegebene Antworten gehen
in den bestehenden Lernstand. Rechenentwürfe sind nicht Bestandteil seines
JSON-Exports oder der bestehenden Fortschrittssynchronisierung.

Im privaten Bestand bleiben zusätzliche Rechenblätter in der geöffneten Ansicht.
Sie werden nur bei gültiger serverseitiger Hilfenfreigabe gezeigt und nicht in
Antwort- oder Entwurfspayloads eingeschleust. Dort beschreibt der Verzeichnisfilter
das bekannte Antwortformat; Auswahlfragen werden nicht anhand von Titelwörtern
als Rechen- oder Wissensfragen erraten. Das neue Prüfungsblatt verwendet eigene
Übungen und bildet keine neue private Prüfungssitzung im Backend ab.

Eigene Antwortschlüssel werden wie bisher mit der Übungsapp ausgeliefert.
Der Schalter ist kein Schutz gegen Einsicht und keine amtliche Prüfung.

## Tatsächlich ausgeführte Prüfung

`npm run check` am 23. Oktober 2026 erfolgreich: TypeScript/Produktionsbuild,
113 Logiktests in zehn Dateien und 32 Chromium-Browserprüfungen. Enthalten sind
Moduswechsel, Freigabeentzug, Entwurfserhalt, Zeitmessung, gesammelte Abgabe,
Wiederherstellung ohne doppelte Versuche, Kontentrennung, bestehende Importe,
320-/390-Pixel-Ansichten und automatisierte WCAG-A/AA-Prüfungen. Alle Konten und
Antworten in den Tests sind isolierte Fixtures. Keine echten Lernereignisse wurden
angelegt. Desktop- und Handy-Screenshots zeigen ausschließlich eigene Übungen.
