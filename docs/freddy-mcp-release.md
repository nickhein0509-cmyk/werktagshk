# Freddy MCP und Backend-Release · 29. Oktober 2026

Nutzerauftrag: den bereitgestellten Freddy-MCP-Zugang statt der nicht nutzbaren
Personal-API-Anbindung einrichten, alle integrierten Neuerungen veröffentlichen
und Projektstatus aktualisieren. Produkt ASSISTENT, gemeinsam koordinierte
Backend-Veröffentlichung. Basis `0f8b743e8ed305d32e8ca6f04f442c006d75f0c7`,
Branch `fix/freddy-mcp-release-20261029`, eigene Arbeitskopie.

Eigene Dateien: Health-Sync-Verbindungsadapter, Kontoeinrichtung und Formularstil,
additive MCP-Konfigurationsmigration, Node-/PostgreSQL-/Browserregressionen und
Betriebsdokumentation. Keine Änderung persönlicher Zugangsdaten in Git.
Abhängigkeiten: bereits integrierter Release #25, bestehende Eigentümerzuordnung,
Supabase Vault/Cron und die unveränderten 16 unterstützten Health-Metriken.

## Verbindung und Datenvertrag

Die Kontoseite bietet standardmäßig Freddy MCP mit separater Adresse und
Zugriffstoken an. Personal-API-Schlüssel bleiben für vorhandene Verbindungen
unterstützt. Prüfen speichert nichts; Einrichten prüft zuerst die Quelle,
speichert die Verbindung verschlüsselt in Vault und startet den ersten Import.
Adresse und Token bleiben nur bis zur Einrichtung bzw. zum Kontowechsel im
flüchtigen Formularzustand. Beide sind maskiert und werden nicht zurückgegeben.

Der Adapter verwendet MCP Streamable HTTP: Initialize, Initialized,
`get_profile`, `list_metrics` für Apple Health und `query_metrics` für tatsächlich
vorhandene unterstützte Metriken. Es werden keine MCP-Schreibwerkzeuge oder
Zustimmungen ausgeführt. JSON und SSE sind geprüft; Antworten, Laufzeit und
Zieladresse sind begrenzt. Weiterleitungen und fremde Hosts sind ausgeschlossen.
Quelle, Quellenzeiten, Berliner Tagesgrenzen, Tarif-Abfragefenster und
Deduplizierung bleiben erhalten. Abgeschnittene oder mehrdeutige Daten werden
nicht als vollständiger Import gespeichert. Der bestehende Parser prüft
Einheiten, zusammengeführte Tageswerte und tatsächliche VO₂-Messzeitpunkte.

Die Migration ergänzt nur `connection_kind` und erweitert die bestehende
Konfiguration. Geheimnisse bleiben im bisherigen Vault-Speicher. Eigentümer-
prüfung, Service-Rollenrechte, Leases und der einzelne 15-Minuten-Cronjob bleiben
erhalten. Ausschalten löscht keine gespeicherten Health-Tage.

## Veröffentlichungsreihenfolge und Rückweg

1. Vorherige Edge-Quellen und tatsächlichen Zielbestand lesen; nur fehlende
   Migrationen anwenden. Kein erneuter Projektumzug oder Restore.
2. Additive MCP-Migration und bereits geprüfte deaktivierte KI-Budgetmigration.
3. `assistance`, `assistance-native`, `health-sync` und `ai` samt vollständigem
   gemeinsamen Importgraph veröffentlichen; eigene Auth-Prüfung bleibt aktiv.
4. Geprüfte Freddy-Verbindung für die bestätigte bestehende Eigentümerinstallation
   in Vault hinterlegen, den bestehenden Dispatcher aktivieren und echten Import
   anhand Status/Anzahlen prüfen. Keine privaten Messwerte in Git oder CI.
5. Kontoseite über PR integrieren; Vercel-SHA, öffentliche Routen und verweigerte
   unautorisierte Backendzugriffe prüfen.

Der KI-Endpunkt und seine Budgettabellen können bereitstehen, ohne bezahlte
Anbieteraufrufe zu aktivieren. Modell, Preis-/Kostenrahmen, OpenAI-Schlüssel und
konkrete Kontofreigabe sind eigene Voraussetzungen. Die Migration startet
absichtlich deaktiviert. Keine erfundene aktive KI-Funktion behaupten.

Bei einem MCP-Problem den Abgleich über die bestehende Abschaltfunktion pausieren;
Health-Tage bleiben gespeichert. Ein alter Health-Sync-Stand kann verschlüsselte
MCP-Konfiguration nicht lesen: erst pausieren, dann zurücksetzen oder zur
Personal API wechseln. Nach Erzeugung von v2-Archiven muss jede zurückgesetzte
Assistenzfunktion weiterhin v2 lesen können. Additive Datenbankfelder und
KI-Reservierungen nicht zur Rücknahme löschen.

## Tatsächlich ausgeführte Backend-Veröffentlichung

Am 29.10.2026 im bereits produktiven Zielprojekt `mvkksfecimpjnytvbrrb`:

- Fehlende Migrationen einzeln angewendet: `werktag_ai_budget` mit Serverversion
  `20261029061452`, `assistance_health_mcp` mit `20261029061501`.
  Der erste MCP-Versuch kollidierte mit der gerade vergebenen Migrationsnummer;
  die Transaktion wurde zurückgerollt und die vollständig fehlende Migration
  anschließend erfolgreich angewendet. Keine doppelte Tabellenänderung.
- `assistance` v2, `assistance-native` v2, `health-sync` v2 und `ai` v1 veröffentlicht.
  Alle 30 Dateien der vier Importgraphen wurden wieder abgerufen und stimmen
  bytegenau mit den bereitgestellten Quellen überein. Damit sind auch
  Recordertrennung und Archiv-v2 aus Release #25 serverseitig vorhanden.
- Die bestätigte bestehende Installation verwendet jetzt die verschlüsselte
  MCP-Verbindung. Der echte Dispatcherimport meldet `active`,
  `connectionKind=mcp`, `errorCode=null` und einen erfolgreichen Abschluss.
  Genau ein aktiver Cronjob läuft mit `*/15 * * * *`. Vorhandene Tage bleiben
  gespeichert; weder synthetische Messwerte noch neue GPS-Aufzeichnungen angelegt.
- Health-RPCs und KI-Budgetreservierung sind für `anon` und `authenticated`
  nicht ausführbar, für `service_role` schon. Unangemeldete Zugriffe auf
  Native-Status werden mit 401 und Health-Status mit 403 verweigert.
- KI bleibt `enabled=false`, ohne Modell und Kontofreigabe. Nicks bereits
  festgelegte gemeinsame Obergrenze von 10 USD/Monat ist als Gesamt- und
  Kontolimit hinterlegt. Anbieterzugang und Modell-/Preiseinrichtung fehlen.
  `WERKTAG_AI_URL` zeigt für den folgenden Webbuild auf den neuen Endpunkt.

Die Funktionsversionen gelten für dieses Zielprojekt; Versionsnummern im alten
Projekt sind nicht direkt vergleichbar. Dies bestätigt keine vollständige
nachträgliche Datenmigrationsprüfung und keine TestFlight-/iPhone-Abnahme.
