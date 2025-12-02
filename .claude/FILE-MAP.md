# File Map - Szybki Index

> AI: Użyj tego zamiast skanować projekt

---

## Moduły Aplikacji

| Moduł | Pages | Components | API |
|-------|-------|------------|-----|
| **Auth** | `app/login/`, `app/signup/` | `components/auth/` | `app/auth/callback/` |
| **Dashboard** | `app/(authenticated)/dashboard/` | `components/dashboard/` | `app/api/dashboard/` |
| **Settings** | `app/(authenticated)/settings/` | `components/settings/` | `app/api/settings/` |
| **Planning** | `app/(authenticated)/planning/` | `components/planning/` | `app/api/planning/` |
| **Technical** | `app/(authenticated)/technical/` | `components/technical/` | `app/api/technical/` |

---

## API Routes Quick Reference

### Settings (`/api/settings/`)
```
/warehouses      GET, POST      → WarehouseFormModal
/warehouses/[id] GET, PUT, DEL
/locations       GET, POST      → LocationFormModal
/locations/[id]  GET, PUT, DEL
/machines        GET, POST      → MachineFormModal
/machines/[id]   GET, PUT, DEL
/lines           GET, POST      → ProductionLineFormModal
/lines/[id]      GET, PUT, DEL
/users           GET, POST      → UserForm
/users/[id]      GET, PUT, DEL
/users/[id]/sessions GET
/invitations     GET, POST      → InvitationModal
/allergens       GET, POST      → AllergenFormModal
/tax-codes       GET, POST      → TaxCodeFormModal
/organization    GET, PUT       → OrganizationForm
/modules         GET, PUT
/wizard          GET, PUT
/stats           GET
```

### Planning (`/api/planning/`)
```
/purchase-orders       GET, POST  → PurchaseOrderFormModal
/purchase-orders/[id]  GET, PUT, DEL
/purchase-orders/[id]/lines      → POLinesTable
/purchase-orders/[id]/approvals  → po_approvals table
/work-orders           GET, POST  → WorkOrderFormModal
/work-orders/[id]      GET, PUT, DEL
/transfer-orders       GET, POST  → TransferOrderFormModal
/transfer-orders/[id]  GET, PUT, DEL
/transfer-orders/[id]/lines      → TOLinesTable
/suppliers             GET, POST  → SupplierFormModal
/suppliers/[id]        GET, PUT, DEL
/settings              GET, PUT   → planning_settings
/dashboard/stats       GET
```

### Technical (`/api/technical/`)
```
/products              GET, POST  → ProductFormModal
/products/[id]         GET, PUT, DEL
/products/[id]/allergens         → product_allergens
/products/[id]/history           → product_version_history
/boms                  GET, POST  → BOMFormModal
/boms/[id]             GET, PUT, DEL
/boms/[id]/items                 → BOMItemFormModal
/boms/[id]/clone                 → BOMCloneModal
/boms/compare                    → BOMCompareModal
/routings              GET, POST  → create-routing-modal
/routings/[id]         GET, PUT, DEL
/routings/[id]/operations        → operations-table
/routings/[id]/products          → assigned-products-table
/product-types         GET, POST
/tracing/*                       → GenealogyTree
/settings              GET, PUT   → technical_settings
/dashboard/*           GET
```

---

## Components by Feature

### Auth
```
LoginForm.tsx          → Login page form
ForgotPasswordForm.tsx → Password reset request
ResetPasswordForm.tsx  → New password form
UserMenu.tsx           → Header user dropdown
PasswordStrength.tsx   → Password validator
```

### Settings
```
WarehouseFormModal.tsx       → CRUD warehouse
LocationFormModal.tsx        → CRUD location
MachineFormModal.tsx         → CRUD machine
ProductionLineFormModal.tsx  → CRUD production line
UserForm.tsx + EditUserDrawer.tsx → User management
InvitationModal.tsx          → Invite users
AllergenFormModal.tsx        → CRUD allergen
TaxCodeFormModal.tsx         → CRUD tax code
OrganizationForm.tsx         → Org settings
SettingsStatsCards.tsx       → Dashboard stats
SettingsHeader.tsx           → Module header
```

### Planning
```
PurchaseOrderFormModal.tsx   → Create/edit PO
PurchaseOrdersTable.tsx      → PO list
POLinesTable.tsx             → PO line items
POLineFormModal.tsx          → PO line CRUD
WorkOrderFormModal.tsx       → Create/edit WO
WorkOrdersTable.tsx          → WO list
WorkOrdersSpreadsheet.tsx    → WO spreadsheet view
TransferOrderFormModal.tsx   → Create/edit TO
TransferOrdersTable.tsx      → TO list
TOLinesTable.tsx             → TO line items
SupplierFormModal.tsx        → Supplier CRUD
SuppliersTable.tsx           → Supplier list
POFastFlow/                  → Quick PO creation
PlanningHeader.tsx           → Module header
```

### Technical
```
ProductFormModal.tsx         → Product CRUD
ProductDeleteDialog.tsx      → Delete confirmation
BOMFormModal.tsx             → BOM CRUD
BOMItemFormModal.tsx         → BOM item CRUD
BOMCloneModal.tsx            → Clone BOM
BOMCompareModal.tsx          → Compare versions
routings/                    → Routing management
GenealogyTree.tsx            → Traceability view
LPNode.tsx                   → License plate node
TechnicalHeader.tsx          → Module header
```

### Common/UI
```
components/ui/               → shadcn/ui components
components/common/           → Shared components
components/navigation/       → Sidebar, etc.
```

---

## Lib & Utils

```
lib/supabase/client.ts       → Browser Supabase client
lib/supabase/server.ts       → Server Supabase client
lib/supabase/middleware.ts   → Auth middleware
lib/supabase/migrations/     → SQL migrations
lib/utils.ts                 → Utility functions
```

---

## Config Files

```
apps/frontend/
├── package.json             → Dependencies
├── next.config.js           → Next.js config
├── tailwind.config.ts       → Tailwind config
├── tsconfig.json            → TypeScript config
└── middleware.ts            → Route middleware

Root:
├── playwright.config.ts     → E2E test config
├── pnpm-workspace.yaml      → Monorepo config
└── turbo.json               → Turborepo config
```

---

## Quick Grep Patterns

```bash
# Find component usage
grep -r "ComponentName" apps/frontend/

# Find API calls
grep -r "fetch.*api/resource" apps/frontend/

# Find table references
grep -r "from('table_name')" apps/frontend/

# Find type definitions
grep -r "interface.*Name" apps/frontend/
```
