# Bestehenden Fragenbestand wieder anbinden

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
im geladenen Datensatz erhalten. Die Themenrunde wählt Aufgaben auf dem Server,
nicht eine einzelne angeklickte ID. Abbildungen müssen vollständig darstellbar
sein; andernfalls bleibt die normale Bewertung gesperrt. Keine privaten Aufgaben,
Musterlösungen, Quelldateien, Zugangsdaten oder Lernakten sind Teil des Repositorys.

Die bereits veröffentlichte Anmeldung und die Synchronisierung der eigenen
Modellübungen wurden aus der laufenden App wieder übernommen; die größere
Kontokomponente war nur im veröffentlichten Browsercode erreichbar und wurde
inhaltlich rekonstruiert. Die exakten kleinen Clientdateien waren über das
Deployment zugänglich. Gast- und Kontolernstände bleiben getrennt. Die ursprüngliche
Supabase-Lernhistorie wird nicht in ein anderes Fortschrittsschema umgeschrieben.

## Veröffentlichung und Git-Anbindung

Das bestehende Projekt besitzt Domain, Laufzeitvariablen und Rückkehrmöglichkeit
zur vorherigen Bereitstellung. Keine Domains verschieben oder Schlüssel rotieren.
Dateideployments müssen mit dem exakten geprüften Commit in ihren Metadaten
gekennzeichnet werden. `public/release.json` dient zur Kontrolle des ausgelieferten
Releases; ein erfolgreicher Push allein belegt keine Veröffentlichung.

Zum Zeitpunkt der Prüfung war `werktag-app` ohne Git-Verknüpfung. Vercels Zugriff
auf die GitHub-Verzeichnisse antwortete mit HTTP 403 `github_response_error`.
Der verfügbare Vercel-Connector kann ein vorhandenes unverbundenes Projekt nicht
wieder mit Git verbinden. Nach erneuter Freigabe der GitHub-Installation:

1. Im bestehenden Projekt unter
   <https://vercel.com/werktag/werktag-app/settings/git> GitHub verbinden.
2. `nickhein0509-cmyk/werktagshk` auswählen, Produktionsbranch `main`.
3. Vite, Node 24, `npm ci`, `npm run build`, Ausgabeverzeichnis `dist` verwenden.
4. Bestehende Supabase-Variablen beibehalten und das nächste Deployment prüfen.

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
