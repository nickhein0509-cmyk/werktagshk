# Originale Transferfälle und Aufgabentypen · Inhaltsversion 1

Prüfdatum: 23. Oktober 2026. Umfang: exakt die zwölf eigenen Aufgaben in
`src/content/exam-transfer.ts` und die Typzuordnung der 144 bereits vorhandenen
Modellaufgaben. Die bisherigen Kennungen, Antwortoptionen und Schlüssel wurden
nicht verändert. Alle neuen Aufgaben sind ausdrücklich eigene Übungsaufgaben;
es wurden dafür keine Originalprüfungen, privaten Bücher oder Lösungsschlüssel
gelesen. Ausgabe und Musterlösungen liegen wie bisher im Client einer Übungsapp.

## Was ein Aufgabentyp bezeichnet

`calculation` / Rechenaufgabe: Eine Zahl, geometrische Aufteilung, Einheitenrechnung
oder quantitative Gegenüberstellung ist für die Antwort erforderlich.
`context` / Kontextaufgabe: Ein konkreter Fall verlangt Auswertung, begründete
Entscheidung oder Anwendung vorgegebener Projektregeln. Zahlen allein machen
einen Fall noch nicht zur Rechenaufgabe. `knowledge` / Wissensfrage: Ein Begriff,
eine Einheit oder ein Zusammenhang wird abgefragt, ohne eine konkrete
Zahlenrechnung zu verlangen. Der Typ bezeichnet die Lernanforderung, nicht das
Eingabeformat: Eine Rechenaufgabe kann auch Auswahlantworten haben.

Die bestehenden Aufgaben werden ausdrücklich anhand stabiler IDs zugeordnet;
die Oberfläche errät den Typ weder aus Schlagwörtern noch aus dem Vorhandensein
einer Formel. Neue Aufgaben haben ein eigenes `kind`-Feld. Ein Katalogtest verlangt
eine explizite Zuordnung für jede vorhandene Aufgabe. Die Zuordnung ändert weder
Lernereignisse noch bisherige Bewertungen.

## Geprüfte Modelle und Bewertungsbasis

Status der folgenden zwölf Aufgaben: `reviewed_for_stated_use`, Version 1,
für selbstständiges Üben mit Auswahlantworten unter genau den im Prompt
angegebenen Modellannahmen. Die Prüfung umfasst ausreichende Angaben,
unabhängige Herleitung, Einheiten, Rundung, Plausibilität und eindeutige
Antwortoptionen. Sie ist keine Normen-, Hersteller- oder Prüfungsausschussfreigabe.

| Stabile ID | Lernziel und Annahmen | Unabhängiges Ergebnis / akzeptierte Begründung |
| --- | --- | --- |
| `exam-ap-speicher-mit-entnahme-v1` | Wärmebilanz bei konstanter gleichzeitiger Abgabe; 180 kg, 20 K, c = 4,18; kein Wasserwechsel, keine sonstigen Verluste. | 15 048 kJ = 4,18 kWh; netto 4,5 kW; 55,733… min, auf ganze Minuten 56 min. |
| `exam-ap-zuschnitt-schnittfuge-v1` | Gesamtlänge von tatsächlich möglichem Zuschnitt unterscheiden; zwei Stücke 3 400 mm, zwei 2 600 mm, je Stück 4 mm Fuge, 6 000-mm-Stangen. | Zwei Stangen sind unmöglich; drei genügen. Paar 3 400 + 2 600 + 8 = 6 008 mm; zwei kleine Stücke brauchen 5 208 mm. |
| `exam-ap-planfreigabe-v1` | Datumsstand und dokumentierten Freigabestatus trennen; ausdrücklich vorgegebene Projektregel. | Widerspruch vor dem betroffenen Arbeitsschritt dokumentieren und freigegebene Vorgabe einholen. Keine Auslegung von Vertragsrecht. |
| `exam-ap-druckdifferenz-begriff-v1` | Druckdifferenz und gemeinsame Bezugsgröße verstehen. | Austrittsdruck minus Eintrittsdruck, gemeinsame Einheit. Keine Pumpenauslegung oder Aussage zur realen Förderleistung. |
| `exam-si-energieprotokoll-v1` | Zähleränderung und Zeitdauer statt momentaner Anzeige auswerten. | 6,30 kWh / 0,75 h = 8,40 kW im Zeitmittel; 80 % von 10,50 kW. Kein Defektnachweis. |
| `exam-si-widerstand-normieren-v1` | Druckverlustvergleich auf veränderten Volumenstrom normieren; ausdrücklich quadratisches Modell. | 100/200² = 25/100² = 0,0025 Pa·h²/m⁶; R bleibt gleich. Kein Austauschgrenzwert. |
| `exam-si-zweipunkt-vergleich-v1` | Reichweite eines Befunds begrenzen. | Je +2,0 K an den beiden geprüften Punkten; weder gesamter Bereich noch einzelnes defektes Bauteil nachgewiesen. Keine Toleranz behauptet. |
| `exam-si-zaehler-messgroesse-v1` | Energie und Leistung anhand ihrer Einheiten unterscheiden. | Wh ist Energie, W Energie pro Zeit; 1 W = 1 J/s und 1 Wh = 3 600 J. |
| `exam-wiso-engpassstunde-v1` | Deckungsbeitrag auf knappe Zeit beziehen und ganze Aufträge beachten. | A: 60 €/h, B: 75 €/h; drei B nutzen 6 h für 450 €. Vollständige Enumeration aller zulässigen Mischungen bestätigt das Maximum. Kein Gesamtgewinn. |
| `exam-wiso-restzahlung-v1` | Zahlungsteil und vereinbarten Gesamtpreis trennen; keine Steuern. | 540 € bereits bezahlt, 1 260 € offen; zusammen 1 800 €. Kein Rechnungsrecht. |
| `exam-wiso-opportunitaet-begriff-v1` | Ausdrücklich gegebene Definition auf eine ausschließende Wahl anwenden. | Entgangener Nutzen der besten nicht gewählten Alternative B. Unveränderte nicht rückholbare Ausgaben sind davon verschieden. |
| `exam-wiso-gewichtete-auswahl-v1` | Vorgegebene Bewertungspunkte richtig gewichten; alle Muss-Kriterien erfüllt. | A: 90·0,6 + 40·0,4 = 70, B: 60·0,6 + 90·0,4 = 72. B gewinnt im ausdrücklich definierten Modell um 2 Punkte. |

Die rechnerischen Aufgaben wurden zusätzlich mit Python `decimal.Decimal`
geprüft. Zuschnitt und Engpassbelegung wurden über sämtliche möglichen
Zuordnungen unabhängig enumeriert. Tatsächlich ausgeführte Ergebnisse stehen
in `exam-transfer-calculations.json`; die Datei ist ein redaktioneller Nachweis,
kein Lernprotokoll. Es wurden keine Versuche oder gemessenen Nutzerzeiten angelegt.

Für Auswahlantworten gilt je Aufgabe: Die hinterlegte richtige Option muss die
in der Tabelle aufgeführten Kernaussagen erfüllen. Falsche Begründungen dürfen
nicht trotz passender Zahl als fachlich vollständig gelten. Freie alternative
Rechenwege mit gleicher Bilanz und passenden Einheiten sind fachlich gleichwertig;
die aktuelle Auswahlbewertung prüft jedoch keinen frei eingegebenen Rechenweg.
Eine manuelle Übungsrückmeldung kann Ansatz, Einheiten, Ausführung und Bewertung
getrennt besprechen. Daraus werden keine amtlichen Teilpunkte oder automatischen
Teilbewertungen erfunden. Folgefehler wären beim freien Coaching am ursprünglichen
Ansatz zu behandeln, nicht als mehrere unabhängige Wissensfehler.

Die Zeitvorschläge von zwei bis fünf Minuten je Aufgabe sind redaktionelle
Vorschläge ohne empirische oder amtliche Grundlage. Es gibt keine Aussage zur
Vertrautheit dieser neuen Denkaufgaben bei Nick und keine Behauptung, damit sei
ein Originalprüfungsbogen nachgebildet oder ein reserviertes Blatt freigegeben.
