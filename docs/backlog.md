# Engineering Backlog

This backlog collects cross-cutting or future action items that emerge from reviews and planning.

Routing guidance:

- Use this file for non-urgent optimizations, refactors, or follow-ups that span multiple stories/epics.
- Must-fix items to ship a story belong in that story’s `Tasks / Subtasks`.
- Same-epic improvements may also be captured under the epic Tech Spec `Post-Review Follow-ups` section.

| Date | Story | Epic | Type | Severity | Owner | Status | Notes |
| ---- | ----- | ---- | ---- | -------- | ----- | ------ | ----- |
| 2025-11-15 | 0.5 | 0 | Testing | Medium | Complete E2E tests for UoM workflow after migration 059 applied | Dev team | Open | Create LP with GALLON, verify dropdown shows all 22 UoMs, test API integration. Prerequisites: Migration 059 on test DB. AC #6 |
| 2025-11-15 | 0.5 | 0 | DevOps | Low | Test migration 059 on dev/staging before production | DevOps | Open | Verify DO blocks, FK constraint, no orphaned UoMs. File: migrations/059_uom_master_table.sql |
