# Bestehenden Fragenbestand wieder anbinden

**Neue Entscheidung vom 29.10.2026:** Der folgende Bericht beschreibt die frühere
Wiederanbindung. Sein damaliges „kein neues Supabase-Projekt“ ist durch den
[beauftragten vollständigen Projektumzug](supabase-project-migration.md) ersetzt.
PR #20 und die aktuelle öffentliche Konfiguration verwenden inzwischen das Ziel
`mvkksfecimpjnytvbrrb`. Der folgende ältere Bericht belegt nicht den heutigen
Migrations- oder Vollständigkeitsstatus.

Stand: 23. Oktober 2026. Das neue Repository ist
`nickhein0509-cmyk/werktagshk`. Die Anwendung läuft im bestehenden Vercel-Projekt
`werktag-app` auf `werk-tag.com`. Kein neues Supabase-Projekt oder Tabellenimport.

## Laufzeit und Datenschutz

Die bereits konfigurierten Werte `VITE_SUPABASE_URL` und
`VITE_SUPABASE_PUBLISHABLE_KEY` werden wieder verwendet. Der vorhandene
Auth-Speicherschlüssel `werktag-learning-auth` bleibt gleich. Niemals einen
Service-Role-Schlüssel in VITE-Variablen oder Quellcode übernehmen.

„Mein Fragenbestand“ lädt Metadaten mit `shk_learning_data`, ohne eine Runde
anzulegen. Nur ein ausdrückliches Starten oder Fortsetzen öffnet Aufgaben.
`shk_begin_learning`, `shk_load_session`, `shk_help`, `shk_save_draft`, `shk_submit`
und `shk_advance` nutzen die bestehenden Autorisierungs- und Bewertungsregeln.
Abgaben und Entwürfe führen die Sitzungsrevision mit; Konflikte behalten die
Eingabe. Die neue kleine Invoker-Funktion `shk_session_policy` verlängert nur die
bestehende fünfsekündige Freigabe, ohne Aufgaben zu reservieren oder Lernereignisse
zu schreiben. Anonyme Aufrufe sind ausgeschlossen. Die private Funktion prüft
Bestätigung, Lernendenfreigabe und Sitzungseigentümer weiterhin selbst.

Der Katalog zeigt aktive aktuelle Fassungen; Metadaten früherer Fassungen bleiben
im geladenen Datensatz erhalten. Die Rundenauswahl bleibt serverseitig. Seit
0.7.0 unterstützt sie auch Einzelstarts mit exakter Fragefassung sowie Thema,
Aufgabenart und vier redaktionelle Stufen. Abbildungen müssen vollständig darstellbar
sein; andernfalls bleibt die normale Bewertung gesperrt. Keine privaten Aufgaben,
Musterlösungen, Quelldateien, Zugangsdaten oder Lernakten sind Teil des Repositorys.

Die bereits veröffentlichte Anmeldung und die Synchronisierung der eigenen
Modellübungen wurden aus der laufenden App wieder übernommen; die größere
Kontokomponente war nur im veröffentlichten Browsercode erreichbar und wurde
inhaltlich rekonstruiert. Die exakten kleinen Clientdateien waren über das
Deployment zugänglich. Gast- und Kontolernstände bleiben getrennt. Die ursprüngliche
Supabase-Lernhistorie wird nicht in ein anderes Fortschrittsschema umgeschrieben.

## Veröffentlichung und Git-Anbindung

Seit 0.8.0 erschließt „Fachwissen nachschlagen“ die vorhandenen Artikel und
Begriffe über `shk_knowledge_catalog` und `shk_knowledge_read`. Der Katalogabruf
erzeugt keine Lernereignisse. Der ausdrückliche Volltextaufruf ist ein
idempotent protokollierter Nachschlagevorgang und kann bei offenen verknüpften
Aufgaben als Hilfe zählen. Lesen ist weder Abgabe noch Beherrschungsnachweis.
Volltexte werden nicht in Browserstorage, URLs oder öffentliche Assets kopiert.
Kurz gültige Freigaben, Maskierung, Konto- und Fensterwechsel gelten auch für
diesen Zugang. Die vorhandenen RPCs und ihre Schutzregeln bleiben erhalten.

Das bestehende Projekt besitzt Domain, Laufzeitvariablen und Rückkehrmöglichkeit
zur vorherigen Bereitstellung. Keine Domains verschieben oder Schlüssel rotieren.
Dateideployments müssen mit dem exakten geprüften Commit in ihren Metadaten
gekennzeichnet werden. `public/release.json` dient zur Kontrolle des ausgelieferten
Releases; ein erfolgreicher Push allein belegt keine Veröffentlichung.

Die GitHub-Verbindung wurde am 23. Oktober 2026 wieder freigegeben und das
bestehende Projekt `werktag-app` mit `nickhein0509-cmyk/werktagshk` verbunden.
Der Verbindungsstatus wurde über Vercel bestätigt. Veröffentlichungen sollen durch
Pushes auf `main` erfolgen; das tatsächlich gestartete Deployment und dessen
Commit müssen anschließend auf Vercel kontrolliert werden.

Projektverwaltung: <https://vercel.com/werktag/werktag-app/settings/git>.
Vite, Node 24, `npm ci`, `npm run build` und das Ausgabeverzeichnis `dist` stehen
in der versionierten Konfiguration. Die vorhandenen Supabase-Variablen bleiben
bestehen. Die frühere 403-Blockade und die fehlende Projektverknüpfung sind behoben.

Die enthaltene SQL-Migration ist ausschließlich eine additive Schnittstelle zum
bereits existierenden Backend, kein vollständiger Datenbankstand. Keine
Datenbankrücksetzung, kein Neu-Seeding und kein blindes `supabase db push` gegen
das gemeinsam genutzte Projekt ausführen.

## Prüfung

Build, Lernlogik und unabhängige Rechenwerte, verlustfreie Sync-Zusammenführung,
private Antwortformate und ablaufende Freigaben werden automatisiert geprüft.
Browserprüfungen verwenden ausschließlich synthetische Konten und abgefangene
Netzwerkaufrufe. Sie testen Serverbewertungsabläufe, Selbstvergleich, Konflikte,
Abmeldung und mobile Eingaben. Sie melden sich nicht in einem echten Lernkonto
an und erzeugen keine echten Versuche. Eine abschließende reale Anmeldung bleibt
beim Kontoinhaber; keine Benutzerkennwörter an Entwicklungswerkzeuge weitergeben.
