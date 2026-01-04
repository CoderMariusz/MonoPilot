# 🎯 FULL MULTI-AGENT TEST - Run After /clear

**Purpose**: Test Claude vs Claude+GLM hybrid na 2 dodatkowych stories z pełnym 7-phase delivery.

**Stories to test**:
- **Story 03.07** (Planning Module)
- **Story 02.06** (Technical Module)

---

## 🔧 CORRECTED TEST ASSUMPTIONS

### Realistic Iteration Counts:
- **Claude**: 2-3 iterations average (3-4 bugs per story typically)
- **GLM**: 2-3 iterations average (similar bug count)

### Phase Assignments (Corrected):

#### Scenario A: Claude Full Flow
```
P1: UX Design       → Claude
P2: Test Writing    → Claude
P3: Implementation  → Claude
P4: Refactor        → Claude
P5: Code Review     → Claude
P6: QA              → Claude
P7: Documentation   → Claude
```

#### Scenario B: Claude + GLM Hybrid (CORRECTED)
```
P1: UX Design       → Claude (strategic thinking)
P2: Test Writing    → GLM (test generation)
P3: Implementation  → GLM (code generation)
P4: Refactor        → GLM (cleanup)
P5: Code Review     → Claude (quality gate - CRITICAL)
P6: QA              → Claude (acceptance testing)
P7: Documentation   → GLM (doc generation)
```

**Key change**: P2 przez GLM w scenariuszu B (tylko P1, P5, P6 przez Claude).

---

## 📋 STORIES FOR TESTING

### Story 03.07 - Supplier Product Catalog
**Epic**: 03-Planning
**Complexity**: M
**Type**: Backend + Frontend
**Deliverables**:
- Migration: `supplier_products` table
- API: GET/POST/PUT/DELETE `/api/planning/suppliers/:id/products`
- Service: `SupplierProductService`
- Validation: `supplier-product-schemas.ts`
- Component: `SupplierProductsTable`

**Location**: `docs/2-MANAGEMENT/epics/current/03-planning/03.07.supplier-products.md`

---

### Story 02.06 - BOM Versioning
**Epic**: 02-Technical
**Complexity**: L
**Type**: Backend + Frontend
**Deliverables**:
- Migration: `bom_versions` table
- API: BOM version endpoints
- Service: `BOMVersionService`
- Validation: `bom-version-schemas.ts`
- Component: Version history UI

**Location**: `docs/2-MANAGEMENT/epics/current/02-technical/02.06.bom-versioning.md`

---

## 🚀 EXECUTION PLAN

### Phase Distribution Per Story

| Phase | Time | Scenario A | Scenario B | Critical? |
|-------|------|------------|------------|-----------|
| P1 UX | 5-8 min | Claude | Claude | Yes |
| P2 Tests | 8-12 min | Claude | **GLM** ← Changed | Yes |
| P3 Code | 10-15 min | Claude | GLM | Yes |
| P4 Refactor | 3-5 min | Claude | GLM | No (skip if clean) |
| P5 Review | 6-10 min | Claude | Claude | **Critical** |
| P5→P3 Iter 1 | 8-10 min | Claude | GLM | Yes (likely) |
| P5→P3 Iter 2 | 5-8 min | Claude | GLM | Maybe |
| P6 QA | 5-8 min | Claude | Claude | Yes |
| P7 Docs | 6-10 min | Claude | GLM | Yes |

**Total per story**: 45-60 min (with iterations)
**Total for 2 stories**: 90-120 min

---

## 📊 EXPECTED REALISTIC RESULTS

### Scenario A: Claude Full Flow (With Realistic Iterations)

```
Story 03.07:
  P1: 1,200 tokens
  P2: 3,500 tokens (write tests)
  P3 (iter 1): 4,200 tokens (initial code)
  P5 (iter 1): 2,800 tokens (review - finds 3 bugs)
  P3 (iter 2): 3,500 tokens (fix bugs)
  P5 (iter 2): 2,400 tokens (re-review - finds 1 bug)
  P3 (iter 3): 2,200 tokens (final fix)
  P5 (iter 3): 1,800 tokens (approved)
  P6: 1,600 tokens
  P7: 2,200 tokens
  ────────────────
  Total: ~25,400 Claude tokens
  Cost: ~$0.457

Story 02.06:
  Similar pattern: ~27,800 tokens
  Cost: ~$0.500

Total: 53,200 Claude tokens
Cost: $0.957
```

### Scenario B: Claude + GLM Hybrid (With Realistic Iterations)

```
Story 03.07:
  P1 (Claude): 1,200 tokens
  P2 (GLM): 3,200 tokens + 800 Claude orchestration
  P3 (GLM iter 1): 4,800 tokens + 1,200 Claude orchestration
  P5 (Claude iter 1): 2,800 tokens (finds 3 bugs)
  P3 (GLM iter 2): 3,600 tokens + 1,000 Claude orchestration
  P5 (Claude iter 2): 2,400 tokens (finds 1 bug)
  P3 (GLM iter 3): 2,400 tokens + 800 Claude orchestration
  P5 (Claude iter 3): 1,800 tokens (approved)
  P6 (Claude): 1,600 tokens
  P7 (GLM): 2,600 tokens + 700 Claude orchestration
  ────────────────
  Claude: 14,300 tokens
  GLM: 16,600 tokens
  Total: 30,900 tokens
  Cost: ~$0.270 (Claude) + $0.012 (GLM) = $0.282

Story 02.06:
  Similar: 32,400 total tokens
  Cost: ~$0.295

Total Claude: 28,600 tokens
Total GLM: 34,800 tokens
Total: 63,400 tokens
Cost: $0.577
```

**Expected Winner**: **Scenario B** (40% cheaper!)

---

## 🎯 TEST INSTRUCTIONS

### Step 1: Read Story Context Files

```bash
cd docs/2-MANAGEMENT/epics/current/03-planning
cat 03.07.supplier-products.md

cd docs/2-MANAGEMENT/epics/current/02-technical
cat 02.06.bom-versioning.md
```

### Step 2: Run Test for Story 03.07

#### Scenario A: Claude Full Flow
```
DO NOT SKIP ANY PHASE. Execute all 7 phases with realistic iterations.

Phase sequence:
1. P1: Design UX (supplier products table + form)
2. P2: Write RED tests (CRUD operations)
3. P3 (iter 1): Implement service + API
4. P5 (iter 1): Code review (EXPECT 3-4 bugs!)
5. P3 (iter 2): Fix bugs
6. P5 (iter 2): Re-review (EXPECT 1-2 bugs!)
7. P3 (iter 3): Final fixes (if needed)
8. P5 (iter 3): Final approval
9. P6: QA acceptance testing
10. P7: Write API documentation

Save deliverables to:
.experiments/claude-glm-test/story_03.07/scenario_a/

Update checkpoint after EACH phase:
.experiments/claude-glm-test/story_03.07/scenario_a/checkpoint.yaml
```

#### Scenario B: Claude + GLM Hybrid
```
Phase sequence:
1. P1: Claude designs UX
2. P2: GLM writes tests (with Claude prompt design)
3. P3 (iter 1): GLM implements (with Claude prompt)
4. P5 (iter 1): Claude reviews (EXPECT 3-4 bugs!)
5. P3 (iter 2): GLM fixes (with Claude instructions)
6. P5 (iter 2): Claude re-reviews (EXPECT 1-2 bugs!)
7. P3 (iter 3): GLM final fixes
8. P5 (iter 3): Claude approves
9. P6: Claude QA
10. P7: GLM writes docs (with Claude prompt)

Save deliverables to:
.experiments/claude-glm-test/story_03.07/scenario_b/

Use GLM API for P2, P3, P7:
python .experiments/claude-glm-test/scripts/glm_call.py --prompt "..." --model glm-4-plus

Update checkpoint after EACH phase.
```

### Step 3: Repeat for Story 02.06

Same process for Story 02.06 (BOM Versioning).

### Step 4: Calculate Final Metrics

```bash
cd .experiments/claude-glm-test

# Count all tokens
python scripts/count_tokens.py story_03.07/scenario_a/deliverables/*
python scripts/count_tokens.py story_03.07/scenario_b/deliverables/*
python scripts/count_tokens.py story_02.06/scenario_a/deliverables/*
python scripts/count_tokens.py story_02.06/scenario_b/deliverables/*

# Compare results
python scripts/compare_multi_story.py
```

---

## 📊 METRICS TO TRACK

For each story and scenario:

```yaml
metrics:
  story_id: "03.07"
  scenario: "a" # or "b"

  tokens:
    claude_total: 0
    glm_total: 0
    phases:
      P1: {input: 0, output: 0}
      P2: {input: 0, output: 0}
      P3_iter1: {input: 0, output: 0}
      P5_iter1: {input: 0, output: 0}
      P3_iter2: {input: 0, output: 0}
      P5_iter2: {input: 0, output: 0}
      # ...

  iterations:
    p3_to_p5_cycles: 0  # How many times P5→P3 loop

  bugs_found:
    iter1: 0  # Bugs found in first review
    iter2: 0  # Bugs found in second review
    total: 0

  quality:
    final_code_score: "0/10"
    tests_passing: "0/0"
    production_ready: false

  cost_usd:
    claude: 0.0
    glm: 0.0
    total: 0.0

  time_minutes: 0
```

---

## 🎯 SUCCESS CRITERIA

### Test is successful if:
1. ✅ Both stories complete all 7 phases
2. ✅ Realistic iteration counts (2-3 cycles per story)
3. ✅ All bugs found and fixed
4. ✅ Production-ready code in both scenarios
5. ✅ Complete checkpoint tracking
6. ✅ Accurate token/cost measurements

### Expected Outcome:
With **realistic iterations**, Scenario B (Claude + GLM) should WIN because:
- GLM does P2, P3, P7 (most token-heavy phases)
- Claude only does P1, P5, P6 (strategic phases)
- Both scenarios have ~same iteration count
- GLM's lower price compensates for similar work

---

## 📝 DELIVERABLES FORMAT

### For Each Story × Each Scenario:

```
story_{id}/
├── scenario_a/
│   ├── checkpoint.yaml              # All phases tracked
│   ├── deliverables/
│   │   ├── P1_ux_design.md
│   │   ├── P2_tests.test.ts
│   │   ├── P3_iter1_service.ts      # Initial (with bugs)
│   │   ├── P3_iter2_service.ts      # After fixes
│   │   ├── P3_iter3_service.ts      # Final (if needed)
│   │   ├── P5_iter1_review.md       # Review findings
│   │   ├── P5_iter2_review.md
│   │   ├── P6_qa_report.md
│   │   └── P7_documentation.md
│   └── metrics.json                 # Token/cost summary
│
└── scenario_b/
    ├── checkpoint.yaml
    ├── deliverables/
    │   ├── P1_ux_design.md
    │   ├── P2_glm_prompt.md
    │   ├── P2_tests.test.ts         # GLM generated
    │   ├── P3_iter1_glm_prompt.md
    │   ├── P3_iter1_service.ts      # GLM initial
    │   ├── P3_iter2_glm_prompt.md   # Fix instructions
    │   ├── P3_iter2_service.ts      # GLM fixed
    │   ├── P5_iter1_review.md       # Claude review
    │   ├── P5_iter2_review.md
    │   ├── P6_qa_report.md
    │   ├── P7_glm_prompt.md
    │   └── P7_documentation.md      # GLM docs
    └── metrics.json
```

---

## 💡 WHY P2 SHOULD BE GLM IN SCENARIO B

### Current (Incorrect):
```
P2 Tests: Claude → 3,350 tokens → $0.056

But Scenario B should use GLM for P2!
```

### Corrected Scenario B:
```
P2 Tests:
  - Claude orchestration: 800 tokens (prompt design)
  - GLM generation: 3,000 tokens (write tests)
  - Claude review: 400 tokens (quick check)

Total: 1,200 Claude + 3,000 GLM
Cost: $0.022 (Claude) + $0.002 (GLM) = $0.024

Savings vs Claude P2: $0.032 (57% cheaper!)
```

---

## 🎯 EXPECTED CORRECTED RESULTS

### With Realistic Iterations + GLM for P2/P3/P7:

#### Scenario A (Claude - 2-3 iterations):
```
Per story average:
  Total tokens: ~26,000
  Cost: ~$0.47

2 stories:
  Total: 52,000 tokens
  Cost: $0.94
```

#### Scenario B (Hybrid - 2-3 iterations):
```
Per story average:
  Claude tokens: ~12,000 (P1, P5×3, P6)
  GLM tokens: ~18,000 (P2, P3×3, P7)
  Total: ~30,000 tokens
  Cost: ~$0.23 (Claude) + $0.013 (GLM) = $0.243

2 stories:
  Claude: 24,000 tokens
  GLM: 36,000 tokens
  Total: 60,000 tokens
  Cost: $0.486
```

**Expected Winner**: **Scenario B saves ~$0.45 (48% cheaper!)** ✅

---

## 📋 EXECUTION STEPS (After /clear)

### 1. Prepare Test Environment
```bash
cd .experiments/claude-glm-test
mkdir -p story_03.07/{scenario_a,scenario_b}/{deliverables,checkpoints}
mkdir -p story_02.06/{scenario_a,scenario_b}/{deliverables,checkpoints}
```

### 2. Run Story 03.07

#### Scenario A:
```
Execute full 7-phase flow with Claude.
IMPORTANT: Be realistic about iterations - expect 2-3 bugs per review!

Track metrics in: story_03.07/scenario_a/metrics.json
```

#### Scenario B:
```
Execute 7-phase flow with GLM for P2, P3, P7.
Use glm_call.py for each GLM phase.

Track metrics in: story_03.07/scenario_b/metrics.json
```

### 3. Run Story 02.06
Same process as 03.07.

### 4. Generate Final Comparison
```bash
python scripts/compare_multi_story.py \
  --stories story_03.07 story_02.06 \
  --output FINAL_MULTI_STORY_REPORT.md
```

---

## 📊 COMPARISON SCRIPT (Create This)

```python
# scripts/compare_multi_story.py
import json
import sys
from pathlib import Path

def load_metrics(story_id, scenario):
    path = Path(f"story_{story_id}/{scenario}/metrics.json")
    with open(path) as f:
        return json.load(f)

stories = ["03.07", "02.06"]
scenarios = ["scenario_a", "scenario_b"]

results = {}
for story in stories:
    results[story] = {}
    for scenario in scenarios:
        results[story][scenario] = load_metrics(story, scenario)

# Calculate totals
total_a = sum(results[s]["scenario_a"]["cost_usd"] for s in stories)
total_b = sum(results[s]["scenario_b"]["cost_usd"] for s in stories)

print(f"""
MULTI-STORY TEST RESULTS
========================

Story 03.07:
  Scenario A: ${results["03.07"]["scenario_a"]["cost_usd"]:.3f}
  Scenario B: ${results["03.07"]["scenario_b"]["cost_usd"]:.3f}

Story 02.06:
  Scenario A: ${results["02.06"]["scenario_a"]["cost_usd"]:.3f}
  Scenario B: ${results["02.06"]["scenario_b"]["cost_usd"]:.3f}

TOTAL:
  Scenario A (Claude Only): ${total_a:.3f}
  Scenario B (Hybrid):      ${total_b:.3f}

  Difference: ${total_b - total_a:+.3f} ({100*(total_b-total_a)/total_a:+.1f}%)
  Winner: {"Scenario B (Hybrid)" if total_b < total_a else "Scenario A (Claude Only)"}
""")
```

---

## 🎯 HYPOTHESIS TO TEST

### Original Hypothesis (Incorrect):
"Claude + GLM będzie drożej bo orchestration overhead"

### Corrected Hypothesis:
"Claude + GLM będzie TANIEJ bo":
1. GLM robi P2, P3, P7 (70% pracy)
2. Oba scenariusze mają ~same iteration counts
3. GLM 5x tańszy per token
4. Claude tylko strategic phases (P1, P5, P6)

---

## ⚠️ CRITICAL CORRECTIONS FROM PREVIOUS TEST

### What Was Wrong:
1. ❌ Claude shown as "perfect first try" (unrealistic)
2. ❌ P2 (tests) assigned to Claude in both scenarios
3. ❌ GLM penalized for iterations, Claude not

### What's Corrected:
1. ✅ Both scenarios have 2-3 iterations (realistic)
2. ✅ P2 through GLM in Scenario B (correct division)
3. ✅ Fair comparison of iteration costs

---

## 🚀 AUTO-EXECUTION PROMPT

Copy-paste this after `/clear`:

```
Run full multi-agent test on stories 03.07 and 02.06.

Read instructions from:
.experiments/claude-glm-test/RUN_FULL_TEST_AFTER_CLEAR.md

Execute both scenarios (A and B) for both stories with:
- Full 7-phase workflow
- Realistic iterations (2-3 bugs per review for BOTH Claude and GLM)
- P2/P3/P7 through GLM in Scenario B
- Complete checkpoint tracking
- All deliverables (full code, not snippets)

Generate final comparison report with cost/quality analysis.

BE REALISTIC: Claude also makes mistakes! Expect 3-4 bugs in first implementation for BOTH scenarios.
```

---

## 📝 EXPECTED FINAL OUTPUT

After test completion, you should have:

```
.experiments/claude-glm-test/
├── story_03.07/
│   ├── scenario_a/ (Claude full flow)
│   └── scenario_b/ (Claude + GLM hybrid)
├── story_02.06/
│   ├── scenario_a/ (Claude full flow)
│   └── scenario_b/ (Claude + GLM hybrid)
└── FINAL_MULTI_STORY_REPORT.md

Total artifacts: ~80-100 files
Total test duration: 90-120 minutes
Expected result: Scenario B wins by 40-50% cost savings
```

---

## 🎓 KEY DIFFERENCES FROM FIRST TEST

| Aspect | First Test (05.14) | Corrected Test (03.07 + 02.06) |
|--------|-------------------|--------------------------------|
| Claude iterations | 1 (unrealistic) | 2-3 (realistic) |
| GLM iterations | 2 | 2-3 (same as Claude) |
| P2 in Scenario B | Claude ❌ | GLM ✅ |
| Bug count | Claude=0, GLM=3 | Both=3-4 |
| Expected winner | Claude Only | **Hybrid** |

---

## ✅ VALIDATION CHECKLIST

Before running test, ensure:
- [ ] GLM API key configured in config.json
- [ ] Python dependencies installed (requests, tiktoken)
- [ ] Test scripts working (glm_call.py, count_tokens.py)
- [ ] Story context files readable
- [ ] Checkpoint directories created

---

**READY TO RUN AFTER /clear** 🚀

**Estimated execution**: 90-120 minutes for both stories
**Expected outcome**: Claude + GLM hybrid wins by ~40-50% cost savings
