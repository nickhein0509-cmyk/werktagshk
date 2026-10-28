# Private Health synchronization

This adapter reuses the existing Freddy-to-Health day parser. It retrieves only
the allowed normalized Apple Health metrics, follows all result pages, and merges
the result transactionally into the existing installation's Health days. It never
replaces GPS history or deletes missing metrics. VO2 observations retain their
source timestamp and device.

Apply `supabase/migrations/20261028131907_assistance_cloud_storage.sql` first, then
`supabase/migrations/20261028131922_assistance_health_cloud_sync.sql`. Deploy the `health-sync` function with
`verify_jwt=false`. This is necessary for the private cron webhook. The handler
independently verifies account JWTs with Supabase Auth and checks installation
ownership, or verifies the dedicated cron secret through a service-only RPC.
The runtime uses its built-in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

The protected Vercel proxy forwards the account bearer token and supports:

- `GET ?route=status`: configuration, schedule and freshness metadata.
- `POST ?route=check` with `{ "apiKey": "<private Freddy key>" }`:
  checks only the existing Apple Health source and supported metric catalogue.
  Returns connection/freshness metadata and the documented plan history bounds,
  with no health values, key storage, import or schedule change.
- `POST ?route=configure` with `{ "apiKey": "<private Freddy key>" }`:
  validates the existing Apple Health source and API access before storing the
  key in Vault, installing the single `*/15 * * * *` cron, and attempting the
  first complete import.
- `POST ?route=disable`: pauses further synchronization and keeps stored data.
- `POST ?route=refresh` with `{}`: the authenticated owner can request one
  complete import using the already stored key. It does not replace the key,
  enable a paused connection or change the schedule. A recent-attempt check
  enforces a 60-second wait and the existing database lease prevents overlapping
  imports. An existing lease or superseded import is not called successful.

All owner mutations require the configured public Origin (by default
`https://werk-tag.com`) as well as a JWT for the installation owner. The cron
endpoint retains its dedicated secret authentication. Manual request bodies are
bounded and additional refresh properties, including replacement keys, are rejected.

The cron calls `POST ?route=sync` with a dedicated Vault secret on
`x-health-cron-secret`. The secret is generated during configuration and is never
sent to a browser. No API keys, values, provider bodies or tokens are logged.
`pg_net` briefly holds the cron header in its request queue. The production
baseline was checked: PUBLIC, anon and authenticated have no queue grants. No
networking grants are changed by this schema. The source's API key remains in Vault.

Without a configured key there is no cron job created by this schema. The UI
must distinguish missing configuration, a paused connection, a missing schedule,
an unconfirmed first import and a failed import. "Automatischer Abgleich aktiv"
requires `configured`, `enabled`, `cronActive`, a confirmed `lastSuccessAt`, and
no current error. Provider failures are mapped to fixed diagnostic messages;
provider response bodies and secrets are never returned to the browser.

The Freddy plugin in ChatGPT and the Personal API used by WerkTag are separate
connections. A healthy Apple Health source does not establish that WerkTag has a
Personal API key. The UI exposes a non-storing key check and an explicit setup
action. A lost setup response is followed by a status read rather than a false
"invalid key" diagnosis. A key remains only in the password input's memory
during checking and is cleared when submitted for setup or the account changes.

`lastAttemptAt` is the cloud polling attempt; `lastSuccessAt` is a complete
validated import; `sourceLastSyncAt` and `sourceLastDataAt` describe the source.
The 15-minute schedule does not guarantee new iPhone measurements every 15 minutes.
Apple Health background delivery and locked-device access remain controlled by
iOS. Existing OwnTracks and iPhone Shortcuts are unchanged.

The importer requests seven Berlin calendar days and respects the provider's
plan window, including Free's seven-day response bounds. Previously stored
WerkTag days are not deleted when the provider's query window advances.
Provider identifiers are normalized to `APPLE_HEALTH`; no other provider is
silently accepted as Apple Health. Full pagination remains required before any
transactional import.

Run the focused offline checks with:

```sh
node --test supabase/functions/health-sync/health-sync.test.mjs
```

Official contracts checked on 28 October 2026:

- https://freddy.coach/api/openapi.json
- https://freddy.coach/help/personal-api
- https://freddy.coach/help/connect-apple-health
- https://supabase.com/docs/guides/functions/schedule-functions
- https://supabase.com/docs/guides/database/vault

The live Freddy response contract must still be verified with a real owner key
before activation can be described as successful. An HTTP success or key
validation alone does not prove a complete data import.
