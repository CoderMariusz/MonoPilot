# QA-007: Final Inspection - Part 2

**Module**: Quality Management
**Feature**: Final Inspection (FR-QA-007) - Continuation from Part 1
**Status**: Auto-Approved
**Last Updated**: 2025-12-15

---

## Section 4: Batch Traceability

### 4.1 CCP Records Validation

```
┌─────────────────────────────────────────────────────┐
│ CCP Records Status                        [5/5 ✓]   │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ✓ CCP-001: Pasteurization (80°C, 15s)               │
│   Recorded: 2025-12-15 08:15 | Link: FR-QA-014      │
│                                                      │
│ ✓ CCP-002: Metal Detection (<2.5mm Fe)              │
│   Recorded: 2025-12-15 09:30 | Link: FR-QA-014      │
│                                                      │
│ ✓ CCP-003: pH Control (4.2-4.6)                     │
│   Recorded: 2025-12-15 08:45 | Link: FR-QA-014      │
│                                                      │
│ ✓ CCP-004: Fill Weight (500g ±5g)                   │
│   Recorded: 2025-12-15 10:00 | Link: FR-QA-014      │
│                                                      │
│ ✓ CCP-005: Seal Integrity Test (100% check)         │
│   Recorded: 2025-12-15 10:15 | Link: FR-QA-014      │
│                                                      │
│ [View Full CCP Log]                                  │
└─────────────────────────────────────────────────────┘
```

**Validation Rules:**
- All 5 CCPs must have at least 1 record
- All CCP records must be within spec limits
- All CCP records must have e-signature
- Any CCP deviation must have approved corrective action
- Link to FR-QA-014 for drill-down

**Auto-Block Conditions:**
- Missing CCP record → Block inspection start
- CCP out-of-spec + no corrective action → Block inspection start
- Unapproved CCP deviation → Block inspection start

---

### 4.2 In-Process Inspections Validation

```
┌─────────────────────────────────────────────────────┐
│ In-Process Inspections                    [3/3 ✓]   │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ✓ INSP-IP-0421: Mixing Stage (OP-010)               │
│   Result: Passed | Date: 2025-12-15 08:00           │
│   Inspector: J. Martinez | Link: FR-QA-006          │
│                                                      │
│ ✓ INSP-IP-0422: Filling Stage (OP-030)              │
│   Result: Passed | Date: 2025-12-15 09:45           │
│   Inspector: J. Martinez | Link: FR-QA-006          │
│                                                      │
│ ✓ INSP-IP-0423: Packaging Stage (OP-050)            │
│   Result: Passed | Date: 2025-12-15 10:30           │
│   Inspector: J. Martinez | Link: FR-QA-006          │
│                                                      │
│ [View In-Process Details]                            │
└─────────────────────────────────────────────────────┘
```

**Validation Rules:**
- All required in-process inspections must be complete
- All in-process inspections must have result="passed"
- Failed in-process inspection → Block final inspection
- Link to FR-QA-006 for drill-down

**Auto-Block Conditions:**
- Missing required in-process inspection → Block inspection start
- Failed in-process inspection → Block inspection start
- In-process inspection pending review → Block inspection start

---

### 4.3 Operation Checkpoints Validation

```
┌─────────────────────────────────────────────────────┐
│ Operation Checkpoints                     [8/8 ✓]   │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ✓ OP-010: Mixing Complete                           │
│   Signed: M. Chen | 2025-12-15 08:05                │
│   Link: FR-QA-026                                    │
│                                                      │
│ ✓ OP-020: Pasteurization Complete                   │
│   Signed: M. Chen | 2025-12-15 08:20                │
│   Link: FR-QA-026                                    │
│                                                      │
│ ✓ OP-030: Filling Complete                          │
│   Signed: R. Patel | 2025-12-15 09:50               │
│   Link: FR-QA-026                                    │
│                                                      │
│ ✓ OP-040: Capping Complete                          │
│   Signed: R. Patel | 2025-12-15 10:05               │
│   Link: FR-QA-026                                    │
│                                                      │
│ ✓ OP-050: Labeling Complete                         │
│   Signed: S. Kumar | 2025-12-15 10:35               │
│   Link: FR-QA-026                                    │
│                                                      │
│ ✓ OP-060: Case Packing Complete                     │
│   Signed: S. Kumar | 2025-12-15 10:50               │
│   Link: FR-QA-026                                    │
│                                                      │
│ ✓ OP-070: Palletization Complete                    │
│   Signed: T. Brown | 2025-12-15 11:05               │
│   Link: FR-QA-026                                    │
│                                                      │
│ ✓ OP-080: Final Packaging Complete                  │
│   Signed: T. Brown | 2025-12-15 11:20               │
│   Link: FR-QA-026                                    │
│                                                      │
│ [View Operation Details]                             │
└─────────────────────────────────────────────────────┘
```

**Validation Rules:**
- All 8 operations must have checkpoint signature
- All checkpoints must have timestamp
- All signers must be authorized operators
- Link to FR-QA-026 for drill-down

**Auto-Block Conditions:**
- Missing operation signature → Block inspection start
- Unsigned checkpoint → Block inspection start

---

### 4.4 Material Traceability (Lot Genealogy)

```
┌─────────────────────────────────────────────────────┐
│ Material Traceability                                │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Finished Goods:                                      │
│ └─ Batch: BCH-2025-001234                            │
│    └─ WO: WO-2025-005678                             │
│       └─ Product: Strawberry Jam 500g (SKU-12345)    │
│                                                      │
│ Raw Materials Consumed:                              │
│ ├─ Strawberries (RM-1001)                            │
│ │  ├─ LP-1001: Lot ABC123 | 25.0 kg | Exp 2026-01   │
│ │  ├─ LP-1002: Lot ABC124 | 25.0 kg | Exp 2026-01   │
│ │  └─ LP-1003: Lot ABC125 | 10.5 kg | Exp 2026-02   │
│ │                                                     │
│ ├─ Sugar (RM-2002)                                   │
│ │  ├─ LP-2001: Lot XYZ456 | 20.0 kg | Exp 2027-06   │
│ │  └─ LP-2002: Lot XYZ457 | 10.0 kg | Exp 2027-06   │
│ │                                                     │
│ ├─ Pectin (RM-3003)                                  │
│ │  └─ LP-3001: Lot PEC789 | 2.5 kg  | Exp 2026-09   │
│ │                                                     │
│ ├─ Citric Acid (RM-4004)                             │
│ │  └─ LP-4001: Lot CIT101 | 0.5 kg  | Exp 2028-03   │
│ │                                                     │
│ └─ Glass Jars (PM-5001)                              │
│    └─ LP-5001: Lot JAR555 | 1,200 ea | No Exp       │
│                                                      │
│ Packaging Materials:                                 │
│ ├─ Labels (PM-6001)                                  │
│ │  └─ LP-6001: Lot LBL202 | 1,200 ea | No Exp       │
│ │                                                     │
│ └─ Caps (PM-7001)                                    │
│    └─ LP-7001: Lot CAP333 | 1,200 ea | No Exp       │
│                                                      │
│ [Export Full Genealogy] [View LP Details]            │
└─────────────────────────────────────────────────────┘
```

**Validation Rules:**
- All consumed materials must have lot number
- All consumed materials must have LP (License Plate)
- All consumed materials must be within expiry date
- All consumed materials must link to incoming inspection (FR-QA-005)
- Complete genealogy tree available for export

**Auto-Block Conditions:**
- Missing lot number → Block inspection start
- Expired material used → Block inspection start
- Material without incoming inspection → Block inspection start

---

## Section 5: Test Results Summary

### 5.1 Incoming Material Test Results

```
┌─────────────────────────────────────────────────────┐
│ Incoming Material Test Results           [5/5 ✓]    │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ✓ Strawberries (RM-1001) - Lot ABC123               │
│   Tests: Brix (8.5), pH (3.2), Visual (Pass)        │
│   Result: Passed | Link: FR-QA-005                   │
│                                                      │
│ ✓ Sugar (RM-2002) - Lot XYZ456                      │
│   Tests: Purity (99.9%), Moisture (0.02%)           │
│   Result: Passed | Link: FR-QA-005                   │
│                                                      │
│ ✓ Pectin (RM-3003) - Lot PEC789                     │
│   Tests: Gel Strength (150), pH (3.0)               │
│   Result: Passed | Link: FR-QA-005                   │
│                                                      │
│ ✓ Citric Acid (RM-4004) - Lot CIT101                │
│   Tests: Assay (99.5%), Heavy Metals (Pass)         │
│   Result: Passed | Link: FR-QA-005                   │
│                                                      │
│ ✓ Glass Jars (PM-5001) - Lot JAR555                 │
│   Tests: Visual (Pass), Dimensions (Pass)           │
│   Result: Passed | Link: FR-QA-005                   │
│                                                      │
│ [View Full Test Data]                                │
└─────────────────────────────────────────────────────┘
```

**Validation Rules:**
- All consumed materials must have incoming inspection
- All incoming inspections must have result="passed"
- Failed incoming inspection → Block final inspection
- Link to FR-QA-005 for drill-down

**Auto-Block Conditions:**
- Missing incoming inspection → Block inspection start
- Failed incoming inspection → Block inspection start
- Incoming inspection pending review → Block inspection start

---

### 5.2 In-Process Test Results

```
┌─────────────────────────────────────────────────────┐
│ In-Process Test Results                   [3/3 ✓]   │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ✓ INSP-IP-0421: Mixing Stage (OP-010)               │
│   Tests:                                             │
│   - Brix: 65.2 (Spec: 65.0-66.0) ✓                  │
│   - pH: 3.1 (Spec: 3.0-3.2) ✓                       │
│   - Temperature: 85°C (Spec: 82-88°C) ✓             │
│   Result: Passed | Link: FR-QA-006                   │
│                                                      │
│ ✓ INSP-IP-0422: Filling Stage (OP-030)              │
│   Tests:                                             │
│   - Fill Weight: 502g (Spec: 495-505g) ✓            │
│   - Headspace: 8mm (Spec: 6-10mm) ✓                 │
│   Result: Passed | Link: FR-QA-006                   │
│                                                      │
│ ✓ INSP-IP-0423: Packaging Stage (OP-050)            │
│   Tests:                                             │
│   - Label Position: Pass ✓                           │
│   - Seal Integrity: 100% Pass (120/120 units) ✓     │
│   - Case Weight: 6.05kg (Spec: 6.0-6.1kg) ✓         │
│   Result: Passed | Link: FR-QA-006                   │
│                                                      │
│ [View Full Test Data]                                │
└─────────────────────────────────────────────────────┘
```

**Validation Rules:**
- All required in-process tests must be complete
- All in-process tests must be within spec limits
- Failed in-process test → Block final inspection
- Link to FR-QA-006 for drill-down

**Auto-Block Conditions:**
- Missing required test → Block inspection start
- Test out-of-spec → Block inspection start
- Test pending review → Block inspection start

---

### 5.3 Failed Tests Detection & Review Workflow

```
┌─────────────────────────────────────────────────────┐
│ ⚠ Failed Test Detected                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Test: Fill Weight (OP-030)                           │
│ Measured: 492g                                       │
│ Spec: 495-505g                                       │
│ Status: OUT OF SPEC                                  │
│                                                      │
│ Inspector Notes:                                     │
│ "Fill weight below minimum spec. Filler adjustment   │
│  required. 5 units rejected from batch."             │
│                                                      │
│ Corrective Action Required:                          │
│ ○ Adjust filler and re-test                          │
│ ○ Reject affected units and continue                 │
│ ○ Escalate to QA Manager                             │
│                                                      │
│ [Create NCR] [Hold Batch] [Escalate]                 │
└─────────────────────────────────────────────────────┘
```

**Workflow:**
1. Failed test detected → Auto-flag inspection
2. Inspector reviews failure and selects corrective action
3. Options:
   - **Adjust & Re-test**: Correct issue, re-run test, continue if pass
   - **Reject & Continue**: Reject affected units (LP segregation), continue with remaining batch
   - **Escalate**: Send to QA Manager for disposition decision
4. Failed final inspection → Auto-create NCR + Quality Hold

**Validation Rules:**
- Failed test must have corrective action selected
- Rejected units must be segregated (separate LP)
- Escalation must assign to QA Manager
- All corrective actions must be documented

---

## Section 6: Overall Result & Actions

### 6.1 Overall Result Selection

```
┌─────────────────────────────────────────────────────┐
│ Overall Inspection Result                            │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Select Result:                                       │
│ ● Pass - All sections meet specifications           │
│ ○ Fail - Critical defects found, batch rejected     │
│ ○ Review - Borderline results, escalate to QA Mgr   │
│                                                      │
│ Conditional Logic:                                   │
│ ├─ Pass: All 6 sections green (auto-calculated)     │
│ ├─ Fail: Any critical defect OR manual override     │
│ └─ Review: Borderline results OR inspector unsure   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Auto-Calculation Rules:**
- All 6 sections pass → Suggest "Pass"
- Any section fail → Force "Fail" (cannot override)
- Borderline results (within 5% of spec limits) → Suggest "Review"
- Inspector can override "Pass" to "Fail" or "Review" with reason

---

### 6.2 Inspector Notes (Required)

```
┌─────────────────────────────────────────────────────┐
│ Inspector Notes (Required, min 20 characters)        │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌───────────────────────────────────────────────┐   │
│ │ All sections passed inspection. Product meets │   │
│ │ quality standards. Batch ready for release.   │   │
│ │ No deviations observed during final check.    │   │
│ │                                               │   │
│ │                                               │   │
│ │                                               │   │
│ └───────────────────────────────────────────────┘   │
│ 98/1000 characters                                   │
│                                                      │
└─────────────────────────────────────────────────────┘

Example Notes by Result:
Pass:   "All sections passed. Product meets quality standards."
Fail:   "Critical defect found in Section 3: Package integrity.
         12 units with compromised seals. Batch rejected."
Review: "Borderline fill weight (497g, spec 495-505g). Escalating
         to QA Manager for disposition decision."
```

**Validation Rules:**
- Required field (cannot submit without notes)
- Minimum 20 characters
- Maximum 1000 characters
- Must be specific (no generic text like "ok" or "pass")
- If result="fail", must describe defect details
- If result="review", must describe borderline condition

---

### 6.3 E-Signature (Separate Auth Flow)

```
┌─────────────────────────────────────────────────────┐
│ E-Signature Required (FDA 21 CFR Part 11)            │
├─────────────────────────────────────────────────────┤
│                                                      │
│ By signing, I certify:                               │
│ • All inspection sections are complete and accurate  │
│ • All measurements are within specification limits   │
│ • This inspection was performed per SOP-QA-007       │
│ • This record is complete and cannot be modified     │
│                                                      │
│ Inspector: Julia Martinez (julia.martinez@...)       │
│ Role: QA Inspector                                   │
│ Date/Time: 2025-12-15 11:45:23 UTC (auto-recorded)   │
│                                                      │
│ [Authenticate & Sign]                                │
│                                                      │
│ Note: Authentication via Bearer token in header.     │
│ No password field in request body. Server validates  │
│ user identity from auth session and records          │
│ signature with timestamp.                            │
└─────────────────────────────────────────────────────┘
```

**E-Signature Implementation:**
- **No password field in request body** (security best practice)
- Authentication via `Authorization: Bearer <token>` header
- User identity extracted from token claims (user_id, email, role)
- Timestamp auto-recorded at server (UTC)
- Immutable after signature (status="complete")
- Audit trail captures: user, timestamp, IP address, action

**API Flow:**
1. User clicks [Authenticate & Sign]
2. Frontend sends POST to `/api/quality/inspections/:id/complete` with Authorization header
3. Backend validates token, extracts user identity
4. Backend records signature: `{ user_id, email, role, timestamp, ip_address }`
5. Backend sets inspection status="complete", immutable=true
6. Backend returns signed inspection record

**FDA 21 CFR Part 11 Compliance:**
- User identity: Captured from authenticated session
- Timestamp: Auto-recorded at server (UTC, immutable)
- Immutability: Inspection locked after signature
- Audit trail: All changes logged with user + timestamp

---

### 6.4 Dispositions by Result

```
┌─────────────────────────────────────────────────────┐
│ Disposition Workflow                                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Result: PASS                                         │
│ ├─ Auto-update batch status: "released"             │
│ ├─ Eligible for Batch Release (FR-QA-010)           │
│ ├─ Notification: QA Manager (email)                 │
│ └─ Next Step: Generate COA (FR-QA-011)              │
│                                                      │
│ Result: FAIL                                         │
│ ├─ Auto-create Quality Hold (status: "on_hold")     │
│ ├─ Auto-create NCR (status: "open")                 │
│ ├─ Block batch release (cannot ship)                │
│ ├─ Notification: QA Manager, Prod Lead (SMS+Email)  │
│ └─ Next Step: Disposition decision (rework/scrap)   │
│                                                      │
│ Result: REVIEW                                       │
│ ├─ Escalate to QA Manager                           │
│ ├─ Assign task: "Review Final Inspection"           │
│ ├─ Batch status: "pending_review"                   │
│ ├─ Notification: QA Manager (SMS+Email)             │
│ └─ Next Step: QA Manager decides (pass/fail/retest) │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Auto-Actions:**
- **Pass**: Update batch status → "released", enable batch release (FR-QA-010)
- **Fail**: Create quality hold + NCR, block batch release, notify stakeholders
- **Review**: Assign to QA Manager, set batch status → "pending_review", send escalation

**Business Rules:**
- Pass → Batch release eligible (still requires QA Manager approval in FR-QA-010)
- Fail → Batch cannot be released until NCR resolved + re-inspection passed
- Review → Batch on hold until QA Manager makes disposition decision

---

## Complete Inspection API

### 6.5 Complete Inspection Endpoint

```
POST /api/quality/inspections/:id/complete
Authorization: Bearer <token>

Request Body:
{
  "spec_parameters": [
    {
      "parameter_id": "uuid-param-001",
      "measured_value": 100.5,
      "in_spec": true,
      "notes": "All measurements within tolerance"
    },
    {
      "parameter_id": "uuid-param-002",
      "measured_value": 3.15,
      "in_spec": true,
      "notes": "pH stable"
    }
  ],
  "labeling_checks": {
    "product_name_correct": true,
    "lot_number_correct": true,
    "expiry_date_correct": true,
    "allergen_info_correct": true,
    "barcode_scannable": true,
    "label_placement_correct": true,
    "notes": "All labeling checks passed"
  },
  "package_checks": {
    "seal_integrity": true,
    "fill_level_correct": true,
    "cap_torque_correct": true,
    "case_weight_correct": true,
    "pallet_stability": true,
    "damage_free": true,
    "notes": "No packaging defects observed"
  },
  "overall_result": "pass",
  "failure_reason": null,
  "ncr_details": null,
  "review_reason": null,
  "review_notes": null,
  "inspector_notes": "All sections passed inspection. Product meets quality standards. Batch ready for release. No deviations observed."
}

Response (200 OK):
{
  "id": "uuid-insp-001",
  "inspection_number": "INSP-FIN-0234",
  "status": "complete",
  "result": "passed",
  "inspection_date": "2025-12-15T11:45:23Z",
  "inspector_id": "uuid-user-123",
  "inspector_name": "Julia Martinez",
  "inspector_email": "julia.martinez@company.com",
  "batch_id": "uuid-batch-001",
  "batch_number": "BCH-2025-001234",
  "batch_status": "released",
  "ncr_id": null,
  "ncr_number": null,
  "hold_id": null,
  "hold_number": null,
  "signature": {
    "user_id": "uuid-user-123",
    "email": "julia.martinez@company.com",
    "role": "qa_inspector",
    "timestamp": "2025-12-15T11:45:23Z",
    "ip_address": "192.168.1.100"
  }
}

Response (result="fail"):
{
  "id": "uuid-insp-002",
  "inspection_number": "INSP-FIN-0235",
  "status": "complete",
  "result": "failed",
  "inspection_date": "2025-12-15T12:00:00Z",
  "batch_status": "on_hold",
  "ncr_id": "uuid-ncr-001",
  "ncr_number": "NCR-2025-0045",
  "hold_id": "uuid-hold-001",
  "hold_number": "HOLD-2025-0023",
  "signature": { ... }
}

Response (result="review"):
{
  "id": "uuid-insp-003",
  "inspection_number": "INSP-FIN-0236",
  "status": "complete",
  "result": "pending_review",
  "inspection_date": "2025-12-15T12:15:00Z",
  "batch_status": "pending_review",
  "assigned_to": "uuid-qa-manager",
  "review_deadline": "2025-12-16T12:15:00Z",
  "signature": { ... }
}

Error Responses:

401 Unauthorized:
{
  "error": "authentication_failed",
  "message": "Invalid or expired authentication token",
  "action": "re_authenticate"
}

400 Bad Request (Pre-validation failed):
{
  "error": "pre_validation_failed",
  "message": "CCP records incomplete: Missing CCP-002 (Metal Detection)",
  "blocking_issue": "ccp_incomplete",
  "details": {
    "missing_ccps": ["CCP-002"],
    "required_ccps": ["CCP-001", "CCP-002", "CCP-003", "CCP-004", "CCP-005"]
  },
  "action": "resolve_blocking_issue"
}

409 Conflict (Concurrent edit):
{
  "error": "concurrent_edit_conflict",
  "message": "Inspection was modified by another user. Please refresh and retry.",
  "action": "refresh_and_retry"
}
```

**Key Points:**
- No password field in request body (uses Authorization header)
- E-signature captured from authenticated session (user_id, email, role, timestamp)
- Auto-dispositions based on result (pass/fail/review)
- Pre-validation blocks inspection if CCP/in-process/materials invalid
- Immutable after completion (status="complete")

---

### 6.6 Batch Release Check Endpoint

```
GET /api/quality/batch/:batchId/release-check
Authorization: Bearer <token>

Response (200 OK - Eligible for Release):
{
  "batch_id": "uuid-batch-001",
  "batch_number": "BCH-2025-001234",
  "release_eligible": true,
  "release_blockers": [],
  "final_inspection": {
    "id": "uuid-insp-001",
    "inspection_number": "INSP-FIN-0234",
    "status": "complete",
    "result": "passed",
    "inspection_date": "2025-12-15T11:45:23Z"
  },
  "ccp_records": {
    "total": 5,
    "complete": 5,
    "in_spec": 5,
    "deviations": 0
  },
  "in_process_inspections": {
    "total": 3,
    "complete": 3,
    "passed": 3,
    "failed": 0
  },
  "incoming_inspections": {
    "total": 5,
    "complete": 5,
    "passed": 5,
    "failed": 0
  },
  "quality_holds": {
    "active": 0,
    "resolved": 0
  }
}

Response (200 OK - NOT Eligible for Release):
{
  "batch_id": "uuid-batch-002",
  "batch_number": "BCH-2025-001235",
  "release_eligible": false,
  "release_blockers": [
    {
      "type": "final_inspection_failed",
      "message": "Final inspection failed",
      "details": {
        "inspection_id": "uuid-insp-002",
        "inspection_number": "INSP-FIN-0235",
        "result": "failed"
      }
    },
    {
      "type": "quality_hold_active",
      "message": "Active quality hold: HOLD-2025-0023",
      "details": {
        "hold_id": "uuid-hold-001",
        "hold_number": "HOLD-2025-0023",
        "reason": "Failed final inspection"
      }
    },
    {
      "type": "ncr_open",
      "message": "Open NCR: NCR-2025-0045",
      "details": {
        "ncr_id": "uuid-ncr-001",
        "ncr_number": "NCR-2025-0045",
        "status": "open"
      }
    }
  ],
  "final_inspection": {
    "status": "complete",
    "result": "failed"
  }
}
```

**Usage:**
- Called from FR-QA-010 (Batch Release) to validate release eligibility
- Returns all blocking issues (failed inspection, quality hold, open NCR)
- Used in final inspection detail page to show batch release status

---

## Business Rules

### Complete Rule Set (15 Rules)

| # | Rule | Validation | Enforcement |
|---|------|------------|-------------|
| 1 | Mandatory for all WOs | 100% coverage | Auto-created on WO completion |
| 2 | Auto-created on WO completion | WO status="completed" | Trigger: WO completion event |
| 3 | All CCP records must be complete | 5/5 CCPs with records | Block inspection start |
| 4 | All in-process inspections must pass | 3/3 passed | Block inspection start |
| 5 | All operation checkpoints must be signed | 8/8 signed | Block inspection start |
| 6 | Failed final inspection blocks batch release | Result="failed" | Set batch status="on_hold" |
| 7 | Inspector must be QA Manager or QA Inspector | Role validation | API enforces role check |
| 8 | Completed inspections are immutable | Status="complete" | Cannot edit after e-signature |
| 9 | All consumed materials must have incoming inspection | Materials validated | Block inspection start |
| 10 | All in-process tests must be within spec | Test results validated | Block inspection start |
| 11 | Expired materials block inspection | Expiry date check | Block inspection start |
| 12 | Pass result enables batch release | Result="passed" | Set batch status="released" |
| 13 | Fail result auto-creates NCR + Hold | Result="failed" | Trigger: Create NCR, Hold |
| 14 | Review result escalates to QA Manager | Result="review" | Assign to QA Manager |
| 15 | Inspector notes required (min 20 chars) | Text validation | API enforces min length |

---

## Data Fields

### 4 Tables Referenced

#### 1. quality_inspections

```sql
CREATE TABLE quality_inspections (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  inspection_number VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'final'
  status VARCHAR(50) NOT NULL, -- 'scheduled', 'in_progress', 'complete'
  result VARCHAR(50), -- 'passed', 'failed', 'pending_review'
  batch_id UUID REFERENCES production_batches(id),
  wo_id UUID REFERENCES work_orders(id),
  product_id UUID REFERENCES products(id),
  scheduled_date TIMESTAMPTZ NOT NULL,
  inspection_date TIMESTAMPTZ,
  inspector_id UUID REFERENCES users(id),
  inspector_notes TEXT,
  overall_result VARCHAR(50),
  failure_reason TEXT,
  ncr_id UUID REFERENCES ncrs(id),
  hold_id UUID REFERENCES quality_holds(id),
  signature JSONB, -- { user_id, email, role, timestamp, ip_address }
  immutable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quality_inspections_org_type_status
  ON quality_inspections(org_id, type, status, scheduled_date DESC);
```

#### 2. production_batches

```sql
CREATE TABLE production_batches (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  batch_number VARCHAR(50) UNIQUE NOT NULL,
  wo_id UUID REFERENCES work_orders(id),
  product_id UUID REFERENCES products(id),
  status VARCHAR(50) NOT NULL, -- 'active', 'released', 'on_hold', 'pending_review'
  quantity_produced DECIMAL(10,3),
  uom VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. products

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  gtin VARCHAR(14),
  specification_id UUID REFERENCES specifications(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. test_results

```sql
CREATE TABLE test_results (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  inspection_id UUID REFERENCES quality_inspections(id),
  test_id UUID REFERENCES test_templates(id),
  measured_value DECIMAL(10,3),
  in_spec BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Responsive Design

### Desktop (>1024px)

```
┌────────────────────────────────────────────────────────────────┐
│ MonoPilot | Quality Management                   [User Menu ▼] │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Final Inspection: INSP-FIN-0234                                 │
│                                                                 │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│ │ Section 1    │ Section 2    │ Section 3    │ Section 4    │  │
│ │ Spec Params  │ Labeling     │ Packaging    │ Traceability │  │
│ │ [10 cols]    │ [10 cols]    │ [10 cols]    │ [10 cols]    │  │
│ └──────────────┴──────────────┴──────────────┴──────────────┘  │
│                                                                 │
│ ┌──────────────┬──────────────┐                                │
│ │ Section 5    │ Section 6    │                                │
│ │ Test Results │ Overall      │                                │
│ │ [10 cols]    │ [10 cols]    │                                │
│ └──────────────┴──────────────┘                                │
│                                                                 │
│                                   [Cancel] [Save Draft] [Sign] │
└────────────────────────────────────────────────────────────────┘

Layout: 10-column grid, side-by-side sections
```

### Tablet (768-1024px)

```
┌──────────────────────────────────────────────┐
│ MonoPilot Quality              [Menu ☰]      │
├──────────────────────────────────────────────┤
│                                               │
│ Final Inspection: INSP-FIN-0234               │
│                                               │
│ ┌────────────┬────────────┐                  │
│ │ Section 1  │ Section 2  │                  │
│ │ [7 cols]   │ [7 cols]   │                  │
│ └────────────┴────────────┘                  │
│                                               │
│ ┌────────────┬────────────┐                  │
│ │ Section 3  │ Section 4  │                  │
│ │ [7 cols]   │ [7 cols]   │                  │
│ └────────────┴────────────┘                  │
│                                               │
│ ┌────────────┬────────────┐                  │
│ │ Section 5  │ Section 6  │                  │
│ │ [7 cols]   │ [7 cols]   │                  │
│ └────────────┴────────────┘                  │
│                                               │
│          [Cancel] [Save Draft] [Sign]         │
└──────────────────────────────────────────────┘

Layout: 7-column grid, 2 sections per row
```

### Mobile (<768px)

```
┌────────────────────────┐
│ MonoPilot   [≡]        │
├────────────────────────┤
│                        │
│ Final Inspection       │
│ INSP-FIN-0234          │
│                        │
│ ┌────────────────────┐ │
│ │ Section 1          │ │
│ │ Spec Parameters    │ │
│ │ [Full width card]  │ │
│ └────────────────────┘ │
│                        │
│ ┌────────────────────┐ │
│ │ Section 2          │ │
│ │ Labeling           │ │
│ │ [Full width card]  │ │
│ └────────────────────┘ │
│                        │
│ ┌────────────────────┐ │
│ │ Section 3          │ │
│ │ Packaging          │ │
│ │ [Full width card]  │ │
│ └────────────────────┘ │
│                        │
│ ... (4 more sections)  │
│                        │
│ [Cancel]               │
│ [Save Draft]           │
│ [Sign & Complete]      │
└────────────────────────┘

Layout: Stacked cards, full width
```

---

## Accessibility (WCAG 2.1 AA)

### Requirements

| Category | Requirement | Implementation |
|----------|-------------|----------------|
| Touch Targets | >= 48x48dp | All buttons, checkboxes, radio buttons |
| Color Contrast | >= 4.5:1 | Text, icons, borders |
| Keyboard Navigation | Full support | Tab order, Enter/Space for actions |
| Screen Reader | ARIA labels | All interactive elements |
| Focus Indicators | Visible | 2px blue outline on focus |
| Error Messages | Descriptive | Specific error text + recovery action |
| Form Labels | Associated | All inputs have <label> with for="" |
| Headings | Semantic | H1 (page), H2 (sections), H3 (subsections) |

### ARIA Attributes

```html
<!-- Section Accordion -->
<button
  aria-expanded="true"
  aria-controls="section-1-content"
  aria-label="Section 1: Specification Parameters"
>
  Section 1: Specification Parameters
</button>

<!-- Pass/Fail Radio Group -->
<fieldset>
  <legend>Overall Inspection Result</legend>
  <input
    type="radio"
    id="result-pass"
    name="result"
    value="pass"
    aria-describedby="result-description"
  />
  <label for="result-pass">Pass</label>
</fieldset>

<!-- E-Signature Button -->
<button
  aria-label="Authenticate and sign inspection"
  aria-describedby="signature-description"
>
  Authenticate & Sign
</button>
```

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Detail page load | <1s | Time to interactive (TTI) |
| Complete inspection | <2s | API response time |
| Auto-save draft | <500ms | Background save |
| Pre-validation check | <1s | Check CCP/in-process/materials |
| Batch release check | <1s | GET /batch/:id/release-check |

### Optimization Strategies

```javascript
// React Query for caching
const { data: inspection } = useQuery(
  ['inspection', inspectionId],
  () => fetchInspection(inspectionId),
  { staleTime: 5 * 60 * 1000 } // 5 min cache
);

// Debounced auto-save
const debouncedSave = useDebouncedCallback(
  (draftData) => saveDraft(inspectionId, draftData),
  60000 // Save every 60s
);

// Optimistic updates
const mutation = useMutation(completeInspection, {
  onMutate: (newData) => {
    // Update cache immediately
    queryClient.setQueryData(['inspection', inspectionId], newData);
  },
  onError: () => {
    // Rollback on error
    queryClient.invalidateQueries(['inspection', inspectionId]);
  }
});
```

---

## Permissions Matrix

| Role | View List | View Detail | Start Inspection | Complete Inspection | Sign Inspection | Escalate Review |
|------|-----------|-------------|------------------|---------------------|-----------------|-----------------|
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| QA Manager | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| QA Inspector | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Production Lead | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Operator | ✓ (own) | ✓ (own) | ✗ | ✗ | ✗ | ✗ |
| Viewer | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

**RLS Policy:**
```sql
CREATE POLICY quality_inspections_select
  ON quality_inspections
  FOR SELECT
  USING (
    org_id = current_setting('app.current_org_id')::UUID
    AND (
      current_setting('app.current_role') IN ('admin', 'qa_manager', 'qa_inspector', 'production_lead', 'viewer')
      OR (current_setting('app.current_role') = 'operator' AND inspector_id = current_setting('app.current_user_id')::UUID)
    )
  );
```

---

## Integration Points

### 9 Integrations

| # | Integration | Direction | Purpose |
|---|-------------|-----------|---------|
| 1 | FR-QA-005 (Incoming Inspection) | Read | Validate all consumed materials have passed incoming inspection |
| 2 | FR-QA-006 (In-Process Inspection) | Read | Validate all in-process inspections passed |
| 3 | FR-QA-014 (CCP Monitoring) | Read | Validate all 5 CCPs have records and are in-spec |
| 4 | FR-QA-026 (Operation Checkpoints) | Read | Validate all 8 operations have checkpoint signatures |
| 5 | FR-QA-010 (Batch Release) | Write | Update batch status to "released" if result="pass" |
| 6 | FR-QA-009 (NCR) | Write | Auto-create NCR if result="fail" |
| 7 | FR-QA-002 (Quality Holds) | Write | Auto-create quality hold if result="fail" |
| 8 | Production Batches | Write | Update batch status based on inspection result |
| 9 | Notifications | Write | Send email/SMS to QA Manager, Production Lead |

---

## Validation Rules

### 20 Validation Rules

| # | Field | Rule | Error Message |
|---|-------|------|---------------|
| 1 | inspector_notes | Required | "Inspector notes are required" |
| 2 | inspector_notes | Min 20 chars | "Notes must be at least 20 characters" |
| 3 | inspector_notes | Max 1000 chars | "Notes cannot exceed 1000 characters" |
| 4 | overall_result | Required | "Overall result is required" |
| 5 | overall_result | Enum: pass/fail/review | "Invalid result value" |
| 6 | failure_reason | Required if result="fail" | "Failure reason is required for failed inspections" |
| 7 | ncr_details | Required if result="fail" | "NCR details are required for failed inspections" |
| 8 | review_reason | Required if result="review" | "Review reason is required for pending review" |
| 9 | review_notes | Required if result="review" | "Review notes are required for pending review" |
| 10 | spec_parameters | All required params present | "Missing required specification parameters" |
| 11 | spec_parameters | All in_spec=true for pass | "Cannot pass with out-of-spec parameters" |
| 12 | labeling_checks | All 6 checks completed | "All labeling checks must be completed" |
| 13 | package_checks | All 6 checks completed | "All package checks must be completed" |
| 14 | ccp_records | 5/5 complete | "CCP records incomplete (5 required)" |
| 15 | in_process_inspections | 3/3 passed | "In-process inspections incomplete or failed" |
| 16 | operation_checkpoints | 8/8 signed | "Operation checkpoints incomplete (8 required)" |
| 17 | incoming_inspections | All consumed materials inspected | "Some materials missing incoming inspection" |
| 18 | material_expiry | All materials within expiry | "Expired materials detected in batch" |
| 19 | inspector_role | Must be QA Manager or QA Inspector | "Unauthorized role for final inspection" |
| 20 | immutable | Cannot edit after signature | "Completed inspections cannot be modified" |

---

## Open Questions

**Status**: 0 Open Questions (All Resolved)

All design decisions finalized. Ready for implementation.

---

## Success Criteria

### 14-Item Checklist

- [ ] **List page loads in <800ms** (10 records with JOINs)
- [ ] **Detail page loads in <1s** (6 sections with pre-validation)
- [ ] **All 4 states implemented** (Loading, Empty, Error, Success)
- [ ] **Filters work correctly** (status, result, product, batch, date range, search)
- [ ] **6 sections render with auto-calculated pass/fail**
- [ ] **E-signature validates via auth header** (no password field)
- [ ] **Pass → Auto-update batch status to "released"**
- [ ] **Fail → Auto-create quality hold + NCR**
- [ ] **Review → Escalate to QA Manager with assignment**
- [ ] **Pre-validation blocks inspection start** (CCP/in-process/checkpoints/materials)
- [ ] **Responsive design tested** (Desktop 10 cols, Tablet 7 cols, Mobile cards)
- [ ] **Accessibility: Touch targets >= 48x48dp, contrast >= 4.5:1, keyboard nav**
- [ ] **Auto-save draft every 60s**
- [ ] **Immutability enforced after e-signature**

### Acceptance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Pass Rate | 95%+ | % of final inspections that pass |
| Avg Inspection Time | <15 min | Time from start to e-signature |
| Batch Release Delay | <1 hour | Time from inspection pass to batch release |
| NCR Creation Rate | <5% | % of inspections that auto-create NCR |
| Review Escalation Rate | <10% | % of inspections escalated to QA Manager |

---

## Technical Notes

### E-Signature Implementation (FDA 21 CFR Part 11)

```javascript
// Frontend: Complete Inspection
const completeInspection = async (inspectionId, formData) => {
  const response = await fetch(`/api/quality/inspections/${inspectionId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}` // User identity from token
    },
    body: JSON.stringify({
      spec_parameters: formData.specParameters,
      labeling_checks: formData.labelingChecks,
      package_checks: formData.packageChecks,
      overall_result: formData.overallResult,
      failure_reason: formData.failureReason,
      ncr_details: formData.ncrDetails,
      review_reason: formData.reviewReason,
      review_notes: formData.reviewNotes,
      inspector_notes: formData.inspectorNotes
      // NO password field
    })
  });

  return response.json();
};

// Backend: API Route
export async function POST(req: Request, { params }: { params: { id: string } }) {
  // Extract user from auth token
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'authentication_failed' }, { status: 401 });
  }

  // Validate role
  if (!['qa_manager', 'qa_inspector'].includes(user.role)) {
    return NextResponse.json({ error: 'unauthorized_role' }, { status: 403 });
  }

  const body = await req.json();

  // Record e-signature
  const signature = {
    user_id: user.id,
    email: user.email,
    role: user.role,
    timestamp: new Date().toISOString(),
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  };

  // Update inspection
  const inspection = await updateInspection(params.id, {
    ...body,
    status: 'complete',
    inspector_id: user.id,
    inspection_date: new Date().toISOString(),
    signature,
    immutable: true
  });

  // Auto-dispositions
  if (body.overall_result === 'pass') {
    await updateBatchStatus(inspection.batch_id, 'released');
  } else if (body.overall_result === 'fail') {
    await createNCR(inspection);
    await createQualityHold(inspection);
  } else if (body.overall_result === 'review') {
    await assignToQAManager(inspection);
  }

  return NextResponse.json(inspection);
}
```

**Key Points:**
- No password field in request body (security best practice)
- User identity extracted from JWT token claims
- Timestamp auto-recorded at server (immutable)
- IP address captured for audit trail
- Signature object stored in `signature` JSONB column

---

### Caching Strategy

```
Redis Keys:
'org:{orgId}:quality:inspections:final:list'          // 2 min TTL
'org:{orgId}:quality:inspection:{id}:detail'          // 5 min TTL
'org:{orgId}:quality:batch:{batchId}:release-check'   // 1 min TTL

Cache Invalidation:
- Invalidate list cache on inspection completion
- Invalidate detail cache on any update
- Invalidate release-check cache on batch status change
```

---

### Real-Time Updates

```javascript
// WebSocket for live updates (optional)
const ws = new WebSocket(`wss://api.monopilot.com/quality/inspections/${inspectionId}`);

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  if (update.type === 'concurrent_edit') {
    alert('Another user modified this inspection. Refresh to see changes.');
  }
};

// Polling fallback (required)
useEffect(() => {
  if (inspection.status === 'in_progress') {
    const interval = setInterval(() => {
      refetch(); // React Query refetch
    }, 60000); // Poll every 60s

    return () => clearInterval(interval);
  }
}, [inspection.status]);
```

---

### Database Indexes

```sql
-- List page performance
CREATE INDEX idx_quality_inspections_org_type_status
  ON quality_inspections(org_id, type, status, scheduled_date DESC);

-- Detail page performance
CREATE INDEX idx_quality_inspections_org_id_detail
  ON quality_inspections(org_id, id);

-- Batch release check performance
CREATE INDEX idx_production_batches_org_id_status
  ON production_batches(org_id, id, status);

-- CCP validation performance
CREATE INDEX idx_ccp_records_batch_id
  ON ccp_monitoring_records(batch_id, ccp_id, created_at DESC);

-- In-process validation performance
CREATE INDEX idx_quality_inspections_batch_type
  ON quality_inspections(batch_id, type, result);
```

---

## Error Handling Reference Table

| Error | Status Code | Message | User Action |
|-------|-------------|---------|-------------|
| List fetch failed | 500 | "Failed to load final inspections. Please try again." | [Retry] [Contact Support] |
| Detail fetch failed | 404 | "Inspection not found. It may have been deleted." | [Back to List] [Contact Support] |
| Pre-validation failed | 400 | "CCP records incomplete: Missing CCP-002 (Metal Detection)" | Resolve blocking issue before starting inspection |
| E-signature invalid | 401 | "Authentication failed. Please sign in again." | Re-authenticate and retry |
| Concurrent edit conflict | 409 | "Inspection was modified by another user. Please refresh and retry." | [Refresh Page] [View Changes] |

---

## Notifications & Alerts Reference Table

| Event | Recipient | Channel | Urgency | Timing |
|-------|-----------|---------|---------|--------|
| Inspection assigned | Inspector | Email + SMS | Normal | Immediate |
| Inspection passed | QA Manager | Email | Normal | Immediate |
| Inspection failed | QA Manager, Prod Lead | Email + SMS | High | Immediate |
| Inspection pending review | QA Manager | Email + Dashboard | High | Immediate |
| Review decision required (24h) | QA Manager | Email + SMS | Urgent | 24h reminder |
| NCR auto-created | Quality Team, Production | Email + Dashboard | High | Immediate |

---

**Status**: Auto-Approved
**Approval Mode**: auto_approve
**User Approved**: Yes
**Iterations**: 0 of 3
**Estimated Effort**: 20-24 hours
**Quality Target**: 95%+ pass rate (mandatory final inspection for all WOs)
**PRD Coverage**: 100% (FR-QA-007 Final Inspection fully implemented)

---

## Handoff Checklist (Part 2)

- [x] Section 4: Batch Traceability (CCP, in-process, checkpoints, genealogy)
- [x] Section 5: Test Results Summary (incoming, in-process, failed test workflow)
- [x] Section 6: Overall Result & Actions (pass/fail/review dispositions)
- [x] Complete Inspection API (POST /complete, GET /release-check)
- [x] Business Rules (15 rules documented)
- [x] Data Fields (4 tables: inspections, batch, product, test_results)
- [x] Responsive Design (Desktop/Tablet/Mobile layouts)
- [x] Accessibility (WCAG 2.1 AA compliance)
- [x] Performance Targets (5 metrics with optimization strategies)
- [x] Permissions Matrix (6 roles with RLS policy)
- [x] Integration Points (9 integrations documented)
- [x] Validation Rules (20 validation rules)
- [x] Open Questions (0 remaining)
- [x] Success Criteria (14-item checklist + acceptance metrics)
- [x] Technical Notes (E-signature, caching, real-time, indexes)
- [x] Error Handling (5-row reference table)
- [x] Notifications (6-row reference table)

Ready for handoff to FRONTEND-DEV.
