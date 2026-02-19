# Batch Release Workflow Guide

Complete workflow for releasing finished goods batches for shipping in MonoPilot.

---

## Overview

Batch release is the final quality gate before products can ship to customers. This process:

1. Verifies all quality evidence from production
2. Requires manager approval with documented checklist
3. Updates License Plate (LP) release status
4. Enables shipping operations in Epic 07

**Regulatory Compliance**: This workflow satisfies FDA FSMA, HACCP, and GFSI requirements for batch release documentation.

---

## Status Workflow Diagram

```
                    +------------+
                    |   Work     |
                    |   Order    |
                    | Completed  |
                    +-----+------+
                          |
                          v
                  +-------+-------+
                  | Final         |
                  | Inspection    |
                  | Created       |
                  +-------+-------+
                          |
           +--------------+--------------+
           |              |              |
           v              v              v
      +----+----+   +-----+-----+  +-----+-----+
      |  PASS   |   | CONDITIONAL|  |   FAIL   |
      +---------+   +-----------+  +-----+-----+
           |              |              |
           v              v              v
    +------+------+ +-----+-----+  +-----+-----+
    | Release     | | Release   |  | Create    |
    | Check       | | Check     |  | NCR       |
    | (Ready)     | | (Warnings)|  | (Blocked) |
    +------+------+ +-----+-----+  +-----+-----+
           |              |              |
           +--------------+              |
                  |                      |
                  v                      |
           +------+------+               |
           | Inspector   |               |
           | Submits     |               |
           +------+------+               |
                  |                      |
                  v                      |
           +------+------+               |
           | QA Manager  |               |
           | Reviews     |               |
           +------+------+               |
                  |                      |
      +-----------+-----------+          |
      |           |           |          |
      v           v           v          |
 +----+----+ +----+----+ +----+----+     |
 |APPROVED | |CONDITIONAL| |REJECTED|<---+
 +---------+ +-----------+ +---------+
      |           |              |
      v           v              v
 +----+----+ +----+----+   +----+----+
 | LPs     | | LPs     |   | LPs     |
 | Released| | Released|   | Blocked |
 +---------+ | (w/     |   +---------+
             | restrict)|
             +---------+
```

---

## Roles and Permissions

| Role | Can Submit | Can Approve | Can View |
|------|-----------|-------------|----------|
| QA_INSPECTOR | Yes | No | Yes |
| QA_MANAGER | Yes | Yes | Yes |
| QUALITY_DIRECTOR | Yes | Yes | Yes |
| ADMIN | Yes | Yes | Yes |
| PRODUCTION | No | No | View Only |

---

## Step-by-Step Workflow

### Step 1: Final Inspection Completion

After a Work Order completes, a final inspection record is created automatically (if `require_final_inspection` is enabled in Quality Settings).

**Auto-creation trigger**:
- WO status changes to `completed`
- `quality_settings.require_final_inspection = true`
- Creates inspection with `type='final'`, `status='scheduled'`

**Manual creation**: Navigate to Quality > Inspections and create with `type='final'`.

### Step 2: Check Release Readiness

Before starting approval, check if the batch can be released.

**Using the service**:
```typescript
const check = await BatchReleaseService.checkReleaseReadiness('BATCH-001')

if (check.can_release) {
  // Proceed to approval
} else {
  // Show blockers to user
  console.log('Blockers:', check.blockers)
}
```

**Release Check Criteria**:

| Criterion | Required | Description |
|-----------|----------|-------------|
| Final inspection exists | Yes | Must have final inspection record |
| Final inspection passed | Yes | Result must be `pass` or `conditional` |
| All tests passed | Yes | All test results status = `pass` |
| CCP records complete | Yes | All CCP monitoring within limits |
| Checkpoints passed | Yes | All operation checkpoints passed |
| No open NCRs | Yes | No unresolved NCRs for batch |

### Step 3: Review Evidence Summary

View all quality evidence before approval.

```typescript
const evidence = await BatchReleaseService.getEvidenceSummary(inspectionId)
```

**Evidence categories**:

1. **In-Process Inspections**: Results from production checkpoints
2. **CCP Monitoring**: Critical Control Point records
3. **Operation Checkpoints**: Step-by-step verification
4. **NCRs**: Non-Conformance Reports linked to batch

**Overall Status**:
| Status | Color | Meaning |
|--------|-------|---------|
| `ready` | Green | All criteria met, proceed |
| `review_required` | Yellow | Warnings exist, review needed |
| `blocked` | Red | Cannot release until resolved |

### Step 4: Complete Release Checklist

The release checklist has 6 items. At least 4 must be confirmed for approval.

| Item | Description |
|------|-------------|
| Test Results | All lab/quality test results reviewed and passed |
| CCP Records | All Critical Control Point records verified within limits |
| Checkpoints | All operation checkpoints confirmed complete |
| Label Verify | Product labels verified against specification |
| Spec Review | Product meets all specification requirements |
| NCR Review | No open NCRs, or all NCRs properly resolved |

### Step 5A: Inspector Submits for Approval

If the user is a QA Inspector (not Manager), they submit for approval.

```typescript
const pending = await BatchReleaseService.submitForApproval(
  'BATCH-001',
  {
    test_results: true,
    ccp_records: true,
    checkpoints: true,
    label_verify: true,
    spec_review: true,
    ncr_review: true
  },
  inspectorUserId
)
// Returns: release_decision = 'pending'
```

**What happens**:
- Release record created with `release_decision='pending'`
- LP status remains `pending`
- QA Manager sees item in approval queue

### Step 5B: Manager Approves Release

QA Manager reviews and approves/rejects.

**Approve**:
```typescript
const result = await BatchReleaseService.approveBatchRelease(
  'BATCH-001',
  {
    release_decision: 'approved',
    checklist: {
      test_results: true,
      ccp_records: true,
      checkpoints: true,
      label_verify: true,
      spec_review: true,
      ncr_review: true
    },
    approval_notes: 'All quality criteria verified'
  },
  managerUserId
)
```

**Conditional Release**:
```typescript
const result = await BatchReleaseService.approveBatchRelease(
  'BATCH-001',
  {
    release_decision: 'conditional',
    checklist: { /* ... */ },
    conditional_reason: 'Minor color variation observed',
    conditional_restrictions: 'Ship to Distributor A only, use within 7 days',
    conditional_expires_at: '2025-01-30T23:59:59Z'
  },
  managerUserId
)
```

**Reject**:
```typescript
const result = await BatchReleaseService.approveBatchRelease(
  'BATCH-001',
  {
    release_decision: 'rejected',
    checklist: { test_results: false, /* ... */ },
    rejection_reason: 'Failed organoleptic test - off-odor detected'
  },
  managerUserId
)
```

### Step 6: LP Status Updates

On approval, all output LPs are updated automatically.

| Decision | LP release_status | Can Ship |
|----------|-------------------|----------|
| `approved` | `released` | Yes |
| `conditional` | `released` | Yes (with restrictions) |
| `rejected` | `rejected` | No |

**LP fields updated**:
- `release_status`: New status
- `released_by`: Approving user
- `released_at`: Timestamp
- `release_notes`: Restrictions (if conditional)

---

## Error Scenarios

### Missing Final Inspection

```
Blocker: "Final inspection does not exist"
Action: Create final inspection manually or verify WO completion
```

### Failed Final Inspection

```
Blocker: "Final inspection failed - cannot release"
Action: Create NCR and resolve quality issue
```

### Open NCRs

```
Blocker: "Open NCRs exist for this batch - must be resolved before release"
Action: Close or resolve linked NCRs
```

### Insufficient Checklist

```
Error: "400: At least 4 checklist items must be confirmed"
Action: Review and confirm additional checklist items
```

### Permission Denied

```
Error: "403: Insufficient permissions"
Action: Request QA Manager to approve, or escalate
```

---

## Integration with Shipping

Once a batch is released, LPs become available for shipping.

**Shipping query filter**:
```sql
WHERE release_status = 'released'
```

**Conditional release handling**:
- Shipping module displays restrictions
- Warning shown when allocating conditional LPs
- `conditional_expires_at` tracked for expiration

**Rejected batch handling**:
- LPs blocked from shipping
- Requires NCR disposition decision
- Options: rework, scrap, or customer return

---

## Audit Trail

All release actions are logged.

**Logged events**:
| Action | Fields Captured |
|--------|-----------------|
| Submit for approval | submitted_by, submitted_at, checklist |
| Approve | approved_by, approved_at, decision, notes |
| Reject | approved_by, decision, rejection_reason |
| LP status change | lp_id, old_status, new_status, user |

**View history**:
```typescript
const status = await BatchReleaseService.getBatchStatus('BATCH-001')
// Includes qa_status.released_at, released_by
```

---

## Checklist Best Practices

1. **Test Results**: Verify all lab results are recorded and within specification
2. **CCP Records**: Check temperature, time, and other critical parameters
3. **Checkpoints**: Ensure all production steps were verified
4. **Label Verify**: Compare printed labels against approved artwork
5. **Spec Review**: Confirm product meets customer specifications
6. **NCR Review**: Search for any NCRs linked to batch number

---

## Certificate of Analysis (CoA)

CoA generation triggers on batch release (Phase 3, Stories 06.27-06.29).

**Trigger**: `release_decision = 'approved'` or `'conditional'`

**CoA includes**:
- Product specification details
- Test results summary
- Batch/lot information
- Release decision and date
- Approver signature block

---

## Performance Expectations

| Operation | Expected Time |
|-----------|---------------|
| Release check | < 1 second |
| Evidence summary | < 1 second |
| Batch approval | < 2 seconds |
| LP updates (20 LPs) | < 2 seconds |

---

## Troubleshooting

### Release check shows blocked but inspection passed

1. Check for open NCRs linked to batch
2. Verify all in-process inspections completed
3. Check CCP monitoring records

### LPs not showing as released

1. Confirm release record has `release_decision='approved'`
2. Check database trigger execution
3. Verify LP `wo_id` matches Work Order

### Permission errors for manager

1. Verify user role is QA_MANAGER, QUALITY_DIRECTOR, or ADMIN
2. Check org_id matches batch organization
3. Confirm RLS policies are not blocking

---

## Related Documentation

- [Batch Release API Reference](../../api/quality/batch-release.md)
- [Quality Settings Guide](./quality-settings.md)
- [NCR Management Guide](./ncr-management.md)
- [Story 06.11 Specification](../../2-MANAGEMENT/epics/current/06-quality/06.11.final-inspection-batch-release.md)
