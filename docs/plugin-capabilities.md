# Plugins und lokale Skills

Stand: 23. Oktober 2026. Diese Übersicht beschreibt die für den aktuellen Ausbau
tatsächlich verfügbaren und genutzten Fähigkeiten. Frühere fehlende Verbindungen
sind keine aktuelle Aussage über den inzwischen angebundenen Kontobestand.

| Fähigkeit | Verfügbarer Stand | Nutzen im Lernbuddy-Projekt |
| --- | --- | --- |
| Plugin Management | Skill und aktuelle Tool-Metadaten verfügbar; passende vorhandene Verbindungen ausgewählt | Bestehende Werkzeuge verwenden; keine Installation, Kostenübernahme oder Berechtigungsänderung daraus ableiten. |
| `shk-lernwerkzeuge:shk-pruefungswerkstatt` | Skill gelesen, einschließlich der Vorgaben zu Aufgabenpaketen | Nachvollziehbare Aufgabenherkunft, klare Lernziele, getrennte Aufgaben und redaktionelle Lösungen, ehrliche Zeitvorschläge. Für echte Aufgabenpakete gilt der vollständige Plugin-Workflow. |
| `shk-lernwerkzeuge:shk-quellenpruefung` | Skill gelesen, einschließlich des Prüfnachweises | Aussagen einzeln und mit belegtem Umfang prüfen. Extraktion, Lesen und fachliche Prüfung bleiben getrennt. Eine fehlende Quelle bleibt offen. |
| WerkTag SHK Werkstatt | Quellencheck- und Aufgabenwerkstatt-Skills gelesen | Eigene Modelle, Einheiten, nachvollziehbare Herleitungen und enge Quellenbefunde. Keine App-KI und keine automatische Lernbewertung. |
| Supabase | Vorhandenes Projekt und private Tabellen/RPC-Verträge tatsächlich gelesen; Integration geprüft | Bestehende Fragen, Artikel, Begriffe und Lernfelder unter Anmeldung und Eigentumsregeln erhalten. Keine neue Datenbank, kein Neu-Seeding, keine geheimen Schlüssel im Client. |
| Remote Desktop Commander | Kanonische SHK-Regeln und Wissensbasis auf dem bestätigten Gerät zugänglich; gespeicherte Nachweise rückgelesen | Bestehende private Kontext- und Quellenablage pflegen. Windows-Pfade bleiben von Cloud-Dateien getrennt; kein vollständiges Gerätebackup behaupten. |
| GitHub und Vercel | Vorhandenes Repository und Hostingprojekt mit zugeordneten Domains bestätigt | Geprüften Commit über den bestehenden Freigabeweg veröffentlichen und anschließend Commit, Deployment und ausgeliefertes Release kontrollieren. Ein Push allein ist kein Nachweis. |
| Exa | Gezielt eine Herstellerseite zur Begriffsabgrenzung bei Wärmepumpen gesucht und vollständig abgerufen | Konkrete Primärpassage für einen redaktionellen Befund; kein vollständiger Hersteller- oder Normenreview. |
| Firecrawl | Aktueller Versuch wegen null verbleibender Credits nicht ausgeführt | Kein Upgrade oder wiederholter Fehlversuch; für den konkreten Quellenabruf funktionierenden Exa-Zugang verwendet. |
| `build-ios-apps` | Native iOS-Skills vorhanden | Für spätere native iOS-Arbeit relevant. Dieser Linux-Webworkflow bietet keinen bestätigten Xcode-/Simulatorzugriff; die Skills wurden nicht als Web-Designwerkzeuge ausgegeben. |
| Cloud Environment und Onboarding | Laufzeit- und Konfigurationswerkzeuge vorhanden | Installation, Start, lokale Funktionsprüfung und wiederverwendbare Umgebungskonfiguration. Ein gespeicherter Entwurf ist keine Veröffentlichung. |

Die SHK-Skills sind redaktionelle Werkzeuge. Ihr Vorhandensein stellt keine
fachliche Freigabe neuer Aufgaben dar und erlaubt nicht automatisch den Import
privater Materialien, Änderungen echter Lernergebnisse oder eine Veröffentlichung.
Die ursprünglichen Plugin-Skills bleiben die maßgebliche Anleitung, wenn genau
ihre Quellenprüfung oder Aufgabenpaket-Erstellung beauftragt wird.

## Neue Skills im Repository

Die folgenden Dateien wurden für dieses Projekt abgeleitet. Sie werden mit dem
Repository versioniert und sind **nicht global installiert**:

- [SHK-Inhaltsworkflow](../.agents/skills/shk-content-workflow/SKILL.md): eigene
  Lernbeispiele, belegte Herkunft, sinnvolle Aufgaben- und Lösungsansichten sowie
  unverfälschter Lernfortschritt.
- [SHK-Oberflächendesign](../.agents/skills/shk-interface-design/SKILL.md): technische
  Werkstattästhetik in Petrol und Kupfer, nutzbare Lernabläufe, mobile Darstellung
  und zugängliche Bedienelemente.

Der Inhaltsworkflow übernimmt die belegten redaktionellen Prinzipien der beiden
SHK-Plugins. Der Designskill verbindet diese Produktanforderungen mit eigenen
Web-Designregeln. Er wurde nicht aus einem unzugänglichen Designplugin exportiert.
Keine der Dateien erzeugt selbst eine Integration, synchronisiert frühere
Lerndaten oder ersetzt einen fachlichen Quellencheck.

## Quellen- und Datenabgrenzung

Die 204 eigenen Lernbeispiele bleiben ein eigener Bestand. Der inzwischen
angebunde private Fragen- und Wissensbestand nutzt seine bestehenden Identitäten,
Quellenvermerke und Serverregeln. Die App ist keine vollständige Wiederherstellung
aller früheren Anwendungen oder lokalen Pakete. Eigene Beispiele dürfen nicht als
offizielle Prüfungsaufgaben oder vollständig normgeprüfte Inhalte bezeichnet werden.
Persönliche Lernergebnisse beginnen ohne importierte Nachweise bei null oder
unbekannt. Testdaten bleiben von echten Lernereignissen getrennt.

Private Prüfungen, Bücher, Lösungsschlüssel und persönliche Lernhistorien gehören
nicht in öffentliche Repositorydateien oder Web-Assets. Ein späterer Import
braucht eine konkrete Quelle, die passende Berechtigung und einen überprüfbaren
Importweg. Ein clientseitig ausgeblendeter Lösungstext ist kein Zugriffsschutz.
Der vorhandene private Wissens-Reader lädt deshalb nur nach ausdrücklichem Öffnen
über den geschützten Serverweg. Katalogmetadaten, Nachschlageereignisse und echte
Lernversuche bleiben unterschiedliche Vorgänge.
