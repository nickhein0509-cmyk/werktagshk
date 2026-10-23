# WerkTag Flow 0.3.0 · Prüfungsfokus

## Ausgangspunkt

Diese Änderung führt den vom Nutzer gewählten Flow-Entwurf aus dem Chat
„Neues Design ausarbeiten“ mit dem aktuellen `main`-Stand `c7a4965` zusammen.
Die vollständige Flow-Stylesheet-Grundlage konnte aus dem anderen Chat gelesen
werden; das ältere Upload-ZIP wurde nicht über die neuere Konto- und Fragen-App
kopiert. Petrol, große weiße Schrift, weiße Hauptaktionen und helle Arbeitsflächen
bleiben erhalten. Ein Bild ist für den vom Nutzer priorisierten Prüfungsablauf
keine Voraussetzung.

## Verhalten

- Drei direkte schriftliche Prüfungsschwerpunkte sowie der bisherige private
  Fragenbestand sind erreichbar; alle sechs Navigationsziele auch auf dem Handy.
- 144 eigene Aufgaben, davon 36 neue Fälle. Bestehende 108 Aufgaben, IDs,
  Schlüssel, Gast- und Kontodaten bleiben erhalten. Neue Fälle stehen zuerst.
- Prüfungsbereich, Lernfeld, Suche und Merkliste sind kombinierbar und gemeinsam
  zurücksetzbar. Ergebnisänderungen werden für Screenreader angekündigt.
- Der Lernstand wird für die Karten gemeinsam ermittelt. Neue Datenformate
  werden vor lokalen Schreibzugriffen erkannt und unverändert exportiert.
- App 0.3.0, Flow-Design 2 und Lernstandsformat 1 sind getrennte Versionen.
- Story, Levels, Meilensteine und fachliche Minispiele sind als späteres Vorhaben
  in `AGENTS.md` und `product-direction.md` festgehalten, ohne den Übungsweg zu sperren.

## Validierung vor Veröffentlichung

`npm run check`: Produktionsbuild, 80 Unit-Tests und 21 Chromium-Tests bestanden.
Die Browserprüfungen umfassen private Serverbewertung mit synthetischen Daten,
Entwürfe und Konflikte, Kontentrennung, Abmeldung, Filter, neue Fallantworten,
Import/Export und Schutz höherer Datenformate. Alle sechs Gastansichten und der
Aufgabendialog bestehen die automatisierte WCAG-A/AA-Prüfung bei 1440 und 320 px.
Mobile Überlaufprüfungen bei 320/390 px; zusätzliche visuelle Layoutkontrolle bei
700, 800 und 1024 px. Dies ersetzt keine manuelle fachliche Prüfung oder den
echten Konto-Login durch den Nutzer.

Aufnahmen unter `docs/screenshots`: Desktop, Handy, Aufgabenliste und Aufgabendialog.
Es wurden keine echten Lernantworten oder künstlichen Fortschritte erzeugt.
Die Inhaltsprüfung und ihre Grenzen stehen in `content-notes.md` und den
fachspezifischen Prüfnachweisen.

## Veröffentlichung

Ziel ist ausschließlich das bestehende Vercel-Projekt `werktag-app` mit
`werk-tag.com` und dem bestehenden Supabase-Projekt. Keine neuen Dienste,
Migrationen, Datenimporte oder Konten sind erforderlich. Git-Commit und fertiges
Deployment müssen nach der Integration getrennt geprüft werden.
`/release.json` kennzeichnet den Stand als `werktag-flow-exam-0.3.0`.
