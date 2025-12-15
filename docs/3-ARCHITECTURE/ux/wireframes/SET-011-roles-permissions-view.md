# SET-011: Roles & Permissions View

**Module**: Settings
**Feature**: User Management
**Status**: Auto-Approved
**Last Updated**: 2025-12-15

---

## ASCII Wireframe

### Success State

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  Settings > Roles & Permissions                                                                          │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                            │
│  Permission Matrix - Read-only reference of system roles and their access levels                         │
│                                                                                                            │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ Module          │ Super │ Admin │ Prod │ Qual │ WH  │ Prod │ Qual │ WH Op │ Plan │ Viewer │         │ │
│  │                 │ Admin │       │ Mgr  │ Mgr  │ Mgr │ Op   │ Insp │       │      │        │         │ │
│  ├────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │ SETTINGS        │                                                                                 │ │
│  │  Organization   │ ✓✓✓✓  │ ✓✓✓✓  │  ✓   │  ✓   │  ✓  │  -   │  -   │  -    │  -   │   ✓    │ │
│  │  Users          │ ✓✓✓✓  │ ✓✓✓✓  │  ✓   │  ✓   │  ✓  │  -   │  -   │  -    │  -   │   ✓    │ │
│  │  Warehouses     │ ✓✓✓✓  │ ✓✓✓✓  │  ✓   │  ✓   │ ✓✓✓ │  -   │  -   │  -    │  -   │   ✓    │ │
│  ├────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │ TECHNICAL       │                                                                                 │ │
│  │  Products       │ ✓✓✓✓  │ ✓✓✓✓  │ ✓✓✓✓ │  ✓   │  ✓  │  ✓   │  ✓   │  ✓    │ ✓✓✓✓ │   ✓    │ │
│  │  BOMs           │ ✓✓✓✓  │ ✓✓✓✓  │ ✓✓✓✓ │  ✓   │  ✓  │  ✓   │  ✓   │  ✓    │ ✓✓✓✓ │   ✓    │ │
│  │  Routings       │ ✓✓✓✓  │ ✓✓✓✓  │ ✓✓✓✓ │  ✓   │  ✓  │  ✓   │  ✓   │  ✓    │ ✓✓✓✓ │   ✓    │ │
│  ├────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │ PLANNING        │                                                                                 │ │
│  │  Purchase Ord.  │ ✓✓✓✓  │ ✓✓✓✓  │ ✓✓✓✓ │  ✓   │  ✓  │  ✓   │  ✓   │  ✓    │ ✓✓✓✓ │   ✓    │ │
│  │  Transfer Ord.  │ ✓✓✓✓  │ ✓✓✓✓  │ ✓✓✓✓ │  ✓   │  ✓  │  ✓   │  ✓   │  ✓    │ ✓✓✓✓ │   ✓    │ │
│  │  Work Orders    │ ✓✓✓✓  │ ✓✓✓✓  │ ✓✓✓✓ │  ✓   │  ✓  │  ✓   │  ✓   │  ✓    │ ✓✓✓✓ │   ✓    │ │
│  ├────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │ PRODUCTION      │                                                                                 │ │
│  │  WO Execution   │ ✓✓✓✓  │ ✓✓✓✓  │ ✓✓✓✓ │  ✓   │  ✓  │ ✓✓✓  │  ✓   │  -    │  -   │   ✓    │ │
│  │  Consumption    │ ✓✓✓✓  │ ✓✓✓✓  │ ✓✓✓✓ │  ✓   │  ✓  │ ✓✓✓  │  ✓   │  -    │  -   │   ✓    │ │
│  │  Outputs        │ ✓✓✓✓  │ ✓✓✓✓  │ ✓✓✓✓ │  ✓   │  ✓  │ ✓✓✓  │  ✓   │  -    │  -   │   ✓    │ │
│  ├────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │ QUALITY         │                                                                                 │ │
│  │  QA Status      │ ✓✓✓✓  │ ✓✓✓✓  │ ✓✓✓✓ │ ✓✓✓✓ │  ✓  │  ✓   │ ✓✓✓   │  ✓    │  -   │   ✓    │ │
│  │  Inspections    │ ✓✓✓✓  │ ✓✓✓✓  │ ✓✓✓✓ │ ✓✓✓✓ │  ✓  │  ✓   │ ✓✓✓   │  ✓    │  -   │   ✓    │ │
│  │  NCR/CAPA       │ ✓✓✓✓  │ ✓✓✓✓  │ ✓✓✓✓ │ ✓✓✓✓ │  ✓  │ ✓✓✓  │ ✓✓✓   │  ✓    │  -   │   ✓    │ │
│  ├────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │ WAREHOUSE       │                                                                                 │ │
│  │  License Plates │ ✓✓✓✓  │ ✓✓✓✓  │  ✓   │  ✓   │ ✓✓✓✓│  -   │  -   │ ✓✓✓    │  -   │   ✓    │ │
│  │  Receiving      │ ✓✓✓✓  │ ✓✓✓✓  │  ✓   │  ✓   │ ✓✓✓✓│  -   │  -   │ ✓✓✓    │  -   │   ✓    │ │
│  │  Stock Moves    │ ✓✓✓✓  │ ✓✓✓✓  │  ✓   │  ✓   │ ✓✓✓✓│  -   │  -   │ ✓✓✓    │  -   │   ✓    │ │
│  ├────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │ SHIPPING        │                                                                                 │ │
│  │  Sales Orders   │ ✓✓✓✓  │ ✓✓✓✓  │  ✓   │  ✓   │ ✓✓✓✓│  -   │  -   │ ✓✓✓    │  -   │   ✓    │ │
│  │  Picking        │ ✓✓✓✓  │ ✓✓✓✓  │  ✓   │  ✓   │ ✓✓✓✓│  -   │  -   │ ✓✓✓    │  -   │   ✓    │ │
│  │  Packing        │ ✓✓✓✓  │ ✓✓✓✓  │  ✓   │  ✓   │ ✓✓✓✓│  -   │  -   │ ✓✓✓    │  -   │   ✓    │ │
│  └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
│  Legend: ✓✓✓✓ = Full Access (CRUD)  |  ✓✓✓ = Create/Read/Update  |  ✓ = Read Only  |  - = No Access   │
│                                                                                                            │
│  [📄 Export PDF]  [🖨️ Print]                                                                              │
│                                                                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘

Roles Summary:

1. Super Admin: Full system access, can manage all settings and users
2. Admin: Organization-wide access, cannot modify Super Admin settings
3. Production Manager: Full access to Production, Planning, Technical modules
4. Quality Manager: Full access to Quality module, read-only access to Production
5. Warehouse Manager: Full access to Warehouse and Shipping modules
6. Production Operator: Create/read/update access to Production execution
7. Quality Inspector: Create/read/update access to Quality inspections
8. Warehouse Operator: Create/read/update access to Warehouse receiving, stock moves, picking
9. Planner: Full access to Planning module (Purchase/Transfer/Work Orders)
10. Viewer: Read-only access to all modules (reporting, audits, reference data)
```

### Loading State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Roles & Permissions                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  │
│  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  │
│  [██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  │
│                                                                       │
│  Loading permissions matrix...                                       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Roles & Permissions                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                          [🔒 Icon]                                    │
│                                                                       │
│                  No Permission Data Available                         │
│                                                                       │
│         System roles have not been configured yet.                    │
│         Please contact your system administrator.                     │
│                                                                       │
│                     [Contact Support]                                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Roles & Permissions                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                          [⚠ Icon]                                     │
│                                                                       │
│                Failed to Load Permissions                             │
│                                                                       │
│        Unable to retrieve permission matrix. Please try again.       │
│              Error: PERMISSIONS_FETCH_FAILED                          │
│                                                                       │
│                [Retry]  [Contact Support]                             │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Permission Matrix Table** - 10 roles (columns) × ~20 module areas (rows), checkmark/dash cells
2. **Role Headers** - Column headers with role names (abbreviated for space)
3. **Module Groups** - Settings, Technical, Planning, Production, Quality, Warehouse, Shipping
4. **Legend** - Explains ✓✓✓✓ (CRUD), ✓✓✓ (CRU), ✓ (Read), - (No Access)
5. **Roles Summary** - Text explanation below table including all 10 roles
6. **Export/Print** - PDF export and print buttons

---

## Main Actions

- **[Export PDF]** - Downloads permission matrix as PDF for documentation/audits
- **[Print]** - Opens browser print dialog, optimized layout for A4/Letter
- **Hover tooltip** - Each cell shows detailed permissions on hover (e.g., "Create, Read, Update, Delete")

---

## States

- **Loading**: Skeleton table rows (3-4), "Loading permissions matrix..." text
- **Empty**: "No permission data" icon, Contact Support button (should never occur in production)
- **Error**: "Failed to load permissions" warning, Retry + Contact Support buttons
- **Success**: Full matrix with all roles/modules, legend, export/print options

---

## Data Structure

**Static Matrix** (hardcoded in frontend, no API call needed):

| Role Code | Display Name | Permissions Object |
|---|---|---|
| SUPER_ADMIN | Super Admin | `{ all: 'CRUD' }` |
| ADMIN | Admin | `{ settings: 'CRUD', users: 'CRUD', org: 'CRUD', ... }` |
| PROD_MANAGER | Production Manager | `{ production: 'CRUD', planning: 'CRUD', technical: 'CRUD', ... }` |
| QUAL_MANAGER | Quality Manager | `{ quality: 'CRUD', production: 'R', ... }` |
| WH_MANAGER | Warehouse Manager | `{ warehouse: 'CRUD', shipping: 'CRUD', ... }` |
| PROD_OPERATOR | Production Operator | `{ production: 'CRU', quality: 'R', ... }` |
| QUAL_INSPECTOR | Quality Inspector | `{ quality: 'CRU', production: 'R', ... }` |
| WH_OPERATOR | Warehouse Operator | `{ warehouse: 'CRU', shipping: 'CRU', ... }` |
| PLANNER | Planner | `{ planning: 'CRUD', technical: 'R', ... }` |
| VIEWER | Viewer | `{ all: 'R' }` |

**Permission Levels**:
- `CRUD` = Create, Read, Update, Delete
- `CRU` = Create, Read, Update (no Delete)
- `R` = Read-only
- `-` = No Access

**Role Definitions** (from PRD FR-SET-020 to FR-SET-029):

### 1. Super Admin (FR-SET-020)
- **Primary Function**: System administration
- **Access Level**: Full CRUD to all modules and features
- **Special Permissions**: Can manage all settings, create/modify/delete users, assign roles including Super Admin
- **Cannot**: Nothing - unrestricted access
- **Typical Users**: System administrator, Product owner

### 2. Admin (FR-SET-021)
- **Primary Function**: Organization-wide administration
- **Access Level**: Full CRUD to all modules except cannot modify Super Admin assignment
- **Special Permissions**: Can manage users, roles (except Super Admin), warehouses, organization settings
- **Restrictions**: Cannot delete Super Admin users, cannot modify Super Admin settings
- **Typical Users**: Operations manager, Site administrator

### 3. Production Manager (FR-SET-022)
- **Primary Function**: Production planning and execution oversight
- **Access Level**: Full CRUD to Production, Planning, Technical modules; Read-only elsewhere
- **Special Permissions**: Can create/manage work orders, view consumption/outputs, manage routings/BOMs
- **Restrictions**: Cannot modify quality holds or warehouse operations
- **Typical Users**: Production supervisor, Plant manager

### 4. Quality Manager (FR-SET-023)
- **Primary Function**: Quality assurance and compliance management
- **Access Level**: Full CRUD to Quality module; Read-only to Production
- **Special Permissions**: Can manage inspections, holds, NCR/CAPA workflows, quality parameters
- **Restrictions**: Cannot modify production execution directly
- **Typical Users**: QA manager, Quality supervisor

### 5. Warehouse Manager (FR-SET-024)
- **Primary Function**: Warehouse and shipping operations management
- **Access Level**: Full CRUD to Warehouse and Shipping modules
- **Special Permissions**: Can manage license plates, receiving, stock moves, picking, shipping
- **Restrictions**: No access to production or quality modules
- **Typical Users**: Warehouse supervisor, Logistics manager

### 6. Production Operator (FR-SET-025)
- **Primary Function**: Execute production tasks and record data
- **Access Level**: Create/Read/Update (no Delete) to Production module
- **Special Permissions**: Can execute work orders, record consumption, post outputs
- **Restrictions**: Cannot delete production records, cannot access quality or warehouse operations
- **Typical Users**: Production floor workers, Line operators

### 7. Quality Inspector (FR-SET-026)
- **Primary Function**: Perform quality inspections and record results
- **Access Level**: Create/Read/Update (no Delete) to Quality module
- **Special Permissions**: Can perform inspections, record test results, create inspection reports
- **Restrictions**: Cannot delete quality records, cannot approve/close quality holds
- **Typical Users**: Quality control technicians, Lab technicians

### 8. Warehouse Operator (FR-SET-027)
- **Primary Function**: Execute warehouse receiving, stock moves, and picking operations
- **Access Level**: Create/Read/Update (no Delete) to Warehouse and Shipping modules
- **Special Permissions**: Can receive goods, move inventory, execute picks and packing
- **Restrictions**: Cannot delete inventory records, cannot manage warehouse master data
- **Typical Users**: Warehouse floor workers, Fulfillment operators

### 9. Planner (FR-SET-028)
- **Primary Function**: Create and manage supply chain orders
- **Access Level**: Full CRUD to Planning module; Read-only to Technical
- **Special Permissions**: Can create purchase orders, transfer orders, work orders; manage demand forecasting
- **Restrictions**: Cannot modify technical specs or execute production
- **Typical Users**: Production planner, Supply chain planner

### 10. Viewer (FR-SET-029)
- **Primary Function**: Reference and reporting access
- **Access Level**: Read-only access to all modules
- **Special Permissions**: Can view all operational data for reporting/analysis
- **Restrictions**: Cannot perform any create/update/delete operations
- **Typical Users**: Auditors, Executives, Analysts, External stakeholders

---

## Accessibility

- **Touch targets**: Export/Print buttons >= 48x48dp
- **Contrast**: Table text passes WCAG AA (4.5:1), checkmarks use semantic colors (green ✓, gray -)
- **Screen reader**: Table uses proper `<table>`, `<thead>`, `<tbody>`, `<th scope="col/row">` markup
- **Keyboard**: Tab navigation for Export/Print buttons, table is scrollable with arrow keys
- **Responsive**: Horizontal scroll on mobile (<768px), sticky headers (role names + module names)

---

## Responsive Breakpoints

- **Desktop (>1024px)**: Full table visible, all 10 columns + module column
- **Tablet (768-1024px)**: Horizontal scroll, sticky first column (module names)
- **Mobile (<768px)**: Card layout alternative - each role as expandable card with modules listed vertically

---

## Technical Notes

- **No API call**: Matrix is static, defined in frontend constants (`lib/constants/roles.ts`)
- **No RLS**: All users can view this reference (no sensitive data)
- **Export PDF**: Uses jsPDF library to generate PDF from table
- **Print CSS**: `@media print` styles for optimal A4 layout
- **Role constants**: Update `lib/constants/roles.ts` to include all 10 role definitions (SUPER_ADMIN, ADMIN, PROD_MANAGER, QUAL_MANAGER, WH_MANAGER, PROD_OPERATOR, QUAL_INSPECTOR, WH_OPERATOR, PLANNER, VIEWER)
- **API Response** (role list endpoint if needed):
  ```json
  {
    "roles": [
      {
        "id": "SUPER_ADMIN",
        "name": "Super Admin",
        "description": "System administration with full access",
        "permissions": { "all": "CRUD" }
      },
      {
        "id": "ADMIN",
        "name": "Admin",
        "description": "Organization-wide administration",
        "permissions": { "settings": "CRUD", "users": "CRUD", ... }
      },
      ...
    ]
  }
  ```

---

**Approval Status**: Auto-Approved (user opted for auto-approve mode)
**User Approval Required**: No (auto-approve mode)
**Iterations Used**: 0 of 3
