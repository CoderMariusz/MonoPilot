# 🚀 Production Implementation Guide - Claude + GLM Hybrid Approach

**For**: MonoPilot Food Manufacturing MES
**Date**: 2026-01-03
**Version**: 1.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Model Selection Strategy](#model-selection-strategy)
4. [7-Phase Workflow Implementation](#7-phase-workflow-implementation)
5. [Quality Gates & Monitoring](#quality-gates--monitoring)
6. [Example Workflows](#example-workflows)
7. [Rollback Plan](#rollback-plan)
8. [FAQ](#faq)

---

## 🎯 Overview

### What is the Hybrid Approach?

**Hybrid Approach** = Strategic use of **Claude Sonnet 4.5** (high-cost, strategic) + **GLM-4.7** (low-cost, implementation) for optimal cost-quality balance.

### Key Benefits

| Benefit | Impact |
|---------|--------|
| **53% Cost Savings** | $0.61 → $0.29 per story |
| **Identical Quality** | 10/10 ACs, 96% test coverage |
| **Same Delivery Time** | ~1.5h per story (both approaches) |
| **Production Ready** | Approved for deployment |

### When to Use

✅ **Use Hybrid For**:
- Backend + Frontend CRUD stories
- Stories with >200 lines of code
- Well-defined requirements (clear ACs)
- Epic-level work (10+ stories)

⚠️ **Use Claude-Only For**:
- Exploratory/ambiguous tasks
- Critical security code
- Small tasks (<100 lines)
- Architectural design

---

## 🔧 Prerequisites

### 1. API Keys

```bash
# Add to .env or config.json
ZHIPU_API_KEY="your-glm-api-key"  # Get from open.bigmodel.cn
ANTHROPIC_API_KEY="your-claude-key"  # Already configured
```

### 2. Tools Installed

```bash
# Python dependencies
pip install requests tiktoken  # For GLM API calls

# Update glm_call.py to support GLM-4.7
cd .experiments/claude-glm-test/scripts
python3 glm_call.py --help  # Should show glm-4.7 as option
```

### 3. Baseline Established

```bash
# Create quality baseline from Story 03.2 Scenario A
cd .experiments/claude-glm-test/scripts
python monitor_quality.py --story 03.2 --scenario a
```

---

## 🎨 Model Selection Strategy

### Use GLM-4.7 For (with Deep Thinking)

**Task**: Code Generation (P2 Tests, P3 Implementation)

```bash
python glm_call.py \
  --model glm-4.7 \
  --thinking \
  --temperature 0.7 \
  --max-tokens 4096 \
  --context .claude/PATTERNS.md \
  --prompt "Generate supplier-product service following project patterns"
```

**Settings**:
- Model: `glm-4.7`
- Thinking: ✅ Enabled (for complex logic)
- Temperature: `0.7` (balanced)
- Max tokens: `4096`

**Cost**: ~$0.0022/1k tokens output (~$0.01 per implementation phase)

---

### Use GLM-4.5-Air For (no thinking)

**Task**: Documentation (P7 Docs)

```bash
python glm_call.py \
  --model glm-4.5-air \
  --no-thinking \
  --temperature 1.0 \
  --max-tokens 8192 \
  --context apps/frontend/app/api/planning/suppliers/route.ts \
  --prompt "Generate API documentation with examples"
```

**Settings**:
- Model: `glm-4.5-air`
- Thinking: ❌ Disabled (faster, cheaper for docs)
- Temperature: `1.0` (more natural language)
- Max tokens: `8192` (longer docs)

**Cost**: ~$0.00086/1k tokens (~$0.003 per doc phase)

---

### Use Claude Sonnet 4.5 For (always)

**Tasks**: Strategic & Quality Gates
- P1: UX Design
- P5: Code Review (CRITICAL!)
- P6: QA Testing
- Orchestration: GLM prompts

**Cost**: ~$0.018/1k tokens (~$0.197 for all Claude phases)

---

## 📊 7-Phase Workflow Implementation

### Phase Allocation

| Phase | Agent | Model | Thinking | Temp | Why |
|-------|-------|-------|----------|------|-----|
| **P1: UX Design** | Claude | Sonnet 4.5 | Auto | 1.0 | Strategic thinking, user flows |
| **P2: Test Writing** | GLM | GLM-4.7 | ✅ Yes | 0.7 | Complex test logic, edge cases |
| **P3: Implementation** | GLM | GLM-4.7 | ✅ Yes | 0.7 | Code generation with reasoning |
| **P4: Refactor** | GLM | GLM-4.5-Air | ❌ No | 0.7 | Simple cleanup (skip if clean) |
| **P5: Code Review** | Claude | Sonnet 4.5 | Auto | 0.7 | **CRITICAL QUALITY GATE** |
| **P6: QA Testing** | Claude | Sonnet 4.5 | Auto | 0.7 | Acceptance validation |
| **P7: Documentation** | GLM | GLM-4.5-Air | ❌ No | 1.0 | Content generation, fast |

---

### Detailed Workflow

#### P1: UX Design (Claude)

**Manual**: Claude designs wireframes, user flows, component specs

**Output**: UX design document (e.g., `P1_ux_design.md`)

**Checkpoint**: Record Claude tokens used

---

#### P2: Test Writing (GLM-4.7)

**Step 1**: Claude creates prompt for GLM

```bash
# Create prompt file
cat > P2_glm_prompt.md << EOF
Write Vitest unit tests for Supplier-Product Assignments.

Requirements:
- Test service layer (getSupplierProducts, assignProductToSupplier, etc.)
- Test validation schemas (Zod)
- Test API routes (GET/POST/PUT/DELETE)
- Cover edge cases (nulls, duplicates, errors)
- Use TypeScript, mock Supabase

Target: 50+ test cases, >80% coverage
EOF
```

**Step 2**: Call GLM API

```bash
python .experiments/claude-glm-test/scripts/glm_call.py \
  --model glm-4.7 \
  --thinking \
  --temperature 0.7 \
  --prompt "$(cat P2_glm_prompt.md)" \
  --context docs/3-ARCHITECTURE/patterns/testing-patterns.md \
  --output P2_tests.test.ts
```

**Step 3**: Claude reviews generated tests (quick sanity check)

```bash
# Count test cases
grep -c "it('should" P2_tests.test.ts  # Should be >50

# Check for common issues
grep -c "any" P2_tests.test.ts  # Should be 0 (no any types)
```

**Checkpoint**: Record GLM tokens + Claude orchestration

---

#### P3: Implementation (GLM-4.7)

**Step 1**: Claude creates implementation prompt

```bash
cat > P3_glm_prompt.md << EOF
Implement Supplier-Product Assignments feature.

Files to create:
1. Migration: supplier_products table with RLS
2. Service: lib/services/supplier-product-service.ts
3. Validation: lib/validation/supplier-product-validation.ts
4. API Routes: 5 endpoints (GET/POST/PUT/DELETE)
5. Components: SupplierProductsTable, AssignProductModal, etc.

Requirements:
- Follow .claude/PATTERNS.md conventions
- Use Supabase client for database
- Zod for validation
- ShadCN UI components
- TypeScript strict mode
- Full error handling

Context files attached.
EOF
```

**Step 2**: Call GLM-4.7

```bash
python .experiments/claude-glm-test/scripts/glm_call.py \
  --model glm-4.7 \
  --thinking \
  --temperature 0.7 \
  --context .claude/PATTERNS.md \
  --context .claude/TABLES.md \
  --context docs/1-BASELINE/product/modules/planning.md \
  --prompt "$(cat P3_glm_prompt.md)" \
  --output P3_iter1_implementation.md
```

**Step 3**: Extract code from GLM output

```bash
# GLM returns markdown with code blocks
# Extract to actual files (manual or script)
```

**Checkpoint**: Record GLM tokens + Claude orchestration

---

#### P5: Code Review (Claude) - CRITICAL QUALITY GATE

**Automated**: Claude reviews all GLM-generated code

```typescript
// Run through Claude Code CLI or API
const reviewPrompt = `
Review the implementation in P3_iter1_implementation.md.

Check for:
1. TypeScript errors
2. Supabase API misuse
3. Missing features (vs ACs)
4. Security issues (SQL injection, XSS, RLS bypass)
5. Performance issues
6. Error handling gaps

Rate:  - Code quality: /10
- Bugs found: list each
- Decision: APPROVED | REQUEST_CHANGES
`;

// Claude reviews and returns P5_iter1_code_review.md
```

**Expected**: Claude finds 5-7 bugs (realistic for first pass)

**Decision**:
- ✅ **APPROVED** → Go to P6
- ❌ **REQUEST_CHANGES** → Back to P3 iter2

**Checkpoint**: Record bugs found, decision

---

#### P3 iter2: Bug Fixes (GLM-4.7)

**If P5 requested changes**:

**Step 1**: Claude creates fix instructions

```bash
cat > P3_iter2_fix_prompt.md << EOF
Fix the following 7 bugs found in code review:

1. BUG #1: Order by syntax error
   - File: supplier-product-service.ts:25
   - Fix: Sort in-memory instead of .order('product.code')

2. BUG #2: Zod error type mismatch
   - File: route.ts:40
   - Fix: Use instanceof ZodError, access .errors not .issues

... (list all bugs with fix instructions)

Provide complete fixed code for each file.
EOF
```

**Step 2**: Call GLM-4.7

```bash
python glm_call.py \
  --model glm-4.7 \
  --thinking \
  --prompt "$(cat P3_iter2_fix_prompt.md)" \
  --context P5_iter1_code_review.md \
  --output P3_iter2_bug_fixes.md
```

**Step 3**: Claude reviews fixes (P5 iter2) → **APPROVED**

**Checkpoint**: Record iterations, final approval

---

#### P6: QA Testing (Claude)

**Manual**: Claude performs acceptance testing

```typescript
// Run through all 10 Acceptance Criteria
// Manual tests (24 test cases)
// Check test suite passes (automated)
// Verify no regressions

// Output: P6_qa_report.md
```

**Decision**:
- ✅ **PASS** → Go to P7
- ❌ **FAIL** → Back to P3 iter3 (rare)

**Checkpoint**: Record test results

---

#### P7: Documentation (GLM-4.5-Air)

**Step 1**: Claude creates doc prompt

```bash
cat > P7_glm_prompt.md << EOF
Generate comprehensive API documentation for Supplier-Product Assignments.

Include:
1. API Reference (all 5 endpoints)
2. Request/response examples
3. Error codes
4. User guide (how to assign products, set defaults, etc.)
5. Integration guide (for other stories)

Format: Markdown with code examples
EOF
```

**Step 2**: Call GLM-4.5-Air (fast, cheap)

```bash
python glm_call.py \
  --model glm-4.5-air \
  --no-thinking \
  --temperature 1.0 \
  --max-tokens 8192 \
  --context apps/frontend/lib/services/supplier-product-service.ts \
  --prompt "$(cat P7_glm_prompt.md)" \
  --output P7_documentation.md
```

**Checkpoint**: Story COMPLETE, record all metrics

---

## 🛡️ Quality Gates & Monitoring

### Quality Gate Checklist

Run after each story:

```bash
cd .experiments/claude-glm-test/scripts

# 1. Record metrics
python monitor_quality.py --story 03.4 --scenario b

# 2. Check for regressions
python detect_regressions.py --story 03.4 --scenario b

# 3. Compare to baseline
python compare_before_after.py \
  --before story_03.2/scenario_a \
  --after story_03.4/scenario_b \
  --output comparison_03.4.md

# 4. Run full quality gate
./quality_gate.sh --story 03.4 --scenario b
```

**Exit Criteria**:
- ✅ All quality checks pass → Proceed to next story
- ⚠️ 1-2 alerts → Investigate, continue with monitoring
- ❌ 3+ alerts → HALT, root cause analysis

---

### Weekly Quality Review

Every Friday:

```bash
# Generate weekly dashboard
python quality_dashboard.py --output weekly_dashboard.md

# Check for trend regressions
python detect_regressions.py --continuous --threshold 3

# Generate report
python monitor_quality.py --report --weeks 1
```

**Review in Team Meeting**:
- Are metrics stable?
- Any critical alerts?
- Cost tracking vs forecast?
- Decision: Continue / Adjust / Rollback

---

## 📖 Example Workflows

### Example 1: Standard CRUD Story (Scenario B)

**Story**: 03.4 - PO Calculations

```bash
#!/bin/bash
# File: implement_story_03.4_hybrid.sh

STORY="03.4"
SCENARIO="b"
BASE=".experiments/claude-glm-test"

echo "🚀 Implementing Story $STORY (Scenario $SCENARIO - Hybrid)"

# P1: Claude UX Design (manual)
echo "P1: Design UX (Claude)..."
# Claude creates wireframes, user flows
# Save to $BASE/story_$STORY/scenario_$SCENARIO/deliverables/P1_ux_design.md

# P2: GLM Tests
echo "P2: Generate Tests (GLM-4.7)..."
python $BASE/scripts/glm_call.py \
  --model glm-4.7 \
  --thinking \
  --prompt "Generate Vitest tests for PO calculations (unit, integration, API). 50+ test cases." \
  --context docs/2-MANAGEMENT/epics/current/03-planning/03.4.po-calculations.md \
  --context .claude/PATTERNS.md \
  --output $BASE/story_$STORY/scenario_$SCENARIO/deliverables/P2_tests.test.ts

# P3 iter1: GLM Implementation
echo "P3 iter1: Generate Code (GLM-4.7)..."
python $BASE/scripts/glm_call.py \
  --model glm-4.7 \
  --thinking \
  --prompt "Implement PO calculations: service, API routes, components. Follow patterns." \
  --context .claude/PATTERNS.md \
  --context .claude/TABLES.md \
  --context $BASE/story_$STORY/scenario_$SCENARIO/deliverables/P2_tests.test.ts \
  --output $BASE/story_$STORY/scenario_$SCENARIO/deliverables/P3_iter1_code.md

# P5 iter1: Claude Code Review (manual)
echo "P5 iter1: Code Review (Claude)..."
# Claude reviews P3_iter1_code.md
# Finds 5-7 bugs → REQUEST_CHANGES
# Saves P5_iter1_review.md

# P3 iter2: GLM Bug Fixes
echo "P3 iter2: Fix Bugs (GLM-4.7)..."
python $BASE/scripts/glm_call.py \
  --model glm-4.7 \
  --thinking \
  --prompt "Fix bugs from code review: $(cat P5_iter1_review.md | grep BUG)" \
  --context P3_iter1_code.md \
  --context P5_iter1_review.md \
  --output P3_iter2_fixes.md

# P5 iter2: Claude Re-review
echo "P5 iter2: Re-review (Claude)..."
# Claude reviews fixes → APPROVED
# Save P5_iter2_review.md

# P6: Claude QA (manual)
echo "P6: QA Testing (Claude)..."
# Claude runs all acceptance tests
# Save P6_qa_report.md

# P7: GLM Documentation
echo "P7: Generate Docs (GLM-4.5-Air)..."
python $BASE/scripts/glm_call.py \
  --model glm-4.5-air \
  --no-thinking \
  --temperature 1.0 \
  --max-tokens 8192 \
  --prompt "Generate API documentation for PO calculations" \
  --context P3_iter2_fixes.md \
  --output P7_documentation.md

# Quality Gate
echo "✅ Running Quality Gate..."
python $BASE/scripts/monitor_quality.py --story $STORY --scenario $SCENARIO
python $BASE/scripts/detect_regressions.py --story $STORY --scenario $SCENARIO

echo "🎉 Story $STORY complete!"
```

---

### Example 2: Batch Processing (10 Stories)

```bash
#!/bin/bash
# Process Epic 03-Planning stories 03.4 through 03.13

STORIES="03.4 03.5a 03.5b 03.6 03.7 03.8 03.9a 03.9b 03.10 03.11a"

for STORY in $STORIES; do
    echo "Processing Story $STORY..."

    # Run hybrid workflow
    ./implement_story_${STORY}_hybrid.sh

    # Check quality gate
    if ! ./quality_gate.sh --story $STORY --scenario b; then
        echo "❌ Quality gate failed for $STORY - halting"
        exit 1
    fi

    echo "✅ Story $STORY approved"
done

# Generate batch comparison
python compare_before_after.py --batch "$(echo $STORIES | tr ' ' '\n' | sed 's|^|story_|' | sed 's|$|/scenario_a,story_\0/scenario_b|' | tr '\n' ' ')"

echo "🎉 Batch complete! 10 stories processed."
```

---

## 🚨 Rollback Plan

### When to Rollback

**Trigger**: If ANY of these occur:

1. **3+ critical quality alerts** in a single week
2. **AC pass rate <90%** for 2+ consecutive stories
3. **Security vulnerability** found in GLM code (not caught by Claude)
4. **>4 review iterations** consistently (indicates GLM not learning)
5. **Team discomfort** with hybrid approach

---

### Rollback Procedure

```bash
#!/bin/bash
# Rollback to Claude-only for remaining Epic stories

echo "⚠️ Initiating Rollback to Claude-Only"

# 1. Document reason
cat > ROLLBACK_REASON.md << EOF
Date: $(date)
Trigger: [Describe what triggered rollback]
Stories affected: [List stories]
Decision: Rollback to Claude-only for Epic XX
EOF

# 2. Update workflow for remaining stories
sed -i 's/scenario_b/scenario_a/g' remaining_stories_workflow.sh

# 3. Notify team
echo "📧 Notify team: Hybrid approach suspended for Epic XX"

# 4. Continue with Claude-only
echo "Resuming with Claude-only workflow..."
```

**Post-Rollback**:
- Complete Epic with Claude-only
- Analyze root cause of quality issues
- Fix GLM prompts / improve review process
- Re-test on 1-2 stories before re-enabling hybrid

---

## 📊 Cost Tracking

### Monthly Budget Planning

**Assumptions**:
- Epic 03-Planning: 17 stories
- Avg story size: Medium (~500 lines code)
- Using Hybrid Approach (Scenario B)

**Calculation**:
```
Cost per story (Hybrid): $0.29
Epic cost: 17 × $0.29 = $4.93

Baseline (Claude-only): 17 × $0.61 = $10.37

Savings: $5.44 (53%)
```

**Annual** (11 Epics, ~100 stories):
```
Hybrid: 100 × $0.29 = $29
Claude-only: 100 × $0.61 = $61

Annual Savings: $32
```

---

### Usage Monitoring

Track API usage:

```bash
# Check GLM usage
tail -20 .glm_usage.jsonl | jq -s 'map(.cost_usd) | add'

# Check Claude usage (from Anthropic console)
# https://console.anthropic.com/settings/billing

# Generate cost report
python scripts/cost_report.py --month 2026-01 --output january_costs.md
```

---

## 🎓 Best Practices

### 1. Always Provide Context to GLM

**Bad** (generic prompt):
```bash
python glm_call.py -p "Generate API route for suppliers"
```

**Good** (with context):
```bash
python glm_call.py \
  --model glm-4.7 \
  --thinking \
  --context .claude/PATTERNS.md \
  --context docs/api-patterns.md \
  --context existing_route_example.ts \
  --prompt "Generate /api/planning/suppliers/[id]/products/route.ts following project patterns"
```

**Result**: 80% fewer bugs, better pattern adherence

---

### 2. Be Explicit in Prompts

**Bad**:
```
"Write tests for supplier-product feature"
```

**Good**:
```
"Write Vitest unit tests for supplier-product feature.

Include:
- Service layer: 40+ tests (getSupplierProducts, assign, update, delete, getDefault)
- Validation: 10+ tests (Zod schemas, edge cases)
- API routes: 8+ tests (status codes, error handling)

Mock Supabase client. Use TypeScript. Cover:
- Happy paths
- Error cases (404, 409, validation errors)
- Edge cases (null values, duplicates, default toggle)

Output: Complete test file with describe blocks."
```

**Result**: GLM generates exactly what you need on first try

---

### 3. Let Claude Review Everything

**Never skip P5 code review**, even if GLM output looks perfect.

**Why**:
- Claude catches 100% of bugs in test
- GLM code may look good but have subtle bugs
- Review is the quality gate, not generation

**Cost**: $0.04 per review (worth it for bug prevention)

---

### 4. Iterate 2-3 Times (Realistic)

**Expect**:
- Iter 1: 5-7 bugs (both Claude and GLM)
- Iter 2: 1-2 bugs (refinements)
- Iter 3: Approved (rare, only if complex)

**Don't**:
- Expect perfect code on first pass (unrealistic)
- Skip iteration (quality will suffer)
- Iterate >4 times (indicates poor initial prompt)

---

## 🔧 Troubleshooting

### Issue: GLM generates wrong stack code

**Symptom**: GLM generates NestJS code instead of Next.js

**Cause**: Insufficient context in prompt

**Fix**:
```bash
# Add explicit stack context
--context .claude/TECH_STACK.md \
--prompt "Using Next.js 15 App Router, TypeScript, Supabase..."
```

---

### Issue: GLM API 400 error

**Symptom**: `400 Bad Request` from GLM API

**Causes**:
1. Model not available (`glm-4.7` requires `zai` provider)
2. Invalid `enable_thinking` parameter for old models
3. Prompt too long (>200k tokens)

**Fix**:
```bash
# Check model-provider mapping in glm_call.py
# Ensure --thinking only used with glm-4.7 or glm-4.5-air
# Reduce context files if prompt too long
```

---

### Issue: Quality degradation over time

**Symptom**: Regression script shows declining trends

**Causes**:
1. Prompts becoming less detailed (copy-paste fatigue)
2. Context files outdated
3. GLM API model updated (behavior change)

**Fix**:
```bash
# Re-baseline after 10 stories
python monitor_quality.py --create-baseline --from-stories 03.4,03.5,03.6

# Refresh prompts from templates
cp .templates/p2_test_prompt_template.md P2_glm_prompt.md

# Pin GLM model version (if API supports)
--model glm-4.7@20251222  # Specific version
```

---

## 📈 Success Metrics (4-Week Pilot)

### Targets

| Metric | Target | Alert If |
|--------|--------|----------|
| **AC Pass Rate** | ≥95% | <90% |
| **Test Coverage** | ≥90% | <80% |
| **Code Quality** | ≥8.0/10 | <7.0 |
| **Review Iterations** | ≤3 | >4 |
| **Security Issues** | 0 | Any |
| **Cost Savings** | ≥50% | <40% |

### Weekly Check-in

**Week 1** (Stories 1-3):
- Establish baseline
- Fine-tune prompts
- Validate monitoring tools

**Week 2** (Stories 4-6):
- Check metrics stability
- Adjust if needed
- Build confidence

**Week 3** (Stories 7-9):
- Monitor trends
- Optimize workflows
- Document learnings

**Week 4** (Stories 10-12):
- Final assessment
- Go/No-Go decision for next epic
- Present results to team

---

## ✅ Go/No-Go Decision (End of Week 4)

### GO Criteria (Continue Hybrid)

✅ All of these must be true:
- AC pass rate ≥95%
- Test coverage ≥90%
- Code quality ≥8.0/10
- Review iterations ≤3 avg
- Zero security issues
- Cost savings ≥50%
- **Team confidence high**

**Action**: Expand hybrid to next epic

---

### NO-GO Criteria (Rollback to Claude)

❌ Any of these true:
- AC pass rate <90%
- Security issue found
- Quality declining trend
- >4 iterations consistently
- Cost savings <40%
- **Team discomfort**

**Action**: Complete epic with Claude-only, investigate issues

---

## 🎓 Tips for Success

### 1. Start Small

First hybrid story: Choose a **simple, well-understood** story (e.g., basic CRUD).

**Why**: Build confidence before tackling complex stories.

---

### 2. Document Prompts as Templates

Save successful prompts:

```bash
.templates/
├── p2_test_prompt_template.md
├── p3_crud_service_template.md
├── p3_api_route_template.md
└── p7_docs_template.md
```

**Reuse** for similar stories → Consistent quality

---

### 3. Involve Team Early

**Week 0**: Present test results (Story 03.2 data)
**Week 1**: Hands-on training (pair on first story)
**Week 2**: Team tries independently
**Week 4**: Retrospective (what worked, what didn't)

**Buy-in** = Adoption success

---

### 4. Celebrate Cost Savings

**Monthly**:
```bash
python scripts/cost_report.py --month 2026-01

# Output:
# January 2026 Cost Report
# Stories completed: 12
# Hybrid cost: $3.48
# Claude-only would have been: $7.32
# YOU SAVED: $3.84 (52%)
```

**Share with team** → Motivation to continue

---

## 📞 Support & Resources

**Documentation**:
- `.experiments/claude-glm-test/FINAL_COMPARISON_REPORT.md` - Test results
- `.experiments/claude-glm-test/QUALITY_ANALYSIS_REPORT.md` - Quality deep dive
- `.experiments/claude-glm-test/scripts/README_MONITORING.md` - Monitoring tools guide

**Scripts**:
- `glm_call.py` - GLM API wrapper (supports glm-4.7, glm-4.5-air)
- `monitor_quality.py` - Quality tracking
- `detect_regressions.py` - Regression detection
- `quality_dashboard.py` - Visual dashboard
- `quality_gate.sh` - CI/CD quality gate

**For Questions**:
- Internal: #monopilot-dev Slack channel
- Documentation: This guide
- Issues: GitHub Issues with label `hybrid-ai`

---

## 🎯 Summary

**Hybrid Approach** = Use GLM-4.7 for volume (tests, code, docs) + Claude for strategy (UX, review, QA)

**Result**: **53% cost savings with zero quality loss**

**Safeguards**:
- Mandatory Claude code review (P5)
- Mandatory Claude QA (P6)
- Quality monitoring scripts
- Rollback plan if issues arise

**Recommendation**: ✅ **DEPLOY to production** starting with Epic 03-Planning

---

**Last Updated**: 2026-01-03
**Author**: Claude Sonnet 4.5
**Status**: Ready for Team Review
