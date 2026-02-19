# Quality Module (Epic 06) - Documentation Analysis

**Date Generated**: 2026-02-16
**Total Files Analyzed**: 285 files
**Markdown Files**: 62
**YAML Files**: 223

---

## 1. INVENTORY: All Documentation Files

### A. Core Documents (10 files)

| File | Summary |
|------|---------|
| `prd/quality.md` | 300+ lines PRD with 26 functional requirements (FR-QA-001 to FR-QA-026), NFRs, database schema, API endpoints, phases |
| `stories/06.0.epic-overview.md` | Epic context, food safety compliance rationale, phase strategy (Phase 1-4) |
| `stories/IMPLEMENTATION-ROADMAP.yaml` | 41 stories across 4 phases, completion %, timeline, story lists (Phase 1: 10/10 complete) |
| `stories/implementation-plan.md` | Phase breakdown table format, delivery estimates, scope summaries |
| `stories/EPIC-06-STATUS-UPDATE.md` | Status snapshot (29% implemented, 12/41 stories complete) |
| `decisions/quality-arch.md` | Architecture overview, core tables, RLS patterns, entity relationships |
| `other/technical/06-quality/README.md` | Technical implementation guide index for deployed stories (06.3, 06.4, 06.5 documented) |

### B. Story Files (41 stories + context files)

#### Main Story Documents (41 files)
```
stories/06.0.quality-settings.md             - Quality module configuration
stories/06.0.quality-settings.md             - DUPLICATE (see inconsistencies below)
stories/06.1.quality-status-types.md         - 7 QA statuses (PENDING, PASSED, FAILED, HOLD, RELEASED, QUARANTINED, COND_APPROVED)
stories/06.2.quality-holds-crud.md           - Inventory blocking system
stories/06.3.product-specifications.md       - Versioned specifications with approval workflow
stories/06.4.test-parameters.md              - Test parameter definitions
stories/06.5.incoming-inspection.md          - GRN quality verification
stories/06.6.test-results-recording.md       - Test data capture
stories/06.7.sampling-plans-aql.md           - AQL statistical sampling
stories/06.8.scanner-qa-pass-fail.md         - Mobile QA workflows
stories/06.9.basic-ncr-creation.md           - Non-conformance report creation
stories/06.10.in-process-inspection.md       - WIP quality verification
stories/06.11.final-inspection-batch-release.md - Finished product QA
stories/06.12.batch-release-approval.md      - Batch release gate
stories/06.13.ncr-workflow.md                - NCR state machine
stories/06.14.ncr-root-cause-analysis.md     - RCA for NCRs
stories/06.15.ncr-corrective-action.md       - Corrective actions
stories/06.16.ncr-verification-close.md      - NCR verification
stories/06.17.quality-alerts-notifications.md - Quality event notifications
stories/06.18.test-result-trending-charts.md - Analytics and trending
stories/06.21.haccp-plan-setup.md            - HACCP plan creation
stories/06.22.ccp-definition.md              - Critical Control Point definition
stories/06.23.ccp-monitoring-desktop.md      - CCP monitoring UI (desktop)
stories/06.24.ccp-monitoring-scanner.md      - CCP monitoring UI (mobile)
stories/06.25.ccp-deviation-handling.md      - CCP deviation response
stories/06.26.ccp-deviation-alerts.md        - CCP deviation alerts
stories/06.27.coa-templates.md               - Certificate of Analysis templates
stories/06.28.coa-generation-engine.md       - CoA generation logic
stories/06.29.coa-pdf-export.md              - CoA PDF output
stories/06.30.haccp-verification-records.md  - HACCP verification
stories/06.31.capa-creation.md               - Corrective/Preventive Actions
stories/06.32.capa-action-items.md           - CAPA action tracking
stories/06.33.capa-effectiveness-check.md    - CAPA effectiveness verification
stories/06.34.supplier-quality-ratings.md    - Supplier scoring
stories/06.35.supplier-audits-crud.md        - Supplier audit management
stories/06.36.supplier-audit-findings.md     - Audit findings tracking
stories/06.37.quality-dashboard.md           - QA KPI dashboard
stories/06.38.audit-trail-reports.md         - Audit trail and reports
stories/06.39.quality-analytics.md           - Advanced analytics
stories/06.40.document-control-versioning.md - Document version control
```

#### Story Context Files (200+ YAML files)
- **Pattern**: `stories/context/{story-id}/_index.yaml` (metadata, dependencies)
- **Per-story sub-files**: `api.yaml`, `database.yaml`, `frontend.yaml`, `tests.yaml`
- **Special cases**: 06.6 has additional `gaps.yaml`, `validation.yaml`
- **Coverage**: Stories 06.1-06.18, 06.22-06.40 have context folders

### C. Checkpoint Files (13 files)

| File | Summary |
|------|---------|
| `other/checkpoints/06.0.yaml` - `06.12.yaml` | Progression logs showing P1-P7 completions, agents, decisions |

### D. API Documentation (5 files)

| File | Summary |
|------|---------|
| `api/quality-settings-api.md` | GET/PUT endpoints for org-level settings (status 200 examples) |
| `api/in-process-inspections.md` | Inspection list/detail/create endpoints with query parameters |
| `api/batch-release.md` | Batch release approval workflow API (not fully read but present) |
| `api/ncr.md` | NCR CRUD and workflow endpoints (not fully read but present) |
| `api/scanner-qa.md` | Scanner inspection endpoints (QuickInspectionInput, response models) |

### E. Workflow Guides (9 files)

| File | Summary |
|------|---------|
| `guides/quality-settings-configuration.md` | Configuration examples (Food Safety Startup, Pharma, etc.) with cURL examples |
| `guides/quality-settings-admin-guide.md` | Admin user manual for settings UI (permissions table, section walkthroughs) |
| `guides/quality-settings-components.md` | React component usage (QualitySettingsForm, sub-sections) |
| `guides/in-process-inspection-workflow.md` | Step-by-step inspector workflow for WIP inspections |
| `guides/batch-release-workflow.md` | Batch release decision tree and approval process |
| `guides/ncr-workflow.md` | NCR lifecycle workflow (not fully read) |
| `guides/scanner-qa-workflow.md` | Mobile scanner QA workflow with role/permission table |
| `guides/fda-labeling-compliance.md` | FDA labeling requirements and implementation (not fully read) |

### F. UX/Wireframes (26 files)

| File | Summary |
|------|---------|
| `ux/QA-001-dashboard.md` | Quality dashboard with 8 KPI cards, critical alerts section |
| `ux/QA-002-holds-list.md` | Quality holds list with filters and bulk actions |
| `ux/QA-003-specification-modal.md` | Create/edit specification modal (3-step wizard) |
| `ux/QA-003-specifications-list.md` | **DUPLICATE** - Specifications list table (see inconsistencies) |
| `ux/QA-004-test-templates.md` | Test parameter templates |
| `ux/QA-005-incoming-inspection.md` | Incoming inspection workflow (GRN to QA result) |
| `ux/QA-006-in-process-inspection.md` | In-process inspection during work order |
| `ux/QA-007-final-inspection-part1.md` | Final inspection initial form |
| `ux/QA-007-final-inspection-part2.md` | **SPLIT FILE** - Final inspection continuation (see inconsistencies) |
| `ux/QA-008-sampling-plans.md` | AQL sampling plan configuration |
| `ux/QA-009-ncr-detail.md` | NCR detail view with workflow state |
| `ux/QA-009-ncr-list.md` | **DUPLICATE NAME** - NCR list (see inconsistencies) |
| `ux/QA-010-batch-release.md` | Batch release approval modal |
| `ux/QA-011-coa-list.md` | Certificate of Analysis list |
| `ux/QA-012-coa-templates.md` | CoA template builder |
| `ux/QA-013-haccp-plans.md` | HACCP plan creation and management |
| `ux/QA-014-ccp-monitoring.md` | CCP monitoring dashboard |
| `ux/QA-015-ccp-deviations.md` | CCP deviation handling |
| `ux/QA-021-audit-trail.md` | Audit trail report viewer |
| `ux/QA-025-scanner-qa.md` | Scanner QA home screen (low-vision optimized) |
| (6 more files) | Not fully read - partial coverage |

### G. Technical Reference (5 files)

| File | Summary |
|------|---------|
| `other/technical/06-quality/06.3-product-specifications-guide.md` | Detailed spec guide with examples |
| `other/technical/06-quality/06.4-test-parameters-guide.md` | Test parameter implementation |
| `other/technical/06-quality/06.5-incoming-inspection-guide.md` | Incoming inspection comprehensive guide |
| `other/technical/06-quality/api-reference.md` | API endpoint reference |
| `other/technical/06-quality/component-guide.md` | React component library |

---

## 2. DUPLICATES: Files with Overlapping Content

### High-Priority Duplicates (Recommend CONSOLIDATION)

#### 1. **QA-003 Specification File Duplication**
- **Files**: `ux/QA-003-specification-modal.md` + `ux/QA-003-specifications-list.md`
- **Issue**: Both files document the same feature (Product Specifications from FR-QA-003)
- **Content Overlap**: Create/edit modal vs. list view (related but distinct UX states)
- **Recommendation**:
  - **KEEP**: `ux/QA-003-specifications-list.md` (primary feature name, list is primary view)
  - **RENAME & RESTRUCTURE**: `ux/QA-003-specification-modal.md` → `ux/QA-003a-specifications-create-edit.md`
  - **OR CONSOLIDATE**: Merge both into single `ux/QA-003-specifications.md` with sections for [List View] [Create Modal] [Edit Modal]

#### 2. **QA-009 NCR File Naming Conflict**
- **Files**: `ux/QA-009-ncr-detail.md` + `ux/QA-009-ncr-list.md`
- **Issue**: Same QA-009 ID for two distinct wireframes (list vs. detail)
- **Recommendation**:
  - **KEEP**: `ux/QA-009-ncr-list.md` (primary view)
  - **RENAME**: `ux/QA-009-ncr-detail.md` → `ux/QA-009a-ncr-detail.md` (add suffix for detail view)

#### 3. **QA-007 Final Inspection Split Across Two Files**
- **Files**: `ux/QA-007-final-inspection-part1.md` + `ux/QA-007-final-inspection-part2.md`
- **Issue**: Single feature split into two files (parts 1 & 2)
- **Content**: Part 1 = initial form, Part 2 = continuation (should be one flow)
- **Recommendation**:
  - **CONSOLIDATE**: Merge both into single `ux/QA-007-final-inspection.md` with [Initial Form] [Results Entry] [Approval] sections
  - **DELETE**: Remove -part1 and -part2 suffixes after consolidation

#### 4. **Story 06.0 Documentation Duplication**
- **Files**: `stories/06.0.epic-overview.md` + `stories/06.0.quality-settings.md`
- **Issue**: Two different documents with overlapping epic information
- **Distinction**:
  - `06.0.epic-overview.md` = Epic-level context, food safety compliance, phase strategy
  - `06.0.quality-settings.md` = Specific story for quality settings CRUD implementation
- **Status**: Actually CORRECT as-is (Epic overview ≠ Story detail), but naming unclear
- **Recommendation**:
  - **NO CHANGE NEEDED**: These are intentionally different documents
  - **CLARIFY**: Rename `06.0.epic-overview.md` → `EPIC-06-OVERVIEW.md` (uppercase) to distinguish from story `06.0.quality-settings.md`

#### 5. **Configuration & Admin Guides for Same Feature (06.0)**
- **Files**:
  - `guides/quality-settings-configuration.md` (technical config examples)
  - `guides/quality-settings-admin-guide.md` (user manual for settings)
  - `guides/quality-settings-components.md` (React component usage)
- **Issue**: Three guides for the same story (06.0)
- **Recommendation**:
  - **CONSOLIDATE**: All three are complementary (technical / user-facing / dev)
  - **KEEP**: `guides/quality-settings-admin-guide.md` (primary user documentation)
  - **RENAME & MOVE**:
    - `quality-settings-configuration.md` → `guides/quality-settings-technical-examples.md` (clarify it's technical)
    - `quality-settings-components.md` → `guides/quality-settings-component-reference.md` (dev reference)
  - **CROSS-REFERENCE**: Add "See also:" sections between the three

#### 6. **Scanner QA Documentation Scattered**
- **Files**:
  - `api/scanner-qa.md` (API endpoints)
  - `guides/scanner-qa-workflow.md` (user workflow)
  - Story file `stories/06.8.scanner-qa-pass-fail.md` (story definition)
  - UX file `ux/QA-025-scanner-qa.md` (wireframes)
- **Status**: NOT problematic - these serve different purposes (API / workflow / implementation / design)
- **Recommendation**: **NO CHANGE** - proper separation of concerns, but add cross-references

### Medium-Priority Redundancy (Optional Consolidation)

#### 7. **Workflow Guides vs. Story Scope Sections**
- **Issue**: `guides/in-process-inspection-workflow.md` duplicates workflow described in `stories/06.10.in-process-inspection.md` [Scope] section
- **Recommendation**:
  - **KEEP BOTH**: Story file = implementation requirements, Guide = user-facing workflow
  - **ADD CROSS-REFERENCE**: Story should link to guide: "See `guides/in-process-inspection-workflow.md` for user-facing documentation"

#### 8. **API Documentation Redundancy**
- **Issue**: Endpoints documented in:
  - `prd/quality.md` [Section 5. API Endpoints]
  - `api/*.md` files (per-feature APIs)
  - Story context YAML `stories/context/{story-id}/api.yaml`
- **Status**: EXPECTED redundancy (PRD overview → feature API → story context)
- **Recommendation**: **NO CHANGE** - this is proper documentation hierarchy

---

## 3. INCONSISTENCIES: Contradictions & Misalignments

### A. Phase & Completion Status Inconsistencies

#### Issue 1: Phase Numbering Mismatch
**Files**:
- `stories/IMPLEMENTATION-ROADMAP.yaml` line 34: "Phase 1A-1B COMPLETE"
- `stories/EPIC-06-STATUS-UPDATE.md` line 4: "PHASE 1-2A COMPLETE"

**Problem**: Inconsistent naming convention
- YAML uses: "1A-1B" (subphase model)
- Status doc uses: "1-2A" (different model)

**Impact**: Confusing for agents and stakeholders
**Recommendation**: Standardize to one model:
- **Option A**: Use "Phase 1A | Phase 1B | Phase 2A | Phase 2B | Phase 3 | Phase 4" (subphase throughout)
- **Option B**: Use "Phase 1 | Phase 2 | Phase 3 | Phase 4" with subphases only when necessary
- **Decision**: Recommend **Option A** (subphase model is more precise for MVP tracking)

#### Issue 2: Story Count Mismatch
**Files**:
- `stories/IMPLEMENTATION-ROADMAP.yaml` line 20: "completed_stories: 12"
- `stories/EPIC-06-STATUS-UPDATE.md` line 4: "12 Phase 1-2A stories IMPLEMENTATION READY"
- `other/technical/06-quality/README.md` line 3: "3/41 Stories Complete + Documented"

**Problem**: Three different completion percentages
- ROADMAP: 12/41 (29%)
- STATUS: 12 ready (not counting as "complete")
- README: 3 deployed (only documenting deployed)

**Root Cause**: Different definitions of "complete"
- Roadmap = "implementation ready" (code ready)
- Status = "story defined" (story doc ready)
- README = "deployed in production" (deployed)

**Impact**: Stakeholders confused about actual progress
**Recommendation**:
- **Clarify in each file**: Add explicit definition at top
  - "ROADMAP: 'Complete' = story defined + implementation code ready"
  - "STATUS: 'Complete' = story documentation finished"
  - "README: 'Deployed' = production deployment verified"
- **Update dashboard**: Create single source of truth for progress

#### Issue 3: Story 06.0 State vs. Checkpoint Evidence
**Files**:
- `stories/06.0.quality-settings.md` line 8: "State: ready"
- `other/checkpoints/06.0.yaml` line 11: "STORY COMPLETE: 06.0"

**Problem**: Consistent (state=ready matches checkpoint complete)
**Status**: **GOOD** - no action needed

### B. Requirement Coverage Inconsistencies

#### Issue 4: FR-QA-026 Scattered Across Multiple Stories
**Requirement**: "FR-QA-026 - Operation quality checkpoints"
**Mentioned in**:
- `prd/quality.md` line 51: Listed as Phase 2, Priority P1
- Story files (06.19, 06.20 exist in file list but not sampled)
- `decisions/quality-arch.md` lines 115-119: "operation_quality_checkpoints" table defined
- `other/technical/06-quality/README.md` not sampled, but implementation plan mentions Phase 2C has stories for this

**Problem**: Feature appears to have 2+ stories (06.19, 06.20) but not clear from sampled docs
**Recommendation**: Review `stories/06.19.*` and `stories/06.20.*` to confirm scope is correctly split

#### Issue 5: CoA (Certificate of Analysis) Fragmentation
**Related Stories**: 06.27, 06.28, 06.29
**Pattern**:
- `stories/06.27.coa-templates.md` - Template definition
- `stories/06.28.coa-generation-engine.md` - Generation logic
- `stories/06.29.coa-pdf-export.md` - PDF export

**Problem**: Three stories for one feature may indicate scope creep or proper decomposition
**Recommendation**: Verify in story documents that:
1. Story 06.27 covers template CRUD only
2. Story 06.28 covers generation from inspection data
3. Story 06.29 covers PDF/export only
4. **No gaps** between stories (e.g., "approval workflow" not in any)

#### Issue 6: HACCP/CCP Coverage Fragmentation
**Related Stories**: 06.21, 06.22, 06.23, 06.24, 06.25, 06.26, 06.30
**Problem**: 7 stories for HACCP feature - may indicate:
- Proper epic decomposition (good)
- Scope creep or unclear boundaries (bad)

**Recommendation**: Create dependency matrix to verify no overlaps:
- 06.21 (HACCP plan) → 06.22 (CCP definition) → 06.23/24 (monitoring) → 06.25/26 (deviations) → 06.30 (verification)

### C. Database Schema Inconsistencies

#### Issue 7: Multiple Schema Definitions
**Files**:
- `prd/quality.md` [Section 4. Database Schema] - Complete schema with all 30+ tables
- `decisions/quality-arch.md` [Section 2. Database Schema] - Same schema, slightly condensed
- Story context YAML `stories/context/{story-id}/database.yaml` - Per-story table definitions

**Problem**: Three sources of truth for schema
**Impact**: If schema changes, must update in 3+ places
**Recommendation**:
- **Single source of truth**: Maintain schema only in `decisions/quality-arch.md`
- **PRD update**: Replace Section 4 with reference: "See Technical Architecture for complete schema"
- **Story context**: Keep per-story schema (what this story creates/modifies)

#### Issue 8: Table Naming Inconsistency
**Examples**:
- `quality_specifications` vs `quality_spec_parameters` (mixing full vs. abbreviated names)
- `haccp_plans` vs `haccp_ccps` (plan is plural, CCP is singular)
- `ncr_reports` vs `ncr_workflow` (reports vs. workflow - different entities)

**Problem**: Inconsistent naming makes schema harder to navigate
**Status**: Minor issue - schema is already defined, changing now would require migration
**Recommendation**: Document naming convention:
- "Plural table names: `{module}_{entity_plural}`"
- "Abbreviations acceptable if standard (e.g., CCP, NCR, CoA, HACCP)"
- "Workflow tables: `{entity}_workflow` for state machine tracking"

### D. Compliance & Regulatory Requirement Inconsistencies

#### Issue 9: FDA 21 CFR Part 11 Compliance Scattered
**Requirement**: Electronic signature support for compliance
**Mentioned in**:
- `prd/quality.md` line 77: "E-signature compliance | FDA 21 CFR Part 11 | P1"
- `stories/06.0.epic-overview.md` line 42: "FDA 21 CFR Part 11 - Electronic records and signatures"
- NO dedicated story found in sampled files for e-signature implementation

**Problem**: P1 priority requirement but no clear story (may be in later phases)
**Recommendation**:
- Verify story exists (likely Phase 3 or 4)
- Add to Phase 2B/C if e-signature needed earlier for batch release

#### Issue 10: Audit Trail Requirements Distributed
**Requirement**: "Complete audit trail for all QA actions"
**Mentioned in**:
- PRD NFRs section
- Story 06.0 scope (change tracking)
- Story 06.38 (Audit Trail Reports)
- Multiple guides (reference audit trail in every workflow)

**Problem**: Unclear which story owns audit trail table and triggers
**Recommendation**:
- Verify Story 06.0 (Quality Settings) includes audit settings
- Verify Story 06.38 (Audit Trail Reports) assumes audit tables exist
- Document audit table creation in story 06.0 or 06.1

---

## 4. KEY REQUIREMENTS: Extracted Functional Requirements

### A. All FR-QA Requirements from PRD (26 total)

| FR ID | Name | Phase | Priority | Status | Story | Notes |
|-------|------|-------|----------|--------|-------|-------|
| FR-QA-001 | Quality Status Management | 1 | P0 | Ready | 06.1 | 7 statuses: PENDING, PASSED, FAILED, HOLD, RELEASED, QUARANTINED, COND_APPROVED |
| FR-QA-002 | Quality Hold Management | 1 | P0 | Ready | 06.2 | Inventory blocking with reason + disposition |
| FR-QA-003 | Product Specifications | 1 | P0 | Ready | 06.3 | Versioned with approval workflow, RLS protected |
| FR-QA-004 | Test Templates & Recording | 1 | P0 | Ready | 06.4, 06.6 | Parameters, test results capture (2 stories) |
| FR-QA-005 | Incoming Inspection | 1 | P0 | Ready | 06.5 | GRN quality verification, auto-create on receipt |
| FR-QA-006 | In-Process Inspection | 2 | P0 | Ready | 06.10 | WIP quality checks at operation CCPs |
| FR-QA-007 | Final Inspection | 2 | P0 | Ready | 06.11 | Finished product QA before batch release |
| FR-QA-008 | Sampling Plans (AQL) | 2 | P0 | Ready | 06.7 | ANSI/ASQ Z1.4 statistical sampling |
| FR-QA-009 | NCR Creation & Workflow | 2 | P0 | Ready | 06.9, 06.13-06.16 | Non-Conformance Report lifecycle (5 stories) |
| FR-QA-010 | Batch Release Approval | 2 | P0 | Ready | 06.12 | Release gate after final inspection |
| FR-QA-011 | CoA Generation | 3 | P0 | Planned | 06.28 | Certificate of Analysis auto-gen from inspections |
| FR-QA-012 | CoA Templates | 3 | P0 | Planned | 06.27 | Configurable CoA layouts |
| FR-QA-013 | HACCP Plan Setup | 3 | P0 | Planned | 06.21 | Hazard analysis and CCP identification |
| FR-QA-014 | CCP Monitoring | 3 | P0 | Planned | 06.23, 06.24 | Desktop + mobile CCP monitoring (2 stories) |
| FR-QA-015 | CCP Deviation Alerts | 3 | P0 | Planned | 06.26 | Out-of-spec alert + correction tracking |
| FR-QA-016 | CAPA Creation | 3 | P1 | Planned | 06.31 | Corrective/Preventive Action creation |
| FR-QA-017 | CAPA Workflow & Effectiveness | 3 | P1 | Planned | 06.32, 06.33 | Action tracking + verification (2 stories) |
| FR-QA-018 | Supplier Quality Rating | 4 | P1 | Planned | 06.34 | Scorecard-based supplier evaluation |
| FR-QA-019 | Supplier Audits | 4 | P1 | Planned | 06.35, 06.36 | Audit mgmt + findings (2 stories) |
| FR-QA-020 | Quality Dashboard | 4 | P0 | Planned | 06.37 | KPI dashboard (pending, NCR rate, holds, etc.) |
| FR-QA-021 | Audit Trail Reports | 4 | P0 | Planned | 06.38 | Compliance reporting for FDA 21 CFR Part 11 |
| FR-QA-022 | Quality Analytics | 4 | P1 | Planned | 06.39 | Advanced trending, root cause analysis |
| FR-QA-023 | Retention Sample Management | 4 | P1 | Planned | (none identified) | **GAP**: No story found for retention samples |
| FR-QA-024 | Document Control & Versioning | 4 | P1 | Planned | 06.40 | Change tracking, document versioning |
| FR-QA-025 | Scanner Integration | 2 | P0 | Ready | 06.8 | Mobile QA workflows, offline support, <1s capture |
| FR-QA-026 | Operation Quality Checkpoints | 2 | P1 | Ready | 06.19(?), 06.20(?) | Quality gates in routing operations |

### B. Non-Functional Requirements (26 total, from PRD Section 3)

#### Performance Requirements
- Page load: <2 seconds
- API response: <500ms (general), <300ms (CCP save), <1 second (scanner capture)
- CoA PDF generation: <5 seconds
- Inspection query (1000 records): <2 seconds
- NCR workflow transition: <500ms

#### Scalability Requirements
- Concurrent QA users: 30/org
- Inspections/day: 5,000
- Test results/inspection: 100
- Active NCRs: 500/org
- CCP monitoring records/day: 10,000
- CoA documents/month: 1,000

#### Data Retention Requirements
- Audit logs: 2 years
- Inspection records: **7 years** (regulatory minimum)
- HACCP records: **5 years** (regulatory minimum)
- NCR/CAPA records: **10 years** (regulatory minimum)
- CoA documents: **10 years** (customer requirement)

#### Compliance & Security
- RLS enforcement: 100% of queries
- Audit trail immutability: 100% of records
- E-signature support: FDA 21 CFR Part 11
- Change reason capture: Required for critical fields
- CCP alert delivery: <30 seconds
- NCR notification delivery: <5 minutes
- CoA generation success: >99%

#### Usability Requirements
- Scanner touch targets: minimum 44px
- CCP deviation alerts: full-screen modal visibility
- Offline mode (CCP monitoring): 50 records max

### C. Database Entities Summary

**Core Quality** (6 tables):
- quality_specifications, quality_spec_parameters, quality_inspections, quality_test_results, quality_holds, quality_hold_items

**NCR & CAPA** (5 tables):
- ncr_reports, ncr_workflow, capa_records, capa_actions, capa_effectiveness_checks

**CoA** (3 tables):
- certificates_of_analysis, coa_templates, coa_parameters

**Sampling** (2 tables):
- sampling_plans, sampling_records

**HACCP/CCP** (5 tables):
- haccp_plans, haccp_ccps, haccp_monitoring_records, haccp_deviations, haccp_verification_records

**Supplier Quality** (4 tables):
- supplier_quality_ratings, supplier_audits, supplier_audit_findings, supplier_ncrs

**Audit & Traceability** (3 tables):
- quality_audit_log, quality_document_versions, retention_samples

**Operation Quality** (2 tables - NEW for FR-QA-026):
- operation_quality_checkpoints, operation_checkpoint_results

**Total: 30 tables** (all multi-tenant with RLS)

### D. API Endpoints Summary (60+ total)

**Quality Status & Holds** (5 endpoints):
- GET /api/quality/status, POST/GET /api/quality/holds, PATCH .../release, GET .../active

**Specifications & Tests** (6 endpoints):
- GET/POST /api/quality/specifications, GET /api/specifications/:id, GET .../product/:productId, POST .../approve, POST/GET /api/quality/test-results

**Inspections** (9 endpoints):
- GET/POST /api/quality/inspections, GET /:id, POST /:id/start, POST /:id/complete, GET /pending, GET /incoming, GET /in-process, GET /final

**Operation Quality** (8 endpoints):
- GET/POST /api/quality/operation-checkpoints, GET/PUT/DELETE /:id, GET /routing/:routingId, GET /operation/:operationId, POST/GET /api/quality/operation-checkpoint-results, POST .../sign-off

**NCR Management** (7 endpoints):
- GET/POST /api/quality/ncrs, GET/:id, PUT/:id, POST/:id/workflow/next, POST/:id/close, GET /stats

**CoA Management** (6 endpoints):
- GET/POST /api/quality/coa, GET /:id, GET /:id/pdf, POST /:id/send, GET/POST /api/quality/coa-templates

**Sampling Plans** (4 endpoints):
- GET/POST /api/quality/sampling-plans, GET /:id, POST /api/quality/sampling-records

**HACCP/CCP** (9 endpoints):
- GET/POST /api/quality/haccp/plans, GET /:id, POST /:id/approve, GET/POST /api/quality/haccp/ccps, POST /api/quality/haccp/monitoring, GET /ccp/:ccpId, POST /api/quality/haccp/deviations, GET /active, POST /api/quality/haccp/verification

**CAPA** (3 endpoints planned):
- GET/POST /api/quality/capa, GET /:id

**Supplier Quality** (3 endpoints):
- GET/POST /api/quality/suppliers/ratings, GET/POST /api/quality/suppliers/audits, GET/POST /api/quality/suppliers/audit-findings

**Settings** (2 endpoints):
- GET /api/quality/settings, PUT /api/quality/settings

---

## 5. RECOMMENDATIONS SUMMARY

### Immediate Actions (High Impact)

1. **Resolve File Naming Conflicts** (2 hours)
   - Rename `QA-003-specification-modal.md` → `QA-003a-specifications-create-edit.md`
   - Rename `QA-009-ncr-detail.md` → `QA-009a-ncr-detail.md`
   - Consolidate `QA-007-final-inspection-part[1,2].md` → `QA-007-final-inspection.md`

2. **Standardize Phase Naming** (1 hour)
   - Choose Phase naming: "1A/1B/2A/2B/3/4" OR "1/2/3/4"
   - Update all files consistently (ROADMAP, STATUS, stories)
   - Add definition at top of each document

3. **Clarify Completion Metrics** (2 hours)
   - Create single source of truth for progress (PROJECT-DASHBOARD.md)
   - Define three metrics: Story Defined | Code Ready | Deployed
   - Update ROADMAP, STATUS, README with explicit metric definitions

### Medium Priority (Consolidation)

4. **Consolidate Quality Settings Documentation** (2 hours)
   - Merge 3 guides into single file with sections
   - Rename for clarity (technical vs. user-facing vs. component reference)
   - Add cross-references

5. **Verify FR-QA-023 Story Mapping** (1 hour)
   - "Retention Sample Management" listed in PRD but no story found
   - Either create story or remove from PRD Phase 4 scope

6. **Review HACCP/CCP Story Boundaries** (2 hours)
   - Document why 7 stories (06.21-26, 06.30) needed
   - Create dependency diagram
   - Verify no scope overlaps

### Strategic (Long-term)

7. **Create Single Source of Truth for Database Schema**
   - Maintain in: `decisions/quality-arch.md` only
   - PRD references instead of duplicates
   - Story context includes delta from current schema

8. **Implement Cross-Reference System**
   - Each story links to: UX wireframes, API docs, guides
   - Each guide references: story, PRD section
   - Each API doc references: story, user guide

9. **Auto-Generate API Documentation**
   - Consider generating API docs from OpenAPI/Swagger specs
   - Reduces duplication between files

---

## 6. FILE ORGANIZATION SUMMARY

### Current Structure (285 files)
```
08-quality/
├── prd/                          (1 file: PRD definition)
├── stories/                      (41 + 200+ context YAML files)
├── api/                          (5 files: API references)
├── guides/                       (9 files: User workflows)
├── ux/                           (26 files: Wireframes)
├── decisions/                    (1 file: Architecture)
└── other/
    ├── checkpoints/             (13 YAML files: progress logs)
    └── technical/               (5+ files: implementation guides)
```

### Recommended Restructure (Optional)
```
08-quality/
├── _INDEX.md                     (Navigation & file guide)
├── prd/
│   └── quality.md
├── decisions/
│   └── quality-arch.md           (single schema source)
├── stories/
│   ├── 06.0-quality-settings/
│   │   ├── story.md
│   │   ├── context.yaml          (consolidated from _index + sub-files)
│   │   └── README.md
│   └── [06.1 through 06.40]/
├── api/
│   ├── quality-settings.md
│   ├── inspections.md
│   ├── ncr.md
│   ├── coa.md
│   ├── haccp.md
│   ├── capa.md
│   └── [others]
├── guides/
│   ├── README.md                 (guide index)
│   ├── quality-settings/
│   │   ├── admin-guide.md
│   │   ├── technical-examples.md
│   │   └── component-reference.md
│   ├── in-process-inspection.md
│   └── [others]
├── ux/
│   ├── README.md                 (wireframe index)
│   ├── QA-001-dashboard.md
│   └── [QA-002 through QA-025]
└── reference/
    └── technical/               (implementation guides for deployed stories)
```

---

## Summary Statistics

- **Total Files**: 285
- **Markdown Files**: 62
- **YAML Files**: 223
- **Stories Defined**: 41
- **Functional Requirements**: 26 (FR-QA-001 to FR-QA-026)
- **Non-Functional Requirements**: 26 (Performance, Scalability, Compliance)
- **Database Tables**: 30 (Core Quality, NCR, CAPA, CoA, HACCP, Supplier, Audit, Operation Quality)
- **API Endpoints**: 60+ (documented across PRD and API files)
- **UX Wireframes**: 26 (QA-001 through QA-025)
- **Phase Breakdown**: Phase 1A-1B (10 stories, complete) | Phase 2A (2 stories, complete) | Phase 2B-4 (29 stories, planned)
- **Completion Status**: 12/41 stories ready for implementation (29%)

---

**Analysis completed**: 2026-02-16
**Analyzer**: Claude Code Documentation Analysis Tool
**Next Steps**: Review recommendations above and prioritize consolidation tasks
