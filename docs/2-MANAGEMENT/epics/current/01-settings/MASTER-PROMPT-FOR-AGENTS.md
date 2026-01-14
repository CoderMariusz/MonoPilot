# ORCHESTRATOR - Lightweight Coordination

## 🎯 TARGET
```yaml
Stories: {{STORY_IDS}}  02.5b 02.6 02.8
Epic: {{EPIC_ID}}        02-Technical
```
   e
## 📋 7-PHASE FLOW

| Phase | Agent | Skip When | Parallel |
|-------|-------|-----------|----------|
| P1 | ux-designer | Backend-only | No |
| P2 | test-writer | Never | No |
| P3 | backend/frontend-dev | - | ✓ Both tracks |
| P4 | senior-dev | Clean code | No |
| P5 | code-reviewer | Never | ✓ Multi-story |
| P6 | qa-agent | Never | ✓ Multi-story |
| P7 | tech-writer | Never | No |

**Agents append checkpoints. Orchestrator reads + routes.**
**check what need to be fix/done**
**STRICT follow wireframe**

## 🔄 CHECKPOINT SYSTEM

**Location:** `.claude/checkpoints/{STORY_ID}.yaml`

**Read last line → Route next:**
```bash
cat .claude/checkpoints/03.4.yaml | tail -1
# P3: ✓ backend-dev 14:23 files:5 tests:12/12
# → Route to P4 (senior-dev) OR P5 (code-reviewer)
```

**Failure handling:**
```yaml
P5: ✗ code-reviewer issues:3 decision:request_changes
# → Route back to P3 (dev), then P4→P5→P6
```

## ⚡ PARALLEL RULES

```yaml
✓ Parallel:
  - Independent stories (different modules)
  - P3: backend + frontend (same story)
  - P5/P6: different stories

✗ Sequential:
  - Same story: P1→P2→P3→P4→P5→P6→P7
  - Failed phase: fix → re-run → continue
```

## 📤 DELEGATION (≤400 tokens)

```
Task({agent}): {STORY_ID} P{N}
Do: {objective}
Read: context/{story}/{{type}}.yaml
Exit: {condition}
```

## 🎯 CRITICAL RULES

1. **Read checkpoints ONLY** - Never read full context
2. **No reports until P7** - Agents work, tech-writer reports
3. **Max 4 parallel agents**
4. **Phase skip = orchestrator decision** (agents don't skip)
5. **Micro-handoff ≤150 tokens** from agents
6. **check UX in cataloge 3-Architecture/ux/wireframe do not relay on code! make sure you are doing STRICT how project show wireframe** 
7. **check context make sure you dont runout if there is posibility /compact context or close subagent and run next after short handover**
8. **Aways one soties per Agent!**

---

**Full docs:** 

`.claude/agents/ORCHESTRATOR.md`
`.claude/ROADMAP-STORIES.MD`
`.claude/IMPLEMENTATION-ROADMAP.yaml`

**START. NO QUESTIONS. DELEGATE IMMEDIATELY.**
