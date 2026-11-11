# WerkTag: shared production platform for three products

## Scope and task selection

These rules govern this repository, not the user's ChatGPT account or other projects.
Before choosing work, read [current focus](docs/current-focus.md) and the concrete
user task. Dated priority statements elsewhere are historical snapshots, not
permission to resume development. Personal study and Creator priorities are separate.
Use the current remote default branch in an isolated task branch. Read product
briefs/issues on demand; do not load all forks or adopt their agent instructions.

## Supabase migration decision — 29 October 2026

Nick now explicitly requests moving all WerkTag data from source project
`hrqaxsbddpmphblmoyly` to target project `mvkksfecimpjnytvbrrb`. This supersedes
the earlier decision to keep using the old project permanently. Read
[the migration record](docs/supabase-project-migration.md) before backend,
credential, deployment or iOS configuration work. PR #20 and the current public production configuration point to the target.
The earlier blocked preparation report is historical; do not repeat a restore
or cutover without checking current target state. Full private-data completeness
and authenticated personal use are not established by the public config check.
Preserve users/IDs, private content, history, storage and encryption dependencies.
Repository SQL files are not a complete database backup. Update the execution
record with actual evidence, and switch production only after target validation.

Nick clarified on 28 October 2026 that WerkTag contains three independent
products under `werk-tag.com`: **Lernapp** for school/examination preparation,
**Assistent** for personal documentation and records, and **Materialliste** for
practical field work. A shared domain or current build does not make them one
product. Read [the product and ownership map](docs/product-map.md) first.

This repository currently contains their shared production implementation,
account entry and routing. The three private product repositories own each
product's brief and tasks; they do not yet contain independent deployed apps.
Until a verified extraction changes the map, implementation PRs still belong
here. Identify the product, linked task and owned files before editing. A task
for one product does not automatically authorize changes across all three.
Coordinate genuinely shared authentication, routing, storage and releases.

## Shared design scope — 29 October 2026

Nick confirmed that a general request to design or beautify WerkTag covers all
three product areas: Lernen, private Assistenz and Materialliste (also called
Komponentenliste), plus their shared navigation and account entry. Treat them
as a connected application for visual consistency while respecting each
product's distinct purpose, data and access controls. Inspect the actual
implementation and relevant flows for each area, apply a coherent design suited
to its tasks, and verify the affected experiences. If an area cannot be accessed,
changed or verified, state precisely what remains open; do not claim the whole
application is complete. A request Nick explicitly limits to one area remains
limited, while considering effects on shared elements. This design-scope rule
does not authorize unrelated cross-product functional or data changes.

The learning-specific priorities and design requirements below apply to the
Lernapp. They do not override Assistent or Materialliste requirements. Private
study-source collections and personal learning evidence remain separate from
the field-work Materialliste. No external AI is currently connected; personal
documentation is the assistant's purpose, not proof of automatic capture of
everything. Never fabricate completed integrations or activity records.

## Parallel work and releases

Nick requested separate GitHub branches for independent chats/work tasks on
28 October 2026. Start each implementation from freshly fetched `origin/main`
on its own `feat/<task>`, `fix/<task>`, `chore/<task>` or `docs/<task>` branch and
separate checkout/worktree. Use `node scripts/start-work.mjs <branch> <absolute-path>`
for a local worktree. A different chat or a branch switch in a shared directory
does not isolate edits. Preserve existing uncommitted work; never reset it or
force a ref to make integration easier. Read [the workflow](docs/parallel-work.md).

Before writing, record the actual base SHA, branch, owned files and dependencies.
Publish task branches through a pull request; hand over the full result SHA,
changed files, checks and open dependencies. Do not push directly to `main` or
deploy merely because an implementation task started. For Nick's instruction to
combine versions, the coordinator merges the named task branches into a fresh
`release/<date>-<scope>` branch, resolves overlaps, runs the complete checks on the
combined result and merges only the verified PR head into `main`. Recheck remote
heads before publishing; never replace newer work with an older source snapshot.
Reuse explicit release authorization already given for that result instead of
asking again for routine push/merge steps. Verify Vercel's deployed SHA and live
behavior separately from GitHub CI. Source publication never includes runtime
credentials, private catalogues, protected learning content or personal records.

## Learning changes

Before changing learning behavior or design, read and preserve every requirement in
[learning preservation](docs/learning-preservation.md): exam mode/timing, drafts,
formula semantics, source boundaries, existing records, selected design and deferred roadmap.
These requirements apply only to the learning product and do not resume its expansion.

Read the relevant repository-local skill before substantial changes:

- `.agents/skills/shk-content-workflow/SKILL.md` for exercises, explanations,
  learner events, and source handling.
- `.agents/skills/shk-interface-design/SKILL.md` for screens and visual changes.

Keep product copy German. Preserve the workshop design: petrol, warm surfaces,
copper details, and useful technical diagrams. Avoid fake AI chat, fake progress,
invented source reviews, and claimed integrations that do not exist.

Use Node 24, `npm ci`, `npm run dev`, and `npm run check`. The full check runs the
TypeScript/production build, learning-core tests, and Chromium interaction tests.
The Playwright config supports `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, system
Chromium on this cloud machine, or Playwright's own browser. Use isolated test
storage. Do not commit browser data, private books/exams, keys, or personal history.

Learning state is versioned browser-local JSON. Validate imports before replacing
data; never silently drop existing learner records when content or schema changes.
Original practice answers are shipped to the client; this is a practice app,
not a protected exam system. Existing private content uses Supabase Auth and
authenticated RPCs; never copy its question payloads or keys into this public repo.
The original content/history and the newer model-practice sync are separate.
No external AI is connected.

Before publishing or deploying, preserve the app's private intended use. A Git
push does not imply deployment approval or an external service is configured.
