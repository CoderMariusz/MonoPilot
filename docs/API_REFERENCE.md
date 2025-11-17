# API Reference Documentation

## Overview

The MonoPilot MES system uses a dual-mode API layer that seamlessly switches between mock data (development) and real Supabase data (production).

**Last Updated**: 2025-11-16 (auto-generated)

## API Classes

### AllergensAPI

**Source**: `apps/frontend/lib/api/allergens.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(): Promise<Allergen[]>
```

**Returns**: `Promise<Allergen[]>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: number): Promise<Allergen | null>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<Allergen | null>`

---

#### `create()`

**Signature**:
```typescript
static async create(data: CreateAllergenData): Promise<Allergen>
```

**Parameters**:
- `data: CreateAllergenData`

**Returns**: `Promise<Allergen>`

---

#### `update()`

**Signature**:
```typescript
static async update(id: number, data: UpdateAllergenData): Promise<Allergen>
```

**Parameters**:
- `id: number`
- `data: UpdateAllergenData`

**Returns**: `Promise<Allergen>`

---

#### `delete()`

**Signature**:
```typescript
static async delete(id: number): Promise<void>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<void>`

---

### AuditLogsAPI

**Source**: `apps/frontend/lib/api/audit.ts`

**Methods**:

#### `getAll()`

Get all audit logs with optional filtering and pagination Returns unified view of application-level and database-level audit trails

**Signature**:
```typescript
static async getAll(filters?: AuditLogFilters, pagination?: PaginationParams): Promise<AuditLogsResponse>
```

**Parameters**:
- `filters?: AuditLogFilters`
- `pagination?: PaginationParams`

**Returns**: `Promise<AuditLogsResponse>`

---

#### `getEntityAuditTrail()`

Get audit trail for a specific entity Returns complete history of changes for an entity

**Signature**:
```typescript
static async getEntityAuditTrail(entityName: string, entityId: number): Promise<AuditLog[]>
```

**Parameters**:
- `entityName: string`
- `entityId: number`

**Returns**: `Promise<AuditLog[]>`

---

#### `getStats()`

Get pgAudit statistics for performance monitoring Returns log volume metrics and retention info

**Signature**:
```typescript
static async getStats(): Promise<{
    total_logs: number;
    logs_last_24h: number;
    logs_last_7d: number;
    oldest_log: string | null;
    newest_log: string | null;
    avg_logs_per_day: number;
  }>
```

**Returns**: `Promise<{
    total_logs: number;
    logs_last_24h: number;
    logs_last_7d: number;
    oldest_log: string | null;
    newest_log: string | null;
    avg_logs_per_day: number;
  }>`

---

#### `exportToCSV()`

Export audit logs to CSV format Returns CSV string with all audit log data Limited to MAX_EXPORT_LIMIT (5000) records to prevent memory exhaustion

**Signature**:
```typescript
static async exportToCSV(filters?: AuditLogFilters): Promise<string>
```

**Parameters**:
- `filters?: AuditLogFilters`

**Returns**: `Promise<string>`

---

#### `archiveOldLogs()`

Archive old audit logs (admin only) Deletes logs older than specified retention period @param retentionDays Number of days to retain logs (default: 90)

**Signature**:
```typescript
static async archiveOldLogs(retentionDays: number = 90): Promise<number>
```

**Parameters**:
- `retentionDays: number = 90`

**Returns**: `Promise<number>`

---

#### `addReason()`

Add a reason to the most recent audit event for an entity Legacy method - kept for backward compatibility

**Signature**:
```typescript
static async addReason(entityType: string, entityId: number, reason: string): Promise<void>
```

**Parameters**:
- `entityType: string`
- `entityId: number`
- `reason: string`

**Returns**: `Promise<void>`

---

### BomHistoryAPI

**Source**: `apps/frontend/lib/api/bomHistory.ts`

**Methods**:

#### `create()`

**Signature**:
```typescript
static async create(data: {
    bom_id: number;
    version: string;
    status_from: string;
    status_to: string;
    changes: object;
    description?: string;
  }): Promise<BomHistory>
```

**Parameters**:
- `data: {
    bom_id: number;
    version: string;
    status_from: string;
    status_to: string;
    changes: object;
    description?: string;
  }`

**Returns**: `Promise<BomHistory>`

---

#### `getByBomId()`

**Signature**:
```typescript
static async getByBomId(bomId: number): Promise<BomHistory[]>
```

**Parameters**:
- `bomId: number`

**Returns**: `Promise<BomHistory[]>`

---

#### `getAll()`

**Signature**:
```typescript
static async getAll(options?: {
    limit?: number;
    offset?: number;
    bom_id?: number;
  }): Promise<BomHistory[]>
```

**Parameters**:
- `options?: {
    limit?: number;
    offset?: number;
    bom_id?: number;
  }`

**Returns**: `Promise<BomHistory[]>`

---

### ConsumeAPI

**Source**: `apps/frontend/lib/api/consume.ts`

**Methods**:

#### `getConsumptionData()`

**Signature**:
```typescript
static async getConsumptionData(params: {
    woId?: number;
    from?: string;
    to?: string;
    materialId?: number;
    line?: string;
  }): Promise<{
    data: Array<{
      wo_number: string;
      production_date_london: string;
      production_date_utc: string;
      product: string;
      material: string;
      material_part_number: string;
      bom_standard_kg: number;
      actual_consumed_kg: number;
      variance_kg: number;
      variance_percent: number;
      production_line: string;
      work_order_status: string;
      one_to_one: boolean;
      is_optional: boolean;
    }>
```

**Parameters**:
- `params: {
    woId?: number;
    from?: string;
    to?: string;
    materialId?: number;
    line?: string;
  }`

**Returns**: `Promise<{
    data: Array<{
      wo_number: string;
      production_date_london: string;
      production_date_utc: string;
      product: string;
      material: string;
      material_part_number: string;
      bom_standard_kg: number;
      actual_consumed_kg: number;
      variance_kg: number;
      variance_percent: number;
      production_line: string;
      work_order_status: string;
      one_to_one: boolean;
      is_optional: boolean;
    }>`

---

#### `getConsumptionVarianceByMaterial()`

**Signature**:
```typescript
static async getConsumptionVarianceByMaterial(params: {
    from?: string;
    to?: string;
    line?: string;
  }): Promise<Array<{
    material_id: number;
    material_name: string;
    material_part_number: string;
    total_standard_kg: number;
    total_actual_kg: number;
    total_variance_kg: number;
    avg_variance_percent: number;
    work_order_count: number;
    one_to_one_count: number;
  }>
```

**Parameters**:
- `params: {
    from?: string;
    to?: string;
    line?: string;
  }`

**Returns**: `Promise<Array<{
    material_id: number;
    material_name: string;
    material_part_number: string;
    total_standard_kg: number;
    total_actual_kg: number;
    total_variance_kg: number;
    avg_variance_percent: number;
    work_order_count: number;
    one_to_one_count: number;
  }>`

---

#### `getConsumptionTrends()`

**Signature**:
```typescript
static async getConsumptionTrends(params: {
    materialId?: number;
    line?: string;
    bucket: 'day' | 'week' | 'month';
    from?: string;
    to?: string;
  }): Promise<Array<{
    date: string;
    standard_kg: number;
    actual_kg: number;
    variance_kg: number;
    variance_percent: number;
    work_order_count: number;
  }>
```

**Parameters**:
- `params: {
    materialId?: number;
    line?: string;
    bucket: 'day' | 'week' | 'month';
    from?: string;
    to?: string;
  }`

**Returns**: `Promise<Array<{
    date: string;
    standard_kg: number;
    actual_kg: number;
    variance_kg: number;
    variance_percent: number;
    work_order_count: number;
  }>`

---

### GRNsAPI

**Source**: `apps/frontend/lib/api/grns.ts`

**Methods**:

#### `create()`

Create a new GRN from ASN receiving

**Signature**:
```typescript
static async create(data: CreateGRNData): Promise<GRN>
```

**Parameters**:
- `data: CreateGRNData`

**Returns**: `Promise<GRN>`

---

#### `getById()`

Get GRN by ID

**Signature**:
```typescript
static async getById(id: number): Promise<GRN | null>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<GRN | null>`

---

#### `getAll()`

Get all GRNs

**Signature**:
```typescript
static async getAll(): Promise<GRN[]>
```

**Returns**: `Promise<GRN[]>`

---

### LicensePlatesAPI

**Source**: `apps/frontend/lib/api/licensePlates.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(filters?: {
    qa_status?: QAStatus;
    location?: string;
    product_id?: number;
    stage_suffix?: string;
    origin_type?: string;
    has_reservations?: boolean;
  }): Promise<{
    data: Array<{
      id: number;
      lp_number: string;
      product_id: number;
      product_description: string;
      product_part_number: string;
      location_id: number;
      location_name: string;
      quantity: number;
      uom: string;
      qa_status: string;
      stage_suffix: string;
      parent_lp_id: number;
      parent_lp_number: string;
      origin_type: string;
      origin_ref: any;
      available_qty: number;
      reserved_qty: number;
      created_at: string;
      updated_at: string;
    }>
```

**Parameters**:
- `filters?: {
    qa_status?: QAStatus;
    location?: string;
    product_id?: number;
    stage_suffix?: string;
    origin_type?: string;
    has_reservations?: boolean;
  }`

**Returns**: `Promise<{
    data: Array<{
      id: number;
      lp_number: string;
      product_id: number;
      product_description: string;
      product_part_number: string;
      location_id: number;
      location_name: string;
      quantity: number;
      uom: string;
      qa_status: string;
      stage_suffix: string;
      parent_lp_id: number;
      parent_lp_number: string;
      origin_type: string;
      origin_ref: any;
      available_qty: number;
      reserved_qty: number;
      created_at: string;
      updated_at: string;
    }>`

---

#### `getLPComposition()`

**Signature**:
```typescript
static async getLPComposition(lpId: number): Promise<{
    forward: Array<{
      node_id: number;
      node_type: string;
      lp_number: string;
      product_description: string;
      quantity: number;
      uom: string;
      qa_status: string;
      stage_suffix: string;
      location: string;
      parent_node: string;
      depth: number;
      composition_qty: number;
      pallet_code: string;
    }>
```

**Parameters**:
- `lpId: number`

**Returns**: `Promise<{
    forward: Array<{
      node_id: number;
      node_type: string;
      lp_number: string;
      product_description: string;
      quantity: number;
      uom: string;
      qa_status: string;
      stage_suffix: string;
      location: string;
      parent_node: string;
      depth: number;
      composition_qty: number;
      pallet_code: string;
    }>`

---

#### `split()`

**Signature**:
```typescript
static async split(lpId: number, childQuantities: Array<{ quantity: number; uom?: string }>, userId: string, woId?: number, opSeq?: number): Promise<{
    parent_lp: { id: number; lp_number: string; is_consumed: boolean };
    child_lps: Array<{
      id: number;
      lp_number: string;
      quantity: number;
      uom: string;
      batch: string | null;
      expiry_date: string | null;
    }>
```

**Parameters**:
- `lpId: number`
- `childQuantities: Array<{ quantity: number; uom?: string }>`
- `userId: string`
- `woId?: number`
- `opSeq?: number`

**Returns**: `Promise<{
    parent_lp: { id: number; lp_number: string; is_consumed: boolean };
    child_lps: Array<{
      id: number;
      lp_number: string;
      quantity: number;
      uom: string;
      batch: string | null;
      expiry_date: string | null;
    }>`

---

#### `merge()`

**Signature**:
```typescript
static async merge(inputLpIds: number[], outputData: {
      product_id: number;
      location_id: number;
      quantity: number;
      uom: string;
      batch?: string;
      expiry_date?: string;
      qa_status?: string;
      stage_suffix?: string;
    }, userId: string, woId?: number, opSeq?: number): Promise<{
    output_lp: {
      id: number;
      lp_number: string;
      quantity: number;
      uom: string;
    };
    input_lps: Array<{
      id: number;
      lp_number: string;
      quantity: number;
      is_consumed: boolean;
    }>
```

**Parameters**:
- `inputLpIds: number[]`
- `outputData: {
      product_id: number;
      location_id: number;
      quantity: number;
      uom: string;
      batch?: string;
      expiry_date?: string;
      qa_status?: string;
      stage_suffix?: string;
    }`
- `userId: string`
- `woId?: number`
- `opSeq?: number`

**Returns**: `Promise<{
    output_lp: {
      id: number;
      lp_number: string;
      quantity: number;
      uom: string;
    };
    input_lps: Array<{
      id: number;
      lp_number: string;
      quantity: number;
      is_consumed: boolean;
    }>`

---

#### `getGenealogy()`

**Signature**:
```typescript
static async getGenealogy(lpId: number): Promise<{
    tree: Array<{
      lp_id: number;
      lp_number: string;
      parent_lp_id: number | null;
      parent_lp_number: string | null;
      level: number;
      quantity: number;
      uom: string;
      batch: string | null;
      expiry_date: string | null;
      product_description: string;
      location: string;
      qa_status: string;
      is_consumed: boolean;
      created_at: string;
    }>
```

**Parameters**:
- `lpId: number`

**Returns**: `Promise<{
    tree: Array<{
      lp_id: number;
      lp_number: string;
      parent_lp_id: number | null;
      parent_lp_number: string | null;
      level: number;
      quantity: number;
      uom: string;
      batch: string | null;
      expiry_date: string | null;
      product_description: string;
      location: string;
      qa_status: string;
      is_consumed: boolean;
      created_at: string;
    }>`

---

#### `getReverseGenealogy()`

**Signature**:
```typescript
static async getReverseGenealogy(lpId: number): Promise<{
    chain: Array<{
      lp_id: number;
      lp_number: string;
      parent_lp_id: number | null;
      parent_lp_number: string | null;
      level: number;
      quantity: number;
      uom: string;
      batch: string | null;
      expiry_date: string | null;
      product_description: string;
      location: string;
      qa_status: string;
      is_consumed: boolean;
      created_at: string;
      quantity_consumed: number | null;
      wo_number: string | null;
      operation_sequence: number | null;
    }>
```

**Parameters**:
- `lpId: number`

**Returns**: `Promise<{
    chain: Array<{
      lp_id: number;
      lp_number: string;
      parent_lp_id: number | null;
      parent_lp_number: string | null;
      level: number;
      quantity: number;
      uom: string;
      batch: string | null;
      expiry_date: string | null;
      product_description: string;
      location: string;
      qa_status: string;
      is_consumed: boolean;
      created_at: string;
      quantity_consumed: number | null;
      wo_number: string | null;
      operation_sequence: number | null;
    }>`

---

#### `getLPDetails()`

**Signature**:
```typescript
static async getLPDetails(lpId: number): Promise<{
    id: number;
    lp_number: string;
    product: {
      id: number;
      part_number: string;
      description: string;
      type: string;
      uom: string;
    };
    location: {
      id: number;
      name: string;
      code: string;
    };
    quantity: number;
    qa_status: string;
    stage_suffix: string;
    parent_lp: {
      id: number;
      lp_number: string;
    } | null;
    origin: {
      type: string;
      ref: any;
    };
    reservations: Array<{
      id: number;
      wo_id: number;
      wo_number: string;
      qty: number;
      status: string;
      created_at: string;
    }>
```

**Parameters**:
- `lpId: number`

**Returns**: `Promise<{
    id: number;
    lp_number: string;
    product: {
      id: number;
      part_number: string;
      description: string;
      type: string;
      uom: string;
    };
    location: {
      id: number;
      name: string;
      code: string;
    };
    quantity: number;
    qa_status: string;
    stage_suffix: string;
    parent_lp: {
      id: number;
      lp_number: string;
    } | null;
    origin: {
      type: string;
      ref: any;
    };
    reservations: Array<{
      id: number;
      wo_id: number;
      wo_number: string;
      qty: number;
      status: string;
      created_at: string;
    }>`

---

#### `getValidUoMs()`

Get all valid Units of Measure from uom_master table @returns Array of UoM objects with code, display_name, and category

**Signature**:
```typescript
static async getValidUoMs(): Promise<Array<{
    code: string;
    display_name: string;
    category: string;
  }>
```

**Returns**: `Promise<Array<{
    code: string;
    display_name: string;
    category: string;
  }>`

---

#### `validateUoM()`

Validate UoM against uom_master table @param uom - Unit of measure code to validate @returns true if valid, false otherwise

**Signature**:
```typescript
static async validateUoM(uom: string): Promise<boolean>
```

**Parameters**:
- `uom: string`

**Returns**: `Promise<boolean>`

---

#### `create()`

Create new License Plate Story 1.7.1 - Single-Screen Scanner @param data - License Plate creation data @returns Created license plate

**Signature**:
```typescript
static async create(data: {
    lp_number: string;
    product_id: number;
    quantity: number;
    uom: string;
    location_id: number;
    warehouse_id: number;
    status: 'available' | 'reserved' | 'consumed' | 'in_transit' | 'quarantine' | 'damaged';
    qa_status?: 'pending' | 'passed' | 'failed' | 'on_hold';
    batch_number?: string;
    expiry_date?: string | null;
    grn_id?: number;
    po_number?: string;
    supplier_batch_number?: string;
  }): Promise<any>
```

**Parameters**:
- `data: {
    lp_number: string;
    product_id: number;
    quantity: number;
    uom: string;
    location_id: number;
    warehouse_id: number;
    status: 'available' | 'reserved' | 'consumed' | 'in_transit' | 'quarantine' | 'damaged';
    qa_status?: 'pending' | 'passed' | 'failed' | 'on_hold';
    batch_number?: string;
    expiry_date?: string | null;
    grn_id?: number;
    po_number?: string;
    supplier_batch_number?: string;
  }`

**Returns**: `Promise<any>`

---

### LocationsAPI

**Source**: `apps/frontend/lib/api/locations.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(): Promise<Location[]>
```

**Returns**: `Promise<Location[]>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: number): Promise<Location | null>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<Location | null>`

---

#### `create()`

**Signature**:
```typescript
static async create(data: CreateLocationData): Promise<Location>
```

**Parameters**:
- `data: CreateLocationData`

**Returns**: `Promise<Location>`

---

#### `update()`

**Signature**:
```typescript
static async update(id: number, data: UpdateLocationData): Promise<Location>
```

**Parameters**:
- `id: number`
- `data: UpdateLocationData`

**Returns**: `Promise<Location>`

---

#### `delete()`

**Signature**:
```typescript
static async delete(id: number): Promise<void>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<void>`

---

### MachinesAPI

**Source**: `apps/frontend/lib/api/machines.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(): Promise<Machine[]>
```

**Returns**: `Promise<Machine[]>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: number): Promise<Machine | null>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<Machine | null>`

---

#### `create()`

**Signature**:
```typescript
static async create(data: CreateMachineData): Promise<Machine>
```

**Parameters**:
- `data: CreateMachineData`

**Returns**: `Promise<Machine>`

---

#### `update()`

**Signature**:
```typescript
static async update(id: number, data: UpdateMachineData): Promise<Machine>
```

**Parameters**:
- `id: number`
- `data: UpdateMachineData`

**Returns**: `Promise<Machine>`

---

#### `delete()`

**Signature**:
```typescript
static async delete(id: number): Promise<void>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<void>`

---

### NPDProjectsAPI

**Source**: `apps/frontend/lib/api/npdProjects.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(filters?: NPDProjectFilters): Promise<NPDProject[]>
```

**Parameters**:
- `filters?: NPDProjectFilters`

**Returns**: `Promise<NPDProject[]>`

---

#### `getById()`

Get NPD project by ID RLS: Only returns project if it belongs to user's org  @param id - Project UUID @returns Promise<NPDProject | null>

**Signature**:
```typescript
static async getById(id: string): Promise<NPDProject | null>
```

**Parameters**:
- `id: string`

**Returns**: `Promise<NPDProject | null>`

---

#### `create()`

**Signature**:
```typescript
static async create(data: CreateNPDProjectInput): Promise<NPDProject>
```

**Parameters**:
- `data: CreateNPDProjectInput`

**Returns**: `Promise<NPDProject>`

---

#### `update()`

**Signature**:
```typescript
static async update(id: string, data: UpdateNPDProjectInput): Promise<NPDProject>
```

**Parameters**:
- `id: string`
- `data: UpdateNPDProjectInput`

**Returns**: `Promise<NPDProject>`

---

#### `delete()`

**Signature**:
```typescript
static async delete(id: string): Promise<void>
```

**Parameters**:
- `id: string`

**Returns**: `Promise<void>`

---

#### `advanceGate()`

**Signature**:
```typescript
static async advanceGate(id: string, toGate: NPDProjectGate): Promise<NPDProject>
```

**Parameters**:
- `id: string`
- `toGate: NPDProjectGate`

**Returns**: `Promise<NPDProject>`

---

### PalletsAPI

**Source**: `apps/frontend/lib/api/pallets.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(filters?: {
    status?: 'open' | 'closed' | 'shipped';
    location_id?: number;
    wo_id?: number;
    pallet_type?: string;
  }): Promise<{
    data: Array<{
      id: number;
      pallet_number: string;
      pallet_type: string;
      wo_id: number | null;
      wo_number: string | null;
      line: string | null;
      location_id: number | null;
      location_name: string | null;
      status: string;
      target_boxes: number | null;
      actual_boxes: number | null;
      item_count: number;
      total_quantity: number;
      created_at: string;
      created_by: string | null;
      closed_at: string | null;
      closed_by: string | null;
    }>
```

**Parameters**:
- `filters?: {
    status?: 'open' | 'closed' | 'shipped';
    location_id?: number;
    wo_id?: number;
    pallet_type?: string;
  }`

**Returns**: `Promise<{
    data: Array<{
      id: number;
      pallet_number: string;
      pallet_type: string;
      wo_id: number | null;
      wo_number: string | null;
      line: string | null;
      location_id: number | null;
      location_name: string | null;
      status: string;
      target_boxes: number | null;
      actual_boxes: number | null;
      item_count: number;
      total_quantity: number;
      created_at: string;
      created_by: string | null;
      closed_at: string | null;
      closed_by: string | null;
    }>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: number): Promise<{
    pallet: {
      id: number;
      pallet_number: string;
      pallet_type: string;
      wo_id: number | null;
      wo_number: string | null;
      line: string | null;
      location_id: number | null;
      location_name: string | null;
      status: string;
      target_boxes: number | null;
      actual_boxes: number | null;
      created_at: string;
      created_by: string | null;
      closed_at: string | null;
      closed_by: string | null;
    };
    items: Array<{
      id: number;
      lp_id: number;
      lp_number: string;
      product_description: string;
      quantity: number;
      uom: string;
      batch: string | null;
      expiry_date: string | null;
      added_at: string;
      added_by: string | null;
    }>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<{
    pallet: {
      id: number;
      pallet_number: string;
      pallet_type: string;
      wo_id: number | null;
      wo_number: string | null;
      line: string | null;
      location_id: number | null;
      location_name: string | null;
      status: string;
      target_boxes: number | null;
      actual_boxes: number | null;
      created_at: string;
      created_by: string | null;
      closed_at: string | null;
      closed_by: string | null;
    };
    items: Array<{
      id: number;
      lp_id: number;
      lp_number: string;
      product_description: string;
      quantity: number;
      uom: string;
      batch: string | null;
      expiry_date: string | null;
      added_at: string;
      added_by: string | null;
    }>`

---

#### `create()`

**Signature**:
```typescript
static async create(data: {
    pallet_number?: string; // Auto-generate if not provided
    pallet_type: 'EURO' | 'CHEP' | 'CUSTOM' | 'OTHER';
    wo_id?: number;
    line?: string;
    location_id?: number;
    target_boxes?: number;
    userId: string;
  }): Promise<{
    id: number;
    pallet_number: string;
  }>
```

**Parameters**:
- `data: {
    pallet_number?: string; // Auto-generate if not provided
    pallet_type: 'EURO' | 'CHEP' | 'CUSTOM' | 'OTHER';
    wo_id?: number;
    line?: string;
    location_id?: number;
    target_boxes?: number;
    userId: string;
  }`

**Returns**: `Promise<{
    id: number;
    pallet_number: string;
  }>`

---

#### `addLP()`

**Signature**:
```typescript
static async addLP(data: {
    pallet_id: number;
    lp_id: number;
    quantity?: number; // Optional, use full LP quantity if not specified
    userId: string;
  }): Promise<{
    item_id: number;
    lp_number: string;
  }>
```

**Parameters**:
- `data: {
    pallet_id: number;
    lp_id: number;
    quantity?: number; // Optional`
- `use full LP quantity if not specified
    userId: string;
  }`

**Returns**: `Promise<{
    item_id: number;
    lp_number: string;
  }>`

---

#### `removeLP()`

**Signature**:
```typescript
static async removeLP(data: {
    pallet_id: number;
    lp_id: number;
    userId: string;
  }): Promise<void>
```

**Parameters**:
- `data: {
    pallet_id: number;
    lp_id: number;
    userId: string;
  }`

**Returns**: `Promise<void>`

---

#### `close()`

**Signature**:
```typescript
static async close(data: {
    pallet_id: number;
    actual_boxes?: number;
    userId: string;
  }): Promise<void>
```

**Parameters**:
- `data: {
    pallet_id: number;
    actual_boxes?: number;
    userId: string;
  }`

**Returns**: `Promise<void>`

---

#### `reopen()`

**Signature**:
```typescript
static async reopen(data: {
    pallet_id: number;
    userId: string;
  }): Promise<void>
```

**Parameters**:
- `data: {
    pallet_id: number;
    userId: string;
  }`

**Returns**: `Promise<void>`

---

#### `markShipped()`

**Signature**:
```typescript
static async markShipped(data: {
    pallet_id: number;
    userId: string;
  }): Promise<void>
```

**Parameters**:
- `data: {
    pallet_id: number;
    userId: string;
  }`

**Returns**: `Promise<void>`

---

#### `delete()`

**Signature**:
```typescript
static async delete(palletId: number): Promise<void>
```

**Parameters**:
- `palletId: number`

**Returns**: `Promise<void>`

---

### ProductsServerAPI

**Source**: `apps/frontend/lib/api/products.server.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(): Promise<Product[]>
```

**Returns**: `Promise<Product[]>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: number): Promise<Product | null>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<Product | null>`

---

### ProductsAPI

**Source**: `apps/frontend/lib/api/products.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(): Promise<Product[]>
```

**Returns**: `Promise<Product[]>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: number): Promise<Product | null>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<Product | null>`

---

#### `update()`

**Signature**:
```typescript
static async update(id: number, data: UpdateProductData): Promise<Product>
```

**Parameters**:
- `id: number`
- `data: UpdateProductData`

**Returns**: `Promise<Product>`

---

#### `checkPartNumberExists()`

**Signature**:
```typescript
static async checkPartNumberExists(partNumber: string, excludeId?: number): Promise<boolean>
```

**Parameters**:
- `partNumber: string`
- `excludeId?: number`

**Returns**: `Promise<boolean>`

---

### PurchaseOrdersAPI

**Source**: `apps/frontend/lib/api/purchaseOrders.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(): Promise<PurchaseOrder[]>
```

**Returns**: `Promise<PurchaseOrder[]>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: number): Promise<PurchaseOrder | null>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<PurchaseOrder | null>`

---

#### `getDefaultUnitPrice()`

**Signature**:
```typescript
static async getDefaultUnitPrice(productId: number, supplierId?: number, asOfDate?: Date, currency?: string): Promise<number>
```

**Parameters**:
- `productId: number`
- `supplierId?: number`
- `asOfDate?: Date`
- `currency?: string`

**Returns**: `Promise<number>`

---

#### `cancel()`

**Signature**:
```typescript
static async cancel(id: number, reason?: string, source?: string): Promise<{ success: boolean; message: string }>
```

**Parameters**:
- `id: number`
- `reason?: string`
- `source?: string`

**Returns**: `Promise<{ success: boolean; message: string }>`

---

#### `close()`

**Signature**:
```typescript
static async close(id: number): Promise<{ success: boolean; message: string; grnNumber?: string }>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<{ success: boolean; message: string; grnNumber?: string }>`

---

#### `quickCreate()`

**Signature**:
```typescript
static async quickCreate(request: QuickPOCreateRequest): Promise<QuickPOCreateResponse>
```

**Parameters**:
- `request: QuickPOCreateRequest`

**Returns**: `Promise<QuickPOCreateResponse>`

---

#### `delete()`

**Signature**:
```typescript
static async delete(id: number): Promise<{ success: boolean; message: string }>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<{ success: boolean; message: string }>`

---

### RoutingOperationNamesAPI

**Source**: `apps/frontend/lib/api/routingOperationNames.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(): Promise<RoutingOperationName[]>
```

**Returns**: `Promise<RoutingOperationName[]>`

---

#### `getAllIncludingInactive()`

**Signature**:
```typescript
static async getAllIncludingInactive(): Promise<RoutingOperationName[]>
```

**Returns**: `Promise<RoutingOperationName[]>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: number): Promise<RoutingOperationName | null>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<RoutingOperationName | null>`

---

#### `create()`

**Signature**:
```typescript
static async create(data: CreateRoutingOperationNameDTO): Promise<RoutingOperationName>
```

**Parameters**:
- `data: CreateRoutingOperationNameDTO`

**Returns**: `Promise<RoutingOperationName>`

---

#### `update()`

**Signature**:
```typescript
static async update(id: number, data: UpdateRoutingOperationNameDTO): Promise<RoutingOperationName>
```

**Parameters**:
- `id: number`
- `data: UpdateRoutingOperationNameDTO`

**Returns**: `Promise<RoutingOperationName>`

---

#### `delete()`

**Signature**:
```typescript
static async delete(id: number): Promise<void>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<void>`

---

#### `hardDelete()`

**Signature**:
```typescript
static async hardDelete(id: number): Promise<void>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<void>`

---

### RoutingsAPI

**Source**: `apps/frontend/lib/api/routings.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(): Promise<Routing[]>
```

**Returns**: `Promise<Routing[]>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: number): Promise<Routing>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<Routing>`

---

#### `create()`

**Signature**:
```typescript
static async create(data: CreateRoutingDTO): Promise<Routing>
```

**Parameters**:
- `data: CreateRoutingDTO`

**Returns**: `Promise<Routing>`

---

#### `update()`

**Signature**:
```typescript
static async update(id: number, data: Partial<Omit<Routing, 'id' | 'created_at' | 'updated_at' | 'operations'>> & { operations?: Omit<RoutingOperation, 'id' | 'routing_id' | 'created_at' | 'updated_at'>[] }): Promise<Routing>
```

**Parameters**:
- `id: number`
- `data: Partial<Omit<Routing`
- `'id' | 'created_at' | 'updated_at' | 'operations'>> & { operations?: Omit<RoutingOperation`
- `'id' | 'routing_id' | 'created_at' | 'updated_at'>[] }`

**Returns**: `Promise<Routing>`

---

#### `delete()`

**Signature**:
```typescript
static async delete(id: number): Promise<void>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<void>`

---

#### `addOperation()`

**Signature**:
```typescript
static async addOperation(routingId: number, operation: Omit<RoutingOperation, 'id' | 'routing_id' | 'created_at' | 'updated_at'>): Promise<RoutingOperation>
```

**Parameters**:
- `routingId: number`
- `operation: Omit<RoutingOperation`
- `'id' | 'routing_id' | 'created_at' | 'updated_at'>`

**Returns**: `Promise<RoutingOperation>`

---

#### `updateOperation()`

**Signature**:
```typescript
static async updateOperation(operationId: number, data: Partial<Omit<RoutingOperation, 'id' | 'routing_id' | 'created_at' | 'updated_at'>>): Promise<RoutingOperation>
```

**Parameters**:
- `operationId: number`
- `data: Partial<Omit<RoutingOperation`
- `'id' | 'routing_id' | 'created_at' | 'updated_at'>>`

**Returns**: `Promise<RoutingOperation>`

---

#### `deleteOperation()`

**Signature**:
```typescript
static async deleteOperation(operationId: number): Promise<void>
```

**Parameters**:
- `operationId: number`

**Returns**: `Promise<void>`

---

### SuppliersAPI

**Source**: `apps/frontend/lib/api/suppliers.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(): Promise<Supplier[]>
```

**Returns**: `Promise<Supplier[]>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: number): Promise<Supplier | null>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<Supplier | null>`

---

#### `create()`

**Signature**:
```typescript
static async create(data: CreateSupplierData): Promise<Supplier>
```

**Parameters**:
- `data: CreateSupplierData`

**Returns**: `Promise<Supplier>`

---

#### `update()`

**Signature**:
```typescript
static async update(id: number, data: UpdateSupplierData): Promise<Supplier>
```

**Parameters**:
- `id: number`
- `data: UpdateSupplierData`

**Returns**: `Promise<Supplier>`

---

#### `delete()`

**Signature**:
```typescript
static async delete(id: number): Promise<void>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<void>`

---

### TaxCodesAPI

**Source**: `apps/frontend/lib/api/taxCodes.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(): Promise<TaxCode[]>
```

**Returns**: `Promise<TaxCode[]>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: number): Promise<TaxCode>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<TaxCode>`

---

#### `create()`

**Signature**:
```typescript
static async create(data: Omit<TaxCode, 'id' | 'created_at' | 'updated_at'>): Promise<TaxCode>
```

**Parameters**:
- `data: Omit<TaxCode`
- `'id' | 'created_at' | 'updated_at'>`

**Returns**: `Promise<TaxCode>`

---

#### `update()`

**Signature**:
```typescript
static async update(id: number, data: Partial<Omit<TaxCode, 'id' | 'created_at' | 'updated_at'>>): Promise<TaxCode>
```

**Parameters**:
- `id: number`
- `data: Partial<Omit<TaxCode`
- `'id' | 'created_at' | 'updated_at'>>`

**Returns**: `Promise<TaxCode>`

---

#### `delete()`

**Signature**:
```typescript
static async delete(id: number): Promise<void>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<void>`

---

### TransferOrdersAPI

**Source**: `apps/frontend/lib/api/transferOrders.ts`

**Methods**:

#### `update()`

**Signature**:
```typescript
static async update(toId: number, payload: UpdateTransferOrderRequest): Promise<TOHeader>
```

**Parameters**:
- `toId: number`
- `payload: UpdateTransferOrderRequest`

**Returns**: `Promise<TOHeader>`

---

#### `getAll()`

**Signature**:
```typescript
static async getAll(): Promise<TransferOrder[]>
```

**Returns**: `Promise<TransferOrder[]>`

---

#### `create()`

**Signature**:
```typescript
static async create(payload: CreateTransferOrderRequest): Promise<TOHeader>
```

**Parameters**:
- `payload: CreateTransferOrderRequest`

**Returns**: `Promise<TOHeader>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: number): Promise<TransferOrder | null>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<TransferOrder | null>`

---

#### `cancel()`

**Signature**:
```typescript
static async cancel(id: number, reason?: string, source?: string): Promise<{ success: boolean; message: string }>
```

**Parameters**:
- `id: number`
- `reason?: string`
- `source?: string`

**Returns**: `Promise<{ success: boolean; message: string }>`

---

#### `markShipped()`

Mark a transfer order as shipped Sets actual_ship_date and updates status to 'in_transit' Only works if current status is 'submitted'

**Signature**:
```typescript
static async markShipped(toId: number, actualShipDate: string): Promise<TOHeader>
```

**Parameters**:
- `toId: number`
- `actualShipDate: string`

**Returns**: `Promise<TOHeader>`

---

#### `markReceived()`

**Signature**:
```typescript
static async markReceived(toId: number, actualReceiveDate: string, lineUpdates: MarkReceivedLineUpdate[]): Promise<TOHeader>
```

**Parameters**:
- `toId: number`
- `actualReceiveDate: string`
- `lineUpdates: MarkReceivedLineUpdate[]`

**Returns**: `Promise<TOHeader>`

---

#### `delete()`

**Signature**:
```typescript
static async delete(toId: number): Promise<void>
```

**Parameters**:
- `toId: number`

**Returns**: `Promise<void>`

---

### UsersAPI

**Source**: `apps/frontend/lib/api/users.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(): Promise<User[]>
```

**Returns**: `Promise<User[]>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: string): Promise<User | null>
```

**Parameters**:
- `id: string`

**Returns**: `Promise<User | null>`

---

#### `create()`

**Signature**:
```typescript
static async create(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    status?: string;
  }): Promise<{ user?: User; error?: any }>
```

**Parameters**:
- `userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    status?: string;
  }`

**Returns**: `Promise<{ user?: User; error?: any }>`

---

#### `update()`

**Signature**:
```typescript
static async update(id: string, updates: Partial<User>): Promise<{ user?: User; error?: any }>
```

**Parameters**:
- `id: string`
- `updates: Partial<User>`

**Returns**: `Promise<{ user?: User; error?: any }>`

---

#### `delete()`

**Signature**:
```typescript
static async delete(id: string): Promise<{ error?: any }>
```

**Parameters**:
- `id: string`

**Returns**: `Promise<{ error?: any }>`

---

#### `updateStatus()`

**Signature**:
```typescript
static async updateStatus(id: string, status: string): Promise<{ user?: User; error?: any }>
```

**Parameters**:
- `id: string`
- `status: string`

**Returns**: `Promise<{ user?: User; error?: any }>`

---

#### `updateRole()`

**Signature**:
```typescript
static async updateRole(id: string, role: string): Promise<{ user?: User; error?: any }>
```

**Parameters**:
- `id: string`
- `role: string`

**Returns**: `Promise<{ user?: User; error?: any }>`

---

### WarehousesAPI

**Source**: `apps/frontend/lib/api/warehouses.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(): Promise<Warehouse[]>
```

**Returns**: `Promise<Warehouse[]>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: number): Promise<Warehouse | null>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<Warehouse | null>`

---

#### `create()`

**Signature**:
```typescript
static async create(data: CreateWarehouseData): Promise<Warehouse>
```

**Parameters**:
- `data: CreateWarehouseData`

**Returns**: `Promise<Warehouse>`

---

#### `update()`

**Signature**:
```typescript
static async update(id: number, data: UpdateWarehouseData): Promise<Warehouse>
```

**Parameters**:
- `id: number`
- `data: UpdateWarehouseData`

**Returns**: `Promise<Warehouse>`

---

#### `delete()`

**Signature**:
```typescript
static async delete(id: number): Promise<void>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<void>`

---

### WorkOrdersAPI

**Source**: `apps/frontend/lib/api/workOrders.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(filters?: {
    line?: string;
    qa_status?: string;
    date_bucket?: 'day' | 'week' | 'month';
    kpi_scope?: 'PR' | 'FG';
    status?: string;
  }): Promise<WorkOrder[]>
```

**Parameters**:
- `filters?: {
    line?: string;
    qa_status?: string;
    date_bucket?: 'day' | 'week' | 'month';
    kpi_scope?: 'PR' | 'FG';
    status?: string;
  }`

**Returns**: `Promise<WorkOrder[]>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: number): Promise<WorkOrder | null>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<WorkOrder | null>`

---

#### `create()`

**Signature**:
```typescript
static async create(data: CreateWorkOrderData): Promise<WorkOrder>
```

**Parameters**:
- `data: CreateWorkOrderData`

**Returns**: `Promise<WorkOrder>`

---

#### `update()`

**Signature**:
```typescript
static async update(id: number, data: UpdateWorkOrderData): Promise<WorkOrder>
```

**Parameters**:
- `id: number`
- `data: UpdateWorkOrderData`

**Returns**: `Promise<WorkOrder>`

---

#### `delete()`

**Signature**:
```typescript
static async delete(id: number): Promise<boolean>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<boolean>`

---

#### `getProductionStats()`

**Signature**:
```typescript
static async getProductionStats(woId: number): Promise<{ madeQty: number; plannedQty: number; progressPct: number }>
```

**Parameters**:
- `woId: number`

**Returns**: `Promise<{ madeQty: number; plannedQty: number; progressPct: number }>`

---

#### `cancel()`

**Signature**:
```typescript
static async cancel(id: number, reason?: string, source?: string): Promise<{ success: boolean; message: string }>
```

**Parameters**:
- `id: number`
- `reason?: string`
- `source?: string`

**Returns**: `Promise<{ success: boolean; message: string }>`

---

#### `getWorkOrderStageStatus()`

**Signature**:
```typescript
static async getWorkOrderStageStatus(woId: number): Promise<{
    wo_id: number;
    operations: Array<{
      seq: number;
      operation_name: string;
      required_kg: number;
      staged_kg: number;
      in_kg: number;
      remaining_kg: number;
      color_code: 'green' | 'amber' | 'red';
      one_to_one_components: Array<{
        material_id: number;
        material_name: string;
        one_to_one: boolean;
      }>
```

**Parameters**:
- `woId: number`

**Returns**: `Promise<{
    wo_id: number;
    operations: Array<{
      seq: number;
      operation_name: string;
      required_kg: number;
      staged_kg: number;
      in_kg: number;
      remaining_kg: number;
      color_code: 'green' | 'amber' | 'red';
      one_to_one_components: Array<{
        material_id: number;
        material_name: string;
        one_to_one: boolean;
      }>`

---

#### `recordByProductOutput()`

**Signature**:
```typescript
static async recordByProductOutput(woId: number, byProductId: number, actualQuantity: number, locationId: number, notes?: string): Promise<{ lp_id: number; lp_number: string }>
```

**Parameters**:
- `woId: number`
- `byProductId: number`
- `actualQuantity: number`
- `locationId: number`
- `notes?: string`

**Returns**: `Promise<{ lp_id: number; lp_number: string }>`

---

#### `evaluateConditionalMaterials()`

**Signature**:
```typescript
static async evaluateConditionalMaterials(bomId: number, woContext: {
      order_flags?: string[];
      customer_id?: number;
      order_type?: string;
    }): Promise<Array<{
    bom_item_id: number;
    material_id: number;
    quantity: number;
    uom: string;
    sequence: number;
    is_conditional: boolean;
    condition_met: boolean;
    condition: any;
  }>
```

**Parameters**:
- `bomId: number`
- `woContext: {
      order_flags?: string[];
      customer_id?: number;
      order_type?: string;
    }`

**Returns**: `Promise<Array<{
    bom_item_id: number;
    material_id: number;
    quantity: number;
    uom: string;
    sequence: number;
    is_conditional: boolean;
    condition_met: boolean;
    condition: any;
  }>`

---

#### `getAllMaterialsWithEvaluation()`

**Signature**:
```typescript
static async getAllMaterialsWithEvaluation(bomId: number, woContext: {
      order_flags?: string[];
      customer_id?: number;
      order_type?: string;
    }): Promise<Array<{
    bom_item_id: number;
    material_id: number;
    quantity: number;
    uom: string;
    sequence: number;
    is_conditional: boolean;
    condition_met: boolean;
    condition: any;
    is_by_product: boolean;
  }>
```

**Parameters**:
- `bomId: number`
- `woContext: {
      order_flags?: string[];
      customer_id?: number;
      order_type?: string;
    }`

**Returns**: `Promise<Array<{
    bom_item_id: number;
    material_id: number;
    quantity: number;
    uom: string;
    sequence: number;
    is_conditional: boolean;
    condition_met: boolean;
    condition: any;
    is_by_product: boolean;
  }>`

---

#### `createWithConditionalMaterials()`

**Signature**:
```typescript
static async createWithConditionalMaterials(data: CreateWorkOrderData & {
      order_flags?: string[];
      customer_id?: number;
      order_type?: string;
    }): Promise<{
    workOrder: WorkOrder;
    evaluatedMaterials: Array<{
      bom_item_id: number;
      material_id: number;
      quantity: number;
      uom: string;
      is_conditional: boolean;
      condition_met: boolean;
    }>
```

**Parameters**:
- `data: CreateWorkOrderData & {
      order_flags?: string[];
      customer_id?: number;
      order_type?: string;
    }`

**Returns**: `Promise<{
    workOrder: WorkOrder;
    evaluatedMaterials: Array<{
      bom_item_id: number;
      material_id: number;
      quantity: number;
      uom: string;
      is_conditional: boolean;
      condition_met: boolean;
    }>`

---

#### `getRequiredMaterials()`

Get required materials for WO with reservation status Uses RPC function get_wo_required_materials() for progress tracking

**Signature**:
```typescript
static async getRequiredMaterials(woId: number): Promise<Array<{
    material_id: number;
    material_part_number: string;
    material_description: string;
    required_qty: number;
    reserved_qty: number;
    consumed_qty: number;
    remaining_qty: number;
    uom: string;
    operation_sequence: number;
    progress_pct: number;
  }>
```

**Parameters**:
- `woId: number`

**Returns**: `Promise<Array<{
    material_id: number;
    material_part_number: string;
    material_description: string;
    required_qty: number;
    reserved_qty: number;
    consumed_qty: number;
    remaining_qty: number;
    uom: string;
    operation_sequence: number;
    progress_pct: number;
  }>`

---

#### `getAvailableLPs()`

Get available LPs for a material (FIFO order) Uses RPC function get_available_lps_for_material()

**Signature**:
```typescript
static async getAvailableLPs(materialId: number, locationId?: number): Promise<Array<{
    lp_id: number;
    lp_number: string;
    quantity: number;
    uom: string;
    batch: string;
    expiry_date: string;
    location_name: string;
    qa_status: string;
    reserved_qty: number;
    available_qty: number;
  }>
```

**Parameters**:
- `materialId: number`
- `locationId?: number`

**Returns**: `Promise<Array<{
    lp_id: number;
    lp_number: string;
    quantity: number;
    uom: string;
    batch: string;
    expiry_date: string;
    location_name: string;
    qa_status: string;
    reserved_qty: number;
    available_qty: number;
  }>`

---

#### `reserveMaterial()`

Reserve material (LP) for work order Creates reservation record and prevents LP from being moved/split

**Signature**:
```typescript
static async reserveMaterial(data: {
    wo_id: number;
    material_id: number;
    lp_id: number;
    quantity_reserved: number;
    uom: string;
    operation_sequence?: number;
    userId: string;
  }): Promise<{
    reservation_id: number;
    lp_number: string;
  }>
```

**Parameters**:
- `data: {
    wo_id: number;
    material_id: number;
    lp_id: number;
    quantity_reserved: number;
    uom: string;
    operation_sequence?: number;
    userId: string;
  }`

**Returns**: `Promise<{
    reservation_id: number;
    lp_number: string;
  }>`

---

#### `releaseReservation()`

Release reservation (cancel without consuming)

**Signature**:
```typescript
static async releaseReservation(data: {
    reservation_id: number;
    userId: string;
  }): Promise<void>
```

**Parameters**:
- `data: {
    reservation_id: number;
    userId: string;
  }`

**Returns**: `Promise<void>`

---

#### `consumeMaterial()`

Consume material from reservation Records consumption and creates genealogy entry

**Signature**:
```typescript
static async consumeMaterial(data: {
    reservation_id: number;
    quantity_consumed: number;
    userId: string;
  }): Promise<{
    consumed_qty: number;
    remaining_qty: number;
  }>
```

**Parameters**:
- `data: {
    reservation_id: number;
    quantity_consumed: number;
    userId: string;
  }`

**Returns**: `Promise<{
    consumed_qty: number;
    remaining_qty: number;
  }>`

---

#### `getReservations()`

Get all reservations for a work order

**Signature**:
```typescript
static async getReservations(woId: number): Promise<Array<{
    id: number;
    material_id: number;
    material_part_number: string;
    material_description: string;
    lp_id: number;
    lp_number: string;
    quantity_reserved: number;
    quantity_consumed: number;
    uom: string;
    status: string;
    batch: string | null;
    expiry_date: string | null;
    reserved_at: string;
    reserved_by: string | null;
    consumed_at: string | null;
  }>
```

**Parameters**:
- `woId: number`

**Returns**: `Promise<Array<{
    id: number;
    material_id: number;
    material_part_number: string;
    material_description: string;
    lp_id: number;
    lp_number: string;
    quantity_reserved: number;
    quantity_consumed: number;
    uom: string;
    status: string;
    batch: string | null;
    expiry_date: string | null;
    reserved_at: string;
    reserved_by: string | null;
    consumed_at: string | null;
  }>`

---

### WOTemplatesAPI

**Source**: `apps/frontend/lib/api/woTemplates.ts`

**Methods**:

#### `getAll()`

Get all templates with optional filtering

**Signature**:
```typescript
static async getAll(filters?: {
    product_id?: number;
    line_id?: number;
    created_by?: number;
    search?: string;
  }): Promise<WOTemplate[]>
```

**Parameters**:
- `filters?: {
    product_id?: number;
    line_id?: number;
    created_by?: number;
    search?: string;
  }`

**Returns**: `Promise<WOTemplate[]>`

---

#### `getById()`

Get template by ID

**Signature**:
```typescript
static async getById(id: number): Promise<WOTemplate | null>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<WOTemplate | null>`

---

#### `getDefaultForProduct()`

Get default template for a product

**Signature**:
```typescript
static async getDefaultForProduct(product_id: number): Promise<WOTemplate | null>
```

**Parameters**:
- `product_id: number`

**Returns**: `Promise<WOTemplate | null>`

---

#### `getPopular()`

Get popular templates (top N by usage_count)

**Signature**:
```typescript
static async getPopular(limit: number = 5): Promise<WOTemplate[]>
```

**Parameters**:
- `limit: number = 5`

**Returns**: `Promise<WOTemplate[]>`

---

#### `create()`

Create a new template

**Signature**:
```typescript
static async create(templateData: CreateWOTemplateData): Promise<WOTemplate>
```

**Parameters**:
- `templateData: CreateWOTemplateData`

**Returns**: `Promise<WOTemplate>`

---

#### `update()`

Update a template

**Signature**:
```typescript
static async update(id: number, updates: UpdateWOTemplateData): Promise<WOTemplate>
```

**Parameters**:
- `id: number`
- `updates: UpdateWOTemplateData`

**Returns**: `Promise<WOTemplate>`

---

#### `delete()`

Delete a template

**Signature**:
```typescript
static async delete(id: number): Promise<void>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<void>`

---

#### `duplicate()`

Duplicate a template

**Signature**:
```typescript
static async duplicate(id: number, newName: string): Promise<WOTemplate>
```

**Parameters**:
- `id: number`
- `newName: string`

**Returns**: `Promise<WOTemplate>`

---

#### `applyTemplate()`

Apply template - returns config to pre-fill WO creation form

**Signature**:
```typescript
static async applyTemplate(templateId: number, overrides?: ApplyTemplateOverrides): Promise<WOTemplateConfig & ApplyTemplateOverrides>
```

**Parameters**:
- `templateId: number`
- `overrides?: ApplyTemplateOverrides`

**Returns**: `Promise<WOTemplateConfig & ApplyTemplateOverrides>`

---

#### `unsetDefaultForProduct()`

Unset default flag for all templates of a product (except optionally one)

**Signature**:
```typescript
static async unsetDefaultForProduct(product_id: number, except_id?: number): Promise<void>
```

**Parameters**:
- `product_id: number`
- `except_id?: number`

**Returns**: `Promise<void>`

---

#### `validateTemplate()`

Validate template config before applying

**Signature**:
```typescript
static async validateTemplate(templateId: number): Promise<{
    valid: boolean;
    errors: string[];
  }>
```

**Parameters**:
- `templateId: number`

**Returns**: `Promise<{
    valid: boolean;
    errors: string[];
  }>`

---

### YieldAPI

**Source**: `apps/frontend/lib/api/yield.ts`

**Methods**:

#### `getPRYield()`

**Signature**:
```typescript
static async getPRYield(params: {
    bucket: 'day' | 'week' | 'month';
    from?: string;
    to?: string;
    line?: string;
  }): Promise<{
    data: Array<{
      production_date: string;
      production_date_utc: string;
      production_line: string;
      product: string;
      part_number: string;
      work_order_count: number;
      total_input_kg: number;
      total_output_kg: number;
      pr_yield_percent: number;
      pr_consumption_per_kg: number;
      plan_accuracy_percent: number;
    }>
```

**Parameters**:
- `params: {
    bucket: 'day' | 'week' | 'month';
    from?: string;
    to?: string;
    line?: string;
  }`

**Returns**: `Promise<{
    data: Array<{
      production_date: string;
      production_date_utc: string;
      production_line: string;
      product: string;
      part_number: string;
      work_order_count: number;
      total_input_kg: number;
      total_output_kg: number;
      pr_yield_percent: number;
      pr_consumption_per_kg: number;
      plan_accuracy_percent: number;
    }>`

---

#### `getFGYield()`

**Signature**:
```typescript
static async getFGYield(params: {
    bucket: 'day' | 'week' | 'month';
    from?: string;
    to?: string;
    line?: string;
  }): Promise<{
    data: Array<{
      production_date: string;
      production_date_utc: string;
      production_line: string;
      product: string;
      part_number: string;
      work_order_count: number;
      total_planned_boxes: number;
      total_actual_boxes: number;
      avg_box_weight_kg: number;
      total_fg_weight_kg: number;
      total_meat_input_kg: number;
      fg_yield_percent: number;
      plan_accuracy_percent: number;
      waste_kg: number;
    }>
```

**Parameters**:
- `params: {
    bucket: 'day' | 'week' | 'month';
    from?: string;
    to?: string;
    line?: string;
  }`

**Returns**: `Promise<{
    data: Array<{
      production_date: string;
      production_date_utc: string;
      production_line: string;
      product: string;
      part_number: string;
      work_order_count: number;
      total_planned_boxes: number;
      total_actual_boxes: number;
      avg_box_weight_kg: number;
      total_fg_weight_kg: number;
      total_meat_input_kg: number;
      fg_yield_percent: number;
      plan_accuracy_percent: number;
      waste_kg: number;
    }>`

---

#### `getYieldKPIs()`

**Signature**:
```typescript
static async getYieldKPIs(params: {
    kpi_scope: 'PR' | 'FG';
    bucket: 'day' | 'week' | 'month';
    from?: string;
    to?: string;
  }): Promise<{
    yield_percent: number;
    consumption_per_kg: number;
    plan_accuracy_percent: number;
    on_time_percent: number;
    total_work_orders: number;
    total_input_kg: number;
    total_output_kg: number;
  }>
```

**Parameters**:
- `params: {
    kpi_scope: 'PR' | 'FG';
    bucket: 'day' | 'week' | 'month';
    from?: string;
    to?: string;
  }`

**Returns**: `Promise<{
    yield_percent: number;
    consumption_per_kg: number;
    plan_accuracy_percent: number;
    on_time_percent: number;
    total_work_orders: number;
    total_input_kg: number;
    total_output_kg: number;
  }>`

---

