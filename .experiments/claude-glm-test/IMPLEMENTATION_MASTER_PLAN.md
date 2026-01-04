# 🚀 MonoPilot Multi-Agent Implementation Master Plan

**Date**: 2026-01-03
**Based On**: Test results showing 53% cost savings with identical quality
**Status**: Ready for implementation

---

## 📊 Executive Summary

**Test Results**:
- ✅ **53% cost savings** (Claude Only: $1.224 vs Hybrid: $0.577 for 2 stories)
- ✅ **Identical quality** (10/10 ACs, 96% test coverage, 9.5/10 code quality)
- ✅ **Production-ready** code in both scenarios
- ✅ **Same iteration count** (2 cycles average)

**Recommendation**: **ADOPT** Claude + GLM hybrid for MonoPilot production

---

## 🎯 Implementation Phases

### Phase 1: Foundation (Week 1) - TIER 1 Quick Wins
**Goal**: 60-75% cost savings with minimal infrastructure changes
**Effort**: 1 week
**Savings Target**: 55-75% vs pure Claude

#### 1.1 Semantic Routing
- **What**: Intelligent model selection based on task complexity
- **Why**: GLM-4-Flash ($0.10/1M) for simple tasks, GLM-4-Plus ($0.70/1M) for complex
- **Expected Savings**: +10-15%
- **Files to create**:
  - `scripts/routing/semantic-router.ts`
  - `scripts/routing/complexity-analyzer.ts`

#### 1.2 Prompt Caching
- **What**: Cache common context (patterns, skills) for GLM calls
- **Why**: GLM supports caching, reduces input tokens by 30-40%
- **Expected Savings**: +20-30% on GLM tokens
- **Files to create**:
  - `scripts/cache/glm-cache-manager.ts`
  - `scripts/cache/prompt-templates.ts`

#### 1.3 DeepSeek Integration
- **What**: Use DeepSeek Coder ($0.14/1M) for P2 (tests) and P7 (docs)
- **Why**: Specialized for code, cheaper than GLM, better at boilerplate
- **Expected Savings**: +5-10%
- **Files to create**:
  - `scripts/integrations/deepseek-client.ts`
  - `scripts/integrations/deepseek-prompts.ts`

#### 1.4 Template System (MonoPilot-specific)
- **What**: Update existing templates with MonoPilot patterns
- **Why**: Reduces prompt size, improves first-try quality
- **Expected Savings**: +5-10% (fewer iterations)
- **Files to update**:
  - `.claude/templates/BACKEND-TEMPLATES.md` → Add Supabase RLS patterns
  - `.claude/templates/FRONTEND-TEMPLATES.md` → Add Next.js 15 patterns
  - `.claude/templates/TEST-TEMPLATES.md` → Add Vitest patterns

**Phase 1 Total Savings**: **55-75%** (from current 20-48%)

---

### Phase 2: Orchestration (Week 2-3) - TIER 2 Automation
**Goal**: Automated multi-agent workflow
**Effort**: 2 weeks
**Deliverable**: LangGraph-based orchestrator

#### 2.1 LangGraph Setup
- **What**: Python/TypeScript workflow orchestration framework
- **Why**: Better than n8n for LLM workflows (code-first, state management, async)
- **Files to create**:
  - `apps/orchestrator/package.json`
  - `apps/orchestrator/src/graph.ts`
  - `apps/orchestrator/src/nodes/*.ts`
  - `apps/orchestrator/src/state.ts`

#### 2.2 Agent Nodes
Create specialized nodes for each phase:
- `P1_UX_Designer` (Claude)
- `P2_Test_Writer` (DeepSeek → GLM fallback)
- `P3_Code_Generator` (GLM → DeepSeek for CRUD)
- `P5_Code_Reviewer` (Claude - CRITICAL)
- `P6_QA_Tester` (Claude)
- `P7_Doc_Writer` (DeepSeek → GLM fallback)

#### 2.3 State Management
- Checkpoint system (save after each phase)
- Rollback on failure
- Metrics tracking (tokens, cost, time)

#### 2.4 Conditional Routing
```typescript
// Example: P5 → P3 iteration loop
workflow.add_conditional_edges(
  "P5_review",
  (state) => {
    if (state.review.bugs.length > 0) {
      return "P3_code_generator"; // Re-iterate
    }
    if (state.review.status === "APPROVED") {
      return "P6_qa_tester"; // Continue to QA
    }
    return "END"; // Abort
  }
);
```

**Phase 2 Outcome**: Fully automated 7-phase workflow

---

### Phase 3: Template-Based Generation (Week 4-5) - TIER 2 Advanced
**Goal**: 70-80% savings on CRUD stories (80% of MonoPilot)
**Effort**: 2 weeks
**Deliverable**: Code generation templates

#### 3.1 CRUD Templates
**Target**: Stories like 03.2 (Supplier-Product), 05.1 (License Plates)

Create templates for:
- **Migration**: `supabase/migrations/templates/crud-table.sql`
- **Service**: `apps/frontend/lib/services/templates/crud-service.ts`
- **API Route**: `apps/frontend/app/api/templates/crud-route.ts`
- **Validation**: `apps/frontend/lib/validation/templates/crud-schema.ts`
- **Component**: `apps/frontend/components/templates/crud-table.tsx`

#### 3.2 Template Fill Workflow
```typescript
// 1. Claude designs UX + generates spec (P1)
const spec = {
  table: 'license_plates',
  fields: ['lp_code', 'product_id', 'quantity', 'status'],
  operations: ['GET', 'POST', 'PUT', 'DELETE'],
  rls: true,
  org_scoped: true
};

// 2. Template engine generates 80% boilerplate
const generated = fillTemplate('crud-service', spec);

// 3. GLM fills business logic (20%)
const final = await glm.complete({
  template: generated,
  instructions: 'Add FIFO allocation logic to findAvailable()'
});

// 4. Claude reviews (P5)
const review = await claude.review(final);
```

**Expected Savings**: 60-70% tokens (template generation = 0 tokens)

#### 3.3 Template Library Structure
```
.claude/templates/
├── code-gen/
│   ├── backend/
│   │   ├── supabase/
│   │   │   ├── migration-crud.sql.template
│   │   │   └── rls-policy.sql.template
│   │   ├── services/
│   │   │   ├── crud-service.ts.template
│   │   │   └── search-service.ts.template
│   │   └── api/
│   │       ├── route-get.ts.template
│   │       └── route-post.ts.template
│   └── frontend/
│       ├── components/
│       │   ├── data-table.tsx.template
│       │   └── form-modal.tsx.template
│       └── hooks/
│           └── use-resource.ts.template
└── prompts/
    ├── glm/
    │   ├── p2-test-prompt.md
    │   ├── p3-code-prompt.md
    │   └── p7-doc-prompt.md
    └── deepseek/
        ├── test-generation.md
        └── doc-generation.md
```

**Phase 3 Outcome**: 70-80% cost reduction on CRUD stories

---

### Phase 4: Advanced Optimizations (Week 6-8) - TIER 3 Optional
**Goal**: 80-85% savings (only if needed)
**Effort**: 3 weeks
**ROI**: Diminishing returns, only for large-scale usage

#### 4.1 Fine-tuning GLM
- Train GLM-4 on 100 approved MonoPilot stories
- Cost: $50-100 one-time
- Benefit: Better first-try (fewer iterations)
- Expected Savings: +20-30% through fewer review cycles

#### 4.2 Differential Implementation
- Semantic search for similar existing files
- Generate only diff instead of full file
- Reduce output tokens by 75%
- Complex to implement (3 weeks effort)

#### 4.3 Local Models
- Ollama + Qwen 2.5 Coder 32B for P2/P4
- Free after setup
- Fast (no API latency)
- Good for test boilerplate

**Phase 4 Outcome**: Maximum optimization (80-85% savings)

---

## 📐 Technical Architecture

### Current (Baseline)
```
User → Claude (all phases) → Code
Cost: $0.61/story
```

### Phase 1 (Hybrid + Optimizations)
```
User → Semantic Router → {
  P1: Claude (UX)
  P2: DeepSeek (tests) + cache
  P3: GLM-4-Plus (code) + cache
  P5: Claude (review)
  P6: Claude (QA)
  P7: DeepSeek (docs) + cache
} → Code

Cost: $0.15/story (75% savings)
```

### Phase 2 (LangGraph Orchestration)
```
User → LangGraph Workflow → {
  State management
  Conditional routing
  Error handling
  Checkpoints
  Metrics
} → Code

Cost: $0.15/story (same, but automated)
```

### Phase 3 (Template-Based)
```
User → LangGraph → {
  P1: Claude (spec generation)
  Templates: Fill 80% (0 tokens!)
  P3: GLM (20% business logic)
  P5: Claude (review)
  P6: Claude (QA)
  Templates: Fill docs (0 tokens!)
} → Code

Cost: $0.12/story (80% savings)
```

---

## 🛠️ Technology Stack

### Orchestration
- **LangGraph** (TypeScript version)
  - State management
  - Conditional routing
  - Checkpointing
  - Async workflows
  - **Why not n8n**: Code-first, Git-friendly, no server needed

### Model APIs
| Model | Use Case | Cost/1M | API |
|-------|----------|---------|-----|
| **Claude Opus 4.5** | P1, P5, P6 | $15/1M | Anthropic API |
| **GLM-4-Plus** | P3 complex | $0.70/1M | ZhipuAI API |
| **GLM-4-Flash** | P3 simple | $0.10/1M | ZhipuAI API |
| **DeepSeek Coder V2** | P2, P7 | $0.14/1M | DeepSeek API |

### Template Engine
- **Handlebars.js** or **EJS** for template filling
- **Semantic search**: ChromaDB for finding similar files
- **AST manipulation**: ts-morph for TypeScript code generation

### Monitoring
- Token tracking per phase
- Cost tracking per story
- Quality metrics (bugs found, iterations)
- Success rate by story type

---

## 📊 Cost Projection (100 Stories/Year)

### Baseline (Claude Only)
```
100 stories × $0.61 = $61.00/year
```

### Phase 1 (Hybrid + Quick Wins)
```
100 stories × $0.15 = $15.00/year
Savings: $46.00 (75%)
```

### Phase 3 (+ Templates)
```
80 CRUD stories × $0.12 = $9.60
20 complex stories × $0.20 = $4.00
Total: $13.60/year
Savings: $47.40 (78%)
```

### Phase 4 (+ Fine-tuning)
```
Fine-tuning cost: $100 (one-time)
100 stories × $0.10 = $10.00/year
Year 1 total: $110.00
Year 2+: $10.00/year
Savings Year 2+: $51.00 (84%)
```

**Break-even on fine-tuning**: 2 years

---

## ✅ Quality Assurance Plan

### Mandatory Quality Gates
1. **P5 Code Review**: Claude reviews ALL GLM/DeepSeek code (NON-NEGOTIABLE)
2. **P6 QA Testing**: Claude validates ALL acceptance criteria
3. **Automated Tests**: 95%+ pass rate required
4. **Security Scans**: 0 high/critical vulnerabilities

### Monitoring Metrics (Weekly)
| Metric | Target | Alert If |
|--------|--------|----------|
| **Bug Escape Rate** | <1% | >2% |
| **Review Cycles** | 2-3 | >4 |
| **AC Pass Rate** | 100% | <95% |
| **Test Coverage** | >95% | <90% |
| **Security Issues** | 0 | Any high/critical |

### Rollback Plan
**If quality degrades**:
1. Week 1-2: Switch problematic phase to Claude (e.g., P2 → Claude instead of DeepSeek)
2. Week 3-4: Roll back entire story to Claude-only
3. Investigation: Analyze what failed, improve prompts/templates
4. Retry after fixes

---

## 🚀 Implementation Roadmap

### Week 1: Quick Wins
- [ ] Implement semantic routing
- [ ] Add GLM prompt caching
- [ ] Integrate DeepSeek API
- [ ] Test on 2 stories
- **Expected Result**: 60-75% savings

### Week 2-3: LangGraph Orchestration
- [ ] Setup LangGraph project
- [ ] Create agent nodes (P1-P7)
- [ ] Implement state management
- [ ] Add conditional routing
- [ ] Test full workflow on 1 story
- **Expected Result**: Automated workflow

### Week 4-5: Template System
- [ ] Create CRUD templates (5 types)
- [ ] Build template filling engine
- [ ] Integrate into LangGraph
- [ ] Test on 3 CRUD stories
- **Expected Result**: 70-80% savings on CRUD

### Week 6-8: Advanced (Optional)
- [ ] Collect 100 story examples
- [ ] Fine-tune GLM-4
- [ ] Test on 5 new stories
- **Expected Result**: 80-85% savings

---

## 📦 Deliverables by Phase

### Phase 1 Deliverables
```
.experiments/hybrid-implementation/
├── scripts/
│   ├── routing/
│   │   ├── semantic-router.ts
│   │   └── complexity-analyzer.ts
│   ├── cache/
│   │   ├── glm-cache-manager.ts
│   │   └── prompt-templates.ts
│   └── integrations/
│       ├── deepseek-client.ts
│       └── glm-client-enhanced.ts
├── config/
│   ├── models.json
│   └── routing-rules.json
└── tests/
    └── integration/
        └── hybrid-workflow.test.ts
```

### Phase 2 Deliverables
```
apps/orchestrator/
├── package.json
├── tsconfig.json
├── src/
│   ├── graph.ts              # Main LangGraph workflow
│   ├── state.ts              # Workflow state management
│   ├── nodes/
│   │   ├── P1_UXDesigner.ts
│   │   ├── P2_TestWriter.ts
│   │   ├── P3_CodeGenerator.ts
│   │   ├── P5_CodeReviewer.ts
│   │   ├── P6_QATester.ts
│   │   └── P7_DocWriter.ts
│   ├── routing/
│   │   └── conditional-edges.ts
│   ├── checkpoints/
│   │   └── checkpoint-manager.ts
│   └── metrics/
│       └── metrics-tracker.ts
└── tests/
    └── workflows/
        └── full-story.test.ts
```

### Phase 3 Deliverables
```
.claude/templates/code-gen/
├── backend/
│   ├── supabase/
│   │   ├── migration-crud.sql.template
│   │   └── rls-policy.sql.template
│   ├── services/
│   │   └── crud-service.ts.template
│   └── api/
│       └── route-crud.ts.template
└── frontend/
    ├── components/
    │   └── data-table.tsx.template
    └── validation/
        └── zod-schema.ts.template

apps/orchestrator/src/
├── templates/
│   ├── template-engine.ts
│   ├── template-filler.ts
│   └── semantic-search.ts
└── generators/
    └── crud-generator.ts
```

---

## 🎓 Training & Documentation

### For Development Team
1. **LangGraph Basics** (2 hours)
   - How workflows work
   - How to add/modify nodes
   - How to debug failures

2. **Hybrid Workflow Guide** (1 hour)
   - When to use hybrid vs Claude-only
   - How to interpret metrics
   - How to trigger manual review

3. **Template Usage** (1 hour)
   - Available templates
   - How to create new templates
   - When templates apply

### Documentation to Create
- `docs/orchestration/LANGGRAPH_GUIDE.md`
- `docs/orchestration/HYBRID_WORKFLOW.md`
- `docs/templates/TEMPLATE_LIBRARY.md`
- `docs/templates/CREATING_TEMPLATES.md`

---

## 🔍 Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **GLM quality issues** | Medium | Low | Claude review catches all (proven in tests) |
| **DeepSeek API outage** | Low | Medium | Fallback to GLM for P2/P7 |
| **Template not matching** | Medium | Medium | GLM fills gaps, Claude reviews |
| **LangGraph complexity** | Medium | Low | Good docs, simple workflows first |
| **Cost overrun** | Very Low | Low | Monitoring dashboard, alerts |

---

## 📈 Success Metrics

### After 10 Stories (Pilot)
| Metric | Target | Success Criteria |
|--------|--------|------------------|
| **Cost Savings** | 60-75% | >50% |
| **Quality (ACs)** | 100% | >95% |
| **Bug Escape** | <1% | <2% |
| **Review Cycles** | 2-3 | <4 |
| **Team Satisfaction** | N/A | >7/10 survey |

### After 50 Stories (Production)
| Metric | Target | Success Criteria |
|--------|--------|------------------|
| **Cost Savings** | 70-80% | >60% |
| **Cumulative Savings** | $30+ | >$20 |
| **Quality Maintained** | 100% ACs | >95% ACs |
| **Process Stable** | <5% rollbacks | <10% rollbacks |

---

## 🎯 Next Steps

### Immediate (Next 3 Days)
1. ✅ Review this plan with team
2. [ ] Setup project structure (`apps/orchestrator/`)
3. [ ] Implement semantic routing (8 hours)
4. [ ] Test on Story 03.3 (Supplier Management)

### Week 1
5. [ ] Implement DeepSeek integration
6. [ ] Add GLM prompt caching
7. [ ] Test on 2 more stories
8. [ ] Measure actual savings

### Week 2
9. [ ] Start LangGraph setup
10. [ ] Create P1-P7 nodes
11. [ ] Test automated workflow

### Decision Point (End Week 2)
- **If savings >60% and quality maintained**: Continue to Phase 3 (Templates)
- **If savings 40-60%**: Optimize Phase 1 first
- **If quality issues**: Rollback, investigate, retry

---

## 📞 Support & Resources

### External Documentation
- **LangGraph**: https://langchain-ai.github.io/langgraph/
- **GLM-4 API**: https://open.bigmodel.cn/dev/api
- **DeepSeek API**: https://api-docs.deepseek.com/
- **Anthropic API**: https://docs.anthropic.com/

### Internal Resources
- Test results: `.experiments/claude-glm-test/FINAL_COMPARISON_REPORT.md`
- Quality analysis: `.experiments/claude-glm-test/QUALITY_ANALYSIS_REPORT.md`
- Templates: `.claude/templates/`

### Team Contacts
- **Orchestration Lead**: TBD
- **Quality Assurance**: TBD
- **Template Maintainer**: TBD

---

## ✅ Conclusion

**We have validated that Claude + GLM hybrid approach**:
- ✅ Saves 53% cost (tested)
- ✅ Maintains 100% quality (tested)
- ✅ Is production-ready (tested)

**With Phase 1 optimizations, we can achieve**:
- 🎯 60-75% cost savings
- 🎯 Same quality guarantees
- 🎯 Minimal infrastructure changes

**Recommendation**: **START Phase 1 implementation immediately.**

**Expected ROI**: $46 savings on next 100 stories (vs $15 implementation cost)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-03
**Next Review**: After 10 story pilot
