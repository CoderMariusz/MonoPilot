# Shared Procedures - Implementation Guide

This guide shows how to integrate the shared procedures into existing agent files to eliminate duplication.

## Phase 2: Updating Agent Files (Not Yet Done)

The shared procedures have been created. Agent files still contain duplicate content. This phase involves updating agent files to reference the shared procedures.

---

## Step-by-Step Integration

### For Each Agent File:

**1. Identify which procedures apply to your agent**

| Agent | Uses | Use Cases |
|-------|------|-----------|
| BACKEND-DEV | All 4 | Implementation, checkpoints, errors, quality gates |
| FRONTEND-DEV | All 4 | Implementation, checkpoints, errors, quality gates |
| SENIOR-DEV | All 4 | Refactoring, checkpoints, errors, quality gates |
| TEST-WRITER | 1,2,3,4 | Test writing, phase flow, checkpoints, errors, gates |
| TEST-ENGINEER | 1,2,3,4 | Verification, checkpoints, errors, gates |
| CODE-REVIEWER | 1,2,3,4 | Review criteria, checkpoints, errors, quality gates |
| QA-AGENT | 1,2,3,4 | Testing, checkpoints, errors, acceptance gates |
| DEVOPS-AGENT | 1,3,4 | Deployment, errors, quality gates (skip TDD) |
| PM-AGENT | 1,3 | Planning, checkpoints, error escalation |
| ARCHITECT | 1,3,4 | Decisions, checkpoints, errors, quality gates |
| PRODUCT-OWNER | 1,3 | Approval, checkpoints, error escalation |
| RESEARCH-AGENT | 1,3 | Checkpoints, errors (skip TDD/quality gates) |

---

## Example Integration: BACKEND-DEV.md

### Before (Current)

```markdown
# BACKEND-DEV

## Identity
[Identity content]

## Workflow
[Current workflow, including TDD details]

## Error Recovery

| Situation | Action |
|-----------|--------|
| Tests still fail | Debug logic, verify expectations |
| Migration fails | Rollback, fix, retry |
| Security concern | Fix immediately, don't proceed |

---

## 📋 OUTPUT PROTOCOL (mandatory)

### ❌ NEVER
- Write reports...
- [etc - 200+ lines of duplicated content]

### ✅ ALWAYS
[Another 200+ lines]
```

### After (With References)

```markdown
# BACKEND-DEV

## Identity
[Identity content - unchanged]

## Workflow
[Workflow content - unchanged]

## Shared Procedures

**All backend developers reference these core procedures**:

1. **Checkpoints & Handoffs**
   See: `.claude/procedures/handoff-templates.md`
   - How to append checkpoint after your phase
   - Metrics to include in checkpoints
   - Micro-handoff format to orchestrator

2. **TDD Phase Flow (Phase 3: GREEN)**
   See: `.claude/procedures/tdd-phase-flow.md` → "Phase 3: GREEN Phase - Implementation"
   - Core rules for implementation
   - Implementation order (models → services → API)
   - Quality requirements
   - Per-test workflow
   - When to transition to P4

3. **Error Recovery**
   See: `.claude/procedures/error-recovery-common.md` → "Development Agents"
   - When tests fail after implementation
   - When migration fails
   - When performance issues occur
   - Escalation criteria

4. **Quality Gates**
   See: `.claude/procedures/quality-gates-common.md`
   - Universal gates (tests pass, no secrets, input validation, etc.)
   - P3 specific gates (coverage, all tests pass)
   - Quality decision matrix

## Error Recovery

### Backend-Specific Errors

[Any errors unique to backend that aren't in common error-recovery]

---

## 📋 OUTPUT PROTOCOL (mandatory)

See: `.claude/procedures/handoff-templates.md` for complete protocol including:
- Checkpoint append command
- Checkpoint format examples (P1-P7)
- Metrics reference
- Micro-handoff format
- Key principles

**Summary**:
1. Do your task following workflow above
2. Append checkpoint: `echo "P3: ✓ backend-dev ..." >> .claude/checkpoints/{STORY_ID}.yaml`
3. Micro-handoff to orchestrator with metrics (≤50 tokens)
4. Stop - no additional commentary
```

---

## Benefits of This Approach

### For Agents
- Single reference point instead of copying content
- Always get latest version of procedures
- Less content to read per file

### For Maintainers
- Update procedure once, affects all agents
- Clear separation of concern (shared vs. agent-specific)
- Easier to track changes

### For Token Budget
- ~86,800 tokens saved across all agents
- More space for agent-specific guidance
- Better context budget usage

---

## Checklist: Things to Keep in Agent Files

Do NOT remove these from agent files when referencing shared procedures:

- ✓ Agent identity and purpose
- ✓ Agent workflow (agent-specific steps)
- ✓ Agent-specific error recovery (unique to their role)
- ✓ Agent-specific quality gates (specialized criteria)
- ✓ Agent's relationship to other agents
- ✓ Agent's skill requirements

Do REMOVE these and reference shared procedures instead:

- ✗ Universal error recovery table
- ✗ Checkpoint templates and examples
- ✗ TDD phase definitions
- ✗ Universal quality gates
- ✗ Output protocol details

---

## Checklist: Things to UPDATE in Agent Files

When adding references to shared procedures:

- [ ] Add "Shared Procedures" section after "Workflow"
- [ ] Add 4 links to shared procedures (what applies to your agent)
- [ ] Explain briefly what each shared procedure provides
- [ ] Keep agent-specific content below
- [ ] Update "Error Recovery" to reference common procedure
- [ ] Update "OUTPUT PROTOCOL" to reference handoff-templates.md
- [ ] Remove duplicate output protocol content
- [ ] Test that all needed information is still accessible

---

## Quick Reference: Where Content Moved

### Content now in handoff-templates.md

Previously duplicated in: AGENT-FOOTER.md, BACKEND-DEV.md, FRONTEND-DEV.md, SENIOR-DEV.md, etc.

- [x] `## 📋 OUTPUT PROTOCOL (mandatory)` section
- [x] Checkpoint format examples (all 7 phases)
- [x] Checkpoint append command
- [x] Metrics reference table
- [x] Micro-handoff format
- [x] Key principles for checkpoints
- [x] Checkpoint mistakes to avoid

### Content now in tdd-phase-flow.md

Previously scattered across: TEST-WRITER.md, BACKEND-DEV.md, FRONTEND-DEV.md, SENIOR-DEV.md

- [x] Phase definitions (P1-P7)
- [x] Phase transition criteria
- [x] TDD cycle overview
- [x] When tests go RED explanation
- [x] Common mistakes per phase
- [x] Test quality checklist
- [x] Implementation order

### Content now in error-recovery-common.md

Previously duplicated in: All 12 agent files

- [x] Universal error recovery table
- [x] Error recovery by agent type
- [x] Checkpoint write failures
- [x] Story ID handling
- [x] Phase number clarity
- [x] Escalation criteria
- [x] Debugging tools
- [x] Database/cache errors
- [x] Git errors

### Content now in quality-gates-common.md

Previously duplicated in: TEST-WRITER.md, BACKEND-DEV.md, CODE-REVIEWER.md, QA-AGENT.md

- [x] Tests must pass gate
- [x] No hardcoded secrets gate
- [x] Input validation gate
- [x] Error handling gate
- [x] Multi-tenancy gate
- [x] No SQL injection gate
- [x] Type safety gate
- [x] Performance gate
- [x] Commit message quality gate
- [x] Phase-specific gates (P2-P6)
- [x] Quality gate decision matrix

---

## Migration Path for Each Agent

### BACKEND-DEV.md

Lines to remove/replace:
- Lines 272-497: Remove full error recovery table and add reference to error-recovery-common.md
- Lines 282-492: Remove OUTPUT PROTOCOL section and add reference to handoff-templates.md

Replace with:
```markdown
See: `.claude/procedures/handoff-templates.md` for checkpoint format and OUTPUT PROTOCOL

See: `.claude/procedures/tdd-phase-flow.md` → "Phase 3: GREEN Phase" for implementation workflow

See: `.claude/procedures/error-recovery-common.md` → "Development Agents" for error handling

See: `.claude/procedures/quality-gates-common.md` for universal quality gates
```

### SENIOR-DEV.md

Lines to remove/replace:
- Lines 70-177: Error recovery table (reduce from ~100 lines to reference)
- Lines 80-295: OUTPUT PROTOCOL section (reduce from ~220 lines to reference)

### CODE-REVIEWER.md

Lines to remove/replace:
- Lines 64-71: Error recovery (reduce to reference)
- Lines 74-?: OUTPUT PROTOCOL (reduce to reference)

### TEST-WRITER.md, TEST-ENGINEER.md, etc.

Similar pattern: Replace long duplicate sections with references to shared procedures

---

## Verification Checklist

After updating an agent file, verify:

- [ ] Agent still has clear identity and purpose
- [ ] Agent workflow is still specific to that agent
- [ ] Shared procedure links are correct (use exact paths from procedures/)
- [ ] All needed information is accessible (either in agent file or referenced)
- [ ] Agent-specific error recovery is still present
- [ ] Agent-specific quality gates are still present
- [ ] OUTPUT PROTOCOL section references handoff-templates.md
- [ ] File size reduced by 20-30% (due to removed duplication)
- [ ] Agent instructions still make sense

---

## Testing the Integration

### For Each Updated Agent File

1. **Read the file end-to-end**
   - Does the agent understand their purpose?
   - Can they find checkpoint format?
   - Can they find error recovery procedures?
   - Can they find quality gates?

2. **Verify reference paths work**
   ```bash
   # Check each reference path exists
   ls .claude/procedures/handoff-templates.md
   ls .claude/procedures/tdd-phase-flow.md
   ls .claude/procedures/error-recovery-common.md
   ls .claude/procedures/quality-gates-common.md
   ```

3. **Simulate an agent's workflow**
   - Test-Writer workflow: Can they find red phase definition?
   - Backend-Dev workflow: Can they find implementation rules?
   - Senior-Dev workflow: Can they find refactoring criteria?
   - Code-Reviewer workflow: Can they find quality gates?

---

## Rollback Plan

If integration causes problems:

1. Revert the commit(s)
   ```bash
   git revert HEAD~N  # revert to before integration
   ```

2. Keep the shared procedures (they're useful even if not fully referenced)

3. Re-integrate more carefully:
   - Update one agent at a time
   - Test each agent thoroughly
   - Get feedback before updating all

---

## Timeline for Phase 2

**Session 1**: Update 4 development agents
- [ ] BACKEND-DEV.md
- [ ] FRONTEND-DEV.md
- [ ] SENIOR-DEV.md
- [ ] TEST-WRITER.md

**Session 2**: Update 4 quality/review agents
- [ ] TEST-ENGINEER.md
- [ ] CODE-REVIEWER.md
- [ ] QA-AGENT.md
- [ ] DEVOPS-AGENT.md

**Session 3**: Update 4 planning/product agents
- [ ] ARCHITECT-AGENT.md
- [ ] PM-AGENT.md
- [ ] PRODUCT-OWNER.md (if exists)
- [ ] RESEARCH-AGENT.md

**Session 4**: Final cleanup
- [ ] Update AGENT-FOOTER.md
- [ ] Verify all cross-references work
- [ ] Test checkpoint flow end-to-end

---

## Success Criteria

Phase 2 is complete when:

1. **All agent files updated** - Each agent references shared procedures
2. **No duplicate content** - Universal sections removed from agent files
3. **Verification passes** - All agents can access needed information
4. **Checkpoint flow works** - P1-P7 pipeline still functions
5. **Documentation accurate** - All references point to correct locations
6. **Token budget improved** - Agents reduced by 20-30% on average

---

## Support and Questions

Questions during Phase 2?

1. **Can't find reference?** Check README.md cross-reference map
2. **Reference path unclear?** Use exact path from `.claude/procedures/README.md`
3. **Agent-specific content?** Keep it in the agent file, don't move it
4. **Missing something?** It's probably agent-specific (belongs in agent file)

---

## Next Steps After Phase 2

Once all agent files reference shared procedures:

1. Monitor for issues in actual usage
2. Collect feedback on procedure clarity
3. Update procedures based on agent feedback
4. Create additional procedures for new patterns
5. Consider archiving old agent content

---

## Glossary

| Term | Meaning |
|------|---------|
| **Shared Procedure** | Document in `.claude/procedures/` referenced by multiple agents |
| **Agent-Specific** | Content unique to one agent, stays in agent file |
| **Universal Content** | Content applying to all agents, now in shared procedures |
| **Reference** | Link from agent file to shared procedure (e.g., "See: .claude/procedures/...") |
| **Integration** | Process of updating agent files to reference shared procedures |
| **Duplication** | Same content appearing in multiple files (what we're fixing) |
| **Single Source of Truth** | One place that has the content, other places reference it |

