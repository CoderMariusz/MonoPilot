# API Reference Documentation

## Overview

The MonoPilot MES system uses a dual-mode API layer that seamlessly switches between mock data (development) and real Supabase data (production).

**Last Updated**: 2025-11-04 (auto-generated)

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

### ASNsAPI

**Source**: `apps/frontend/lib/api/asns.ts`

**Methods**:

#### `create()`

**Signature**:
```typescript
static async create(data: {
    asn_number: string;
    supplier_id: number;
    po_id?: number;
    expected_arrival: string;
    items: any[];
    attachments?: any[];
  }): Promise<{ success: boolean; asn_id?: string; message?: string }>
```

**Parameters**:
- `data: {
    asn_number: string;
    supplier_id: number;
    po_id?: number;
    expected_arrival: string;
    items: any[];
    attachments?: any[];
  }`

**Returns**: `Promise<{ success: boolean; asn_id?: string; message?: string }>`

---

#### `getAll()`

**Signature**:
```typescript
static async getAll(): Promise<any[]>
```

**Returns**: `Promise<any[]>`

---

#### `getById()`

**Signature**:
```typescript
static async getById(id: number): Promise<any | null>
```

**Parameters**:
- `id: number`

**Returns**: `Promise<any | null>`

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

### LicensePlatesAPI

**Source**: `apps/frontend/lib/api/licensePlates.ts`

**Methods**:

#### `getAll()`

**Signature**:
```typescript
static async getAll(filters?: {
    qa_status?: 'Pending' | 'Passed' | 'Failed' | 'Quarantine';
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
    qa_status?: 'Pending' | 'Passed' | 'Failed' | 'Quarantine';
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
static async getDefaultUnitPrice(productId: number, supplierId?: number): Promise<number>
```

**Parameters**:
- `productId: number`
- `supplierId?: number`

**Returns**: `Promise<number>`

---

#### `cancel()`

**Signature**:
```typescript
static async cancel(id: number, reason?: string): Promise<{ success: boolean; message: string }>
```

**Parameters**:
- `id: number`
- `reason?: string`

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

#### `getAll()`

**Signature**:
```typescript
static async getAll(): Promise<TransferOrder[]>
```

**Returns**: `Promise<TransferOrder[]>`

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
static async cancel(id: number, reason?: string): Promise<{ success: boolean; message: string }>
```

**Parameters**:
- `id: number`
- `reason?: string`

**Returns**: `Promise<{ success: boolean; message: string }>`

---

#### `markShipped()`

Mark a transfer order as shipped Sets actual_ship_date and updates status to 'in_transit' Only works if current status is 'submitted'

**Signature**:
```typescript
static async markShipped(id: number, actualShipDate?: Date): Promise<{ success: boolean; message: string }>
```

**Parameters**:
- `id: number`
- `actualShipDate?: Date`

**Returns**: `Promise<{ success: boolean; message: string }>`

---

#### `markReceived()`

Mark a transfer order as received Sets actual_receive_date and updates status to 'received' Only works if current status is 'in_transit'

**Signature**:
```typescript
static async markReceived(id: number, actualReceiveDate?: Date): Promise<{ success: boolean; message: string }>
```

**Parameters**:
- `id: number`
- `actualReceiveDate?: Date`

**Returns**: `Promise<{ success: boolean; message: string }>`

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
static async cancel(id: number, reason?: string): Promise<{ success: boolean; message: string }>
```

**Parameters**:
- `id: number`
- `reason?: string`

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

