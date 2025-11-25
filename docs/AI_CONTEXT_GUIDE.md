# AI Context Guide

**Last Updated**: 2025-11-04  
**Version**: 1.2 - Type Safety Update

## Overview
This document provides templates and patterns for building effective AI context when working with the MonoPilot MES system. Use these templates to create comprehensive, accurate prompts.

## Context Building Templates

### Template 1: "I want to modify [page]"
**Use when**: Modifying existing pages or adding features to pages

**Template**:
```
I want to modify [PAGE_URL] to [DESCRIPTION].

Context:
- Page: [PAGE_URL] - [PAGE_PURPOSE]
- Tables: [PRIMARY_TABLES] (read/write), [SECONDARY_TABLES] (read)
- APIs: [PRIMARY_APIS], [SECONDARY_APIS]
- Components: [KEY_COMPONENTS]
- Business Rules: [RELEVANT_BUSINESS_RULES]
- User Roles: [REQUIRED_ROLES]

Current Implementation:
- [CURRENT_FEATURES]
- [EXISTING_PATTERNS]

Requested Changes:
- [SPECIFIC_CHANGES]
- [NEW_FEATURES]
```

**Example**:
```
I want to modify /technical/bom to add bulk product import functionality.

Context:
- Page: /technical/bom - Product and BOM management
- Tables: products, bom, bom_items (read/write), allergens, settings_tax_codes (read)
- APIs: ProductsAPI, RoutingsAPI, AllergensAPI, TaxCodesAPI
- Components: BomCatalogClient, ProductsTable, AddItemModal
- Business Rules: Unique part numbers, allergen inheritance, product categorization
- User Roles: Technical, Admin

Current Implementation:
- Individual product creation via AddItemModal
- Product listing with filtering and search
- BOM management with drag-and-drop interface

Requested Changes:
- Add bulk import button to ProductsTable
- Create CSV upload modal with validation
- Implement batch processing with error handling
- Add progress indicator for large imports
```

### Template 2: "I want to add field to [table]"
**Use when**: Adding new fields to database tables

**Template**:
```
I want to add [FIELD_NAME] field to [TABLE_NAME] table.

Context:
- Table: [TABLE_NAME] - [TABLE_PURPOSE]
- Current Fields: [KEY_FIELDS]
- Relationships: [FOREIGN_KEYS], [REFERENCED_BY]
- Used By Pages: [PAGES_USING_TABLE]
- Used By APIs: [APIS_USING_TABLE]
- Used By Components: [COMPONENTS_USING_TABLE]

New Field Details:
- Name: [FIELD_NAME]
- Type: [DATA_TYPE]
- Constraints: [VALIDATION_RULES]
- Default Value: [DEFAULT_VALUE]
- Required: [YES/NO]

Impact Analysis:
- Pages to Update: [PAGES_NEEDING_UPDATES]
- APIs to Update: [APIS_NEEDING_UPDATES]
- Components to Update: [COMPONENTS_NEEDING_UPDATES]
- Migration Required: [YES/NO]
```

**Example**:
```
I want to add expiry_date field to products table.

Context:
- Table: products - Product catalog management
- Current Fields: id, part_number, description, type, uom, is_active, product_group, product_type
- Relationships: supplier_id → suppliers, tax_code_id → settings_tax_codes
- Used By Pages: /technical/bom, /production, /planning, /warehouse
- Used By APIs: ProductsAPI, WorkOrdersAPI, PurchaseOrdersAPI
- Used By Components: ProductsTable, AddItemModal, BomCatalogClient

New Field Details:
- Name: expiry_date
- Type: TIMESTAMP WITH TIME ZONE
- Constraints: NULL allowed, must be future date if set
- Default Value: NULL
- Required: NO

Impact Analysis:
- Pages to Update: /technical/bom (AddItemModal, ProductsTable)
- APIs to Update: ProductsAPI (create, update, getAll)
- Components to Update: AddItemModal, ProductsTable, ProductForm
- Migration Required: YES - ALTER TABLE products ADD COLUMN expiry_date
```

### Template 3: "I want to add business rule"
**Use when**: Implementing new business logic

**Template**:
```
I want to add business rule: [RULE_DESCRIPTION]

Context:
- Rule Type: [VALIDATION/ENFORCEMENT/TRANSFORMATION]
- Scope: [GLOBAL/MODULE_SPECIFIC/TABLE_SPECIFIC]
- Trigger: [USER_ACTION/SYSTEM_EVENT/DATA_CHANGE]

Current System:
- Related Tables: [AFFECTED_TABLES]
- Related APIs: [AFFECTED_APIS]
- Related Components: [AFFECTED_COMPONENTS]
- Existing Rules: [SIMILAR_RULES]

Implementation Requirements:
- Validation Level: [CLIENT/SERVER/DATABASE]
- Error Handling: [ERROR_MESSAGES/ROLLBACK/LOG]
- User Feedback: [NOTIFICATIONS/UI_CHANGES/STATUS_UPDATES]
- Performance Impact: [QUERY_CHANGES/INDEX_REQUIREMENTS]

Business Logic:
- Condition: [WHEN_RULE_APPLIES]
- Action: [WHAT_HAPPENS]
- Exception: [EXCEPTION_CASES]
- Override: [SUPERVISOR_OVERRIDE_AVAILABLE]
```

**Example**:
```
I want to add business rule: Prevent work order creation if product has no active BOM

Context:
- Rule Type: VALIDATION
- Scope: MODULE_SPECIFIC (Production)
- Trigger: USER_ACTION (Create Work Order)

Current System:
- Related Tables: work_orders, products, bom
- Related APIs: WorkOrdersAPI, ProductsAPI
- Related Components: CreateWorkOrderModal, WorkOrdersTable
- Existing Rules: Product must exist, quantity must be positive

Implementation Requirements:
- Validation Level: SERVER (API level)
- Error Handling: Return validation error with clear message
- User Feedback: Show error in modal, disable create button
- Performance Impact: Additional query to check BOM existence

Business Logic:
- Condition: When creating work order for product
- Action: Check if product has active BOM, reject if not
- Exception: Admin users can override with reason
- Override: Yes, with supervisor PIN and reason logging
```

### Template 4: "I want to add new API endpoint"
**Use when**: Creating new API endpoints

**Template**:
```
I want to add new API endpoint: [ENDPOINT_DESCRIPTION]

Context:
- Endpoint: [HTTP_METHOD] [ENDPOINT_PATH]
- Purpose: [FUNCTIONALITY_DESCRIPTION]
- Module: [TECHNICAL/PRODUCTION/PLANNING/WAREHOUSE/SCANNER]

Data Requirements:
- Input: [REQUEST_BODY_SCHEMA]
- Output: [RESPONSE_SCHEMA]
- Tables Read: [TABLES_QUERIED]
- Tables Write: [TABLES_MODIFIED]
- Business Rules: [VALIDATION_RULES]

Implementation Details:
- API Class: [EXISTING_OR_NEW_CLASS]
- Method Name: [METHOD_NAME]
- Error Handling: [ERROR_CODES_AND_MESSAGES]
- Authentication: [REQUIRED_ROLES]
- Rate Limiting: [LIMITS_IF_ANY]

Integration Points:
- Used By Pages: [PAGES_THAT_WILL_USE]
- Used By Components: [COMPONENTS_THAT_WILL_USE]
- Related APIs: [APIS_THAT_MIGHT_CALL]
- Database Changes: [MIGRATIONS_NEEDED]
```

**Example**:
```
I want to add new API endpoint: Bulk update work order statuses

Context:
- Endpoint: PUT /api/work-orders/bulk-status
- Purpose: Update multiple work orders status in single operation
- Module: PRODUCTION

Data Requirements:
- Input: { workOrderIds: number[], status: string, reason?: string }
- Output: { success: boolean, updated: number, errors: string[] }
- Tables Read: work_orders, wo_operations
- Tables Write: work_orders, wo_operations
- Business Rules: Valid status transitions, user permissions

Implementation Details:
- API Class: WorkOrdersAPI
- Method Name: bulkUpdateStatus
- Error Handling: VALIDATION_ERROR, PERMISSION_DENIED, INVALID_STATUS
- Authentication: Planner, Admin roles
- Rate Limiting: 10 requests per minute

Integration Points:
- Used By Pages: /production
- Used By Components: WorkOrdersTable, BulkActionsPanel
- Related APIs: WorkOrdersAPI (existing methods)
- Database Changes: None (uses existing tables)
```

---

## When Implementing New Features

> 🔒 **Critical**: 100% of deployment failures were TypeScript errors  
> ✅ **Prevention**: Follow type safety checklist before implementing features  
> 📄 **Full Analysis**: DEPLOYMENT_ERRORS_ANALYSIS.md

### Step 1: Type Safety First

**Before writing any code**, check:

1. **DEPLOYMENT_ERRORS_ANALYSIS.md** - Review common error patterns
   - 60% failures: Missing required properties in objects
   - 25% failures: Status enum mismatches
   - 15% failures: Stale/wrong imports

2. **Run `pnpm type-check`** - Ensure baseline passes
   ```bash
   # Full project
   pnpm type-check
   
   # Just frontend (where most errors occur)
   cd apps/frontend && pnpm type-check
   ```

3. **Verify all interfaces have required properties**
   - Check `packages/shared/types.ts` for type definitions
   - Use `Omit<T, 'id' | 'created_at' | 'updated_at'>` for CREATE operations
   - Use `Partial<T>` for UPDATE operations

### Step 2: Reference Existing Patterns

**From DEPLOYMENT_ERRORS_ANALYSIS.md**:

#### ✅ Correct Pattern - CREATE Operation
```typescript
// Creating new routing operations (from RoutingBuilder.tsx fix)
type NewRoutingOperation = Omit<RoutingOperation, 'id' | 'routing_id' | 'created_at' | 'updated_at'>;

const operations: NewRoutingOperation[] = localOperations.map((op, index) => ({
  seq_no: index + 1,
  name: op.name,
  code: op.code,
  description: op.description,
  requirements: op.requirements,
}));
```

#### ✅ Correct Pattern - Status Enums
```typescript
// Always use correct enum values (check types.ts)
const status: POStatus = 'pending'; // NOT 'open'
const qaStatus: QAStatus = 'passed'; // NOT 'approved'
const woStatus: WorkOrderStatus = 'planned'; // NOT 'pending'
```

#### ✅ Correct Pattern - Form Data Conversion
```typescript
// Parse form strings to numbers
const quantity: number = parseFloat(formData.quantity) || 0;
const price: number = parseFloat(formData.price) || 0;

// Validate before using
if (isNaN(quantity) || quantity <= 0) {
  throw new Error('Invalid quantity');
}
```

#### ❌ Common Mistakes to Avoid
```typescript
// DON'T: Pass objects with missing properties
const operations = data.map(op => ({
  name: op.name,
  code: op.code
  // Missing: id, routing_id, created_at, updated_at
}));

// DON'T: Use wrong status literals
const status: POStatus = 'open'; // Wrong! Should be 'pending'

// DON'T: Import non-existent components
import { LazyAddItemModal } from '@/components/modals/LazyAddItemModal'; // Wrong!
import { GRNsAPI } from '@/lib/api'; // Doesn't exist!
```

### Step 3: Implementation Checklist

**While coding**:
- [ ] Use TypeScript utility types (`Omit<>`, `Partial<>`, `Pick<>`)
- [ ] Check enum values in `packages/shared/types.ts`
- [ ] Parse form strings to proper types
- [ ] Verify all imports exist (check API_REFERENCE.md)
- [ ] Add proper error handling
- [ ] Test locally before committing

**Before committing** (automated via pre-commit hooks):
- [ ] `pnpm type-check` passes (automated)
- [ ] `pnpm lint` passes (automated)
- [ ] `pnpm format` applied (automated)
- [ ] All imports validated (automated)

**After committing**:
- [ ] Vercel preview build successful
- [ ] No TypeScript errors in deployment logs
- [ ] Manual testing of changed features

### Step 4: Testing & Validation

**Type Safety Tests** (see TODO.md section 9.5):
```typescript
// Test that types are correctly defined
describe('Type Safety', () => {
  it('should accept valid CREATE operation types', () => {
    type NewWO = Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>;
    const wo: NewWO = {
      wo_number: 'WO-001',
      product_id: 1,
      quantity_ordered: 100,
      // ... all other required fields
    };
    expect(wo).toBeDefined();
  });
  
  it('should reject invalid status enums', () => {
    // This should not compile
    // const status: POStatus = 'open'; // TS Error!
  });
});
```

### Step 5: Documentation References

When implementing features, always consult:

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **DEPLOYMENT_ERRORS_ANALYSIS.md** | Common error patterns | Before starting implementation |
| **API_REFERENCE.md** | Type Safety Best Practices section | When calling APIs |
| **SYSTEM_OVERVIEW.md** | Section 9: Type Safety | For workflow understanding |
| **AI_QUICK_REFERENCE.md** | TypeScript Error Quick Reference | For quick lookup |
| **TODO.md** | Section 9.5: Deployment checklist | Before committing |

---

## Common Patterns and Anti-patterns

### ✅ Good Patterns

#### Context Building
- **Include table relationships**: Always mention which tables are involved
- **Specify user roles**: Mention required permissions
- **Reference existing patterns**: Point to similar implementations
- **Include business rules**: Mention relevant validation rules

#### Code Changes
- **Follow existing patterns**: Use similar components/APIs as examples
- **Consider all layers**: Database, API, Component, Page
- **Plan error handling**: Include error scenarios and messages
- **Think about performance**: Consider indexing and query optimization

### ❌ Anti-patterns

#### Context Building
- **Vague descriptions**: "I want to add a field" without details
- **Missing relationships**: Not mentioning affected tables/APIs
- **No business context**: Not explaining why the change is needed
- **Incomplete scope**: Not considering all affected components

#### Code Changes
- **Breaking existing functionality**: Not considering impact on current features
- **Ignoring security**: Not considering RLS policies and user permissions
- **Poor error handling**: Not planning for error scenarios
- **Performance issues**: Not considering database performance impact

## Context Building Checklist

### Before Writing Prompt
- [ ] Identify the specific page/table/API being modified
- [ ] List all related tables and their relationships
- [ ] Identify affected APIs and components
- [ ] Consider user roles and permissions
- [ ] Review existing business rules
- [ ] Plan error handling approach
- [ ] Consider performance implications

### During Prompt Writing
- [ ] Use appropriate template
- [ ] Include complete context information
- [ ] Specify exact requirements
- [ ] Mention existing patterns to follow
- [ ] Include business rules and validation
- [ ] Plan integration points
- [ ] Consider testing requirements

### After Getting Response
- [ ] Verify all requirements are addressed
- [ ] Check that existing functionality is preserved
- [ ] Ensure proper error handling is included
- [ ] Validate that security considerations are addressed
- [ ] Confirm performance implications are considered
- [ ] Review code follows existing patterns

## Quick Context Lookup

### By Page
- **Technical**: Products, BOMs, Routings, Allergens
- **Production**: Work Orders, Operations, Yield, Traceability
- **Planning**: Purchase Orders, Transfer Orders, Suppliers
- **Warehouse**: GRNs, Stock Moves, License Plates, Locations
- **Scanner**: Operations, Staging, Packing, QA

### By Table
- **Core**: users, products, work_orders, license_plates
- **Planning**: purchase_orders, transfer_orders, suppliers
- **Production**: wo_operations, wo_materials, production_outputs
- **Warehouse**: grns, stock_moves, locations
- **Technical**: boms, bom_items, routings, routing_operations

### By API
- **CRUD**: ProductsAPI, WorkOrdersAPI, PurchaseOrdersAPI
- **Specialized**: YieldAPI, TraceabilityAPI
- **Management**: SuppliersAPI, WarehousesAPI, UsersAPI

## See Also

- [AI Quick Reference](AI_QUICK_REFERENCE.md) - Quick lookup tables
- [System Overview](SYSTEM_OVERVIEW.md) - High-level architecture
- [Page Reference](PAGE_REFERENCE.md) - Page mappings
- [Component Reference](COMPONENT_REFERENCE.md) - Component documentation
- [API Reference](API_REFERENCE.md) - Complete API documentation
