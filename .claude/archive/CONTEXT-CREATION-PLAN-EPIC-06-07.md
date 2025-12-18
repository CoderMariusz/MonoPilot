# Context Creation Plan - Epic 06 (Quality) & Epic 07 (Shipping)

**Created:** 2025-12-17
**Purpose:** Create multi-file YAML context structure for all Epic 06 and Epic 07 stories
**Pattern:** Follow Epic 01 structure (subdirectories with 5 YAML files per story)
**Execution:** Wave-based parallel deployment (4 agents per wave)

---

## 📊 Epic Statistics

### Epic 06 - Quality Module

**Stories to create context:** 11 active stories
- Main stories: 06.1 through 06.11 (11 stories)
- No substories (a/b splits)

**Wireframes QA-*:** 20 wireframes
- QA-001: Dashboard
- QA-002: Holds list
- QA-003: Specifications list + modal (2 wireframes)
- QA-004: Test templates
- QA-005: Incoming inspection
- QA-006: In-process inspection
- QA-007: Final inspection part1 + part2 (2 wireframes)
- QA-008: Sampling plans
- QA-009: NCR list + detail (2 wireframes)
- QA-010: Batch release
- QA-011: CoA list
- QA-012: CoA templates
- QA-013: HACCP plans
- QA-014: CCP monitoring
- QA-015: CCP deviations
- QA-021: Audit trail
- QA-025: Scanner QA

**Story → Wireframe Mapping:**
- 06.1 → QA-001 (Dashboard)
- 06.2 → QA-002 (Holds list)
- 06.3 → QA-003 (Specifications list + modal)
- 06.4 → QA-004 (Test templates)
- 06.5 → QA-005 (Incoming inspection)
- 06.6 → QA-004, QA-005, QA-006 (Test results recording - shared with templates and inspections)
- 06.7 → QA-008 (Sampling plans AQL)
- 06.8 → QA-025 (Scanner QA pass/fail)
- 06.9 → QA-009 (NCR list + detail)
- 06.10 → QA-006 (In-process inspection)
- 06.11 → QA-007 (Final inspection part1 + part2), QA-010 (Batch release)

---

### Epic 07 - Shipping Module

**Stories to create context:** 16 active stories
- Main stories: 07.1 through 07.16 (16 stories)
- No substories (a/b splits)

**Wireframes SHIP-*:** 22 wireframes
- SHIP-001: Customer list
- SHIP-002: Customer modal
- SHIP-003: Shipping addresses
- SHIP-004: Allergen restrictions
- SHIP-005: Sales order list
- SHIP-006: Sales order create
- SHIP-007: Sales order detail
- SHIP-008: Inventory allocation
- SHIP-009: SO confirmation/hold
- SHIP-010: Partial fulfillment
- SHIP-011: SO cancellation
- SHIP-012: Pick list list
- SHIP-013: Wave picking
- SHIP-014: Pick desktop
- SHIP-015: Pick scanner
- SHIP-016: Short pick
- SHIP-017: Packing station
- SHIP-018: Pack scanner
- SHIP-019: SSCC labels
- SHIP-020: Packing slip
- SHIP-021: Bill of lading
- SHIP-022: Shipping dashboard

**Story → Wireframe Mapping:**
- 07.1 → SHIP-001, SHIP-002, SHIP-003, SHIP-004 (Customers CRUD + contacts + addresses + allergens)
- 07.2 → SHIP-005, SHIP-006, SHIP-007 (Sales orders core list + create + detail)
- 07.3 → SHIP-007, SHIP-009 (SO status workflow - detail + confirmation/hold)
- 07.4 → SHIP-007 (SO line pricing - in detail view)
- 07.5 → SHIP-006 (SO clone/import - uses create wireframe)
- 07.6 → SHIP-004 (SO allergen validation - uses allergen restrictions wireframe)
- 07.7 → SHIP-008 (Inventory allocation)
- 07.8 → SHIP-012, SHIP-013 (Pick list generation + wave picking)
- 07.9 → SHIP-014 (Pick confirmation desktop)
- 07.10 → SHIP-015 (Pick scanner)
- 07.11 → SHIP-017, SHIP-020 (Packing station + packing slip)
- 07.12 → SHIP-018 (Pack scanner)
- 07.13 → SHIP-019, SHIP-021 (SSCC/BOL labels)
- 07.14 → SHIP-007 (Shipment manifest - in SO detail), SHIP-021 (Bill of lading)
- 07.15 → SHIP-022 (Shipping dashboard)
- 07.16 → SHIP-011 (RMA core CRUD - reuses cancellation patterns)

---

## 📁 Directory Structure (To Be Created)

### Epic 06 - Quality

```
docs/2-MANAGEMENT/epics/current/06-quality/context/
├── 06.1/
│   ├── _index.yaml       # Story metadata + dependencies
│   ├── database.yaml     # Tables, RLS, seed data
│   ├── api.yaml          # Endpoints, auth, errors
│   ├── frontend.yaml     # Types, services, components
│   └── tests.yaml        # Acceptance criteria, test specs
├── 06.2/
│   ├── _index.yaml
│   ├── database.yaml
│   ├── api.yaml
│   ├── frontend.yaml
│   └── tests.yaml
├── 06.3/
├── 06.4/
├── 06.5/
├── 06.6/
├── 06.7/
├── 06.8/
├── 06.9/
├── 06.10/
└── 06.11/
```

### Epic 07 - Shipping

```
docs/2-MANAGEMENT/epics/current/07-shipping/context/
├── 07.1/
│   ├── _index.yaml       # Story metadata + dependencies
│   ├── database.yaml     # Tables, RLS, seed data
│   ├── api.yaml          # Endpoints, auth, errors
│   ├── frontend.yaml     # Types, services, components
│   └── tests.yaml        # Acceptance criteria, test specs
├── 07.2/
├── 07.3/
├── 07.4/
├── 07.5/
├── 07.6/
├── 07.7/
├── 07.8/
├── 07.9/
├── 07.10/
├── 07.11/
├── 07.12/
├── 07.13/
├── 07.14/
├── 07.15/
└── 07.16/
```

---

## 🎯 EPIC 06 - Quality Module Execution Plan (3 Waves)

### Wave 1: Core Quality Foundation (4 agents)

**Stories:** 06.1, 06.2, 06.3, 06.4

| Agent | Story | Name | Wireframes | Complexity |
|-------|-------|------|------------|------------|
| tech-writer-1 | 06.1 | Quality Status Types | QA-001 | S |
| tech-writer-2 | 06.2 | Quality Holds CRUD | QA-002 | M |
| tech-writer-3 | 06.3 | Product Specifications | QA-003 (2) | M |
| tech-writer-4 | 06.4 | Test Parameters | QA-004 | M |

**Input for each agent:**
- Story MD file: `docs/2-MANAGEMENT/epics/current/06-quality/06.X.*.md`
- PRD reference: `docs/1-BASELINE/product/modules/quality.md`
- Architecture: `docs/1-BASELINE/architecture/modules/quality.md`
- Wireframes: `docs/3-ARCHITECTURE/ux/wireframes/QA-*.md`
- Example template: `docs/2-MANAGEMENT/epics/current/01-settings/context/01.1/`

**Output for each agent:**
- Create directory: `docs/2-MANAGEMENT/epics/current/06-quality/context/06.X/`
- Generate 5 YAML files: `_index.yaml`, `database.yaml`, `api.yaml`, `frontend.yaml`, `tests.yaml`

---

### Wave 2: Inspections & Testing (4 agents)

**Stories:** 06.5, 06.6, 06.7, 06.8

| Agent | Story | Name | Wireframes | Complexity |
|-------|-------|------|------------|------------|
| tech-writer-5 | 06.5 | Incoming Inspection | QA-005 | L |
| tech-writer-6 | 06.6 | Test Results Recording | QA-004, QA-005, QA-006 | M |
| tech-writer-7 | 06.7 | Sampling Plans (AQL) | QA-008 | M |
| tech-writer-8 | 06.8 | Scanner QA Pass/Fail | QA-025 | M |

---

### Wave 3: NCR & Final Inspection (3 agents)

**Stories:** 06.9, 06.10, 06.11

| Agent | Story | Name | Wireframes | Complexity |
|-------|-------|------|------------|------------|
| tech-writer-9 | 06.9 | Basic NCR Creation | QA-009 (2) | M |
| tech-writer-10 | 06.10 | In-Process Inspection | QA-006 | L |
| tech-writer-11 | 06.11 | Final Inspection & Batch Release | QA-007 (2), QA-010 | L |

---

## 🎯 EPIC 07 - Shipping Module Execution Plan (4 Waves)

### Wave 1: Customers & Core SO (4 agents)

**Stories:** 07.1, 07.2, 07.3, 07.4

| Agent | Story | Name | Wireframes | Complexity |
|-------|-------|------|------------|------------|
| tech-writer-12 | 07.1 | Customers CRUD + Contacts + Addresses | SHIP-001, SHIP-002, SHIP-003, SHIP-004 | M |
| tech-writer-13 | 07.2 | Sales Orders Core CRUD | SHIP-005, SHIP-006, SHIP-007 | M |
| tech-writer-14 | 07.3 | SO Status Workflow | SHIP-007, SHIP-009 | M |
| tech-writer-15 | 07.4 | SO Line Pricing | SHIP-007 | S |

---

### Wave 2: SO Advanced Features (4 agents)

**Stories:** 07.5, 07.6, 07.7, 07.8

| Agent | Story | Name | Wireframes | Complexity |
|-------|-------|------|------------|------------|
| tech-writer-16 | 07.5 | SO Clone/Import | SHIP-006 | M |
| tech-writer-17 | 07.6 | SO Allergen Validation | SHIP-004 | M |
| tech-writer-18 | 07.7 | Inventory Allocation | SHIP-008 | L |
| tech-writer-19 | 07.8 | Pick List Generation | SHIP-012, SHIP-013 | M |

---

### Wave 3: Picking Workflow (4 agents)

**Stories:** 07.9, 07.10, 07.11, 07.12

| Agent | Story | Name | Wireframes | Complexity |
|-------|-------|------|------------|------------|
| tech-writer-20 | 07.9 | Pick Confirmation Desktop | SHIP-014 | M |
| tech-writer-21 | 07.10 | Pick Scanner | SHIP-015 | L |
| tech-writer-22 | 07.11 | Packing & Shipment Creation | SHIP-017, SHIP-020 | L |
| tech-writer-23 | 07.12 | Packing Scanner | SHIP-018 | M |

---

### Wave 4: Labels & Dashboard & RMA (4 agents)

**Stories:** 07.13, 07.14, 07.15, 07.16

| Agent | Story | Name | Wireframes | Complexity |
|-------|-------|------|------------|------------|
| tech-writer-24 | 07.13 | SSCC/BOL Labels | SHIP-019, SHIP-021 | M |
| tech-writer-25 | 07.14 | Shipment Manifest & Ship | SHIP-007, SHIP-021 | M |
| tech-writer-26 | 07.15 | Shipping Dashboard | SHIP-022 | M |
| tech-writer-27 | 07.16 | RMA Core CRUD | SHIP-011 | M |

---

## 📦 Context YAML Template (Based on Epic 01)

Each agent creates **5 YAML files** in the story subdirectory:

### 1. `_index.yaml` - Story Metadata
```yaml
story:
  id: "XX.Y"
  name: "Story Name"
  slug: "story-slug"
  epic: "XX-module-name"
  phase: "1A|1B|2|3"
  complexity: "S|M|L|XL"
  estimate_days: N
  type: "backend|frontend|backend + frontend"
  state: "ready"
  priority: "P0|P1|P2"

context_files:
  - _index.yaml      # This file
  - database.yaml    # Tables, RLS, seed
  - api.yaml         # Endpoints, auth
  - frontend.yaml    # Components, hooks
  - tests.yaml       # Acceptance, tests

dependencies:
  required:
    - story: "XX.Y"
      name: "Story Name"
      provides:
        - "table_name"
        - "service_name"
  blocked_by: []
  dependents:
    - epic: "XX"
      name: "Epic Name"
      requires: "what this story provides"

files_to_read:
  prd:
    path: "docs/1-BASELINE/product/modules/*.md"
    sections: ["FR-XXX-NNN"]
  architecture:
    path: "docs/1-BASELINE/architecture/modules/*.md"
    sections: ["Database Schema", "API Design"]
  story:
    path: "docs/2-MANAGEMENT/epics/current/XX-module/XX.Y.*.md"
  adrs:
    - path: "docs/1-BASELINE/architecture/decisions/ADR-*.md"
      relevance: "Why this ADR matters"
  patterns:
    - "apps/frontend/lib/services/*.ts"

deliverables:
  - type: "migration|service|api|component|test"
    count: N
    description: "What is delivered"

technical_notes:
  - "Important note 1"
  - "Important note 2"
```

### 2. `database.yaml` - Database Schema
```yaml
tables:
  - name: "table_name"
    description: "Table purpose"
    columns:
      - name: "id"
        type: "uuid"
        constraints: "PRIMARY KEY DEFAULT uuid_generate_v4()"
      - name: "org_id"
        type: "uuid"
        constraints: "NOT NULL REFERENCES organizations(id)"
      # ... more columns
    indexes:
      - columns: ["org_id"]
        type: "btree"
    rls:
      enabled: true
      policies:
        - name: "users_select_own_org"
          operation: "SELECT"
          check: "(org_id = (SELECT org_id FROM users WHERE id = auth.uid()))"
    seed_data:
      - description: "Seed data for X"
        sql: "INSERT INTO table_name ..."

migrations:
  - file: "supabase/migrations/XXX_*.sql"
    description: "Migration description"
```

### 3. `api.yaml` - API Endpoints
```yaml
endpoints:
  - method: "GET"
    path: "/api/v1/module/resource"
    description: "Get resources"
    auth: true
    roles: ["admin", "user"]
    query_params:
      - name: "page"
        type: "number"
        required: false
    response:
      success:
        status: 200
        schema: "Resource[]"
      error:
        status: 404
        schema: "{ error: string }"

  - method: "POST"
    path: "/api/v1/module/resource"
    description: "Create resource"
    auth: true
    roles: ["admin"]
    request_body:
      schema: "CreateResourceDto"
    response:
      success:
        status: 201
        schema: "Resource"

error_handling:
  - code: "RESOURCE_NOT_FOUND"
    status: 404
    message: "Resource not found"
```

### 4. `frontend.yaml` - Frontend Components
```yaml
types:
  - path: "apps/frontend/lib/types/*.ts"
    content: |
      export interface ResourceType {
        id: string;
        name: string;
      }

pages:
  - path: "apps/frontend/app/(authenticated)/module/resource/page.tsx"
    description: "Resource list page"
    components:
      - "ResourceDataTable"
      - "ResourceFilters"

components:
  - path: "apps/frontend/components/module/ResourceDataTable.tsx"
    description: "DataTable for resources"
    pattern: "ShadCN DataTable"
    columns: ["Name", "Status", "Actions"]
    features:
      - "Search"
      - "Pagination"
      - "Sorting"

hooks:
  - path: "apps/frontend/lib/hooks/use-resources.ts"
    exports:
      - name: "useResources"
        returns: "UseQueryResult<Resource[]>"

services:
  - path: "apps/frontend/lib/services/resource-service.ts"
    methods:
      - "getResources()"
      - "createResource()"

ux:
  wireframes:
    - id: "MOD-XXX"
      description: "Wireframe description"
      components: ["Component1", "Component2"]

  states:
    loading: "Skeleton with shimmer"
    empty: "Empty state message"
    error: "Error message with retry"
    success: "Data table with items"

  patterns:
    table: "ShadCN DataTable"
    modal: "ShadCN Dialog"
    form: "ShadCN Form with Zod"
```

### 5. `tests.yaml` - Test Specifications
```yaml
acceptance_criteria:
  - id: "AC-1"
    description: "User can view resource list"
    given: "User navigates to resource page"
    when: "Page loads"
    then: "Resource list displays within 500ms"

unit_tests:
  - file: "apps/frontend/lib/services/__tests__/resource-service.test.ts"
    description: "Resource service tests"
    test_cases:
      - name: "getResources returns resources"
        assertions:
          - "Returns Resource[]"
          - "Handles errors"

integration_tests:
  - file: "apps/frontend/app/api/module/__tests__/resource.test.ts"
    description: "Resource API tests"
    test_cases:
      - name: "POST /api/v1/module/resource creates resource"
        setup: "Mock Supabase client"
        assertions:
          - "Returns 201 on success"
          - "Returns 400 on validation error"

e2e_tests:
  - file: "apps/frontend/e2e/module/resource.spec.ts"
    description: "Resource E2E tests"
    scenarios:
      - name: "User creates resource"
        steps:
          - "Navigate to resource page"
          - "Click Create button"
          - "Fill form"
          - "Submit"
          - "Verify resource in list"

test_data:
  - name: "valid_resource"
    data:
      name: "Test Resource"
      status: "active"
```

---

## 🚀 Agent Execution Instructions

### For Each Agent:

**Task Template:**
```
Create YAML context for Story XX.Y [Story Name].

Input files:
- Story MD: docs/2-MANAGEMENT/epics/current/XX-module/XX.Y.*.md
- PRD: docs/1-BASELINE/product/modules/[module].md
- Architecture: docs/1-BASELINE/architecture/modules/[module].md
- Wireframes: docs/3-ARCHITECTURE/ux/wireframes/[wireframe-ids]
- Template: docs/2-MANAGEMENT/epics/current/01-settings/context/01.1/

Output:
Create directory: docs/2-MANAGEMENT/epics/current/XX-module/context/XX.Y/
Generate 5 files:
1. _index.yaml - Story metadata, dependencies, technical notes
2. database.yaml - Tables, columns, RLS policies, indexes, seed data
3. api.yaml - Endpoints (CRUD), auth, roles, request/response schemas
4. frontend.yaml - Page paths, components, services, validation, UX wireframes
5. tests.yaml - Acceptance criteria, unit tests, integration tests, E2E tests

Requirements:
- Follow Epic 01 structure EXACTLY
- Map wireframes to ux.wireframes section in frontend.yaml
- Include all FRs from story MD file
- Ensure database schema matches architecture docs
- Define RLS policies using ADR-013 pattern
- List all components, hooks, services needed
- Write comprehensive test specifications

DO NOT:
- Create gaps.yaml (Epic 01 has this but it's optional)
- Add extra files beyond the 5 required
- Deviate from YAML structure
```

### Wave Execution:

**Wave N starts when:**
- Previous wave complete OR
- No file conflicts with running agents

**Agent model:** `haiku` (fast, cost-effective for documentation tasks)

**Estimated time per agent:** 15-20 minutes

**Total estimated time:**
- Epic 06: 3 waves × 20 min = 60 minutes
- Epic 07: 4 waves × 20 min = 80 minutes
- **Total: ~2.5 hours**

---

## ✅ Success Criteria

**For each story:**
- ✅ 5 YAML files created in `context/XX.Y/` subdirectory
- ✅ All wireframes mapped in `frontend.yaml`
- ✅ All FRs from story MD included
- ✅ Database schema complete with RLS
- ✅ API endpoints documented
- ✅ Test specifications comprehensive
- ✅ Dependencies correctly identified

**Epic-level:**
- ✅ All 11 stories (Epic 06) have context
- ✅ All 16 stories (Epic 07) have context
- ✅ No missing wireframes
- ✅ Cross-epic dependencies documented
- ✅ Ready for implementation by BACKEND-DEV and FRONTEND-DEV

---

## 📋 Validation Checklist

After all waves complete:

### Epic 06 - Quality
- [ ] 11 subdirectories created (06.1 through 06.11)
- [ ] 55 YAML files total (11 stories × 5 files)
- [ ] All 20 QA wireframes referenced
- [ ] Database schema complete (quality_* tables)
- [ ] API endpoints documented (inspection, holds, NCR, specs)
- [ ] Dependencies on Epic 01, 02, 03, 04 documented

### Epic 07 - Shipping
- [ ] 16 subdirectories created (07.1 through 07.16)
- [ ] 80 YAML files total (16 stories × 5 files)
- [ ] All 22 SHIP wireframes referenced
- [ ] Database schema complete (customers, sales_orders, pick_lists, shipments)
- [ ] API endpoints documented (SO CRUD, allocation, picking, packing, shipping)
- [ ] Dependencies on Epic 01, 02 documented

---

## 🎯 Next Steps After Completion

1. **Review all YAML files** for consistency
2. **Validate wireframe mappings** against UX designs
3. **Cross-check dependencies** between stories
4. **Update PROJECT-STATE.md** with context completion status
5. **Prepare for implementation** - handoff to BACKEND-DEV and FRONTEND-DEV

---

## 📝 Notes

- **Pattern consistency:** All context follows Epic 01 structure
- **No gaps.yaml:** Not required (optional in Epic 01, skip for 06/07)
- **Model choice:** Haiku for speed and cost-efficiency
- **Parallel execution:** Max 4 agents per wave (ORCHESTRATOR limit)
- **Quality over speed:** Each agent should produce comprehensive, accurate YAML
- **Validation:** User reviews plan BEFORE launching agents

---

**Status:** ✅ PLAN READY FOR USER APPROVAL
**Next Action:** User approves → Launch Wave 1 (4 agents in parallel)
