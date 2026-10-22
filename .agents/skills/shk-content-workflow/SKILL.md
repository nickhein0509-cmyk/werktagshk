---
name: shk-content-workflow
description: >-
  Build or revise SHK Lernbuddy learning content, exercise data, explanations,
  and content-related UI with explicit provenance and honest learner progress.
  Use for this repository's content development and content acceptance checks.
---

# SHK content workflow

This is a repository-local development skill. It adapts useful principles from
`shk-lernwerkzeuge:shk-pruefungswerkstatt` and
`shk-lernwerkzeuge:shk-quellenpruefung`; it does not replace their bounded authoring
and source-review workflows. Read `docs/plugin-capabilities.md` for the capability
mapping and distinguish a real tool from a documented future integration.

## Establish the content scope

1. Inspect the current content model, learner views, storage, and existing tests.
   Reuse established task identities and versions. Do not create another learner
   profile or overwrite a real attempt while editing content.
2. Identify the subject, learning objective, intended learning mode, and available
   source. Cover sanitation, heating, air conditioning/ventilation, and WiSo when
   designing a broad SHK curriculum; do not pretend an empty subject is complete.
3. Prefer small original practice examples when rebuilding without the old
   library. Label them in German as `Eigene Übungsaufgabe` or
   `Selbst erstelltes Lernbeispiel`. Do not call them official exam questions,
   recovered material, norm-compliant procedures, or predictions.
4. Treat private books, exam papers, editorial keys, and learner records as private
   source material. Reference authorized sources without committing them to this
   repository. A path mentioned in a plugin is not an accessible cloud file.

## Make provenance useful

For new content, use the current schema to retain the equivalents of:

- A stable task ID and content version; subject and learning objective.
- Origin (`original`, a numerical variant, or a reviewed practice variant).
- Source identity, edition/date and exact page/task/claim when applicable;
  explicitly unknown fields when unavailable.
- Assumptions and the supported use of the content.
- Editorial state (`draft`, `blocked`, or `reviewed_for_stated_use`) and dated
  evidence for any review claim. A schema validator passing is not factual review.

For an original arithmetic example, derive the exact answer, check units and
rounding, then check its physical plausibility. Record the assumptions. Do not
inherit a review claim after changing values, units, diagrams, or constraints.
For normative, legal, safety, or manufacturer-specific claims, inspect an
applicable current primary source before marking the claim supported. If it is
unavailable, keep that claim provisional and avoid using it to score a learner.

If a source or answer-key audit is needed and the plugin is available, invoke
`shk-quellenpruefung` for the bounded passage. If authoring a packet from actual
exam material, invoke `shk-pruefungswerkstatt`. Their skills define the required
context and release checks; this development skill does not bypass those checks.

## Separate practice from solutions

Keep task prompts and explanatory solutions structurally distinct. In normal
practice, show a hint or solution only after the learner asks or submits according
to the chosen flow. Label self-assessment as self-assessment; reveal alone is not
proof of understanding. Do not leak a marked answer in a task label or hint.

For ordinary original practice material in a client application, explain that
client-delivered solutions remain inspectable. Visual hiding is not access
control. An answer-free export or real examination mode needs an actual separate
learner artifact or authorized server boundary; inspect the resulting payload,
not just the visible page. Never ship private editorial keys as public assets.

Keep task provenance, familiarity, editorial review, and learner mastery separate.
Changing only numbers does not make a familiar exam unfamiliar. Preserve reserved
unseen papers instead of adding them to ordinary exercises.

## Protect real progress

Start a new user's progress at zero or explicitly unknown. Sample content is not
an attempt, a score, a streak, or a completed learning session. Record completion
only after the relevant real user action. Keep reveal, submitted answer,
self-assessment, correctness, and elapsed time distinct where the app supports
them. Authoring, import preparation, and developer tests must not create attempts.

Use isolated test storage and fixtures. Preserve data when changing storage
versions; validate imported data and provide a recoverable route for existing
records. Do not silently replace unavailable historical data with demonstration
scores. Only claim synchronization, AI tutoring, import, or source retrieval when
the real integration exists and has been verified.

## Verify and hand over

Run checks proportionate to the change: a calculation/validation test for numeric
content, a learner interaction test for answer/reveal flows, and a persistence
test when progress storage changes. Check empty and incomplete content states.
Verify the intended tests actually executed. Use German product copy with units,
decimal formatting, and honest source/status labels.

Report the exact content added, the checks run, and any missing source or review.
Do not describe editorial preparation as a completed lesson, app import,
publication, or mastery assessment.
