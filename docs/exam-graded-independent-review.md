# Unabhängige Gegenprüfung der 24 gestuften Übungen

Prüfdatum: 23. Oktober 2026. Gegenstand: exakt die 24 eigenen Aufgaben der
Inhaltsversion 1 in `src/content/exam-graded.ts`, nach den unten genannten
Klarstellungen. Diese redaktionelle Datei enthält Lösungsaussagen und ist kein
Lernenden-Arbeitsblatt.

Status: `reviewed_for_stated_use` für selbstständiges Üben mit Auswahlantworten
unter den ausdrücklich genannten Modellbedingungen. Geprüft wurden logische
Lösbarkeit, eindeutige Auswahl, Angaben und Einheiten, Rechenwege, Reichweite der
Erklärungen und die begründete Zuordnung der vier Aufgaben auf Stufe 4. Diese
Gegenprüfung bestätigt weder amtliche Schwierigkeit noch empirische Lösungsquoten,
Prüfungsreife oder vollständige Prüfungsabdeckung. Sie ist keine Normen-,
Hersteller- oder Rechtsfreigabe.

## Einzelentscheidungen

Die Buchstaben beziehen sich auf die Reihenfolge der vier Optionen der geprüften
Version. Für jede Aufgabe wurde geprüft, ob die Alternativen unter den gegebenen
Annahmen ebenfalls zutreffen könnten; es blieb jeweils genau die genannte Option.

| Aufgaben-ID                                   | Unabhängige Kernaussage                                                                                                                               | Option |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `exam-ap-graded-stueckliste-v1`               | Stückliste verknüpft Position, Teilebezeichnung und Menge; keine konkrete Materialermittlung behauptet.                                               | C      |
| `exam-ap-graded-druckkraft-v1`                | 300 000 Pa auf π·0,020²/4 m² ergeben ungefähr 94,25 N.                                                                                                | B      |
| `exam-ap-graded-laengenaenderung-v1`          | 12 m · 0,012 mm/(m·K) · 35 K ergeben 5,04 mm.                                                                                                         | A      |
| `exam-ap-graded-personalablauf-v1`            | Parallelität B/C ist zulässig; D wartet auf beide und belegt beide Personen. Frühester Abschluss 14 Uhr.                                              | A      |
| `exam-ap-graded-messgeraetwahl-v1`            | Nur B erfasst 300 kPa und bleibt zugleich innerhalb der ausdrücklich erlaubten ±5 kPa.                                                                | D      |
| `exam-ap-graded-oder-prueffall-v1`            | A falsch, B falsch, C wahr trennt die zwei Klammerungen. Die anderen angebotenen Zustände tun das nicht.                                              | C      |
| `exam-ap-graded-schnittstellentyp-v1`         | Potentialfreier Kontakt und 0–10-V-Signal sind laut Projektbeschreibung nicht unmittelbar passend; dokumentierte Anpassung oder andere Auswahl fehlt. | B      |
| `exam-ap-graded-volumenmessplan-v1`           | Ohne Entnahme oder Überlauf ist die zugeflossene Menge die Bestandsdifferenz an den beiden Zeitgrenzen.                                               | D      |
| `exam-si-graded-betriebspunkt-v1`             | Im stationären Modell stimmen verfügbare und benötigte Druckdifferenz am Schnittpunkt bei demselben Volumenstrom überein.                             | B      |
| `exam-si-graded-hydraulische-leistung-v1`     | 50 000 Pa · 0,0002 m³/s ergeben 10 W hydraulisch, keine bestimmte elektrische Aufnahmeleistung.                                                       | C      |
| `exam-si-graded-massenstromverhaeltnis-v1`    | Das ausdrücklich massebezogene Verhältnis 2:1 ergibt 45 °C bei gleicher Wärmekapazität.                                                               | D      |
| `exam-si-graded-pruefplanung-hypothesen-v1`   | Erst Antriebsrückmeldung und unabhängige Durchflussreferenz gemeinsam erzeugen drei verschiedene Ergebnismuster.                                      | B      |
| `exam-si-graded-hysterese-mindestzeit-v1`     | Bei ausschließlich den genannten Auswertungszeitpunkten folgen in Minute 5/10/12 die Zustände an/aus/an.                                              | C      |
| `exam-si-graded-messintervalle-v1`            | Aus den überlappenden sicheren Bereichen folgt weder feste Reihenfolge noch Gleichheit der tatsächlichen Werte.                                       | D      |
| `exam-si-graded-abtastung-v1`                 | Drei Sekunden Auffälligkeit können vollständig zwischen zwei 30-Sekunden-Momentanaufnahmen liegen.                                                    | A      |
| `exam-si-graded-sollwertbegrenzung-v1`        | min(60, 45) = 45 °C ist der wirksame Sollwert; der Messwert stimmt damit überein.                                                                     | B      |
| `exam-wiso-graded-produktivitaet-v1`          | Die vorgegebene Mengenproduktivität setzt fertige Einheiten zu eingesetzten Arbeitsstunden ins Verhältnis.                                            | C      |
| `exam-wiso-graded-dbquote-v1`                 | Der ausdrücklich positive Nettoerlös ist die Bezugsgröße für den prozentualen Deckungsbeitragsanteil.                                                 | A      |
| `exam-wiso-graded-miete-kauf-v1`              | 360 + 8d ≤ 35d verlangt d ≥ 13⅓; unter ganzen Nutzungstagen erstmals bei 14 Tagen erfüllt.                                                            | D      |
| `exam-wiso-graded-ruestzeit-serie-v1`         | 60 + 12n ≤ 15 + 16n verlangt n ≥ 11,25; unter ganzen Stückzahlen erstmals bei 12 erfüllt.                                                             | B      |
| `exam-wiso-graded-auftragsmix-liquiditaet-v1` | B und C bleiben in 5 Stunden und 550 € Auftragsauszahlungen; einschließlich 100 € Reserve exakt 650 €, bei 460 € Deckungsbeitrag.                     | C      |
| `exam-wiso-graded-lieferquelle-risiko-v1`     | Verschiedene Händler mit demselben Lager und ohne eigene Bestände trennen die ausdrücklich betrachtete Lagerabhängigkeit noch nicht.                  | D      |
| `exam-wiso-graded-preisrisiko-budget-v1`      | A garantiert ≤1 100 €; für B bleibt ein zulässiger Fall von 1 150 €, der die geforderte Garantie verletzt.                                            | A      |
| `exam-wiso-graded-vergangene-ausgaben-v1`     | Die bei beiden Entscheidungen unveränderte, nicht rückholbare Gebühr ist kein künftiger Unterschied.                                                  | B      |

## Separat ausgeführte Rechenkontrolle

Die sechs Zahlenreferenzen wurden mit Python unabhängig vom TypeScript-Schlüssel
berechnet. Verwendet wurden `decimal.Decimal`, für π die Standardbibliothekszahl
mit für die verlangte Rundung ausreichender Genauigkeit, sowie eine vollständige
Prüfung der ganzen Tage beziehungsweise Stückzahlen von 1 bis 100.

| Rechnung              | Tatsächlich berechnete Referenz | Einheiten- und Plausibilitätskontrolle                                                                                                        |
| --------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Kraft                 | 94,24777960769379 N → 94,25 N   | Pa·m² = N; der Durchmesser 20 mm wurde zu 0,020 m umgerechnet und nicht als Radius eingesetzt.                                                |
| Freie Längenzunahme   | 5,040 mm                        | m·mm/(m·K)·K = mm; ΔT = 35 K, nicht 50 K. Modellkennwert ausdrücklich vorgegeben.                                                             |
| Hydraulische Leistung | 10,00 W                         | 0,72 m³/h = 0,0002 m³/s; Pa·m³/s = W. Elektrischer Wirkungsgrad bleibt unbekannt.                                                             |
| Mischtemperatur       | 45 °C                           | Gewichtung warm:kalt = 2:1; Ergebnis zwischen 15 und 60 °C und näher bei 60 °C.                                                               |
| Miete/Kauf            | Erster ganzer Tag: 14           | Tag 13: Kauf 464 €, Miete 455 €; Tag 14: Kauf 472 €, Miete 490 €. Sicherer Wiederverkauf und ausgeschlossene Zusatzkosten gehören zum Modell. |
| Serienfertigung       | Erste ganze Stückzahl: 12       | Stückzahl 11: A 192 min, B 191 min; Stückzahl 12: A 204 min, B 207 min. Vorbereitung nicht mit Stückzeit verwechselt.                         |

## Nachweis der vier vernetzten Anforderungen

Die Stufe beschreibt hier die Struktur der Aufgabe und nicht die Zahl ihrer
Wörter. Die folgenden Aufgaben erfordern tatsächlich mehrere gemeinsam
einzuhaltende Bedingungen oder einen fortgeführten Zustand.

**Personalablauf:** Die zwingende Kette A → B/C → D → E benötigt mindestens
1 + max(2, 2) + 2 + 1 = 6 Stunden. Der zulässige Ablauf erreicht diese Untergrenze
mit A 8–9, B/C 9–11, D 11–13 und E 13–14. Eine nur formal sortierte Liste reicht
nicht: Voraussetzungen und Personenbelegung müssen zusammen passen.

**Hypothesen unterscheiden:** Eine unabhängige Python-Auswertung der vorgegebenen
Beobachtungsvektoren ergab folgende unterscheidbare Muster:

| Beobachtungen                              | Anzahl verschiedener Muster für H1/H2/H3 |
| ------------------------------------------ | ---------------------------------------- |
| Nur Durchflussreferenz                     | 2                                        |
| Antriebsrückmeldung und Durchflussreferenz | 3                                        |
| Antriebsrückmeldung und unveränderte Dauer | 2                                        |
| Unveränderte Dauer und Durchflussreferenz  | 2                                        |

Die erfolgreiche Kombination ist H1 = keine Änderung/zu klein,
H2 = Änderung/zu klein und H3 = Änderung/erwartet. Die Eindeutigkeit gilt nur
innerhalb der ausdrücklich vollständigen drei Fehlermodelle.

**Hysterese und Mindestlaufzeit:** Eine getrennte Python-Zustandsfortschreibung
von Betrieb, gespeichertem Ausschaltwunsch und letzter Einschaltminute ergab:

| Minute | Temperatur | Betrieb nach Auswertung | Maßgebliche Bedingung                                      |
| ------ | ---------- | ----------------------- | ---------------------------------------------------------- |
| 0      | 38 °C      | an                      | Unter 40 °C; Laufzeit beginnt.                             |
| 5      | 52 °C      | an                      | Wunsch gespeichert, Mindestlaufzeit noch nicht abgelaufen. |
| 10     | 47 °C      | aus                     | Halteband löscht Wunsch nicht; zehn Minuten sind erreicht. |
| 12     | 38 °C      | an                      | Unter 40 °C; Wunsch gelöscht und neuer Einschaltvorgang.   |

**Auftragsmix:** Alle acht Teilmengen der drei einmal möglichen Aufträge wurden
mit Python enumeriert. Zeitgrenze 6 Stunden, Auftragsauszahlungen höchstens
650 − 100 = 550 €. Zulässig bleiben:

| Auswahl | Stunden | Auftragsauszahlungen | Deckungsbeitrag |
| ------- | ------- | -------------------- | --------------- |
| keine   | 0       | 0 €                  | 0 €             |
| A       | 4       | 500 €                | 300 €           |
| B       | 2       | 200 €                | 200 €           |
| C       | 3       | 350 €                | 260 €           |
| B und C | 5       | 550 €                | 460 €           |

A+B, A+C und A+B+C verletzen mindestens eine Grenze. Der isoliert größte
Einzelbeitrag oder eine reine Zeitbetrachtung liefert deshalb keinen ausreichenden
Nachweis der optimalen zulässigen Auswahl.

Zusätzlich wurde die Wahrheitstabelle des ODER-Prüffalls vollständig über alle
acht Zustände geprüft. Beide Funktionen unterscheiden sich genau bei A = falsch,
C = wahr (für beide möglichen Werte von B). Von den vier tatsächlich angebotenen
Tests erfüllt nur Option C diese Bedingung.

## Vor Abschluss geklärte Punkte und Nutzungsgrenzen

- Beim Hysteresefall war zunächst offen, ob weitere Temperaturereignisse zwischen
  den angegebenen Zeitpunkten den gespeicherten Ausschaltwunsch löschen könnten.
  Die gelesene Endfassung schließt das ausdrücklich aus: Das Modell wertet nur
  die genannten diskreten Messzeitpunkte aus; dazwischen treten keine weiteren
  Temperatur- oder Schaltbedingungen auf. Erst für diese Fassung gilt die
  eindeutige Zustandsfolge.
- Die DB-Quote benennt nun ausdrücklich einen positiven Nettoerlös und damit
  einen gültigen Nenner. Der Schlüssel bleibt unverändert.
- Die Beschreibungen der Schwierigkeitsanforderung sind redaktionelle Gründe,
  keine beobachteten Lernleistungen. Die Zeitangaben bleiben Vorschläge.
- Freie Alternativbegründungen oder Rechenwege können fachlich gleichwertig
  sein; die Auswahlbewertung prüft keinen eingegebenen Rechenweg und vergibt
  keine erfundenen amtlichen Teilpunkte.
- Es wurden ausschließlich lokale eigene Inhalte gelesen. Keine private
  Datenbank, Originalprüfung, Lernakte oder reale Anlage wurde geprüft oder
  verändert. Die Python-Ausführung erzeugte keine Lernereignisse.

Zahlen, Bedingungen oder Optionen dieser Version dürfen nachträglich nicht unter
diesem Prüfnachweis geändert werden, ohne die betroffenen Aussagen erneut zu
prüfen. Strukturelle Tests und Buildchecks ersetzen diese begrenzte fachliche
Gegenprüfung nicht.
