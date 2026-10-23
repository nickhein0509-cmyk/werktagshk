# Supabase-Fragenbestand: begrenzte Bestandsauswertung

Stand: 23.10.2026. Nur gelesen; keine Produktionsänderungen und keine Lernverlaufsdaten gelesen.

Historischer Stichprobenbericht zu Version 0.6.0. Die anschließende vollständige
Einzelprüfung aller 631 Fragen und ihre Einbindung beschreibt
[Version 0.7.0](private-bank-release.md).

## Umfang

631 neueste unterschiedliche Fragen, gespeichert in 716 Versionen. 686 Versionszeilen sind aktiv; dies darf nicht als Anzahl unterschiedlicher Fragen angezeigt werden. Alle 631 nach der Auswahl „aktiv zuerst, neueste Version“ sind aktiv. Der für einen angemeldeten Nutzer tatsächlich auswählbare Umfang kann durch Berechtigungen und Ausschlüsse abweichen und wurde nicht abgefragt.

| Themengebiet   | Neueste Fragen |
| -------------- | -------------: |
| entwaesserung  |             53 |
| fachrechnen    |             36 |
| heizung        |             87 |
| regelung       |             68 |
| systemanalyse  |             95 |
| trinkwasser    |            113 |
| waermeerzeuger |             95 |
| wiso           |             84 |

| Antwortart | Neueste Fragen |
| ---------- | -------------: |
| choice     |            169 |
| numeric    |             60 |
| self       |            390 |
| short      |             12 |

Von 60 numerischen Fragen sind 20 statisch und 40 dynamisch. Die Datenbank enthält 42 mathematische Vorlagenversionen. Die 40 aktuellen dynamischen Fragen verlangen eine erzeugte Instanz; fehlende statische Musterlösungen sind dort beabsichtigt.

## Schwierigkeit

Die vorhandene redaktionelle Einstufung lautet 246× basic und 385× applied. Separat stehen 242× foundation und 389× application im Anforderungsfeld demand. In 10 Fällen stimmen diese beiden Systeme nicht überein. Das sind vorhandene Kategorien und keine neu kalibrierte vierstufige Schwierigkeitsskala.

Der bestehende autorisierte Katalog liefert difficulty und demand bereits aus. Auch der öffentliche Fragesnapshot enthält difficulty. Für das Anzeigen/Filtern dieser Metadaten ist keine Datenbankmigration erforderlich.

## Struktur und Quellen

Alle 631 neuesten Einträge haben Titel, Aufgabe, Quellen-PDF-Seite, Lernziel und Aufgabenfamilie. Bei allen stehen registry.review_status=checked sowie source.status=original_checked und authored=true. Das sind gespeicherte Aussagen der bisherigen Redaktion und keine erneute Sichtung aller Originalseiten.

Alle 591 statischen Einträge haben Musterlösung, Erklärung und Bewertungsart. Unter den 631 neuesten Einträgen wurden keine identischen normalisierten Aufgabentexte oder Titel gefunden. Inhaltlich sehr ähnliche Varianten wurden damit nicht ausgeschlossen.

Quellenbezug nach groben Gruppen: 471 Lehrbuch, 46 WiSo-Prüfungsvorbereitung, 53 eigene Kontextaufträge, 61 weitere Fach-/Rechtsquellen. Die Quellennotizen der Stichprobe begrenzen häufig ausdrücklich, welche Aussagen geprüft wurden; ein geprüfter Rechenzusammenhang bedeutet keine Freigabe sämtlicher Normwerte derselben Buchseite.

## Inhaltliche Stichprobe

30 konkrete Aufgaben wurden gelesen: je eine pro vorhandener Kombination aus Thema und Antwortart. Darunter 29 statische Aufgaben mit Lösung/Bewertung und eine beabsichtigte dynamische Vorlagenschale. Sieben statische Zahlenaufgaben und zwei Rechen-Auswahlfragen wurden nachgerechnet; dabei kein falscher Zahlenwert oder Lösungsschlüssel gefunden. Zwei Rechtsbeispiele wurden gegen die aktuellen amtlichen Texte von BBiG §11 und §13 geprüft.

Zwei redaktionelle Unklarheiten wurden gefunden: Bei kurzen Fachbegriffsfragen enthält die Antwortprüfung den richtigen Begriff, die angezeigte Musterlösung beschreibt jedoch nur den Vorgang und nennt den gesuchten Begriff nicht ausdrücklich. Konkrete private Änderungsvorschläge liegen getrennt von diesem aggregierten Bericht vor; nichts wurde eingespielt.

Die 42 Vorlagenversionen enthalten 210 gespeicherte Referenzfälle und stehen auf checked ohne offene Punkte. Diese gespeicherten Referenzfälle wurden in dieser Auswertung nicht ausgeführt. Die Auswertung ist keine vollständige technische oder normative Freigabe aller 631 Fragen.

## Nächste redaktionelle Schritte

Vorhandene basic/applied-Kategorien transparent erhalten; unbekannte Metadaten erhalten. Für neue feinere Härtegrade Anzahl und Abhängigkeit der Teilschritte, Einheitenwechsel, Auswahl relevanter Daten, Transfer und erforderliche Begründung anhand expliziter Kriterien bewerten. Antwortart, Textlänge oder Titel allein rechtfertigen keinen Härtegrad.

## Aktuelle technische Dokumentation

Supabase-Changelog am 23.10.2026 live abgerufen und aktuelle relevante Änderungen zu TLS sowie neuen Tabellenfreigaben gelesen. Vorhandene Metadaten können über die bestehenden Funktionen genutzt werden; keine Änderung an Authentifizierung, Freigaben, Schema oder SDK vorgesehen. Aktuelle offizielle JavaScript-RPC-Dokumentation geprüft.

- https://supabase.com/changelog.md
- https://supabase.com/docs/reference/javascript/rpc
- https://supabase.com/changelog/cbc-tls-ciphers-deprecated
- https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
- https://www.gesetze-im-internet.de/bbig_2005/__11.html
- https://www.gesetze-im-internet.de/bbig_2005/__13.html
