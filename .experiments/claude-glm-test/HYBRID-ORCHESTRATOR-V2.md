# HYBRID ORCHESTRATOR V2 - Parallel + GLM Integration

**Combines**: MASTER-PROMPT parallel execution + GLM-4.7 hybrid approach

---

## 🎯 KEY IMPROVEMENTS

### vs V1 (Sequential):
1. ✅ **Parallel Story Execution** - Process 2-3 stories simultaneously
2. ✅ **Agent-Internal GLM** - Agenci używają GLM transparentnie (nie musisz ręcznie wywoływać)
3. ✅ **Simplified Monitoring** - 1 skrypt zamiast 5
4. ✅ **Same MASTER-PROMPT Flow** - Znany workflow, tylko agenci używają GLM pod maską

### Time Savings:
- **V1 Sequential**: 3 stories × 1.5h = **4.5h**
- **V2 Parallel**: 3 stories in **~2h** (prawie 2x szybciej!)

---

## 📋 7-PHASE FLOW (Parallel)

| Phase | Agent | GLM Usage | Parallel | Skip When |
|-------|-------|-----------|----------|-----------|
| **P1** | ux-designer | No (Claude) | ✓ Multi-story | Backend-only |
| **P2** | test-writer | **✅ GLM-4.7 internally** | ✓ Multi-story | Never |
| **P3** | backend/frontend-dev | **✅ GLM-4.7 internally** | ✓ Multi-story + tracks | - |
| **P4** | senior-dev | GLM-4.5-Air | No | Clean code |
| **P5** | code-reviewer | No (Claude CRITICAL) | ✓ Multi-story | Never |
| **P6** | qa-agent | No (Claude) | ✓ Multi-story | Never |
| **P7** | tech-writer | **✅ GLM-4.5-Air internally** | ✓ Multi-story | Never |

**Key**: Agenci **wewnętrznie** wywołują GLM, Ty tylko delegujesz `Task(test-writer)`.

---

## 🔧 AGENT CONFIGURATION

### Agenci Używający GLM (Pod Maską):

```yaml
test-writer:
  model: "haiku"  # Cheap orchestrator
  internal_glm:
    model: "glm-4.7"
    thinking: true
    use_for: "test generation"
  process:
    1. Claude (haiku) tworzy prompt dla GLM
    2. Wywołuje glm_call_updated.py --model glm-4.7 --thinking
    3. Waliduje output
    4. Zwraca testy do checkpointa

backend-dev / frontend-dev:
  model: "haiku"  # Cheap orchestrator
  internal_glm:
    model: "glm-4.7"
    thinking: true
    use_for: "code generation"
  process:
    1. Claude (haiku) tworzy implementation spec
    2. Wywołuje GLM-4.7 dla każdego pliku
    3. Waliduje składnię TypeScript
    4. Zwraca kod do checkpointa

tech-writer:
  model: "haiku"
  internal_glm:
    model: "glm-4.5-air"
    thinking: false
    use_for: "documentation"
  process:
    1. Claude tworzy doc structure
    2. GLM-4.5-Air generuje content
    3. Claude formatuje
```

**Korzyść**: **Transparentne dla Ciebie** - wywołujesz `Task(test-writer)` normalnie, agent sam użyje GLM.

---

## ⚡ PARALLEL EXECUTION (jak MASTER-PROMPT)

### Przykład: 3 Stories Równolegle

```
Phase P1 (UX Design):
├─ Story 01.2 (Claude UX) ──┐
├─ Story 01.3 (Claude UX) ──┤ Parallel (3 agents)
└─ Story 01.4 (Claude UX) ──┘

Phase P2 (Tests):
├─ Story 01.2 (test-writer → GLM-4.7) ──┐
├─ Story 01.3 (test-writer → GLM-4.7) ──┤ Parallel
└─ Story 01.4 (test-writer → GLM-4.7) ──┘

Phase P3 (Implementation):
├─ Story 01.2 (backend-dev → GLM-4.7) ──┐
├─ Story 01.3 (backend-dev → GLM-4.7) ──┤ Parallel
└─ Story 01.4 (backend-dev → GLM-4.7) ──┘

Phase P5 (Code Review):
├─ Story 01.2 (code-reviewer → Claude) ──┐
├─ Story 01.3 (code-reviewer → Claude) ──┤ Parallel
└─ Story 01.4 (code-reviewer → Claude) ──┘

... itd
```

**Czas**: ~2h zamiast 4.5h ⚡

---

## 📤 SIMPLIFIED DELEGATION

### Jak Wywoływać (Ten Sam Sposób co MASTER-PROMPT):

```
Task(test-writer): Story 01.2 P2
Do: Write comprehensive tests for User Roles CRUD
Read: docs/2-MANAGEMENT/epics/current/01-settings/01.2.user-roles.md
Exit: Tests written, checkpoint updated

Task(backend-dev): Story 01.2 P3
Do: Implement User Roles service + API routes
Read: .claude/checkpoints/01.2.yaml
Exit: Code complete, tests passing

Task(code-reviewer): Story 01.2 P5
Do: Review implementation, check for bugs
Read: .claude/checkpoints/01.2.yaml
Exit: APPROVED or REQUEST_CHANGES
```

**Nie musisz** wywoływać GLM ręcznie - agenci robią to pod maską!

---

## 🔄 AGENT IMPLEMENTATION (Simplified)

### test-writer Agent (przykład):

```python
# Agent internally:
def execute_p2_test_writing(story_id):
    # Step 1: Load story context
    story = load_story(story_id)

    # Step 2: Create GLM prompt (Claude haiku orchestrates)
    glm_prompt = f"""
    Write Vitest tests for {story['name']}.

    Requirements:
    - Service tests: {story['service_functions']}
    - API tests: {story['api_endpoints']}
    - 50+ test cases

    Context:
    {load_file('.claude/PATTERNS.md')}
    """

    # Step 3: Call GLM (internal)
    result = subprocess.run([
        'python', 'glm_call_updated.py',
        '-m', 'glm-4.7',
        '--thinking',
        '-p', glm_prompt,
        '-o', f'P2_tests_{story_id}.test.ts'
    ])

    # Step 4: Validate & checkpoint
    update_checkpoint(story_id, 'P2', tokens=result.tokens)

    return f"P2: ✓ test-writer | tests: {count_tests()} | tokens: {result.tokens}"
```

**Z Twojej perspektywy**: Wywołujesz `Task(test-writer)`, agent robi resztę.

---

## 📊 SIMPLIFIED MONITORING

### Jeden Skrypt Zamiast 5:

```bash
# .experiments/claude-glm-test/scripts/hybrid_monitor.py

# Użycie:
python hybrid_monitor.py --story 01.2 --action all

# --action all robi:
#   1. Record metrics
#   2. Check regressions
#   3. Compare to baseline
#   4. Update dashboard
#   5. Quality gate check
#
# Output: ✅ PASS / ❌ FAIL + dashboard.html
```

**Zamiast**:
```bash
python monitor_quality.py --story 01.2 --scenario b
python detect_regressions.py --story 01.2 --scenario b
python compare_before_after.py ...
python quality_dashboard.py ...
./quality_gate.sh ...
```

**1 komenda** vs 5 komend ✅

---

## 🎯 START PROMPT (V2 - Parallel)

```
Execute Epic 01-Settings using HYBRID approach with PARALLEL execution.

Stories: 01.2 (User Roles), 01.3 (Permissions), 01.4 (Org Profile)

Use PARALLEL workflow (like MASTER-PROMPT):
- Launch P1 for all 3 stories in parallel (3x ux-designer agents)
- Launch P2 for all 3 stories in parallel (3x test-writer agents → internal GLM-4.7)
- Launch P3 for all 3 stories in parallel (3x backend-dev → internal GLM-4.7)
- Launch P5 for all 3 stories in parallel (3x code-reviewer → Claude)
- Iterate P3→P5 until APPROVED
- Launch P6 for all 3 stories in parallel (3x qa-agent → Claude)
- Launch P7 for all 3 stories in parallel (3x tech-writer → GLM-4.5-Air)

Agents use GLM internally (transparent). You orchestrate with Task() delegations.

Track tokens in .claude/checkpoints/{story}.yaml per phase.

After all 3 stories complete:
python .experiments/claude-glm-test/scripts/hybrid_monitor.py --stories 01.2,01.3,01.4 --action report

Cost target: ~$0.60 (3 stories)
Quality target: 10/10 ACs per story
Time target: ~2h (parallel execution)

START. NO QUESTIONS. DELEGATE ALL P1s IN PARALLEL.
```

---

## 🤔 Pytanie do Ciebie

**Która wersja wolisz?**

### **Opcja A: HYBRID-V1 (Sequential, Ręczne GLM)**
- ✅ Pełna kontrola (widzisz każde wywołanie GLM)
- ✅ Łatwe do zrozumienia
- ❌ Musisz ręcznie wywoływać `glm_call_updated.py`
- ❌ Sekwencyjne (1 story na raz)
- ❌ Wolniejsze (~4.5h dla 3 stories)

### **Opcja B: HYBRID-V2 (Parallel, GLM w Agentach)** ⭐ **RECOMMENDED**
- ✅ Parallel execution (2-3 stories na raz)
- ✅ Agenci używają GLM transparentnie
- ✅ Znany workflow (Task() delegations jak MASTER-PROMPT)
- ✅ Szybsze (~2h dla 3 stories)
- ❌ Wymaga modyfikacji agentów (test-writer, backend-dev, tech-writer)

### **Opcja C: Hybrydowa** (Start V1, później V2)
- Pilot 3 stories z V1 (manual, sequential) → **Validate savings**
- Następnie refactor agentów dla V2 → **Scale with parallel**

---

Jeśli chcesz **Opcję B** (parallel + agenci z GLM), mogę:
1. ✅ Stworzyć **consolidated monitoring script** (`hybrid_monitor.py` - 1 zamiast 5)
2. ✅ Zaktualizować **agentów** (test-writer, backend-dev, tech-writer) żeby używali GLM wewnętrznie
3. ✅ Stworzyć **HYBRID-ORCHESTRATOR-V2-FINAL.md** z parallel workflow

**Która opcja?** A / B / C ?