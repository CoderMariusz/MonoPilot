# Production Settings Service

**Story:** 04.5 - Production Settings
**Epic:** 4 - Production Floor Management
**Version:** 1.0.0

## Overview

The Production Settings Service provides a centralized configuration system for production execution rules. It handles CRUD operations for organization-level settings, including Work Order execution, material consumption rules, dashboard behavior, and OEE tracking targets.

This feature is implemented using a server-side service class (`ProductionSettingsService`) for direct database interaction and Next.js API Routes for client-side consumption.

---

## Data Models

### ProductionSettings

Defines the complete structure of production settings. The service automatically creates default settings for new organizations.

```typescript
interface ProductionSettings {
  id: string;
  org_id: string;

  // WO Execution (Phase 0)
  allow_pause_wo: boolean;
  auto_complete_wo: boolean;
  require_operation_sequence: boolean;

  // Material Consumption (Phase 1)
  allow_over_consumption: boolean;
  allow_partial_lp_consumption: boolean;

  // Output (Phase 1)
  require_qa_on_output: boolean;
  auto_create_by_product_lp: boolean;

  // Reservations (Phase 1)
  enable_material_reservations: boolean;

  // Dashboard (Phase 0)
  dashboard_refresh_seconds: number;
  show_material_alerts: boolean;
  show_delay_alerts: boolean;
  show_quality_alerts: boolean;

  // OEE (Phase 2)
  enable_oee_tracking: boolean;
  target_oee_percent: number;
  enable_downtime_tracking: boolean;

  // Metadata
  created_at?: string;
  updated_at?: string;
}
```

### ProductionSettingsUpdate

A partial type used for update operations. All fields are optional.

```typescript
type ProductionSettingsUpdate = Partial<Omit<ProductionSettings, 'id' | 'org_id' | 'created_at' | 'updated_at'>>;
```

### Zod Schema (Frontend Validation)

For client-side validation, use the following Zod schema matching the service constraints.

```typescript
import { z } from 'zod';

export const ProductionSettingsSchema = z.object({
  allow_pause_wo: z.boolean().optional(),
  auto_complete_wo: z.boolean().optional(),
  require_operation_sequence: z.boolean().optional(),
  allow_over_consumption: z.boolean().optional(),
  allow_partial_lp_consumption: z.boolean().optional(),
  require_qa_on_output: z.boolean().optional(),
  auto_create_by_product_lp: z.boolean().optional(),
  enable_material_reservations: z.boolean().optional(),
  dashboard_refresh_seconds: z.number().min(5).max(300).optional(),
  show_material_alerts: z.boolean().optional(),
  show_delay_alerts: z.boolean().optional(),
  show_quality_alerts: z.boolean().optional(),
  enable_oee_tracking: z.boolean().optional(),
  target_oee_percent: z.number().min(0).max(100).optional(),
  enable_downtime_tracking: z.boolean().optional(),
});
```

---

## Service API

The `ProductionSettingsService` class provides static methods for backend logic. It is typically used within Server Actions or API Routes.

### `getProductionSettings`

Retrieves settings for a specific organization. If settings do not exist, it automatically inserts default settings (AC-12, AC-13).

**Parameters:**
- `supabase: SupabaseClient` - An authenticated Supabase client instance.
- `orgId: string` - The UUID of the organization.

**Returns:** `Promise<ProductionSettings>`

**Throws:** Error if orgId is invalid or database query fails.

### `updateProductionSettings`

Performs a partial update of the organization's settings (AC-14).

**Parameters:**
- `supabase: SupabaseClient` - An authenticated Supabase client instance.
- `orgId: string` - The UUID of the organization.
- `updates: ProductionSettingsUpdate` - Object containing fields to update.

**Returns:** `Promise<ProductionSettings>`

**Validation Rules:**
- `dashboard_refresh_seconds`: Must be between 5 and 300.
- `target_oee_percent`: Must be between 0 and 100.

### Helper Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `isWoPauseAllowed(supabase, orgId)` | `Promise<boolean>` | Check if WO pause is allowed |
| `getDashboardRefreshInterval(supabase, orgId)` | `Promise<number>` | Get dashboard refresh interval in seconds |
| `isAutoCompleteEnabled(supabase, orgId)` | `Promise<boolean>` | Check if auto-complete is enabled |
| `isOperationSequenceRequired(supabase, orgId)` | `Promise<boolean>` | Check if operation sequence is required |
| `getDashboardAlertSettings(supabase, orgId)` | `Promise<{...}>` | Get all dashboard alert settings |
| `getOeeSettings(supabase, orgId)` | `Promise<{...}>` | Get OEE-related settings |

---

## HTTP API

### GET `/api/production/settings`

Fetches the current production settings for the authenticated user's organization.

**Authentication:** Required
**Permissions:** Any authenticated user

**Response (200 OK):**
```json
{
  "settings": {
    "id": "uuid",
    "org_id": "uuid",
    "allow_pause_wo": false,
    "dashboard_refresh_seconds": 30,
    ...
  }
}
```

### PUT `/api/production/settings`

Updates production settings. Restricted to users with the 'Admin' role (AC-4.17.8).

**Authentication:** Required
**Permissions:** Admin only

**Body:** `ProductionSettingsUpdate`

**Response (200 OK):**
```json
{
  "settings": { ... },
  "message": "Production settings updated successfully"
}
```

**Response (403 Forbidden):** Returned if the user is not an Admin.

---

## React Integration

### Custom Hook Example

```typescript
'use client';

import { useState, useEffect } from 'react';
import type { ProductionSettings, ProductionSettingsUpdate } from '@/lib/services/production-settings-service';

export function useProductionSettings() {
  const [settings, setSettings] = useState<ProductionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/production/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        const data = await response.json();
        setSettings(data.settings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSettings = async (updates: ProductionSettingsUpdate) => {
    const response = await fetch('/api/production/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update settings');
    }
    const data = await response.json();
    setSettings(data.settings);
  };

  return { settings, loading, error, updateSettings };
}
```

---

## Supabase Integration

### Table Schema

| Column | Type | Default |
|--------|------|---------|
| `id` | `uuid` | `uuid_generate_v4()` |
| `org_id` | `uuid` | FK -> `organizations.id`, Unique |
| `allow_pause_wo` | `boolean` | `false` |
| `auto_complete_wo` | `boolean` | `false` |
| `require_operation_sequence` | `boolean` | `true` |
| `allow_over_consumption` | `boolean` | `false` |
| `allow_partial_lp_consumption` | `boolean` | `true` |
| `require_qa_on_output` | `boolean` | `true` |
| `auto_create_by_product_lp` | `boolean` | `true` |
| `enable_material_reservations` | `boolean` | `true` |
| `dashboard_refresh_seconds` | `integer` | `30` |
| `show_material_alerts` | `boolean` | `true` |
| `show_delay_alerts` | `boolean` | `true` |
| `show_quality_alerts` | `boolean` | `true` |
| `enable_oee_tracking` | `boolean` | `false` |
| `target_oee_percent` | `integer` | `85` |
| `enable_downtime_tracking` | `boolean` | `false` |
| `created_at` | `timestamptz` | `now()` |
| `updated_at` | `timestamptz` | `now()` |

### Row Level Security (RLS)

The API uses `createServerSupabaseAdmin()` for writes (bypasses RLS). GET requests use user context - RLS should allow reads based on `org_id` matching the user's organization.
