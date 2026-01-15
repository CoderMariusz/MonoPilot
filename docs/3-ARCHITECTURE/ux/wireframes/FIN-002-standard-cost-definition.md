# FIN-002: Standard Cost Definition Page

**Module**: Finance (Cost Management)
**Feature**: Standard Cost Definition (PRD Section FR-9.1.4)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Populated)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Standard Costs                                       [+ New Standard Cost] [Export]   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Filters:                                                                                   |   |
|  |                                                                                            |   |
|  | [Search by product name...             ]  Status: [All v]  Type: [All v]                 |   |
|  |                                                                                            |   |
|  | Effective Date: [From: ________]  [To: ________]                    [Clear Filters]       |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Standard Costs                                                     Showing 1-25 of 156    |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | [ ] | Product Code | Product Name        | Material | Labor  | Overhead | Total   | Status  | |
|  | --- | ------------ | ------------------- | -------- | ------ | -------- | ------- | ------- | |
|  | [ ] | PRD-001      | Chocolate Bar 100g  | 2.50 PLN | 0.40   | 0.60     | 3.50    | Active  | |
|  |     |              | Effective: 2025-01-01 - Present                                       | |
|  | --- | ------------ | ------------------- | -------- | ------ | -------- | ------- | ------- | |
|  | [ ] | PRD-002      | Cookie Pack 250g    | 4.20 PLN | 0.65   | 0.90     | 5.75    | Active  | |
|  |     |              | Effective: 2025-01-01 - Present                                       | |
|  | --- | ------------ | ------------------- | -------- | ------ | -------- | ------- | ------- | |
|  | [ ] | PRD-003      | Bread Loaf 500g     | 1.80 PLN | 0.35   | 0.45     | 2.60    | Active  | |
|  |     |              | Effective: 2024-07-01 - Present                                       | |
|  | --- | ------------ | ------------------- | -------- | ------ | -------- | ------- | ------- | |
|  | [ ] | PRD-004      | Muffin 6-Pack       | 3.10 PLN | 0.55   | 0.75     | 4.40    | Draft   | |
|  |     |              | Effective: 2025-02-01 - (pending)                                     | |
|  | --- | ------------ | ------------------- | -------- | ------ | -------- | ------- | ------- | |
|  | [ ] | PRD-005      | Cake Slice          | 2.90 PLN | 0.50   | 0.70     | 4.10    | Approved| |
|  |     |              | Effective: 2025-02-01 - Present                                       | |
|  | --- | ------------ | ------------------- | -------- | ------ | -------- | ------- | ------- | |
|  |                                                                                            |   |
|  | [< Previous]  Page 1 of 7  [Next >]                                                       |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  Selected: 0 items                [Bulk Approve]  [Bulk Delete]  [Export Selected]               |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  Summary: 156 Standard Costs | 142 Active | 8 Approved | 6 Draft                               |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Create/Edit Standard Cost Modal

```
+------------------------------------------------------------------+
|  Create Standard Cost                                      [X]    |
+------------------------------------------------------------------+
|                                                                    |
|  Product/Material *                                                |
|  [Select product or material...                               v]   |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Item Type                                                     | |
|  | ( ) Product    ( ) Material                                   | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Effective Dates                                                   |
|  +---------------------------+  +-----------------------------+    |
|  | Effective From *          |  | Effective To (optional)     |    |
|  | [2025-02-01         ]     |  | [                      ]    |    |
|  +---------------------------+  +-----------------------------+    |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Cost Components                                               | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  |  Material Cost *            Labor Cost *                       | |
|  |  +--------------------+     +--------------------+             | |
|  |  | 2.50          PLN  |     | 0.40          PLN  |             | |
|  |  +--------------------+     +--------------------+             | |
|  |                                                                | |
|  |  Overhead Cost *            Total Cost (calculated)            | |
|  |  +--------------------+     +--------------------+             | |
|  |  | 0.60          PLN  |     | 3.50          PLN  |             | |
|  |  +--------------------+     +--------------------+             | |
|  |                                                                | |
|  |  [===================|========================]  Progress Bar  | |
|  |   Material 71%  |  Labor 11%  |  Overhead 17%                  | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Currency & UOM                                                | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  |  Currency *                  Unit of Measure *                 | |
|  |  +--------------------+      +--------------------+            | |
|  |  | PLN (zl)       v   |      | pcs            v   |            | |
|  |  +--------------------+      +--------------------+            | |
|  |                                                                | |
|  |  Cost Basis *                                                  | |
|  |  +------------------------------------------+                  | |
|  |  | Per Unit                             v   |                  | |
|  |  +------------------------------------------+                  | |
|  |  Options: Per Unit | Per Batch | Per Kg | Per Liter            | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Notes                                                             |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Initial standard cost for Q1 2025                             | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
|  [Cancel]                    [Save as Draft]  [Save & Approve]    |
+------------------------------------------------------------------+
```

### Cost History View

```
+------------------------------------------------------------------+
|  Cost History - Chocolate Bar 100g (PRD-001)               [X]    |
+------------------------------------------------------------------+
|                                                                    |
|  Current Active Cost: 3.50 PLN/unit                               |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Version History                                               | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Version | Effective From | Effective To | Total  | Status     | |
|  | ------- | -------------- | ------------ | ------ | ---------- | |
|  | v3.0    | 2025-01-01     | Present      | 3.50   | Active     | |
|  | v2.0    | 2024-07-01     | 2024-12-31   | 3.25   | Superseded | |
|  | v1.0    | 2024-01-01     | 2024-06-30   | 3.00   | Superseded | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Cost Trend                                                    | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  |     ^                                                          | |
|  |  4.0|                               +------------------        | |
|  |     |                      +--------+                          | |
|  |  3.5|             +--------+                                   | |
|  |     +-------------+                                            | |
|  |  3.0|                                                          | |
|  |     +----+----+----+----+----+----+----+----+----+----+       | |
|  |       Jan  Mar  May  Jul  Sep  Nov  Jan  Mar                  | |
|  |       2024                         2025                        | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Compare Versions                                              | |
|  +--------------------------------------------------------------+ |
|  | Select: [v3.0 v]  vs  [v2.0 v]                [Compare]       | |
|  |                                                                | |
|  | Component       | v2.0 (Old)  | v3.0 (New)  | Change          | |
|  | --------------- | ----------- | ----------- | --------------- | |
|  | Material        | 2.35 PLN    | 2.50 PLN    | +0.15 (+6.4%)   | |
|  | Labor           | 0.40 PLN    | 0.40 PLN    | 0 (0%)          | |
|  | Overhead        | 0.50 PLN    | 0.60 PLN    | +0.10 (+20%)    | |
|  | Total           | 3.25 PLN    | 3.50 PLN    | +0.25 (+7.7%)   | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
|  [Close]                                   [Create New Version]   |
+------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < Standard Costs                |
|  [+ New]                         |
+----------------------------------+
|                                  |
|  [Search...                   ]  |
|  [Filters v]                     |
|                                  |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | PRD-001                    |  |
|  | Chocolate Bar 100g         |  |
|  |                            |  |
|  | Total: 3.50 PLN/unit       |  |
|  | Mat: 2.50 | Lab: 0.40      |  |
|  |                            |  |
|  | [Active]                   |  |
|  | Eff: 2025-01-01 - Present  |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | PRD-002                    |  |
|  | Cookie Pack 250g           |  |
|  |                            |  |
|  | Total: 5.75 PLN/unit       |  |
|  | Mat: 4.20 | Lab: 0.65      |  |
|  |                            |  |
|  | [Active]                   |  |
|  | Eff: 2025-01-01 - Present  |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | PRD-004                    |  |
|  | Muffin 6-Pack              |  |
|  |                            |  |
|  | Total: 4.40 PLN/unit       |  |
|  | Mat: 3.10 | Lab: 0.55      |  |
|  |                            |  |
|  | [Draft]                    |  |
|  | Eff: 2025-02-01 - pending  |  |
|  +----------------------------+  |
|                                  |
|  [Load More]                     |
|                                  |
+----------------------------------+
|  156 costs | 142 Active          |
+----------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Standard Costs                                       [+ New Standard Cost] [Export]   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                       [Price Tag Icon]                                           |
|                                                                                                  |
|                                   No Standard Costs Defined                                      |
|                                                                                                  |
|                     Standard costs establish the expected cost baseline for                      |
|                     products and materials, enabling variance analysis and                       |
|                     cost planning.                                                               |
|                                                                                                  |
|                                                                                                  |
|                                   [+ Create First Standard Cost]                                 |
|                                                                                                  |
|                                                                                                  |
|                     Tip: Start by defining standard costs for your                               |
|                     top 10 products to enable cost variance tracking.                            |
|                                                                                                  |
|                              [Import Standard Costs from CSV]                                    |
|                              [View Standard Cost Guide]                                          |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Standard Costs DataTable

Main table displaying all standard cost records.

| Column | Type | Sortable | Description |
|--------|------|----------|-------------|
| Checkbox | Selection | No | Multi-select for bulk actions |
| Product Code | Text | Yes | Product/material identifier |
| Product Name | Text | Yes | Full product name |
| Material Cost | Currency | Yes | Material cost component |
| Labor Cost | Currency | Yes | Labor cost component |
| Overhead Cost | Currency | Yes | Overhead cost component |
| Total Cost | Currency | Yes | Sum of all components |
| Status | Badge | Yes | Draft/Approved/Active/Superseded |
| Effective Dates | Date range | Yes | Effective period |

### 2. Create/Edit Modal

Modal form for standard cost CRUD operations.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Product/Material | Dropdown | Yes | Must exist in products table |
| Item Type | Radio | Yes | product or material |
| Effective From | Date | Yes | Cannot be in past for new drafts |
| Effective To | Date | No | Must be >= effective_from |
| Material Cost | Number | Yes | >= 0, 4 decimal precision |
| Labor Cost | Number | Yes | >= 0, 4 decimal precision |
| Overhead Cost | Number | Yes | >= 0, 4 decimal precision |
| Currency | Dropdown | Yes | From currencies table |
| UOM | Dropdown | Yes | pcs, kg, liter, etc. |
| Cost Basis | Dropdown | Yes | per_unit, per_batch, per_kg, per_liter |
| Notes | Textarea | No | Max 500 characters |

### 3. Status Badges

| Status | Color | Description |
|--------|-------|-------------|
| Draft | Gray | Not yet approved, can be edited/deleted |
| Approved | Blue | Approved, pending activation |
| Active | Green | Currently effective |
| Superseded | Orange | Replaced by newer version |

### 4. Cost History View

Displays version history for a specific product's standard costs.

| Feature | Description |
|---------|-------------|
| Version List | All versions with effective dates and status |
| Cost Trend Chart | Line chart showing cost over time |
| Version Compare | Side-by-side comparison of 2 versions |

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Create Standard Cost | Header [+ New Standard Cost] | Opens create modal |
| Export | Header [Export] | Download as CSV/Excel |
| Edit | Row click or kebab menu | Opens edit modal (draft only) |
| View History | Row kebab menu | Opens cost history modal |
| Approve | Row kebab menu or modal | Changes status to approved |
| Delete | Row kebab menu | Deletes draft (with confirmation) |

### Bulk Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Bulk Approve | [Bulk Approve] button | Approve all selected drafts |
| Bulk Delete | [Bulk Delete] button | Delete all selected drafts |
| Export Selected | [Export Selected] button | Export selected rows |

### Modal Actions

| Action | Button | Behavior |
|--------|--------|----------|
| Save as Draft | [Save as Draft] | Create/update with status=draft |
| Save & Approve | [Save & Approve] | Create/update with status=approved (Finance Manager only) |
| Cancel | [Cancel] | Close modal without saving |
| Create New Version | [Create New Version] | Clone active cost as new draft |

---

## States

### Loading State
- Skeleton rows in DataTable (5 rows)
- Skeleton filter bar
- "Loading standard costs..." text

### Empty State
- Price tag illustration
- "No Standard Costs Defined" headline
- Explanation text about cost baselines
- [+ Create First Standard Cost] primary CTA
- [Import Standard Costs from CSV] secondary action
- [View Standard Cost Guide] documentation link

### Populated State (Success)
- DataTable with cost records
- Filter panel active
- Summary bar with counts
- Pagination available

### Error State
- Warning icon
- "Failed to Load Standard Costs" headline
- Error explanation and code
- [Retry] and [Contact Support] buttons

---

## Business Rules

### Standard Cost Rules

1. **Total Cost Auto-Calculation**: total_cost = material_cost + labor_cost + overhead_cost
2. **Effective Date Validation**: effective_to must be >= effective_from (if provided)
3. **No Overlapping Active Costs**: Only one active cost per product at a time
4. **Draft Editable**: Only drafts can be modified or deleted
5. **Approval Required**: Only Finance Manager can approve costs
6. **Supersede on Activate**: Activating a new cost supersedes the previous active cost
7. **Future Date Activation**: Costs with future effective_from can be scheduled

### Approval Workflow

```
Draft -> Approved -> Active
         |
         v (on effective_from date)
         Active (previous Active -> Superseded)
```

### Permissions

| Role | View | Create | Edit Draft | Approve | Delete Draft |
|------|------|--------|------------|---------|--------------|
| Finance Manager | Yes | Yes | Yes | Yes | Yes |
| Cost Accountant | Yes | Yes | Yes | No | Yes |
| Admin | Yes | Yes | Yes | Yes | Yes |
| Viewer | Yes | No | No | No | No |

---

## API Endpoints

### List Standard Costs

```
GET /api/finance/standard-costs
Query: ?status=active&search=chocolate&page=1&limit=25

Response:
{
  "data": [
    {
      "id": "uuid",
      "item_id": "uuid",
      "item_type": "product",
      "product_code": "PRD-001",
      "product_name": "Chocolate Bar 100g",
      "material_cost": 2.50,
      "labor_cost": 0.40,
      "overhead_cost": 0.60,
      "total_cost": 3.50,
      "currency_code": "PLN",
      "uom": "pcs",
      "cost_basis": "per_unit",
      "effective_from": "2025-01-01",
      "effective_to": null,
      "status": "active",
      "approved_by": "uuid",
      "approved_at": "2024-12-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "limit": 25,
    "pages": 7
  },
  "summary": {
    "total": 156,
    "active": 142,
    "approved": 8,
    "draft": 6
  }
}
```

### Create Standard Cost

```
POST /api/finance/standard-costs

Request:
{
  "item_id": "uuid",
  "item_type": "product",
  "effective_from": "2025-02-01",
  "effective_to": null,
  "material_cost": 2.50,
  "labor_cost": 0.40,
  "overhead_cost": 0.60,
  "currency_id": "uuid",
  "uom": "pcs",
  "cost_basis": "per_unit",
  "notes": "Q1 2025 standard cost"
}

Response:
{
  "id": "uuid",
  "status": "draft",
  "total_cost": 3.50,
  "created_at": "2026-01-15T10:00:00Z"
}
```

### Approve Standard Cost

```
POST /api/finance/standard-costs/:id/approve

Response:
{
  "id": "uuid",
  "status": "approved",
  "approved_by": "uuid",
  "approved_at": "2026-01-15T10:00:00Z"
}
```

---

## Accessibility

### Touch Targets
- Table rows: min 48x48dp clickable area
- Action buttons: 48x48dp minimum
- Modal form fields: 48x48dp touch target

### Contrast
- Cost values: 4.5:1 against background
- Status badges: 4.5:1 (colored background with appropriate text)
- Table headers: 4.5:1

### Screen Reader
- **DataTable**: `role="table"` `aria-label="Standard Costs with 156 records"`
- **Status badge**: `aria-label="Status: Active"`
- **Modal**: `role="dialog"` `aria-labelledby="modal-title"`

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Navigate between table rows, filters, buttons |
| Enter | Open edit modal, execute action |
| Space | Toggle checkbox selection |
| Escape | Close modal |

---

## Handoff to FRONTEND-DEV

```yaml
feature: Standard Cost Definition Page
story: FIN-002
prd_coverage: "Finance PRD FR-9.1.4"
  - "Standard cost CRUD"
  - "Effective date ranges"
  - "Approval workflow"
  - "Cost history tracking"
approval_status:
  mode: "auto_approve"
  user_approved: true
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/FIN-002-standard-cost-definition.md
  api_endpoints:
    - GET /api/finance/standard-costs
    - POST /api/finance/standard-costs
    - PUT /api/finance/standard-costs/:id
    - DELETE /api/finance/standard-costs/:id
    - POST /api/finance/standard-costs/:id/approve
    - GET /api/finance/standard-costs/:id/history
states_per_screen: [loading, empty, error, populated]
components:
  - StandardCostsDataTable
  - StandardCostFormModal
  - CostHistoryModal
  - StatusBadge
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 6-8 hours
**Wireframe Length**: ~400 lines
