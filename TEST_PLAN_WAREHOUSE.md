# Warehouse Module Test Plan

**Module**: `app/(authenticated)/warehouse`  
**Last Updated**: February 8, 2026

---

## 📋 Warehouse Dashboard

### Buttons
- [ ] Create Transfer Order: Opens TO form modal
- [ ] Create Purchase Order: Opens PO form modal
- [ ] Warehouse selector: Dropdown to switch warehouses
- [ ] Refresh data: Reloads all warehouse metrics
- [ ] View warehouse settings: Navigates to settings page

### Forms
- [ ] No forms on dashboard (buttons open modals)

### Modals
- [ ] Transfer Order form: Create TO with source/dest warehouses
- [ ] Purchase Order form: Create PO with vendor selection

### Tables
- [ ] None on dashboard (card-based layout)

### Workflows
- [ ] Load warehouse data: KPIs, inventory levels, stock locations
- [ ] Select warehouse: Dropdown switches active warehouse, refreshes all data
- [ ] Create TO: Opens form, selects warehouse, submits
- [ ] Create PO: Opens form, allows vendor selection, submits
- [ ] Refresh: Manually refetch all data from server
- [ ] Navigate: Button clicks navigate to settings or detail pages

### Error States
- [ ] Loading: Skeleton loaders for cards
- [ ] Error: Banner with Retry button
- [ ] No warehouse: "No warehouses available" message
- [ ] API timeout: Toast with retry option

---

## 📋 Inventory Management

### Buttons
- [ ] Search/filter: Apply filters to inventory list
- [ ] Clear filters: Reset all filter selections
- [ ] Create inventory adjustment: Opens adjustment form
- [ ] Add stock: Opens receipt form
- [ ] Move stock: Opens transfer form
- [ ] Delete: Shows confirmation (for unreserved stock)

### Forms
- [ ] Search input: Text search on SKU, product name
- [ ] Warehouse filter: Dropdown, single-select
- [ ] Product type filter: Multi-select (RM, WIP, FG, etc.)
- [ ] Stock status filter: Multi-select (Available, Reserved, Low, Out of Stock)
- [ ] Location filter: Dropdown for specific location
- [ ] Date range: Filter by movement/receipt date

### Modals
- [ ] Inventory adjustment modal: Record quantity adjustments
- [ ] Add stock modal: Record goods receipt
- [ ] Move stock modal: Record location transfer
- [ ] Delete confirmation: Confirms stock deletion

### Tables
- [ ] Inventory list: SKU, Product, Warehouse, Location, Qty Available, Qty Reserved, Qty Total, Status, Actions
- [ ] Movement history: Date, Type (Receipt/Movement/Adjustment), Qty, User, Notes
- [ ] Pagination: Navigate between pages

### Workflows
- [ ] Load inventory: Fetches inventory for selected warehouse
- [ ] Filter: Apply filters, reset page to 1
- [ ] Search: Debounced search filters by SKU/product
- [ ] Add stock: Opens form, records receipt, updates inventory
- [ ] Move stock: Opens form, selects source/dest location, updates
- [ ] Adjust inventory: Opens form, records adjustment reason, updates
- [ ] Delete stock: Shows confirmation, deletes unreserved stock
- [ ] View history: Shows all movements for item

### Error States
- [ ] Insufficient qty: "Not enough stock to move/reserve"
- [ ] Cannot delete: "Stock is reserved, cannot delete"
- [ ] Location invalid: "Invalid source/destination location"
- [ ] Validation error: Field error messages
- [ ] Empty list: "No inventory items found"

---

## 📋 Stock Levels & Reorder Points

### Buttons
- [ ] Set reorder point: Opens modal to set threshold
- [ ] View forecast: Navigates to forecast page (if available)
- [ ] Generate alert: Creates manual low stock alert
- [ ] Bulk reorder: Opens order form with multiple SKUs

### Forms
- [ ] Minimum stock level: Number input, must be positive
- [ ] Maximum stock level: Number input, >= minimum
- [ ] Reorder quantity: Number input, must be positive
- [ ] Lead time days: Number input for supplier lead time

### Modals
- [ ] Set reorder point modal: Update min/max/reorder qty
- [ ] Low stock alert modal: Shows SKUs below reorder point, bulk create PO

### Tables
- [ ] Stock level summary: SKU, Current Qty, Min Level, Max Level, Reorder Qty, Status (OK/Low/Critical)
- [ ] Low stock alerts: SKUs below minimum, recommended action

### Workflows
- [ ] Load stock levels: Display current inventory vs thresholds
- [ ] Set reorder point: Opens modal, updates thresholds, saves
- [ ] View alerts: Shows SKUs needing reorder
- [ ] Create reorder: Bulk create POs for low stock items
- [ ] Forecast: View/adjust demand forecast

### Error States
- [ ] Invalid range: "Min must be less than Max"
- [ ] Negative value: "Values must be positive"
- [ ] API error: Toast with error message

---

## 📋 Locations Management

### Buttons
- [ ] Add location: Opens location form modal
- [ ] Edit location: Opens modal with current data
- [ ] View QR code: Opens QR code display modal
- [ ] Move to location: Opens movement form
- [ ] Archive location: Soft deletes location

### Forms
- [ ] Location code: Text input, required, format: WH-Z-A-R-001
- [ ] Location name: Text input, required
- [ ] Warehouse: Dropdown, required
- [ ] Level: Dropdown (Zone, Aisle, Rack, Bin)
- [ ] Type: Dropdown (Bulk, Pallet, Shelf, Floor, Staging)
- [ ] Parent location: Dropdown for hierarchical structure
- [ ] Capacity: Number input, max pallets/weight
- [ ] Status: Active/Archived toggle

### Modals
- [ ] Create/Edit location modal: Form fields above
- [ ] QR code modal: Display/download/print QR code
- [ ] Archive confirmation: Soft delete confirmation

### Tables
- [ ] Locations table: Code, Name, Warehouse, Level, Type, Path, Capacity, Status, Actions
- [ ] Inventory in location: SKU, Product, Qty, Reserved, Available

### Workflows
- [ ] Load locations: Fetches hierarchical location structure
- [ ] Create location: Opens form, saves, refreshes
- [ ] Edit location: Opens form, updates, refreshes
- [ ] View QR: Opens modal with scannable QR code
- [ ] Download QR: Saves PNG of QR code
- [ ] Archive: Soft deletes location, hides from active lists
- [ ] Move stock to location: Opens form, moves inventory

### Error States
- [ ] Duplicate code: "Code already exists"
- [ ] Invalid parent: "Parent must be higher level"
- [ ] Capacity exceeded: "Location capacity exceeded"
- [ ] Default location: "Cannot delete warehouse default"

---

## 📋 Goods Receipt

### Buttons
- [ ] Create receipt: Opens form modal
- [ ] Receive from PO: Links to specific PO
- [ ] Partial receipt: Records partial delivery
- [ ] Full receipt: Marks PO as fully delivered
- [ ] Accept: Confirms receipt, updates inventory
- [ ] Reject: Rejects items, initiates return

### Forms
- [ ] Purchase Order: Dropdown or auto-populated
- [ ] Receipt date: Date picker, default today
- [ ] Line items: SKU, Expected Qty, Received Qty, Condition
- [ ] Add line: Button to add more items
- [ ] Notes: Textarea, optional
- [ ] Lot/Batch number: Text, optional (per item)
- [ ] Quality notes: Textarea, optional (per item)

### Modals
- [ ] Receive goods modal: Form above
- [ ] Reject items modal: Select items to reject, collect reason
- [ ] Quality issue modal: Report quality problems

### Tables
- [ ] Receipt line items: SKU, Expected, Received, Difference, Condition, Status
- [ ] Receipt history: Date, PO, Qty Received, User, Status

### Workflows
- [ ] Create receipt: Opens form, shows PO line items, records receipt
- [ ] Partial receipt: Receives less than expected, holds for more
- [ ] Full receipt: All items received, closes receipt
- [ ] Accept: Confirms receipt, updates inventory levels
- [ ] Reject: Items not accepted, initiates return process
- [ ] Quality check: Optional quality review before acceptance

### Error States
- [ ] Qty mismatch: "Received does not match expected"
- [ ] PO not found: "Purchase order not found"
- [ ] Already received: "All items already received"
- [ ] Invalid condition: "Select product condition"

---

## 📋 Stock Movements

### Buttons
- [ ] Create movement: Opens movement form
- [ ] Approve movement: Transitions to approved status
- [ ] Complete movement: Marks as physically moved
- [ ] Cancel movement: Cancels pending movement

### Forms
- [ ] Source location: Dropdown, required
- [ ] Destination location: Dropdown, required
- [ ] Products: Multi-select or table of items
- [ ] Quantities: Number per item, validates available
- [ ] Reason: Dropdown (Consolidation, Picking, Audit, Restock, Other)
- [ ] Priority: Dropdown (Low, Medium, High)
- [ ] Notes: Textarea, optional

### Modals
- [ ] Create movement modal: Form above
- [ ] Movement approval modal: Shows details, requires approval
- [ ] Complete movement modal: Confirms items moved to location

### Tables
- [ ] Pending movements: Source Location, Dest Location, Items, Qty, Status, Due Date
- [ ] Movement history: Date, Source, Dest, Qty Moved, User, Status

### Workflows
- [ ] Create movement: Opens form, validates locations, saves
- [ ] Approve: Transitions to approved, notifies warehouse
- [ ] Complete: Mark items as moved to destination
- [ ] Cancel: Cancels pending movement, releases reserved qty
- [ ] Track: Movement status visible to warehouse team

### Error States
- [ ] Same location: "Source and destination must differ"
- [ ] Insufficient qty: "Not enough available at source location"
- [ ] Location not found: "Location does not exist"
- [ ] Invalid location path: "Invalid source/destination combination"

---

## 📋 Warehouse Reports

### Buttons
- [ ] Generate report: Creates report with selected filters
- [ ] Export PDF: Downloads report as PDF
- [ ] Export CSV: Downloads report as CSV
- [ ] Print: Opens print dialog
- [ ] Filter: Opens filter panel

### Forms
- [ ] Report type: Dropdown (Inventory, Movements, Receipts, Low Stock, Audit)
- [ ] Date range: From/To date pickers
- [ ] Warehouse: Single-select dropdown
- [ ] Product type: Multi-select filter
- [ ] Status: Multi-select filter

### Modals
- [ ] Filter modal: Select report filters
- [ ] Export options modal: Choose format (PDF, CSV, Print)

### Tables
- [ ] Report data: Formatted table with report-specific columns
- [ ] Summary: Aggregated metrics at top/bottom

### Workflows
- [ ] Select report type: Choose from available reports
- [ ] Apply filters: Set date range, warehouse, status, etc.
- [ ] Generate: Creates report with filtered data
- [ ] View: Displays report in table format
- [ ] Export: Downloads in selected format
- [ ] Print: Opens browser print dialog

### Error States
- [ ] No data: "No data matches selected filters"
- [ ] Invalid date range: "End date must be after start date"
- [ ] API error: "Failed to generate report" with Retry

---

## 📋 Accessibility & Permissions

### Buttons - Permission Variations
- [ ] Create/Edit: Visible to warehouse manager, supervisor, admin
- [ ] Delete: Visible to admin only
- [ ] Approve: Visible to approver roles
- [ ] Move stock: Visible to warehouse operator, supervisor

### Forms - Permission Variations
- [ ] Warehouse selector: Filtered based on user's warehouse access
- [ ] Quantity fields: Read-only if user lacks edit permission
- [ ] Delete/Archive: Hidden if user lacks permission

### Workflows - Permission Variations
- [ ] Create receipt: Requires warehouse manager role
- [ ] Approve movement: Requires supervisor/manager role
- [ ] Create PO: Requires purchase/planning role
- [ ] View reports: Filtered by user's data access

### Error States - Permission Variations
- [ ] Unauthorized: "You don't have permission for this action"
- [ ] Warehouse access: "You don't have access to this warehouse"

---

## ✅ Testing Checklist Summary

- [ ] Warehouse dashboard loads correctly
- [ ] Warehouse selector switches context
- [ ] Inventory list displays all items
- [ ] Search and filters work correctly
- [ ] Stock add/move/adjust operations work
- [ ] Goods receipt process works end-to-end
- [ ] Location hierarchy functions correctly
- [ ] QR code generation and display work
- [ ] Stock movement workflow works
- [ ] Low stock alerts trigger correctly
- [ ] Reports generate with correct data
- [ ] Export/Print functions work
- [ ] Permission checks prevent unauthorized access
- [ ] Error states display helpful messages
- [ ] API errors handled gracefully
- [ ] Empty states show when no data
- [ ] Pagination works with correct page counts

---

**Generated**: 2026-02-08  
**Version**: 1.0 (Unified Format)
