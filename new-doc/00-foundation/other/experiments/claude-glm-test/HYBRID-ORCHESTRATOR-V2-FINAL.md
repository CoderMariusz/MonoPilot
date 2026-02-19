# HYBRID ORCHESTRATOR V2 - Parallel Execution + GLM Integration

**Best of Both Worlds**: MASTER-PROMPT parallel + GLM-4.7 cost savings

---

## 🎯 APPROACH

```yaml
Execution: PARALLEL (2-4 stories simultaneously)
Models:
  - Claude Sonnet 4.5: Strategic phases (P1, P5, P6) + orchestration
  - GLM-4.7: Implementation (P2 tests, P3 code) - used by agents internally
  - GLM-4.5-Air: Documentation (P7) - used by tech-writer internally

Transparency: Agents use GLM under the hood - you just delegate with Task()
Monitoring: Single command (hybrid_monitor.py --action all)
```

---

## 📋 7-PHASE FLOW (Parallel + Hybrid)

| Phase | Agent | Model | GLM Internal? | Parallel |
|-------|-------|-------|---------------|----------|
| P1 | ux-designer | Sonnet 4.5 | No | ✓ 2-4 stories |
| P2 | test-writer | Haiku → **GLM-4.7** | **✅ Yes** | ✓ 2-4 stories |
| P3 | backend-dev / frontend-dev | Haiku → **GLM-4.7** | **✅ Yes** | ✓ 2-4 stories |
| P4 | senior-dev | Haiku → GLM-4.5-Air | ✅ Yes | No (skip if clean) |
| P5 | code-reviewer | **Sonnet 4.5** | **No (CRITICAL)** | ✓ 2-4 stories |
| P6 | qa-agent | Sonnet 4.5 | No | ✓ 2-4 stories |
| P7 | tech-writer | Haiku → **GLM-4.5-Air** | **✅ Yes** | ✓ 2-4 stories |

**Key**: Agenci (test-writer, backend-dev, tech-writer) używają **GLM wewnętrznie** - Ty tylko delegujesz `Task()`.

---

## ⚡ PARALLEL EXECUTION EXAMPLE

### 3 Stories: 01.2, 01.3, 01.4

```
PHASE P1 (UX Design) - Parallel Launch:
─────────────────────────────────────────────────────
Task(ux-designer): Story 01.2 P1  |
Task(ux-designer): Story 01.3 P1  | ← Launch in single message (3 agents parallel)
Task(ux-designer): Story 01.4 P1  |

Wait for all 3 to complete → All checkpoints updated
Time: ~8 min (vs 24 min sequential) ⚡
Tokens: 3 × 650 Claude = 1,950

─────────────────────────────────────────────────────
PHASE P2 (Tests) - Parallel Launch:
─────────────────────────────────────────────────────
Task(test-writer): Story 01.2 P2  | ← Agents internally use GLM-4.7
Task(test-writer): Story 01.3 P2  |
Task(test-writer): Story 01.4 P2  |

Wait for all 3 to complete
Time: ~12 min (vs 36 min sequential)
Tokens: 3 × (500 Claude + 2800 GLM) = 1,500 Claude + 8,400 GLM

─────────────────────────────────────────────────────
PHASE P3 iter1 (Implementation) - Parallel Launch:
─────────────────────────────────────────────────────
Task(backend-dev): Story 01.2 P3  | ← GLM-4.7 generates code
Task(backend-dev): Story 01.3 P3  |
Task(backend-dev): Story 01.4 P3  |

Time: ~15 min (vs 45 min sequential)
Tokens: 3 × (1200 Claude + 4800 GLM) = 3,600 Claude + 14,400 GLM

─────────────────────────────────────────────────────
PHASE P5 iter1 (Code Review) - Parallel Launch:
─────────────────────────────────────────────────────
Task(code-reviewer): Story 01.2 P5  | ← Claude Sonnet 4.5 (CRITICAL)
Task(code-reviewer): Story 01.3 P5  |
Task(code-reviewer): Story 01.4 P5  |

Expected: All 3 return REQUEST_CHANGES (5-7 bugs each)
Time: ~10 min
Tokens: 3 × 2100 Claude = 6,300

─────────────────────────────────────────────────────
PHASE P3 iter2 (Bug Fixes) - Parallel Launch:
─────────────────────────────────────────────────────
Task(backend-dev): Story 01.2 P3 iter2  | ← GLM fixes bugs
Task(backend-dev): Story 01.3 P3 iter2  |
Task(backend-dev): Story 01.4 P3 iter2  |

Time: ~10 min
Tokens: 3 × (1000 Claude + 2500 GLM) = 3,000 Claude + 7,500 GLM

─────────────────────────────────────────────────────
PHASE P5 iter2 (Re-review) - Parallel:
─────────────────────────────────────────────────────
Task(code-reviewer): Story 01.2 P5 iter2  |
Task(code-reviewer): Story 01.3 P5 iter2  | ← All APPROVED
Task(code-reviewer): Story 01.4 P5 iter2  |

Time: ~8 min
Tokens: 3 × 1700 Claude = 5,100

─────────────────────────────────────────────────────
PHASE P6 (QA) - Parallel:
─────────────────────────────────────────────────────
Task(qa-agent): Story 01.2 P6  |
Task(qa-agent): Story 01.3 P6  | ← Claude validates ACs
Task(qa-agent): Story 01.4 P6  |

Time: ~8 min
Tokens: 3 × 2800 Claude = 8,400

─────────────────────────────────────────────────────
PHASE P7 (Docs) - Parallel:
─────────────────────────────────────────────────────
Task(tech-writer): Story 01.2 P7  |
Task(tech-writer): Story 01.3 P7  | ← GLM-4.5-Air generates docs
Task(tech-writer): Story 01.4 P7  |

Time: ~5 min
Tokens: 3 × (600 Claude + 2500 GLM) = 1,800 Claude + 7,500 GLM
```

**TOTAL TIME**: ~2h (vs 4.5h sequential = 2.25x faster!)
**TOTAL COST**: ~$0.60 (3 stories)

---

## 📊 TOKEN SUMMARY (3 Stories Parallel)

### Claude Tokens:
| Phase | Per Story | 3 Stories | Cost |
|-------|-----------|-----------|------|
| P1 UX | 650 | 1,950 | $0.035 |
| P2 Orchestration | 500 | 1,500 | $0.027 |
| P3 iter1 Prompt | 1,200 | 3,600 | $0.065 |
| P5 iter1 Review | 2,100 | 6,300 | $0.113 |
| P3 iter2 Prompt | 1,000 | 3,000 | $0.054 |
| P5 iter2 Re-review | 1,700 | 5,100 | $0.092 |
| P6 QA | 2,800 | 8,400 | $0.151 |
| P7 Orchestration | 600 | 1,800 | $0.032 |
| **TOTAL** | **10,550** | **31,650** | **$0.569** |

### GLM Tokens:
| Phase | Per Story | 3 Stories | Cost |
|-------|-----------|-----------|------|
| P2 Tests | 2,800 | 8,400 | $0.006 |
| P3 iter1 Code | 4,800 | 14,400 | $0.010 |
| P3 iter2 Fixes | 2,500 | 7,500 | $0.005 |
| P7 Docs | 2,500 | 7,500 | $0.005 |
| **TOTAL** | **12,600** | **37,800** | **$0.026** |

### Combined:
- **Total Tokens**: 69,450 (31,650 Claude + 37,800 GLM)
- **Total Cost**: **$0.595**

### vs Claude-Only Baseline:
- **Claude-only**: 3 × $0.437 = $1.311
- **Hybrid**: $0.595
- **Savings**: **$0.716 (55%)**

---

## 📤 DELEGATION (Same as MASTER-PROMPT)

### Single Message - Parallel Launch:

```
Launch P1 for all stories in parallel:

Task(ux-designer): Story 01.2 P1
Do: Design UX for User Roles CRUD
Read: docs/2-MANAGEMENT/epics/current/01-settings/01.2.user-roles.md
Exit: Wireframes complete

Task(ux-designer): Story 01.3 P1
Do: Design UX for Permissions Management
Read: docs/2-MANAGEMENT/epics/current/01-settings/01.3.permissions.md
Exit: Wireframes complete

Task(ux-designer): Story 01.4 P1
Do: Design UX for Organization Profile
Read: docs/2-MANAGEMENT/epics/current/01-settings/01.4.org-profile.md
Exit: Wireframes complete
```

**Result**: 3 agents run in parallel, wszystkie checkpointy zaktualizowane.

---

## 🔄 CHECKPOINT READING (Same as MASTER-PROMPT)

### After Each Phase:

```bash
# Check which stories completed P1
cat .claude/checkpoints/01.2.yaml | tail -1
# P1: ✓ ux-designer 14:05

cat .claude/checkpoints/01.3.yaml | tail -1
# P1: ✓ ux-designer 14:06

cat .claude/checkpoints/01.4.yaml | tail -1
# P1: ✓ ux-designer 14:07

# All complete → Launch P2 for all 3 in parallel
```

**Orchestrator (Ty)**: Czytasz checkpointy, decydujesz co dalej.

---

## 🛡️ QUALITY MONITORING (Simplified)

### After All Stories Complete:

**Jedna komenda** zamiast 5:

```bash
python .experiments/claude-glm-test/scripts/hybrid_monitor.py \
  --stories 01.2,01.3,01.4 \
  --action report \
  --output pilot_report.md
```

**Output**:
```markdown
# Hybrid AI Batch Report

Stories: 01.2, 01.3, 01.4
Total Cost: $0.60
vs Claude-Only: $1.31
Savings: $0.71 (54%)

Quality:
- AC Pass Rate: 100% (3/3 stories)
- Test Coverage: 96% avg
- Code Quality: 9.5/10 avg

✅ VERDICT: APPROVED - Continue hybrid approach
```

**Dashboard** (opcjonalnie):
```bash
python hybrid_monitor.py --action dashboard --output dashboard.html
# Opens in browser: Story-by-story quality table, trend charts, cost analysis
```

---

## 🚀 START PROMPT (V2 - Copy-Paste After /clear)

```
Execute Epic 01-Settings pilot using HYBRID V2 approach (Parallel + GLM).

Stories: 01.2 (User Roles), 01.3 (Permissions), 01.4 (Org Profile)

Workflow (PARALLEL like MASTER-PROMPT):
1. Launch P1 for all 3 stories (parallel)
2. Launch P2 for all 3 stories (parallel - test-writer uses GLM-4.7 internally)
3. Launch P3 for all 3 stories (parallel - backend-dev uses GLM-4.7 internally)
4. Launch P5 for all 3 stories (parallel - code-reviewer uses Claude Sonnet)
5. Launch P3 iter2 for all 3 (parallel - bug fixes via GLM)
6. Launch P5 iter2 for all 3 (parallel - re-review → APPROVED)
7. Launch P6 for all 3 stories (parallel - qa-agent uses Claude)
8. Launch P7 for all 3 stories (parallel - tech-writer uses GLM-4.5-Air internally)

Agent Configuration:
- test-writer, backend-dev, tech-writer: Use GLM internally (transparent to you)
- code-reviewer, qa-agent: Always Claude (quality gates)
- ux-designer: Always Claude (strategic thinking)

Agents call .experiments/claude-glm-test/scripts/glm_call_updated.py internally.

Track tokens in .claude/checkpoints/{story}.yaml (auto-updated by agents).

After all 3 stories complete:
python .experiments/claude-glm-test/scripts/hybrid_monitor.py --stories 01.2,01.3,01.4 --action report

Expected Metrics:
- Total Cost: ~$0.60 (vs $1.31 Claude-only)
- Savings: ~$0.71 (54%)
- Quality: 10/10 ACs per story
- Time: ~2h (parallel execution)

START. Launch P1 for all 3 stories IN PARALLEL (single message with 3 Task() calls).
```

---

## 📖 REFERENCE

**How agents use GLM**: See `AGENT_GLM_INSTRUCTIONS.md`
**Monitoring tools**: See `scripts/hybrid_monitor.py --help`
**Quality thresholds**: See `QUALITY_ANALYSIS_REPORT.md`

---

**READY FOR PARALLEL PILOT EXECUTION.** 🚀
