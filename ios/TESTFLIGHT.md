# WerkTag 0.2 · TestFlight einrichten

Nick hat Apple Developer und wünscht zuerst TestFlight. Es gibt noch keinen
App-Eintrag in App Store Connect. Die folgenden Schritte verbinden das bestehende
Apple-Team mit dem vorbereiteten Release; Schlüssel niemals in Chat oder Git einfügen.

## Einmalige Apple-Einrichtung

1. In [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list)
   einen expliziten App-Identifier `com.werktag.assistant` mit **HealthKit** anlegen.
   Wenn diese ID nicht registrierbar ist, zuerst eine eigene ID festlegen und die
   Projekt-, Hintergrundtask- und CI-Konfiguration gemeinsam aktualisieren.
2. In [App Store Connect](https://appstoreconnect.apple.com/apps) eine iOS-App
   **WerkTag**, Sprache **Deutsch**, obige Bundle-ID, SKU `werktag-assistant-ios`
   anlegen. Noch keine App-Store-Veröffentlichung einreichen.
3. Ein **Apple Distribution**-Zertifikat mit privatem Schlüssel als verschlüsselte
   `.p12` exportieren und ein **App Store Connect**-Provisioning-Profil für diese
   App erstellen. Kein Entwicklungs-/Ad-hoc-Profil verwenden. Bestehende gültige
   Zertifikate wiederverwenden; keine fremden Zertifikate widerrufen.
4. Unter App Store Connect → Benutzer und Zugriff → Integrationen einen Team-API-
   Schlüssel mit für Uploads ausreichender Rolle (App Manager) erstellen. Die `.p8`
   nur geschützt aufbewahren. Key-ID, Issuer-ID und Team-ID sind Konfigurationswerte.
5. Im [GitHub-Repository](https://github.com/nickhein0509-cmyk/werktagshk/settings/environments)
   die Umgebung **TestFlight** einrichten. Variablen und Secrets wie unten setzen.
   Ein Umgebungsschutz kann ergänzend verwendet werden; er ist keine bereits
   vorhandene technische Freigabe.

| GitHub-Typ | Name | Inhalt |
| --- | --- | --- |
| Variable | `APPLE_TEAM_ID` | Apple-Team-ID, zehn Zeichen |
| Variable | `ASC_KEY_ID` | App-Store-Connect-Key-ID |
| Variable | `ASC_ISSUER_ID` | App-Store-Connect-Issuer-ID |
| Secret | `ASC_PRIVATE_KEY_P8` | Vollständiger privater `.p8`-Schlüssel |
| Secret | `IOS_DISTRIBUTION_P12_BASE64` | Base64-Inhalt der verschlüsselten `.p12` |
| Secret | `IOS_DISTRIBUTION_P12_PASSWORD` | Nicht leeres Exportpasswort der `.p12` |
| Secret | `IOS_APP_STORE_PROFILE_BASE64` | Base64-Inhalt des App-Store-Profils |

Auf dem eigenen Mac kann `base64 -i datei.p12 | pbcopy` den Inhalt direkt für das
Secret-Feld kopieren; für das Profil entsprechend. Keine Schlüssel in Terminal-
Screenshots, Issue-Anhänge oder öffentliche Dateien übernehmen.

## Bereitstellung

Für den am 29.10.2026 beauftragten Wechsel auf `mvkksfecimpjnytvbrrb` zuerst die
[vollständige Datenmigration](../docs/supabase-project-migration.md) und
Kontozuordnung prüfen. Noch ist keine Übertragung bestätigt. Ein TestFlight-Upload
kopiert weder Supabase-Benutzer noch ihre Aufzeichnungen ins neue Projekt.

Zuerst das [native Backend](README.md#backend-bereitstellen) bereitstellen und mit
dem zugeordneten WerkTag-Konto prüfen. Die anonyme CI-Probe prüft nur Erreichbarkeit
und Ablehnung ungültiger Tokens, nicht die vollständige Kontointegration.

Der Workflow **iOS TestFlight** (`.github/workflows/ios-testflight.yml`) wird von
`main` mit einem vorhandenen `ios-v…`-Tag gestartet. Er akzeptiert nur einen in
`main` enthaltenen Commit mit erfolgreichen Plattform- und iOS-Pushchecks auf
exakt diesem SHA. Er prüft Team, Bundle-ID, HealthKit, Ablaufdatum und Profiltyp,
archiviert mit manueller Signierung und lädt die IPA über Apples API hoch.
Buildnummern enthalten Workflow-Lauf und Versuch, damit ein erneuter Upload eine
neue Buildnummer erhält. Signierschlüssel werden anschließend entfernt.

Ein angenommener Upload ist noch keine fertige TestFlight-Verteilung. In App Store
Connect auf erfolgreiche Verarbeitung warten, fehlende Compliance-Angaben prüfen,
eine interne Gruppe **WerkTag intern** anlegen und Nick sowie den konkreten Build
zuweisen. Erst dann den Installationslink aus TestFlight weitergeben. Externe
Tester und Beta-App-Review gehören nicht automatisch zu diesem ersten internen Test.

## Beta-Beschreibung / Was testen

WerkTag hält bewusst gestartete Wege und freigegebene Health-Tageswerte in deiner
persönlichen Assistenz fest. Die App nutzt dein bestehendes WerkTag-Konto. Bitte
zuerst Anmeldung, Tagesverlauf und Start/Stop der Aufnahme testen. Danach im
Flugmodus aufzeichnen, die App neu öffnen und nach Wiederverbindung die bestätigte
Übertragung prüfen. Bei entzogenen Berechtigungen müssen Datenlücken verständlich
bleiben. iOS kann Hintergrundaufzeichnung unterbrechen.

Keine persönlichen Messwerte oder Zugangsdaten in öffentliche Fehlerberichte
kopieren. Geräteabnahme: [Checkliste](README.md#geräteabnahme).

## Datenschutzangaben vor Verteilung prüfen

Das mitgelieferte `PrivacyInfo.xcprivacy` erklärt UserDefaults für eigene
App-Einstellungen (CA92.1), keine Werbeverfolgung und Kontofunktionalität als Zweck.
E-Mail/Konto-/Geräte-ID, freigegebene präzise Standorte sowie Gesundheits-/Fitnesswerte
werden kontogebunden an WerkTag übertragen. Standort und Health benötigen getrennte
bewusste Freigaben; native Health-Werte werden nicht mit Freddy summiert.

Die App nutzt ausschließlich die Standardverschlüsselung der Betriebssystem-
Netzwerkdienste; `ITSAppUsesNonExemptEncryption` ist deshalb false. Das Manifest
ersetzt weder die Angaben in App Store Connect noch eine veröffentlichte
Datenschutzerklärung. Verantwortlichenkontakt, Support- und Datenschutz-URL sowie
Aufbewahrungs-/Löschverfahren vor einer öffentlichen oder externen Verteilung
verbindlich ergänzen. Ein physisches iPhone wurde durch Simulatorprüfungen nicht
abgenommen.
