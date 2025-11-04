# AI Quick Reference Guide

**Last Updated**: 2025-11-04  
**Version**: 1.2 - Type Safety Update

## Overview
This document provides quick lookup tables and matrices for AI prompt engineering, enabling efficient context building and system understanding.

## Table → Pages Matrix

| Table | Primary Pages | Secondary Pages | Usage Context |
|-------|---------------|-----------------|---------------|
| `users` | All pages | `/admin`, `/settings` | Authentication, audit trails |
| `products` | `/technical/bom` | `/production`, `/planning`, `/warehouse` | Product catalog, BOM management |
| `bom` | `/technical/bom` | `/production` | Bill of materials definition |
| `bom_items` | `/technical/bom` | `/production` | BOM component details |
| `work_orders` | `/production` | `/scanner` | Work order management |
| `wo_operations` | `/production`, `/scanner` | - | Operation tracking |
| `wo_materials` | `/production` | `/scanner` | Material requirements |
| `license_plates` | `/warehouse`, `/scanner` | `/production` | Inventory tracking |
| `purchase_orders` | `/planning` | `/warehouse` | Procurement management |
| `purchase_order_items` | `/planning` | `/warehouse` | PO line items |
| `transfer_orders` | `/planning` | `/warehouse` | Inter-warehouse transfers |
| `transfer_order_items` | `/planning` | `/warehouse` | Transfer line items |
| `grns` | `/warehouse` | `/planning` | Goods receipt processing |
| `grn_items` | `/warehouse` | `/planning` | GRN line items |
| `stock_moves` | `/warehouse` | `/scanner` | Inventory movements |
| `suppliers` | `/planning` | `/technical/bom` | Supplier management |
| `warehouses` | `/planning` | `/warehouse` | Warehouse management |
| `locations` | `/warehouse` | `/scanner` | Location management |
| `machines` | `/production` | `/technical/bom` | Machine management |
| `routings` | `/technical/bom` | `/production` | Routing definition |
| `routing_operations` | `/technical/bom` | `/production` | Operation sequences |
| `allergens` | `/technical/bom` | - | Allergen management |
| `settings_tax_codes` | `/technical/bom` | `/planning` | Tax code management |

## Page → Tables Matrix

| Page | Primary Tables | Secondary Tables | Business Context |
|------|----------------|------------------|------------------|
| `/technical/bom` | `products`, `bom`, `bom_items`, `routings`, `routing_operations` | `allergens`, `settings_tax_codes`, `suppliers` | Product & BOM management |
| `/production` | `work_orders`, `wo_operations`, `wo_materials` | `products`, `license_plates`, `machines` | Work order execution |
| `/planning` | `purchase_orders`, `transfer_orders`, `suppliers`, `warehouses` | `purchase_order_items`, `transfer_order_items` | Order management |
| `/warehouse` | `grns`, `stock_moves`, `license_plates`, `locations` | `grn_items`, `purchase_orders` | Inventory management |
| `/scanner/process` | `wo_operations`, `license_plates`, `lp_reservations` | `work_orders`, `products` | Production execution |
| `/scanner/pack` | `pallets`, `pallet_items`, `license_plates` | `products` | Pallet creation |
| `/admin` | `users`, `sessions` | `settings` | System administration |
| `/settings` | `settings` | `users` | System configuration |

## API → Tables Matrix

| API Class | Read Tables | Write Tables | Business Rules |
|-----------|-------------|--------------|----------------|
| `ProductsAPI` | `products`, `product_allergens`, `allergens` | `products`, `product_allergens` | Unique part numbers, allergen inheritance |
| `WorkOrdersAPI` | `work_orders`, `wo_operations`, `wo_materials`, `products` | `work_orders`, `wo_operations` | Sequential routing, 1:1 components |
| `PurchaseOrdersAPI` | `purchase_orders`, `purchase_order_items`, `suppliers` | `purchase_orders`, `purchase_order_items` | GRN validation, status transitions |
| `TransferOrdersAPI` | `transfer_orders`, `transfer_order_items`, `warehouses` | `transfer_orders`, `transfer_order_items` | Warehouse validation |
| `LicensePlatesAPI` | `license_plates`, `locations`, `products` | `license_plates` | LP numbering, status management |
| `YieldAPI` | `wo_operations`, `production_outputs`, `work_orders` | `production_outputs` | Yield calculations |
| `TraceabilityAPI` | `license_plates`, `lp_genealogy`, `lp_compositions` | `lp_genealogy`, `lp_compositions` | Trace chain integrity |
| `RoutingsAPI` | `routings`, `routing_operations` | `routings`, `routing_operations` | Operation sequencing |
| `SuppliersAPI` | `suppliers`, `supplier_products` | `suppliers`, `supplier_products` | Supplier management |
| `WarehousesAPI` | `warehouses`, `locations` | `warehouses`, `locations` | Location hierarchy |

## Component → API Matrix

| Component | Primary APIs | Secondary APIs | Data Flow |
|-----------|--------------|----------------|-----------|
| `BomCatalogClient` | `ProductsAPI`, `RoutingsAPI` | `AllergensAPI`, `TaxCodesAPI` | Product CRUD → BOM management |
| `WorkOrdersTable` | `WorkOrdersAPI` | `YieldAPI` | WO management → Yield tracking |
| `ProductsTable` | `ProductsAPI` | - | Product listing and management |
| `PurchaseOrdersTable` | `PurchaseOrdersAPI` | `SuppliersAPI` | PO management → Supplier integration |
| `TransferOrdersTable` | `TransferOrdersAPI` | `WarehousesAPI` | Transfer management |
| `GRNsTable` | `WorkOrdersAPI` | `LicensePlatesAPI` | GRN processing → LP creation |
| `LicensePlatesTable` | `LicensePlatesAPI` | - | LP management → Stock tracking |
| `StageBoard` | `WorkOrdersAPI` | `LicensePlatesAPI` | Operation execution → LP management |
| `AddItemModal` | `ProductsAPI`, `RoutingsAPI` | `AllergensAPI`, `TaxCodesAPI` | Product creation → BOM setup |
| `CreateWorkOrderModal` | `WorkOrdersAPI` | `ProductsAPI`, `MachinesAPI` | WO creation → Product validation |
| `CreateGRNModal` | `WorkOrdersAPI` | `PurchaseOrdersAPI`, `LicensePlatesAPI` | GRN creation → PO validation |
| `TraceTab` | `TraceabilityAPI` | - | Trace queries → Data visualization |

## Business Rule Quick Reference

### Product Management
- **Unique Part Numbers**: `products.part_number` must be unique
- **Allergen Inheritance**: Inherited from BOM components
- **Product Categorization**: Based on `product_group` and `product_type`
- **BOM Requirements**: Products can have multiple BOM versions

### Work Order Management
- **Sequential Operations**: Operations must be completed in sequence
- **One-to-One Components**: Certain components consume entire LP
- **Status Transitions**: `planned` → `released` → `in_progress` → `completed`
- **Material Requirements**: Based on BOM and work order quantity

### Inventory Management
- **License Plate Tracking**: Each LP has unique number and status
- **Location Management**: LPs must be assigned to valid locations
- **Stock Moves**: All movements tracked with audit trail
- **Reservations**: Prevent double-allocation of materials

### Quality Control
- **QA Status**: `Pending`, `Passed`, `Failed`, `Quarantine`
- **QA Gates**: Block operations until QA passed
- **Override Capability**: Supervisor can override with PIN
- **Traceability**: Complete chain from raw materials to finished goods

## Common Query Patterns

### Product Queries
```sql
-- Get products by category
SELECT * FROM products WHERE product_group = 'MEAT' AND is_active = true;

-- Get products with BOM
SELECT p.*, b.version FROM products p 
LEFT JOIN bom b ON p.id = b.product_id AND b.is_active = true;

-- Get products by supplier
SELECT p.*, s.name as supplier_name FROM products p
JOIN suppliers s ON p.supplier_id = s.id;
```

### Work Order Queries
```sql
-- Get active work orders
SELECT wo.*, p.part_number FROM work_orders wo
JOIN products p ON wo.product_id = p.id
WHERE wo.status IN ('released', 'in_progress');

-- Get work order operations
SELECT wo_op.*, ro.operation_name FROM wo_operations wo_op
JOIN routing_operations ro ON wo_op.routing_operation_id = ro.id
WHERE wo_op.wo_id = ?;
```

### Inventory Queries
```sql
-- Get available license plates
SELECT lp.*, p.part_number, l.code as location FROM license_plates lp
JOIN products p ON lp.product_id = p.id
JOIN locations l ON lp.location_id = l.id
WHERE lp.status = 'available';

-- Get stock moves by date range
SELECT sm.*, lp.lp_number, p.part_number FROM stock_moves sm
JOIN license_plates lp ON sm.lp_id = lp.id
JOIN products p ON lp.product_id = p.id
WHERE sm.move_date BETWEEN ? AND ?;
```

## Error Code Quick Reference

| Error Code | Description | Common Causes | Resolution |
|------------|-------------|---------------|------------|
| `VALIDATION_ERROR` | Input validation failed | Missing required fields, invalid data types | Check form validation rules |
| `NOT_FOUND` | Resource not found | Invalid ID, deleted record | Verify ID exists and user has access |
| `DUPLICATE_KEY` | Unique constraint violation | Duplicate part number, LP number | Check for existing records |
| `FOREIGN_KEY_ERROR` | Referenced record missing | Invalid foreign key reference | Verify related records exist |
| `RLS_VIOLATION` | Row Level Security violation | Insufficient permissions | Check user role and RLS policies |
| `BUSINESS_RULE_ERROR` | Business logic violation | Invalid operation sequence, QA status | Review business rules |

## Module Quick Reference

### Technical Module
- **Purpose**: Product and BOM management
- **Key Tables**: `products`, `bom`, `bom_items`, `routings`
- **Key APIs**: `ProductsAPI`, `RoutingsAPI`
- **Key Components**: `BomCatalogClient`, `ProductsTable`, `AddItemModal`

### Production Module
- **Purpose**: Work order execution
- **Key Tables**: `work_orders`, `wo_operations`, `wo_materials`
- **Key APIs**: `WorkOrdersAPI`, `YieldAPI`
- **Key Components**: `WorkOrdersTable`, `StageBoard`

### Planning Module
- **Purpose**: Order management
- **Key Tables**: `purchase_orders`, `transfer_orders`, `suppliers`
- **Key APIs**: `PurchaseOrdersAPI`, `TransferOrdersAPI`
- **Key Components**: `PurchaseOrdersTable`, `TransferOrdersTable`

### Warehouse Module
- **Purpose**: Inventory management
- **Key Tables**: `grns`, `stock_moves`, `license_plates`
- **Key APIs**: `WorkOrdersAPI`, `LicensePlatesAPI`
- **Key Components**: `GRNsTable`, `LicensePlatesTable`

### Scanner Module
- **Purpose**: Production execution
- **Key Tables**: `wo_operations`, `license_plates`, `lp_reservations`
- **Key APIs**: `WorkOrdersAPI`
- **Key Components**: `StageBoard`, `ProcessInterface`

## TypeScript Error Quick Reference

> 🔒 **Critical**: 100% of deployment failures were TypeScript errors  
> ✅ **Prevention**: Pre-commit hooks now operational (see SETUP_TYPE_CHECKING.md)  
> 📄 **Full Analysis**: DEPLOYMENT_ERRORS_ANALYSIS.md

### Common Deployment Errors (by frequency)

| Error Pattern | Cause | Fix | Priority | % of Failures |
|---------------|-------|-----|----------|---------------|
| **Missing properties** | Incomplete object types | Use `Omit<T, 'id' \| 'created_at' \| 'updated_at'>` | 🔴 P0 | 60% |
| **Type not assignable** | Incompatible types | Use `Partial<T>` or check enum values | 🟡 P0 | 25% |
| **Cannot find module** | Wrong import path | Verify file exists, check API_REFERENCE.md | 🟢 P0 | 15% |
| **Implicit any type** | Missing type annotation | Add explicit type annotation | 🟡 P1 | - |
| **Object possibly undefined** | No null check | Use optional chaining `?.` or null check | 🟢 P1 | - |

### TypeScript Utility Types - Quick Lookup

| Utility Type | Usage | Example | When to Use |
|-------------|--------|---------|-------------|
| `Omit<T, K>` | Exclude properties | `Omit<Product, 'id' \| 'created_at'>` | CREATE operations (exclude DB fields) |
| `Partial<T>` | All properties optional | `Partial<WorkOrder>` | UPDATE operations |
| `Pick<T, K>` | Include only specific properties | `Pick<Product, 'id' \| 'name'>` | API responses (minimal data) |
| `Required<T>` | All properties required | `Required<PartialProduct>` | Validation before save |
| `Record<K, T>` | Object with specific keys | `Record<string, number>` | Lookup maps |

### Status Enum Quick Reference

| Type | Valid Values | Common Mistake |
|------|--------------|----------------|
| `WorkOrderStatus` | `'draft' \| 'planned' \| 'released' \| 'in_progress' \| 'completed' \| 'cancelled'` | Using 'pending' instead of 'planned' |
| `POStatus` | `'draft' \| 'pending' \| 'approved' \| 'rejected' \| 'closed' \| 'cancelled'` | Using 'open' instead of 'pending' |
| `QAStatus` | `'pending' \| 'passed' \| 'failed' \| 'quarantine'` | Using 'approved' instead of 'passed' |
| `TOStatus` | `'draft' \| 'submitted' \| 'in_transit' \| 'received' \| 'cancelled'` | Using 'shipped' instead of 'in_transit' |

### API Method Type Patterns

| Operation | Type Pattern | Example |
|-----------|--------------|---------|
| **CREATE** | `Omit<T, 'id' \| 'created_at' \| 'updated_at'>` | `const newWO: Omit<WorkOrder, 'id' \| 'created_at' \| 'updated_at'>` |
| **UPDATE** | `Partial<Omit<T, 'id'>> & { id: number }` | `const updates: Partial<WorkOrder> = { status: 'completed' }` |
| **READ** | `T` or `T \| null` | `const wo: WorkOrder \| null = await WorkOrdersAPI.getById(id)` |
| **LIST** | `T[]` | `const orders: WorkOrder[] = await WorkOrdersAPI.getAll()` |

### Form Data Type Conversions

| From | To | Conversion | Example |
|------|-----|-----------|---------|
| `string` (input) | `number` | `parseFloat()` or `parseInt()` | `const qty: number = parseFloat(formData.quantity) \|\| 0` |
| `string` (date) | `Date` | `new Date()` | `const date: Date = new Date(formData.scheduledDate)` |
| `string` (enum) | Enum type | Type assertion after validation | `const status: POStatus = formData.status as POStatus` |
| `string[]` (multi-select) | Array | Direct (already array) | `const lines: string[] = formData.productionLines` |

### Pre-deployment Type-Check Commands

```bash
# Full project type-check
pnpm type-check

# Frontend only
cd apps/frontend && pnpm type-check

# Backend only
cd apps/backend && pnpm type-check

# Pre-commit simulation (all checks)
pnpm pre-commit
```

### Type Safety Checklist

Before committing code:
- [ ] Run `pnpm type-check` - **MUST pass**
- [ ] Verify all imports exist
- [ ] Check enum values match type definitions
- [ ] Use `Omit<>` for CREATE operations
- [ ] Use `Partial<>` for UPDATE operations
- [ ] Parse form strings to numbers properly

---

## Performance Quick Reference

### Common Indexes
- `idx_products_part_number` - Product lookups
- `idx_work_orders_status` - Work order filtering
- `idx_license_plates_product_id` - LP product queries
- `idx_wo_operations_wo_id` - Operation queries

### Query Optimization
- Use specific column selection
- Implement pagination for large datasets
- Use `EXISTS` instead of `IN` for subqueries
- Consider materialized views for complex aggregations

## See Also

- [AI Context Guide](AI_CONTEXT_GUIDE.md) - Context building templates
- [System Overview](SYSTEM_OVERVIEW.md) - High-level architecture
- [Database Schema](DATABASE_SCHEMA.md) - Table definitions
- [API Reference](API_REFERENCE.md) - Complete API documentation
- **[DEPLOYMENT_ERRORS_ANALYSIS.md](../DEPLOYMENT_ERRORS_ANALYSIS.md)** - ✨ Detailed type error patterns
- **[SETUP_TYPE_CHECKING.md](../SETUP_TYPE_CHECKING.md)** - ✨ Pre-commit hooks setup
- **[TODO.md](TODO.md)** - ✨ Section 9.5: Type Safety & Deployment Prevention
