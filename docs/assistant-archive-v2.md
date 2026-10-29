# Assistent · Tagesarchiv v2

Produkt **ASSISTENT** · Aufgabe:
[werktag-assistent #11](https://github.com/nickhein0509-cmyk/werktag-assistent/issues/11).
Ausgangsstand ist Plattform-`main`
`27ff92accc4ee79d50a1f6795bed25eb6685f56b`.

## Zweck und Vertrag

Ein Tagesarchiv v2 bewahrt alle Standortpunkte eines abgeschlossenen Berliner
Tages, ordnet sie aber getrennten Recorderjournalen zu. Jedes Journal trägt das
unveränderte Paar `source`/`device`, seine Punkt-IDs, Zähler, Zeitgrenzen und die
daraus berechneten Wege und Aufenthalte. Ein Punkt gehört genau zu einem Journal.
Journale werden stabil nach Recorderkennung, Punkte nach Messzeit, Empfangszeit
und ID sortiert. Der `contentHash` schützt den vollständigen Inhalt
`{points,journals}`.

Dadurch werden zwei Geräte mit gleichen Messzeiten weder verbunden noch in einer
gemeinsamen Entfernung addiert. Ein über Berliner Mitternacht zusammenhängender
Aufenthalt wird weiterhin pro Tag geklippt und als solcher gekennzeichnet. Ein
Gerätewechsel erzeugt immer ein anderes Journal.

## Kompatibilität und Unveränderlichkeit

Vorhandene v1-Archive werden weder migriert noch überschrieben. Ihr beim Import
gespeicherter JSON-Text und ihr GPX-Text werden bytegetreu ausgeliefert. Neue
Archive verwenden `schemaVersion: 2`; auch GPX-Metadaten, Downloadname und der
Antwortheader `X-WerkTag-Archive-Version` kennzeichnen v2 ausdrücklich. Der
private Import akzeptiert weiterhin geprüfte v1-Archive und zusätzlich v2. Ein
falscher Hash, doppelte Punktzuordnung oder abweichende Recorderherkunft wird
vor dem Speichern abgewiesen.

Später eingetroffene Punkte schreiben keinen Archivstand um. Tagesansicht und
Statistik verwenden dann die aktuellen Rohdaten und melden
`archiveSnapshotOlder`; der ursprüngliche Download bleibt erhalten. Stimmen
Rohdaten, Recorder und Journal überein, kann die Statistik den passenden
Recorderstand direkt aus v1 oder v2 lesen.

## Abschnittsverweise

Neue manuelle Tätigkeitsbezüge speichern `source` und `device` zusammen mit
Segment-ID, Zeitgrenzen und Ankerfingerprint. Der Abgleich verwendet nur das
genannte Recorderjournal. Alte Verweise ohne Recorderkennung bleiben lesbar:
bei genau einem Recorder können sie eindeutig zugeordnet werden, bei mehreren
werden sie sichtbar als ungeprüft markiert. Es gibt keine stillschweigende
rückwirkende Umschreibung persönlicher Einträge.

## Bereitstellung und Rückweg

Die Änderung benötigt keine Tabellenspalte und keine Datenmigration; bestehende
`payload`, `original_json` und `gpx`-Spalten tragen beide Versionen. Vor einer
Bereitstellung sind Cloud-/Import-/Statistiktests, Browserabläufe und der
Supabase-Edge-Importgraph zu prüfen. Ein Rückweg nimmt den Quellcommit zurück;
bereits gespeicherte v2-Archive müssen dabei erhalten bleiben und erfordern zum
weiteren Lesen erneut eine v2-fähige Version. Deshalb ist ein Code-Rollback nach
erster produktiver v2-Erzeugung nur zusammen mit dieser Lesekompatibilität sicher.

