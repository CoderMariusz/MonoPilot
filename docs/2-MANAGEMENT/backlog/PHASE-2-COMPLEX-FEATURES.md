# Phase 2/3 Complex Features Backlog

> **Principle**: Simple versions implemented in MVP (Phase 2C-1/2C-2)
> Complex versions planned for Phase 2D/3A

This document ensures all "complex enhancements" are explicitly tracked for future phases, preventing scope creep in current phase and managing stakeholder expectations.

---

## Epic 2: Technical Module - Complex Enhancements

### 1. FR-2.48-Complex: Parallel Operations Advanced

**Current MVP (Phase 2C-1/2C-2) - DONE:**
- Duplicate sequence numbers = parallel operations
- Duration = MAX(parallel ops) in Gantt view
- Cost = SUM(parallel ops)
- Simple visual: Operations with same seq# number shown side-by-side

**Complex Features (Phase 2D - Q1 2026):**
- Full dependency graph UI (Operation A → B → C visualization)
- Critical path calculation using CPM (Critical Path Method)
- Gantt chart with timeline view (start/end dates per operation)
- Resource conflict detection (same machine can't run parallel)
- Auto-scheduling based on machine availability
- What-if scenarios (simulate new operations or timelines)
- Bottleneck identification algorithm

**Effort Estimate:** 5-7 days
**Priority:** P2 (High - Important for production planning)
**Depends On:**
- Gantt chart library integration (e.g., react-gantt-chart or custom)
- Machine resource allocation schema
- Scheduling algorithm implementation

**Success Metric:**
- Users can visualize complex routings with 20+ operations
- Critical path highlighted correctly
- Auto-scheduling saves 30%+ planning time

---

### 2. FR-2.35-Complex: BOM Scaling Advanced

**Current MVP (Phase 2C-2) - IN PROGRESS:**
- One-time scaling calculation (multiply × 2.5)
- No save, preview only
- Shows scaled ingredient quantities
- Shows scaled cost

**Complex Features (Phase 2D - Q1 2026):**
- Save scaling multipliers as templates (e.g., "Batch Size x5")
- Batch size presets library (1x, 2x, 5x, 10x, custom)
- Scale and save as new BOM version (immutable history)
- Historical scaling records with audit log (who scaled, when, why)
- Ingredient substitution on scale (e.g., bulk packaging vs unit packaging)
- Margin analysis after scaling
- Cost comparison matrix (original vs scaled)

**Effort Estimate:** 4-6 days
**Priority:** P2
**Depends On:**
- BOM versioning API (already exists)
- Template storage infrastructure
- Audit logging enhancement

**Success Metric:**
- 80%+ of users have scaling templates saved
- Scaling operations logged with full audit trail
- Cost predictions accurate within 2%

---

### 3. FR-2.47-Complex: Routing Templates Advanced

**Current MVP (Phase 2C-1/2C-2) - DONE:**
- Clone entire routing with all operations

**Complex Features (Phase 3A - Q2 2026 - Premium):**
- Routing template library (central repository per org)
- Template categories (bread, pastry, dairy, meat, beverages, etc.)
- Public template marketplace (share templates across orgs - SaaS feature)
- Template versioning and automatic updates (push updates to users)
- Usage analytics (most popular templates, adoption rate)
- Template ratings and reviews
- Template permissions (public, org-only, private)
- Bulk routing creation from templates with variations

**Effort Estimate:** 8-10 days
**Priority:** P3 (Premium - Revenue generating)
**Depends On:**
- Multi-org sharing architecture
- Marketplace UI/UX design
- Payment integration for premium templates
- Search and recommendation engine

**Success Metric:**
- 80%+ of users use template library
- Marketplace generates 10%+ additional revenue
- Template creation time reduced by 60%

---

### 4. FR-2.10-Complex: Product Clone Advanced

**Current MVP (Phase 2C-1) - PLANNED:**
- Clone product with new SKU (shallow copy)
- Clone only product master data (name, category, allergens, etc.)
- Manual BOM/routing assignment after clone

**Complex Features (Phase 2D - Q1 2026):**
- Clone product WITH BOMs (deep copy)
  - All BOM versions copied with new ID
  - All routing references updated to point to new routings
- Clone product family (multiple SKU variants at once)
  - E.g., "Clone Product 'Bread' as 500g, 1kg, 2kg variants"
- Clone with transformation rules
  - Change UoM on clone (e.g., kg → lb)
  - Auto-scale BOM (e.g., 50% for smaller size)
  - Re-calculate costs automatically
- Clone history (track source product, clone date, changes made)
- Diff view (show what changed from original)

**Effort Estimate:** 3-4 days
**Priority:** P2
**Depends On:**
- BOM deep copy algorithm
- Routing reference update logic
- Product family concept (schema ready)

**Success Metric:**
- Product setup time reduced by 40%
- Users successfully clone complex products with BOMs
- Clone accuracy 99%+ (no missing references)

---

## Epic 3: Planning Module - Complex Enhancements

### 5. FR-3.XX-Complex: Forecast Modeling Advanced

**Current MVP (Phase 2C-2) - PLANNED:**
- Simple demand forecast (copy historical average)
- Manual adjustment of forecast

**Complex Features (Phase 2D - Q1 2026):**
- Time-series forecasting (ARIMA, exponential smoothing)
- Seasonal pattern detection
- Trend analysis (growing/declining demand)
- Forecast accuracy tracking (MAPE, MAE)
- Scenario planning (best-case, worst-case, expected)
- What-if simulation (if we reduce price by 10%, demand increases by X%)
- Forecast collaboration (notes, approvals from sales/planning team)

**Effort Estimate:** 6-8 days
**Priority:** P2
**Depends On:**
- Time-series library (e.g., statsmodels, TensorFlow)
- Historical data availability (12+ months)
- Approval workflow

---

## Phase Allocation Summary

| Phase | Modules | Features | Total Effort | Timeline |
|-------|---------|----------|--------------|----------|
| **2C-1** (Dec 2024) | Settings, Technical | Simple versions | 10 days | DONE |
| **2C-2** (Dec 2024) | Technical, Planning | Costing, scaling, simple forecasting | 8 days | In Progress |
| **2D** (Q1 2026) | Technical, Planning | Complex: FR-2.48, FR-2.35, FR-2.10, FR-3.XX | 18-25 days | Backlog |
| **3A** (Q2 2026) | Technical, Planning | Complex: FR-2.47 marketplace | 8-10 days | Backlog |

---

## Dependencies Across Complex Features

```
Phase 2D Dependencies:
├── Gantt chart library (for FR-2.48)
│   └── Required: react-gantt-chart or custom build
├── BOM versioning (for FR-2.35)
│   └── Already exists: bom_versions table
├── Template storage (for FR-2.47)
│   └── New: routing_templates table
├── Product deep copy logic (for FR-2.10)
│   └── Depends on: BOM versioning, routing references
└── Forecast models (for FR-3.XX)
    └── Requires: Historical data API, ML library

Phase 3A Dependencies:
├── Multi-org sharing architecture
│   └── New: template_permissions table
├── Marketplace infrastructure
│   └── New: template_ratings, template_usage tables
└── Payment system integration
    └── Stripe webhook handlers
```

---

## Risk Assessment

| Feature | Risk | Mitigation |
|---------|------|-----------|
| **Parallel Operations (FR-2.48)** | Complex scheduling algorithm | Start with simple cases, add complexity incrementally |
| **Product Clone (FR-2.10)** | Data consistency on deep copy | Use database transactions, test with 100+ item BOMs |
| **Routing Templates (FR-2.47)** | Marketplace governance | Clear TOS, moderation policy, version control |
| **Forecast Models (FR-3.XX)** | Data quality issues | Require 12+ months history before using ML |

---

## Success Criteria

### Phase 2C (MVP - Current)
- [ ] Simple product clone works (shallow copy)
- [ ] BOM scaling preview works correctly
- [ ] Routing clone works
- [ ] All 82+ Basic FRs complete

### Phase 2D (Q1 2026)
- [ ] Gantt chart visualization stable
- [ ] Scaling templates save/load reliably
- [ ] Product deep clone accuracy 99%+
- [ ] No regression in existing features

### Phase 3A (Q2 2026)
- [ ] Marketplace has 50+ templates
- [ ] 20%+ of users sharing templates
- [ ] Premium revenue stream active

---

## Stakeholder Communication

**For Product Management:**
- Complex features are explicitly tracked
- No surprise scope creep during implementation
- Clear phase allocation helps with roadmap planning

**For Engineering:**
- Know which features are "simple" vs "complex"
- Can focus on MVP quality first
- Clear backlog for future planning

**For Sales/Success:**
- Can communicate phase rollout to customers
- Premium features identified for upsell (FR-2.47)
- Realistic timelines manage expectations

---

## Appendix: Feature Classification Matrix

| Feature | MVP? | Phase | Complexity | Dependencies | Revenue Impact |
|---------|------|-------|-----------|--------------|-----------------|
| Product clone (shallow) | YES | 2C-1 | Low | None | NA |
| BOM scaling (preview) | YES | 2C-2 | Low | BOM API | NA |
| Routing clone | YES | 2C-1 | Low | Routing API | NA |
| Parallel operations (basic) | YES | 2C-1 | Medium | Gantt chart | NA |
| **Product clone (deep)** | NO | 2D | Medium | BOM versioning | Direct |
| **Scaling templates** | NO | 2D | Medium | Template storage | Indirect |
| **Routing marketplace** | NO | 3A | High | Multi-org sharing | Direct (Premium) |
| **Forecast models** | NO | 2D | High | ML library | Indirect |

---

**Last Updated:** 2025-12-14
**Document Version:** 1.0
**Status:** ACTIVE - Reviewed and approved for Phase 2/3
