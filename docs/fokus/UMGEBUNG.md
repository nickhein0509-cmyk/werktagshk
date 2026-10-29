# Profil „WerkTag Fokus“

Ein Repository als Startbestand: `https://github.com/nickhein0509-cmyk/werktagshk`,
Branch `main`. Die Umgebung wird aus dem aktuellen Remote aufgebaut, nicht aus
einem alten Windows-Export. `werktag.code-workspace` öffnet ausschließlich diesen
Ordner. Die bisherige Arbeitskopie und fremde Forks bleiben erhalten.

| Einstellung | Vorgabe |
| --- | --- |
| Runtime | Linux, Node 24, npm aus Node, Git, Chromium; WebKit für zweite Browserengine |
| Setup | `npm ci`; bei fehlenden Browsern `npx playwright install --with-deps chromium webkit` |
| Startkontext | `docs/fokus/START.md`, `AGENTS.md`, `docs/product-map.md`; ein konkretes Issue |
| Repositoryzugriff | WerkTag-Code; Produktvertrag/Issues gezielt über GitHub lesen |
| Netzwerk | Paketmanager/GitHub-Grundprofil; `api.github.com`, `werk-tag.com` für direkte API-/Liveprüfungen bei Bedarf |
| Geheimnisse | Keine für lokale Entwicklung mit synthetischen Testdaten |
| Werkzeuge | GitHub; Remote Desktop Commander bei Geräte-/Liveprüfung; weitere Plugins aufgabenbezogen |
| Prüfung | `npm run check`; WebKit in GitHub-CI oder lokal mit `npx playwright test --config playwright.assistant-webkit.config.ts` |

Die Freigabe von Netzwerkzielen erfolgt über die unterstützte Umgebungsverwaltung,
nicht durch Ändern von `/etc/codex/network-policy.json`. Dieses Profil ist eine
Konfigurationsvorlage, keine bereits angelegte zusätzliche Cloud-Instanz.
`Cloud Environment Runtime` kann hier nur Laufzeitstatus lesen. Beim Anlegen im
Client nur dieses Repo auswählen und danach einen **neuen Chat** mit dem
Startauftrag eröffnen; ein Worktree startet keinen Chat mit leerem Gedächtnis.

## Forks praktisch nutzen

- Keine Forks automatisch klonen oder als Agent-Regeln einlesen.
- Zunächst **keine aktiv gepflegten Fremdforks**: Die Auswertung vom 29.10. fand
  auf allen 20 Standardbranches keine eigenen Zusatzcommits.
- Kuratierte Referenzen: `awesome-scalability` (Messung/Architektur), `impeccable`
  und `hallmark` (Oberfläche), `superpowers` (Arbeitsmethoden), `DeepTutor`
  (spätere Lernhilfe). Nur die konkret benötigten Teile prüfen.
- Künftige reine Lesezeichen als Stars/Listen führen. Fork erst bei geplanter
  eigener Änderung oder Upstream-Beitrag; dann Zweck, Lizenz und Syncplan notieren.
- Vorläufig 3–5 tatsächlich aktive Fremdforks als Arbeitsbudget, kein technisches
  Limit. Vor Wiederverwendung Lizenz pro Projekt/Datei lesen.
- Bestehende Forks wurden weder gelöscht noch archiviert. Ein aufgeräumter
  Arbeitskontext erfordert keine Löschung der GitHub-Historie.
