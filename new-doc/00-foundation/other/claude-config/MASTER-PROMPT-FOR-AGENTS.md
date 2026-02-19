# ORCHESTRATOR - Multi-AI Coordination

## TARGET
```yaml
Stories: {{STORY_IDS}}
Epic: {{EPIC_ID}}
```

## QUICK STATUS
Read: `.claude/NEXT-ACTIONS.yaml` (NOT full IMPLEMENTATION-ROADMAP.yaml)

## PRE-DELEGATION: SCRIPT-FIRST APPROACH

**MANDATORY**: Run helper scripts BEFORE spawning agents to minimize tokens.

```bash
# For each story:
./scripts/load-story-context.sh {STORY_ID}

# For P2 (tester):
./ops e2e:detect-type apps/frontend/app/(authenticated)/{module}/{feature}/page.tsx
./ops e2e:extract-selectors apps/frontend/components/{module}/{feature}/

# For P3 (developer):
./scripts/query-table-schema.sh {table_names}
./scripts/extract-api-endpoints.sh apps/frontend/app/api/{module}
./scripts/extract-service-patterns.sh {service_name}
```

## 7-PHASE FLOW

| Phase | Agent/Tool | Output |
|-------|-----------|--------|
| P0 | orchestrator | Load story context, run pre-scripts |
| P1 | planner (skip if backend-only) | Wireframes, story context YAML |
| P2 | tester (Claude subagent) | Failing tests + 2 handoff files |
| P3a | **Kimi via KiloCode** | Frontend components (updates handoff) |
| P3b | **Codex exec / Cursor** | Backend implementation |
| P4 | developer (Claude subagent) | Refactor if needed (skip if clean) |
| P5 | quality (Claude subagent) | Code review: APPROVED/REJECTED |
| P6 | quality (Claude subagent) | QA: PASS/FAIL |
| P7 | documenter (Claude Haiku) | Docs, NEXT-ACTIONS update |

## HANDOFF RULES (STRICT)

### After P2 (tests written):
1. **GENERATE**: `.claude/handoffs/{STORY_ID}-frontend.md`
2. **GENERATE**: `.claude/handoffs/{STORY_ID}-backend.md`
3. Include: test file paths, data-testid list, wireframe refs, pattern refs
4. Include: pre-analyzed schema output from scripts
5. Notify user: "Handoff files ready. Open frontend.md in KiloCode (Kimi)."

### After P3a (Kimi frontend done):
1. **VERIFY**: Kimi appended "Components Created" section to frontend handoff
2. **MERGE**: Frontend output into backend handoff context
3. **ROUTE**: To Codex/Cursor for P3b
4. Notify user: "Frontend done. Pass both handoff files to Codex."

### After P3b (Codex backend done):
1. **ROUTE**: To P4 (refactor) or P5 (review)
2. **PASS**: Both handoff files as review context

### After P5 (review):
- APPROVED -> P6
- REJECTED -> back to developer (P3/P4), not Kimi/Codex re-run

### After P6 (QA):
- PASS -> P7
- FAIL -> back to developer (P3/P4) for fixes, then re-run P5->P6

## CHECKPOINT SYSTEM

Location: `.claude/checkpoints/{STORY_ID}.yaml`

Read last line -> route next phase:
```
P1 done -> tester (P2)
P2 done -> Kimi/Codex (P3a/P3b) via handoff files
P3 done -> developer (P4) or quality (P5)
P4 done -> quality (P5)
P5 approved -> quality (P6)
P5 rejected -> developer (P3)
P6 pass -> documenter (P7)
P6 fail -> developer (P3)
P7 done -> STORY COMPLETE
```

## PARALLEL RULES

```yaml
PARALLEL:
  - Independent stories (different modules)
  - P3a + P3b same story (frontend + backend)
  - P5/P6 different stories

SEQUENTIAL:
  - Same story phases: P1->P2->P3->P4->P5->P6->P7
  - Failed phase: fix -> re-run -> continue
```

## DELEGATION FORMAT (<=400 tokens)

```
Task({agent}): {STORY_ID} P{N}
Do: {objective}
Read: handoffs/{STORY_ID}-{type}.md
Exit: checkpoint written
```

## CRITICAL RULES

1. Read `NEXT-ACTIONS.yaml`, NOT full `IMPLEMENTATION-ROADMAP.yaml`
2. Generate handoff files after P2 (MANDATORY)
3. Kimi/Codex get ONLY their handoff file + pattern refs
4. Max 4 parallel agents
5. Run pre-scripts before delegation (orchestrator responsibility)
6. **STRICT wireframe compliance** (check docs/3-Architecture/ux/wireframes/)
7. Update NEXT-ACTIONS.yaml after story completion
8. Always one story per agent
9. Run `./ops check` before marking COMPLETED
10. Compress context or close subagent if approaching limit

## AGENT REGISTRY (7 agents)

| Agent | Model | Phase | Purpose |
|-------|-------|-------|---------|
| planner | opus | P1 | Architecture, PRD, stories |
| tester | sonnet | P2 | Failing tests + handoff files |
| developer | sonnet | P3/P4 | Implementation + refactor |
| quality | opus | P5/P6 | Code review + QA |
| documenter | haiku | P7 | Docs + roadmap update |
| devops | sonnet | Deploy | CI/CD, migrations |
| researcher | haiku | Any | Read-only exploration |

## EXTERNAL AI TOOLS

| Tool | Purpose | Access |
|------|---------|--------|
| KiloCode + Kimi K2.5 | Frontend components (P3a) | User opens handoff in KiloCode |
| Codex CLI / Cursor | Backend implementation (P3b) | User pastes/pipes handoff |

## ERROR RECOVERY

| Status | Action |
|--------|--------|
| blocked | Check blockers, resolve or escalate |
| failed | Retry once, then escalate |
| needs_input | Route to planner |
| context_full | /compact or close subagent + short handover |

---

**References:**
- `.claude/NEXT-ACTIONS.yaml` - What to work on next
- `.claude/IMPLEMENTATION-ROADMAP.yaml` - Full details (load on demand only)
- `.claude/handoffs/README.md` - Handoff format docs

**START. NO QUESTIONS. DELEGATE IMMEDIATELY.**