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
- `POST ?route=configure` with `{ "apiKey": "<private Freddy key>" }`:
  validates the existing Apple Health source and API access before storing the
  key in Vault, installing the single `*/15 * * * *` cron, and attempting the
  first complete import.
- `POST ?route=disable`: pauses further synchronization and keeps stored data.

The cron calls `POST ?route=sync` with a dedicated Vault secret on
`x-health-cron-secret`. The secret is generated during configuration and is never
sent to a browser. No API keys, values, provider bodies or tokens are logged.
`pg_net` briefly holds the cron header in its request queue. The production
baseline was checked: PUBLIC, anon and authenticated have no queue grants. No
networking grants are changed by this schema. The source's API key remains in Vault.

Without a configured key there is no cron job created by this schema. The UI
must show "Noch nicht aktiviert" unless `configured`, `enabled` and `cronActive`
are true. Even then an absent `lastSuccessAt` or non-null `errorCode` means the
first full import has not succeeded or a later attempt needs attention.

`lastAttemptAt` is the cloud polling attempt; `lastSuccessAt` is a complete
validated import; `sourceLastSyncAt` and `sourceLastDataAt` describe the source.
The 15-minute schedule does not guarantee new iPhone measurements every 15 minutes.
Apple Health background delivery and locked-device access remain controlled by
iOS. Existing OwnTracks and iPhone Shortcuts are unchanged.

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
