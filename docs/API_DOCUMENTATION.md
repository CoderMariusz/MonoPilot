# API Documentation - MonoPilot

**Last Updated**: January 11, 2025  
**Version**: 1.0.0

---

## 📋 Overview

This document provides comprehensive documentation for all API endpoints and methods in the MonoPilot MES system. The application uses a **TypeScript API layer** that interfaces with **Supabase** as the backend database.

### Architecture

```
Frontend Components
       ↓
   API Layer (lib/api/*.ts)
       ↓
   Supabase Client
       ↓
   PostgreSQL Database
```

---

## 🗂️ API Modules

| Module           | File                 | Description                        | Status    |
| ---------------- | -------------------- | ---------------------------------- | --------- |
| Purchase Orders  | `purchaseOrders.ts`  | PO management (CRUD, quick create) | ✅ Active |
| Transfer Orders  | `transferOrders.ts`  | Warehouse-to-warehouse transfers   | ✅ Active |
| Work Orders      | `workOrders.ts`      | Production order management        | ✅ Active |
| Products         | `products.ts`        | Product master data                | ✅ Active |
| Suppliers        | `suppliers.ts`       | Supplier management                | ✅ Active |
| Warehouses       | `warehouses.ts`      | Warehouse operations               | ✅ Active |
| Locations        | `locations.ts`       | Storage location management        | ✅ Active |
| License Plates   | `licensePlates.ts`   | LP operations (split, amend, QA)   | ✅ Active |
| BOMs             | `boms.ts`            | Bill of Materials                  | ✅ Active |
| Routings         | `routings.ts`        | Production routing management      | ✅ Active |
| Users            | `users.ts`           | User management                    | ✅ Active |
| Allergens        | `allergens.ts`       | Allergen data                      | ✅ Active |
| ASNs             | `asns.ts`            | Advanced Shipping Notices          | ✅ Active |
| Machines         | `machines.ts`        | Machine master data                | ✅ Active |
| Production Lines | `productionLines.ts` | Production line management         | ✅ Active |
| Tax Codes        | `taxCodes.ts`        | Tax code management                | ✅ Active |
| Audit            | `audit.ts`           | Audit log queries                  | ✅ Active |
| Traceability     | `traceability.ts`    | Product traceability               | ✅ Active |
| Yield            | `yield.ts`           | Production yield tracking          | ✅ Active |

---

## 🔑 Authentication

All API calls require authentication via Supabase Auth. The user's JWT token is automatically included in requests.

```typescript
// Authentication is handled by Supabase client
import { supabase } from '@/lib/supabase';

// User session is managed globally
const {
  data: { user },
} = await supabase.auth.getUser();
```

---

## 📦 Purchase Orders API

**File**: `lib/api/purchaseOrders.ts`

### Methods

#### `getAll(): Promise<PurchaseOrder[]>`

Retrieves all purchase orders with related data.

**Returns**: Array of purchase orders with supplier, warehouse, and line item details.

**Example**:

```typescript
import { PurchaseOrdersAPI } from '@/lib/api/purchaseOrders';

const orders = await PurchaseOrdersAPI.getAll();
// Returns: PurchaseOrder[]
```

#### `getById(id: number): Promise<PurchaseOrder | null>`

Retrieves a specific purchase order by ID.

**Parameters**:

- `id`: Purchase order ID (number)

**Returns**: Single purchase order with full details, or null if not found.

**Example**:

```typescript
const po = await PurchaseOrdersAPI.getById(123);
if (po) {
  console.log(po.number, po.supplier_name);
}
```

#### `create(data: CreatePurchaseOrderRequest): Promise<PurchaseOrder>`

Creates a new purchase order.

**Parameters**:

- `data`: Object containing PO header and line items

**Type Definition**:

```typescript
interface CreatePurchaseOrderRequest {
  supplier_id: number;
  warehouse_id: number;
  currency: string;
  status: 'draft' | 'submitted' | 'confirmed';
  request_delivery_date?: string;
  expected_delivery_date?: string;
  payment_due_date?: string;
  notes?: string;
  line_items: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
  }>;
}
```

**Example**:

```typescript
const newPO = await PurchaseOrdersAPI.create({
  supplier_id: 1,
  warehouse_id: 2,
  currency: 'USD',
  status: 'draft',
  request_delivery_date: '2025-12-31',
  line_items: [{ product_id: 100, quantity: 50, unit_price: 10.5 }],
});
```

#### `update(id: number, data: Partial<PurchaseOrder>): Promise<void>`

Updates an existing purchase order.

**Parameters**:

- `id`: Purchase order ID
- `data`: Partial PO object with fields to update

**Example**:

```typescript
await PurchaseOrdersAPI.update(123, {
  status: 'confirmed',
  notes: 'Order confirmed with supplier',
});
```

#### `delete(id: number): Promise<{success: boolean, message: string}>`

Deletes a draft purchase order.

**Parameters**:

- `id`: Purchase order ID

**Returns**: Success status and message

**Business Rules**:

- Only draft POs can be deleted
- Cascades to delete line items

**Example**:

```typescript
const result = await PurchaseOrdersAPI.delete(123);
if (result.success) {
  console.log(result.message);
}
```

#### `quickCreate(lines: QuickPOEntryLine[], warehouseId?: number): Promise<QuickPOCreateResponse>`

Creates multiple POs automatically split by supplier and currency.

**Parameters**:

- `lines`: Array of product codes and quantities
- `warehouseId`: Optional destination warehouse ID

**Type Definition**:

```typescript
interface QuickPOEntryLine {
  product_code: string;
  quantity: number;
}

interface QuickPOCreateResponse {
  success: boolean;
  message: string;
  pos: QuickPOCreatedPO[];
}
```

**Example**:

```typescript
const result = await PurchaseOrdersAPI.quickCreate(
  [
    { product_code: 'BXS-001', quantity: 100 },
    { product_code: 'PKC-001', quantity: 50 },
  ],
  2
);

console.log(`Created ${result.pos.length} purchase orders`);
```

**Business Logic**:

- Aggregates quantities for duplicate product codes
- Groups by supplier and currency
- Creates separate PO for each supplier/currency combination
- Auto-calculates totals (net, VAT, gross)

---

## 🚚 Transfer Orders API

**File**: `lib/api/transferOrders.ts`

### Methods

#### `getAll(): Promise<TransferOrder[]>`

Retrieves all transfer orders with warehouse relationships.

**Returns**: Array of transfer orders with from/to warehouse details.

**Example**:

```typescript
import { TransferOrdersAPI } from '@/lib/api/transferOrders';

const orders = await TransferOrdersAPI.getAll();
```

#### `getById(id: number): Promise<TransferOrder | null>`

Retrieves a specific transfer order with full line item details.

**Parameters**:

- `id`: Transfer order ID

**Returns**: Single TO with line items, warehouses, and product details.

#### `create(data: CreateTransferOrderRequest): Promise<TransferOrder>`

Creates a new warehouse-to-warehouse transfer order.

**Type Definition**:

```typescript
interface CreateTransferOrderRequest {
  from_wh_id: number;
  to_wh_id: number;
  planned_ship_date: string;
  planned_receive_date: string;
  status: 'draft' | 'shipped' | 'received';
  line_items: Array<{
    item_id: number;
    uom: string;
    qty_planned: number;
    batch?: string;
    lp_id?: number;
  }>;
}
```

**Business Rules**:

- `planned_receive_date` must be >= `planned_ship_date`
- Auto-generates TO number (TO-YYYY-NNNN format)

**Example**:

```typescript
const newTO = await TransferOrdersAPI.create({
  from_wh_id: 1,
  to_wh_id: 2,
  planned_ship_date: '2025-12-25',
  planned_receive_date: '2025-12-30',
  status: 'draft',
  line_items: [{ item_id: 100, uom: 'KG', qty_planned: 500 }],
});
```

#### `markShipped(id: number, actualShipDate: string): Promise<void>`

Marks a TO as shipped with actual ship date.

**Parameters**:

- `id`: Transfer order ID
- `actualShipDate`: ISO date string

**Business Logic**:

- Updates status to 'shipped'
- Records actual ship date
- Updates `qty_shipped` on line items

#### `markReceived(id: number, actualReceiveDate: string): Promise<void>`

Marks a TO as received with actual receive date.

**Parameters**:

- `id`: Transfer order ID
- `actualReceiveDate`: ISO date string

**Business Logic**:

- Updates status to 'received'
- Records actual receive date
- Updates `qty_received` on line items

---

## 🏭 Work Orders API

**File**: `lib/api/workOrders.ts`

### Methods

#### `getAll(): Promise<WorkOrder[]>`

Retrieves all work orders with BOM and production line details.

#### `getById(id: number): Promise<WorkOrder | null>`

Retrieves a specific work order with materials and operations.

#### `create(data: CreateWorkOrderRequest): Promise<WorkOrder>`

Creates a new production work order.

**Type Definition**:

```typescript
interface CreateWorkOrderRequest {
  bom_id: number;
  production_line_id: number;
  target_quantity: number;
  target_uom: string;
  planned_start_date: string;
  planned_end_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'planned' | 'released' | 'in_progress' | 'completed';
}
```

#### `update(id: number, data: Partial<WorkOrder>): Promise<void>`

Updates work order details.

#### `start(id: number): Promise<void>`

Starts production on a work order (changes status to 'in_progress').

#### `complete(id: number): Promise<void>`

Completes a work order (changes status to 'completed').

---

## 📦 Products API

**File**: `lib/api/products.ts`

### Methods

#### `getAll(): Promise<Product[]>`

Retrieves all products with supplier relationships.

**Returns**: Array of products with full details.

#### `getById(id: number): Promise<Product | null>`

Retrieves a specific product by ID.

#### `getByPartNumber(partNumber: string): Promise<Product | null>`

Retrieves a product by its part number (unique identifier).

**Parameters**:

- `partNumber`: Product part number (e.g., 'BXS-001')

**Example**:

```typescript
const product = await ProductsAPI.getByPartNumber('BXS-001');
if (product) {
  console.log(product.description, product.std_price);
}
```

#### `create(data: CreateProductRequest): Promise<Product>`

Creates a new product.

**Type Definition**:

```typescript
interface CreateProductRequest {
  part_number: string;
  description: string;
  type: 'RM' | 'DG' | 'PR' | 'FG' | 'WIP';
  product_group: 'MEAT' | 'DRYGOODS' | 'COMPOSITE';
  product_type:
    | 'RM_MEAT'
    | 'PR'
    | 'FG'
    | 'DG_WEB'
    | 'DG_LABEL'
    | 'DG_BOX'
    | 'DG_ING'
    | 'DG_SAUCE';
  uom: string;
  std_price?: number;
  supplier_id?: number;
  is_active?: boolean;
}
```

#### `update(id: number, data: Partial<Product>): Promise<void>`

Updates product details.

#### `search(query: string): Promise<Product[]>`

Searches products by part number or description.

**Parameters**:

- `query`: Search string

**Returns**: Array of matching products

**Example**:

```typescript
const results = await ProductsAPI.search('beef');
// Returns all products with 'beef' in part number or description
```

---

## 🏢 Suppliers API

**File**: `lib/api/suppliers.ts`

### Methods

#### `getAll(): Promise<Supplier[]>`

Retrieves all suppliers.

#### `getById(id: number): Promise<Supplier | null>`

Retrieves a specific supplier.

#### `create(data: CreateSupplierRequest): Promise<Supplier>`

Creates a new supplier.

**Type Definition**:

```typescript
interface CreateSupplierRequest {
  name: string;
  legal_name?: string;
  vat_number?: string;
  country?: string;
  currency: string;
  payment_terms?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  is_active?: boolean;
}
```

#### `update(id: number, data: Partial<Supplier>): Promise<void>`

Updates supplier details.

---

## 🏪 Warehouses API

**File**: `lib/api/warehouses.ts`

### Methods

#### `getAll(): Promise<Warehouse[]>`

Retrieves all warehouses.

**Example**:

```typescript
const warehouses = await WarehousesAPI.getAll();
warehouses.forEach(wh => {
  console.log(`${wh.code} - ${wh.name}`);
});
```

#### `getById(id: number): Promise<Warehouse | null>`

Retrieves a specific warehouse.

#### `create(data: CreateWarehouseRequest): Promise<Warehouse>`

Creates a new warehouse.

**Type Definition**:

```typescript
interface CreateWarehouseRequest {
  code: string;
  name: string;
  is_active?: boolean;
}
```

---

## 📍 Locations API

**File**: `lib/api/locations.ts`

### Methods

#### `getAll(): Promise<Location[]>`

Retrieves all storage locations with warehouse relationships.

#### `getByWarehouse(warehouseId: number): Promise<Location[]>`

Retrieves all locations for a specific warehouse.

**Parameters**:

- `warehouseId`: Warehouse ID

**Example**:

```typescript
const locations = await LocationsAPI.getByWarehouse(1);
// Returns all locations in warehouse ID 1
```

#### `create(data: CreateLocationRequest): Promise<Location>`

Creates a new storage location.

**Type Definition**:

```typescript
interface CreateLocationRequest {
  warehouse_id: number;
  code: string;
  name: string;
  is_active?: boolean;
}
```

---

## 🏷️ License Plates API

**File**: `lib/api/licensePlates.ts`

### Methods

#### `getAll(): Promise<LicensePlate[]>`

Retrieves all license plates with product and location details.

#### `getById(id: number): Promise<LicensePlate | null>`

Retrieves a specific license plate.

#### `create(data: CreateLicensePlateRequest): Promise<LicensePlate>`

Creates a new license plate.

**Type Definition**:

```typescript
interface CreateLicensePlateRequest {
  lp_number: string;
  product_id: number;
  quantity: number;
  uom: string;
  location_id: number;
  batch?: string;
  qa_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HOLD';
}
```

#### `split(id: number, quantities: number[]): Promise<LicensePlate[]>`

Splits a license plate into multiple new LPs.

**Parameters**:

- `id`: Original LP ID
- `quantities`: Array of quantities for new LPs

**Returns**: Array of newly created license plates

**Business Logic**:

- First quantity updates original LP
- Subsequent quantities create new LPs with parent reference
- New LP numbers: `{original}-S1`, `{original}-S2`, etc.
- Sum of quantities must equal original quantity

**Example**:

```typescript
const newLPs = await LicensePlatesAPI.split(123, [50, 30, 20]);
// Original LP (100kg) → 3 LPs: 50kg, 30kg, 20kg
```

#### `amend(id: number, updates: {quantity?: number, location_id?: number}): Promise<void>`

Updates LP quantity or location.

#### `changeQAStatus(id: number, newStatus: string): Promise<void>`

Changes the QA status of a license plate.

---

## 🔧 BOMs API

**File**: `lib/api/boms.ts`

### Methods

#### `getAll(): Promise<BOM[]>`

Retrieves all BOMs with product relationships.

#### `getById(id: number): Promise<BOM | null>`

Retrieves a specific BOM with all items and sub-components.

#### `create(data: CreateBOMRequest): Promise<BOM>`

Creates a new Bill of Materials.

**Type Definition**:

```typescript
interface CreateBOMRequest {
  product_id: number;
  version: number;
  status: 'draft' | 'active' | 'inactive';
  items: Array<{
    item_id: number;
    quantity: number;
    uom: string;
    sequence: number;
  }>;
}
```

#### `activate(id: number): Promise<void>`

Activates a BOM (sets status to 'active').

---

## 🛤️ Routings API

**File**: `lib/api/routings.ts`

### Methods

#### `getAll(): Promise<Routing[]>`

Retrieves all production routings.

#### `getById(id: number): Promise<Routing | null>`

Retrieves a specific routing with operations.

#### `create(data: CreateRoutingRequest): Promise<Routing>`

Creates a new production routing.

---

## 👥 Users API

**File**: `lib/api/users.ts`

### Methods

#### `getAll(): Promise<User[]>`

Retrieves all users (admin only).

#### `getById(id: string): Promise<User | null>`

Retrieves a specific user by UUID.

#### `getCurrent(): Promise<User | null>`

Retrieves the currently authenticated user.

**Example**:

```typescript
const currentUser = await UsersAPI.getCurrent();
if (currentUser) {
  console.log(`Logged in as: ${currentUser.name} (${currentUser.role})`);
}
```

#### `update(id: string, data: Partial<User>): Promise<void>`

Updates user details.

---

## 🔍 Audit API

**File**: `lib/api/audit.ts`

### Methods

#### `getRecentLogs(limit?: number): Promise<AuditLog[]>`

Retrieves recent audit log entries.

**Parameters**:

- `limit`: Maximum number of entries (default: 100)

#### `getLogsByEntity(entity: string, entityId: number): Promise<AuditLog[]>`

Retrieves audit logs for a specific entity.

**Parameters**:

- `entity`: Entity type (e.g., 'po_header', 'work_orders')
- `entityId`: Entity ID

**Example**:

```typescript
const logs = await AuditAPI.getLogsByEntity('po_header', 123);
// Returns all audit logs for PO #123
```

---

## 🔗 Traceability API

**File**: `lib/api/traceability.ts`

### Methods

#### `traceProduct(productId: number): Promise<TraceabilityNode[]>`

Traces a product through its full genealogy.

**Parameters**:

- `productId`: Product ID to trace

**Returns**: Array of traceability nodes showing parent/child relationships

---

## 📊 Common Patterns

### Error Handling

All API methods throw errors that should be caught:

```typescript
try {
  const po = await PurchaseOrdersAPI.create(data);
  console.log('Created:', po.number);
} catch (error) {
  console.error('Failed to create PO:', error.message);
  // Show toast/alert to user
}
```

### Loading States

Use loading states in components:

```typescript
const [loading, setLoading] = useState(false);

const loadData = async () => {
  setLoading(true);
  try {
    const data = await PurchaseOrdersAPI.getAll();
    setData(data);
  } finally {
    setLoading(false);
  }
};
```

### Real-time Updates

After create/update/delete operations, refresh data:

```typescript
const handleCreate = async () => {
  await PurchaseOrdersAPI.create(newPO);
  await refreshData(); // Re-fetch list
};
```

---

## 🔐 Row Level Security (RLS)

All database operations respect Supabase Row Level Security policies:

- **Authenticated users**: Can read most tables
- **Admins**: Can perform all CRUD operations
- **Regular users**: Limited to read + specific writes

RLS policies are defined in: `lib/supabase/migrations/040_rls_policies.sql`

---

## 🧪 Testing

API methods have unit tests in `lib/api/__tests__/`:

```bash
# Run API tests
pnpm test:unit

# Run specific API test
pnpm test lib/api/__tests__/purchaseOrders.test.ts
```

---

## 📝 Type Definitions

All TypeScript interfaces are defined in `lib/types.ts`:

```typescript
import type {
  PurchaseOrder,
  TransferOrder,
  WorkOrder,
  Product,
  Supplier,
  // ... etc
} from '@/lib/types';
```

---

## 🚀 Best Practices

1. **Always handle errors** - Use try/catch blocks
2. **Show loading states** - Improve UX during async operations
3. **Validate input** - Check data before API calls
4. **Use TypeScript** - Leverage type safety
5. **Refresh after mutations** - Keep UI in sync with DB
6. **Log errors** - Use console.error for debugging
7. **Use toast notifications** - Inform users of success/failure

---

## 📚 Additional Resources

- **Database Schema**: `docs/12_DATABASE_TABLES.md`
- **Type Definitions**: `apps/frontend/lib/types.ts`
- **Supabase Migrations**: `apps/frontend/lib/supabase/migrations/`
- **API Tests**: `apps/frontend/lib/api/__tests__/`
- **E2E Tests**: `apps/frontend/e2e/`

---

**End of API Documentation**
