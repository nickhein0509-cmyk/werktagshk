# WerkTag SHK Lernbuddy

This is a new German-language SHK learning web app. The user explicitly requested
a new implementation and design in `nickhein0509-cmyk/werktagshk`. Work in this
checkout; each cloud task is isolated. Do not create a worktree unless requested.

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
not a protected exam system. No external AI or backend is currently connected.

Before publishing or deploying, preserve the app's private intended use. A Git
push does not imply deployment approval or an external service is configured.
