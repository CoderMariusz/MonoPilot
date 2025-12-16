# Quality Module - Database Schema Analysis

**Epic 06 - Quality Management System**
**Date:** 2025-12-16
**Analyst:** Database-Schema-Analyzer Agent
**Purpose:** Story breakdown recommendations based on database complexity

---

## Executive Summary

The Quality module requires **28 tables** across 7 categories. This analysis categorizes tables by complexity, maps dependencies, and recommends story grouping to ensure complete schema implementation per story.

**Key Findings:**
- 8 Simple CRUD tables (1-day implementation each)
- 12 Complex relationship tables (2-3 days each)
- 5 Workflow/state machine tables (3-4 days each)
- 3 Immutable audit tables (1-2 days each)
- **Recommended Story Count:** 10-12 stories grouped by table clusters
- **Critical Path:** Core Quality → NCR → HACCP → Supplier Quality

---

## Table Complexity Matrix

### Category 1: Simple CRUD Tables (8 tables)

| Table | Columns | Relationships | RLS | Indexes | Complexity | Est. Days |
|-------|---------|---------------|-----|---------|------------|-----------|
| `quality_holds` | 14 | 2 FK (users) | Yes | 2 | Low | 1 |
| `quality_settings` | 20+ | 1 FK (org) | Yes | 1 | Low | 1 |
| `sampling_plans` | 11 | 2 FK (org, product) | Yes | 1 | Low | 1 |
| `sampling_records` | 7 | 3 FK (plan, inspection, user) | Yes | 1 | Low | 1 |
| `coa_templates` | 9 | 2 FK (org, user) | Yes | 1 | Low | 1 |
| `supplier_quality_ratings` | 11 | 3 FK (org, supplier, user) | Yes | 2 | Low | 1 |
| `supplier_audits` | 13 | 3 FK (org, supplier, user) | Yes | 2 | Low | 1 |
| `retention_samples` | 10 | 4 FK (batch, product, location, org) | Yes | 2 | Low | 1 |

**Characteristics:**
- Flat structure, minimal joins
- Standard CRUD operations
- Simple validation rules
- No workflow state management
- Can be implemented independently

---

### Category 2: Complex Relationship Tables (12 tables)

| Table | Columns | Relationships | RLS | Indexes | Complexity | Est. Days |
|-------|---------|---------------|-----|---------|------------|-----------|
| `quality_specifications` | 12 | 3 FK (org, product, user) | Yes | 2 | Medium | 2 |
| `quality_spec_parameters` | 11 | 1 FK (spec) CASCADE | Yes | 2 | Medium | 2 |
| `quality_inspections` | 22 | 7 FK (org, product, spec, lp, plan, user) | Yes | 5 | High | 3 |
| `quality_test_results` | 11 | 4 FK (inspection, parameter, user, machine) | Yes | 3 | Medium | 2 |
| `quality_hold_items` | 7 | 1 FK (hold) CASCADE | Yes | 1 | Low | 1 |
| `operation_quality_checkpoints` | 12 | 4 FK (org, routing, operation) | Yes | 3 | Medium | 2 |
| `operation_checkpoint_results` | 10 | 5 FK (checkpoint, wo, operation, user) | Yes | 3 | Medium | 2 |
| `certificates_of_analysis` | 13 | 6 FK (org, product, lp, inspection, template, user) | Yes | 3 | Medium | 2 |
| `coa_parameters` | 8 | 1 FK (coa) CASCADE | Yes | 1 | Low | 1 |
| `haccp_plans` | 11 | 3 FK (org, product, user) | Yes | 2 | Medium | 2 |
| `haccp_ccps` | 16 | 2 FK (plan, machine) CASCADE | Yes | 2 | Medium | 2 |
| `supplier_audit_findings` | 10 | 1 FK (audit) CASCADE | Yes | 1 | Medium | 1 |

**Characteristics:**
- Parent-child relationships (1:many)
- Cascade delete policies
- Multiple foreign keys
- Moderate validation complexity
- Requires dependency tables to exist first

---

### Category 3: Workflow/State Machine Tables (5 tables)

| Table | Columns | Relationships | RLS | Indexes | Complexity | Est. Days |
|-------|---------|---------------|-----|---------|------------|-----------|
| `ncr_reports` | 25 | 9 FK (org, users, inspection, hold, ccp, supplier, wo, lp) | Yes | 4 | Very High | 4 |
| `ncr_workflow` | 10 | 3 FK (ncr, users) CASCADE | Yes | 1 | High | 3 |
| `capa_records` | 14 | 3 FK (org, user) | Yes | 3 | High | 3 |
| `capa_actions` | 10 | 2 FK (capa, user) CASCADE | Yes | 1 | Medium | 2 |
| `capa_effectiveness_checks` | 9 | 3 FK (capa, users) CASCADE | Yes | 1 | Medium | 2 |

**Characteristics:**
- State transitions (draft → open → closed)
- Workflow step management
- Complex business rules
- Multiple stakeholder assignments
- Approval/rejection logic
- Requires service layer with state machine

---

### Category 4: Monitoring & Real-Time Tables (3 tables)

| Table | Columns | Relationships | RLS | Indexes | Complexity | Est. Days |
|-------|---------|---------------|-----|---------|------------|-----------|
| `haccp_monitoring_records` | 11 | 5 FK (org, ccp, wo, operation, user, machine) | Yes | 3 | High | 3 |
| `haccp_deviations` | 14 | 5 FK (org, ccp, monitoring, user, ncr) | Yes | 2 | High | 3 |
| `haccp_verification_records` | 10 | 2 FK (plan, user) | Yes | 2 | Medium | 2 |

**Characteristics:**
- High-frequency inserts (100-10,000 records/day)
- Real-time validation (critical limits)
- Alert generation on failure
- Auto-NCR creation logic
- Performance-critical indexes

---

### Category 5: Immutable Audit Tables (3 tables)

| Table | Columns | Relationships | RLS | Indexes | Complexity | Est. Days |
|-------|---------|---------------|-----|---------|------------|-----------|
| `quality_audit_log` | 9 | 2 FK (org, user) | Insert-only | 2 | Medium | 2 |
| `quality_document_versions` | 8 | 2 FK (document, user) | Insert-only | 2 | Medium | 2 |
| `supplier_ncrs` | 8 | 4 FK (supplier, ncr, po_line) | Yes | 2 | Low | 1 |

**Characteristics:**
- Append-only (no UPDATE/DELETE)
- JSONB old_value/new_value columns
- Partition by timestamp (monthly)
- FDA 21 CFR Part 11 compliance
- Change reason required
- Triggers on all quality tables

---

## Table Dependency Graph

### Level 0: Foundation (External Dependencies)

```
organizations (Epic 01.1)
users (Epic 01.5)
products (Epic 02.1)
suppliers (Epic 03 - Planning)
work_orders (Epic 04 - Production)
wo_operations (Epic 04 - Production)
license_plates (Epic 05 - Warehouse)
locations (Epic 01.9)
machines (Epic 01.10)
routings (Epic 02.7)
```

**Action:** Ensure these tables exist before starting Quality module.

---

### Level 1: Core Quality (No Internal Dependencies)

```
quality_settings (org_id only)
quality_specifications (org_id, product_id, user_id)
sampling_plans (org_id, product_id)
haccp_plans (org_id, product_id, user_id)
coa_templates (org_id, user_id)
supplier_quality_ratings (org_id, supplier_id, user_id)
supplier_audits (org_id, supplier_id, user_id)
```

**Can Start Stories:** These tables can be implemented in parallel (no blocking dependencies).

---

### Level 2: Inspections & Parameters (Depends on Level 1)

```
quality_spec_parameters
    ↳ quality_specifications

quality_inspections
    ↳ quality_specifications
    ↳ sampling_plans
    ↳ products, license_plates, work_orders

quality_test_results
    ↳ quality_inspections
    ↳ quality_spec_parameters
    ↳ machines

haccp_ccps
    ↳ haccp_plans
    ↳ machines

supplier_audit_findings
    ↳ supplier_audits

coa_parameters
    ↳ certificates_of_analysis
```

**Sequencing Rule:** Parent tables must be created in previous migration.

---

### Level 3: Holds & Checkpoints (Depends on Level 2)

```
quality_holds
    ↳ ncr_reports (optional FK)

quality_hold_items
    ↳ quality_holds
    ↳ license_plates, work_orders

operation_quality_checkpoints
    ↳ routings, operations

operation_checkpoint_results
    ↳ operation_quality_checkpoints
    ↳ work_orders, wo_operations
```

**Cross-Module:** Checkpoint results integrate with Production module (WO operations).

---

### Level 4: Workflows (Depends on Level 1-3)

```
ncr_reports
    ↳ quality_inspections (optional)
    ↳ quality_holds (optional)
    ↳ haccp_ccps (optional)
    ↳ suppliers, work_orders, license_plates

ncr_workflow
    ↳ ncr_reports

capa_records
    ↳ ncr_reports (source_id)
    ↳ quality_inspections, supplier_audits (source_id)

capa_actions
    ↳ capa_records

capa_effectiveness_checks
    ↳ capa_records

supplier_ncrs
    ↳ suppliers
    ↳ ncr_reports
    ↳ po_lines (Epic 03)
```

---

### Level 5: HACCP Monitoring (Depends on Level 2-4)

```
haccp_monitoring_records
    ↳ haccp_ccps
    ↳ work_orders, wo_operations

haccp_deviations
    ↳ haccp_ccps
    ↳ haccp_monitoring_records
    ↳ ncr_reports (optional auto-create)

haccp_verification_records
    ↳ haccp_plans
```

---

### Level 6: CoA & Audit (Depends on Level 2)

```
certificates_of_analysis
    ↳ quality_inspections
    ↳ coa_templates
    ↳ products, license_plates

retention_samples
    ↳ products, locations

quality_audit_log
    ↳ All quality tables (via triggers)

quality_document_versions
    ↳ quality_specifications, haccp_plans, coa_templates
```

---

## RLS Policy Requirements

### Standard Org Isolation (ALL Tables)

```sql
CREATE POLICY "quality_{table}_org_isolation"
ON quality_{table} FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

**Tables:** All 28 tables with `org_id` column.

---

### Immutable Policies (3 Tables)

```sql
-- Audit log: INSERT only (no UPDATE/DELETE)
CREATE POLICY "audit_log_insert_only"
ON quality_audit_log FOR INSERT
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "audit_log_read_only"
ON quality_audit_log FOR SELECT
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Document versions: INSERT only
CREATE POLICY "doc_versions_insert_only"
ON quality_document_versions FOR INSERT
WITH CHECK (true);

CREATE POLICY "doc_versions_read_only"
ON quality_document_versions FOR SELECT
USING (true);
```

**Tables:**
- `quality_audit_log`
- `quality_document_versions`

---

### Cascade Delete Policies (9 Tables)

```sql
-- Child tables with ON DELETE CASCADE
-- No additional RLS needed (parent RLS enforced)
```

**Child Tables:**
- `quality_spec_parameters` → `quality_specifications`
- `quality_test_results` → `quality_inspections`
- `quality_hold_items` → `quality_holds`
- `ncr_workflow` → `ncr_reports`
- `capa_actions` → `capa_records`
- `capa_effectiveness_checks` → `capa_records`
- `haccp_ccps` → `haccp_plans`
- `coa_parameters` → `certificates_of_analysis`
- `supplier_audit_findings` → `supplier_audits`

**Rule:** Parent RLS policy automatically protects children via CASCADE.

---

### Role-Based Policies (5 Tables)

```sql
-- Inspections: QA Inspector + QA Manager can create
CREATE POLICY "inspections_create"
ON quality_inspections FOR INSERT
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role_name IN ('QA Inspector', 'QA Manager', 'Quality Director')
  )
);

-- Batch release: QA Manager only
CREATE POLICY "batch_release_approval"
ON quality_inspections FOR UPDATE
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role_name IN ('QA Manager', 'Quality Director')
  )
)
WITH CHECK (result = 'pass' AND status = 'completed');
```

**Tables with Role Restrictions:**
- `quality_inspections` (create: QA Inspector+, approve: QA Manager+)
- `quality_holds` (release: QA Manager+)
- `ncr_reports` (close: QA Manager+)
- `haccp_plans` (approve: QA Manager+)
- `certificates_of_analysis` (issue: QA Manager+)

---

## Performance Optimization

### Expected Data Volumes

| Table | Records/Month | Max/Year | Partition Strategy |
|-------|--------------|----------|-------------------|
| `quality_inspections` | 500-2,000 | 24,000 | None (under 100K) |
| `quality_test_results` | 5,000-20,000 | 240,000 | Partition after 1M |
| `haccp_monitoring_records` | 3,000-30,000 | 360,000 | Partition after 1M |
| `quality_audit_log` | 10,000-50,000 | 600,000 | Partition monthly |
| `ncr_reports` | 20-100 | 1,200 | None |
| `certificates_of_analysis` | 100-500 | 6,000 | None |

**Critical Indexes:**

```sql
-- High-frequency reads
CREATE INDEX idx_inspections_status ON quality_inspections(org_id, status, inspection_type);
CREATE INDEX idx_inspections_ref ON quality_inspections(reference_type, reference_id);

-- Join optimization
CREATE INDEX idx_test_results_inspection ON quality_test_results(inspection_id);
CREATE INDEX idx_test_results_param ON quality_test_results(parameter_id);

-- CCP monitoring (real-time)
CREATE INDEX idx_ccp_monitoring_ccp ON haccp_monitoring_records(ccp_id, monitored_at DESC);
CREATE INDEX idx_ccp_monitoring_wo ON haccp_monitoring_records(wo_id);

-- Audit trail (compliance queries)
CREATE INDEX idx_audit_log_entity ON quality_audit_log(entity_type, entity_id, timestamp DESC);
CREATE INDEX idx_audit_log_date ON quality_audit_log(org_id, timestamp DESC);

-- Holds (blocking queries)
CREATE INDEX idx_holds_status ON quality_holds(org_id, status);
CREATE INDEX idx_hold_items_ref ON quality_hold_items(reference_type, reference_id);
```

---

### Query Optimization Patterns

**1. Inspection Queue (High Traffic)**

```sql
-- Bad: Full table scan
SELECT * FROM quality_inspections WHERE status = 'scheduled';

-- Good: Index-optimized
SELECT * FROM quality_inspections
WHERE org_id = $1
  AND status = 'scheduled'
  AND inspection_type = $2
ORDER BY scheduled_date ASC
LIMIT 20;
```

**2. CCP Monitoring Dashboard (Real-Time)**

```sql
-- Use materialized view (refresh every 5 min)
CREATE MATERIALIZED VIEW ccp_monitoring_summary AS
SELECT
  ccp_id,
  COUNT(*) as total_readings,
  SUM(CASE WHEN within_limits THEN 1 ELSE 0 END) as pass_count,
  MAX(monitored_at) as last_reading
FROM haccp_monitoring_records
WHERE monitored_at > NOW() - INTERVAL '24 hours'
GROUP BY ccp_id;
```

**3. Audit Trail Reports (Compliance)**

```sql
-- Partition by timestamp (monthly)
CREATE TABLE quality_audit_log_2025_01 PARTITION OF quality_audit_log
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Query uses partition pruning
SELECT * FROM quality_audit_log
WHERE timestamp BETWEEN '2025-01-15' AND '2025-01-20'
  AND entity_type = 'inspection';
```

---

### Caching Strategy

```typescript
// Redis cache keys
const cacheKeys = {
  // Dashboard KPIs (1 min TTL)
  dashboard: `org:${orgId}:quality:dashboard`,

  // Inspection queues (30 sec TTL)
  inspectionQueue: `org:${orgId}:inspection:queue:${type}`,

  // Active holds (1 min TTL)
  activeHolds: `org:${orgId}:holds:active`,

  // CCP last reading (5 min TTL)
  ccpLastReading: `org:${orgId}:ccp:${ccpId}:last`,

  // Active specs per product (5 min TTL)
  productSpec: `org:${orgId}:spec:product:${productId}:active`,

  // NCR active count (1 min TTL)
  ncrActiveCount: `org:${orgId}:ncr:active:count`,
};
```

**Cache Invalidation:**
- Inspection complete → Clear `inspectionQueue`, `dashboard`
- Hold created/released → Clear `activeHolds`, `dashboard`
- CCP monitoring record → Clear `ccpLastReading`, `dashboard`
- NCR created → Clear `ncrActiveCount`, `dashboard`

---

## Story Grouping Recommendations

### Story Group 1: Core Quality Foundation (Phase 1, Week 1-2)

**Tables:**
- `quality_settings` (1 day)
- `quality_specifications` (2 days)
- `quality_spec_parameters` (1 day)
- `quality_holds` (1 day)
- `quality_hold_items` (1 day)

**API Endpoints:** 12 endpoints
**Services:** `specification-service.ts`, `quality-hold-service.ts`, `quality-settings-service.ts`
**Complexity:** Medium (6 days)
**PRD FRs:** FR-QA-001, FR-QA-002, FR-QA-003

**Why Together?**
- Settings table is prerequisite for all quality features
- Specifications are foundational for inspections
- Holds are independent but simple CRUD
- All required for incoming inspection

**Migration:** Single migration file `001_quality_foundation.sql`

---

### Story Group 2: Inspections & Test Results (Phase 1, Week 2-3)

**Tables:**
- `sampling_plans` (1 day)
- `sampling_records` (1 day)
- `quality_inspections` (3 days - complex)
- `quality_test_results` (2 days)

**API Endpoints:** 15 endpoints
**Services:** `inspection-service.ts`, `sampling-service.ts`
**Complexity:** High (7 days)
**PRD FRs:** FR-QA-004, FR-QA-005, FR-QA-008

**Why Together?**
- Inspections depend on specs (Story 1)
- Test results depend on inspections
- Sampling plans link to inspections
- Forms complete incoming inspection flow

**Migration:** `002_inspections_testing.sql`

---

### Story Group 3: NCR Lifecycle (Phase 2, Week 1-2)

**Tables:**
- `ncr_reports` (4 days - very complex)
- `ncr_workflow` (3 days - state machine)
- `supplier_ncrs` (1 day)

**API Endpoints:** 10 endpoints
**Services:** `ncr-service.ts`
**Complexity:** Very High (8 days)
**PRD FRs:** FR-QA-009

**Why Together?**
- NCR workflow tightly coupled to reports
- State machine requires both tables
- Supplier NCRs are extension of NCR reports
- Cannot split without breaking workflow

**Migration:** `003_ncr_management.sql`

---

### Story Group 4: CAPA Management (Phase 2, Week 3)

**Tables:**
- `capa_records` (3 days)
- `capa_actions` (2 days)
- `capa_effectiveness_checks` (2 days)

**API Endpoints:** 8 endpoints
**Services:** `capa-service.ts`
**Complexity:** High (7 days)
**PRD FRs:** FR-QA-016, FR-QA-017

**Why Together?**
- CAPA actions meaningless without parent record
- Effectiveness checks depend on actions complete
- Service layer manages entire CAPA lifecycle
- All three tables form cohesive feature

**Migration:** `004_capa_management.sql`

---

### Story Group 5: Operation Checkpoints (Phase 2, Week 4)

**Tables:**
- `operation_quality_checkpoints` (2 days)
- `operation_checkpoint_results` (2 days)

**API Endpoints:** 9 endpoints
**Services:** `operation-checkpoint-service.ts`
**Complexity:** Medium (4 days)
**PRD FRs:** FR-QA-026

**Why Together?**
- Checkpoints and results are parent-child
- Both integrate with routing/operations
- New feature (FR-QA-026 from Technical)
- Can be implemented independently of other quality features

**Migration:** `005_operation_checkpoints.sql`

**Dependencies:**
- Epic 02.7 (Routings)
- Epic 04 (Work Orders, WO Operations)

---

### Story Group 6: HACCP Plans & CCPs (Phase 3, Week 1-2)

**Tables:**
- `haccp_plans` (2 days)
- `haccp_ccps` (2 days)
- `haccp_verification_records` (2 days)

**API Endpoints:** 10 endpoints
**Services:** `haccp-service.ts`
**Complexity:** Medium (6 days)
**PRD FRs:** FR-QA-013

**Why Together?**
- CCPs cannot exist without HACCP plan
- Verification records validate plan effectiveness
- All three form complete HACCP documentation
- Prerequisite for monitoring (Story 7)

**Migration:** `006_haccp_plans.sql`

---

### Story Group 7: HACCP Monitoring & Deviations (Phase 3, Week 2-3)

**Tables:**
- `haccp_monitoring_records` (3 days - high volume)
- `haccp_deviations` (3 days - alert logic)

**API Endpoints:** 8 endpoints
**Services:** `haccp-monitoring-service.ts`
**Complexity:** Very High (6 days)
**PRD FRs:** FR-QA-014, FR-QA-015

**Why Together?**
- Deviations are auto-created from monitoring records
- Real-time validation logic shared
- Alert generation integrated
- High-frequency inserts require performance tuning together

**Migration:** `007_haccp_monitoring.sql`

**Performance Notes:**
- Requires batch insert optimization
- Index on `monitored_at DESC` for recent readings
- Cache last reading per CCP
- Partition after 1M records

---

### Story Group 8: Certificates of Analysis (Phase 3, Week 3)

**Tables:**
- `coa_templates` (1 day)
- `certificates_of_analysis` (2 days)
- `coa_parameters` (1 day)

**API Endpoints:** 8 endpoints
**Services:** `coa-service.ts`
**Complexity:** Medium (4 days)
**PRD FRs:** FR-QA-011, FR-QA-012

**Why Together?**
- CoA documents depend on templates
- Parameters are child of CoA documents
- PDF generation requires all three
- Complete feature in single story

**Migration:** `008_certificates_of_analysis.sql`

**Technical Notes:**
- PDF generation library (puppeteer, jsPDF)
- Template engine (Handlebars)
- S3 storage for PDF files

---

### Story Group 9: Supplier Quality (Phase 4, Week 1)

**Tables:**
- `supplier_quality_ratings` (1 day)
- `supplier_audits` (1 day)
- `supplier_audit_findings` (1 day)

**API Endpoints:** 10 endpoints
**Services:** `supplier-quality-service.ts`
**Complexity:** Low (3 days)
**PRD FRs:** FR-QA-018, FR-QA-019

**Why Together?**
- Supplier ratings and audits are separate but related
- Audit findings depend on audits
- All three form supplier quality scorecard
- Simple CRUD with minimal complexity

**Migration:** `009_supplier_quality.sql`

---

### Story Group 10: Audit Trail & Compliance (Phase 4, Week 2)

**Tables:**
- `quality_audit_log` (2 days - triggers)
- `quality_document_versions` (2 days)
- `retention_samples` (1 day)

**API Endpoints:** 5 endpoints
**Services:** `quality-audit-service.ts`, `retention-sample-service.ts`
**Complexity:** Medium (5 days)
**PRD FRs:** FR-QA-021, FR-QA-023, FR-QA-024

**Why Together?**
- Audit log requires triggers on all tables (install last)
- Document versions track spec/plan changes
- Retention samples are independent but simple
- All three support compliance requirements

**Migration:** `010_audit_compliance.sql`

**Trigger Setup:**
```sql
-- Install triggers on all 25 quality tables
CREATE TRIGGER quality_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON quality_inspections
FOR EACH ROW EXECUTE FUNCTION log_quality_change();
```

**Compliance:**
- FDA 21 CFR Part 11
- Immutable audit trail
- Change reason capture
- 7-10 year retention

---

## Migration Sequencing

### Migration Order (Critical Path)

```
001_quality_foundation.sql           ← Story 1 (Specs, Holds, Settings)
002_inspections_testing.sql          ← Story 2 (Inspections, Tests, Sampling)
003_ncr_management.sql               ← Story 3 (NCR, Workflow, Supplier NCRs)
004_capa_management.sql              ← Story 4 (CAPA, Actions, Effectiveness)
005_operation_checkpoints.sql        ← Story 5 (Checkpoints, Results)
006_haccp_plans.sql                  ← Story 6 (Plans, CCPs, Verification)
007_haccp_monitoring.sql             ← Story 7 (Monitoring, Deviations)
008_certificates_of_analysis.sql     ← Story 8 (CoA, Templates, Parameters)
009_supplier_quality.sql             ← Story 9 (Ratings, Audits, Findings)
010_audit_compliance.sql             ← Story 10 (Audit Log, Versions, Retention)
```

**Rules:**
1. Migrations 001-002 must complete before 003 (NCR depends on inspections)
2. Migration 003 must complete before 004 (CAPA depends on NCR)
3. Migration 006 must complete before 007 (Monitoring depends on CCPs)
4. Migration 010 must be last (triggers on all tables)

**Parallel Streams:**
- Stream A: 001 → 002 → 003 → 004 (Core → Inspections → NCR → CAPA)
- Stream B: 005 (Checkpoints - independent)
- Stream C: 006 → 007 (HACCP Plans → Monitoring)
- Stream D: 008 (CoA - depends on 002)
- Stream E: 009 (Supplier - independent)
- Final: 010 (Audit - depends on all)

---

## Breaking Changes Assessment

### Adding Tables Incrementally (Safe)

**Scenario:** Implement Story 1 (Specs), then Story 2 (Inspections).

**Impact:** None. Foreign keys allow NULL or reference existing tables.

**Example:**
```sql
-- Migration 001: quality_specifications table created
-- Migration 002: quality_inspections table references quality_specifications
-- No breaking change: FK constraint validates existing spec_id
```

---

### Missing Parent Tables (BREAKING)

**Scenario:** Deploy Story 3 (NCR) before Story 2 (Inspections).

**Impact:** BREAKING. Foreign keys fail validation.

**Error:**
```sql
-- ncr_reports has FK to quality_inspections(id)
-- If quality_inspections doesn't exist:
ERROR: relation "quality_inspections" does not exist
```

**Solution:** Enforce migration order (see sequencing above).

---

### Cascade Delete Impact (Safe if Ordered)

**Scenario:** Delete inspection record that has test results.

**Impact:** Safe if child table exists. Cascade deletes test results.

**SQL:**
```sql
-- quality_test_results has ON DELETE CASCADE
DELETE FROM quality_inspections WHERE id = '...';
-- Automatically deletes from quality_test_results

-- Safe because:
-- 1. Child table exists (migration 002)
-- 2. FK constraint handles cascade
-- 3. RLS prevents unauthorized deletes
```

---

### Partial Feature Deployment (Acceptable)

**Scenario:** Deploy Inspections (Story 2) without NCR (Story 3).

**Impact:** Acceptable. Inspections work standalone. NCR is optional enhancement.

**Validation:**
- Inspections can be created, completed, pass/fail recorded
- Holds can be applied without NCR link
- NCR is enhancement, not blocker

---

## RLS Policy Checklist

### Per-Story RLS Requirements

**Story 1 (Foundation):**
- [ ] `quality_settings` org isolation
- [ ] `quality_specifications` org isolation + version conflict check
- [ ] `quality_spec_parameters` inherits from parent RLS
- [ ] `quality_holds` org isolation
- [ ] `quality_hold_items` inherits from parent RLS

**Story 2 (Inspections):**
- [ ] `sampling_plans` org isolation
- [ ] `sampling_records` inherits from parent RLS
- [ ] `quality_inspections` org isolation + inspector role check
- [ ] `quality_test_results` inherits from parent RLS

**Story 3 (NCR):**
- [ ] `ncr_reports` org isolation + creator can edit draft
- [ ] `ncr_workflow` inherits from parent RLS
- [ ] `supplier_ncrs` org isolation

**Story 4 (CAPA):**
- [ ] `capa_records` org isolation + owner can edit
- [ ] `capa_actions` inherits from parent RLS
- [ ] `capa_effectiveness_checks` inherits from parent RLS

**Story 5 (Checkpoints):**
- [ ] `operation_quality_checkpoints` org isolation
- [ ] `operation_checkpoint_results` org isolation

**Story 6 (HACCP Plans):**
- [ ] `haccp_plans` org isolation + approval role check
- [ ] `haccp_ccps` inherits from parent RLS
- [ ] `haccp_verification_records` org isolation

**Story 7 (HACCP Monitoring):**
- [ ] `haccp_monitoring_records` org isolation
- [ ] `haccp_deviations` org isolation

**Story 8 (CoA):**
- [ ] `coa_templates` org isolation
- [ ] `certificates_of_analysis` org isolation + QA Manager can issue
- [ ] `coa_parameters` inherits from parent RLS

**Story 9 (Supplier Quality):**
- [ ] `supplier_quality_ratings` org isolation
- [ ] `supplier_audits` org isolation
- [ ] `supplier_audit_findings` inherits from parent RLS

**Story 10 (Audit):**
- [ ] `quality_audit_log` INSERT-only policy (no UPDATE/DELETE)
- [ ] `quality_document_versions` INSERT-only policy
- [ ] `retention_samples` org isolation

---

## Performance Checklist

### Per-Story Index Requirements

**Story 1 (Foundation):**
- [ ] `idx_specs_org_product` on `quality_specifications(org_id, product_id, status)`
- [ ] `idx_specs_effective` on `quality_specifications(effective_date, expiry_date)`
- [ ] `idx_holds_org_status` on `quality_holds(org_id, status)`

**Story 2 (Inspections):**
- [ ] `idx_inspections_org_status` on `quality_inspections(org_id, status, inspection_type)`
- [ ] `idx_inspections_ref` on `quality_inspections(reference_type, reference_id)`
- [ ] `idx_test_results_inspection` on `quality_test_results(inspection_id)`
- [ ] `idx_test_results_param` on `quality_test_results(parameter_id)`

**Story 3 (NCR):**
- [ ] `idx_ncr_org_status` on `ncr_reports(org_id, status, severity)`
- [ ] `idx_ncr_supplier` on `ncr_reports(supplier_id)` WHERE supplier_id IS NOT NULL
- [ ] `idx_ncr_workflow_ncr` on `ncr_workflow(ncr_id, sequence)`

**Story 4 (CAPA):**
- [ ] `idx_capa_org_status` on `capa_records(org_id, status, priority)`
- [ ] `idx_capa_owner` on `capa_records(owner_id)`
- [ ] `idx_capa_actions_capa` on `capa_actions(capa_id, sequence)`

**Story 5 (Checkpoints):**
- [ ] `idx_checkpoints_routing` on `operation_quality_checkpoints(routing_id)`
- [ ] `idx_checkpoints_operation` on `operation_quality_checkpoints(operation_id)`
- [ ] `idx_checkpoint_results_wo` on `operation_checkpoint_results(work_order_id)`

**Story 6 (HACCP Plans):**
- [ ] `idx_haccp_plans_product` on `haccp_plans(product_id, status)`
- [ ] `idx_ccps_plan` on `haccp_ccps(haccp_plan_id, ccp_number)`

**Story 7 (HACCP Monitoring):**
- [ ] `idx_ccp_monitoring_ccp_date` on `haccp_monitoring_records(ccp_id, monitored_at DESC)`
- [ ] `idx_ccp_monitoring_wo` on `haccp_monitoring_records(wo_id)`
- [ ] `idx_ccp_deviations_ccp` on `haccp_deviations(ccp_id, detected_at DESC)`

**Story 8 (CoA):**
- [ ] `idx_coa_org_batch` on `certificates_of_analysis(org_id, batch_id)`
- [ ] `idx_coa_product` on `certificates_of_analysis(product_id)`

**Story 9 (Supplier Quality):**
- [ ] `idx_supplier_ratings_supplier` on `supplier_quality_ratings(supplier_id, rating_period)`
- [ ] `idx_supplier_audits_supplier` on `supplier_audits(supplier_id, audit_date DESC)`

**Story 10 (Audit):**
- [ ] `idx_audit_log_entity` on `quality_audit_log(entity_type, entity_id, timestamp DESC)`
- [ ] `idx_audit_log_date` on `quality_audit_log(org_id, timestamp DESC)`

---

## Story Summary Table

| Story | Tables | Complexity | Est. Days | Phase | Dependencies | Migration |
|-------|--------|------------|-----------|-------|--------------|-----------|
| 06.1 | 5 (Specs, Holds) | Medium | 6 | 1 | Epic 01, 02 | 001 |
| 06.2 | 4 (Inspections) | High | 7 | 1 | 06.1 | 002 |
| 06.3 | 3 (NCR) | Very High | 8 | 2 | 06.2 | 003 |
| 06.4 | 3 (CAPA) | High | 7 | 2 | 06.3 | 004 |
| 06.5 | 2 (Checkpoints) | Medium | 4 | 2 | Epic 02, 04 | 005 |
| 06.6 | 3 (HACCP Plans) | Medium | 6 | 3 | Epic 02 | 006 |
| 06.7 | 2 (HACCP Monitoring) | Very High | 6 | 3 | 06.6, Epic 04 | 007 |
| 06.8 | 3 (CoA) | Medium | 4 | 3 | 06.2 | 008 |
| 06.9 | 3 (Supplier Quality) | Low | 3 | 4 | Epic 03 | 009 |
| 06.10 | 3 (Audit) | Medium | 5 | 4 | All | 010 |

**Total:** 31 tables (28 + 3 duplicates in groups), 10 stories, 56 days (11.2 weeks)

---

## Risk Assessment

### High-Risk Areas

**1. HACCP Monitoring (Story 07.7)**
- **Risk:** High-frequency inserts (10,000/day) may degrade performance
- **Mitigation:**
  - Batch insert API endpoint
  - Partitioning after 1M records
  - Async processing for alerts
  - Cache last reading per CCP

**2. Audit Log Triggers (Story 06.10)**
- **Risk:** Triggers on all 27 tables may slow writes
- **Mitigation:**
  - Async trigger processing (pg_notify)
  - Exclude high-frequency tables from detailed logging
  - Batch audit log inserts

**3. NCR Workflow State Machine (Story 06.3)**
- **Risk:** Complex business rules, state transitions may have bugs
- **Mitigation:**
  - Unit tests for all state transitions
  - Service layer validates transitions
  - Audit trail on all state changes

**4. Cross-Module Dependencies (Story 06.5)**
- **Risk:** Operation checkpoints depend on Epic 02 (Routings) and Epic 04 (WO)
- **Mitigation:**
  - Defer to Phase 2 (after Epic 02/04 complete)
  - Mock data for testing
  - Feature flag to enable/disable

---

### Data Migration Concerns

**Scenario:** Add Quality module to existing MonoPilot deployment with production data.

**Challenge:** Existing work orders, inspections may need retroactive quality data.

**Approach:**
1. **Seed Scripts:** Create default specs for existing products
2. **Backfill:** Optionally create historical inspection records (manual)
3. **Hold Status:** Default existing LPs to `PASSED` status
4. **NCR Linking:** Allow manual linking of old issues to new NCR system

**SQL Example:**
```sql
-- Backfill default specs for all products
INSERT INTO quality_specifications (org_id, product_id, name, status)
SELECT org_id, id, name || ' Specification', 'draft'
FROM products
WHERE NOT EXISTS (
  SELECT 1 FROM quality_specifications
  WHERE product_id = products.id
);
```

---

## Recommendations

### MVP Scope (Phase 1)

**Include:**
- Story 06.1 (Foundation): Specs, holds, settings
- Story 06.2 (Inspections): Incoming inspection only

**Defer:**
- Story 06.3 (NCR): To Phase 2 (complex workflow)
- Story 06.5 (Checkpoints): To Phase 2 (depends on Epic 04)
- Stories 06.6-06.10: To Phase 3-4

**Rationale:**
- Incoming inspection is highest value (blocks bad materials)
- NCR workflow can be manual (spreadsheet) initially
- HACCP/CCP is Phase 3 regulatory compliance feature

---

### Story Sequencing for Development

**Sprint 1 (Phase 1):**
- Story 06.1 (Foundation) - 6 days

**Sprint 2 (Phase 1):**
- Story 06.2 (Inspections) - 7 days

**Sprint 3 (Phase 2):**
- Story 06.3 (NCR) - 8 days

**Sprint 4 (Phase 2):**
- Story 06.4 (CAPA) - 7 days
- Story 06.5 (Checkpoints) - 4 days (parallel if Epic 04 ready)

**Sprint 5 (Phase 3):**
- Story 06.6 (HACCP Plans) - 6 days
- Story 06.8 (CoA) - 4 days (parallel)

**Sprint 6 (Phase 3):**
- Story 06.7 (HACCP Monitoring) - 6 days

**Sprint 7 (Phase 4):**
- Story 06.9 (Supplier Quality) - 3 days
- Story 06.10 (Audit) - 5 days

**Total:** 56 days = 11.2 weeks = 3 months (with parallelization)

---

### Testing Strategy

**Per-Story Tests:**

**Unit Tests (Vitest):**
- Service layer methods (CRUD)
- Validation schemas (Zod)
- State machine transitions (NCR, CAPA)
- Business rule enforcement

**Integration Tests (Playwright):**
- API endpoint coverage (80%+)
- RLS policy enforcement
- Cascade delete behavior
- Cross-table FK validation

**E2E Tests (Playwright):**
- Incoming inspection flow (Story 06.2)
- NCR workflow (Story 06.3)
- CCP monitoring → deviation → NCR (Story 06.7)
- CoA generation (Story 06.8)

---

## Conclusion

**Story Breakdown Summary:**
- **10 stories** grouped by table clusters
- **28 tables** across 7 categories
- **56 days** total effort (11.2 weeks)
- **4 phases** aligned with PRD roadmap

**Critical Success Factors:**
1. **Migration Order:** Follow 001-010 sequencing (no skips)
2. **RLS Policies:** 100% coverage on all tables
3. **Performance:** Index all high-traffic queries
4. **Compliance:** Immutable audit trail (FDA 21 CFR Part 11)
5. **Testing:** 80%+ coverage per story

**Next Steps:**
1. Review with Architect Agent for validation
2. Create `.context.yaml` files for each story
3. Define API endpoint specs per story
4. Create wireframe mockups for UX
5. Assign complexity estimates (S/M/L/XL)

---

**Report Status:** Complete
**Analyst:** Database-Schema-Analyzer Agent
**Date:** 2025-12-16
**Next Review:** Architect Agent validation
