# Supabase-Fehlerrunde · 29. Oktober 2026

Auftrag: bestehendes WerkTag-Projekt weiterführen, Fehler suchen und beheben.
Produktbereiche: **LERNEN** (Modellübungs-Synchronisierung) und **ASSISTENT**
(Health). Gemeinsame Anmeldung und Datenhaltung bleiben bei der Plattform.

Frisch geladene Basis: `ef9f8b36220914bb1d137207ca3df7d471cdb46d`.
Aufgabenbranch: `fix/supabase-audit-20261029`, eigene Arbeitskopie.
Der ursprüngliche Checkout und dessen Branch bleiben erhalten.

## Bestätigte Fehler und Verhalten nach der Korrektur

| Befund | Korrektur und Nachweis |
| --- | --- |
| Ein lokal schreibgeschützter Lernstand aus einer neueren App-Version verweigert die Übernahme aus der Cloud. Der Abgleich ignorierte dies und konnte anschließend einen leeren Ersatzstand über vorhandene Cloudantworten und Lesezeichen schreiben. | `CloudAccount` verlangt jetzt die erfolgreiche Übernahme, bevor automatisches Speichern aktiviert wird. Eine Chromium-Regression reproduzierte zuvor den leeren PATCH; jetzt bleiben Cloud und lokale Rohdaten unangetastet. Ein zweiter Browserfall prüft den regulären Abgleich mit verschiedenen lokalen und entfernten Antworten und Lesezeichen. |
| Health akzeptierte im Unterschied zu den übrigen Assistenz-Endpunkten auch ein anonymes Auth-Konto für Eigentümeraktionen. | Anonyme Konten werden vor der Installationsabfrage zurückgewiesen. Status, Schlüsselprüfung, Einrichtung, Abruf und Ausschalten sind mit synthetischen Anfragen geprüft. |
| Die ISO-Normalisierung ergänzte bei VO₂-Beobachtungen `.000` und machte damit aus einer sekundengenauen Quelle eine angeblich millisekundengenaue Messung. | Zeitpunkt und Zeitzonen-Normalisierung bleiben erhalten; die Präzision folgt dem ursprünglichen Sekundenbruchteil. Regressionen prüfen UTC, Zeitzonenoffset und ausdrücklich vorhandene `.000`. |

## Zugriff und Live-Bestandsprüfung

Am 29.10.2026 über die verbundenen Supabase-Werkzeuge erfolgreich gelesen:
Projektstatus, Migrationen, Edge-Funktionen, aggregierte Logs und Advisors.
Das neue Projekt `mvkksfecimpjnytvbrrb` ist erreichbar. Die benötigten Funktionen
`assistance`, `health-sync` und `assistance-native` sind aktiv. Der vorherige
Projektwechsel aus PR20 ist bereits in der Arbeitsbasis enthalten.

Zusätzliche HTTP-Prüfung: Die native Konfiguration von `werk-tag.com` nennt das
neue Projekt; die Assistenz-CSP erlaubt dessen Host. Geschützte Endpunkte lehnen
Anfragen ohne Zugang ab (401 bzw. beim Health-Eigentümerzugriff 403). Dies ist
kein Nachweis einer authentifizierten persönlichen Nutzung oder eines echten
Health-Quellenimports.

Eine Metadatenabfrage bestätigt RLS auf allen elf Assistenz-Tabellen sowie fehlende
direkte SELECT-Rechte für `anon` und `authenticated`. Die Advisor-Hinweise
„RLS ohne Policy“ werden hier deshalb nicht durch öffentliche Policies behoben:
der vorgesehene Zugriff erfolgt über die geprüften Dienste. Weitere vorhandene
Hinweise zu privilegierten Funktionen, Indizes und Auth-Einstellungen sind durch
diese begrenzte Fehlerrunde weder vollständig bewertet noch pauschal verändert.
Die SELECT-, INSERT- und UPDATE-Policies für `shk_learning_progress` beschränken
den Zugriff auf `auth.uid() = user_id`; UPDATE prüft auch die neuen Werte.

## Verantwortliche und Prüfstatus

Koordination und Integration: Hauptagent. Getrennte Schreibbereiche:
`/root/auth_sync_audit` für `CloudAccount` und die neue Browserregression,
`/root/cloud_audit` für Health. `/root/review_fixes` prüfte beide Diffs unabhängig
und meldete keine konkreten Regressionen. Diese Agentenkennungen gelten für
diese Sitzung und belegen keinen späteren Hintergrundbetrieb.

- Vorhanden und gelesen: **geprüft**, aktuelle Quellverträge und Diffs.
- Technisch geprüft: **geprüft**, gezielte Regressionen für alle drei Fehler.
- Fachlich geprüft: **nicht anwendbar**, keine Lerninhalte oder medizinischen Aussagen geändert.
- Integriert: **geprüft**, gemeinsame Änderungen im genannten Aufgabenbranch.
- In der Anwendung geprüft: **geprüft**, synthetische Chromium-Abläufe zum Cloud-Abgleich.
- Bereitgestellt: **offen**, diese Fehlerkorrekturen sind noch nicht produktiv ausgeliefert.

Abschließend am gemeinsam geänderten Stand ausgeführt: **`npm run check`
erfolgreich**. Produktionsbuild, 254 Vitest-Tests, 35 Gateway-/Assistenztests,
91 Edge-Funktionstests, 7 Workflowtests und 150 Chromium-Browserfälle bestanden;
insgesamt 537 Tests ohne Fehler. Zusätzlich wurden die betroffenen 36
Health-/Native-Tests gezielt wiederholt und `git diff --check` ausgeführt.
Der zusätzliche mobile WebKit-Lauf der GitHub-CI wurde lokal nicht ausgeführt.

Keine Produktionsdaten, Rechte, Zeitpläne, Geheimnisse oder Infrastruktur
verändert. Für die Health-Korrekturen ist nach der Code-Integration
eine gesonderte Bereitstellung der Funktion nötig; eine Datenbankmigration ist
nicht erforderlich.

Supabase-Changelog und aktuelle Dokumentation wurden gelesen. Relevante Quellen:
[Sitzungsprüfung](https://supabase.com/docs/guides/auth/sessions),
[anonyme Konten](https://supabase.com/docs/guides/auth/auth-anonymous),
[RLS-Advisor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
