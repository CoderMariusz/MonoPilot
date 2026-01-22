# Quality Status Transition Rules Guide

## Overview

Quality status transitions are controlled by business rules stored in the `quality_status_transitions` table. This guide explains:

1. The 7 quality statuses and their meanings
2. Valid transitions and their requirements
3. Permission rules for status changes
4. Special cases and error handling

---

## The 7 Quality Statuses

### 1. PENDING
**Meaning**: Awaiting inspection

**Color/Icon**: Gray / Clock

**Permissions**:
- Shipment: ❌ NO
- Consumption: ❌ NO

**Description**: Initial status when material arrives or is created. Material must pass inspection before use.

**Typical Transitions From**: None (initial state)

**Typical Transitions To**:
- PASSED (inspection approved)
- FAILED (inspection failed)
- HOLD (investigation needed)

---

### 2. PASSED
**Meaning**: Meets specifications

**Color/Icon**: Green / CheckCircle

**Permissions**:
- Shipment: ✅ YES
- Consumption: ✅ YES

**Description**: Material has been inspected and meets all specifications. Ready for use, shipment, or consumption.

**Typical Transitions From**:
- PENDING (after passing inspection)
- HOLD (after investigation resolved)
- RELEASED (rare - status correction)

**Typical Transitions To**:
- HOLD (new issue discovered)
- RELEASED (rare - for QA-held material)
- FAILED (rare - retest found issues)

---

### 3. FAILED
**Meaning**: Does not meet specifications

**Color/Icon**: Red / XCircle

**Permissions**:
- Shipment: ❌ NO
- Consumption: ❌ NO

**Description**: Material failed inspection. Must be quarantined, scrapped, or reworked. Final status - typically no further transitions unless rework approved.

**Typical Transitions From**:
- PENDING (inspection failed)
- PASSED (retest failed)
- HOLD (investigation completed, confirmed failure)

**Typical Transitions To**:
- QUARANTINED (pending destruction decision)
- RELEASED (only if rework approved, rare)

---

### 4. HOLD
**Meaning**: Investigation required

**Color/Icon**: Orange / Pause

**Permissions**:
- Shipment: ❌ NO
- Consumption: ❌ NO

**Description**: Material quality is questionable. Investigation is underway to determine if it can be released. Used for edge cases between PENDING and PASSED/FAILED.

**Typical Transitions From**:
- PENDING (borderline results)
- PASSED (issue discovered post-inspection)

**Typical Transitions To**:
- PASSED (investigation cleared material)
- FAILED (investigation confirmed defect)
- RELEASED (investigation completed with conditions)
- QUARANTINED (investigation inconclusive)

---

### 5. RELEASED
**Meaning**: Approved for use after hold

**Color/Icon**: Blue / Unlock

**Permissions**:
- Shipment: ✅ YES
- Consumption: ✅ YES

**Description**: Material was in HOLD status but has been approved for use despite findings. Used when material can be used with documented exceptions.

**Typical Transitions From**:
- HOLD (after investigation)
- QUARANTINED (rare - after review)

**Typical Transitions To**:
- HOLD (new issue discovered)
- FAILED (retest failed)

---

### 6. QUARANTINED
**Meaning**: Isolated pending review

**Color/Icon**: Dark Red / AlertTriangle

**Permissions**:
- Shipment: ❌ NO
- Consumption: ❌ NO

**Description**: Material has been physically isolated and is pending a final decision. May be destroyed, reworked, or conditionally approved.

**Typical Transitions From**:
- FAILED (awaiting destruction)
- HOLD (inconclusive investigation)
- PENDING (rare - precaution)

**Typical Transitions To**:
- RELEASED (approved despite issues)
- COND_APPROVED (approved with limitations)
- FAILED (retest failed, confirmed destruction)

---

### 7. COND_APPROVED
**Meaning**: Conditionally approved (Limited use allowed)

**Color/Icon**: Yellow / AlertCircle

**Permissions**:
- Shipment: ❌ NO
- Consumption: ✅ YES

**Description**: Material can be consumed but NOT shipped. Used for internal use or downgrading material to different applications.

**Typical Transitions From**:
- QUARANTINED (approved for limited use)
- RELEASED (downgraded)

**Typical Transitions To**:
- HOLD (usage issue discovered)
- FAILED (retest failed)

---

## Transition Matrix

### From PENDING

| To | Allowed | Requires Inspection | Requires Approval | Requires Reason |
|----|---------|-------------------|------------------|-----------------|
| PASSED | ✅ | Yes | No | Yes |
| FAILED | ✅ | Yes | Yes | Yes |
| HOLD | ✅ | No | No | Yes |
| RELEASED | ❌ | - | - | - |
| QUARANTINED | ❌ | - | - | - |
| COND_APPROVED | ❌ | - | - | - |

**Notes**:
- PASSED transitions require inspection to exist (Story 06.2)
- FAILED transitions require QA Manager approval
- HOLD is used for uncertain cases

---

### From PASSED

| To | Allowed | Requires Inspection | Requires Approval | Requires Reason |
|----|---------|-------------------|------------------|-----------------|
| HOLD | ✅ | No | No | Yes |
| FAILED | ✅ | Yes | Yes | Yes |
| PENDING | ❌ | - | - | - |
| RELEASED | ❌ | - | - | - |
| QUARANTINED | ❌ | - | - | - |
| COND_APPROVED | ❌ | - | - | - |

**Notes**:
- Material rarely goes backward
- Rework would involve new inspection, not status change

---

### From FAILED

| To | Allowed | Requires Inspection | Requires Approval | Requires Reason |
|----|---------|-------------------|------------------|-----------------|
| QUARANTINED | ✅ | No | No | Yes |
| RELEASED | ✅ | No | Yes | Yes |
| PENDING | ❌ | - | - | - |
| PASSED | ❌ | - | - | - |
| HOLD | ❌ | - | - | - |
| COND_APPROVED | ❌ | - | - | - |

**Notes**:
- FAILED is near-terminal status
- RELEASED only if rework completed (no state flow, approval only)
- QUARANTINED for disposal

---

### From HOLD

| To | Allowed | Requires Inspection | Requires Approval | Requires Reason |
|----|---------|-------------------|------------------|-----------------|
| PASSED | ✅ | No | No | Yes |
| FAILED | ✅ | No | Yes | Yes |
| RELEASED | ✅ | No | Yes | Yes |
| QUARANTINED | ✅ | No | No | Yes |
| PENDING | ❌ | - | - | - |
| COND_APPROVED | ❌ | - | - | - |

**Notes**:
- Investigation outcomes determine transition
- PASSED: Material approved
- FAILED: Defects confirmed
- RELEASED: Approved despite findings
- QUARANTINED: Inconclusive

---

### From RELEASED

| To | Allowed | Requires Inspection | Requires Approval | Requires Reason |
|----|---------|-------------------|------------------|-----------------|
| HOLD | ✅ | No | No | Yes |
| FAILED | ✅ | Yes | Yes | Yes |
| PENDING | ❌ | - | - | - |
| PASSED | ❌ | - | - | - |
| QUARANTINED | ❌ | - | - | - |
| COND_APPROVED | ❌ | - | - | - |

**Notes**:
- Released material may have issues discovered
- Can go back to HOLD for investigation
- FAILED requires full re-inspection

---

### From QUARANTINED

| To | Allowed | Requires Inspection | Requires Approval | Requires Reason |
|----|---------|-------------------|------------------|-----------------|
| RELEASED | ✅ | No | Yes | Yes |
| COND_APPROVED | ✅ | No | Yes | Yes |
| FAILED | ✅ | No | Yes | Yes |
| PENDING | ❌ | - | - | - |
| PASSED | ❌ | - | - | - |
| HOLD | ❌ | - | - | - |

**Notes**:
- Quarantine requires management decision
- RELEASED: Full approval, shipment allowed
- COND_APPROVED: Limited use only
- FAILED: Confirmed for destruction

---

### From COND_APPROVED

| To | Allowed | Requires Inspection | Requires Approval | Requires Reason |
|----|---------|-------------------|------------------|-----------------|
| HOLD | ✅ | No | No | Yes |
| FAILED | ✅ | Yes | Yes | Yes |
| PENDING | ❌ | - | - | - |
| PASSED | ❌ | - | - | - |
| RELEASED | ❌ | - | - | - |
| QUARANTINED | ❌ | - | - | - |

**Notes**:
- Conditional use may reveal issues
- HOLD: For investigation
- FAILED: If usage problems confirmed

---

## Permission Rules

### Role-Based Access

#### VIEWER
**Can change status**: ❌ NO
- Cannot make any status changes
- Can only view history and current status

#### OPERATOR / LINE_LEAD / WAREHOUSE
**Can change status**: ✅ YES
- Can transition to most statuses
- Cannot approve transitions requiring approval

#### QA_MANAGER / QUALITY_DIRECTOR
**Can change status**: ✅ YES
- Can perform all transitions
- Can approve transitions requiring approval
- Required for FAILED, RELEASED from QUARANTINED, etc.

#### ADMIN
**Can change status**: ✅ YES
- Can perform any transition
- Can bypass approval requirements
- Can override business rules (phase 1B+)

### Approval-Required Transitions

Transitions requiring `approval_required = true`:

1. **PENDING → FAILED** - QA Manager approval needed
2. **PASSED → FAILED** - QA Manager approval needed
3. **FAILED → RELEASED** - QA Manager approval (rare case)
4. **HOLD → RELEASED** - QA Manager approval
5. **QUARANTINED → RELEASED** - QA Manager approval
6. **QUARANTINED → COND_APPROVED** - QA Manager approval
7. **QUARANTINED → FAILED** - QA Manager approval

**Enforcement**: If non-manager attempts approval-required transition, API returns 403 Forbidden.

---

## Business Rules

### Rule 1: Shipment Permissions

**Statuses allowing shipment**:
- PASSED
- RELEASED

**Statuses blocking shipment**:
- PENDING, FAILED, HOLD, QUARANTINED, COND_APPROVED

**Check**: `QualityStatusService.isStatusAllowedForShipment(status)`

**Use case**: Prevent shipping module from using blocked materials.

---

### Rule 2: Consumption Permissions

**Statuses allowing consumption**:
- PASSED
- RELEASED
- COND_APPROVED

**Statuses blocking consumption**:
- PENDING, FAILED, HOLD, QUARANTINED

**Check**: `QualityStatusService.isStatusAllowedForConsumption(status)`

**Use case**: Prevent production from consuming incomplete QC material.

---

### Rule 3: Inspection Required

**Transitions requiring inspection**:
- PENDING → PASSED
- PENDING → FAILED
- PASSED → FAILED
- RELEASED → FAILED
- QUARANTINED → FAILED

**Implementation**: Placeholder in Phase 1A, implemented in Story 06.2.

**Error**: "Inspection required before this status transition"

---

### Rule 4: Reason Always Required

**All transitions require a reason** (10-500 characters).

**Error**: "Reason is required for status changes"

**Purpose**: Audit trail - must document WHY status changed.

---

### Rule 5: No Self-Transition

**Cannot change to current status**.

**Error**: "From and to status cannot be the same"

**Prevention**: Validated on client and server.

---

### Rule 6: Monotonic for FAILED

**Once FAILED, can only go to**:
- QUARANTINED (hold for decision)
- RELEASED (rework approved - rare)

**Cannot go back to**: PENDING, PASSED, HOLD

**Rationale**: Failed material must be managed decisively.

---

## Typical Workflows

### Workflow 1: Happy Path (Pass)

```
PENDING
   ↓ (inspection passes)
PASSED
   ↓ (consume/ship)
[END]
```

**Transitions**:
1. PENDING → PASSED (requires inspection, reason)

---

### Workflow 2: Inspection Failure

```
PENDING
   ↓ (inspection fails)
FAILED
   ↓ (send to quarantine)
QUARANTINED
   ↓ (management decision)
RELEASED or COND_APPROVED
```

**Transitions**:
1. PENDING → FAILED (requires inspection, QA approval, reason)
2. FAILED → QUARANTINED (requires reason)
3. QUARANTINED → RELEASED or COND_APPROVED (requires QA approval, reason)

---

### Workflow 3: Investigation Hold

```
PENDING
   ↓ (unclear results)
HOLD
   ↓ (investigation)
PASSED or FAILED
   ↓
[RELEASED or QUARANTINED]
```

**Transitions**:
1. PENDING → HOLD (reason only)
2. HOLD → PASSED (reason only)
3. PASSED → HOLD (if new issue)
4. HOLD → RELEASED (QA approval, reason)

---

### Workflow 4: Conditional Use

```
QUARANTINED
   ↓ (internal use approved)
COND_APPROVED
   ↓ (consume internally)
[HOLD if issue OR FAILED if test fails]
```

**Transitions**:
1. QUARANTINED → COND_APPROVED (QA approval, reason)
2. COND_APPROVED → HOLD (reason)
3. COND_APPROVED → FAILED (requires inspection, QA approval, reason)

---

## API Implementation

### How to Check Valid Transitions

**Endpoint**: `GET /api/quality/status/transitions?current={status}`

**Request**:
```bash
curl "http://localhost:3000/api/quality/status/transitions?current=PENDING"
```

**Response**:
```json
{
  "current_status": "PENDING",
  "valid_transitions": [
    {
      "to_status": "PASSED",
      "requires_inspection": true,
      "requires_approval": false,
      "requires_reason": true,
      "description": "Mark as passed after successful inspection"
    },
    ...
  ]
}
```

---

### How to Validate a Transition

**Endpoint**: `POST /api/quality/status/validate-transition`

**Request**:
```json
{
  "entity_type": "lp",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000",
  "from_status": "PENDING",
  "to_status": "PASSED",
  "reason": "Inspection completed successfully"
}
```

**Response** (if valid):
```json
{
  "is_valid": true,
  "required_actions": {
    "inspection_required": true,
    "approval_required": false,
    "reason_required": true
  }
}
```

---

### How to Change Status

**Endpoint**: `POST /api/quality/status/change`

**Request**:
```json
{
  "entity_type": "lp",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000",
  "to_status": "PASSED",
  "reason": "Inspection completed successfully, all parameters within spec"
}
```

**Response**:
```json
{
  "success": true,
  "new_status": "PASSED",
  "history_id": "hist-001",
  "warnings": []
}
```

---

## Error Cases

### Error 1: Self-Transition

**Request**:
```json
{
  "from_status": "PENDING",
  "to_status": "PENDING"
}
```

**Response** (400):
```json
{
  "error": "From and to status cannot be the same"
}
```

---

### Error 2: Invalid Transition

**Request**:
```json
{
  "from_status": "PENDING",
  "to_status": "COND_APPROVED"
}
```

**Response** (400):
```json
{
  "error": "Invalid status transition: PENDING -> COND_APPROVED"
}
```

---

### Error 3: Missing Reason

**Request** (reason < 10 chars):
```json
{
  "from_status": "PENDING",
  "to_status": "PASSED",
  "reason": "OK"
}
```

**Response** (400):
```json
{
  "error": "Invalid request data",
  "details": [{
    "code": "too_small",
    "minimum": 10,
    "path": ["reason"],
    "message": "Reason must be at least 10 characters"
  }]
}
```

---

### Error 4: Insufficient Permissions

**Request** (VIEWER role attempting transition):
```json
{
  "from_status": "PENDING",
  "to_status": "PASSED"
}
```

**Response** (403):
```json
{
  "error": "Forbidden: Viewers cannot change quality status"
}
```

---

### Error 5: Approval Required

**Request** (OPERATOR attempting approval-required transition):
```json
{
  "from_status": "PENDING",
  "to_status": "FAILED",
  "reason": "Test failed"
}
```

**Response** (403):
```json
{
  "error": "Forbidden: QA Manager approval required for this transition"
}
```

---

## Audit Trail

Every status change is recorded in `quality_status_history`:

```sql
INSERT INTO quality_status_history (
  org_id,
  entity_type,
  entity_id,
  from_status,
  to_status,
  reason,
  changed_by,
  changed_at
) VALUES (...)
```

**Fields**:
- `from_status`: Previous status (NULL if creation)
- `to_status`: New status
- `reason`: User-provided reason (10-500 chars)
- `changed_by`: User ID making change
- `changed_at`: Timestamp

**Query**: `GET /api/quality/status/history/:entityType/:entityId`

---

## Database Schema

### quality_status_transitions Table

```sql
CREATE TABLE quality_status_transitions (
  id UUID PRIMARY KEY,
  from_status VARCHAR(20) NOT NULL,
  to_status VARCHAR(20) NOT NULL,
  requires_inspection BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  requires_reason BOOLEAN DEFAULT true,
  is_allowed BOOLEAN DEFAULT true,
  description TEXT
);

CREATE INDEX idx_transitions_from_status
  ON quality_status_transitions(from_status, is_allowed);
```

### quality_status_history Table

```sql
CREATE TABLE quality_status_history (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  entity_type VARCHAR(20) NOT NULL,
  entity_id UUID NOT NULL,
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  reason TEXT,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_history_entity
  ON quality_status_history(entity_type, entity_id, changed_at DESC);
```

---

## Testing Transitions

### Unit Test Example

```typescript
import { QualityStatusService } from '@/lib/services/quality-status-service'

test('validates PENDING to PASSED transition', async () => {
  const result = await QualityStatusService.validateTransition({
    entity_type: 'lp',
    entity_id: 'test-id',
    from_status: 'PENDING',
    to_status: 'PASSED',
    reason: 'Test passed successfully',
  })

  expect(result.is_valid).toBe(true)
  expect(result.required_actions.inspection_required).toBe(true)
})

test('rejects self-transition', async () => {
  const result = await QualityStatusService.validateTransition({
    entity_type: 'lp',
    entity_id: 'test-id',
    from_status: 'PENDING',
    to_status: 'PENDING',
    reason: 'Test reason',
  })

  expect(result.is_valid).toBe(false)
  expect(result.errors).toContain('From and to status cannot be the same')
})
```

---

## Future Enhancements

### Phase 1B+

- Custom status types (beyond the 7 standard)
- Custom transition rules per organization
- Approval workflows with multiple approvers
- Automatic transitions based on conditions
- Status change triggers/webhooks
