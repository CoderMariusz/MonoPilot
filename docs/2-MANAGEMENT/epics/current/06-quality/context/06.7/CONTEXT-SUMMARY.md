# Story 06.7 Context Summary
## Sampling Plans (AQL) - Quality Module

**Created**: 2025-12-17
**Story**: 06.7 - Sampling Plans (AQL-Based)
**Epic**: 06 - Quality Management
**Phase**: 1B (In-Process & Final Inspections)
**Complexity**: Medium (3-4 days)
**Status**: Ready for Development

---

## Quick Reference

### What This Story Does
Implements AQL-based statistical acceptance sampling (ISO 2859-1 / ANSI Z1.4) for quality inspections. Allows QA managers to define sampling plans by lot size range and AQL level, with automatic sample size, acceptance, and rejection number lookups from ISO standard tables.

### Key Features (MVP)
- Sampling plan CRUD with AQL configuration (Levels I, II, III)
- ISO 2859 sample size reference table (15 lot size ranges)
- Auto-detection of applicable plan during inspection
- Sample recording with progress tracking
- Lot decision logic (accept/reject/review)
- Auto-hold on rejected lots
- Optional NCR creation on rejection

### Tech Stack
- **Backend**: Supabase (PostgreSQL + RLS)
- **Frontend**: Next.js 15.5 + React 19 + TailwindCSS + ShadCN UI
- **Database**: 3 tables (sampling_plans, sampling_records, iso_2859_reference)
- **API**: 8 REST endpoints
- **Validation**: Zod schemas
- **Testing**: Vitest (unit) + Playwright (E2E)

---

## File Structure (5 YAML Files)

```
docs/2-MANAGEMENT/epics/current/06-quality/context/06.7/
├── _index.yaml                 # Story metadata, dependencies, overview
├── database.yaml               # Tables, RLS, seed data (ISO 2859)
├── api.yaml                    # REST endpoints, validation, services
├── frontend.yaml               # Components, pages, services, types
├── tests.yaml                  # Acceptance criteria, unit/integration/E2E tests
└── CONTEXT-SUMMARY.md          # This file - quick reference
```

---

## Database Schema

### sampling_plans Table
- **Purpose**: Define AQL-based sampling plans
- **Columns**: org_id, name, inspection_type, aql_level, lot_size_min/max, sample_size, acceptance_number, rejection_number, is_active
- **Key Constraint**: UNIQUE(org_id, name), lot_size_min < lot_size_max, acceptance_number < rejection_number
- **RLS**: org_id isolation (ADR-013 pattern)
- **Indexes**: org_id, inspection_type, product_id, lot_range, is_active

### sampling_records Table
- **Purpose**: Track individual samples during inspection
- **Columns**: org_id, plan_id, inspection_id, sample_identifier, location_description, sampled_by, sampled_at, notes
- **Key Constraint**: UNIQUE(inspection_id, sample_identifier)
- **RLS**: org_id isolation, immutable after inspection complete
- **Indexes**: org_id, plan_id, inspection_id, sampled_at

### iso_2859_reference Table (Seed)
- **Purpose**: Read-only lookup table for AQL calculations
- **Data**: 15 lot size ranges (2-8 to 500001+) with sample sizes and Ac/Re numbers for each AQL level
- **Format**: JSONB for Ac/Re pairs per AQL level
- **No RLS**: Public data, not organization-specific
- **Immutable**: Static reference data

---

## API Endpoints (8 Total)

### Sampling Plans
1. **GET /api/quality/sampling-plans** - List (paginated, filtered)
2. **POST /api/quality/sampling-plans** - Create new plan
3. **GET /api/quality/sampling-plans/:id** - Get detail
4. **PUT /api/quality/sampling-plans/:id** - Update plan
5. **DELETE /api/quality/sampling-plans/:id** - Soft delete
6. **GET /api/quality/sampling-plans/suggest** - Auto-suggest for inspection

### Sampling Records
7. **POST /api/quality/sampling-records** - Record sample
8. **GET /api/quality/sampling-records/inspection/:id** - List samples

### Bonus
- **GET /api/quality/iso-2859-reference** - ISO table (public, no RLS)

---

## Key Components

### Pages
- **/quality/sampling-plans** - List page with search, filters, pagination
- **/quality/sampling-plans/:id** - Create/edit form

### Components
1. **SamplingPlansList** - Data table with row actions
2. **SamplingPlanForm** - Modal form for create/edit
3. **ISO2859TableModal** - Interactive reference table with auto-fill
4. **SamplingPlanSelector** - Dropdown for inspection form
5. **SampleRecordingForm** - Modal for recording samples
6. **SamplesList** - List of recorded samples
7. **SamplingProgressBar** - Progress indicator
8. **SamplingDecisionPanel** - Accept/reject summary

---

## Workflow (End-to-End)

```
1. QA Manager creates Sampling Plan
   └─ Name: "Incoming Flour AQL 2.5"
   └─ Type: incoming
   └─ Lot Size: 50-500 units
   └─ AQL: Level II, 2.5
   └─ System auto-fills: sample_size=13, Ac=1, Re=2 (ISO 2859 lookup)

2. Inspector starts Incoming Inspection
   └─ Lot size: 250 units (matches plan range 50-500)
   └─ System auto-detects plan
   └─ Sampling section shows:
      - Plan: "Incoming Flour AQL 2.5"
      - Required samples: 13
      - Accept if: ≤1 defect
      - Reject if: ≥2 defects

3. Inspector records 13 samples
   └─ Click [+ Record Sample] for each
   └─ Auto-generated IDs: S-001, S-002, ..., S-013
   └─ Track result (pass/fail) and location
   └─ Real-time defect counter

4. System auto-calculates decision
   ├─ 1 defect found: 1 <= 1 → ACCEPT lot
   ├─ 2 defects found: 2 >= 2 → REJECT lot
   └─ 2 defects found: 1 < 2 < 2 → REVIEW (manual decision)

5. On rejection
   └─ Quality hold auto-created
   └─ Inspector can create NCR (checkbox)
   └─ QA Manager notified
   └─ Supplier quality rating updated
```

---

## Validation Rules

### Plan Creation
- Plan name: 3-200 chars, unique per org
- Inspection type: incoming | in_process | final
- AQL level: I | II | III (General Inspection Levels)
- Lot size: min < max
- Acceptance/Rejection: acceptance < rejection
- Sample size: > 0 and <= lot_size_max

### Sample Recording
- Sample identifier: Auto-generated (S-001, S-002, etc.)
- Location: Required, max 500 chars
- Result: pass | fail (required)
- Defect type: Required if result='fail'
- Notes: Optional, max 1000 chars

### Lot Decision
- Accept: defects_found <= acceptance_number
- Reject: defects_found >= rejection_number
- Review: acceptance_number < defects < rejection_number

---

## Testing Strategy

### Unit Tests (>90% coverage)
- SamplingPlanService: CRUD, validation, uniqueness
- ISO2859Service: Table lookups, AQL calculations
- SamplingRecordService: Sample creation, decision logic

### Integration Tests
- All 8 API endpoints
- RLS policy enforcement
- Permission checks (role-based access)
- Cross-org data isolation

### E2E Tests (Playwright)
1. **Creation Flow**: Create plan, use ISO 2859 helper, verify auto-fill
2. **Recording Flow**: Record 13 samples, verify progress, auto-calculate decision
3. **Rejection Flow**: Reject lot, create hold and NCR, verify notifications

### Performance Targets
- Plan list: <1s (50+ plans)
- Sample save: <500ms
- Search/filter: <300ms
- ISO table lookup: <100ms

---

## Phase 2+ Deferred Features (Hidden in MVP)

- Special Inspection Levels (S-1 to S-4) for small sample sizes
- Switching Rules (Normal/Tightened/Reduced based on history)
- Double/Multiple sampling types (sequential decision-making)
- Sample Location Stratification (top/middle/bottom)
- Plan Templates (reusable by product category)
- Effectiveness analytics (historical trend analysis)

**Implementation Note**: These features are hidden in UI (disabled buttons with tooltips) and return 501 Not Implemented in API.

---

## Dependencies

### Required Stories
- **06.3 Product Specifications**: sampling_plans linked to specs
- **01.1 Org Context + Base RLS**: RLS patterns and org_id context

### Blocks (Downstream)
- **06.5 Incoming Inspection**: Sampling plans used in inspection form
- **06.6 In-Process Inspection**: Sampling plans available
- **06.8 Final Inspection**: Sampling plans available

---

## Key Decisions

1. **ISO 2859 Table in Seed**: Pre-loaded static data, not dynamic lookup
2. **RLS Pattern**: ADR-013 (users table lookup for org_id)
3. **Soft Delete**: Plans marked inactive, preserved for historical audits
4. **Immutable Samples**: Records locked after inspection complete
5. **Auto-Detection**: System suggests plan based on product + type + lot size
6. **AQL-Based Only in MVP**: Random/Systematic/Custom deferred to Phase 2

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| ISO 2859 table accuracy | Pre-load from standard reference, unit test all values |
| Plan deletion orphans inspections | Check references before delete, show warning |
| Cross-org data leakage | Strict RLS on all queries, test isolation |
| Performance with large plans | Index on org_id + inspection_type + is_active |
| User confusion on AQL levels | In-form help text explaining I/II/III, ISO table modal |

---

## Quick Commands (Development)

```bash
# Read the full story markdown
cat docs/2-MANAGEMENT/epics/current/06-quality/06.7.sampling-plans-aql.md

# View wireframes
cat docs/3-ARCHITECTURE/ux/wireframes/QA-008-sampling-plans.md

# Read PRD section
grep -A 50 "FR-QA-008" docs/1-BASELINE/product/modules/quality.md

# Read architecture
grep -A 50 "sampling_plans table" docs/1-BASELINE/architecture/modules/quality.md

# Read template example (Settings module)
ls -la docs/2-MANAGEMENT/epics/current/01-settings/context/01.13/
```

---

## Files Map

| File | Purpose | Audience |
|------|---------|----------|
| `_index.yaml` | Story overview + dependencies | Everyone (start here) |
| `database.yaml` | Tables, RLS, schema | Backend developers, DBAs |
| `api.yaml` | Endpoints, validation, types | Backend + Frontend developers |
| `frontend.yaml` | Components, pages, UX | Frontend developers |
| `tests.yaml` | Acceptance criteria, test specs | QA, All developers |

---

## Handoff Notes

### For Backend Developers
1. Create 3 migrations (sampling_plans, sampling_records, iso_2859_reference seed)
2. Implement 8 API endpoints with validation
3. Create 2 services (SamplingPlanService, ISO2859Service)
4. Write unit tests for services (>90% coverage)
5. Implement integration tests for all endpoints
6. Ensure RLS policies enforced (org_id isolation)

### For Frontend Developers
1. Build 8 components (list, form, modal, selector, record form, etc.)
2. Create 2 pages (list, detail/edit)
3. Implement form validation (Zod schemas)
4. Wire up API calls with React Query (useQuery, useMutation)
5. Add E2E tests for 3 workflows
6. Responsive design (desktop/tablet/mobile)

### For QA
1. Test all 9 acceptance criteria
2. Verify RLS enforcement (cross-org isolation)
3. Test permission checks (role-based)
4. Run E2E workflows in staging
5. Load test (50+ plans)
6. Mobile testing (sample recording on tablet/phone)

---

## Related Documents

- **Full Story MD**: `docs/2-MANAGEMENT/epics/current/06-quality/06.7.sampling-plans-aql.md`
- **Wireframes**: `docs/3-ARCHITECTURE/ux/wireframes/QA-008-sampling-plans.md`
- **PRD**: `docs/1-BASELINE/product/modules/quality.md` (Section 12)
- **Architecture**: `docs/1-BASELINE/architecture/modules/quality.md`
- **ADR-013**: RLS Pattern (ADR-013-rls-org-isolation-pattern.md)

---

## Success Criteria (Story Complete When)

- [ ] All 3 migrations applied and tested
- [ ] 8 API endpoints implemented and passing integration tests
- [ ] All 9 acceptance criteria pass
- [ ] RLS policies enforce org_id isolation
- [ ] Permission checks block unauthorized access
- [ ] Unit tests >90% coverage
- [ ] E2E tests pass for 3 workflows
- [ ] Performance targets met (<1s list, <500ms save)
- [ ] Code review approved
- [ ] Deployed to staging environment
- [ ] QA sign-off completed

---

**Generated by**: Claude (TECH-WRITER role)
**Context Status**: Ready for Development
**Last Updated**: 2025-12-17
