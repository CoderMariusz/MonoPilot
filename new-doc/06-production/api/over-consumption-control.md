# Over-Consumption Control API

**Story:** 04.6e - Over-Consumption Control
**Status:** DEPLOYED
**Module:** Production
**Last Updated:** 2026-01-21

## Overview

The Over-Consumption Control API manages approval workflows when material consumption exceeds BOM requirements. When the `allow_over_consumption` production setting is disabled, operators must request manager approval before consuming more material than the BOM specifies.

Key features:
- Detection of over-consumption attempts
- Approval request workflow for operators
- Approve/reject workflow for managers
- Variance tracking and color-coded indicators
- High variance alerts for dashboard

## Base URL

```
/api/production/work-orders/{woId}/over-consumption
```

## Authentication

All endpoints require authentication via Supabase Auth. Include the session token in the request headers.

## Authorization

| Endpoint | Allowed Roles |
|----------|---------------|
| POST /request | owner, admin, production_manager, production_operator |
| POST /approve | owner, admin, production_manager |
| POST /reject | owner, admin, production_manager |
| GET /pending | owner, admin, production_manager, production_operator |

## Endpoints

### POST /request

Creates an over-consumption approval request when consumption exceeds BOM requirements.

**Prerequisites:**
- `production_settings.allow_over_consumption` must be `false`
- Consumption must exceed BOM requirement
- No pending request exists for the same material

**Request Body:**

```json
{
  "wo_material_id": "uuid",
  "lp_id": "uuid",
  "requested_qty": 10.5
}
```

**Validation Schema (Zod):**

```typescript
const overConsumptionRequestSchema = z.object({
  wo_material_id: z.string().uuid('Invalid material ID'),
  lp_id: z.string().uuid('Invalid LP ID'),
  requested_qty: z.number().positive('Quantity must be positive'),
});
```

**Response (201 Created):**

```json
{
  "request_id": "uuid",
  "status": "pending",
  "wo_id": "uuid",
  "wo_number": "WO-2026-00001",
  "wo_material_id": "uuid",
  "product_code": "RM-001",
  "product_name": "Raw Material A",
  "lp_id": "uuid",
  "lp_number": "LP-2026-00123",
  "required_qty": 100,
  "current_consumed_qty": 100,
  "requested_qty": 10,
  "total_after_qty": 110,
  "over_consumption_qty": 10,
  "variance_percent": 10,
  "requested_by": "user-uuid",
  "requested_by_name": "John Doe",
  "requested_at": "2026-01-21T10:30:00Z",
  "message": "Over-consumption approval request created successfully"
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | NOT_OVER_CONSUMPTION | Consumption does not exceed BOM requirement |
| 400 | OVER_CONSUMPTION_ALLOWED | Over-consumption allowed by settings (no approval needed) |
| 400 | PENDING_REQUEST_EXISTS | Pending request already exists for this material |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | WO_NOT_FOUND | Work order not found |

---

### POST /approve

Approves an over-consumption request. Manager role required.

**Request Body:**

```json
{
  "request_id": "uuid",
  "reason": "Additional material needed due to higher moisture content"
}
```

**Validation Schema (Zod):**

```typescript
const overConsumptionApprovalSchema = z.object({
  request_id: z.string().uuid('Invalid request ID'),
  reason: z.string().max(500).optional(),
});
```

**Response (200 OK):**

```json
{
  "request_id": "uuid",
  "status": "approved",
  "consumption_id": "uuid",
  "approved_by": "user-uuid",
  "approved_by_name": "Sarah Lee",
  "approved_at": "2026-01-21T11:00:00Z",
  "reason": "Additional material needed due to higher moisture content",
  "lp_new_qty": 90,
  "message": "Over-consumption approved and consumption created"
}
```

**Side Effects on Approval:**

1. Approval request status updated to `approved`
2. Consumption record created in `wo_material_consumptions`
3. LP quantity reduced by requested amount
4. Material `consumed_qty` updated
5. Audit log entry created

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | ALREADY_DECIDED | Request already approved or rejected |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Only Managers and Admins can approve |
| 404 | REQUEST_NOT_FOUND | Approval request not found |

---

### POST /reject

Rejects an over-consumption request with required reason. Manager role required.

**Request Body:**

```json
{
  "request_id": "uuid",
  "reason": "Investigate waste before proceeding"
}
```

**Validation Schema (Zod):**

```typescript
const overConsumptionRejectionSchema = z.object({
  request_id: z.string().uuid('Invalid request ID'),
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});
```

**Response (200 OK):**

```json
{
  "request_id": "uuid",
  "status": "rejected",
  "rejected_by": "user-uuid",
  "rejected_by_name": "Sarah Lee",
  "rejected_at": "2026-01-21T11:00:00Z",
  "reason": "Investigate waste before proceeding",
  "message": "Over-consumption request rejected"
}
```

**Side Effects on Rejection:**

1. Approval request status updated to `rejected`
2. Rejection reason recorded
3. Audit log entry created
4. No consumption record created
5. LP quantity unchanged

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | ALREADY_DECIDED | Request already approved or rejected |
| 400 | REASON_REQUIRED | Rejection reason is required |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Only Managers and Admins can reject |
| 404 | REQUEST_NOT_FOUND | Approval request not found |

---

### GET /pending

Returns pending over-consumption approval requests for a work order.

**Response (200 OK):**

```json
{
  "requests": [
    {
      "id": "uuid",
      "status": "pending",
      "wo_material_id": "uuid",
      "requested_at": "2026-01-21T10:30:00Z",
      "requested_by": "user-uuid",
      "requested_qty": 10,
      "over_consumption_qty": 10,
      "variance_percent": 10
    }
  ]
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | WO_NOT_FOUND | Work order not found |

---

## Variance Calculation

**Formula:**

```
variance_percent = ((consumed_qty - required_qty) / required_qty) * 100
```

**Thresholds:**

| Range | Color | Icon | Description |
|-------|-------|------|-------------|
| = 0% | Green | CheckCircle | Exact match |
| 1% - 10% | Yellow | AlertTriangle | Acceptable variance |
| > 10% | Red | XCircle | High variance (dashboard alert) |

**Example:**

```typescript
// BOM requires 100 kg
// Already consumed: 100 kg
// Attempting: +15 kg
// Total after: 115 kg
// Over-consumption: 15 kg
// Variance: (115 - 100) / 100 * 100 = 15%
```

---

## Database Schema

### over_consumption_approvals Table

```sql
CREATE TABLE over_consumption_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_id UUID NOT NULL REFERENCES work_orders(id),
  wo_material_id UUID NOT NULL REFERENCES wo_materials(id),
  lp_id UUID NOT NULL REFERENCES license_plates(id),

  -- Quantity tracking
  requested_qty DECIMAL(15,4) NOT NULL,
  current_consumed_qty DECIMAL(15,4) NOT NULL,
  required_qty DECIMAL(15,4) NOT NULL,
  total_after_qty DECIMAL(15,4) NOT NULL,
  over_consumption_qty DECIMAL(15,4) NOT NULL,
  variance_percent DECIMAL(8,2) NOT NULL,

  -- Request info
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Status and decision
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  decided_by UUID REFERENCES users(id),
  decided_at TIMESTAMPTZ,
  approval_reason TEXT,
  rejection_reason TEXT,

  -- Linked consumption (after approval)
  consumption_id UUID REFERENCES wo_material_consumptions(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_over_consumption_approvals_org_status
  ON over_consumption_approvals(org_id, status);

CREATE INDEX idx_over_consumption_approvals_wo
  ON over_consumption_approvals(wo_id, status);

CREATE INDEX idx_over_consumption_approvals_pending
  ON over_consumption_approvals(org_id)
  WHERE status = 'pending';

CREATE INDEX idx_over_consumption_approvals_material
  ON over_consumption_approvals(wo_material_id);
```

### RLS Policies

```sql
-- SELECT: All users in org can view approvals
CREATE POLICY "over_consumption_approvals_select"
  ON over_consumption_approvals FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- INSERT: Any production user can request approval
CREATE POLICY "over_consumption_approvals_insert"
  ON over_consumption_approvals FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND requested_by = auth.uid()
  );

-- UPDATE: Only Manager/Admin can approve/reject
CREATE POLICY "over_consumption_approvals_update"
  ON over_consumption_approvals FOR UPDATE
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

---

## Usage Examples

### Request Over-Consumption Approval (cURL)

```bash
curl -X POST /api/production/work-orders/abc123/over-consumption/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "wo_material_id": "mat-uuid",
    "lp_id": "lp-uuid",
    "requested_qty": 10
  }'
```

### Approve Over-Consumption (cURL)

```bash
curl -X POST /api/production/work-orders/abc123/over-consumption/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "request_id": "request-uuid",
    "reason": "Additional material needed due to moisture"
  }'
```

### Reject Over-Consumption (cURL)

```bash
curl -X POST /api/production/work-orders/abc123/over-consumption/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "request_id": "request-uuid",
    "reason": "Investigate waste before proceeding"
  }'
```

### Get Pending Requests (cURL)

```bash
curl -X GET /api/production/work-orders/abc123/over-consumption/pending \
  -H "Authorization: Bearer $TOKEN"
```

### TypeScript Service Usage

```typescript
import { OverConsumptionService } from '@/lib/services/over-consumption-service';

// Check if consumption would be over-consumption
const check = await OverConsumptionService.checkOverConsumption(
  woMaterialId,
  requestedQty
);

if (check.isOverConsumption) {
  console.log(`Over by ${check.overQty} (${check.variancePercent}%)`);
}

// Create approval request
const request = await OverConsumptionService.createOverConsumptionRequest(
  woId,
  woMaterialId,
  lpId,
  requestedQty
);

// Approve (manager only)
const approval = await OverConsumptionService.approveOverConsumption(
  requestId,
  'Higher moisture content required more material'
);

// Reject (manager only)
const rejection = await OverConsumptionService.rejectOverConsumption(
  requestId,
  'Investigate waste before proceeding'
);

// Get pending requests
const pending = await OverConsumptionService.getPendingRequests(woId);

// Get high variance work orders for dashboard
const highVariance = await OverConsumptionService.getHighVarianceWOs();
```

---

## Integration with Consumption Flow

The over-consumption check integrates with the standard consumption flow:

```
1. User attempts consumption
2. API checks: consumed + requested > required?
3. If YES and allow_over_consumption = false:
   - Block consumption
   - Return over-consumption data
   - UI shows OverConsumptionApprovalModal
4. If YES and allow_over_consumption = true:
   - Proceed with consumption
   - Record variance
5. If NO:
   - Proceed with normal consumption
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Request creation | < 500ms |
| Approval/rejection | < 500ms |
| Pending list query | < 200ms |
| High variance query | < 1s |

---

## Related Documentation

- [Material Consumption API](./material-consumption.md)
- [Component Guide: OverConsumptionApprovalModal](../../guides/production/consumption-components.md#overconsumptionapprovalmodal)
- [Component Guide: VarianceIndicator](../../guides/production/consumption-components.md#varianceindicator)
- [Story 04.6e](../../../docs/2-MANAGEMENT/epics/current/04-production/04.6e.over-consumption-control.md)
- [Production Settings](../../../docs/1-BASELINE/product/modules/PRODUCTION.md)
