# WerkTag: fokussierter Arbeitsstart

**Jetzt: Assistent und Materialliste.** KI-Lernhilfe und kommerzieller Ausbau der
Lernapp pausieren. Bestehende Lernfunktionen und private Prüfungsvorbereitung
bleiben erhalten. [Maßgebliche Entscheidung](../current-focus.md).

Diese Datei ist der Einstieg für einen **neuen Chat**. Kein alter Chatverlauf,
keine Fremdrepository-Sammlung und kein Sammelimport aller Dokumente sind nötig.
Ein Arbeitsordner begrenzt die Dateiauswahl, ist aber keine Sicherheitsgrenze
und löscht keinen Gesprächskontext. Eine neue verwaltete Cloud-Umgebung muss in
der Umgebungsverwaltung angelegt/ausgewählt werden; diese Dateien tun das nicht.

## Dauerhafter Kern

- WerkTag umfasst **Lernen**, **Assistent** und **Materialliste**. Code und PRs:
  `nickhein0509-cmyk/werktagshk`. Die drei Produktrepos enthalten Aufträge/Issues;
  ihr kompletter Quellbestand muss nicht in die Umgebung geklont werden.
- Zuerst `AGENTS.md`, `docs/current-focus.md` und `docs/product-map.md`, dann genau das bearbeitete Issue,
  dessen Produktvertrag per GitHub und die betroffenen Quelldateien lesen.
- Frisch `origin/main` laden, eigenen Branch und eigene Arbeitskopie mit
  `node scripts/start-work.mjs <feat|fix|chore|docs/aufgabe> <absoluter-pfad>`
  erstellen. Basis-SHA, Produkt, Issue, Dateien und Abhängigkeiten festhalten.
- Node **24**, `npm ci`, `npm run dev`. Vor PR/Release `npm run check`;
  CI einschließlich WebKit abwarten. Änderungen über PR, kein Direktpush auf main.
- Produktion: `https://werk-tag.com`, Vercel `werktag-app`. Einen Livegang nur
  mit Auftrag ausführen und anschließend tatsächlichen SHA und Verhalten prüfen.
- Private Originale, Lernstände, Health/GPS und Schlüssel bleiben außerhalb Git.
  Keine Produktionsgeheimnisse für lokale UI-Tests nötig. Supabase-Ziel ist
  `mvkksfecimpjnytvbrrb`; vor Backend-/Deploykonfiguration Migrationseintrag lesen.
- Lernen: Prüfung 07.12.2026; bestehende Aufgaben, IDs, Cloudkonto und Fortschritt
  erhalten. Kein obligatorisches Spielsystem vor der Prüfung.

## Nur bei Bedarf nachladen

| Aufgabe | Zusätzlicher Kontext |
| --- | --- |
| Oberfläche | `.agents/skills/shk-interface-design/SKILL.md`, konkrete Komponente |
| Lernen/Inhalte | `.agents/skills/shk-content-workflow/SKILL.md`, betroffener Lernvertrag |
| Backend/Konto | `docs/supabase-project-migration.md`, betroffener API-/Datentest |
| Release/mehrere Branches | `docs/parallel-work.md`, tatsächlich einzubindende PRs |
| Fremdprojekt prüfen | einzelne Quelle und Lizenz; `docs/fork-review-20261029.md` |

GitHub-Issues sind die aktuelle Aufgabenliste; nicht diesen Text als Statuskopie
verwenden. Einstieg: [offene WerkTag-Issues](https://github.com/issues?q=owner%3Anickhein0509-cmyk+is%3Aissue+is%3Aopen).
Anbieterzugang, persönliche Kontobestätigung und physische iPhone-Abnahme sind
keine durch Codeprüfungen erledigten Schritte. Bearbeitbare Aufgaben vorziehen;
bei blockierten Aufgaben den genauen fehlenden Schritt festhalten.

## Kopierbarer Auftrag für einen neuen Chat

> Arbeite am aktuellen main von nickhein0509-cmyk/werktagshk. Lies zuerst
> docs/fokus/START.md, AGENTS.md, docs/current-focus.md und docs/product-map.md.
> Wähle eine technisch bearbeitbare Aufgabe für Assistent oder Materialliste.
> KI-Lernhilfe und kommerzieller Lernapp-Ausbau sind pausiert. Lies nur ihren
> Produktvertrag und betroffene Quellen. Erstelle einen eigenen Branch/Worktree,
> implementiere und prüfe die Änderung, öffne den PR und aktualisiere das Issue.
> WerkTag hat drei Produkte; Fremdforks dienen nur gezielten Referenzen.
> Berichte den geprüften Ergebnis-SHA und offene Abhängigkeiten. Diesen Auftrag
> nicht als pauschale Aktivierung kostenpflichtiger Dienste verstehen.
