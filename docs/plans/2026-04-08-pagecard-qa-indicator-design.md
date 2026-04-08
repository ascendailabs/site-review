# PageCard QA Indicator — Design

**Date:** 2026-04-08
**Status:** Approved

## Problem

The per-page Quality Checklist (10 items, stored on `pageState.qualityChecklist`) is only visible inside `PageDetailView`. Reviewers can't tell from the main Website Pages / Outreach views which pages have completed QA without clicking into each one.

## Decision

Add a **binary check icon** next to the page name in the inline `PageCard` component (`src/App.jsx`).

- **Done state:** filled `CheckCircleIcon` in `success.main`.
- **Not-done state:** outlined `CheckCircleOutlineIcon` in `text.disabled`.
- **Tooltip:** `"QA complete"` when done, `"QA: N/10"` otherwise — partial progress is discoverable on hover but doesn't add visual noise.
- **Source:** `pageState.qualityChecklist` + `countChecked()` from `src/data/qualityChecklist.js`. Done = `countChecked(checklist) === QUALITY_CHECKLIST_ITEMS.length`.
- **Click:** none — the existing card click already opens `PageDetailView`.

## Why binary, not progress

The user's literal ask was "done or not done." The PageCard is already dense with status badges, priority, reviewer rows, and the finished checkbox. A progress chip would add a fourth status surface; a tooltip preserves the information without the clutter.

## Files Touched

- `src/App.jsx` — inline `PageCard` component (~line 510). Add icon import + render between page name and existing badges.

## Out of Scope

- No changes to data shape, API, or persistence.
- No changes to `PageDetailView`.
- No filter/sort by QA state (could be future).
