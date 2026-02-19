# Story 07.8 Context Documentation

## Overview

This directory contains comprehensive YAML and markdown context documentation for **Story 07.8 - Pick List Generation + Wave Picking**.

Story 07.8 is a **Medium (M) complexity, 3-4 day story** that implements core pick list generation functionality for the Shipping Module (Epic 07). It depends on Story 07.7 (Inventory Allocation) and provides functionality to Stories 07.9 and 07.10.

---

## Files in This Directory

### 1. `07.8.pick-list-generation.context.yaml`
**Primary YAML context file** for AI agent consumption.

Contains:
- Story metadata (ID, name, epic, phase, complexity, estimate)
- Complete dependency mapping (blockers, providers, consumers)
- Database schema (pick_lists, pick_list_lines tables with RLS)
- API endpoint specifications (5 endpoints with request/response schemas)
- UX patterns and wireframe mappings (SHIP-012, SHIP-013)
- Validation rules and business rules
- Acceptance checklist (10 criteria)
- Output artifacts and version history

**Used by**: Backend-dev, Frontend-dev agents for implementation

### 2. `07.8.wireframes.md`
**Wireframe mapping and integration guide**.

Contains:
- SHIP-012 (Pick List Management) component breakdown
- SHIP-013 (Wave Picking Wizard) step-by-step workflow
- Responsive layouts (Desktop 7-col, Tablet 5-col, Mobile cards)
- Component implementation checklist
- Data mapping (UI → Database)
- Performance targets and testing coverage
- Accessibility compliance (WCAG AA)

**Used by**: Frontend-dev for UI implementation, QA for testing

### 3. `07.8.acceptance-criteria.md`
**Detailed AC-1 through AC-10 mapping**.

Contains:
- Each AC broken down into:
  - Requirement statement
  - Implementation details (code samples)
  - Test cases (unit, integration, E2E)
  - Deliverables
- Complete test coverage summary (44 test cases total)
- Definition of Done checklist

**Used by**: QA for test case development, Dev for verification

### 4. `README.md` (This File)
Navigation and usage guide.

---

## Context Structure

### Story Metadata
```yaml
story:
  id: "07.8"
  name: "Pick List Generation + Wave Picking"
  epic: "07-shipping"
  phase: "1B"
  complexity: "M"
  estimate_days: 3
```

### Key Dependencies

**Blocking (MUST Complete First):**
- Story 07.7 (Inventory Allocation) - Provides inventory_allocations records

**Required (From Other Epics):**
- Epic 01 (Settings) - Organizations, Users, Roles, RLS
- Epic 05 (Warehouse) - License Plates, Locations, Zone/Aisle/Bin hierarchy
- Epic 02 (Technical) - Products, Allergens

**Provides To:**
- Story 07.9 (Pick Confirmation Desktop)
- Story 07.10 (Pick Confirmation Scanner)
- Story 07.11 (Packing/Shipment Creation)

### Database Tables Created

#### `pick_lists`
- Columns: id, org_id, pick_list_number (PL-YYYY-NNNNN), pick_type, status, priority, assigned_to, wave_id, created_at, created_by, started_at, completed_at
- RLS: Yes (org_id isolation)
- Indexes: (org_id, status), (assigned_to), (org_id, created_at DESC)

#### `pick_list_lines`
- Columns: id, org_id, pick_list_id (FK), sales_order_line_id (FK), license_plate_id, location_id (FK), product_id (FK), lot_number, quantity_to_pick, quantity_picked, pick_sequence, status, picked_license_plate_id, picked_at, picked_by
- RLS: Yes (org_id isolation)
- Indexes: (pick_list_id), (status), (location_id), (pick_list_id, pick_sequence)

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/shipping/pick-lists` | Create from 1+ SOs |
| GET | `/api/shipping/pick-lists` | List with filters |
| GET | `/api/shipping/pick-lists/:id` | Get detail + lines |
| POST | `/api/shipping/pick-lists/:id/assign` | Assign to picker |
| GET | `/api/shipping/pick-lists/:id/lines` | Get pick lines |
| GET | `/api/shipping/pick-lists/my-picks` | Picker view |

---

## Acceptance Criteria Summary

| AC | Title | Key Requirement |
|----|-------|-----------------|
| AC-1 | Auto-Generate Pick List Number | PL-YYYY-NNNNN format, per-org sequence |
| AC-2 | Create from Single SO | pick_type='single_order', generate lines from allocations |
| AC-3 | Location-Based Sequencing | Sort by zone→aisle→bin, assign pick_sequence |
| AC-4 | Wave Picking | Consolidate 2+ SOs by product+location |
| AC-5 | Assign Picker | Update status to 'assigned', filter by role |
| AC-6 | List with Filters | Status, assigned_to, priority, date range, pagination |
| AC-7 | My Picks View | Show only assigned/in_progress, sort by priority |
| AC-8 | Detail View | Group lines by location with summary stats |
| AC-9 | RLS Isolation | org_id filtering, prevent cross-org access |
| AC-10 | Cascade Delete | Delete pick_lists on SO cancel (blocking if in_progress) |

---

## Wireframes

### SHIP-012: Pick List Management
**Location**: `docs/3-ARCHITECTURE/ux/wireframes/SHIP-012-pick-list-list.md`

Defines:
- PickListTable (responsive: 7-col desktop, 5-col tablet, card mobile)
- Status badges (Draft, Assigned, In Progress, Completed, Cancelled)
- Filters (status, assigned_to, date range)
- Search and pagination
- Empty/loading/error states
- Bulk actions (assign, complete, cancel, print)
- AssignPickerModal for operator assignment

### SHIP-013: Wave Picking Wizard
**Location**: `docs/3-ARCHITECTURE/ux/wireframes/SHIP-013-wave-picking.md`

Defines:
- 3-step wizard (Select SOs, Choose strategy, Review consolidation)
- SO selection table with filtering
- Strategy options (Zone-based, Route-based, FIFO)
- Consolidated lines preview with pick sequence
- Summary stats (lines consolidated, total qty, zones)

---

## Implementation Roadmap

### Phase 1: Backend (Day 1-2)
1. Create database migration (pick_lists, pick_list_lines tables)
2. Implement generate_pick_list_number() database function
3. Create PickListService with methods:
   - createPickList() - for single-order and wave
   - sortByLocation() - location hierarchy sorting
   - assignPicker() - assignment workflow
   - getPickLists() - list with filters
   - getMyPicks() - picker view
4. Create API routes (5 endpoints)
5. Add Zod validation schemas
6. Implement RLS policies

### Phase 2: Frontend (Day 2-3)
1. Create PickListTable component (responsive)
2. Create PickLinesTable component (grouped by location)
3. Create AssignPickerModal component
4. Create WavePickingWizard component (3 steps)
5. Create pages:
   - /shipping/pick-lists (list page)
   - /shipping/pick-lists/[id] (detail page)
   - /shipping/pick-lists/my-picks (picker view)
6. Implement filters, search, pagination
7. Add status badges with accessibility

### Phase 3: Testing (Day 3-4)
1. Unit tests (PickListService)
2. Integration tests (API endpoints, RLS)
3. E2E tests (workflows: single-order, wave, assignment, listing)
4. Multi-tenant isolation tests
5. Performance tests

---

## Testing Strategy

### Unit Tests (15-20 tests)
- Auto-number generation (sequence, org isolation, year boundary)
- Location sorting (zone→aisle→bin, alphanumeric)
- Wave consolidation (group by product+location, sum quantities)
- Role-based filtering (Picker, Warehouse, Manager, Admin)

### Integration Tests (15-20 tests)
- API endpoints (create, list, get detail, assign, my-picks)
- RLS policies (org isolation, cross-org blocking)
- Database cascades (ON DELETE CASCADE)
- Status transitions (pending→assigned→in_progress→completed)

### E2E Tests (8-10 tests)
1. Single-order pick list creation workflow
2. Wave picking with 3 SOs and consolidation
3. Assign picker and verify in My Picks
4. View detail with location grouping
5. Picker flow (My Picks → Start → Continue)
6. Cancel SO with pick list (cascade delete)
7. Filter and search functionality
8. Pagination and sorting

### Performance Tests
- Initial load: <400ms (20 pick lists)
- Search: <300ms (debounced)
- Wave creation: <1s (consolidation + sequence)
- Assignment: <500ms (status update + redirect)

---

## Code Examples

### Create Pick List (Single-Order)
```typescript
const response = await fetch('/api/shipping/pick-lists', {
  method: 'POST',
  body: JSON.stringify({
    sales_order_ids: ['uuid-so-1'],
    priority: 'high'
  })
});
// Response: { pick_list_id: '...', pick_list_number: 'PL-2025-00042' }
```

### Create Wave Pick List
```typescript
const response = await fetch('/api/shipping/pick-lists', {
  method: 'POST',
  body: JSON.stringify({
    sales_order_ids: ['uuid-so-1', 'uuid-so-2', 'uuid-so-3'],
    priority: 'normal'
  })
});
// Automatically detected as wave (2+ SOs), consolidates lines by product+location
```

### Assign Picker
```typescript
const response = await fetch('/api/shipping/pick-lists/:id/assign', {
  method: 'POST',
  body: JSON.stringify({
    assigned_to: 'uuid-picker-john-smith'
  })
});
// Status updates to 'assigned', pick appears in "My Picks" view
```

### List with Filters
```typescript
const url = new URL('/api/shipping/pick-lists', baseUrl);
url.searchParams.set('status', 'assigned,in_progress');
url.searchParams.set('assigned_to', 'uuid-john-smith');
url.searchParams.set('priority', 'high');
url.searchParams.set('page', '1');
url.searchParams.set('limit', '20');

const response = await fetch(url);
// Returns { pick_lists: [...], total: 47, page: 1, pages: 3 }
```

---

## Quality Checklist

Before development starts:

- [x] Story ID and name verified (07.8 - Pick List Generation + Wave Picking)
- [x] Dependencies mapped (07.7 blocker, 07.9/07.10 consumers)
- [x] Database schema defined (pick_lists, pick_list_lines tables)
- [x] API endpoints specified (5 endpoints with schemas)
- [x] Wireframes mapped (SHIP-012, SHIP-013)
- [x] Acceptance criteria detailed (10 ACs with test cases)
- [x] Validation rules documented (Zod schemas)
- [x] RLS policies planned (org_id isolation)
- [x] Test strategy defined (44 test cases total)
- [x] Performance targets set (<400ms load, <1s wave)
- [x] Accessibility verified (WCAG AA compliant badges/filters)
- [x] Complexity assessed (M = 3-4 days)

---

## Links to Related Documents

**PRD & Architecture:**
- PRD: `docs/1-BASELINE/product/modules/shipping.md` (FR-7.21, 7.22, 7.23)
- Architecture: `docs/1-BASELINE/architecture/modules/shipping.md`

**Related Stories:**
- Story 07.7 (Inventory Allocation): `07.7.inventory-allocation.md` [BLOCKER]
- Story 07.9 (Pick Confirmation Desktop): `07.9.pick-confirmation-desktop.md`
- Story 07.10 (Pick Confirmation Scanner): `07.10.pick-scanner.md`

**Wireframes:**
- SHIP-012 (Pick List Management): `docs/3-ARCHITECTURE/ux/wireframes/SHIP-012-pick-list-list.md`
- SHIP-013 (Wave Picking): `docs/3-ARCHITECTURE/ux/wireframes/SHIP-013-wave-picking.md`

**Patterns & Standards:**
- Multi-tenancy: `docs/1-BASELINE/architecture/patterns/multi-tenancy.md`
- RLS: `docs/1-BASELINE/architecture/patterns/rls-isolation.md`

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-18 | Initial context creation | TECH-WRITER |

---

## How to Use This Documentation

### For Backend Developers
1. Read `07.8.pick-list-generation.context.yaml` (primary source)
2. Review `07.8.acceptance-criteria.md` for AC implementation details
3. Implement database schema and API endpoints
4. Create unit/integration tests

### For Frontend Developers
1. Read wireframes (SHIP-012, SHIP-013)
2. Review `07.8.wireframes.md` for component mapping
3. Read `07.8.acceptance-criteria.md` for AC-6, AC-7, AC-8
4. Implement responsive components
5. Create E2E tests

### For QA / Test Engineers
1. Read `07.8.acceptance-criteria.md` (all ACs)
2. Review wireframes for UI testing points
3. Create test cases (unit, integration, E2E)
4. Validate multi-tenant isolation (AC-9)
5. Verify cascade delete (AC-10)

### For Code Reviewers
1. Verify against AC checklist
2. Check RLS policies (AC-9)
3. Validate API request/response schemas
4. Review test coverage (target >80% for services)
5. Confirm performance targets met

---

**Story 07.8 is READY FOR IMPLEMENTATION**

All context documented, wireframes defined, acceptance criteria detailed, and dependencies mapped.

**Next Steps:**
1. Create database migration
2. Implement PickListService
3. Create API routes
4. Build frontend components
5. Write tests
6. Code review
7. Merge to main

---
