# Gemeinsam an WerkTag arbeiten

Jeder Chat bzw. Work-Auftrag erhält einen eigenen Git-Branch und eine eigene
Arbeitskopie. Die Branches teilen einen nachvollziehbaren Ausgangsstand, ihre
Dateien werden getrennt bearbeitet. `main` enthält den gemeinsam geprüften
Veröffentlichungsstand. Nick kann anschließend die gewünschten Aufgaben zusammen
zum Livegang freigeben; der Koordinator verbindet genau diese Ergebnisse.

## Einen Auftrag beginnen

1. Aktuelles `AGENTS.md`, die [Produktkarte](product-map.md) und die betroffenen Übergaben lesen. Lernapp, Assistent, Materialliste oder gemeinsame Plattform als Ziel festhalten. Produktaufgaben gehören in den jeweiligen Produktbereich; solange der produktive Code hier liegt, verlinkt die Aufgabe den Implementierungs-PR in diesem Repository. Repository,
   vorhandene Arbeitskopie, Branch, vollständigen HEAD und offene Änderungen prüfen.
2. Aufgabe benennen, z. B. `feat/kartenfilter-20261028` oder
   `fix/anmeldung-20261028`. Den Namen nicht für einen anderen Auftrag wiederverwenden.
3. Eine neue Arbeitskopie außerhalb bestehender Worktrees anlegen:

   ```text
   node scripts/start-work.mjs feat/kartenfilter-20261028 /absoluter/pfad/werktag-kartenfilter
   ```

   Unter Windows ist beispielsweise `C:/Users/nick_/Documents/werktag-kartenfilter`
   ein absoluter Zielpfad. Das Skript prüft Ziel und Branch, fragt nach einer
   gleichnamigen Remote-Branch und lädt `origin/main` frisch. Anschließend erstellt
   es den Branch und Worktree am vollständigen geladenen Commit. Es veröffentlicht
   nichts und verändert weder den Branch noch offene Dateien der bisherigen
   Arbeitskopie. Mit `--dry-run` wird nur der Ablauf angezeigt; dabei wird auch
   kein Remote geladen. Ohne erreichbaren Remote beginnt kein normaler Lauf auf
   einem möglicherweise veralteten Stand.
4. In der neuen Arbeitskopie arbeiten. Erlaubte Dateien, Schnittstellen und
   Abhängigkeiten vor parallelen Änderungen aufteilen. Gemeinsame Dateien erhalten
   einen Verantwortlichen; andere Beteiligte melden Änderungsbedarf dorthin.
5. Relevante Prüfungen ausführen, Änderungen committen und den Aufgabenbranch auf
   GitHub veröffentlichen. Einen Pull Request mit der vorhandenen Vorlage anlegen.
   Ein Entwurf kennzeichnet noch nicht abgeschlossene Arbeit.

Für externe Chats gilt: Ein gemeinsamer Projektname eröffnet keinen direkten
Zugriff auf deren Arbeit. Sie müssen Branch und Commit oder eine konkrete
Dateiübergabe bereitstellen. Ein noch nicht gepushter lokaler Stand bleibt als
solcher gekennzeichnet. Vorhandene Branches oder Daten werden nicht aufgeräumt,
weil eine Aufgabe beendet ist.

## Übergabe zwischen Chats

Die PR-Beschreibung enthält mindestens:

- Aufgabe und resultierendes Verhalten.
- Repository, Aufgabenbranch, vollständiger Basis- und Ergebniscommit.
- Geänderte Dateien, gemeinsame Schnittstellen und benötigte andere Branches.
- Tatsächlich ausgeführte Prüfungen und ausdrücklich nicht geprüfter Umfang.
- Änderungen an Datenbank oder Hosting, deren Reihenfolge und Rückweg.
- Ob Veröffentlichung beauftragt ist oder nur ein Arbeitsstand vorliegt.

Ein Push auf einen Aufgabenbranch bedeutet keinen Auftrag zum Livegang.
Persönliche Daten, Zugangsschlüssel, `.env`-Dateien, Browserzustände und private
Kataloginhalte gehören nicht in Git oder in öffentliche CI-Artefakte.

## Versionen kombinieren und veröffentlichen

1. Die angeforderten PRs, ihre aktuellen Remote-Heads und bestehende Live-Version
   erneut lesen. Neue fremde Arbeit erhalten und nicht stillschweigend mitnehmen.
2. Vom aktuellen `origin/main` einen Integrationsbranch
   `release/<datum>-<umfang>` in einer eigenen Arbeitskopie erstellen. Die
   freigegebenen Aufgabenbranches mit normalen Merge-Commits zusammenführen.
   Dadurch bleiben Herkunft und bereits geprüfte Ergebniscommits erhalten.
3. Konflikte anhand des beabsichtigten Verhaltens und der gemeinsamen Verträge
   lösen. Besonders Navigation, Anmeldung, API-Routen, Migrationen und
   Versionsdateien gemeinsam prüfen. Kein pauschales „unsere/deren Version nehmen“.
4. Am kombinierten Stand `npm ci` und `npm run check` ausführen. Zusätzlich die
   betroffenen Nutzerabläufe und den tatsächlichen Datenzugriff prüfen. Fehlende
   Browser oder Zugänge als offene Prüfung festhalten; alte Tests nicht als neuen
   Nachweis ausgeben.
5. Den Integrationsbranch als Release-PR gegen `main` öffnen. Bereits erteilte
   passende Veröffentlichungserlaubnis nutzen. Unmittelbar vor dem Merge die
   erwartete Ergebnis-SHA prüfen; verschobene Heads erfordern einen erneuten Abgleich.
6. Nach dem Merge auf das tatsächliche Vercel-Produktionsdeployment warten und
   Domain, ausgelieferte Version/SHA und geschützte Abläufe prüfen. Ein grüner
   GitHub-Lauf allein bestätigt noch keine erfolgreiche Bereitstellung.

`main` sollte auf GitHub Pull Requests und den bestehenden CI-Check verlangen,
Force-Push und Löschung sperren. Das ist eine serverseitige Repository-Einstellung;
diese Anleitung allein aktiviert keinen Branchschutz. Die CI läuft bereits bei
Pull Requests und bei Pushes auf `main`. Weder dieses Dokument noch das
Worktree-Skript richtet automatische Merges, neue Dienste oder neue Zugänge ein.

Wenn ein früherer Livegang direkt mit privaten Quelldateien erfolgte, zuerst
diesen Stand im Aufgabenbranch sichern und in den gemeinsamen Release einbeziehen.
Ein neuer Git-Deploy des älteren `main` darf ihn nicht unbeabsichtigt ersetzen.
