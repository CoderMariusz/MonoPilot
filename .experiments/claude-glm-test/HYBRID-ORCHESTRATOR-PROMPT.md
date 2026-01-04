# HYBRID ORCHESTRATOR - Claude + GLM-4.7 Approach

## 🎯 TARGET
```yaml
Epic: 01-settings
Stories: {{STORY_IDS}}  # e.g., 01.2, 01.3, 01.4
Approach: HYBRID (Claude strategic + GLM-4.7 implementation)
```

---

## 📋 7-PHASE FLOW (HYBRID)

| Phase | Agent | Model | Thinking | Temp | Parallel | Skip When |
|-------|-------|-------|----------|------|----------|-----------|
| **P1** | Claude UX Designer | Sonnet 4.5 | Auto | 1.0 | No | Backend-only |
| **P2** | **GLM Test Writer** | **GLM-4.7** | ✅ Yes | 0.7 | No | Never |
| **P3** | **GLM Developer** | **GLM-4.7** | ✅ Yes | 0.7 | ✓ Backend/Frontend | - |
| **P4** | GLM Refactor | GLM-4.5-Air | ❌ No | 0.7 | No | Clean code |
| **P5** | **Claude Code Reviewer** | **Sonnet 4.5** | Auto | 0.7 | ✓ Multi-story | **NEVER (CRITICAL!)** |
| **P6** | **Claude QA** | **Sonnet 4.5** | Auto | 0.7 | ✓ Multi-story | Never |
| **P7** | GLM Tech Writer | GLM-4.5-Air | ❌ No | 1.0 | No | Never |

**Critical**: **P5 (Claude Code Review) is MANDATORY** - this ensures GLM code quality.

---

## 🤖 PHASE EXECUTION

### P1: UX Design (Claude)
```yaml
Agent: ux-designer
Model: Sonnet 4.5
Input: Story markdown from docs/2-MANAGEMENT/epics/current/{epic}/{story}.md
Output: Wireframe specs, user flows, component specs
Save: .claude/checkpoints/{story}/P1_ux_design.md
Tokens: ~600-800 (Claude)
```

---

### P2: Test Writing (GLM-4.7)

**Step 1 - Claude Orchestration**:
```yaml
Agent: Claude (you)
Task: Create test prompt for GLM-4.7
Input:
  - Story requirements
  - P1 UX design
  - Existing test patterns (.claude/PATTERNS.md)
Output: P2_glm_prompt.md
Tokens: ~400-600 (Claude orchestration)
```

**Step 2 - GLM Execution**:
```bash
cd .experiments/claude-glm-test/scripts

python glm_call_updated.py \
  --model glm-4.7 \
  --thinking \
  --temperature 0.7 \
  --max-tokens 4096 \
  --context .claude/PATTERNS.md \
  --context docs/2-MANAGEMENT/epics/current/{epic}/{story}.md \
  --prompt "$(cat P2_glm_prompt.md)" \
  --output .claude/checkpoints/{story}/P2_tests.test.ts
```

**Output**: Test file with 50+ test cases
**Tokens**: ~2,500-3,000 (GLM)

**Checkpoint**:
```yaml
P2:
  claude_orchestration: 500 tokens
  glm_execution: 2800 tokens
  total: 3300 tokens
  cost: $0.011 (Claude) + $0.002 (GLM) = $0.013
```

---

### P3: Implementation (GLM-4.7)

**Step 1 - Claude Orchestration**:
```yaml
Task: Create implementation prompt
Include:
  - Architecture patterns (.claude/PATTERNS.md)
  - Database schema (.claude/TABLES.md)
  - API patterns
  - Component patterns
  - P2 tests (for TDD context)
Output: P3_glm_prompt.md
Tokens: ~1,000-1,200 (Claude)
```

**Step 2 - GLM Execution**:
```bash
python glm_call_updated.py \
  --model glm-4.7 \
  --thinking \
  --temperature 0.7 \
  --max-tokens 4096 \
  --context .claude/PATTERNS.md \
  --context .claude/TABLES.md \
  --context .claude/checkpoints/{story}/P2_tests.test.ts \
  --prompt "$(cat P3_glm_prompt.md)" \
  --output .claude/checkpoints/{story}/P3_iter1_implementation.md
```

**Output**: Service, API routes, components, migration
**Tokens**: ~4,500-5,000 (GLM)

**Checkpoint**:
```yaml
P3_iter1:
  claude_orchestration: 1200 tokens
  glm_execution: 4800 tokens
  total: 6000 tokens
  cost: $0.022 (Claude) + $0.003 (GLM) = $0.025
```

---

### P5: Code Review (Claude) ⭐ CRITICAL QUALITY GATE

```yaml
Agent: code-reviewer
Model: Sonnet 4.5 (or Opus 4.5 for critical code)
Task:
  - Review ALL GLM-generated code
  - Find bugs (expect 5-7 on first pass)
  - Check security (RLS, SQL injection, XSS)
  - Validate against ACs
  - Rate code quality /10
Decision: APPROVED | REQUEST_CHANGES
Output: .claude/checkpoints/{story}/P5_iter1_review.md
Tokens: ~2,000-2,500 (Claude)
```

**If REQUEST_CHANGES** → Back to P3 iter2:
```bash
# Claude creates bug fix instructions
# P3_iter2_fix_prompt.md lists all bugs with fixes

# GLM fixes bugs
python glm_call_updated.py \
  --model glm-4.7 \
  --thinking \
  --context P3_iter1_implementation.md \
  --context P5_iter1_review.md \
  --prompt "$(cat P3_iter2_fix_prompt.md)" \
  --output P3_iter2_bug_fixes.md

# Claude re-reviews → APPROVED
```

**Checkpoint**:
```yaml
P5_iter1:
  claude_review: 2100 tokens
  decision: request_changes
  bugs_found: 7

P3_iter2:
  claude_fix_prompt: 1000 tokens
  glm_fixes: 2500 tokens

P5_iter2:
  claude_re_review: 1700 tokens
  decision: approved
```

---

### P6: QA Testing (Claude)

```yaml
Agent: qa-agent
Model: Sonnet 4.5
Task:
  - Run all 10 acceptance criteria
  - Manual testing (functional, security, performance)
  - Automated test validation
  - Browser compatibility
Decision: PASS | FAIL
Output: .claude/checkpoints/{story}/P6_qa_report.md
Tokens: ~2,500-3,000 (Claude)
```

---

### P7: Documentation (GLM-4.5-Air)

**Step 1 - Claude Orchestration**:
```yaml
Task: Create documentation prompt
Include:
  - API endpoints
  - User guide requirements
  - Integration guide
Output: P7_glm_prompt.md
Tokens: ~600-700 (Claude)
```

**Step 2 - GLM Execution**:
```bash
python glm_call_updated.py \
  --model glm-4.5-air \
  --no-thinking \
  --temperature 1.0 \
  --max-tokens 8192 \
  --context P3_iter2_bug_fixes.md \
  --prompt "$(cat P7_glm_prompt.md)" \
  --output P7_documentation.md
```

**Output**: API docs, user guide, integration guide
**Tokens**: ~2,000-2,500 (GLM-4.5-Air)

---

## 💰 COST BREAKDOWN (per story avg)

### Claude Tokens (Strategic Phases)
- P1 UX: 650
- P2 Prompt: 500
- P3 iter1 Prompt: 1200
- P5 iter1 Review: 2100
- P3 iter2 Prompt: 1000
- P5 iter2 Re-review: 1700
- P6 QA: 2800
- P7 Prompt: 700
**Claude Total**: ~10,650 tokens × $0.018/1k = **$0.192**

### GLM Tokens (Implementation Phases)
- P2 Tests: 2800
- P3 iter1 Code: 4800
- P3 iter2 Fixes: 2500
- P7 Docs: 2500
**GLM Total**: ~12,600 tokens × $0.0007/1k = **$0.009**

### Total per Story
**$0.201** (vs $0.437 Claude-only = **54% savings**)

---

## 📊 QUALITY MONITORING

### After Each Story

```bash
cd .experiments/claude-glm-test/scripts

# 1. Record metrics
python monitor_quality.py --story {STORY_ID} --scenario b

# 2. Check regressions
python detect_regressions.py --story {STORY_ID} --scenario b

# 3. Run quality gate
./quality_gate.sh --story {STORY_ID} --scenario b

# 4. Update dashboard
python quality_dashboard.py --output ../QUALITY_DASHBOARD.md
```

**Alert Thresholds**:
- AC pass rate <95% → ⚠️ Warning
- Test coverage <90% → ⚠️ Warning
- Code quality <8.0/10 → ⚠️ Warning
- Security issues >0 → 🚨 **HALT**

---

## 🔄 CHECKPOINT TRACKING

**Location**: `.claude/checkpoints/{STORY_ID}.yaml`

**Format**:
```yaml
story_id: "01.2"
scenario: "b"
approach: "hybrid"

phases:
  - phase: "P1"
    agent: "claude"
    model: "sonnet-4.5"
    tokens: 650
    deliverable: "P1_ux_design.md"

  - phase: "P2_orchestration"
    agent: "claude"
    tokens: 500
    deliverable: "P2_glm_prompt.md"

  - phase: "P2_execution"
    agent: "glm"
    model: "glm-4.7"
    tokens: 2800
    deliverable: "P2_tests.test.ts"

  # ... remaining phases

metrics:
  claude_total: 10650
  glm_total: 12600
  cost_usd: 0.201
  bugs_found: 7
  bugs_fixed: 7
  iterations: 2
  quality_score: 9.5
  production_ready: true
```

---

## ⚡ PARALLEL EXECUTION

### Same as Standard Orchestrator:
```yaml
✓ Parallel:
  - Independent stories (different modules)
  - P3: backend + frontend (same story)
  - P5/P6: different stories

✗ Sequential:
  - Same story: P1→P2→P3→P5→P6→P7
  - P3→P5→P3 iterations (fix bugs)
```

---

## 🎯 CRITICAL RULES FOR HYBRID

### MANDATORY (Non-Negotiable):

1. **P5 Claude Review = ALWAYS**
   - Never skip P5, even if GLM output looks perfect
   - Expect 5-7 bugs on first pass (realistic)
   - Budget for 2-3 review iterations

2. **P6 Claude QA = ALWAYS**
   - Manual validation of all 10 ACs
   - Security scan
   - Performance testing

3. **Quality Monitoring = ALWAYS**
   - Run quality scripts after each story
   - Alert on regressions immediately
   - Weekly dashboard review

4. **Context for GLM = REQUIRED**
   - Always provide .claude/PATTERNS.md
   - Include similar code examples
   - Reference database schema

### OPTIONAL (Recommended):

5. **P4 Refactor**: Skip if P3 code is clean (save GLM tokens)
6. **P7 Model Choice**: Use GLM-4.5-Air for faster/cheaper docs
7. **Thinking Mode**: Enable for P2/P3, disable for P7

---

## 📤 DELEGATION PROMPTS

### P2: GLM Test Prompt Template

```markdown
Write comprehensive Vitest unit tests for {{STORY_NAME}}.

Requirements:
- Test service layer: {{SERVICE_FUNCTIONS}}
- Test validation schemas: {{ZOD_SCHEMAS}}
- Test API routes: {{ENDPOINTS}}
- Cover edge cases: null/undefined, duplicates, validation errors
- Use TypeScript strict mode
- Mock Supabase client

Target: 50+ test cases, >80% coverage

Tech Stack: Next.js 15, TypeScript, Supabase, Zod, Vitest

Context:
{{PASTE_STORY_REQUIREMENTS}}
{{PASTE_PATTERNS}}
```

---

### P3: GLM Implementation Prompt Template

```markdown
Implement {{STORY_NAME}} feature for MonoPilot Food MES.

Files to create:
1. Migration: supabase/migrations/{{NUMBER}}_{{name}}.sql
2. Validation: apps/frontend/lib/validation/{{name}}-schemas.ts
3. Service: apps/frontend/lib/services/{{name}}-service.ts
4. API Routes: apps/frontend/app/api/{{module}}/{{resource}}/route.ts
5. Components: apps/frontend/components/{{module}}/{{ComponentName}}.tsx

Requirements:
- Follow project patterns (see context)
- Use Supabase for database
- Zod for validation
- ShadCN UI components
- TypeScript strict mode
- Full error handling
- RLS policies for multi-tenancy

Make tests pass (TDD GREEN phase).

Tech Stack: Next.js 15.5, React 19, TypeScript, Supabase, Zod

Context:
{{PASTE_PATTERNS}}
{{PASTE_TABLES}}
{{PASTE_TESTS}}
```

---

### P7: GLM Documentation Prompt Template

```markdown
Generate comprehensive documentation for {{STORY_NAME}}.

Sections:
1. **API Reference**
   - All endpoints with examples
   - Request/response schemas
   - Error codes

2. **User Guide**
   - How to use feature
   - Step-by-step workflows
   - Screenshots/wireframes reference

3. **Integration Guide**
   - For developers
   - Service layer usage
   - Component usage

4. **Database Schema**
   - Table structure
   - RLS policies
   - Indexes

Format: Markdown with code examples

Context:
{{PASTE_IMPLEMENTATION}}
```

---

## 🚨 QUALITY GATE INTEGRATION

### After Each Story:

```bash
#!/bin/bash
STORY="01.2"

# Execute hybrid workflow
# ... P1-P7 phases ...

# Quality gate
cd .experiments/claude-glm-test/scripts

python monitor_quality.py --story $STORY --scenario b
python detect_regressions.py --story $STORY --scenario b

if [ $? -ne 0 ]; then
    echo "❌ QUALITY GATE FAILED - Regression detected"
    exit 1
fi

./quality_gate.sh --story $STORY --scenario b

echo "✅ Story $STORY approved"
```

---

## 📊 EXPECTED METRICS (per story)

### Tokens
- **Claude**: ~10,650 tokens (P1, P5, P6, orchestration)
- **GLM-4.7**: ~10,100 tokens (P2, P3 iterations)
- **GLM-4.5-Air**: ~2,500 tokens (P7 docs)
- **Total**: ~23,250 tokens

### Cost
- **Claude**: $0.192
- **GLM**: $0.009
- **Total**: ~$0.201 per story

### Quality
- **ACs**: 10/10 (100%)
- **Tests**: >95% pass rate
- **Code Quality**: ≥8.0/10
- **Bugs**: 5-7 found in P5, all fixed by P3 iter2
- **Iterations**: 2-3 (realistic)

---

## 🎯 PILOT EXECUTION (Epic 01-Settings)

### Stories to Process (Example):

```yaml
Stories:
  - 01.2: User Roles CRUD
  - 01.3: Permissions Management
  - 01.4: Organization Profile
  # ... more as needed

Expected:
  - 3 stories × $0.20 = $0.60 total
  - vs Claude-only: 3 × $0.44 = $1.32
  - Savings: $0.72 (55%)
```

### Execution:

```bash
# For each story:
for STORY in 01.2 01.3 01.4; do
    echo "🚀 Processing Story $STORY (HYBRID)"

    # P1: Claude UX Design
    # (manual or via Task tool)

    # P2: GLM Tests
    python glm_call_updated.py -m glm-4.7 --thinking ...

    # P3: GLM Implementation
    python glm_call_updated.py -m glm-4.7 --thinking ...

    # P5: Claude Review
    # (via code-reviewer agent)

    # P3 iter2: GLM Fixes (if needed)
    python glm_call_updated.py -m glm-4.7 ...

    # P5 iter2: Claude Re-review → APPROVED

    # P6: Claude QA
    # (via qa-agent)

    # P7: GLM Docs
    python glm_call_updated.py -m glm-4.5-air ...

    # Quality gate
    ./quality_gate.sh --story $STORY --scenario b

    echo "✅ Story $STORY complete"
done

# Generate final report
python quality_dashboard.py --html --output pilot_dashboard.html
```

---

## 📋 START PROMPT (Copy-Paste After /clear)

```
Execute Epic 01-Settings using HYBRID approach (Claude + GLM-4.7).

Stories: 01.2, 01.3, 01.4

Use hybrid workflow:
- Claude: P1 (UX), P5 (Code Review - MANDATORY), P6 (QA)
- GLM-4.7: P2 (Tests), P3 (Implementation)
- GLM-4.5-Air: P7 (Documentation)

For each story:
1. P1: Design UX (Claude)
2. P2: Generate tests via GLM-4.7 (see .experiments/claude-glm-test/PRODUCTION_IMPLEMENTATION_GUIDE.md)
3. P3 iter1: Generate code via GLM-4.7
4. P5 iter1: Code review (Claude) - expect 5-7 bugs
5. P3 iter2: Fix bugs via GLM-4.7
6. P5 iter2: Re-review (Claude) → APPROVED
7. P6: QA testing (Claude)
8. P7: Generate docs via GLM-4.5-Air

After each story: Run quality monitoring scripts.

Track all tokens in .claude/checkpoints/{story}.yaml

GLM script: .experiments/claude-glm-test/scripts/glm_call_updated.py

Cost target: ~$0.20 per story (vs $0.44 Claude-only)
Quality target: 10/10 ACs, >95% tests, 0 vulnerabilities

START with Story 01.2. NO QUESTIONS. EXECUTE.
```

---

## 📖 REFERENCE DOCS

**Must Read Before Starting**:
1. `.experiments/claude-glm-test/EXECUTIVE_SUMMARY.md` - Overview
2. `.experiments/claude-glm-test/PRODUCTION_IMPLEMENTATION_GUIDE.md` - Detailed guide
3. `.experiments/claude-glm-test/scripts/README_MONITORING.md` - Monitoring tools

**For Troubleshooting**:
- `.experiments/claude-glm-test/QUALITY_ANALYSIS_REPORT.md` - Quality deep dive
- `.experiments/claude-glm-test/FINAL_COMPARISON_REPORT.md` - Full test results

---

**READY TO EXECUTE PILOT. 🚀**

**Expected Outcome**: 3 stories completed in ~5 hours with 55% cost savings and identical quality to Claude-only baseline.
