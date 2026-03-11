# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-11)

**Core value:** Friends and family can discover, visit, and rate Boston bakeries' croissants together — with a beautiful map as the centerpiece of exploration.
**Current focus:** Phase 1 — Auth and Database Foundation

## Current Position

Phase: 1 of 4 (Auth and Database Foundation)
Plan: 0 of ? in current phase
Status: Ready to plan
Last activity: 2026-03-11 — Roadmap created

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Pre-roadmap: JWT storage strategy unresolved — research recommends Context + HttpOnly cookie; confirm with developer before Phase 1 begins
- Pre-roadmap: Category list (flakiness, butteriness, freshness, size/value) inferred — confirm before CategoryScore table is created in Phase 2
- Pre-roadmap: Single group assumed — if multi-group support wanted, data model changes significantly before Phase 1

### Pending Todos

None yet.

### Blockers/Concerns

- **Phase 1 blocker:** Alembic batch-mode migration must be set up before any model changes — `Base.metadata.create_all()` cannot migrate existing tables
- **Phase 1 concern:** Existing rows have no `user_id` — need sentinel user backfill in first migration to avoid NOT NULL failures
- **Phase 3 concern:** Deployment target (VPS vs. cloud) affects file storage strategy — confirm before writing any upload code

## Session Continuity

Last session: 2026-03-11
Stopped at: Roadmap created, STATE.md initialized — ready to plan Phase 1
Resume file: None
