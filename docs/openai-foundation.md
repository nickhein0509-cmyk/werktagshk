# OpenAI-Grundlage für WerkTag

Technische Vorbereitung für [Plattformaufgabe #10](https://github.com/nickhein0509-cmyk/projektzentrale/issues/10).
Dieser Stand ergänzt einen gemeinsamen Serverzugang. Er aktiviert keine KI,
veröffentlicht keine Datenbankänderung und enthält noch keine Lernhilfe- oder
Assistenzoberfläche. Die Produktpakete bleiben [Lernen #2](https://github.com/nickhein0509-cmyk/werktag-lernen/issues/2)
und [Assistent #8](https://github.com/nickhein0509-cmyk/werktag-assistent/issues/8).

## Vertrag für die späteren Oberflächen

`POST /api/ki` verwendet den bestehenden Supabase-Bearer des angemeldeten Kontos,
`Content-Type: application/json` und den exakten WerkTag-Origin. Eine gültige
Anmeldung allein genügt nicht: Konten und Produkte müssen ausdrücklich in
`werktag_ai_access` freigegeben sein. Die bestehende Assistenz-Cookie wird an
diesen Dienst weder weitergegeben noch aus dessen Antwort übernommen.

```json
{
  "product": "lernen",
  "confirmed": true,
  "selection": [{ "id": "synthetic-example", "text": "Wie viele Liter sind 1 m³?" }],
  "question": "Bitte erkläre die Umrechnung."
}
```

`lernen` erlaubt genau eine Aufgabe, `assistent` ein bis acht ausgewählte Notizen.
IDs sind lokale Quellenverweise, keine Schlüssel für einen serverseitigen Abruf.
Es findet kein Nachladen von Aufgaben, Kontodaten, GPS, Health oder Katalog statt.
Die Auswahl enthält zusammen mit der optionalen Frage höchstens 12.000 UTF-8-Bytes;
die gesamte Anfrage höchstens 32 KiB. Andere Felder, leere/mehrdeutige IDs und
unbestätigte Anfragen werden zurückgewiesen. Der Server leitet die Konto-ID
ausschließlich aus der von Supabase Auth geprüften Sitzung ab.

Erfolg: `{ ok: true, product, text, sourceIds, generatedBy: "openai" }`.
Fehler: `{ ok: false, error, message }` mit verständlichem deutschem Text.
Gatewayfehler können den bestehenden Vertrag `{ error: "deutscher Text" }` liefern.
401 bedeutet erneute Anmeldung, 403 fehlende Freigabe/Origin, 400/413 ungültige
Auswahl, 429 lokales Limit/Anbieterauslastung, 503 fehlende Einrichtung oder
vorübergehender Fehler, 504 Zeitüberschreitung. Unvollständige Antworten werden
nicht als Erklärung ausgegeben. Es gibt keine automatische Wiederholung.

Die späteren Oberflächen müssen KI-Ausgaben kennzeichnen, Text sicher rendern,
bei Fehlern die Auswahl erhalten, die Lernhilfe im Prüfungsmodus ausblenden
und vorgeschlagene Aufgaben erst nach ausdrücklicher Übernahme speichern.
Der Server schreibt selbst keine Notizen, Aufgaben oder Lernstände. Der
Prüfungsmodus ist weiterhin eine vom Nutzer gesteuerte Übung, kein geschütztes
Prüfungssystem; `confirmed` dokumentiert eine explizite Clientaktion, keinen
unabhängigen Nachweis über den Inhalt eines beliebigen HTTP-Clients.

## Datenfluss und Anbieter

WerkTag → eigener API-Gateway → Supabase-Edge-Funktion `ai` → Supabase Auth →
atomare Datenbankreservierung → OpenAI Responses API → bereinigte Textantwort.
Anbieteraufrufe senden nur Auswahl, Frage und feste produktbezogene Anweisungen.
Es gibt keine Tools, Konversationshistorie, automatische Datensammlung oder
Weitergabe der WerkTag-Konto-ID an den Anbieter. `store: false` deaktiviert die
Speicherung des Response-Objekts; dies ist keine Zusage vollständiger Löschung
aller betrieblichen Anbieterlogs. Anbieterantworten/Schlüssel werden nicht
geloggt. Fehlerdetails werden auf feste Fehlercodes begrenzt.

Vertrag geprüft anhand der offiziellen [Responses-Referenz](https://developers.openai.com/api/reference/resources/responses/methods/create)
und [Dokumentation zur Speicherung](https://developers.openai.com/api/docs/guides/conversation-state).
Diese Integration verwendet einen OpenAI-Platform-API-Schlüssel, keine
ChatGPT-Abonnementanmeldung. Sie setzt keine Modellnamen oder aktuellen Preise voraus.

## Einrichtung: zunächst ausgeschaltet

1. Nick legt Projekt und Kostenrahmen in seiner [Notion-Aufgabe](https://app.notion.com/p/408d53b0960681aa9487c39beda1d89e)
   fest. Zugang ausschließlich über den sicheren Einrichtungsweg des
   OpenAI-Developers-Plugins; Schlüssel niemals in Chat, Git oder Notion kopieren.
2. Additive Migration `20261029023000_werktag_ai_budget.sql` am vorgesehenen
   Supabase-Projekt einspielen. Sie setzt `enabled=false`, beide Budgets auf 0
   und gewährt keinem Konto Zugriff. Keine vorhandenen Produktdaten werden verändert.
3. Edge-Funktion `ai` mit `verify_jwt=false` bereitstellen. Sie prüft den Bearer
   selbst bei `/auth/v1/user`, bevor Budget oder Anbieter angesprochen werden.
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` und
   `ASSISTANCE_PUBLIC_ORIGIN` sind ausschließlich geschützte Laufzeitkonfiguration.
4. Den Vercel-Serverwert `WERKTAG_AI_URL` auf die feste HTTPS-URL der Edge-Funktion
   setzen, ohne Query, Fragment oder Zugangsdaten. `ASSISTANCE_PUBLIC_ORIGIN`
   muss am Gateway und der Edge-Funktion übereinstimmen. Keine `VITE_`-Schlüssel.
5. Administrativ den genauen Responses-kompatiblen Textmodellnamen, geprüfte
   Preisobergrenzen, Ausgabelimit, Monatsbudgets und Minutenlimit in
   `werktag_ai_policy` setzen. Modell und Preise gehören zusammen; Änderungen
   nur nach erneuter Preisprüfung. Die vorhandene Zeile bleibt bis dahin deaktiviert.
6. In `werktag_ai_access` nur die vorgesehenen echten Konto-UUIDs und ausdrücklich
   gewünschten Produkte freigeben. Dann nach festgelegtem Kostenrahmen aktivieren
   und einen bewusst ausgelösten kleinen Test über den normalen Kontoweg prüfen.

Ohne diese Schritte bleibt die tatsächliche Verbindung ungeprüft. Ein lokaler
Mocktest ist kein Live-Aufruf. Es ist keine Browseroberfläche zum Bearbeiten von
Preisen, Freigaben oder Schlüsseln enthalten.

## Nutzungsbudget

Alle Beträge sind **Mikro-US-Dollar**: 1.000.000 Einheiten entsprechen 1 USD.
`monthly_micro_usd` begrenzt alle Konten zusammen, `user_monthly_micro_usd`
jedes Konto über beide Produkte. Das Monatsfenster wechselt um 00:00 UTC am
Monatsersten. `user_requests_per_minute` ist ein gleitendes gemeinsames Kontolimit.

Vor jedem Anbieteraufruf reserviert eine einzelne Datenbanktransaktion:

```text
ceil(Eingabeobergrenze × input_micro_usd_per_token
     + max_output_tokens × output_micro_usd_per_token)
```

Die Eingabeobergrenze besteht aus UTF-8-Bytes von Auswahl, Frage und Anweisungen
plus 1024 Einheiten Protokollreserve. Die Preisfelder müssen mindestens die
tatsächlichen Preise des eingesetzten Modells bei Standard-Service abdecken,
einschließlich gegebenenfalls abweichender Cache-Schreibpreise. Preise in
USD pro Million Tokens haben denselben Zahlenwert wie Mikro-USD pro Token.
Es werden keine Werkzeuge, Bilder oder sonstige separat berechnete Leistungen
verwendet; `max_output_tokens` begrenzt auch Reasoning-Ausgabe.

Die zentrale Policysperre serialisiert Reservierungen über mehrere Instanzen.
Nicht ausreichendes Budget verhindert den Aufruf. Reservierungen bleiben auch
bei Timeout, Ablehnung und unbekanntem Ausgang verbraucht; es gibt keine riskante
Erstattung oder automatische Wiederholung. Dadurch ist das verfügbare Budget
bewusst konservativer als die tatsächliche Rechnung. Die Tabelle enthält nur
Anfrage-ID, Konto, Produkt, reservierten Betrag und Zeitpunkt, keine Inhalte.
Beim Löschen eines Kontos bleibt der globale Betrag ohne Kontoverknüpfung erhalten.

Die harte Sperre gilt für die **konfigurierten Reservierungsbeträge**. Sie ersetzt
keine Anbieterabrechnung und keine Prüfung geänderter Modellpreise oder Nutzung
des gleichen API-Projekts außerhalb von WerkTag. Ein eigenes Projekt und ein
Abgleich der Anbieterabrechnung bleiben nötig. Budgetwarnungen beim Anbieter
sind nicht automatisch harte Ausgabensperren.

## Prüfungen und Rückweg

`npm run check` enthält die neuen Node-Tests automatisch über `test:cloud-assistance`.
Gezielt: `node --test supabase/functions/ai/*.test.mjs`.
Die SQL-Prüfungen führen die echte Migration in eingebettetem PostgreSQL (PGlite)
aus: Rollenrechte, Konten-/Produktgrenzen, Monats-/Minutenlimits, Rundung,
Mehrfachanfragen und Kontolöschung. PGlite serialisiert Verbindungen; diese
Prüfung ersetzt keinen separaten Mehrprozess-Lasttest des bereitgestellten Postgres.
Provider und Auth sind im Handler-Test ausschließlich synthetische Antworten.

Abschalten: `enabled=false` setzen und `WERKTAG_AI_URL` entfernen. Bereits
zugelassene Anfragen können noch enden; bei Bedarf den API-Zugang zusätzlich
beim Anbieter widerrufen. Bestehende Appbereiche benötigen den KI-Dienst nicht.
Reservierungen zur Nachvollziehbarkeit erhalten; keine privaten Produktdaten
löschen. Migration, Edge-Funktion, Gateway und tatsächlichen Live-Test getrennt
im PR dokumentieren.
