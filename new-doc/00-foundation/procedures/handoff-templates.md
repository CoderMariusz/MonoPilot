# Handoff Templates

Shared handoff and checkpoint templates used across all agents. Eliminate duplication by referencing these definitions in agent files.

## Checkpoint Append Command

Standard command used by ALL agents after completing their phase work:

```bash
echo "P{N}: ✓ {agent-name} $(date +%H:%M) {metrics}" >> .claude/checkpoints/{STORY_ID}.yaml
```

Replace:
- `{N}` with phase number (1-7)
- `{agent-name}` with agent identifier (e.g., unit-test-writer, backend-dev)
- `{metrics}` with comma-separated metric pairs (see metrics table below)
- `{STORY_ID}` with story identifier (e.g., 06.10)

---

## Checkpoint Format Examples

### Phase 1: UX Design
```yaml
P1: ✓ ux-designer 13:15 wireframes:3 approved:yes
```

### Phase 2: Test Writing (RED phase)
```yaml
P2: ✓ unit-test-writer 13:50 files:3 tests:27 status:red
```

### Phase 3: Implementation
```yaml
P3: ✓ backend-dev 14:23 files:5 tests:12/12
P3: ✓ frontend-dev 14:45 files:8 tests:15/15
```

### Phase 4: Refactoring
```yaml
P4: ✓ senior-dev 14:45 refactored:3 complexity:reduced
```

### Phase 5: Code Review
```yaml
P5: ✓ code-reviewer 15:10 issues:0 decision:approved
```

### Phase 6: QA Testing
```yaml
P6: ✓ qa-agent 15:30 ac:5/5 bugs:0 decision:pass
```

### Phase 7: Documentation
```yaml
P7: ✓ tech-writer 15:45 report:done docs:updated
```

---

## Metrics Reference

Universal metrics used in checkpoints across all agents:

| Metric | Format | Used By | Example |
|--------|--------|---------|---------|
| `wireframes:N` | Number created | UX Designer | `wireframes:3` |
| `approved:yes/no` | Boolean | UX Designer | `approved:yes` |
| `files:N` | Number modified | All dev agents | `files:5` |
| `tests:X/Y` | Passing/total | Test-Engineer, Dev agents | `tests:12/12` |
| `status:red/green` | Phase status | Test-Writer | `status:red` |
| `refactored:N` | Files refactored | Senior-Dev | `refactored:3` |
| `complexity:reduced/same/increased` | Change direction | Senior-Dev | `complexity:reduced` |
| `issues:N` | Number found | Code-Reviewer | `issues:0` |
| `decision:approved/changes/deferred` | Approval decision | Code-Reviewer | `decision:approved` |
| `ac:X/Y` | Criteria tested/total | QA-Agent | `ac:5/5` |
| `bugs:N-severity` | Count and level | QA-Agent | `bugs:2-critical` |
| `report:done/pending` | Status | Tech-Writer | `report:done` |
| `docs:updated/created` | Status | Tech-Writer | `docs:updated` |
| `stories:N` | Count created | Architect | `stories:3` |
| `adr:N` | Decisions documented | Architect | `adr:2` |

---

## Micro-Handoff Format

Concise handoff to orchestrator when phase completes (keep under 50 tokens):

```
{STORY_ID} P{N}✓ → P{N+1}
{Metric1}: {value} | {Metric2}: {value} | Block: {yes/no}
```

### Examples by Phase

**P1→P2 (UX Design complete)**
```
03.4 P1✓ → P2
Wireframes: 3 | Approved: yes | Block: no
```

**P2→P3 (Tests written)**
```
03.5 P2✓ → P3
Files: 3 | Tests: 27 | Status: red | Block: no
```

**P3→P4 (Implementation complete)**
```
03.5a P3✓ → P4
Files: 5 | Tests: 12/12 | Block: no
```

**P4→P5 (Refactoring complete)**
```
03.6 P4✓ → P5
Refactored: 3 | Complexity: reduced | Block: no
```

**P5→P6 (Code review complete)**
```
03.7 P5✓ → P6
Issues: 0 | Decision: approved | Block: no
```

**P6→P7 (QA testing complete)**
```
03.8 P6✓ → P7
AC: 5/5 | Bugs: 0 | Decision: pass | Block: no
```

**Blocked handoff (QA testing failed)**
```
03.8 P6✗ → P3
AC: 3/5 | Bugs: 2-critical | Decision: fail | Block: YES
```

---

## Checkpoint Key Principles

1. **No reports** - Your checkpoint IS your report
2. **Append only** - Never read/modify existing checkpoints
3. **Atomic** - One checkpoint line per phase completion
4. **Metrics-driven** - Numbers tell the story
5. **Blocking transparent** - Always indicate if blocked in micro-handoff

---

## OUTPUT PROTOCOL (Mandatory for All Agents)

### Step 1: Do Your Task
- Implement code/tests/review as specified
- Follow your agent-specific workflow
- Use all designated tools and skills
- Run `./ops check` and ensure it passes (MANDATORY)

### Step 2: Append Checkpoint
After completing your phase work, append ONE line to checkpoint file using the command above.

### Step 3: Micro-Handoff to Orchestrator
Return with checkpoint metrics (under 50 tokens total).

### Step 4: STOP
No additional commentary, explanations, or narrative. TECH-WRITER will create comprehensive documentation from checkpoints.

---

## Common Checkpoint Mistakes to Avoid

1. **Missing metrics** - Always include at least 2-3 relevant metrics
2. **Wrong phase number** - Verify P{N} matches your phase
3. **Forgetting checkpoint** - Required, not optional
4. **Modifying old checkpoints** - Always append, never edit existing lines
5. **Unclear block status** - Must be explicitly yes/no in micro-handoff
6. **Too much narrative** - Micro-handoff is ≤50 tokens total, metrics only

---

## Integration with Agent Files

Each agent file should:

1. Reference this file at the top of their workflow section
2. Use the phase number (P1-P7) that matches their role
3. Include the `## 📋 OUTPUT PROTOCOL (mandatory)` section pointing here
4. Link back to this file in error recovery section

Example reference:
```markdown
See: `.claude/procedures/handoff-templates.md` for checkpoint format and examples
```

