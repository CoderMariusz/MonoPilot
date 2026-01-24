# Batch Release API Reference

API endpoints for batch release approval workflow in MonoPilot Quality module.

**Module**: Quality (Epic 06)
**Story**: 06.11 - Final Inspection + Batch Release
**Service**: `BatchReleaseService`

---

## Overview

The Batch Release API provides endpoints for approving finished goods batches for shipping. This is a regulatory-critical workflow required by FDA FSMA, HACCP, and GFSI standards.

**Key Concepts**:
- **Batch**: A production run identified by `batch_number` from a Work Order
- **Release Decision**: `approved`, `rejected`, or `conditional`
- **LP (License Plate)**: Inventory unit that receives release status
- **Checklist**: Six verification items required for approval

---

## Service Methods

### BatchReleaseService.checkReleaseReadiness

Check if a batch can be released for shipping.

```typescript
import { BatchReleaseService } from '@/lib/services/batch-release-service'

const result = await BatchReleaseService.checkReleaseReadiness('BATCH-001')
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| batchNumber | string | Yes | Batch number from Work Order |

**Returns**: `ReleaseCheckResult`

```typescript
interface ReleaseCheckResult {
  batch_number: string
  wo_id: string
  product_id: string
  product_name: string
  total_quantity: number
  output_lps: number
  can_release: boolean
  checklist: {
    final_inspection_exists: boolean
    final_inspection_passed: boolean
    all_tests_passed: boolean
    ccp_records_complete: boolean
    ccp_records_within_limits: boolean
    checkpoints_passed: boolean
    no_open_ncrs: boolean
  }
  final_inspection: {
    id: string
    inspection_number: string
    status: string
    result: string | null
  } | null
  blockers: string[]
  warnings: string[]
  suggested_action?: string
}
```

**Example Response - Ready**:
```json
{
  "batch_number": "BATCH-001",
  "wo_id": "wo-uuid-123",
  "product_id": "prod-uuid-456",
  "product_name": "Bread Loaf",
  "total_quantity": 1000,
  "output_lps": 5,
  "can_release": true,
  "checklist": {
    "final_inspection_exists": true,
    "final_inspection_passed": true,
    "all_tests_passed": true,
    "ccp_records_complete": true,
    "ccp_records_within_limits": true,
    "checkpoints_passed": true,
    "no_open_ncrs": true
  },
  "final_inspection": {
    "id": "ins-uuid-789",
    "inspection_number": "INS-FIN-2025-00001",
    "status": "completed",
    "result": "pass"
  },
  "blockers": [],
  "warnings": []
}
```

**Example Response - Blocked**:
```json
{
  "batch_number": "BATCH-001",
  "can_release": false,
  "checklist": {
    "final_inspection_exists": true,
    "final_inspection_passed": false,
    "all_tests_passed": false
  },
  "blockers": ["Final inspection failed - cannot release"],
  "suggested_action": "Create NCR and resolve before release"
}
```

**Errors**:
| Code | Message | Cause |
|------|---------|-------|
| 404 | Batch not found | Invalid batch number or cross-tenant access |

---

### BatchReleaseService.getEvidenceSummary

Aggregate quality evidence for a final inspection.

```typescript
const evidence = await BatchReleaseService.getEvidenceSummary('inspection-uuid')
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| inspectionId | string | Yes | Final inspection UUID |

**Returns**: `EvidenceSummary`

```typescript
interface EvidenceSummary {
  inspection_id: string
  wo_id: string
  batch_number: string
  in_process_inspections: {
    total: number
    passed: number
    failed: number
    conditional: number
    in_progress: number
    items: InProcessInspectionSummary[]
  }
  ccp_monitoring: {
    total_records: number
    within_limits: number
    deviations: number
    deviations_resolved: number
    items: CCPMonitoringSummary[]
  }
  operation_checkpoints: {
    total: number
    passed: number
    failed: number
    items: CheckpointSummary[]
  }
  ncrs: {
    open: number
    closed: number
    items: NCRSummary[]
  }
  overall_status: 'ready' | 'review_required' | 'blocked'
  blockers: string[]
  warnings: string[]
}
```

**Overall Status Values**:
| Status | Description |
|--------|-------------|
| `ready` | All evidence complete, no blockers |
| `review_required` | Warnings exist but can proceed |
| `blocked` | Cannot release until issues resolved |

---

### BatchReleaseService.approveBatchRelease

Approve, reject, or conditionally release a batch.

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
    approval_notes: 'All criteria met'
  },
  'user-uuid'
)
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| batchNumber | string | Yes | Batch number |
| input | BatchReleaseInput | Yes | Release decision and checklist |
| userId | string | Yes | Approving user UUID |

**BatchReleaseInput**:
```typescript
interface BatchReleaseInput {
  release_decision: 'approved' | 'rejected' | 'conditional'
  checklist: {
    test_results: boolean
    ccp_records: boolean
    checkpoints: boolean
    label_verify: boolean
    spec_review: boolean
    ncr_review: boolean
  }
  // For conditional release
  conditional_reason?: string
  conditional_restrictions?: string
  conditional_expires_at?: string  // ISO datetime
  // For rejection
  rejection_reason?: string
  // General
  approval_notes?: string
  lp_ids?: string[]
  lp_decisions?: Array<{
    lp_id: string
    status: 'released' | 'hold' | 'rejected'
    notes?: string
  }>
}
```

**Returns**: `BatchReleaseResponse`

```typescript
interface BatchReleaseResponse {
  release: BatchReleaseRecord
  lps_updated: number
  lps_released: number
  lps_rejected: number
  message: string
}
```

**Example - Approval**:
```typescript
// Request
{
  release_decision: 'approved',
  checklist: {
    test_results: true,
    ccp_records: true,
    checkpoints: true,
    label_verify: true,
    spec_review: true,
    ncr_review: true
  }
}

// Response
{
  "release": {
    "id": "release-uuid",
    "release_number": "REL-2025-00001",
    "batch_number": "BATCH-001",
    "release_decision": "approved",
    "approved_by": "user-uuid",
    "approved_at": "2025-01-23T14:30:00Z"
  },
  "lps_updated": 5,
  "lps_released": 5,
  "lps_rejected": 0,
  "message": "Batch BATCH-001 released for shipping"
}
```

**Example - Conditional Release**:
```typescript
// Request
{
  release_decision: 'conditional',
  checklist: { /* ... */ },
  conditional_reason: 'Minor color variation',
  conditional_restrictions: 'Ship to Distributor A only',
  conditional_expires_at: '2025-01-30T23:59:59Z'
}
```

**Example - Rejection**:
```typescript
// Request
{
  release_decision: 'rejected',
  checklist: { test_results: false, /* ... */ },
  rejection_reason: 'Failed organoleptic test - off-odor detected'
}

// Response
{
  "release": {
    "release_decision": "rejected"
  },
  "lps_updated": 5,
  "lps_released": 0,
  "lps_rejected": 5,
  "message": "Batch BATCH-001 rejected - LPs blocked from shipping"
}
```

**Validation Rules**:
| Decision | Requirements |
|----------|--------------|
| `approved` | Minimum 4 of 6 checklist items must be true |
| `conditional` | `conditional_reason` and `conditional_restrictions` required |
| `rejected` | `rejection_reason` required |

**Errors**:
| Code | Message | Cause |
|------|---------|-------|
| 400 | At least 4 checklist items must be confirmed | Insufficient checklist |
| 400 | Conditional reason and restrictions required | Missing conditional fields |
| 400 | Rejection reason required | Missing rejection reason |
| 403 | Insufficient permissions | User lacks QA_MANAGER role |
| 404 | Batch not found | Invalid batch number |

---

### BatchReleaseService.submitForApproval

Submit batch for manager approval (inspector workflow).

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
  'inspector-uuid'
)
```

**Returns**: Partial `BatchReleaseRecord` with `release_decision: 'pending'`

---

### BatchReleaseService.updateLPReleaseStatus

Update individual LP release status.

```typescript
await BatchReleaseService.updateLPReleaseStatus(
  'lp-uuid',
  'released',
  'user-uuid',
  'Released with batch'
)
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| lpId | string | Yes | License Plate UUID |
| status | 'released' \| 'hold' \| 'rejected' | Yes | New status |
| userId | string | Yes | User making change |
| notes | string | No | Optional notes |

---

### BatchReleaseService.getOutputLPs

Get all output LPs for a batch.

```typescript
const lps = await BatchReleaseService.getOutputLPs('BATCH-001')
```

**Returns**: `LicensePlateWithRelease[]`

```typescript
interface LicensePlateWithRelease {
  id: string
  lp_number: string
  product_id: string
  quantity: number
  release_status: string  // 'pending' | 'released' | 'rejected' | 'hold'
  released_by: string | null
  released_at: string | null
}
```

---

### BatchReleaseService.list

List batch release records with pagination.

```typescript
const releases = await BatchReleaseService.list({
  release_decision: 'pending',
  page: 1,
  limit: 20
})
```

**Parameters**:
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| release_decision | string | No | - | Filter by decision status |
| product_id | string | No | - | Filter by product |
| date_from | string | No | - | Start date filter |
| date_to | string | No | - | End date filter |
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Results per page (max 100) |

**Returns**: `BatchReleaseListResponse`

```typescript
interface BatchReleaseListResponse {
  data: BatchReleaseRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
```

---

### BatchReleaseService.getBatchStatus

Get QA status summary for a batch.

```typescript
const status = await BatchReleaseService.getBatchStatus('BATCH-001')
```

**Returns**: `BatchStatus`

```typescript
interface BatchStatus {
  batch_number: string
  wo_id: string
  product: {
    id: string
    name: string
    sku: string
  }
  qa_status: {
    final_inspection_status: string | null
    final_inspection_result: string | null
    release_status: 'pending' | 'approved' | 'rejected' | 'conditional'
    released_at: string | null
    released_by: string | null
  }
  lp_summary: {
    total: number
    released: number
    pending: number
    rejected: number
    hold: number
  }
  can_ship: boolean
  restrictions?: string
}
```

---

## Validation Schemas

Import from `@/lib/validation/batch-release-schemas`:

```typescript
import {
  releaseDecisionEnum,
  releaseChecklistSchema,
  batchReleaseRequestSchema,
  batchReleaseListQuerySchema,
  lpDecisionSchema
} from '@/lib/validation/batch-release-schemas'
```

### releaseChecklistSchema

```typescript
const releaseChecklistSchema = z.object({
  test_results: z.boolean(),
  ccp_records: z.boolean(),
  checkpoints: z.boolean(),
  label_verify: z.boolean(),
  spec_review: z.boolean(),
  ncr_review: z.boolean()
})
```

### batchReleaseRequestSchema

Full validation with refinements for conditional/rejection requirements and minimum checklist items.

---

## Authorization

**Required Roles**:
| Operation | Roles |
|-----------|-------|
| checkReleaseReadiness | Any authenticated user |
| getEvidenceSummary | Any authenticated user |
| submitForApproval | QA_INSPECTOR, QA_MANAGER |
| approveBatchRelease | QA_MANAGER, QUALITY_DIRECTOR, ADMIN |
| list, getBatchStatus | Any authenticated user |

All operations enforce RLS for multi-tenant isolation.

---

## Integration with Shipping (Epic 07)

Released batches gate shipping operations:

```sql
-- Shipping module inventory query
SELECT lp.*
FROM license_plates lp
WHERE lp.org_id = :org_id
  AND lp.status = 'available'
  AND lp.qa_status = 'passed'
  AND lp.release_status = 'released'  -- Gate from batch release
  AND lp.product_id = :product_id
```

**LP release_status values**:
| Status | Shippable | Description |
|--------|-----------|-------------|
| `pending` | No | Awaiting QA release |
| `released` | Yes | Approved for shipping |
| `conditional` | Yes* | With restrictions displayed |
| `rejected` | No | Requires NCR disposition |
| `hold` | No | Temporary hold |

---

## CoA Integration (Phase 3)

Certificate of Analysis generation triggers on batch release approval. See Story 06.27-06.29 for CoA template and generation details.

---

## Error Handling

All service methods throw errors with format:
```
{statusCode}: {message}
```

Example error handling:
```typescript
try {
  await BatchReleaseService.approveBatchRelease(batch, input, userId)
} catch (error) {
  if (error.message.startsWith('403')) {
    // Permission denied
  } else if (error.message.startsWith('400')) {
    // Validation error
  } else if (error.message.startsWith('404')) {
    // Not found
  }
}
```

---

## Performance Requirements

| Operation | Target |
|-----------|--------|
| checkReleaseReadiness | < 1 second |
| getEvidenceSummary | < 1 second |
| approveBatchRelease | < 2 seconds |
| list (500 records) | < 500ms |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `batch_release_records` | Release decision and checklist |
| `batch_release_lps` | Junction: release to LP mapping |
| `release_number_sequences` | Auto-increment release numbers |
| `license_plates` | LP release_status updated on approval |

---

## Related Documentation

- [Batch Release Workflow Guide](../guides/quality/batch-release-workflow.md)
- [Story 06.11 Specification](../../2-MANAGEMENT/epics/current/06-quality/06.11.final-inspection-batch-release.md)
- [Quality Module PRD](../../1-BASELINE/product/modules/quality.md)
