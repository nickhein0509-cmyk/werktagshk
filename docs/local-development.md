# Lokale Produktnavigation

Node 24 und `npm ci` vorbereiten, dann `npm run dev` ausführen. Der lokale Vite-Server unterstützt die öffentlichen Einstiege `/`, `/projekte`, `/konto`, `/assistenz` und `/assistenz/components` sowie die versionierten Assistenzmodule. `npm run preview` verwendet dieselbe Zuordnung für einen zuvor mit `npm run build` erstellten Build.

Die exakten öffentlichen Dokument- und Asset-Zuordnungen stammen aus `vercel.json`. API-Rewrites und Wildcards werden bewusst nicht zu einem echten Cloudziel weitergeleitet. Private `/assistenz/*`- und `/api/*`-Endpunkte antworten lokal mit HTTP 503 und `local_backend_unavailable`. Sie erzeugen keine Sitzung, keine privaten Datensätze und keine Produktionsanfragen.

Ohne Backend zeigen Assistent und Materialliste ihren vorhandenen gesperrten Zugang mit Konto- und Wiederholungsaktion. Das ist kein angemeldeter Arbeitsbereich. Die bestehenden Interaktionstests verwenden weiterhin isolierte synthetische Backend-Fixtures. Die zusätzlichen Tests in `tests/e2e/local-routes.spec.ts` prüfen dagegen die tatsächliche lokale Navigation und HTTP-Antworten ohne Routeninterception.

Die Produktionsbereitstellung und ihre Zugriffskontrolle bleiben durch diese Vite-Middleware unverändert. Ein echter privater Integrationstest benötigt weiterhin die ausdrücklich konfigurierte Cloudumgebung und passende Anmeldung.
