# Sales Order Status Workflow API

**Module:** Shipping
**Story:** 07.3 - SO Status Workflow
**Status:** DEPLOYED

## Overview

The SO Status Workflow API provides endpoints for managing sales order status transitions including hold, cancel, and confirm operations. The API enforces a strict state machine, role-based authorization, and audit trail tracking.

## Base URL

```
/api/shipping/sales-orders/:id/status
```

## Authentication

All endpoints require authentication via Supabase Auth. The user must be logged in and have the appropriate role for the operation.

## Endpoints

### PATCH /api/shipping/sales-orders/:id/status

Change the status of a sales order using one of three actions: hold, cancel, or confirm.

#### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token from Supabase Auth |
| Content-Type | Yes | application/json |

#### Request Body

```typescript
{
  action: 'hold' | 'cancel' | 'confirm',
  reason?: string  // Required for cancel, optional for hold
}
```

#### Actions

| Action | Description | Allowed Roles |
|--------|-------------|---------------|
| hold | Place order on hold | Sales, Manager, Admin |
| cancel | Cancel order permanently | Manager, Admin |
| confirm | Confirm draft or release from hold | Sales, Manager, Admin |

---

## Hold Order

Place a sales order on hold. Orders can only be held from `draft` or `confirmed` status.

### Request

```http
PATCH /api/shipping/sales-orders/abc123/status
Content-Type: application/json

{
  "action": "hold",
  "reason": "Customer requested delay"
}
```

### Response (200 OK)

```json
{
  "success": true,
  "sales_order": {
    "id": "abc123",
    "so_number": "SO-2026-00001",
    "status": "on_hold",
    "notes": "[HOLD - 2026-01-22T10:30:00.000Z] Customer requested delay",
    "updated_at": "2026-01-22T10:30:00.000Z",
    "confirmed_at": null
  },
  "message": "Sales order placed on hold"
}
```

### Valid Transitions

| From Status | To Status |
|-------------|-----------|
| draft | on_hold |
| confirmed | on_hold |

### Error Responses

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_STATUS | Cannot hold a cancelled order |
| 400 | INVALID_STATUS | Cannot hold order after allocation has started |
| 400 | INVALID_STATUS | Order is already on hold |
| 403 | FORBIDDEN | Insufficient permissions to hold orders |
| 404 | NOT_FOUND | Sales order not found |

---

## Cancel Order

Cancel a sales order. Requires a reason (minimum 10 characters). Orders can be cancelled from `draft`, `confirmed`, `on_hold`, or `allocated` status.

### Request

```http
PATCH /api/shipping/sales-orders/abc123/status
Content-Type: application/json

{
  "action": "cancel",
  "reason": "Customer cancelled the order due to budget constraints"
}
```

### Response (200 OK)

```json
{
  "success": true,
  "sales_order": {
    "id": "abc123",
    "so_number": "SO-2026-00001",
    "status": "cancelled",
    "notes": "[CANCELLED - 2026-01-22T10:30:00.000Z] Customer cancelled the order due to budget constraints",
    "updated_at": "2026-01-22T10:30:00.000Z",
    "confirmed_at": null
  },
  "message": "Sales order cancelled"
}
```

### Valid Transitions

| From Status | To Status |
|-------------|-----------|
| draft | cancelled |
| confirmed | cancelled |
| on_hold | cancelled |
| allocated | cancelled |

### Error Responses

| Status | Code | Message |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Cancel reason is required |
| 400 | VALIDATION_ERROR | Reason must be at least 10 characters |
| 400 | VALIDATION_ERROR | Reason cannot exceed 500 characters |
| 400 | INVALID_STATUS | Order is already cancelled |
| 400 | INVALID_STATUS | Cannot cancel order after picking has started. Please contact warehouse manager. |
| 403 | FORBIDDEN | Insufficient permissions to cancel orders |
| 404 | NOT_FOUND | Sales order not found |

---

## Confirm Order

Confirm a draft order or release an order from hold. Sets `confirmed_at` timestamp.

### Request

```http
PATCH /api/shipping/sales-orders/abc123/status
Content-Type: application/json

{
  "action": "confirm"
}
```

### Response (200 OK)

```json
{
  "success": true,
  "sales_order": {
    "id": "abc123",
    "so_number": "SO-2026-00001",
    "status": "confirmed",
    "notes": null,
    "updated_at": "2026-01-22T10:30:00.000Z",
    "confirmed_at": "2026-01-22T10:30:00.000Z"
  },
  "message": "Sales order confirmed"
}
```

For orders released from hold:

```json
{
  "success": true,
  "sales_order": {
    "id": "abc123",
    "so_number": "SO-2026-00001",
    "status": "confirmed",
    "notes": "[HOLD - 2026-01-22T09:00:00.000Z] Customer requested delay",
    "updated_at": "2026-01-22T10:30:00.000Z",
    "confirmed_at": "2026-01-22T08:00:00.000Z"
  },
  "message": "Sales order released from hold"
}
```

### Valid Transitions

| From Status | To Status |
|-------------|-----------|
| draft | confirmed |
| on_hold | confirmed |

### Error Responses

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_STATUS | Cannot confirm a cancelled order |
| 400 | INVALID_STATUS | Order is already confirmed |
| 400 | INVALID_STATUS | Order has already progressed beyond confirmed status |
| 403 | FORBIDDEN | Insufficient permissions to confirm orders |
| 404 | NOT_FOUND | Sales order not found |

---

## Status State Machine

The SO status workflow follows a strict state machine with the following valid transitions:

```
draft ------> confirmed ------> allocated ------> picking ------> packing ------> shipped ------> delivered
  |              |                  |
  |              |                  |
  v              v                  v
on_hold <----> confirmed       cancelled
  |              |
  |              |
  v              v
cancelled    on_hold
```

### Complete Transition Table

| From Status | Valid Transitions |
|-------------|-------------------|
| draft | confirmed, on_hold, cancelled |
| confirmed | on_hold, cancelled, allocated |
| on_hold | confirmed, cancelled |
| allocated | cancelled, picking |
| picking | packing |
| packing | shipped |
| shipped | delivered |
| delivered | (terminal) |
| cancelled | (terminal) |

---

## Role Authorization

| Action | Allowed Roles |
|--------|---------------|
| hold | sales, manager, admin, owner, super_admin |
| cancel | manager, admin, owner, super_admin |
| confirm | sales, manager, admin, owner, super_admin |

---

## Validation Schemas

### holdOrderSchema

```typescript
import { z } from 'zod'

export const holdOrderSchema = z.object({
  reason: z
    .string()
    .max(500, 'Reason cannot exceed 500 characters')
    .optional(),
})
```

### cancelOrderSchema

```typescript
import { z } from 'zod'

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .min(1, 'Cancel reason is required')
    .max(500, 'Reason cannot exceed 500 characters')
    .transform((val) => val.trim())
    .refine((val) => val.length >= 10, {
      message: 'Reason must be at least 10 characters',
    }),
})
```

### statusChangeSchema

```typescript
import { z } from 'zod'

export const statusChangeSchema = z
  .object({
    action: z.enum(['hold', 'cancel', 'confirm']),
    reason: z
      .string()
      .max(500, 'Reason cannot exceed 500 characters')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === 'cancel') {
      if (!data.reason || data.reason.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cancel reason is required',
          path: ['reason'],
        })
      } else if (data.reason.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Reason must be at least 10 characters',
          path: ['reason'],
        })
      }
    }
  })
```

---

## Service Methods

The `SOStatusService` provides the following methods for status operations:

### holdOrder

```typescript
SOStatusService.holdOrder(
  orderId: string,
  reason?: string,
  orgId?: string
): Promise<StatusChangeResult>
```

### cancelOrder

```typescript
SOStatusService.cancelOrder(
  orderId: string,
  reason: string,
  orgId?: string
): Promise<StatusChangeResult>
```

### confirmOrder

```typescript
SOStatusService.confirmOrder(
  orderId: string,
  orgId?: string
): Promise<StatusChangeResult>
```

### Helper Methods

```typescript
SOStatusService.canHold(status: SalesOrderStatus): boolean
SOStatusService.canCancel(status: SalesOrderStatus): boolean
SOStatusService.canConfirm(status: SalesOrderStatus): boolean
SOStatusService.validateTransition(from: SalesOrderStatus, to: SalesOrderStatus): boolean
SOStatusService.appendStatusNote(existingNotes: string | null, action: string, reason?: string): string
```

---

## Multi-Tenancy

All operations are scoped to the authenticated user's organization. The `org_id` filter is applied automatically through RLS policies and explicit query filters. Cross-organization access returns 404 Not Found.

---

## Audit Trail

Status changes are tracked through:

1. **updated_at** - Timestamp of the status change
2. **confirmed_at** - Timestamp when order was first confirmed
3. **notes** - Append-only log of status actions with timestamps

### Notes Format

```
[ACTION - ISO_TIMESTAMP] reason
```

Example:
```
[HOLD - 2026-01-22T09:00:00.000Z] Customer requested delay
[CANCELLED - 2026-01-22T10:30:00.000Z] Order no longer needed
```

---

## Related Files

| File | Purpose |
|------|---------|
| `apps/frontend/app/api/shipping/sales-orders/[id]/status/route.ts` | API route handler |
| `apps/frontend/lib/services/so-status-service.ts` | Business logic service |
| `apps/frontend/lib/validation/so-status-schemas.ts` | Zod validation schemas |
| `apps/frontend/components/shipping/sales-orders/HoldOrderDialog.tsx` | Hold dialog component |
| `apps/frontend/components/shipping/sales-orders/CancelOrderDialog.tsx` | Cancel dialog component |
| `apps/frontend/components/shipping/sales-orders/SOStatusBadge.tsx` | Status badge component |

---

## Test Coverage

Unit and integration tests: 53 scenarios
Coverage: 90%+

Test file: `apps/frontend/app/api/shipping/sales-orders/[id]/status/__tests__/route.test.ts`
