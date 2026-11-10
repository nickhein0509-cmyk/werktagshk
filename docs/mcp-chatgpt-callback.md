# ChatGPT-Rücksprungadresse für Nick Cloud MCP

Auftrag vom 10.11.2026: bestehenden privaten Nick Cloud MCP mit ChatGPT verbinden.
Bereich PLATTFORM. Basis `557fb57dbd33f8468d0676133d42f88d9f8ca25e`,
Branch `fix/chatgpt-mcp-callback-20261110`, separate Arbeitskopie.
Eigene Dateien: OAuth-Helfer, Zustimmungsanzeige, Unit-/Browser-Tests und dieses Protokoll.
Abhängigkeit: integrierter WerkTag-PR #34 und bereitgestellter Nick-Cloud-PR #21.
Offene PRs #33 und #35 werden nicht mitgenommen.

Der native ChatGPT-Verbindungsdialog erzeugte die verbindungsspezifische Adresse
`https://chatgpt.com/connector/oauth/mrt8uuQriKVd`. Die bestehende Zustimmungsseite
akzeptierte ausschließlich den alten Callback und wies deshalb die echte Anfrage
nach erfolgreicher Anmeldung ab.

Beide exakt registrierten Adressen werden jetzt akzeptiert. Andere Verbindungen
unter derselben Domain, fremde Domains, Pfadanhänge, Fragmente und Zugangsdaten
in URLs bleiben ausgeschlossen. Die Bindung an den vorhandenen Client bleibt
erhalten. Die echte ChatGPT-Anfrage enthält zusätzlich zu `openid offline_access`
den OpenID-Scope `email` zur Kontozuordnung. Nur dieser zusätzliche Scope wird
akzeptiert und auf der Zustimmungsseite erklärt; `profile`, `phone` und
Schreibberechtigungen werden weiterhin abgewiesen. Keine allgemeine Domainfreigabe
und keine zusätzlichen Firestore-Datenbereiche oder Schreibrechte.

Am vorhandenen öffentlichen Supabase-Client wurde die neue Adresse zusätzlich
zur alten Adresse registriert. Client-ID, PKCE/Token-Auth `none`, Grant-Typen,
Besitzerprüfung und Token-Hook bleiben unverändert. Kein neuer OAuth-Client und
keine neuen Zugangsschlüssel. Der ChatGPT-Anschluss wurde angelegt; die vollständige
Autorisierung und echte MCP-Aufrufe werden erst nach Live-Prüfung bestätigt.

Rückweg: diesen Quelländerungscommit zurücknehmen und nur die zusätzliche
Callback-Adresse aus der bestehenden Clientregistrierung entfernen. Den alten
Callback und alle bestehenden Daten erhalten.
