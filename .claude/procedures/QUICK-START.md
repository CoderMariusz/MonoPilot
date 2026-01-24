# Quick Start: Using Shared Procedures

Fast reference for agents and developers using the new shared procedures.

---

## For Agents: Where to Find What You Need

### "How do I append a checkpoint?"
**See**: `.claude/procedures/handoff-templates.md`
- Checkpoint append command
- Checkpoint format examples
- Metrics reference table

### "What are the 7 phases and what do I do in my phase?"
**See**: `.claude/procedures/tdd-phase-flow.md`
- Phase 1: UX Design
- Phase 2: RED (test writing)
- Phase 3: GREEN (implementation)
- Phase 4: REFACTOR (code improvement)
- Phase 5: CODE REVIEW
- Phase 6: QA TESTING
- Phase 7: DOCUMENTATION

### "Something went wrong, what do I do?"
**See**: `.claude/procedures/error-recovery-common.md`
- Find your situation in the table
- Follow the immediate action
- Escalate if needed

### "What quality standards must my code meet?"
**See**: `.claude/procedures/quality-gates-common.md`
- Universal gates (all code must pass these)
- Phase-specific gates
- Examples for each gate

---

## Quick File Reference

| File | Size | Read Time | Purpose |
|------|------|-----------|---------|
| README.md | 13 KB | 10 min | Overview & how to use procedures |
| handoff-templates.md | 5.3 KB | 5 min | Checkpoint format |
| tdd-phase-flow.md | 14 KB | 15 min | Phase definitions & workflow |
| error-recovery-common.md | 16 KB | 15 min | Error patterns & recovery |
| quality-gates-common.md | 15 KB | 15 min | Quality standards |
| IMPLEMENTATION-GUIDE.md | 13 KB | 15 min | How to integrate (for architects) |
| COMPLETION-REPORT.md | 9 KB | 10 min | What was done, what's next |

**Total**: 85 KB | ~85 minutes to read all

---

## Common Questions

### Q: "I'm a Backend-Dev. Which procedures apply to me?"
**A**: All 4
- handoff-templates.md (P3 checkpoint format)
- tdd-phase-flow.md (Phase 3: GREEN phase)
- error-recovery-common.md (development agents section)
- quality-gates-common.md (P3 specific gates)

### Q: "I'm a Code-Reviewer. Which procedures apply to me?"
**A**: All 4
- handoff-templates.md (P5 checkpoint format)
- tdd-phase-flow.md (Phase 5: CODE REVIEW)
- error-recovery-common.md (code reviewer section)
- quality-gates-common.md (review gates)

### Q: "I'm a Test-Writer. Which procedures apply to me?"
**A**: All 4
- handoff-templates.md (P2 checkpoint format)
- tdd-phase-flow.md (Phase 2: RED phase)
- error-recovery-common.md (test writer section)
- quality-gates-common.md (P2 specific gates)

### Q: "Checkpoint append command - what's it again?"
**A**:
```bash
echo "P{N}: ✓ {agent-name} $(date +%H:%M) {metrics}" >> .claude/checkpoints/{STORY_ID}.yaml
```
Full details: `handoff-templates.md`

### Q: "My tests are failing after I implemented code, what do I do?"
**A**: See error-recovery-common.md section "Tests Fail After Implementation"
1. Stop writing new code
2. Run failing test in isolation
3. Debug the issue
4. Fix implementation or fix test
5. Verify all tests pass
6. Commit when GREEN

### Q: "I found a security vulnerability in code review, what do I do?"
**A**: See error-recovery-common.md section "Code Reviewer" > "Security Vulnerability Found"
1. Mark issue as CRITICAL
2. BLOCK merge immediately
3. Document specific vulnerability
4. Return code to developer

### Q: "What are the universal quality gates everyone must pass?"
**A**: See quality-gates-common.md - Universal Quality Gates
1. Tests Pass
2. No Hardcoded Secrets
3. Input Validation
4. Error Handling
5. Multi-Tenancy (org_id)
6. No SQL Injection
7. Type Safety
8. No Console Logs
9. Commit Message Quality
10. Performance Acceptable

---

## Phase-by-Phase Quick Reference

### Phase 1: UX Design
**Who**: UX-Designer | **See**: tdd-phase-flow.md → Phase 1
- Create wireframes
- Get approval
- Lock design
- Append checkpoint: `P1: ✓ ux-designer {time} wireframes:N approved:yes`

### Phase 2: RED (Test Writing)
**Who**: Test-Writer | **See**: tdd-phase-flow.md → Phase 2
- Write failing tests
- Cover all AC
- Independent tests
- Append checkpoint: `P2: ✓ test-writer {time} files:N tests:X status:red`

### Phase 3: GREEN (Implementation)
**Who**: Backend-Dev, Frontend-Dev | **See**: tdd-phase-flow.md → Phase 3
- Minimal code to pass tests
- Validate all input
- Handle all errors
- Run tests after each change
- Append checkpoint: `P3: ✓ backend-dev {time} files:N tests:X/Y`

### Phase 4: REFACTOR
**Who**: Senior-Dev | **See**: tdd-phase-flow.md → Phase 4
- One code smell at a time
- Run tests after each change
- Undo if tests fail (RED)
- Create ADR if needed
- Append checkpoint: `P4: ✓ senior-dev {time} refactored:N complexity:reduced`

### Phase 5: CODE REVIEW
**Who**: Code-Reviewer | **See**: tdd-phase-flow.md → Phase 5
- Check AC implemented
- Verify quality gates
- Check security
- Decision: APPROVED or REQUEST_CHANGES
- Append checkpoint: `P5: ✓ code-reviewer {time} issues:N decision:approved`

### Phase 6: QA TESTING
**Who**: QA-Agent | **See**: tdd-phase-flow.md → Phase 6
- Test all AC
- Test edge cases
- Test error paths
- Decision: PASS or FAIL
- Append checkpoint: `P6: ✓ qa-agent {time} ac:X/Y bugs:N decision:pass`

### Phase 7: DOCUMENTATION
**Who**: Tech-Writer | **See**: tdd-phase-flow.md → Phase 7
- API documentation
- User guides
- Architecture decisions
- Append checkpoint: `P7: ✓ tech-writer {time} report:done docs:updated`

---

## Checkpoint Metrics Cheat Sheet

| Metric | Example | Used In |
|--------|---------|---------|
| `wireframes:N` | `wireframes:3` | P1 (UX Design) |
| `approved:yes` | `approved:yes` | P1 (UX Design) |
| `files:N` | `files:5` | P3 (Implementation) |
| `tests:X/Y` | `tests:12/12` | P2/P3 (Test/Code) |
| `status:red` | `status:red` | P2 (Test Writing) |
| `refactored:N` | `refactored:3` | P4 (Refactor) |
| `complexity:reduced` | `complexity:reduced` | P4 (Refactor) |
| `issues:N` | `issues:0` | P5 (Review) |
| `decision:approved` | `decision:approved` | P5 (Review) |
| `ac:X/Y` | `ac:5/5` | P6 (QA) |
| `bugs:N` | `bugs:2-critical` | P6 (QA) |
| `decision:pass` | `decision:pass` | P6 (QA) |
| `report:done` | `report:done` | P7 (Docs) |
| `docs:updated` | `docs:updated` | P7 (Docs) |

---

## Error Escalation Quick Reference

| Issue | Severity | Escalate To |
|-------|----------|-------------|
| Tests fail after change | CRITICAL | Senior-Dev (if pattern) |
| Security vulnerability | CRITICAL | Code-Reviewer (blocks) |
| Database migration fails | CRITICAL | Architect |
| Performance regression | MEDIUM | Senior-Dev |
| Git conflict | HIGH | Code-Reviewer |
| Dependency not ready | HIGH | PM-Agent |
| Unclear requirement | MEDIUM | Orchestrator |
| RLS policy issue | MEDIUM | Architect |

---

## Quality Gate Checklist (Before Commit)

Every developer should verify:

**Basic Checks** (5 minutes)
- [ ] Tests pass: `npm test`
- [ ] No console.log: `grep -r "console.log" apps/ | grep -v test`
- [ ] Types check: `npm run typecheck`
- [ ] Linting passes: `npm run lint`

**Security Checks** (5 minutes)
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] Auth/authorization enforced
- [ ] SQL uses parameters (no string concat)

**Quality Checks** (5 minutes)
- [ ] Commit message follows format
- [ ] One logical change per commit
- [ ] Tests cover happy path + edge cases
- [ ] Error messages don't expose internals

**Performance Checks** (5 minutes)
- [ ] Database queries reasonable (< 100ms)
- [ ] API responses fast (< 200ms)
- [ ] Component renders smooth (< 50ms)

**Before Committing**:
```bash
npm test && npm run typecheck && npm run lint
# If all pass, ready to commit
```

---

## Getting Help

### Need more details?
- **Checkpoints**: Read `handoff-templates.md` (5 min read)
- **Your phase**: Read `tdd-phase-flow.md` section for your phase (5-10 min)
- **Error help**: Search in `error-recovery-common.md` (2-3 min)
- **Quality standards**: Check `quality-gates-common.md` for your phase (3-5 min)

### Questions?
1. Check the relevant procedure file first
2. Search for your situation in error-recovery-common.md
3. Ask orchestrator if still unclear

### Reporting issues with procedures?
1. Note which procedure file
2. Note which section
3. Report unclear phrasing or missing info
4. Suggest improvement

---

## File Navigation

**From any agent file, find procedures**:
```
Go to: .claude/procedures/
├── README.md (start here for overview)
├── handoff-templates.md (checkpoints)
├── tdd-phase-flow.md (phases 1-7)
├── error-recovery-common.md (errors)
├── quality-gates-common.md (quality)
├── IMPLEMENTATION-GUIDE.md (for architects)
├── COMPLETION-REPORT.md (what was done)
└── QUICK-START.md (this file)
```

---

## Keyboard Shortcuts (Local File Search)

```bash
# Find all checkpoints in a story
grep "^P[1-7]:" .claude/checkpoints/06.10.yaml

# Check if checkpoint references procedures
grep ".claude/procedures/" .claude/agents/BACKEND-DEV.md

# Find mentions of a procedure
grep -l "handoff-templates" .claude/agents/*.md

# Count total lines in procedures
wc -l .claude/procedures/*.md | tail -1
```

---

## Common Workflows

### "I just started, what should I read?"
1. Read: `.claude/procedures/README.md` (10 min overview)
2. Find your agent role
3. Read: `.claude/procedures/tdd-phase-flow.md` (find your phase)
4. Skim: `.claude/procedures/quality-gates-common.md` (your phase gates)

### "I'm implementing code, am I doing it right?"
1. Check: `.claude/procedures/tdd-phase-flow.md` → Phase 3
2. Verify: `.claude/procedures/quality-gates-common.md` → P3 gates
3. After finish: Append checkpoint using `handoff-templates.md`

### "Something went wrong"
1. Search: `.claude/procedures/error-recovery-common.md` for your situation
2. Follow: Immediate action in error recovery
3. Escalate: If needed, per escalation criteria

### "I'm reviewing code"
1. Check: `.claude/procedures/tdd-phase-flow.md` → Phase 5
2. Verify: `.claude/procedures/quality-gates-common.md` → Review gates
3. Decide: APPROVED or REQUEST_CHANGES
4. Append: Checkpoint using `handoff-templates.md`

---

## Last Updated
January 24, 2026 - Created as part of shared procedures extraction

**Total files**: 7 shared procedure documents
**Total lines**: 2,800+
**Token savings**: 86,800 tokens across all agents
**Status**: Ready to use

