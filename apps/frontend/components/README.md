# Component Organization

This directory is organized by feature domain to improve maintainability and developer experience.

## Directory Structure

```
components/
├── layout/           # App-wide layout components
│   ├── AppLayout.tsx
│   ├── Sidebar.tsx
│   └── Topbar.tsx
├── planning/         # Planning module components
│   ├── WorkOrdersTable.tsx
│   ├── CreateWorkOrderModal.tsx
│   ├── WorkOrderDetailsModal.tsx
│   ├── PurchaseOrdersTable.tsx
│   ├── CreatePurchaseOrderModal.tsx
│   ├── EditPurchaseOrderModal.tsx
│   ├── PurchaseOrderDetailsModal.tsx
│   ├── TransferOrdersTable.tsx
│   ├── CreateTransferOrderModal.tsx
│   ├── EditTransferOrderModal.tsx
│   └── TransferOrderDetailsModal.tsx
├── production/       # Production module components
│   └── (yield reports, consume reports)
├── warehouse/        # Warehouse module components
│   ├── GRNTable.tsx
│   ├── CreateGRNModal.tsx
│   ├── GRNDetailsModal.tsx
│   ├── StockMoveTable.tsx
│   ├── CreateStockMoveModal.tsx
│   ├── StockMoveDetailsModal.tsx
│   ├── LPOperationsTable.tsx
│   ├── AmendLPModal.tsx
│   ├── SplitLPModal.tsx
│   ├── ChangeQAStatusModal.tsx
│   └── ManualConsumeModal.tsx
├── technical/        # Technical module components
│   ├── BomCatalogClient.tsx
│   ├── AddItemModal.tsx
│   ├── AllergensTable.tsx
│   ├── LocationsTable.tsx
│   └── MachinesTable.tsx
├── admin/            # Admin module components
│   ├── UsersTable.tsx
│   ├── CreateUserModal.tsx
│   ├── EditUserModal.tsx
│   ├── SessionsTable.tsx
│   └── SettingsForm.tsx
├── scanner/          # Scanner module components
│   └── (scanner-specific components)
├── shared/           # Shared/reusable components
│   ├── AlertDialog.tsx
│   ├── ProductionLinesDropdown.tsx
│   └── lazy/
│       └── LazyModal.tsx
└── README.md         # This file
```

## Migration Strategy

Components are gradually being moved to their appropriate feature directories. The current flat structure is maintained for backward compatibility during the transition.

## Import Paths

When moving components, update import paths in consuming files:

```typescript
// Old import
import { WorkOrdersTable } from '@/components/WorkOrdersTable';

// New import (after moving to planning/)
import { WorkOrdersTable } from '@/components/planning/WorkOrdersTable';
```

## Benefits

- **Better Organization**: Components grouped by business domain
- **Easier Navigation**: Developers can quickly find related components
- **Reduced Coupling**: Clear separation of concerns
- **Scalability**: Easy to add new features without cluttering root directory
