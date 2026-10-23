# Fragenbestand, Formelausbau und Aufgabenstufen · 0.6.0

Stand: 23. Oktober 2026. Fortsetzung auf dem bestehenden Vorschauzweig
`feat/practice-workspace-2026-10-23`, PR #3 in `nickhein0509-cmyk/werktagshk`.

Die anschließende vollständige Prüfung und Einbindung aller privaten Fragen
steht im [Bericht zu Version 0.7.0](private-bank-release.md).

Der Werkzeugkoffer wächst von acht auf 21 Formelmodelle mit 64 unterstützten
Umstellungen. Suche und fünf Bereiche helfen bei der Auswahl. Einheitenwechsel,
Umstellen und Filter erhalten das physikalische Beispiel und die geöffneten
Entwürfe. Die Sammlung bleibt eine Auswahl zum Üben. Modelle, separat berechnete
Referenzen und noch offene Familien stehen in [formula-expansion.md](formula-expansion.md).

24 neue eigene Aufgaben ergänzen den Katalog auf 204: 118 Rechenaufgaben,
54 Kontextaufgaben und 32 Wissensfragen. Je acht neue Fälle gehören zu
Arbeitsplanung, Systemanalyse/Instandhaltung und WiSo; damit sind es 96 gezielte
Teil-2-Fälle, je 32 pro schriftlichem Bereich. Alle bestehenden Aufgaben-IDs und
Antwortschlüssel bleiben erhalten. Die neuen Fälle verwenden ausdrücklich
beschriebene Modelle und keine kopierten privaten Prüfungsfragen.

Die vier redaktionellen Stufen Einstieg, Anwenden, Transfer und Vernetzt bewerten
die tatsächlich verlangte Bearbeitung. Alle 180 bisherigen Aufgaben wurden
zugeordnet; die 24 neuen führen ihre Begründung im Inhalt. Insgesamt verteilen
sich die 204 Aufgaben auf 49 / 98 / 51 / 6 Einträge in Stufe 1–4.
[Die Regeln](difficulty-rubric.md) trennen die Aufgabenanforderung von persönlichem
Können, alter Kennzeichnung und Prüfungsreife.

Lernwerkstatt und Prüfungsbereich filtern nach Stufe und sortieren auf- oder
absteigend. Im Aufgabenverzeichnis lassen sich diese Angaben mit Aufgabenart,
Prüfungsbereich, Lernfeld, Suche und Merkliste kombinieren. „Weiterlernen“ folgt
der geöffneten gefilterten Reihenfolge. Unbekannte Einstufungen bleiben sichtbar
und in beiden Richtungen zuletzt. Eine allgemeine Stufenbeschreibung ist vor
der Antwort verfügbar; eine aufgabenspezifische Begründung erst nach dem Prüfen,
da sie Hinweise auf den Lösungsweg enthalten kann. Aktive Prüfungsrunden behalten
ihre gespeicherten Aufgaben, Entwürfe und Zeitmessung.

Der private Supabase-Bestand enthält 631 aktuelle unterschiedliche Fragen in
716 gespeicherten Fassungen. Seine vorhandenen Kategorien **246 Basis / 385
Anwendung** sind jetzt sichtbar, filter- und sortierbar. Die zusätzliche
Anforderungszuordnung bleibt getrennt. Eine Umrechnung auf vier Stufen wurde
nicht vorgenommen. Angezeigte Bestandszahlen und Themenverteilungen kommen aus
den tatsächlich autorisiert geladenen Daten. Verzeichnisfilter ändern die
bestehende serverseitige Rundenauswahl nicht.

Die [Bestandsauswertung](supabase-bank-audit.md) erfasst alle 631 strukturell und
30 konkrete Aufgaben inhaltlich, mit neun separat nachgerechneten Beispielen.
Zwei angezeigte Kurz-Musterantworten sollten den gesuchten Begriff expliziter
nennen; konkrete Vorschläge liegen privat, keine Änderungen wurden eingespielt.
Es gab keine Datenbankmigration, keine neue Prüfung aller privaten Originalseiten
und keine Änderungen an Lernhistorie oder gespeicherten Einstufungen.

Die private Quellenprüfung zum Formelausbau sichtete 13 vorhandene gerenderte
Seiten ausgewählter Fachunterlagen. Sie trennte unter anderem COP von
Jahresarbeitszahl, volumetrische von massenbezogener Wärmekapazität sowie die
Einheiten von Ausdehnungskoeffizienten. Auffällige Quellenaussagen wurden privat
notiert; die App verwendet explizite Modellannahmen. Ausgaben und Aktualität der
vorhandenen Render wurden nicht durch einen neuen vollständigen PDF-Abgleich
bestätigt. Private Unterlagen und Schlüssel bleiben außerhalb des öffentlichen
Repositories.

Das eigene Übungsmaterial wird als separater Inhaltsbaustein gebündelt; der
Konto-SDK erhält ebenfalls einen eigenen Cachebaustein, wenn konfiguriert.
Formel- und Bestandsansichten bleiben bei Bedarf geladen. Lernstandsformat,
Kontentrennung und historische Antworten ändern sich nicht.

## Ausgeführte Prüfung

`npm run check` am 23. Oktober 2026 vollständig bestanden: TypeScript und
Produktionsbuild, 243 Logiktests in 14 Dateien sowie 43 Chromium-Browserprüfungen.
Die Browserprüfungen umfassen alle 64 angebotenen Formelziele bei 320 px,
Einheitenwechsel, Filter und Entwurfserhalt, beide Schwierigkeits-Sortierrichtungen,
kombinierte Filter, Weiterlernen und passende Prüfungsrunden. Automatische
WCAG-A/AA-Prüfungen fanden keine Verstöße in den geprüften Ansichten.

Zusätzlich wurde mit synthetischer Kontokonfiguration gebaut und das tatsächlich
gebündelte Produktionspaket über fünf gezielte Browserfälle geprüft: privater
Antwortablauf, Bestandsfilter, Fassungsabgleich, gefiltertes Weiterlernen sowie
Formelsuche und Entwürfe. Alle fünf bestanden. Dabei kamen ausschließlich
isolierte Testdaten zum Einsatz, keine echten Konten oder Lernverläufe.

Die unabhängige Formelprüfung führte 64 gemischte Einheitenbeispiele und zehn
Grenzfälle aus. Die [zweite Prüfung der neuen Aufgaben](exam-graded-independent-review.md)
rechnete alle sechs Zahlenfragen erneut und prüfte alle 24 Antwortentscheidungen,
einschließlich der vier vernetzten Bedingungen. Das sind begrenzte fachliche
Gegenprüfungen zusätzlich zu den technischen Tests.

Eigene Bildschirmansichten: [Formelwerkstatt](screenshots/formula-expanded.png),
[320 px](screenshots/formula-expanded-mobile.png),
[Stufenfilter](screenshots/library-difficulty.png) und
[Prüfungsauswahl](screenshots/exam-difficulty-setup.png).
