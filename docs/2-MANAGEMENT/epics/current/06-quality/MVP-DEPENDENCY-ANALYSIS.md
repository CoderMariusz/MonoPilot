# Epic 06 Quality - MVP Dependency Analysis

**Date:** 2025-12-16
**Status:** MULTIPLE HARD DEPENDENCIES IDENTIFIED
**Conclusion:** Epic 06 has cascading dependencies across Settings, Technical, Planning, Production, and Warehouse. Recommend 4-Phase Incremental strategy with clear dependency gates.

---

## Executive Summary

Analysis of Epic 06 (Quality Module) reveals **complex multi-module dependencies** affecting 27 functional requirements across 4 planned phases. The Quality module is unique in that it touches ALL other operational modules (Planning, Production, Warehouse, Shipping).

**Key Finding:** Epic 06 requires staggered implementation tied to upstream module completion. However, 7 foundational stories (Phase 1A) can proceed immediately with ONLY Epic 01.1 + Epic 02.1 dependencies.

**Recommendation:** Implement **4-Phase Incremental Strategy** aligned with upstream completion:
- **Phase 1A (Foundation)**: 7 stories, 8-12 days - Requires ONLY 01.1 + 02.1
- **Phase 1B (Incoming)**: 5 stories, 10-14 days - Requires 03.3 (PO) + 05.1 (LP)
- **Phase 2 (In-Process/Final)**: 8 stories, 14-20 days - Requires 04.6-04.7 (Production)
- **Phase 3 (HACCP/CoA/CAPA)**: 7 stories, 14-18 days - Requires Phase 2 complete

---

## Module Dependency Matrix

```
+-----------------------------------------------------------------------------+
|              QUALITY MODULE REQUIRES FROM UPSTREAM EPICS                     |
+-------------+-------------+-------------+-------------+---------------------+
| Quality     | Settings    | Technical   | Planning    | Production          |
| Needs       | Epic 01     | Epic 02     | Epic 03     | Epic 04             |
+-------------+-------------+-------------+-------------+---------------------+
| Org + RLS   | HARD        | -           | -           | -                   |
| Users       | HARD        | -           | -           | -                   |
| Roles (QA)  | HARD        | -           | -           | -                   |
+-------------+-------------+-------------+-------------+---------------------+
| Warehouses  | SOFT        | -           | -           | -                   |
| Locations   | SOFT        | -           | -           | -                   |
| Machines    | OPTIONAL    | -           | -           | -                   |
+-------------+-------------+-------------+-------------+---------------------+
| Products    | -           | HARD        | -           | -                   |
| BOMs        | -           | OPTIONAL    | -           | -                   |
| Routings    | -           | OPTIONAL*   | -           | -                   |
| Allergens   | -           | SOFT        | -           | -                   |
+-------------+-------------+-------------+-------------+---------------------+
| PO          | -           | -           | HARD (Ph1B) | -                   |
| Suppliers   | -           | -           | SOFT (Ph4)  | -                   |
+-------------+-------------+-------------+-------------+---------------------+
| WO          | -           | -           | HARD (Ph2)  | HARD (Phase 2)      |
| wo_ops      | -           | -           | HARD (Ph2)  | HARD (Phase 2)      |
| Output LPs  | -           | -           | -           | HARD (Phase 2)      |
+-------------+-------------+-------------+-------------+---------------------+
| License Plates | -        | -           | -           | -                   |
| (from Warehouse)| -        | -           | -           | HARD (Phase 1B+)    |
| LP QA Status   | -        | -           | -           | HARD (Phase 1B)     |
+-------------+-------------+-------------+-------------+---------------------+

+-----------------------------------------------------------------------------+
|              QUALITY MODULE PROVIDES TO DOWNSTREAM EPICS                     |
+-------------+-------------+-------------+-------------+---------------------+
| Quality     | Warehouse   | Shipping    | Production  | Finance             |
| Provides    | Epic 05     | Epic 07     | Epic 04     | Epic 09             |
+-------------+-------------+-------------+-------------+---------------------+
| QA Status   | HARD        | HARD        | SOFT        | -                   |
| Holds       | HARD        | HARD        | SOFT        | -                   |
| CoA Docs    | -           | HARD        | -           | -                   |
| Specs       | SOFT        | SOFT        | -           | -                   |
| NCR Data    | -           | -           | SOFT        | SOFT                |
| CCP Alerts  | -           | -           | HARD        | -                   |
| Batch Release| -          | HARD        | -           | -                   |
+-------------+-------------+-------------+-------------+---------------------+

Legend:
- HARD = System breaks without it (critical path blocker)
- SOFT = Works but limited functionality
- OPTIONAL = Feature works if present, gracefully handles absence
- OPTIONAL* = Required only for specific features (FR-QA-026 operation checkpoints)
- (PhaseX) = Required only in specific phase
```

---

## Dependency Graph (Visual)

```
                         +------------------+
                         |   SETTINGS       |
                         |   Epic 01.1      |
                         |   (Org+RLS+Users)|
                         +--------+---------+
                                  |
                                  | HARD
                                  v
                         +------------------+
                         |   TECHNICAL      |
                         |   Epic 02.1      |
                         |   (Products)     |
                         +--------+---------+
                                  |
                                  | HARD (Phase 1A)
                                  v
                         +------------------+
                         |  QUALITY PHASE 1A|
                         |  (Foundation)    |
                         |  7 Stories       |
                         | - Specs          |
                         | - Holds          |
                         | - Settings       |
                         +--------+---------+
                                  |
         +------------------------+------------------------+
         |                        |                        |
         v                        v                        v
+----------------+       +----------------+       +----------------+
| PLANNING       |       | WAREHOUSE      |       | PRODUCTION     |
| Epic 03.3      |       | Epic 05.1      |       | Epic 04.6-04.7 |
| (PO)           |       | (LP+QA Status) |       | (Consume/Out)  |
+-------+--------+       +-------+--------+       +-------+--------+
        |                        |                        |
        +------------------------+                        |
                     |                                    |
                     v                                    |
            +------------------+                          |
            | QUALITY PHASE 1B |                          |
            | (Incoming Insp)  |                          |
            | 5 Stories        |                          |
            | - PO Inspection  |                          |
            | - LP QA Update   |                          |
            +--------+---------+                          |
                     |                                    |
                     +------------------------------------+
                                     |
                                     v
                            +------------------+
                            | QUALITY PHASE 2  |
                            | (In-Proc/Final)  |
                            | 8 Stories        |
                            | - WO Inspections |
                            | - Batch Release  |
                            | - NCR Workflow   |
                            | - Op Checkpoints |
                            +--------+---------+
                                     |
                                     v
                            +------------------+
                            | QUALITY PHASE 3  |
                            | (HACCP/CoA/CAPA) |
                            | 7 Stories        |
                            | - HACCP Plans    |
                            | - CCP Monitoring |
                            | - CoA Generation |
                            | - CAPA Workflow  |
                            +------------------+
                                     |
                                     v
                            +------------------+
                            |   SHIPPING       |
                            |   Epic 07        |
                            | (Needs CoA +     |
                            |  Batch Release)  |
                            +------------------+
```

---

## Phase-by-Phase Dependency Breakdown

### Phase 1A: Foundation (7 Stories, 8-12 days)

**Goal:** Build core quality infrastructure independent of inspection workflows

**Hard Dependencies:**
- Epic 01.1 (Org Context + RLS) - REQUIRED FIRST
- Epic 02.1 (Products CRUD) - REQUIRED FIRST
- Users with QA Inspector, QA Manager roles - REQUIRED FIRST

**Soft Dependencies:**
- None

**Optional Dependencies:**
- Epic 01.10 (Machines) - For equipment calibration tracking (graceful null)

**Stories:**

| Story | Name | PRD FRs | Complexity | Days | Hard Deps | Creates |
|-------|------|---------|------------|------|-----------|---------|
| 06.0 | Quality Settings | FR-QA-* | S | 1 | 01.1 | quality_settings |
| 06.1 | Quality Status Management | FR-QA-001 | M | 2 | 01.1 | Status enum + service |
| 06.2 | Product Specifications | FR-QA-003 | L | 3 | 02.1 | quality_specifications |
| 06.3 | Test Templates & Parameters | FR-QA-004 | M | 2 | 06.2 | quality_spec_parameters |
| 06.4 | Quality Holds Management | FR-QA-002 | L | 3 | 01.1, 06.1 | quality_holds, hold_items |
| 06.5 | Sampling Plans (AQL) | FR-QA-008 | M | 2 | 06.2 | sampling_plans |
| 06.6 | NCR Creation (Basic) | FR-QA-009 | M | 2 | 06.1 | ncr_reports |

**Total:** 7 stories, 15 days (8-12 with parallelization)

**Deliverables:**
- `quality_settings` table with org-level configuration
- `quality_specifications` table linked to products
- `quality_spec_parameters` table with min/max/target values
- `quality_holds` table with generic reference_type pattern
- `quality_hold_items` table for multi-entity holds
- `sampling_plans` table with AQL tables
- `ncr_reports` table for basic NCR logging
- Specification editor UI (product → specs → parameters)
- Hold creation/release workflow UI
- NCR creation form UI

**Why Phase 1A Can Start Now:**
- No inspection workflow dependencies
- No LP dependencies (holds use generic reference pattern)
- No WO/PO dependencies (specs are product-level)
- Creates foundation tables for all quality operations

**User Value (Immediate):**
- Quality team can define product specifications
- Manual quality holds can be created (better than Excel)
- NCR tracking begins (issue documentation)
- Sampling plans configured (statistical QA ready)
- Quality settings configured (auto-numbering, defaults)

**Graceful Degradation:**
- Holds work without LPs (reference_type='batch', 'po', 'wo')
- Specs exist even without inspections yet
- NCRs can be logged manually

---

### Phase 1B: Incoming Inspection (5 Stories, 10-14 days)

**Goal:** Enable incoming material quality control at PO receipt

**Hard Dependencies:**
- Phase 1A complete - REQUIRED
- Epic 03.3 (Purchase Orders CRUD) - REQUIRED
- Epic 05.1 (License Plates table + basic service) - REQUIRED
- Epic 05.7 (LP QA Status management) - REQUIRED

**Why LP Dependency is HARD:**
- Incoming inspection MUST reference received LPs
- Inspection results MUST update LP.qa_status field
- Quality holds MUST block LP.status from 'available'
- Without LP table, incoming inspection cannot function

**Stories:**

| Story | Name | PRD FRs | Complexity | Days | Hard Deps | Creates |
|-------|------|---------|------------|------|-----------|---------|
| 06.7 | Inspections CRUD + Queue | FR-QA-005 | L | 3 | 06.2, 05.1 | quality_inspections |
| 06.8 | Test Results Recording | FR-QA-004 | M | 2 | 06.7, 06.3 | quality_test_results |
| 06.9 | Incoming Inspection Flow | FR-QA-005 | L | 3 | 03.3, 05.1, 06.7 | Inspection workflow |
| 06.10 | Inspection Completion Logic | FR-QA-005 | M | 2 | 06.9 | Pass/fail logic |
| 06.11 | LP QA Status Integration | FR-QA-005 | M | 2 | 05.7, 06.10 | LP qa_status update |

**Total:** 5 stories, 12 days (10-14 with parallelization)

**Deliverables:**
- `quality_inspections` table (type='incoming')
- `quality_test_results` table linked to spec parameters
- Inspection queue UI (scheduled, in-progress, completed)
- Test results entry form with pass/fail per parameter
- PO receipt complete → auto-create inspection trigger
- Inspection pass → Update LP.qa_status='passed'
- Inspection fail → Create quality hold + LP.qa_status='failed'
- Scanner test result capture UI

**Integration Points:**

```typescript
// Epic 05 Warehouse → Epic 06 Quality
// GRN Complete event triggers incoming inspection

// Event: PO Receipt Complete (Epic 05)
supabaseClient
  .channel('po-receipts')
  .on('INSERT', { table: 'grn_items' }, async (payload) => {
    // Auto-create incoming inspection
    await createInspection({
      org_id: payload.new.org_id,
      type: 'incoming',
      reference_type: 'po',
      reference_id: payload.new.po_id,
      product_id: payload.new.product_id,
      lp_id: payload.new.lp_id,  // REQUIRES Epic 05 LP table
      status: 'scheduled'
    });
  });

// Inspection completion updates LP QA status
async function completeInspection(inspectionId: string, result: 'pass' | 'fail') {
  const inspection = await getInspection(inspectionId);

  // Update inspection
  await updateInspection(inspectionId, {
    status: 'completed',
    result: result,
    completed_at: new Date()
  });

  // Update LP QA Status (REQUIRES Epic 05.7)
  if (inspection.lp_id) {
    await updateLPQAStatus(inspection.lp_id, result === 'pass' ? 'passed' : 'failed');
  }

  // Create hold on fail
  if (result === 'fail') {
    await createQualityHold({
      reason: `Failed incoming inspection ${inspection.inspection_number}`,
      hold_type: 'qa_pending',
      reference_type: 'lp',
      reference_id: inspection.lp_id
    });
  }
}
```

**User Value:**
- Inspect received materials before use
- Automated workflow from PO receipt
- Block failed materials from production
- Track test results with audit trail
- Scanner-friendly mobile QA

**Critical Blocker:**
Without Epic 05 LP table, Phase 1B CANNOT ship. This is a HARD dependency.

---

### Phase 2: In-Process & Final Inspection (8 Stories, 14-20 days)

**Goal:** Enable production quality control and batch release

**Hard Dependencies:**
- Phase 1B complete - REQUIRED
- Epic 03.10 (Work Orders CRUD) - REQUIRED
- Epic 04.6 (Material Consumption) - REQUIRED
- Epic 04.7 (Output Registration) - REQUIRED
- Epic 04.3 (Operation Start/Complete) - REQUIRED

**Soft Dependencies:**
- Epic 02.7/02.8 (Routings + Operations) - For FR-QA-026 operation checkpoints (can defer)

**Why Production Dependency is HARD:**
- In-process inspection MUST reference WO operations
- Final inspection MUST validate output LPs
- Batch release MUST check WO completion
- Operation checkpoints MUST link to routing operations

**Stories:**

| Story | Name | PRD FRs | Complexity | Days | Hard Deps | Creates |
|-------|------|---------|------------|------|-----------|---------|
| 06.12 | In-Process Inspection | FR-QA-006 | L | 3 | 03.10, 04.3, 06.7 | Inspection (type=in_process) |
| 06.13 | Final Inspection | FR-QA-007 | L | 3 | 04.7, 06.7 | Inspection (type=final) |
| 06.14 | Batch Release Approval | FR-QA-010 | M | 2 | 06.13 | Batch release workflow |
| 06.15 | NCR Workflow State Machine | FR-QA-009 | L | 3 | 06.6 | ncr_workflow |
| 06.16 | Operation Quality Checkpoints | FR-QA-026 | L | 3 | 02.7, 04.3 | operation_quality_checkpoints |
| 06.17 | Checkpoint Results & Sign-off | FR-QA-026 | M | 2 | 06.16 | operation_checkpoint_results |
| 06.18 | Scanner Integration (QA) | FR-QA-025 | M | 2 | 06.8, 06.17 | Mobile scanner UI |
| 06.19 | Quality Dashboard | FR-QA-020 | M | 2 | All Phase 2 | Dashboard KPIs |

**Total:** 8 stories, 20 days (14-20 with parallelization)

**Deliverables:**
- In-process inspection workflow (WO operation → inspection)
- Final inspection workflow (WO complete → inspection)
- Batch release check (all inspections pass, all CCPs within limits)
- `ncr_workflow` table with state machine
- `operation_quality_checkpoints` table linked to routing operations
- `operation_checkpoint_results` table with operator sign-off
- Scanner UI for test results + checkpoint results
- Real-time quality dashboard (KPIs, alerts, inspection queue)

**Integration Points:**

```typescript
// Epic 04 Production → Epic 06 Quality

// Operation Complete triggers checkpoint check
async function handleOperationComplete(operationId: string) {
  const operation = await getOperation(operationId);

  // Check for quality checkpoints (FR-QA-026)
  const checkpoints = await getCheckpointsForOperation(operation.routing_operation_id);

  if (checkpoints.length > 0) {
    // Prompt operator to record checkpoint results
    return {
      requires_checkpoint: true,
      checkpoints: checkpoints
    };
  }
}

// WO Complete triggers final inspection
async function handleWOComplete(woId: string) {
  const wo = await getWorkOrder(woId);

  // Auto-create final inspection
  await createInspection({
    type: 'final',
    reference_type: 'wo',
    reference_id: woId,
    product_id: wo.product_id,
    status: 'scheduled'
  });
}

// Batch release check (gates Epic 07 Shipping)
async function checkBatchRelease(batchNumber: string): Promise<boolean> {
  // All inspections must pass
  const inspections = await getInspectionsForBatch(batchNumber);
  const allPass = inspections.every(i => i.result === 'pass');

  // All CCP monitoring must be within limits (Phase 3)
  const ccpRecords = await getCCPRecordsForBatch(batchNumber);
  const allCCPPass = ccpRecords.every(r => r.within_limits === true);

  // All operation checkpoints must pass
  const checkpoints = await getCheckpointResultsForBatch(batchNumber);
  const allCheckpointsPass = checkpoints.every(c => c.result_status === 'pass');

  return allPass && allCCPPass && allCheckpointsPass;
}
```

**User Value:**
- Inspect WIP at critical operations
- Record operation checkpoint results (FR-QA-026)
- Validate finished goods before release
- Block shipment of failed batches
- Track full NCR lifecycle (investigation → corrective action → close)
- Mobile quality checks on shop floor

**Critical Blocker:**
Without Epic 04 Production Phase 1, Phase 2 CANNOT ship. This is a HARD dependency.

---

### Phase 3: HACCP, CoA, CAPA (7 Stories, 14-18 days)

**Goal:** Enable food safety compliance (HACCP) and advanced quality features

**Hard Dependencies:**
- Phase 2 complete - REQUIRED
- Epic 04.3 (Operation Start/Complete) - REQUIRED (for CCP monitoring)
- Epic 06.13 (Final Inspection) - REQUIRED (for CoA generation)

**Soft Dependencies:**
- Epic 01.10 (Machines) - For equipment reference in CCPs (nullable FK)

**Stories:**

| Story | Name | PRD FRs | Complexity | Days | Hard Deps | Creates |
|-------|------|---------|------------|------|-----------|---------|
| 06.20 | HACCP Plans Management | FR-QA-013 | L | 3 | 02.1 | haccp_plans |
| 06.21 | CCP Setup & Configuration | FR-QA-013 | M | 2 | 06.20 | haccp_ccps |
| 06.22 | CCP Monitoring (Desktop+Scanner) | FR-QA-014 | L | 3 | 06.21, 04.3 | haccp_monitoring_records |
| 06.23 | CCP Deviation Handling & Alerts | FR-QA-015 | M | 2 | 06.22 | haccp_deviations |
| 06.24 | CAPA Creation & Workflow | FR-QA-016-017 | L | 3 | 06.15 | capa_records, capa_actions |
| 06.25 | CoA Templates & Generation | FR-QA-011-012 | L | 3 | 06.13 | coa_templates, certificates_of_analysis |
| 06.26 | CoA PDF Export & Delivery | FR-QA-011 | M | 2 | 06.25 | PDF generation |

**Total:** 7 stories, 18 days (14-18 with parallelization)

**Deliverables:**
- `haccp_plans` table (product-specific plans)
- `haccp_ccps` table (critical control points with limits)
- `haccp_monitoring_records` table (real-time CCP values)
- `haccp_deviations` table (out-of-limit alerts)
- `capa_records` table (corrective/preventive actions)
- `capa_actions` table (action items with owners)
- `coa_templates` table (customer-specific templates)
- `certificates_of_analysis` table (batch CoA documents)
- CCP monitoring UI (desktop + scanner)
- CCP deviation alerts (email + SMS)
- CAPA workflow management UI
- CoA PDF generation (pdfmake library)

**Integration Points:**

```typescript
// CCP Monitoring during production

async function recordCCPValue(params: {
  ccp_id: string;
  wo_id: string;
  operation_id: string;
  measured_value: number;
  monitored_by: string;
}) {
  const ccp = await getCCP(params.ccp_id);

  // Validate against critical limits
  const within_limits =
    params.measured_value >= ccp.critical_limit_min &&
    params.measured_value <= ccp.critical_limit_max;

  // Create monitoring record
  const record = await createCCPMonitoringRecord({
    ...params,
    within_limits,
    monitored_at: new Date()
  });

  // Alert on deviation
  if (!within_limits) {
    await createCCPDeviation({
      ccp_id: params.ccp_id,
      monitoring_record_id: record.id,
      deviation_type: params.measured_value < ccp.critical_limit_min ? 'under_limit' : 'over_limit',
      severity: 'critical',
      detected_at: new Date(),
      measured_value: params.measured_value,
      limit_value: params.measured_value < ccp.critical_limit_min ? ccp.critical_limit_min : ccp.critical_limit_max
    });

    // Send alerts (email + SMS)
    await sendCCPDeviationAlert(record.id);

    // Auto-create NCR (if setting enabled)
    if (await getSetting('ccp_auto_create_ncr')) {
      await createNCR({
        title: `CCP Deviation: ${ccp.step_name}`,
        severity: 'critical',
        reference_type: 'ccp_deviation',
        reference_id: record.id
      });
    }
  }

  return record;
}

// CoA Generation after final inspection

async function generateCoA(batchNumber: string) {
  // Get final inspection results
  const inspection = await getFinalInspection(batchNumber);
  if (inspection.result !== 'pass') {
    throw new Error('Cannot generate CoA for failed batch');
  }

  // Get test results
  const testResults = await getTestResults(inspection.id);

  // Get CoA template
  const template = await getCoATemplate(inspection.product_id);

  // Generate CoA document
  const coa = await createCoA({
    batch_id: batchNumber,
    product_id: inspection.product_id,
    inspection_id: inspection.id,
    template_id: template.id,
    issue_date: new Date(),
    status: 'draft'
  });

  // Add parameters from test results
  for (const result of testResults) {
    await createCoAParameter({
      coa_id: coa.id,
      parameter_name: result.parameter_name,
      specification: `${result.min_value} - ${result.max_value}`,
      result: result.measured_value,
      method: result.test_method,
      pass_fail: result.result_status
    });
  }

  // Generate PDF (pdfmake)
  const pdfUrl = await generateCoAPDF(coa.id);

  // Update CoA
  await updateCoA(coa.id, {
    document_url: pdfUrl,
    status: 'issued'
  });

  return coa;
}
```

**User Value:**
- HACCP compliance (FDA 21 CFR, FSMA)
- Real-time CCP monitoring with alerts
- Automatic deviation handling
- CAPA workflow for systemic issues
- Professional CoA documents for customers
- Complete audit trail for regulators

**Enables:**
- Epic 07 Shipping (CoA required for customer delivery)
- Regulatory audits (full traceability + HACCP records)

---

## Story Index with Dependencies

### Phase 1A: Foundation (Start Immediately)

| Story | Name | Days | Hard Deps | Creates | Blocks |
|-------|------|------|-----------|---------|--------|
| 06.0 | Quality Settings | 1 | 01.1 | quality_settings | All stories |
| 06.1 | QA Status Management | 2 | 01.1 | Status enum | 06.4, 06.6 |
| 06.2 | Product Specifications | 3 | 02.1 | quality_specifications | 06.3, 06.5, 06.7 |
| 06.3 | Test Parameters | 2 | 06.2 | quality_spec_parameters | 06.8 |
| 06.4 | Quality Holds | 3 | 01.1, 06.1 | quality_holds, hold_items | 06.10 |
| 06.5 | Sampling Plans | 2 | 06.2 | sampling_plans | 06.9 |
| 06.6 | NCR Basic | 2 | 06.1 | ncr_reports | 06.15 |

**Total:** 7 stories, 15 days (8-12 with parallelization)

**Provides To:**
- Phase 1B (specs, holds, settings)
- All downstream phases

---

### Phase 1B: Incoming Inspection (After Epic 03.3 + 05.1)

| Story | Name | Days | Hard Deps | Creates | Blocks |
|-------|------|------|-----------|---------|--------|
| 06.7 | Inspections CRUD | 3 | 06.2, 05.1 | quality_inspections | 06.8, 06.9 |
| 06.8 | Test Results | 2 | 06.7, 06.3 | quality_test_results | 06.10 |
| 06.9 | Incoming Inspection | 3 | 03.3, 05.1, 06.7 | Inspection workflow | 06.10 |
| 06.10 | Inspection Complete | 2 | 06.9 | Pass/fail logic | 06.11 |
| 06.11 | LP QA Status | 2 | 05.7, 06.10 | LP integration | Warehouse |

**Total:** 5 stories, 12 days (10-14 with parallelization)

**Provides To:**
- Warehouse (LP QA status updates)
- Phase 2 (inspection foundation)

---

### Phase 2: In-Process & Final (After Epic 04.6-04.7)

| Story | Name | Days | Hard Deps | Creates | Blocks |
|-------|------|------|-----------|---------|--------|
| 06.12 | In-Process Inspection | 3 | 03.10, 04.3 | Inspection (in-process) | 06.19 |
| 06.13 | Final Inspection | 3 | 04.7, 06.7 | Inspection (final) | 06.14, 06.25 |
| 06.14 | Batch Release | 2 | 06.13 | Release workflow | Shipping |
| 06.15 | NCR Workflow | 3 | 06.6 | ncr_workflow | 06.24 |
| 06.16 | Operation Checkpoints | 3 | 02.7, 04.3 | op_quality_checkpoints | 06.17 |
| 06.17 | Checkpoint Results | 2 | 06.16 | op_checkpoint_results | 06.19 |
| 06.18 | Scanner Integration | 2 | 06.8 | Mobile UI | Shop floor |
| 06.19 | Quality Dashboard | 2 | All Phase 2 | Dashboard | Management |

**Total:** 8 stories, 20 days (14-20 with parallelization)

**Provides To:**
- Shipping (batch release gate)
- Phase 3 (inspection + NCR foundation)

---

### Phase 3: HACCP, CoA, CAPA (After Phase 2)

| Story | Name | Days | Hard Deps | Creates | Blocks |
|-------|------|------|-----------|---------|--------|
| 06.20 | HACCP Plans | 3 | 02.1 | haccp_plans | 06.21 |
| 06.21 | CCP Setup | 2 | 06.20 | haccp_ccps | 06.22 |
| 06.22 | CCP Monitoring | 3 | 06.21, 04.3 | haccp_monitoring_records | 06.23 |
| 06.23 | CCP Deviations | 2 | 06.22 | haccp_deviations | Compliance |
| 06.24 | CAPA Workflow | 3 | 06.15 | capa_records, actions | Compliance |
| 06.25 | CoA Generation | 3 | 06.13 | coa_templates, certificates | 06.26 |
| 06.26 | CoA PDF Export | 2 | 06.25 | PDF generation | Shipping |

**Total:** 7 stories, 18 days (14-18 with parallelization)

**Provides To:**
- Shipping (CoA documents)
- Regulatory compliance (HACCP, CAPA)

---

### Phase 4: Supplier & Analytics (Deferred)

| Story | Name | Days | Hard Deps | Notes |
|-------|------|------|-----------|-------|
| 06.X | Supplier Ratings | 3 | 03.1, 06.9 | After incoming stable |
| 06.X | Supplier Audits | 2 | 06.X | Phase 4+ |
| 06.X | Quality Analytics | 3 | 06.19 | Phase 4+ |
| 06.X | Audit Trail Reports | 2 | All | Phase 4+ |
| 06.X | Retention Samples | 2 | 06.13 | Phase 4+ |
| 06.X | Document Control | 2 | 06.2 | Phase 4+ |

**Total:** 6 stories, 14 days (11-15 with parallelization) - DEFERRED

---

## Effort Estimation

### By Phase (1 developer)

| Phase | Stories | Days | Cumulative | Hard Blockers |
|-------|---------|------|------------|---------------|
| Phase 1A: Foundation | 7 | 8-12 | 8-12 | None (01.1 + 02.1 available) |
| Phase 1B: Incoming | 5 | 10-14 | 18-26 | Epic 03.3, 05.1 |
| Phase 2: In-Proc/Final | 8 | 14-20 | 32-46 | Epic 04.6-04.7 |
| Phase 3: HACCP/CoA/CAPA | 7 | 14-18 | 46-64 | Phase 2 complete |
| **Total Ready** | **27** | **46-64 days** | - | - |
| Phase 4: Supplier/Analytics | 6 | 11-15 | 57-79 | Deferred |

### By Priority

| Priority | Stories | Days | Notes |
|----------|---------|------|-------|
| P0 (MVP Core) | 12 | 18-26 | Phase 1A + 1B |
| P1 (Full Quality) | 15 | 28-38 | Phase 2 + 3 |
| P2 (Advanced) | 6 | 11-15 | Phase 4 (deferred) |
| **Total** | **33** | **57-79 days** | - |

---

## Critical Path Timeline

```
Week 0:     Epic 01.1 + 02.1 available
              |
              v
Week 1-2:   PHASE 1A - Quality Foundation (7 stories)
              - Specs, Holds, Settings, NCR
              - No blockers, can start immediately
              |
              +---> Phase 1A shipped: Manual QA operational
              |
              v
            BLOCKER: Wait for Epic 03.3 (PO) + Epic 05.1 (LP)
              |
              v
Week 3-5:   PHASE 1B - Incoming Inspection (5 stories)
              - PO inspection, LP QA status
              - Requires: Epic 03.3 + 05.1/05.7 complete
              |
              +---> Phase 1B shipped: Incoming QC operational
              |
              v
            BLOCKER: Wait for Epic 04.6-04.7 (Production)
              |
              v
Week 6-9:   PHASE 2 - In-Process & Final (8 stories)
              - WO inspections, checkpoints, batch release
              - Requires: Epic 04.6/04.7 complete
              |
              +---> Phase 2 shipped: Full inspection cycle
              |
              v
Week 10-13: PHASE 3 - HACCP, CoA, CAPA (7 stories)
              - HACCP compliance, CoA generation
              - No new upstream dependencies
              |
              +---> Phase 3 shipped: HACCP compliance + CoA
              |
              v
Week 14+:   PHASE 4 - Supplier & Analytics (deferred)
```

---

## Dependency Resolution Timeline

### Parallel Development Opportunities

```
Week 1-2:   Epic 06 Phase 1A
              |
              |  (parallel with Epic 03/05 early stories)
              |
Week 3-4:   Wait for 03.3 (PO) + 05.1 (LP)
              |
Week 3-5:   Epic 06 Phase 1B (after 03.3 + 05.1 available)
              |
              |  (parallel with Epic 04 early stories)
              |
Week 6:     Wait for 04.6-04.7 (Production consumption/output)
              |
Week 6-9:   Epic 06 Phase 2 (after 04.6-04.7 available)
              |
Week 10-13: Epic 06 Phase 3 (no upstream blockers)
```

---

## Risk Assessment

### Dependency Risks

| Risk | Impact | Likelihood | Mitigation | Status |
|------|--------|------------|------------|--------|
| **LP tables delayed (Epic 05)** | HIGH | MEDIUM | Phase 1A delivers value without LP | PLANNED |
| **Production delayed (Epic 04)** | HIGH | MEDIUM | Phase 1A+1B operational independently | PLANNED |
| Phase 1A limited value perception | MEDIUM | LOW | Specs + holds foundational | MITIGATED |
| QA status update conflicts | MEDIUM | MEDIUM | Clear ownership: Quality owns qa_status | PLANNED |
| Hold implementation complexity | HIGH | MEDIUM | Generic reference pattern tested | DESIGNED |
| CCP monitoring performance | MEDIUM | LOW | Indexed queries, Redis cache | PLANNED |
| Genealogy query complexity | MEDIUM | LOW | Use Epic 05 genealogy service | PLANNED |

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| RLS policy gaps | HIGH | LOW | Multi-tenant tests per ADR-001 |
| Audit trail immutability | HIGH | LOW | Append-only table, no UPDATE policy |
| Scanner UX issues | MEDIUM | MEDIUM | Large touch targets, audio feedback |
| CoA PDF generation slow | MEDIUM | LOW | Pre-render templates, async generation |
| Multi-level spec inheritance | MEDIUM | LOW | Defer to Phase 4 |
| Real-time CCP alerts | MEDIUM | MEDIUM | Edge functions + Twilio/SendGrid |

### Compliance Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| FDA 21 CFR Part 11 gaps | HIGH | LOW | Review e-signature requirements Phase 3 |
| HACCP missing elements | HIGH | LOW | Follow Codex Alimentarius guidelines |
| Audit trail retention | MEDIUM | LOW | 7-year retention policy enforced |

---

## Quality Hold Reference Design

### Generic Reference Pattern (Enables Phase 1A)

Quality holds use a **generic reference pattern** to work without LP table:

```typescript
interface QualityHold {
  id: string;
  org_id: string;
  hold_number: string;
  reason: string;
  hold_type: 'qa_pending' | 'investigation' | 'recall' | 'quarantine';
  status: 'active' | 'released' | 'disposed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  held_by: string;  // user_id
  held_at: Date;
  released_by?: string;
  released_at?: Date;
  release_notes?: string;
  disposition?: 'release' | 'rework' | 'scrap' | 'return';
  ncr_id?: string;
}

interface QualityHoldItem {
  id: string;
  hold_id: string;
  reference_type: 'lp' | 'wo' | 'batch' | 'po';  // Extensible
  reference_id: string;  // UUID of the referenced entity
  quantity_held: number;
  uom: string;
  location_id?: string;
  notes?: string;
}
```

**Why This Works:**
- Holds don't need LP table to exist (Phase 1A)
- Can hold POs, WOs, batches before LP created
- When Epic 05 adds LPs, holds reference them seamlessly
- No schema migration needed when LPs added

**Query Pattern:**
```typescript
// Get holds for a specific LP (Phase 1B+)
const holds = await supabase
  .from('quality_holds')
  .select('*, quality_hold_items(*)')
  .eq('quality_hold_items.reference_type', 'lp')
  .eq('quality_hold_items.reference_id', lpId)
  .eq('status', 'active');

// Get holds for a batch (Phase 1A)
const holds = await supabase
  .from('quality_holds')
  .select('*, quality_hold_items(*)')
  .eq('quality_hold_items.reference_type', 'batch')
  .eq('quality_hold_items.reference_id', batchNumber)
  .eq('status', 'active');
```

---

## LP QA Status Integration

### LP Table Schema (Epic 05)

```sql
-- Epic 05 license_plates table includes:
CREATE TABLE license_plates (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  lp_number TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  status TEXT NOT NULL DEFAULT 'available',  -- available, reserved, consumed, blocked
  qa_status TEXT NOT NULL DEFAULT 'pending', -- pending, passed, failed, quarantine, hold
  batch_number TEXT,
  expiry_date DATE,
  wo_id UUID,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, lp_number)
);

-- RLS policy ensures org isolation
CREATE POLICY "LP org isolation"
ON license_plates FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### Quality Updates LP Status

```typescript
// Epic 06 Quality → Epic 05 Warehouse LP

// On inspection pass
async function completeInspectionPass(inspectionId: string) {
  const inspection = await getInspection(inspectionId);

  // Update inspection
  await supabase
    .from('quality_inspections')
    .update({
      status: 'completed',
      result: 'pass',
      completed_at: new Date()
    })
    .eq('id', inspectionId);

  // Update LP QA status (REQUIRES Epic 05.7)
  if (inspection.lp_id) {
    await supabase
      .from('license_plates')
      .update({ qa_status: 'passed', updated_at: new Date() })
      .eq('id', inspection.lp_id);
  }
}

// On inspection fail
async function completeInspectionFail(inspectionId: string) {
  const inspection = await getInspection(inspectionId);

  // Update inspection
  await supabase
    .from('quality_inspections')
    .update({
      status: 'completed',
      result: 'fail',
      completed_at: new Date()
    })
    .eq('id', inspectionId);

  // Update LP QA status
  if (inspection.lp_id) {
    await supabase
      .from('license_plates')
      .update({ qa_status: 'failed', updated_at: new Date() })
      .eq('id', inspection.lp_id);

    // Create quality hold
    await createQualityHold({
      reason: `Failed inspection ${inspection.inspection_number}`,
      hold_type: 'qa_pending',
      reference_type: 'lp',
      reference_id: inspection.lp_id
    });
  }
}
```

### Business Rules

| LP QA Status | Can Consume? | Can Ship? | Quality Action |
|--------------|--------------|-----------|----------------|
| pending | Settings toggle | No | Await inspection |
| passed | Yes | Yes | None |
| failed | No | No | Create NCR |
| hold | No | No | Investigation required |
| quarantine | No | No | Physical isolation |

---

## Phase 1A Immediate Value

### What Phase 1A Delivers (Without Inspections)

1. **Product Specifications (06.2)**
   - Define min/max values for all products
   - Critical parameters flagged
   - Test methods documented
   - Version controlled specs
   - **User Value:** Quality standards documented, ready for inspections

2. **Quality Holds (06.4)**
   - Create hold on any entity (PO, WO, batch, future LP)
   - Hold reason tracking
   - Release workflow with disposition
   - **User Value:** Manual quarantine capability (better than Excel)

3. **Sampling Plans (06.5)**
   - AQL-based sample size tables (ISO 2859)
   - Lot size → sample size mapping
   - Acceptance/rejection numbers
   - **User Value:** Statistical sampling configured

4. **NCR Tracking (06.6)**
   - Log non-conformances manually
   - Severity classification (critical, major, minor)
   - Detection point tracking (incoming, in-process, final, customer)
   - **User Value:** Issue tracking system operational

5. **Quality Settings (06.0)**
   - Auto-numbering configuration (NCR, Inspection, Hold)
   - Default behaviors
   - Approval requirements
   - **User Value:** System configuration

### Why Phase 1A is Valuable Immediately

- Quality team can start specification work NOW
- Manual hold process established (compliance requirement)
- NCR logging operational (regulatory requirement)
- Foundation tables for automated workflows (Phase 1B+)
- Training can begin (specs, holds, NCR concepts)

---

## Success Criteria

### Phase 1A Launch Criteria
- [ ] All 7 stories deployed to production
- [ ] 10+ products with specs configured
- [ ] 5+ QA users with proper roles (Inspector, Manager)
- [ ] Hold creation/release workflow tested
- [ ] NCR basic workflow tested
- [ ] Quality settings configured per org
- [ ] UAT sign-off from QA Manager

### Phase 1B Launch Criteria
- [ ] All 5 stories deployed to production
- [ ] Epic 05.1 (LP table) available
- [ ] Epic 05.7 (QA status service) available
- [ ] PO receipt → inspection trigger working
- [ ] LP QA status update functional
- [ ] 20+ incoming inspections completed in pilot
- [ ] Hold-on-fail workflow tested
- [ ] Scanner test result capture working
- [ ] UAT sign-off from QA Inspector

### Phase 2 Launch Criteria
- [ ] All 8 stories deployed to production
- [ ] Epic 04.6-04.7 (Production) available
- [ ] In-process inspection operational
- [ ] Final inspection + batch release working
- [ ] Operation checkpoints configured (5+ products)
- [ ] 50+ WO inspections completed in pilot
- [ ] NCR workflow full lifecycle tested (10+ NCRs closed)
- [ ] Scanner checkpoint results working
- [ ] Quality dashboard KPIs accurate
- [ ] UAT sign-off from Production + QA Managers

### Phase 3 Launch Criteria
- [ ] All 7 stories deployed to production
- [ ] 3+ HACCP plans configured
- [ ] CCP monitoring operational (desktop + scanner)
- [ ] CCP deviation alerts working (email + SMS)
- [ ] CAPA workflow tested (5+ CAPAs closed)
- [ ] CoA PDF generation functional
- [ ] CoA templates configured (3+ customers)
- [ ] HACCP verification records reviewed
- [ ] UAT sign-off from QA Director + Compliance

---

## Conclusion

**Epic 06 Quality Module is READY FOR PHASE 1A IMPLEMENTATION.**

### Key Decisions:

1. **4-Phase Incremental Strategy Approved**
   - Phase 1A: Foundation (7 stories, 8-12 days) - START NOW
   - Phase 1B: Incoming (5 stories, 10-14 days) - After 03.3 + 05.1
   - Phase 2: In-Process/Final (8 stories, 14-20 days) - After 04.6-04.7
   - Phase 3: HACCP/CoA/CAPA (7 stories, 14-18 days) - After Phase 2

2. **Dependencies Clearly Mapped**
   - Phase 1A: ONLY 01.1 + 02.1 required (available now)
   - Phase 1B: Requires 03.3 (PO) + 05.1/05.7 (LP + QA status)
   - Phase 2: Requires 04.6-04.7 (Production consumption/output)
   - Phase 3: No new upstream dependencies (Phase 2 complete)

3. **Generic Hold Design Enables Phase 1A**
   - Holds use `reference_type` + `reference_id` pattern
   - No LP table required until Phase 1B
   - Supports PO, WO, batch holds immediately
   - Seamless LP integration when Epic 05 completes

4. **Quality Unblocks Shipping**
   - Batch release (Phase 2) controls shipment
   - CoA generation (Phase 3) enables customer delivery
   - QA status (Phase 1B) controls inventory usage

### Critical Path:

```
Epic 01.1 + 02.1 Complete
  |
  v
PHASE 1A - START NOW (8-12 days)
  - Specs, Holds, Settings, NCR
  |
  v
WAIT for Epic 03.3 (PO) + Epic 05.1 (LP)
  |
  v
PHASE 1B - Incoming Inspection (10-14 days)
  - PO receipt inspection, LP QA status
  |
  v
WAIT for Epic 04.6-04.7 (Production)
  |
  v
PHASE 2 - In-Process & Final (14-20 days)
  - WO inspection, checkpoints, batch release
  |
  v
PHASE 3 - HACCP & CAPA (14-18 days)
  - CCP monitoring, CAPA workflow, CoA generation
```

### Implementation Path:

1. **Create Phase 1A stories (06.0-06.6)** - DO THIS NOW
2. **Begin Phase 1A development immediately** (requires only 01.1 + 02.1)
3. **Track Epic 03.3 + 05.1 as blockers for Phase 1B**
4. **Track Epic 04.6-04.7 as blockers for Phase 2**
5. **Create context YAML files for all Phase 1A stories**

### Next Steps:

1. Create Phase 1A story files (06.0 through 06.6)
2. Create context YAML files for Phase 1A
3. Begin Phase 1A development after Epic 02.1 complete
4. Monitor Epic 03.3 + 05.1 progress for Phase 1B readiness
5. Monitor Epic 04.6-04.7 progress for Phase 2 readiness

**Status: GREEN - Phase 1A can proceed after Epic 02.1 (Products)**

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.1 | 2025-12-16 | Comprehensive rewrite: 4-phase breakdown, detailed integration points, Epic 02 template format | DEPENDENCY-ANALYZER |
| 1.0 | 2025-12-16 | Initial MVP dependency analysis | ARCHITECT-AGENT |
