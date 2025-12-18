# Story 06.10 - In-Process Inspection: YAML Context Generation Complete

**Generated**: 2025-12-18
**Story ID**: 06.10
**Story Name**: In-Process Inspection
**Status**: Ready for Implementation
**Complexity**: L (Large, 5-8 days)
**Phase**: 2 (In-Process & Final)

---

## Deliverables Created

All 5 context files have been successfully generated in:
`docs/2-MANAGEMENT/epics/current/06-quality/context/06.10/`

### 1. _index.yaml (Entry Point)
**Purpose**: Story metadata, dependencies, and overview. Read this first.

**Contains**:
- Story metadata (id, name, phase, complexity, estimate)
- Complete dependency graph (required, blocked_by, blocks)
- 12 high-level deliverables (migrations, triggers, services, API endpoints, components, pages, tests)
- 12 technical notes (inspection types, workflow, numbering, RLS patterns)
- 13 key business rules (WO prerequisites, operation linkage, auto-create, QA propagation, blocking logic)
- Comprehensive context summary

**Key Dependencies**:
- Story 06.5 (Incoming Inspection) - provides quality_inspections table and patterns
- Epic 04 (Production) - provides wo_operations table and operation status lifecycle
- Stories 04.2a, 04.3 - provide WO start and operation completion triggers
- Stories 03.10, 03.12 - provide work_orders and wo_operations tables

---

### 2. database.yaml (Database Schema & Migrations)

**Tables Reused**:
- `quality_inspections` - Extended with `wo_id` and `wo_operation_id` columns

**Tables Modified**:
- `wo_operations` - Added `qa_status` and `qa_inspection_id` columns (from Epic 04)
- `routing_operations` - Added `requires_quality_check` and `is_critical` boolean flags
- `quality_settings` - Added 3 new configuration columns

**Migrations** (4 total):
1. Add wo_id, wo_operation_id to quality_inspections + indexes
2. Add qa_status, qa_inspection_id to wo_operations
3. Add quality_check flags to routing_operations
4. Add in-process settings to quality_settings

**Triggers & Functions** (2 critical):
1. `create_inprocess_inspection_on_operation_complete()` - Auto-creates inspection when operation completes
2. `update_wo_operation_qa_on_inspection()` - Updates wo_operation.qa_status when inspection completes

**Performance Indexes** (6 total):
- `idx_inspections_wo` - Fast lookup by work order
- `idx_inspections_wo_operation` - Fast lookup by operation
- `idx_inspections_wo_type` - Fast in-process query for WO
- `idx_inspections_wo_pending` - Pending in-process for operation blocking logic
- `idx_wo_operations_qa_status` - Fast QA status lookups
- `idx_inspections_inprocess_pending` - In-process queue performance

**RLS Policies**: Org isolation on quality_inspections table (prevents cross-tenant access)

---

### 3. api.yaml (API Endpoints & Service Layer)

**8 Key Endpoints**:
1. `GET /api/quality/inspections/in-process` - List with WO/operation/status filters
2. `GET /api/quality/inspections/wo/:woId` - All inspections for WO with quality summary
3. `GET /api/quality/inspections/operation/:operationId` - Inspection for specific operation with context
4. `POST /api/quality/inspections` - Create in-process inspection (validates WO, operation, auto-fills from WO)
5. `POST /api/quality/inspections/:id/start` - Start inspection (validates status, inspector assigned)
6. `POST /api/quality/inspections/:id/complete` - Complete with result determination and WO update
7. `POST /api/quality/inspections/:id/assign` - Assign/reassign inspector
8. `GET /api/quality/inspections/:id` - Inspection detail with full WO/operation context

**InProcessInspectionService** (extends InspectionService):
- `listInProcess()` - WO/operation filtered list
- `getByWorkOrder()` - WO inspections with quality summary
- `getByOperation()` - Operation inspection detail with context
- `createInProcess()` - Create with WO validation and auto-fill
- `completeInProcess()` - Complete with wo_operation update and production notification
- `updateOperationQAStatus()` - Sync inspection result to operation QA status
- `canStartNextOperation()` - Check if next operation can start (blocking logic)
- `getWOQualitySummary()` - Overall WO quality status
- `notifyProductionOnCompletion()` - Send notifications to production team

**Validation Schemas** (3 Zod schemas):
- `createInProcessInspectionSchema` - Validates WO, operation, optional spec, priority, notes
- `completeInProcessInspectionSchema` - Validates result, defect counts, conditional fields
- `inProcessListQuerySchema` - Validates all query parameters with proper defaults

**Performance Targets**:
- In-process list: < 500ms (500 inspections with pagination)
- WO inspections: < 300ms (WO with 10 operations)
- Create/Complete: < 300ms (including validation and triggers)
- WO operation update: < 100ms (synchronous database trigger)

---

### 4. frontend.yaml (UI Components & Pages)

**3 Main Pages**:
1. `/quality/inspections/in-process` - In-process inspection queue with filters/search
2. `/quality/inspections/wo/[woId]` - All inspections for WO grouped by operation
3. `/quality/inspections/[id]` - Inspection detail with WO/operation context

**12 Key Components**:
1. `InProcessInspectionDataTable` - ShadCN DataTable with WO, operation, inspector columns
2. `InProcessFilters` - Filter panel (WO, operation, status, priority, product, date range)
3. `WOContextPanel` - Displays WO info (number, status, product, batch) and operation details
4. `OperationQATimeline` - Vertical timeline showing all WO operations with QA status
5. `OperationQABadge` - Color-coded badge (pending=yellow, passed=green, failed=red)
6. `OperationContextCard` - Operation details (sequence, name, machine, timing, operator)
7. `InProcessInspectionDetail` - Main detail view container with all sections
8. `CreateInProcessModal` - Form with WO selector, operation selector, spec, priority, notes
9. `WOOperationSelector` - Dependent dropdowns (WO -> filtered operations)
10. `QAResultImpactAlert` - Shows production impact of pass/fail (for QA Manager override)
11. `NextOperationBlockedAlert` - Warning when previous QA failed
12. `WOQualitySummaryCard` - Overall WO quality status (X/Y passed, overall status badge)

**7 Custom Hooks**:
- `useInProcessInspections()` - List with filters and pagination (React Query caching)
- `useWOInspections()` - All inspections for WO with summary
- `useInspectionDetail()` - Single inspection with full context
- `useStartInspection()` - Start mutation
- `useCompleteInspection()` - Complete mutation
- `useAssignInspector()` - Assign mutation
- `useCreateInProcessInspection()` - Create mutation

**Type Definitions**:
- `InProcessInspection` - Extends QualityInspection with WO/operation fields
- `WOInspectionsResponse` - WO + inspections array + summary
- `InProcessListParams` - All query parameter filters
- Multiple other supporting types

**UX Patterns**:
- WO context always visible on detail pages
- Operation timeline for visual progress tracking
- Result impact preview before confirmation
- Auto-fill from WO to reduce data entry
- Production team integration with quick action links

---

### 5. tests.yaml (Acceptance Criteria & Test Specifications)

**10 Acceptance Criteria Categories** (detailed Gherkin scenarios):
1. AC-1: Auto-create on operation completion (with setting toggles)
2. AC-2: Manual creation with WO/operation selection and validation
3. AC-3: Queue with filters, search, pagination (< 500ms performance)
4. AC-4: Detail page with WO and operation context
5. AC-5: Start inspection workflow (status transitions, WO checks)
6. AC-6: Complete inspection with production impact (pass/fail/conditional)
7. AC-7: WO operation QA status integration and next operation blocking
8. AC-8: Multi-operation view (grouped by sequence, quality summary)
9. AC-9: RLS enforcement (org isolation, 404 for cross-tenant)
10. AC-10: Performance requirements (500ms list, 300ms detail)

**Unit Tests** (InProcessInspectionService):
- createInProcess - 8 test cases
- completeInProcess - 6 test cases
- canStartNextOperation - 5 test cases
- getWOQualitySummary - 4 test cases
- operationRequiresInspection - 3 test cases
- **Coverage target: > 85%**

**Integration Tests** (API endpoints):
- GET /api/quality/inspections/in-process - 5 tests
- GET /api/quality/inspections/wo/:woId - 3 tests
- POST /api/quality/inspections - 5 tests
- POST /api/quality/inspections/:id/complete - 5 tests
- **Coverage target: > 80%**

**E2E Tests** (5 complete workflows):
1. Create -> Assign -> Start -> Record -> Complete -> Verify WO update
2. Fail inspection and verify operation blocking
3. WO quality summary updates
4. View/navigate inspections from WO detail
5. Auto-create on operation completion

**Test Data & Fixtures**:
- WO with 3 sequential operations (Mixing, Cooking, Packing)
- Product with specification and test parameters
- Quality settings enabling auto-create and operation blocking

**Critical Paths** (> 95% coverage):
- Auto-create inspection on operation completion
- WO operation QA status update
- Next operation blocking logic
- Production notification sending
- Result determination logic

---

## How to Use These Context Files

### For Developers (Implementing the Story)

**Recommended Reading Order**:
1. Start with `_index.yaml` - Overview and dependencies
2. Read story markdown: `docs/2-MANAGEMENT/epics/current/06-quality/06.10.in-process-inspection.md`
3. Review PRD sections: `docs/1-BASELINE/product/modules/quality.md` (FR-QA-006, Section 9.2)
4. Study architecture: `docs/1-BASELINE/architecture/modules/quality.md`
5. Reference wireframes: `docs/3-ARCHITECTURE/ux/wireframes/QA-006-in-process-inspection.md`

**Then dive into context by layer**:
- Database: `database.yaml` - Create migrations and triggers
- API: `api.yaml` - Implement endpoints and service layer
- Frontend: `frontend.yaml` - Build pages and components
- Tests: `tests.yaml` - Write test cases

### For Architects/Reviewers

- `_index.yaml` - Full dependency graph and deliverables checklist
- `database.yaml` - Schema design and RLS patterns
- `api.yaml` - Service layer design and performance contracts
- `tests.yaml` - Acceptance criteria and coverage targets

### For Project Managers

- `_index.yaml` - Estimate (5-8 days, L complexity), dependencies, deliverables
- `tests.yaml` - Acceptance criteria and definition of done
- Database, API, Frontend, Tests files - Detailed implementation checklist

---

## Key Integration Points

### Production Module (Epic 04) Integration
- Triggered by: WO operation completion (04.3)
- Updates: wo_operations.qa_status and qa_inspection_id
- Blocks: Next operation start if QA failed (04.3 operation-service check)
- Notifications: Production operator/lead on inspection completion

### Quality Module (Story 06.5+) Integration
- Extends: quality_inspections table and inspection patterns (06.5)
- Uses: quality_specifications and quality_spec_parameters (06.3, 06.4)
- Feeds: Test results recording (06.6), Final inspection patterns (06.11)
- Triggers: NCR creation on failure (06.9), Batch release gate (06.12)
- Provides: Inspection context for quality alerts (06.17)

### Warehouse Module (Epic 05) Integration
- No direct integration (warehouse focuses on license plates, not operations)
- Note: Operation failures block next op, not warehouse consumption

---

## Validation Checklist

All context files have been validated against:
- ✅ Story markdown (06.10.in-process-inspection.md)
- ✅ PRD (quality.md FR-QA-006 + Section 9.2)
- ✅ Architecture (quality module architecture)
- ✅ Wireframes (QA-006-in-process-inspection.md)
- ✅ Pattern from 06.5 (Incoming Inspection context structure)
- ✅ Database schema consistency with existing tables
- ✅ API endpoint naming conventions
- ✅ RLS policy patterns (ADR-013)
- ✅ Frontend component patterns (ShadCN, React Query, Zod)
- ✅ Test coverage requirements (>80%)

---

## Next Steps

1. **Review Context Files**: Share with development team for questions/clarifications
2. **Create Migrations**: Convert database.yaml to SQL migration files
3. **Implement API**: Build endpoints and InProcessInspectionService
4. **Build Frontend**: Create pages and components from frontend.yaml
5. **Write Tests**: Use tests.yaml acceptance criteria for test cases
6. **Code Review**: Ensure deliverables match acceptance criteria
7. **Testing**: Run full E2E workflow before merging to main

---

## Files Created

```
docs/2-MANAGEMENT/epics/current/06-quality/context/06.10/
├── _index.yaml           (2,000 lines) - Entry point, dependencies, overview
├── database.yaml         (800 lines)   - Migrations, triggers, indexes, RLS
├── api.yaml              (600 lines)   - Endpoints, service layer, schemas
├── frontend.yaml         (500 lines)   - Pages, components, hooks, types
└── tests.yaml            (450 lines)   - Acceptance criteria, test specs, coverage
```

**Total**: 4,350 lines of structured implementation context

---

**Status**: All 5 context files complete and ready for implementation.
**Generated by**: TECH-WRITER Agent
**Date**: 2025-12-18
