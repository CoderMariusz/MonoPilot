# Story 0.6: Deep Audit - Work Orders, Products, BOMs (VERIFICATION)

Status: ready-for-dev

## Story

As a **Development Team / System Architect**,
I want **a comprehensive audit of remaining P0 modules (Work Orders, Products, BOMs) to identify any DB ↔ TypeScript ↔ API ↔ UI inconsistencies**,
so that **all data integrity issues are discovered and documented before starting Phase 1 development**.

## Acceptance Criteria

### AC-1: Audit Scope Definition
- Modules to audit: work_orders, products, boms, bom_items, wo_materials, wo_by_products, wo_operations, routings
- Audit checklist created based on Stories 0.1-0.5 patterns
- Audit methodology documented

### AC-2: Database Schema Analysis
- All tables listed with column names, types, constraints
- All CHECK constraints extracted and documented
- All ENUM types (if any) documented
- Foreign key relationships verified

### AC-3: TypeScript Type Analysis
- All interfaces/types for audited tables extracted
- Enum definitions compared with DB CHECK constraints
- Optional vs Required field mismatches identified
- Type naming conventions verified

### AC-4: API Contract Analysis
- All API methods for audited modules inventoried
- API method signatures compared with TypeScript types
- RPC functions (Supabase) analyzed for parameter mismatches
- API validation logic verified

### AC-5: UI Component Analysis
- All components rendering audited data inventoried
- Hardcoded enum values found via grep
- Form validation rules compared with DB constraints
- Display logic verified (status badges, filters, etc.)

### AC-6: Inconsistency Report
- Detailed report documenting ALL findings
- Each inconsistency categorized: CRITICAL, MEDIUM, LOW
- Each inconsistency includes: Location, Impact, Proposed Fix
- Priority ranking for fixes

### AC-7: Fix Stories Created
- For each CRITICAL inconsistency: Create new story (0.8, 0.9, etc.)
- For each MEDIUM inconsistency: Create backlog item or include in existing story
- For each LOW inconsistency: Document as technical debt or ignore with rationale

### AC-8: Quality Gates
- Audit report reviewed by team
- All findings documented in structured format
- No modules left un-audited

## Tasks / Subtasks

### Task 1: Audit Preparation (AC-1) - 3 hours
- [ ] 1.1: Review Stories 0.1-0.5 and extract common patterns
- [ ] 1.2: Create audit checklist template
- [ ] 1.3: Define audit methodology (tools, scripts, manual review)
- [ ] 1.4: Set up audit workspace (docs/audits/)

### Task 2: Database Schema Audit (AC-2) - 6 hours
- [ ] 2.1: Extract schema for work_orders table (columns, constraints, indexes)
- [ ] 2.2: Extract schema for products table
- [ ] 2.3: Extract schema for boms, bom_items tables
- [ ] 2.4: Extract schema for wo_materials, wo_operations, wo_by_products
- [ ] 2.5: Extract schema for routings, routing_operations
- [ ] 2.6: Document all CHECK constraints
- [ ] 2.7: Document all ENUM types
- [ ] 2.8: Verify foreign key relationships

### Task 3: TypeScript Type Audit (AC-3) - 4 hours
- [ ] 3.1: Extract WorkOrder interface from lib/types.ts
- [ ] 3.2: Extract Product, BOM, BOMItem interfaces
- [ ] 3.3: Extract WOMaterial, WOOperation, WOByProduct interfaces
- [ ] 3.4: Extract Routing interfaces
- [ ] 3.5: Compare all enums with DB CHECK constraints
- [ ] 3.6: Identify optional vs required field mismatches

### Task 4: API Contract Audit (AC-4) - 5 hours
- [ ] 4.1: Inventory all WorkOrdersAPI methods
- [ ] 4.2: Inventory all ProductsAPI methods
- [ ] 4.3: Inventory all BomsAPI methods
- [ ] 4.4: Review RPC functions for WO/Product/BOM operations
- [ ] 4.5: Compare API signatures with TypeScript types
- [ ] 4.6: Verify API validation logic

### Task 5: UI Component Audit (AC-5) - 4 hours
- [ ] 5.1: Find all components rendering WorkOrder data (grep search)
- [ ] 5.2: Find all components rendering Product/BOM data
- [ ] 5.3: Find hardcoded status strings (e.g., "In Progress", "Completed")
- [ ] 5.4: Verify form validation rules match DB constraints
- [ ] 5.5: Check status badge/filter components

### Task 6: Inconsistency Report (AC-6) - 3 hours
- [ ] 6.1: Compile all findings into structured report
- [ ] 6.2: Categorize each finding: CRITICAL, MEDIUM, LOW
- [ ] 6.3: Document location, impact, proposed fix for each
- [ ] 6.4: Prioritize findings
- [ ] 6.5: Create summary dashboard (findings count by module/severity)

### Task 7: Create Fix Stories (AC-7) - 3 hours
- [ ] 7.1: For each CRITICAL finding: Draft new story
- [ ] 7.2: For each MEDIUM finding: Create backlog item
- [ ] 7.3: For each LOW finding: Document as tech debt or accept risk
- [ ] 7.4: Update sprint-status.yaml with new stories (if any)

**Total Estimated Effort:** 28 hours (~4 days)

## Dev Notes

### Audit Methodology

**Step 1: Automated Schema Extraction**
```bash
# Extract CHECK constraints
grep -r "CHECK" apps/frontend/lib/supabase/migrations/ | grep -E "(work_orders|products|boms|routings)"

# Extract TypeScript enums
grep -r "export type.*Status\|export type.*Type" apps/frontend/lib/types.ts
```

**Step 2: Manual Comparison**
- Side-by-side comparison of DB vs TypeScript
- Identify mismatches (case, naming, missing values)

**Step 3: API Review**
- Check if API methods use correct enum values
- Verify RPC functions match column names

**Step 4: UI Grep Search**
```bash
# Find hardcoded status strings
grep -r '"In Progress"\|"Completed"\|"Pending"' apps/frontend/app/ apps/frontend/components/
```

**Step 5: Report Generation**
- Use template from Stories 0.1-0.5 audit report
- Structured Markdown format

### Expected Findings (Hypothesis)

Based on Stories 0.1-0.5 patterns, likely issues:
1. **Status enum mismatches** (work_orders.status, products.type)
2. **Case inconsistencies** (DB lowercase, TS PascalCase)
3. **Missing DB columns** (like PO warehouse_id)
4. **Orphaned TS types** (types that don't exist in DB)

### Learnings from Previous Stories

From Stories 0.1-0.5:
- Systematic approach: DB → TS → API → UI
- Use grep for comprehensive searches
- Document findings in structured format
- Prioritize by business impact

### Success Criteria

**Comprehensive Coverage:**
- ✅ All 8 target tables audited
- ✅ All interfaces/types compared
- ✅ All API methods verified
- ✅ All UI components checked

**Quality Report:**
- ✅ Structured findings with locations
- ✅ Clear impact assessment
- ✅ Actionable recommendations

### References

- Epic 0 Roadmap: `docs/bmm-roadmap-epic-0-p0-fixes.md` (Story 0.6 summary)
- Audit Report Template: `docs/P0-MODULES-AUDIT-REPORT-2025-11-14.md`
- Previous Stories: 0.1-0.5 (patterns and methodology)

### Change Log

- **2025-11-14**: Story drafted

## Dev Agent Record

### Context Reference

- **Story Context:** `docs/sprint-artifacts/0-6-deep-audit-wo-products-boms.context.xml`

### Agent Model Used

<!-- Will be filled during dev-story execution -->

### Debug Log References

<!-- Will be filled during dev-story execution -->

### Completion Notes List

<!-- Will be filled during dev-story execution -->

### File List

<!-- Will be filled during dev-story execution -->
