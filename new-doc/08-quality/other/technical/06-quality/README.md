# Quality Module (Epic 06) - Documentation Index

**Last Updated**: 2026-01-22
**Status**: 3/41 Stories Complete + Documented

---

## Overview

This directory contains technical implementation guides for the Quality Module (Epic 06). Each guide provides comprehensive documentation for implementing and using quality management features including specifications, test parameters, and inspection workflows.

---

## Stories Implemented & Documented

### Story 06.3: Product Specifications
**Status**: DEPLOYED (2026-01-22)
**Location**: `06.3-product-specifications-guide.md`
**Lines**: 671
**Tests**: 103 passing

**What It Covers**:
- Versioned product quality specifications with approval workflows
- Status workflow: draft → active → expired/superseded
- Active specification auto-resolution logic
- Specification cloning for new versions
- Review frequency tracking with alerts
- Complete audit trail
- RLS-protected multi-tenant database design
- 10 API endpoints for CRUD operations
- 8 React components for specifications UI
- Role-based access control (QA_INSPECTOR, QA_MANAGER)

**Key Features**:
- Spec numbering: `QS-YYYYMM-NNN` format
- Version tracking with superseding logic
- Review date management and alerts
- Approval workflow with role enforcement
- Immutability on approved specs (must clone to edit)

**Database**:
- `quality_specifications` table (139 migration)
- `get_active_specification()` function
- `supersede_previous_spec()` trigger
- 6 performance indexes
- Complete RLS policies

---

### Story 06.4: Test Parameters
**Status**: DEPLOYED (2026-01-22)
**Location**: `06.4-test-parameters-guide.md`
**Lines**: 651
**Tests**: 181 passing

**What It Covers**:
- Four parameter types: numeric, text, boolean, range
- Drag-to-reorder functionality with optimistic updates
- Critical parameter flagging and visualization
- Test method autocomplete with common methods
- Unit of measure support
- Acceptance criteria and sampling instructions
- Parameter validation per type
- Auto-sequence numbering
- Parameter cloning with spec versioning

**Key Features**:
- Parameter types with type-specific validation
- Numeric: Min/max values with optional target
- Range: Both min and max required
- Text: Manual evaluation criteria
- Boolean: Yes/No target matching
- Drag-to-reorder with @dnd-kit
- Critical parameter indicators (red badges)
- Test method autocomplete with AOAC/ISO methods
- Unit dropdown with common scientific units

**Database**:
- `quality_spec_parameters` table (141 migration)
- `get_next_parameter_sequence()` function
- `reorder_spec_parameters()` function
- `check_spec_draft_status()` trigger
- Complete RLS policies

---

### Story 06.5: Incoming Inspection
**Status**: DEPLOYED (2026-01-22)
**Location**: `06.5-incoming-inspection-guide.md`
**Lines**: 825
**Tests**: 307 passing

**What It Covers**:
- Incoming inspection workflow for GRN goods
- Auto-create inspections on GRN completion
- Manual inspection creation from pending queue
- Inspection workflow: scheduled → in_progress → completed
- Inspector assignment and reassignment
- Test results recording per specification parameter
- Result determination: pass/fail/conditional
- LP QA status update on inspection completion
- Inspection queue dashboard with extensive filters
- Complete audit trail and regulatory compliance

**Key Features**:
- Inspection numbering: `INS-INC-YYYY-NNNNN` format
- Auto-create via trigger on GRN completion
- Inspector assignment with notifications (future)
- Test result summary with suggested results
- LP QA status updates via trigger
- Conditional approval workflow (requires QA_MANAGER)
- Defect counting (major, minor, critical)
- NCR auto-creation option on failure
- Multi-org isolation with RLS
- HACCP/FDA compliance tracking

**Database**:
- `quality_inspections` table (141 migration)
- `inspection_number_sequences` table
- `generate_inspection_number()` function
- `create_incoming_inspection_on_grn()` trigger
- `update_lp_qa_status_on_inspection()` trigger
- Complete RLS policies

---

## Document Structure

Each guide follows this structure:

1. **Overview** - High-level feature summary and key capabilities
2. **Architecture** - Database schema, tables, indexes, functions
3. **API Endpoints** - Complete REST API reference with examples
4. **Service Layer** - TypeScript service class methods and usage
5. **Frontend Implementation** - Pages, components, and UI patterns
6. **Validation Rules** - Field validation and business rule logic
7. **Permission Model** - Role-based access control matrix
8. **Usage Examples** - Step-by-step workflows and common operations
9. **Integration** - How stories work together
10. **Performance** - Performance targets and optimization notes
11. **Testing Summary** - Test coverage and test areas
12. **Migration Information** - Database migration details
13. **Troubleshooting** - Common issues and solutions

---

## Quick Reference Tables

### API Endpoints Summary

**Story 06.3 - Specifications**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/quality/specifications` | List with filters |
| GET | `/api/quality/specifications/:id` | Get detail |
| POST | `/api/quality/specifications` | Create draft |
| PUT | `/api/quality/specifications/:id` | Update draft |
| POST | `/api/quality/specifications/:id/approve` | Approve spec |
| POST | `/api/quality/specifications/:id/clone` | Clone version |
| GET | `/api/quality/specifications/product/:id/active` | Get active spec |
| DELETE | `/api/quality/specifications/:id` | Delete draft |

**Story 06.4 - Parameters**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/quality/specifications/:specId/parameters` | List params |
| POST | `/api/quality/specifications/:specId/parameters` | Add param |
| PUT | `/api/quality/specifications/:specId/parameters/:id` | Update param |
| DELETE | `/api/quality/specifications/:specId/parameters/:id` | Delete param |
| PATCH | `/api/quality/specifications/:specId/parameters/reorder` | Reorder |

**Story 06.5 - Inspections**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/quality/inspections` | List with filters |
| GET | `/api/quality/inspections/:id` | Get detail |
| POST | `/api/quality/inspections` | Create inspection |
| POST | `/api/quality/inspections/:id/assign` | Assign inspector |
| POST | `/api/quality/inspections/:id/start` | Start inspection |
| POST | `/api/quality/inspections/:id/complete` | Complete inspection |
| POST | `/api/quality/inspections/:id/cancel` | Cancel inspection |

---

### Database Tables Summary

| Story | Table | Rows | Key Fields | Indexes |
|-------|-------|------|-----------|---------|
| 06.3 | quality_specifications | per spec | spec_number, version, status, effective_date | 6 |
| 06.4 | quality_spec_parameters | per param | sequence, parameter_type, is_critical | 3 |
| 06.5 | quality_inspections | per inspection | inspection_number, inspection_type, status | 8 |
| 06.5 | inspection_number_sequences | per org/year | current_value | 1 |

---

### Permission Model Summary

| Role | 06.3 Create | 06.3 Approve | 06.4 Add Param | 06.5 Create | 06.5 Assign | 06.5 Complete |
|------|:-----------:|:------------:|:--------------:|:-----------:|:-----------:|:-------------:|
| VIEWER | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| QA_INSPECTOR | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ |
| QA_MANAGER | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Implementation Timeline

```
Story 06.3 - Product Specifications
  └─ P2 Tests (RED) → P3 Backend + Frontend → P4 Refactor → P5 Review → P6 QA → P7 Docs ✓

Story 06.4 - Test Parameters
  └─ P2 Tests (RED) → P3 Backend + Frontend → P4 Refactor → P5 Review → P6 QA → P7 Docs ✓

Story 06.5 - Incoming Inspection
  └─ P2 Tests (RED) → P3 Backend + Frontend → P4 Refactor → P5 Review → P6 QA → P7 Docs ✓
```

**Total Stories Complete**: 3/41 (7%)
**Total Tests**: 591 tests passing
**Total Lines of Code**: ~32 files
**Total Documentation**: 2,147 lines

---

## Integration Flow

```
Epic 05 (Warehouse)
    ↓
    └─→ GRN Completion
        ↓
        └─→ Story 06.5: Incoming Inspection Auto-Create
            ↓
            └─→ Uses Story 06.3: Product Specifications
                ↓
                └─→ Story 06.4: Test Parameters
                    ↓
                    └─→ Story 06.6: Test Results Recording (upcoming)
                        ↓
                        └─→ LP QA Status Update (automatic)
```

---

## Next Steps (Future Stories)

### Phase 1A (Current - Core Quality)
- ✓ 06.0 - Quality Settings
- ✓ 06.1 - Quality Status Types
- ✓ 06.2 - Quality Holds CRUD
- ✓ **06.3 - Product Specifications** (DONE)
- ✓ **06.4 - Test Parameters** (DONE)
- ✓ **06.5 - Incoming Inspection** (DONE)

### Phase 1B (Next - Core Quality Continued)
- [ ] 06.6 - Test Results Recording
- [ ] 06.7 - Sampling Plans AQL
- [ ] 06.8 - Scanner QA Pass/Fail
- [ ] 06.9 - Basic NCR Creation

### Phase 1C (In-Process & Final Inspections)
- [ ] 06.10 - In-Process Inspection
- [ ] 06.11 - Final Inspection & Batch Release
- [ ] 06.12 - Batch Release Approval

### Phase 2+ (Advanced Quality)
- [ ] 06.13+ - NCR Workflow, CAPA, Audits, Analytics, etc.

---

## Related Documentation

### Product Requirements
- `docs/1-BASELINE/product/modules/quality.md` - Quality module PRD

### Architecture
- `docs/1-BASELINE/architecture/modules/quality.md` - Quality architecture
- `docs/1-BASELINE/architecture/decisions/ADR-013-rls-org-isolation-pattern.md` - RLS patterns

### User Guides
- `docs/2-MANAGEMENT/epics/current/06-quality/` - Story specifications

---

## Testing Commands

```bash
# Run all quality module tests
pnpm test -- quality

# Run specific story tests
pnpm test -- spec.test.ts              # 06.3
pnpm test -- parameter.test.ts         # 06.4
pnpm test -- inspection.test.ts        # 06.5

# Run E2E tests
pnpm test:e2e -- quality

# Check test coverage
pnpm test:coverage -- quality
```

---

## Database Commands

```bash
# View quality tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'quality%';

# Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename LIKE 'quality%';

# Verify migrations
SELECT * FROM _migration_logs
WHERE name LIKE '%quality%'
ORDER BY executed_at DESC;
```

---

## File Structure

```
docs/3-TECHNICAL/06-quality/
├── README.md                               (this file)
├── 06.3-product-specifications-guide.md   (671 lines)
├── 06.4-test-parameters-guide.md          (651 lines)
├── 06.5-incoming-inspection-guide.md      (825 lines)
└── integration-guide.md                   (API integration patterns)
```

---

## Deployment Status

| Story | Migration | API | Service | Frontend | Tests | Docs |
|-------|:---------:|:---:|:-------:|:--------:|:-----:|:----:|
| 06.3 | 139 | ✓ | ✓ | ✓ | 103/103 | ✓ |
| 06.4 | 141 | ✓ | ✓ | ✓ | 181/181 | ✓ |
| 06.5 | 141 | ✓ | ✓ | ✓ | 307/307 | ✓ |

**All Stories**: DEPLOYED to production (2026-01-22)

---

## Support & Troubleshooting

See individual story guides for:
- [06.3 Troubleshooting](./06.3-product-specifications-guide.md#troubleshooting)
- [06.4 Troubleshooting](./06.4-test-parameters-guide.md#troubleshooting)
- [06.5 Troubleshooting](./06.5-incoming-inspection-guide.md#troubleshooting)

For issues not covered, consult:
- Architecture documentation
- Related story documentation
- API error responses in guides

---

**Document Status**: COMPLETE
**Deployed**: 2026-01-22 20:46
**Quality Gate**: ALL PASSED
