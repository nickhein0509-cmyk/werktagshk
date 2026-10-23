# WerkTag SHK Lernbuddy

This is a new German-language SHK learning web app. The user explicitly requested
a new implementation and design in `nickhein0509-cmyk/werktagshk`. Work in this
checkout; each cloud task is isolated. Do not create a worktree unless requested.

## Product priority confirmed on 23 October 2026

The examination workspace has a user-controlled `Prüfungsmodus` switch. OFF is
practice with roomy calculation steps, notes, hints and embedded calculator. ON
hides learning aids and calculator; allow a plain free working area and the user's
own calculator. Keep measured time running across mode changes/navigation from
explicit round start until hand-in. Preserve drafts, distinguish calculations,
context tasks and knowledge questions, and never label an assisted round as an
unaided simulation. Use the numbered, quiet paper structure of the user's known
old exams without committing their private contents. See `docs/practice-workspace.md`.

The Werkzeugkoffer supports selecting formula families and the sought variable.
Keep units, explicit model assumptions and a traceable substitution/conversion
path together. Changing units preserves the physical quantity; rearranging carries
the current result into the known values. Keep formula use separate from attempts
and block nonunique inverses such as division by zero with useful German feedback.

Priority 1 is Nick's preparation for Gesellenprüfung Teil 2 on 7 December 2026.
Prioritize meaningful original questions, justified calculations and explanations,
and direct practice/review in Arbeitsplanung, Systemanalyse und Instandhaltung,
and Wirtschafts- und Sozialkunde. Foundations remain available when needed.
The official training regulation describes competencies; do not claim to know
the actual exam paper, complete exam coverage, official practice marks, or readiness.
Keep the practical Kundenauftrag in the curriculum map even though the current
app focuses on written practice. Eventual commercialization must support this
immediate exam use case rather than displace it.

Use the Flow direction selected in the Codex chat “Neues Design ausarbeiten”:
deep petrol canvas, bold sans-serif headings, white primary actions, readable
light learning panels and restrained copper details. Integrate it into the latest
source that retains the existing private question bank and cloud account, rather
than replacing the app with the older standalone Flow upload bundle. Preserve
question identities, account separation and existing learner records.

Future direction: an adult, charming learning game with a light fictional workshop
story, optional commissions, milestones, transparent practice levels and useful
subject-specific minigames. This is a deferred roadmap, not the current build:
do not implement a mandatory learning journey, XP economy or unlock gates before
the exam. See `docs/product-direction.md` for the concept and release criteria.
Practice levels must never claim professional qualifications or exam readiness;
reading solutions and repeated clicks must not count as mastery. Keep direct
question access and the option to hide story/game elements. Build minigames only
when they train a defined skill and support transfer to ordinary exam exercises.

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
