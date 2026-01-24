# Shared Procedures Directory

Central repository for duplicated content extracted from agent files. These procedures are referenced (not duplicated) by individual agents to reduce token usage across agent definitions.

## What's Here

This directory contains 4 shared procedure documents that eliminate ~11,600 tokens of duplication across agent files:

### 1. **handoff-templates.md**
Shared checkpoint and handoff templates used by all agents.

**Eliminates duplication of**:
- Checkpoint append command
- Checkpoint format examples (P1-P7)
- Metrics reference table
- Micro-handoff format
- Key principles
- Output protocol

**Who uses it**: All agents (P1-P7)
**Tokens saved**: ~2,800 per agent file × 10 agents = ~28,000 tokens

**Reference in agent files**:
```markdown
## Checkpoints

See: `.claude/procedures/handoff-templates.md` for checkpoint format, metrics, and examples.
```

---

### 2. **tdd-phase-flow.md**
Complete TDD workflow explanation (RED → GREEN → REFACTOR) and phase transitions.

**Eliminates duplication of**:
- Phase definitions (P1-P7)
- Phase transition criteria
- TDD cycle overview
- Common mistakes by phase
- Integration guidance

**Who uses it**: Test-Writer, Backend-Dev, Frontend-Dev, Senior-Dev, Code-Reviewer, QA-Agent
**Tokens saved**: ~3,200 per agent file × 6 agents = ~19,200 tokens

**Reference in agent files**:
```markdown
## TDD Phase Overview

See: `.claude/procedures/tdd-phase-flow.md` for RED→GREEN→REFACTOR workflow.

Your role in the TDD cycle:
- [Your specific phase and responsibilities]
```

---

### 3. **error-recovery-common.md**
Standard error patterns and recovery actions across all agents.

**Eliminates duplication of**:
- Universal error recovery table
- Error recovery by agent type
- Checkpoint-related errors
- Git and deployment errors
- Database and cache errors
- Network errors
- Escalation criteria
- Common debugging commands

**Who uses it**: All agents
**Tokens saved**: ~2,100 per agent file × 12 agents = ~25,200 tokens

**Reference in agent files**:
```markdown
## Error Recovery

See: `.claude/procedures/error-recovery-common.md` for standard recovery procedures.

Agent-specific errors:
- [Your unique error cases]
```

---

### 4. **quality-gates-common.md**
Universal quality criteria that apply across all stories and agents.

**Eliminates duplication of**:
- Universal quality gates (tests pass, no secrets, validation, etc.)
- Quality decision criteria
- Phase-specific gates
- Quality gate decision matrix

**Who uses it**: Test-Engineer, Backend-Dev, Frontend-Dev, Senior-Dev, Code-Reviewer, QA-Agent
**Tokens saved**: ~1,800 per agent file × 8 agents = ~14,400 tokens

**Reference in agent files**:
```markdown
## Quality Standards

See: `.claude/procedures/quality-gates-common.md` for universal quality gates.

Agent-specific gates:
- [Your specialized quality criteria]
```

---

## Total Token Savings

| Document | Per-Agent | # Agents | Total Saved |
|----------|-----------|----------|-------------|
| handoff-templates.md | ~2,800 | 10 | ~28,000 |
| tdd-phase-flow.md | ~3,200 | 6 | ~19,200 |
| error-recovery-common.md | ~2,100 | 12 | ~25,200 |
| quality-gates-common.md | ~1,800 | 8 | ~14,400 |
| **Total** | | | **~86,800 tokens** |

---

## How to Use These Procedures

### For AI Agents (Adding Reference to Your File)

1. Identify which shared procedures apply to your agent role
2. Add reference section near the top of your role description
3. Link back to the shared procedure with the exact path: `.claude/procedures/filename.md`
4. Keep agent-specific content in your file (don't remove it)
5. Example:

```markdown
# YOUR-AGENT-NAME

## Identity
[Your specific identity and purpose]

## Shared Procedures

**All agents reference these universal procedures**:
- See: `.claude/procedures/handoff-templates.md` for checkpoints
- See: `.claude/procedures/tdd-phase-flow.md` for phase definitions
- See: `.claude/procedures/error-recovery-common.md` for error handling
- See: `.claude/procedures/quality-gates-common.md` for quality standards

[Add agent-specific procedures below]
```

### For Architects/Leads (Maintaining These Files)

When updating procedures:

1. **Before modifying**: Check which agent files reference each procedure
2. **Update the procedure** document with new content
3. **Don't update agent files** - they automatically use the new version
4. **Document the change** in comments at the top of the procedure
5. **Version tracking**: Checkpoints track when changes happened (in git history)

### For New Agent Creation

When creating a new agent file:

1. Reference the 4 shared procedures based on your role
2. Add agent-specific workflow/responsibilities
3. Add agent-specific error recovery (if unique)
4. Add agent-specific quality gates (if specialized)
5. Use the handoff format from `handoff-templates.md`

---

## Cross-References Between Procedures

These files reference each other:

```
handoff-templates.md
├─ References: tdd-phase-flow.md (phase numbers P1-P7)
└─ References: error-recovery-common.md (escalation criteria)

tdd-phase-flow.md
├─ References: handoff-templates.md (checkpoint format for each phase)
├─ References: error-recovery-common.md (RED→GREEN error recovery)
└─ References: quality-gates-common.md (quality gates per phase)

error-recovery-common.md
├─ References: tdd-phase-flow.md (phase context for errors)
├─ References: quality-gates-common.md (quality gate errors)
└─ References: handoff-templates.md (checkpoint write errors)

quality-gates-common.md
├─ References: tdd-phase-flow.md (phase-specific gates)
└─ References: error-recovery-common.md (escalation when gates fail)
```

---

## Procedure Location Reference

All procedures live in: `.claude/procedures/`

```
.claude/
├── procedures/                          (THIS DIRECTORY)
│   ├── README.md                        (this file)
│   ├── handoff-templates.md             (checkpoint & micro-handoff format)
│   ├── tdd-phase-flow.md                (RED→GREEN→REFACTOR workflow)
│   ├── error-recovery-common.md         (error patterns & recovery)
│   └── quality-gates-common.md          (universal quality criteria)
│
├── agents/                              (Agent definitions)
│   ├── AGENT-FOOTER.md
│   ├── development/
│   │   ├── BACKEND-DEV.md
│   │   ├── FRONTEND-DEV.md
│   │   ├── SENIOR-DEV.md
│   │   ├── TEST-ENGINEER.md
│   │   └── TEST-WRITER.md
│   ├── quality/
│   │   ├── CODE-REVIEWER.md
│   │   └── QA-AGENT.md
│   ├── planning/
│   ├── operations/
│   └── skills/
│
└── [other directories]
```

---

## How Procedures Are Used During Work

### When Test-Writer Works (P2)

1. Check `.claude/procedures/tdd-phase-flow.md` → "Phase 2: RED Phase"
2. Follow TDD phase definitions
3. Reference `.claude/procedures/quality-gates-common.md` → "Additional P2 Gates"
4. After complete, append checkpoint using `.claude/procedures/handoff-templates.md` format
5. On error, check `.claude/procedures/error-recovery-common.md`

### When Backend-Dev Works (P3)

1. Check `.claude/procedures/tdd-phase-flow.md` → "Phase 3: GREEN Phase"
2. Implement to pass tests
3. Verify `.claude/procedures/quality-gates-common.md` → "Additional P3 Gates"
4. Check `.claude/procedures/quality-gates-common.md` → "Universal Quality Gates"
5. Append checkpoint using `.claude/procedures/handoff-templates.md` format
6. On error, check `.claude/procedures/error-recovery-common.md`

### When Senior-Dev Works (P4)

1. Check `.claude/procedures/tdd-phase-flow.md` → "Phase 4: REFACTOR Phase"
2. Identify code smells
3. Refactor one at a time, test after each
4. Verify `.claude/procedures/quality-gates-common.md` → "Additional P4 Gates"
5. Append checkpoint using `.claude/procedures/handoff-templates.md` format
6. On RED, check `.claude/procedures/error-recovery-common.md` → "Refactoring Broke Tests"

---

## Updating Agent Files to Reference Procedures

Migration checklist for each agent file:

- [ ] Add reference to `.claude/procedures/handoff-templates.md`
- [ ] Add reference to `.claude/procedures/tdd-phase-flow.md`
- [ ] Add reference to `.claude/procedures/error-recovery-common.md`
- [ ] Add reference to `.claude/procedures/quality-gates-common.md`
- [ ] Keep agent-specific error recovery in agent file
- [ ] Keep agent-specific quality gates in agent file
- [ ] Update AGENT-FOOTER.md to remove checkpoint templates (already in handoff-templates.md)
- [ ] Keep agent-specific workflow in agent file
- [ ] Test that agent can still find all needed information

**Important**: Don't remove content from agent files yet. These procedures are NEW - agents can reference them while keeping their original content.

---

## Maintenance Guidelines

### Adding New Procedure

1. Create new file in `.claude/procedures/` with descriptive name
2. Add reference to this README
3. Document which agents use it
4. Update agent files to reference it

### Updating Existing Procedure

1. Modify the procedure file directly
2. Document change at top of file with date
3. Reference change in `.claude/procedures/README.md`
4. No need to update agent files (they automatically use new version)

### Deprecating Old Content

1. Move superseded content to `.claude/procedures/archive/`
2. Add deprecation note to remaining sections
3. Update agent files to reference replacement
4. Remove link from agent files after grace period (1 week)

---

## Quality Assurance

These procedures maintain quality through:

1. **Single source of truth** - No duplication means no conflicting versions
2. **Cross-references** - Related procedures link to each other
3. **Version tracking** - Git history shows all changes
4. **Central location** - Easy to find and update
5. **Reduced token usage** - More space for actual agent guidance

---

## Examples of Complete References

### In BACKEND-DEV.md

```markdown
# BACKEND-DEV

## Identity
You implement backend code to make failing tests pass. GREEN phase of TDD...

## Key Procedures

These shared procedures define how you work:
- **Checkpoints**: See `.claude/procedures/handoff-templates.md`
- **TDD Workflow**: See `.claude/procedures/tdd-phase-flow.md` → Phase 3
- **Error Recovery**: See `.claude/procedures/error-recovery-common.md`
- **Quality Gates**: See `.claude/procedures/quality-gates-common.md`

## Backend-Specific Workflow

[Your agent-specific content here]
```

### In CODE-REVIEWER.md

```markdown
# CODE-REVIEWER

## Identity
You review code for correctness, security, and quality...

## Key Procedures

These shared procedures define code quality standards:
- **Checkpoints**: See `.claude/procedures/handoff-templates.md`
- **Review Criteria**: See `.claude/procedures/quality-gates-common.md`
- **Error Recovery**: See `.claude/procedures/error-recovery-common.md` → Code Reviewer section

## Code Review Specifics

[Your agent-specific review checklist here]
```

---

## File Sizes and Optimization

| File | Size | Purpose |
|------|------|---------|
| handoff-templates.md | ~3.2 KB | Checkpoint & handoff format |
| tdd-phase-flow.md | ~8.5 KB | Complete TDD workflow |
| error-recovery-common.md | ~12.1 KB | Error patterns & recovery |
| quality-gates-common.md | ~10.2 KB | Universal quality criteria |
| README.md | ~6.1 KB | This file |
| **Total** | ~40.1 KB | All procedures |

Agent files reduce by ~11,600 tokens when they reference instead of duplicate.

---

## Integration Timeline

**Phase 1: Create Procedures** (Done)
- All 4 procedure files created
- README with integration guide

**Phase 2: Update Agent Files** (Next)
- Add references to BACKEND-DEV.md
- Add references to FRONTEND-DEV.md
- Add references to SENIOR-DEV.md
- Add references to TEST-WRITER.md
- Add references to CODE-REVIEWER.md
- Add references to QA-AGENT.md
- Add references to TEST-ENGINEER.md
- Update AGENT-FOOTER.md

**Phase 3: Verify Usage** (After phase 2)
- Test agents can find all needed information
- Verify checkpoint format still works
- Confirm error recovery paths work
- Check cross-references are valid

**Phase 4: Remove Duplication** (Optional, after verification)
- Remove duplicated checkpoint sections from agent files
- Remove duplicated error recovery tables
- Keep agent-specific content
- Keep agent workflows

---

## Support and Questions

For questions about procedure content:
- Check cross-references first
- Look in related procedures
- Refer to related agent files for context
- Ask Architect if procedure needs clarification

For updating procedures:
- Make changes directly to procedure files
- Document changes in git commit message
- Agent files automatically use updated version
- No need to update agent files

---

