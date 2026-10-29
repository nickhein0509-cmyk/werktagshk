# Welche Repositories WerkTag benötigt

Bestandsabgleich: **29. Oktober 2026 (Europe/Berlin)**, 26 Repositories im Konto
`nickhein0509-cmyk`: 6 eigene Repositories und 20 Forks. Die Namen stimmen mit der
[Fork-Bestandsaufnahme](fork-inventory-20261029.json) überein; keine zusätzlichen
Forks seit dieser Auswertung. Das ist kein erneuter Vergleich sämtlicher Upstream-Commits.

## Sechs eigene Repositories

| Repository | Tatsächliche Rolle | In neue Entwicklungsumgebung? |
| --- | --- | --- |
| [werktagshk](https://github.com/nickhein0509-cmyk/werktagshk) | Gesamter aktueller Produktionscode, gemeinsame Tests und Veröffentlichung | **Ja, ausschließlich dieses Repo; Branch main** |
| [projektzentrale](https://github.com/nickhein0509-cmyk/projektzentrale) | Produktkoordination und gemeinsame Aufgaben | Nein; einzelne Dokumente/Issues über GitHub lesen |
| [werktag-assistent](https://github.com/nickhein0509-cmyk/werktag-assistent) | Aktiver Produktauftrag und Assistenz-Issues | Nein; gezielt lesen |
| [werktag-materialliste](https://github.com/nickhein0509-cmyk/werktag-materialliste) | Aktiver Produktauftrag und Material-Issues | Nein; gezielt lesen |
| [werktag-lernen](https://github.com/nickhein0509-cmyk/werktag-lernen) | Lernprodukt-Auftrag; KI und kommerzieller Ausbau pausiert | Nein; nur bei notwendiger Bestandspflege lesen |
| [projekt-vorlage](https://github.com/nickhein0509-cmyk/projekt-vorlage) | Organisationsvorlage für neue eigenständige Projekte | Nein |

Die Produkt-Repositories enthalten keine separat bereitgestellten Anwendungen.
Die spätere technische Herauslösung ist kein Hindernis für heutige Arbeit und
keine Voraussetzung einer neuen Umgebung. [Aktueller Fokus](current-focus.md).

## Was bei den 20 Forks erledigt ist

**Alle 20 sind einzeln eingeordnet:** Zweck, möglicher WerkTag-Nutzen,
Lizenzhinweise und Empfehlung stehen in der [vollständigen Tabelle](fork-review-20261029.md).
Dies ist eine Vorprüfung anhand Metadaten und gezielter README-/Lizenzlektüre,
keine vollständige Code-, Sicherheits- oder Rechtsprüfung jedes Projekts.

**Bereits umgesetzt:** [PR #28](https://github.com/nickhein0509-cmyk/werktagshk/pull/28)
nutzt Performance-/Robustheitskonzepte für bedarfsgesteuertes Laden, verständliche
Lade-/Fehlerzustände und überprüfte Einstiegsbudgets. Eigenständige Implementierung;
keine kompletten Fremdanwendungen, kopierten Module oder neuen Laufzeitabhängigkeiten.

**Nur mögliche Referenzen:** `macro` für Notizen/Suche (AGPL beachten),
`awesome-ios` und `open-source-ios-apps` für konkrete Assistenz-iOS-Lücken,
`impeccable`/`hallmark` für Bedienung, `awesome-scalability` für gemessene Leistung.
`DeepTutor` wird während der Lern-KI-Pause nicht weiterverfolgt. Fremde
Agent-Anweisungen werden nicht automatisch zu WerkTag-Regeln.

## So wird eine Referenz wirklich nutzbar

1. Ein konkretes Assistenz-/Materialproblem und Abnahmekriterium im Issue benennen.
2. Nur die passende Quelle lesen; Lizenz und technische Passung der tatsächlichen
   Dateien/Abhängigkeiten prüfen. Eine Listenlizenz gilt nicht für alle verlinkten Apps.
3. Kleinste begründete Änderung im bestehenden Produktionsrepo umsetzen;
   Quelle und Entscheidung dokumentieren. Keine komplette Plattform nur wegen eines Forks installieren.
4. Betroffene Nutzerabläufe prüfen, PR übernehmen und den tatsächlichen Einsatz
   mit Ergebnis vermerken. Eine Ideenbewertung nicht als fertige Integration ausgeben.

Viele Forks sind nicht automatisch schlecht oder teuer. Als reine Lesezeichen
reichen Stars/Listen. Ein Fork lohnt sich bei eigenen Änderungen oder Beiträgen;
dann Pflege und Upstream-Abgleich einplanen. Bestehende Forks müssen für einen
aufgeräumten Arbeitskontext weder gelöscht noch in jede Umgebung geklont werden.
