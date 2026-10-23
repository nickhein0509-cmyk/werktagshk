# WiSo: Prüfung der acht eigenen Aufgaben mit Teil2-Bezug

Stand: 23. Oktober 2026. Geprüfter Umfang: die acht Aufgaben in
`src/content/exam-wiso.ts`, jeweils Inhaltsversion 1 und Ursprung `original`.
Die Aufgaben wurden in dieser Sitzung selbst formuliert. Es wurden keine
Originalprüfungen, privaten Unterrichtsunterlagen, Herstellerunterlagen oder
rechtlichen Primärquellen verwendet.

**Verwendungszweck:** selbstständiges Üben wirtschaftlicher Berechnungen und
des begründeten Lesens ausdrücklich vorgegebener Modellregeln. Die Auswahl
unterstützt die gewünschte Vorbereitung auf Teil 2. Sie ist weder ein offizieller
Aufgabenkatalog noch eine Vorhersage von Prüfungsinhalten, Gewichtungen oder
Bestehenswahrscheinlichkeit. Acht Aufgaben decken WiSo nicht vollständig ab.

## Herkunft, Version und Prüfstatus

Alle Aufgaben verwenden das sichtbare Herkunftslabel
**Eigene Übungsaufgabe · WiSo · Teil2-Bezug**. Ihre stabilen IDs beginnen mit
`exam-wiso-`. Die bestehende Schnittstelle `Exercise` besitzt derzeit keine
gesonderten Felder für Inhaltsversion oder redaktionellen Status; dieses
Dokument hält die entsprechenden Angaben pro Aufgabe fest.

Der Prüfstatus `reviewed_for_stated_use` bezeichnet hier ausschließlich die
dokumentierte rechnerische und logische Eigenprüfung für das beschriebene
Modellüben. Er bedeutet keine externe Fachfreigabe, keine Rechtsprüfung und keine
Anerkennung durch eine Prüfungsstelle. Quelle sind jeweils die in der Aufgabe
vollständig angegebenen eigenen Annahmen; externe Ausgabe, Seite und Rechtsstand
sind nicht vorhanden beziehungsweise nicht anwendbar.

| Stabile ID                       | Lernziel und genaue Modellgrenzen                                                                                                                                                                                                                                              | Ergebnis und Antwortposition                                                                                                                                                        | Status dieser Version                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `exam-wiso-auftragsvergleich`    | Zwei alternative Aufträge mit identischen vier Arbeitsstunden und unveränderten Fixkosten vergleichen. A: Nettoerlös 620 €, variable Kosten 410 €; B: 730 € und 480 €. Keine anderen Unterschiede.                                                                             | A: 210 € DB; B: 250 € DB; B bietet 40 € mehr. Option C, Index 2. Kein absoluter Gewinn berechenbar.                                                                                 | `original`, Version 1, `reviewed_for_stated_use` für das explizite Modell                 |
| `exam-wiso-zuschlag-marge`       | Prozentbasis unterscheiden. Sämtliche Modellkosten 240 €, Nettoerlös 300 €, keine weiteren Abzüge. Kostenaufschlag und Umsatzmarge werden im Aufgabentext ausdrücklich definiert.                                                                                              | Überschuss 60 €; 60/240 = 25 % Kostenaufschlag; 60/300 = 20 % Umsatzmarge. Option B, Index 1.                                                                                       | `original`, Version 1, `reviewed_for_stated_use` für das explizite Modell                 |
| `exam-wiso-lieferantenvergleich` | Vergleichbare Gesamtkosten ermitteln. A: 1.500 € Warenwert mit 3 % Skonto, zusätzlich 12 € nicht skontierbarer Versand. B: 1.460 € einschließlich Versand. Gleichwertige Ware, Qualität und Lieferzeit; fristgerechte Zahlung möglich; keine Steuern oder Finanzierungskosten. | A: 1.500 × 0,97 + 12 = 1.467 €; B: 1.460 €; B ist 7 € günstiger. Option D, Index 3.                                                                                                 | `original`, Version 1, `reviewed_for_stated_use` für das explizite Modell                 |
| `exam-wiso-lohnmodell`           | Eine frei erfundene Abrechnung nach gegebenen Regeln nachvollziehen. 160 h zu 18 €/h plus 90 € Zulage bilden die Basis; davon 24 % und 15 € abziehen. Keine reale Steuer-, Sozialversicherungs- oder Tarifberechnung.                                                          | Modellbrutto 2.970 €; Prozentabzug 712,80 €; Auszahlung 2.242,20 €. Option A, Index 0.                                                                                              | `original`, Version 1, `reviewed_for_stated_use` ausschließlich als fiktives Abzugsmodell |
| `exam-wiso-liquiditaetsverlauf`  | Zeitliche Verfügbarkeit von Geld beachten. Donnerstag 900 € verfügbar und 1.700 € fällig; Freitag sicher angenommener Eingang 1.400 €. Keine weiteren Zahlungen, keine Verschiebung und kein bestehender Kredit.                                                               | Donnerstag fehlen 800 €. Zweitagessaldo vor etwaigen Finanzierungsvorgängen: +600 €, der den früheren Engpass nicht aufhebt. Option D, Index 3.                                     | `original`, Version 1, `reviewed_for_stated_use` für das explizite Zahlungsmodell         |
| `exam-wiso-nachkalkulation`      | Deckungsbeitragsabweichung begründen. Geplant: Nettoerlös 1.000 €, variable Kosten 600 €. Tatsächlich: 1.100 € und 780 €. Fixkosten unverändert, keine anderen Abweichungen.                                                                                                   | DB geplant 400 €, tatsächlich 320 €, Veränderung −80 €. Alternativ: +100 € Erlös −180 € Kosten = −80 €. Option A, Index 0.                                                          | `original`, Version 1, `reviewed_for_stated_use` für das explizite Modell                 |
| `exam-wiso-aenderungsauftrag`    | Umfang, Zuständigkeit und Reihenfolge einer vollständig angegebenen fiktiven Projektregel auf einen Zusatzwunsch anwenden. Keine Ausführung vor schriftlicher Freigabe des beschriebenen Änderungsblatts durch die benannte Projektleitung.                                    | Zusatzleistung mit Preis und Terminfolgen erfassen und vor Ausführung Freigabe einholen. Option B, Index 1. Kein allgemeiner rechtlicher Anspruch wird daraus abgeleitet.           | `original`, Version 1, `reviewed_for_stated_use` als Lese- und Prozessaufgabe             |
| `exam-wiso-angebotsabgleich`     | Abweichung zwischen Angebot und schriftlicher Kundenrückmeldung erkennen. Die interne Modellregel fordert unveränderte Bestätigung von Nummer, Umfang, Preis und Termin; Abweichungen verlangen Klärung und angepasstes Angebot.                                               | Modell B verändert den Leistungsumfang. Technisch/kalkulatorisch prüfen, Angebot anpassen, Bestätigung einholen. Option C, Index 2. Kein rechtlicher Vertragsschluss wird bewertet. | `original`, Version 1, `reviewed_for_stated_use` als Lese- und Prozessaufgabe             |

## Tatsächlich durchgeführte unabhängige Rechenprüfung

Die sechs Rechenmodelle wurden am 23. Oktober 2026 separat mit Python 3 und
`decimal.Decimal` neu berechnet. Dabei wurden die Eingaben direkt aus den
formulierten Modellannahmen eingesetzt. Es wurde weder der TypeScript-Code
ausgeführt noch ein Antwortschlüssel aus dem Aufgabenarray übernommen.

Die ausgeführten Berechnungen entsprechen folgendem reproduzierbaren Protokoll:

```python
from decimal import Decimal as D

a = D('620') - D('410')
b = D('730') - D('480')
print(a, b, b - a)
# 210 250 40

print((D('300') - D('240')) / D('240') * 100,
      (D('300') - D('240')) / D('300') * 100)
# 25.00 20.0

lieferant_a = D('1500') * (1 - D('0.03')) + D('12')
lieferant_b = D('1460')
print(lieferant_a, lieferant_b, lieferant_a - lieferant_b)
# 1467.00 1460 7.00

brutto = D('160') * D('18') + D('90')
print(brutto, brutto * D('0.24'), brutto - brutto * D('0.24') - D('15'))
# 2970 712.80 2242.20

print(D('900') - D('1700'), D('900') - D('1700') + D('1400'))
# -800 600

geplant = D('1000') - D('600')
tatsaechlich = D('1100') - D('780')
print(geplant, tatsaechlich, tatsaechlich - geplant)
# 400 320 -80
```

Diese exakten Modelle benötigen keine Rundung von Zwischenwerten. Geldwerte
werden in den Aufgaben mit deutschem Dezimalkomma und gegebenenfalls zwei
Nachkommastellen dargestellt. Es werden keine gesetzlichen Abzugssätze behauptet.
Bei den Auftragsvergleichen und der Nachkalkulation bleiben die Fixkosten
bewusst unverändert beziehungsweise unbeziffert; ein Deckungsbeitrag wird nicht
mit dem absoluten Gewinn gleichgesetzt.

## Logische Prüfung der beiden Vertragsmodelle

Bei `exam-wiso-aenderungsauftrag` wurde die Aufgabenregel in fünf Prüfpunkte
zerlegt: Umfang beschrieben, Preis beschrieben, Terminfolgen beschrieben,
zuständige Projektleitung, schriftliche Freigabe vor Ausführung. Nur Option B
erfüllt alle Punkte. Option A verschiebt die Dokumentation hinter die Ausführung,
C ersetzt die benannte Freigabestelle und D beschränkt sich auf das Material.

Bei `exam-wiso-angebotsabgleich` wurden Angebotsnummer, Leistungsumfang, Preis
und Termin mit der Kundenrückmeldung abgeglichen. Der Umfang weicht durch ein
anderes Armaturenmodell ab. Nur Option C bearbeitet diese Abweichung vor der
internen Auftragsfreigabe. Die anderen Optionen überspringen die Klärung oder
ändern ausschließlich die Nummer. Die Aussage ist logisch aus der fiktiven
Planungsregel abgeleitet; sie benötigt und ersetzt keine Behauptung zum BGB.

## Didaktische und technische Grenzen

Jede Aufgabe enthält vier Auswahloptionen und genau eine hinterlegte richtige
Option. Die Antwortpositionen A, B, C und D kommen jeweils zweimal vor. Titel und
Hinweise nennen kein Ergebnis; Erklärungen und Schlüssel sind eigene Felder.
Die Hinweise helfen beim Vorgehen und werden im vorhandenen Übungsablauf erst
auf ausdrücklichen Wunsch sichtbar. Drei bis vier Minuten je Aufgabe sind
redaktionelle Zeitvorschläge, insgesamt 28 Minuten, keine amtlichen Zeitbudgets.

Die Distraktoren bilden unterschiedliche Fehler ab: Erlös statt Deckungsbeitrag,
vertauschte Prozentbasis, ausgelassene Versandkosten, ausgelassener fixer Abzug,
falsche Abzugsbasis, fehlende zeitliche Betrachtung und unvollständig angewandte
Modellregeln. Sie wurden mit der jeweiligen eindeutigen Fragestellung auf
Mehrdeutigkeit verglichen. Ein geschlossener Antwortschlüssel bewertet keine
freie Begründung und vergibt keine Teilpunkte. Erfolgreiche Auswahl allein
belegt keine Prüfungsreife.

Die neue Datei exportiert lediglich `wisoExercises: Exercise[]`. Ihre Einbindung
in den Gesamtbestand, der Browserablauf sowie Build und Tests müssen im
Integrationsschritt geprüft werden; sie wurden in diesem Autorenschritt nicht
ausgeführt. Es wurden keine Lernereignisse erzeugt und keine vorhandenen
Aufgaben, Antwortschlüssel, privaten Inhalte oder Lerndaten geändert. Spätere
fachliche Änderungen benötigen eine bewusste Versionsentscheidung, damit alte
Antworten nicht stillschweigend eine andere Bedeutung erhalten.
