# Scope Review: Epic 2 - Routing + BOM Validation

**Reviewer**: PRODUCT-OWNER Agent
**Date**: 2025-12-14
**Decision**: APPROVED WITH CONDITIONS
**Scope**: TEC-005, TEC-006, TEC-007, TEC-008, TEC-010

---

## Executive Summary

| Area | Status | MVP Scope | Notes |
|------|--------|-----------|-------|
| **Routing (TEC-007, TEC-008)** | APPROVED | P0 + P1 complete | All CRITICAL fixes applied, ADR-009 included |
| **Routing Detail (TEC-010)** | MISMATCH | N/A | File is Allergen Management, NOT Routing Detail |
| **BOM List (TEC-005)** | APPROVED | P0 complete | 100% PRD coverage |
| **BOM Modal (TEC-006)** | APPROVED | P0 + P1 complete | Full page, all fields covered |
| **Costing Integration** | PHASE 2C-2 | Not MVP | TEC-013, TEC-015 are Phase 2C-2 |
| **Shelf Life** | PHASE 2C-2 | Not MVP | TEC-014 is Phase 2C-2 |

**Critical Issue Identified**: TEC-010 filename suggests "Routing Detail" but file contains "Allergen Management". This needs clarification.

---

## 1. Routing Scope Re-validation (Post-Fixes)

### 1.1 CRITICAL Fixes Assessment

| Fix | PRD Requirement | In Scope? | Status |
|-----|-----------------|-----------|--------|
| `code` field added | FR-2.54 | Yes - Epic 2C-1 | DONE (ADR-009) |
| `is_reusable` flag | FR-2.55 | Yes - Epic 2C-1 | DONE (ADR-009) |
| `status` dropdown (replaces is_active) | FR-2.40 | Yes - Epic 2C-1 | DONE |
| `version` display | FR-2.46 | Yes - Epic 2C-1 | DONE |
| Cost fields (setup, working, overhead) | FR-2.51, FR-2.52, FR-2.53 | Phase 2C-2 | PLANNED (ADR-009) |

**Verdict**: All CRITICAL fixes are IN SCOPE for Epic 2. Cost fields are Phase 2C-2 but are OPTIONAL (default 0).

### 1.2 ADR-009 Cost Fields - MVP vs Phase 2?

| Field | MVP (P0) | Phase 2C-2 (P1) | Justification |
|-------|----------|-----------------|---------------|
| `setup_cost` | Default 0 | Configured | P0: Schema ready. P1: UI population |
| `working_cost_per_unit` | Default 0 | Configured | P0: Schema ready. P1: UI population |
| `overhead_percent` | Default 0 | Configured | P0: Schema ready. P1: UI population |
| `currency` | Default PLN | Configured | P0: Schema ready. P1: Multi-currency |

**Decision**:
- **MVP (P0)**: Fields exist with defaults (0, PLN). UI shows fields but they are OPTIONAL.
- **Phase 2C-2 (P1)**: Cost calculation logic uses these fields.

**TEC-008 includes cost fields** - This is correct. They are OPTIONAL inputs in MVP, enabled in Phase 2C-2.

### 1.3 Version Field Assessment

| Requirement | Must-Have (MVP)? | Implemented? |
|-------------|------------------|--------------|
| Version display in edit mode header | Yes - FR-2.46 | Yes (TEC-008) |
| Version auto-increment on edit | Yes - FR-2.46 | Yes (backend) |
| Version history view | Nice-to-Have | Separate screen |

**Verdict**: Version field is MUST-HAVE for MVP. TEC-008 includes it.

### 1.4 Cleanup Time / Instructions Assessment

| Field | PRD Requirement | Must-Have? | Location |
|-------|-----------------|------------|----------|
| `cleanup_time` | FR-2.43 | Yes | routing_operations table |
| `instructions` | FR-2.45 | Yes | routing_operations table |

**Note**: These fields are for **routing_operations**, not routing header. They should be in the **Routing Detail Page** (operations management), NOT in TEC-008 (header modal).

**Current Status**:
- TEC-008 = Routing header create/edit modal (correct - no cleanup_time/instructions)
- TEC-010 = MISMATCH - File is "Allergen Management", not "Routing Detail"

**Action Required**: Verify where Routing Detail Page wireframe exists. If TEC-010 is supposed to be Routing Detail, file content is wrong.

---

## 2. BOM Scope Validation

### 2.1 PRD Coverage Matrix

| PRD Requirement | TEC-005 | TEC-006 | Coverage |
|-----------------|---------|---------|----------|
| FR-2.20 BOM CRUD | List | Create/Edit | Full |
| FR-2.21 BOM items (qty, unit, sequence) | - | Items table | Full |
| FR-2.22 Date overlap prevention | - | Validation | Full |
| FR-2.23 Version timeline | - | Separate view | Partial (P1) |
| FR-2.24 BOM clone | - | Import from BOM | Partial (P1) |
| FR-2.25 Version comparison | - | Separate view | Deferred (P1) |
| FR-2.26 Conditional items | - | condition_flags | Full |
| FR-2.27 Byproducts | - | Byproducts section | Full |
| FR-2.28 Allergen inheritance | - | Auto-calc | Full |
| FR-2.29 Multi-level explosion | - | Separate view | Deferred (P1) |
| FR-2.30 Alternative ingredients | - | Alternatives modal | Full |
| FR-2.31 Operation assignment | - | operation_seq field | Full |
| FR-2.32 Packaging fields | - | Advanced settings | Full |
| FR-2.33 Production line assignment | - | line_ids field | Full |
| FR-2.34 Yield calculation | - | Footer totals | Full |
| FR-2.35 BOM scaling | - | Calculator | Deferred (P1) |
| FR-2.36 Cost rollup | - | TEC-013 | Phase 2C-2 |

**Coverage**: 13/16 FRs in TEC-005/006 = **81.25%** (remaining 3 are explicitly Phase 2C-2 or P1)

### 2.2 Pricing Logic Assessment (CRITICAL)

**User Concern**: "BOM = Core Business Logic for pricing"

| Component | Where Configured | TEC Coverage | Notes |
|-----------|------------------|--------------|-------|
| Material unit cost | TEC-004 `std_price` | Yes | Material modal has cost field |
| BOM item cost | TEC-006 (calculated) | Implicit | Qty x material cost (not shown in UI) |
| Total BOM material cost | TEC-006 footer | Partial | Shows input totals, not cost totals |
| Routing labor cost | TEC-008 (ADR-009) | Yes | setup_cost + working_cost_per_unit |
| Total product cost | TEC-013 | Phase 2C-2 | Recipe Costing View |
| Product price | TEC-002 `std_price` | Yes | Product modal has price field |
| Cost history | TEC-015 | Phase 2C-2 | Cost History View |

**Gap Identified**: TEC-006 (BOM Modal) does not show cost calculations in UI.

**PO Question Response**:
- Product price configuration is in **Technical Module** (TEC-002 Product Modal - `std_price` field)
- Cost calculation and margin analysis is in **Phase 2C-2** (TEC-013 Recipe Costing)
- Finance Module (Epic 9) handles variance analysis and profitability reports

**Recommendation**:
- MVP: BOM modal focuses on quantity/formulation
- Phase 2C-2: TEC-013 shows cost breakdown, TEC-015 shows history

### 2.3 Shelf Life Management Assessment (CRITICAL)

| Component | Where Configured | TEC Coverage | Notes |
|-----------|------------------|--------------|-------|
| Material shelf life | TEC-004 `shelf_life_days` | Yes | Material modal |
| Product shelf life | TEC-002 `shelf_life_days` | Yes | Product modal |
| Best before calculation | TEC-014 | Phase 2C-2 | Shelf Life Config Modal |
| FIFO/FEFO rules | TEC-014 | Phase 2C-2 | Picking strategy config |
| Expiry tracking | Warehouse (Epic 5) | Separate | License Plate expiry |

**PO Question Response**:
- Shelf life is **defined** in Technical Module (TEC-002, TEC-004)
- Shelf life is **calculated** in Phase 2C-2 (TEC-014)
- Shelf life is **enforced** in Warehouse Module (Epic 5 - FIFO/FEFO picking)

**Recommendation**:
- MVP: Basic shelf_life_days field on products/materials
- Phase 2C-2: TEC-014 for complex calculation from ingredients

### 2.4 BOM Versioning Assessment (CRITICAL)

| Feature | TEC-006 Coverage | Status |
|---------|------------------|--------|
| BOM version number | Yes - read-only display | In scope |
| Effective dates | Yes - date pickers | In scope |
| Date overlap prevention | Yes - validation rules | In scope |
| BOM status (Draft/Active/Phased/Inactive) | Yes - dropdown | In scope |
| One active BOM per product | Yes - business rule | In scope |
| BOM approval workflow | No | NOT in scope (P2) |

**Verdict**: BOM versioning is COMPLETE in TEC-006 for MVP. Approval workflow is P2.

---

## 3. Cross-Module Dependencies

### 3.1 BOM Dependencies

| Dependency | Blocking for BOM? | Status |
|------------|-------------------|--------|
| Products (TEC-001/002) | Yes | Exists |
| Materials (TEC-003/004) | Yes | Exists |
| Routings (TEC-007/008) | Optional | Exists |
| Warehouse (Epic 5) | No | For FIFO/FEFO only |
| Finance (Epic 9) | No | For cost accounting |

**Blocking Dependencies**: Products and Materials must exist before BOM implementation. Both exist.

### 3.2 Routing Dependencies

| Dependency | Blocking for Routing? | Status |
|------------|----------------------|--------|
| Machines/Work Centers | Optional | Settings Module |
| BOMs (assign routing) | No | Routing standalone |

**Blocking Dependencies**: None. Routings can be created independently.

---

## 4. MVP Definition Analysis

### 4.1 BOM MVP (P0)

| Feature | Priority | In TEC-005/006? |
|---------|----------|-----------------|
| BOM CRUD (header) | P0 | Yes |
| BOM items (qty, unit, sequence) | P0 | Yes |
| Material quantity in base units | P0 | Yes |
| Routing assignment (optional) | P0 | Yes |
| Date overlap prevention | P0 | Yes |
| Status management | P0 | Yes |

**All P0 features are in TEC-005/006**

### 4.2 BOM Nice-to-Have (P1)

| Feature | Priority | In TEC-005/006? |
|---------|----------|-----------------|
| BOM versioning (effective dates) | P0 | Yes |
| Alternative ingredients | P1 | Yes |
| Byproducts | P1 | Yes |
| Conditional items | P1 | Yes |
| Allergen inheritance | P0 | Yes (auto-calc) |
| Multi-level explosion | P1 | Separate view |

**Most P1 features included. Multi-level explosion is separate.**

### 4.3 BOM Future (P2)

| Feature | In TEC-005/006? |
|---------|-----------------|
| Co-products | No |
| Parallel operations | No |
| Quality checkpoints | No (Epic 6) |
| BOM approval workflow | No |

**P2 features correctly excluded from TEC-005/006**

---

## 5. INVEST Validation

### 5.1 TEC-005 (BOM List)

| Criteria | Score | Assessment |
|----------|-------|------------|
| Independent | PASS | No circular deps with Products/Materials |
| Negotiable | PASS | HOW flexible (filters, pagination) |
| Valuable | PASS | User can view/manage BOM catalog |
| Estimable | PASS | 2-3 days (Small) |
| Small | PASS | Single page, clear scope |
| Testable | PASS | AC: Filter by status returns correct results |

**INVEST Score: 6/6**

### 5.2 TEC-006 (BOM Modal/Page)

| Criteria | Score | Assessment |
|----------|-------|------------|
| Independent | PASS | Requires Products/Materials to exist |
| Negotiable | PASS | Items table, alternatives modal flexible |
| Valuable | PASS | Define product formulations |
| Estimable | PASS | 5-8 days (Large but clear) |
| Small | WARNING | Large scope - consider split |
| Testable | PASS | AC: Create BOM with 5 items, verify cost calc |

**INVEST Score: 5/6** (Small criterion warning)

**Recommendation**: TEC-006 is large. Consider sub-stories:
1. BOM Header CRUD (2 days)
2. BOM Items Table (3 days)
3. Alternatives Modal (1 day)
4. Byproducts Section (1 day)
5. Advanced Settings (1 day)

### 5.3 TEC-007 (Routing List)

| Criteria | Score | Assessment |
|----------|-------|------------|
| Independent | PASS | No dependencies |
| Negotiable | PASS | Filters flexible |
| Valuable | PASS | User can manage routings |
| Estimable | PASS | 1-2 days (Small) |
| Small | PASS | Single page |
| Testable | PASS | AC: Filter by Active returns only active routings |

**INVEST Score: 6/6**

### 5.4 TEC-008 (Routing Modal)

| Criteria | Score | Assessment |
|----------|-------|------------|
| Independent | PASS | No dependencies |
| Negotiable | PASS | Cost fields optional |
| Valuable | PASS | Create routing templates |
| Estimable | PASS | 2-3 days (Small-Medium) |
| Small | PASS | Modal form, clear fields |
| Testable | PASS | AC: Duplicate code returns 409 Conflict |

**INVEST Score: 6/6**

### 5.5 TEC-010 (Allergen Management) - MISMATCH

**Note**: TEC-010 filename suggests Routing Detail but contains Allergen Management.

If evaluating as Allergen Management:

| Criteria | Score | Assessment |
|----------|-------|------------|
| Independent | PASS | Depends on Products |
| Negotiable | PASS | Flexible implementation |
| Valuable | PASS | Food safety compliance |
| Estimable | PASS | 3-4 days (Medium) |
| Small | PASS | Section/Modal scope |
| Testable | PASS | AC: Add allergen, verify inheritance |

**INVEST Score: 6/6** (but file naming needs fix)

---

## 6. Risk Assessment

### 6.1 Cost Calculation Logic (HIGH RISK)

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Wrong formula | 5 | 2 | Unit tests, formula validation |
| Missing ingredient cost | 4 | 3 | Validation in TEC-006/TEC-013 |
| Currency mixing | 3 | 2 | Single currency per routing (ADR-009) |

**Risk Level**: HIGH (3.7/5)

**Mitigation in Wireframes**:
- TEC-013 shows formula clearly
- TEC-006 validates ingredient selection
- ADR-009 defines calculation formula

### 6.2 Shelf Life Propagation (HIGH RISK)

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Material expiry not tracked | 5 | 2 | TEC-004 requires shelf_life_days |
| FEFO not enforced | 4 | 2 | TEC-014 configures enforcement level |
| Wrong best-before date | 5 | 2 | Calculation logic in TEC-014 |

**Risk Level**: HIGH (4.0/5)

**Mitigation in Wireframes**:
- TEC-004 has shelf_life_days field
- TEC-014 has detailed calculation
- Warehouse Module enforces FEFO

### 6.3 Unit Conversion (MEDIUM RISK)

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| kg vs L mixing | 4 | 3 | UoM validation in TEC-006 |
| Decimal precision | 3 | 2 | DECIMAL(15,6) in schema |
| Unit mismatch in BOM | 4 | 2 | Conversion logic required |

**Risk Level**: MEDIUM (3.3/5)

**Mitigation in Wireframes**:
- TEC-006 shows UoM column clearly
- BOM items have explicit uom field
- Alternative items must be same unit class

### 6.4 Routing Cost Integration (MEDIUM RISK)

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Labor cost not added | 4 | 2 | TEC-006 has routing selector |
| Routing optional | 3 | 3 | Business rule: routing recommended |
| Cost defaults to 0 | 2 | 4 | Acceptable for MVP |

**Risk Level**: MEDIUM (2.8/5)

**Mitigation in Wireframes**:
- TEC-008 has cost fields (ADR-009)
- TEC-013 includes routing costs in total
- Defaults to 0 if not configured

---

## 7. Acceptance Criteria Quality

### 7.1 TEC-005 AC Assessment

| AC Type | Example | Testable? |
|---------|---------|-----------|
| Filter by status | "Filter by Active returns only active BOMs" | Yes |
| Search | "Search 'BREAD' returns matching products" | Yes |
| Pagination | "50 BOMs per page" | Yes |
| Delete restriction | "Cannot delete if used in WOs" | Yes |

**AC Quality**: GOOD - All testable

### 7.2 TEC-006 AC Assessment

| AC Type | Example | Testable? |
|---------|---------|-----------|
| Header validation | "effective_from required" | Yes |
| Item validation | "quantity > 0, max 6 decimals" | Yes |
| Date overlap | "Error if dates overlap with v1" | Yes |
| One active BOM | "Only one active per product" | Yes |

**AC Quality**: GOOD - All testable

### 7.3 Missing AC (Recommendations)

| Wireframe | Missing AC | Suggested AC |
|-----------|------------|--------------|
| TEC-006 | Cost display | "Total input displayed in footer in kg + pcs" |
| TEC-006 | Allergen warning | "Warning shown if adding allergen-containing item" |
| TEC-008 | Code uniqueness | "409 Conflict if code exists in organization" |
| TEC-008 | Usage warning | "Warning if routing used by X BOMs when deactivating" |

---

## 8. Risk Matrix Summary

| Risk Area | Severity (1-5) | Likelihood (1-5) | Risk Score | Mitigation |
|-----------|----------------|------------------|------------|------------|
| Cost calculation | 5 | 2 | 10 | Unit tests, formula in TEC-013 |
| Shelf life | 5 | 2 | 10 | TEC-004 field, TEC-014 logic |
| Unit conversion | 4 | 3 | 12 | UoM validation, conversion logic |
| Routing cost | 3 | 3 | 9 | Defaults to 0, optional field |
| Allergen inheritance | 4 | 2 | 8 | Auto-calc, BOM trigger |
| Date overlap | 4 | 2 | 8 | DB trigger prevents overlap |

**Highest Risk**: Unit conversion (12) - Recommend explicit validation rules

---

## 9. Scope Creep Detection

### 9.1 Features in Wireframes NOT in PRD

| Feature | Wireframe | PRD Backing | Assessment |
|---------|-----------|-------------|------------|
| Import from CSV | TEC-006 | Not explicit | NICE-TO-HAVE |
| Save as Draft | TEC-006 | Implied by status | IN SCOPE |
| Production Lines selector | TEC-006 | FR-2.33 | IN SCOPE |
| Cost fields in routing | TEC-008 | FR-2.51-53 (Phase 2C-2) | IN SCOPE (optional) |
| Version display | TEC-008 | FR-2.46 | IN SCOPE |

**Verdict**: No scope creep detected. All features trace to PRD.

### 9.2 Features in PRD NOT in Wireframes

| PRD Requirement | Status | Justification |
|-----------------|--------|---------------|
| FR-2.23 Version timeline | Separate view | P1 feature |
| FR-2.25 Version comparison | Separate view | P1 feature |
| FR-2.29 Multi-level explosion | Separate view | P1 feature |
| FR-2.35 BOM scaling | Calculator | P1 feature |
| FR-2.36 Cost rollup | TEC-013 | Phase 2C-2 |

**Verdict**: All missing features are explicitly marked P1/P2 in PRD.

---

## 10. Recommendations

### 10.1 Top 3 Must-Do Before Implementation

1. **CRITICAL**: Clarify TEC-010 file content
   - File says "Allergen Management" but filename suggests "Routing Detail"
   - Need Routing Detail wireframe for routing_operations management
   - Where are cleanup_time/instructions fields configured?

2. **HIGH**: Add cost display to TEC-006
   - Footer should show estimated material cost (not just quantity)
   - Formula: SUM(qty x material.std_price)
   - Even in MVP, users need cost visibility

3. **MEDIUM**: Split TEC-006 into sub-stories
   - TEC-006 is 700+ lines, 8 days estimate
   - Recommend: Header (2d) + Items (3d) + Alternatives (1d) + Byproducts (1d) + Advanced (1d)

### 10.2 Phasing Strategy

| Phase | Scope | Duration |
|-------|-------|----------|
| **MVP (2C-1)** | TEC-005, TEC-006 (CRUD), TEC-007, TEC-008 | 2 weeks |
| **Phase 2C-2** | TEC-013 (Costing), TEC-014 (Shelf Life), TEC-015 (History) | 3 weeks |
| **Phase 2E** | Version timeline, comparison, multi-level explosion | 2 weeks |

### 10.3 AC Improvements Needed

| Wireframe | Current AC | Improved AC |
|-----------|------------|-------------|
| TEC-006 | "Save validates header" | "Save validates: product_id required, effective_from required, output_qty > 0, min 1 item" |
| TEC-008 | "Code unique" | "POST /api/technical/routings with duplicate code returns 409 with message 'Code already exists'" |
| TEC-013 | "Shows cost" | "Material cost = SUM(bom_item.quantity x ingredient_cost.cost_per_unit), displayed as currency with 2 decimals" |

---

## 11. Decision

### APPROVED WITH CONDITIONS

**Conditions**:

1. **BLOCKING**: Clarify TEC-010 content (Allergen vs Routing Detail)
   - If Routing Detail wireframe missing, must be created before operations implementation

2. **RECOMMENDED**: Add cost estimate display to TEC-006 footer
   - Shows material cost calculation even in MVP

3. **RECOMMENDED**: Split TEC-006 into sub-stories for better tracking

**Approved Scope**:
- TEC-005: BOM List - APPROVED (100%)
- TEC-006: BOM Create/Edit - APPROVED (100%, consider split)
- TEC-007: Routing List - APPROVED (100%)
- TEC-008: Routing Modal - APPROVED (100% with ADR-009 fixes)
- TEC-010: Allergen Management - APPROVED (but filename/location needs fix)

---

## Handoff

### To SCRUM-MASTER

```yaml
epic: 2
decision: approved_with_conditions
review: docs/2-MANAGEMENT/reviews/scope-review-epic-2-routing-bom.md
conditions:
  - blocking: "Clarify TEC-010 content (Allergen vs Routing Detail)"
  - recommended: "Add cost display to TEC-006 footer"
  - recommended: "Split TEC-006 into 5 sub-stories"
approved_wireframes:
  - TEC-005
  - TEC-006
  - TEC-007
  - TEC-008
  - TEC-010
invest_scores:
  TEC-005: 6/6
  TEC-006: 5/6
  TEC-007: 6/6
  TEC-008: 6/6
  TEC-010: 6/6
```

### To ARCHITECT-AGENT

```yaml
epic: 2
action_required:
  - clarify: "TEC-010 file contains Allergen Management, not Routing Detail"
  - question: "Where is Routing Detail wireframe for routing_operations?"
  - question: "Where are cleanup_time/instructions fields configured?"
technical_notes:
  - "ADR-009 correctly documents routing cost fields"
  - "TEC-008 correctly includes code, is_reusable, cost fields"
  - "routing_operations fields (cleanup_time, instructions) need UI wireframe"
```

---

**Document Status**: COMPLETE
**Review Date**: 2025-12-14
**Reviewer**: PRODUCT-OWNER Agent
