# Report Standardization Guidelines

**Created**: 2025-12-18
**Purpose**: Prevent duplicate reports, maintain single source of truth

---

## Standard Report Files Per Story

### Format: `{report-type}-story-{XX}.{X}.md`

Every story gets **EXACTLY 2 FILES**:

1. **Main Report**: `code-review-story-XX.X.md`
   - Primary review document
   - All findings, decisions, metrics
   - Updated in-place if re-reviewed

2. **Handoff Document**: `handoff-story-XX.X.md`
   - Quick reference for next phase
   - Key blockers, next steps
   - Team coordination info

---

## Report Types by Phase

| Phase | Main Report | Handoff |
|-------|-------------|---------|
| **Code Review** | `code-review-story-XX.X.md` | `handoff-story-XX.X.md` |
| **QA** | `qa-report-story-XX.X.md` | `handoff-story-XX.X.md` |
| **Implementation** | `implementation-story-XX.X.md` | `handoff-story-XX.X.md` |
| **Refactor** | `refactor-story-XX.X.md` | `handoff-story-XX.X.md` |

**Location**: `docs/2-MANAGEMENT/reviews/`

---

## Rules for Agents

### DO ✅
- Create ONE main report file per phase
- Update existing report if re-reviewing (don't create new)
- Use consistent naming: `{phase}-story-{XX}.{X}.md`
- Create handoff document for next phase
- Delete intermediate/temporary reports after final version

### DON'T ❌
- Create multiple reports (summary, final, partial, etc.)
- Use suffixes like `-FINAL`, `-UPDATED`, `-v2`
- Create separate files for each section
- Leave temporary analysis files

---

## File Naming Examples

**Story 01.3**:
- ✅ `code-review-story-01.3.md` (main review)
- ✅ `handoff-story-01.3.md` (handoff to QA)
- ❌ `code-review-story-01.3-FINAL.md` (duplicate)
- ❌ `01.3-SUMMARY.md` (duplicate)
- ❌ `01.3-TEST-REPORT.md` (should be in main review)

**Story 02.5**:
- ✅ `qa-report-story-02.5.md` (QA findings)
- ✅ `handoff-story-02.5.md` (handoff to TECH-WRITER)

---

## Handoff Document Template

```markdown
# Handoff: Story XX.X → {Next Phase}

**From**: {Current Agent/Phase}
**To**: {Next Agent/Phase}
**Date**: YYYY-MM-DD

## Status
- Implementation: X%
- Tests: X/Y passing
- Blockers: {count}

## Key Files
- {list of created files}

## Blockers
1. {blocker description}

## Next Steps
1. {action item}

## Notes
- {important context}
```

---

## Agent Instructions

### CODE-REVIEWER
When completing review:
1. Create/update `code-review-story-XX.X.md`
2. Create `handoff-story-XX.X.md` for QA-AGENT
3. Delete any temporary analysis files

### QA-AGENT
When completing QA:
1. Create/update `qa-report-story-XX.X.md`
2. Update `handoff-story-XX.X.md` for TECH-WRITER
3. Delete test run logs, intermediate reports

### TECH-WRITER
When completing docs:
1. Create/update `documentation-story-XX.X.md`
2. Mark story as complete in handoff
3. Archive handoff to `.claude/archive/completed/`

---

## Cleanup Protocol

**After each phase**:
- Keep: Main report + Handoff
- Delete: Summaries, partials, temp files, duplicates

**After story complete**:
- Archive to: `.claude/archive/completed/story-XX.X/`
- Keep only: Final review + Documentation link

---

**Version**: 1.0
**Enforcement**: All agents MUST follow these standards
