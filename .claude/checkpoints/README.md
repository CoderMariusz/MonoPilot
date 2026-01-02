# Story Checkpoints

## Purpose

Lightweight, append-only progress tracking for multi-agent workflows.

## File Format

```yaml
# .claude/checkpoints/{STORY_ID}.yaml

P1: ✓ ux-designer 12:45 wireframes:2 approved:yes
P2: ✓ test-writer 13:50 files:3 tests:27 status:red
P3: ✓ backend-dev 14:23 files:5 tests:12/12
P3: ✓ frontend-dev 14:38 files:8 tests:15/15
P4: ✓ senior-dev 14:52 refactored:2 complexity:reduced
P5: ✓ code-reviewer 15:10 issues:0 decision:approved
P6: ✓ qa-agent 15:30 ac:5/5 bugs:0 decision:pass
P7: ✓ tech-writer 15:45 report:done docs:updated
```

## Phase Numbers (7-Phase Flow)

- **P1**: UX Design (ux-designer) - _Optional, skip for backend-only_
- **P2**: RED phase (test-writer) - Write failing tests
- **P3**: GREEN phase (backend-dev, frontend-dev, or both) - Implementation
- **P4**: REFACTOR phase (senior-dev) - _Optional, skip if not needed_
- **P5**: REVIEW phase (code-reviewer) - Code review
- **P6**: QA phase (qa-agent) - Manual testing
- **P7**: DOCUMENTATION phase (tech-writer) - Final report

## Status Symbols

- `✓` - Phase completed successfully
- `✗` - Phase failed/blocked

## Rules

1. **Append-only** - Never edit existing lines
2. **One line per agent completion** - Each agent appends once when done
3. **Multiple P3 lines allowed** - Backend and Frontend can both append P3
4. **Metrics required** - Always include relevant metrics
5. **Timestamp** - Use `$(date +%H:%M)` for consistency
6. **Story-specific** - One file per story
7. **Skip phases** - P1 (no UX) and P4 (no refactor) can be skipped

## Phase Skipping

### P1 (UX Design) - Skip when:
- Backend-only stories (no UI changes)
- Wireframes already exist from previous story
- Pure API/database work

### P4 (Refactor) - Skip when:
- Code is already clean (GREEN phase produced quality code)
- Small stories with minimal complexity
- Time-sensitive hotfixes

**Orchestrator handles routing when phases are skipped.**

## Who Writes

All agents EXCEPT orchestrator:
- **ux-designer** → P1 (if needed)
- **test-writer** → P2
- **backend-dev** → P3
- **frontend-dev** → P3
- **senior-dev** → P4 (if needed)
- **code-reviewer** → P5
- **qa-agent** → P6
- **tech-writer** → P7

## Who Reads

- **orchestrator** - Determines next phase to execute
- **tech-writer** - Creates final documentation from checkpoints (P7)
- **Users** - Quick progress overview

## Example: Multi-Story Progress

```bash
$ ls .claude/checkpoints/
03.4.yaml   # P7✓ - Complete
03.5a.yaml  # P3✓ - Ready for senior-dev (P4)
03.7.yaml   # P2✓ - Ready for dev (P3)

$ cat .claude/checkpoints/03.5a.yaml
P1: ✓ ux-designer 09:30 wireframes:4 approved:yes
P2: ✓ test-writer 10:15 files:4 tests:32 status:red
P3: ✓ backend-dev 11:30 files:6 tests:18/18
P3: ✓ frontend-dev 11:55 files:9 tests:14/14
# Next: P4 (senior-dev for refactor)

$ cat .claude/checkpoints/03.7.yaml
# P1 skipped - backend-only story
P2: ✓ test-writer 14:10 files:2 tests:15 status:red
P3: ✓ backend-dev 14:45 files:4 tests:15/15
# Next: P4 (senior-dev) or skip to P5 if no refactor needed
```

## Parallel Execution

Multiple P3 entries indicate parallel backend/frontend development:

```yaml
P3: ✓ backend-dev 14:23 files:5 tests:12/12
P3: ✓ frontend-dev 14:38 files:8 tests:15/15
```

Both agents work simultaneously after P2✓ completes.

## Error Handling

When phase fails, use `✗` and orchestrator routes back:

```yaml
P5: ✗ code-reviewer 15:10 issues:3-critical decision:request_changes
# Orchestrator routes back to P3 (dev) for fixes
P3: ✓ backend-dev 15:35 files:2 tests:12/12  # Fixed issues
P4: ✓ senior-dev 15:42 refactored:1 complexity:reduced
P5: ✓ code-reviewer 15:50 issues:0 decision:approved
# Continue to P6...
```

## Metrics Reference

| Metric | Used By | Example |
|--------|---------|---------|
| `wireframes:N` | ux-designer | `wireframes:3` |
| `approved:yes/no` | ux-designer | `approved:yes` |
| `files:N` | test-writer, devs | `files:5` |
| `tests:X/Y` | devs | `tests:12/12` |
| `status:red` | test-writer | `status:red` |
| `refactored:N` | senior-dev | `refactored:2` |
| `complexity:reduced/same` | senior-dev | `complexity:reduced` |
| `issues:N` | code-reviewer | `issues:0` |
| `decision:X` | code-reviewer, qa-agent | `decision:approved` |
| `ac:X/Y` | qa-agent | `ac:5/5` |
| `bugs:N` | qa-agent | `bugs:0` |
| `report:done` | tech-writer | `report:done` |
| `docs:updated` | tech-writer | `docs:updated` |

## Integration

See:
- `.claude/agents/ORCHESTRATOR.md` - Checkpoint-driven coordination
- `.claude/agents/AGENT-FOOTER.md` - Protocol for all agents

## Token Efficiency

**Traditional approach:** ~2000 tokens per handoff (full reports)
**Checkpoint approach:** ~50 tokens per handoff (single line)

**Savings:** 97.5% reduction in coordination overhead!
