# Work Order Start Service

**Story:** 04.2a - WO Start
**Epic:** 4 - Production Floor Management
**Module:** `lib/services/wo-start-service.ts`

## Overview

The **Work Order Start Service** handles the business logic for transitioning a Work Order (WO) from the `released` status to `in_progress` (Story 4.2). It encapsulates data fetching for the start confirmation modal, material availability validation, and the atomic status update process.

## Features

- **Modal Data Preparation:** Aggregates Work Order details, product info, and line info into a single payload for the UI.
- **Material Availability Check:** Calculates real-time material availability by summing quantities from `license_plates` with `available` or `reserved` statuses.
- **Status Transition:** Atomically updates WO status, sets timestamps, and assigns the user who started the order.
- **Audit Logging:** Automatically creates activity logs upon successful start.
- **Error Handling:** Provides structured error codes (`NOT_FOUND`, `INVALID_STATUS`, `DATABASE_ERROR`) for client-side handling.

---

## Interfaces

### `WOStartModalData`

Data structure required to render the "Start Work Order" confirmation modal.

```typescript
interface WOStartModalData {
  id: string;
  wo_number: string;
  product_name: string;
  planned_qty: number;
  uom: string;
  scheduled_date?: string;
  production_line_id?: string;
  line_name?: string;
  materials: MaterialAvailability[];
}
```

### `MaterialAvailability`

Represents the stock status of a specific material required for the WO.

```typescript
interface MaterialAvailability {
  id: string;
  material_name: string;
  product_id: string;
  required_qty: number;
  available_qty: number;
  available_pct: number; // Calculated: (available / required) * 100
  uom: string;
  has_shortage: boolean; // True if available_pct < 100
}
```

### `StartedWorkOrder`

The return type after successfully starting a Work Order.

```typescript
interface StartedWorkOrder {
  id: string;
  wo_number: string;
  status: string;
  started_at: string;
  started_by_user_id: string;
  started_by_user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}
```

---

## API Reference

### `getWOForStartModal`

Retrieves detailed information for a specific Work Order to display in the start modal. It performs a join with `products` and `machines` tables and calculates material availability.

**Signature:**

```typescript
async function getWOForStartModal(
  woId: string,
  orgId: string
): Promise<WOStartModalData>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `woId` | `string` | The unique ID of the Work Order. |
| `orgId` | `string` | The organization ID for scoping/RLS. |

**Throws:**

- `WOStartError('NOT_FOUND', 404)`: If the WO does not exist.
- `WOStartError('DATABASE_ERROR', 500)`: If the database query fails.

---

### `startWorkOrder`

Transitions the Work Order status to `in_progress`. It validates that the current status is `released` before proceeding.

**Signature:**

```typescript
async function startWorkOrder(
  woId: string,
  userId: string,
  orgId: string
): Promise<StartedWorkOrder>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `woId` | `string` | The unique ID of the Work Order. |
| `userId` | `string` | The ID of the user initiating the start. |
| `orgId` | `string` | The organization ID for scoping/RLS. |

**Throws:**

- `WOStartError('NOT_FOUND', 404)`: If the WO does not exist.
- `WOStartError('INVALID_STATUS', 400)`: If the WO is not in `released` status.
- `WOStartError('DATABASE_ERROR', 500)`: If the update fails.

---

### `WOStartError`

Custom error class extending `Error` to provide structured error information to the frontend.

```typescript
class WOStartError extends Error {
  constructor(
    public code: string,       // e.g., 'INVALID_STATUS'
    public statusCode: number, // e.g., 400
    message: string
  )
}
```

---

## Usage Examples

### Example 1: Fetching Modal Data (Server Component)

```typescript
import { getWOForStartModal, WOStartError } from '@/lib/services/wo-start-service';

interface PageProps {
  params: { woId: string };
}

export default async function StartWOModal({ params }: PageProps) {
  const orgId = 'org_123'; // From auth context

  try {
    const data = await getWOForStartModal(params.woId, orgId);

    return (
      <div>
        <h1>Start WO: {data.wo_number}</h1>
        <p>Product: {data.product_name}</p>

        <ul>
          {data.materials.map((mat) => (
            <li key={mat.id} style={{ color: mat.has_shortage ? 'red' : 'green' }}>
              {mat.material_name}: {mat.available_qty} / {mat.required_qty} {mat.uom}
            </li>
          ))}
        </ul>
      </div>
    );
  } catch (error) {
    if (error instanceof WOStartError) {
      return <div>Error: {error.message} (Code: {error.code})</div>;
    }
    return <div>An unexpected error occurred.</div>;
  }
}
```

### Example 2: Server Action Implementation

```typescript
'use server';

import { startWorkOrder, WOStartError } from '@/lib/services/wo-start-service';
import { revalidatePath } from 'next/cache';

export async function confirmStartWO(formData: FormData) {
  const woId = formData.get('woId') as string;
  const userId = formData.get('userId') as string;
  const orgId = formData.get('orgId') as string;

  try {
    const result = await startWorkOrder(woId, userId, orgId);

    revalidatePath('/work-orders');
    revalidatePath(`/work-orders/${woId}`);

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof WOStartError) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
    return { success: false, error: 'Internal Server Error' };
  }
}
```

---

## Database Interactions

This service relies on the following Supabase tables:

| Table | Usage |
|-------|-------|
| `work_orders` | Primary table for WO data. Updates `status`, `started_at`, `started_by_user_id`. |
| `wo_materials` | Stores the list of required materials for a WO. |
| `license_plates` | Queried to sum available quantities for materials. |
| `products` | Joined to get product names. |
| `machines` | Joined to get production line names. |
| `users` | Joined to fetch the details of the user starting the WO. |
| `activity_logs` | (Optional) Inserted into for audit trails. |

---

## Status Flow

```
draft -> released -> in_progress -> completed
                 \-> cancelled
```

The `startWorkOrder` function only allows transition from `released` to `in_progress`.
