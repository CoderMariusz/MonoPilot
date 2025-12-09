# Sprint {N} Plan

## Sprint Info
| Field | Value |
|-------|-------|
| Sprint | {N} |
| Duration | {start_date} → {end_date} |
| Capacity | {X} story points / {Y} stories |
| Epic | Epic {N} - {epic_name} |

## Sprint Goal
{One sentence describing what this sprint achieves}

---

## Selected Stories

| Story | Title | Points | Agent Flow | Dependencies | Priority |
|-------|-------|--------|------------|--------------|----------|
| {N}.1 | {title} | {pts} | TEST → BACKEND → REVIEW → QA | None | Must |
| {N}.2 | {title} | {pts} | TEST → FRONTEND → REVIEW → QA | {N}.1 | Must |
| {N}.3 | {title} | {pts} | TEST → SENIOR → REVIEW → QA | None | Should |

**Total Committed:** {X} points

---

## Execution Order

```
Phase 1 (Parallel RED):
├── Story {N}.1: TEST-ENGINEER (RED)
└── Story {N}.3: TEST-ENGINEER (RED)

Phase 2 (Parallel GREEN):
├── Story {N}.1: BACKEND-DEV (GREEN)
└── Story {N}.3: SENIOR-DEV (GREEN)

Phase 3 (Sequential Review/QA):
├── Story {N}.1: CODE-REVIEWER → QA-AGENT
├── Story {N}.3: CODE-REVIEWER → QA-AGENT
│
├── Story {N}.2: TEST-ENGINEER (RED) [after {N}.1 done]
└── Story {N}.2: FRONTEND-DEV (GREEN) → REVIEW → QA
```

---

## Dependencies

| Story | Depends On | Type | Status |
|-------|------------|------|--------|
| {N}.2 | {N}.1 | Code (shared API) | Not started |

---

## Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| {risk description} | H/M/L | H/M/L | {mitigation strategy} |

---

## Definition of Done (Sprint Level)

- [ ] All committed stories pass QA
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Documentation updated
- [ ] No critical bugs open
- [ ] Demo ready

---

## Notes
{Any special considerations for this sprint}
