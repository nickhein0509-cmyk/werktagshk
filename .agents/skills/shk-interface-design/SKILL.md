---
name: shk-interface-design
description: >-
  Design and implement WerkTag's web interfaces with a coherent visual language,
  useful interactions, responsive layouts, and accessible controls. Use for new
  screens or substantial UI refinements across the product areas.
---

# WerkTag interface design

This repository-local skill guides product design and implementation. It is not
a native iOS or simulator workflow. Use the actual web stack and installed tools;
do not claim an unavailable design plugin, browser integration, or AI service was
used. Keep user-facing copy in clear, concise German.

## Establish a coherent direction

For a general WerkTag design or beautification request, inspect and address
Lernen, private Assistenz and Materialliste (Komponentenliste), together with
shared navigation and the account entry. Identify the actual sources and
deployment boundaries. Keep the visual language coherent and appropriate to
each area's tasks, while preserving distinct data and access controls. Report
any area that could not be changed or verified. If Nick explicitly limits the
request to one area, respect that scope and check effects on shared elements.

Read the existing screens, shared styles, and relevant flows before editing.
Preserve useful interactions while improving the composition. For the Lernapp,
build a technical workshop identity: warm pale surfaces, deep petrol structure, a copper
or orange accent, and clear typography. Interpret SHK through purposeful pipe
routes, system diagrams, flow direction, and component geometry instead of
unrelated decoration or generic stock dashboards.

Keep the color roles consistent: a neutral canvas, readable text, restrained
section surfaces, one prominent action color, and distinguishable semantic
feedback. Do not communicate subject, selection, or correctness through color
alone. Use the repository's actual font and icon resources; keep external assets
optional rather than making a learning screen depend on third-party availability.

## Design around the next useful action

Give each screen a clear title, context, and primary action. The following
dashboard, exercise, and learning-progress guidance applies to the Lernapp. On its dashboard,
connect topic selection to starting or continuing a real exercise. A progress
summary must reflect stored learner events; show a helpful empty state before
the first attempt. Do not invent streaks, percentages, messages, or notifications
to fill a layout.

Use concise topic cards for scanning, and leave working space for calculation,
diagrams, and explanations in learning views. Distinguish practice, revision,
formula reference, and progress without duplicating the same screen under
different labels. Every interactive control must perform a useful action, expose
an honest disabled state with a reason, or be omitted. A decorative chat box must
not imply a connected AI tutor.

Keep explanations readable at mobile widths. Present formulas with their units,
define symbols, and state the assumed system where it affects interpretation.
Avoid visually decorative technical claims or values that learners may read as
verified instructions. Apply `shk-content-workflow` to learning content and
progress behavior.

## Implement a reusable system

- Reuse a small set of tokens for surfaces, typography, spacing, borders, radii,
  and elevation. Introduce a shared component when it has a genuine repeated role.
- Make navigation, topic cards, action buttons, exercise choices, progress states,
  and dialogs visibly related. Keep selected, hover, focus, disabled, and error
  states legible and distinct.
- Prefer semantic HTML and native form behavior. Give inputs visible labels,
  meaningful control names, and actionable validation feedback. Announce changing
  exercise feedback accessibly without making the whole page a live region.
- Ensure keyboard access, visible focus, sensible focus order, and correct focus
  restoration for any dialog. Use native dialogs or a tested accessible primitive
  for modal behavior rather than implementing an incomplete focus trap.
- Meet WCAG AA text contrast (4.5:1 for normal text and 3:1 for large text), usable
  control contrast, and comfortable touch areas of about 44 CSS pixels. Avoid
  tiny icon-only actions where a text label is clearer.
- Adapt the layout to content: collapse the desktop navigation deliberately,
  keep primary actions reachable, and prevent fixed-width cards or formulas from
  creating horizontal overflow at 320 CSS pixels. Check portrait and landscape.
- Use short, purposeful transitions; honor `prefers-reduced-motion`. Do not use
  perpetual animation or essential information available only on hover.

## Validate the real result

Run the available build/type checks, then exercise the screen in an actual
browser when available. Inspect a wide desktop and a narrow mobile viewport.
Check keyboard navigation, overflow, readable text, and actual primary actions.
Use isolated progress records for tests and restore the normal empty state.
Screenshots demonstrate only the visible state, not persistence or correctness.

Do not claim a preview or screenshot exists unless produced through a working
tool. If browser access is unavailable, report that limit and complete meaningful
code/build checks. Hand over concrete screens and interactions with the
validation performed, rather than a moodboard presented as a finished app.
