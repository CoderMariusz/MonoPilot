# Planning Module Test Plan

**Module**: Planning (`/planning`)  
**Last Updated**: 2026-02-08  
**Coverage**: Work orders, Purchase orders, Transfer orders, all CRUD operations

---

## 📑 Table of Contents

1. [Planning Dashboard](#planning-dashboard)
2. [Work Orders Module](#work-orders-module)
3. [Purchase Orders Module](#purchase-orders-module)
4. [Transfer Orders Module](#transfer-orders-module)
5. [Buttons](#buttons)
6. [Forms](#forms)
7. [Modals & Dialogs](#modals--dialogs)
8. [Tables](#tables)
9. [Workflows](#workflows)
10. [Error States](#error-states)

---

## Planning Dashboard

### Route: `/planning`

#### Buttons

- [ ] Create PO button: Opens purchase order form modal
- [ ] Create TO button: Opens transfer order form modal
- [ ] Create WO button: Opens work order form modal
- [ ] KPI Cards: Click navigates to filtered list view
- [ ] Alert Links: Click navigates to entity detail page
- [ ] Retry button: Refetches KPIs/alerts/activities on error

#### KPI Cards

- [ ] PO Pending Approval: Shows count, click filters by pending approval status
- [ ] PO This Month: Shows count, click filters by created_this_month=true
- [ ] TO In Transit: Shows count, click filters by status=in_transit
- [ ] WO Scheduled Today: Shows count, click filters by scheduled_date=today
- [ ] WO Overdue: Shows count, click filters by overdue=true
- [ ] Open Orders: Shows count, click filters by status=open

#### Activity Feed

- [ ] Load activities: Displays recent activity feed
- [ ] Activity items: Clickable links to entity detail pages
- [ ] Refresh: Auto-updates every 30 seconds
- [ ] Empty state: "No recent activity" shown when empty

#### Error States

- [ ] Loading state: Skeleton loaders for KPI cards
- [ ] Error state: Error card with Retry button
- [ ] Empty state: Zero state message "Get started by creating..."
- [ ] API timeout: Toast with retry option

---

## Work Orders Module

### Route: `/planning/work-orders`

#### Buttons

- [ ] Create Work Order button: Opens form modal
- [ ] Table/Gantt toggle: Switches view mode (Gantt placeholder/disabled)
- [ ] Apply Filters button: Applies selected filters to list
- [ ] Clear Filters button: Resets all filters to default

#### Forms

- [ ] Search input: Text field, debounced 300ms, searches WO number/product name
- [ ] Status filter: Multi-select checkboxes (Draft, Planned, Released, In Progress, On Hold, Completed, Cancelled)
- [ ] Product filter: Single-select dropdown with product list
- [ ] Line filter: Single-select dropdown for production lines
- [ ] Priority filter: Single-select dropdown (Low, Medium, High, Critical)
- [ ] Date range filters: From date and To date pickers

#### Tables

- [ ] Work Orders table: Columns—WO Number, Product, Qty, Priority, Status, Scheduled Date, Line, Actions
- [ ] Bulk selection checkboxes: Multi-select rows
- [ ] Pagination: Navigate between pages, adjust page size
- [ ] Row click action: Navigate to WO detail page
- [ ] Bulk action buttons: Print, Export, Approve, etc. (when rows selected)

#### Workflows

- [ ] Load WOs: Fetches list with applied filters
- [ ] Filter WOs: Apply filters → URL params update → Results update → Page resets to 1
- [ ] Search WOs: Debounced search filters by WO number or product name
- [ ] Create WO: Click "Create WO" → Form modal opens → Fill form → Submit → List refreshes
- [ ] Edit WO: Click pencil icon → Form modal opens with pre-filled data → Edit → Save → List refreshes
- [ ] Bulk select: Check boxes to select multiple rows
- [ ] Bulk actions: Available when rows selected (print, export, approve, etc.)
- [ ] Pagination: Navigate between pages, change page size

#### Error States

- [ ] Empty list: "No work orders found" message with Create button
- [ ] Validation error: Toast with field-specific error message
- [ ] API error: Toast with error message and Retry button
- [ ] Network error: Toast with retry option
- [ ] Permission denied: Buttons disabled or hidden for unauthorized users

---

### Route: `/planning/work-orders/[id]`

#### Buttons

- [ ] Back button: Returns to work orders list
- [ ] Edit button: Opens edit modal with current WO data
- [ ] Cancel WO button: Shows confirmation dialog before cancellation
- [ ] Approve button: Changes status to approved
- [ ] Release button: Changes status to released
- [ ] Print button: Opens print dialog
- [ ] Export button: Downloads WO as PDF

#### Forms

- [ ] Work Order Number: Text input, read-only display
- [ ] Product: Dropdown, required, links to product master
- [ ] Planned Quantity: Number input, required, must be positive
- [ ] Unit of Measure: Dropdown, required
- [ ] Production Line: Dropdown, required
- [ ] Scheduled Start Date: Date picker, required
- [ ] Scheduled End Date: Date picker, required, must be after start date
- [ ] Priority: Dropdown (Low, Medium, High, Critical)
- [ ] Notes: Textarea, optional, max 1000 characters

#### Modals & Dialogs

- [ ] Edit Work Order modal: Opens with form above
- [ ] Cancel confirmation dialog: Confirms WO cancellation before executing

#### Tables

- [ ] Related Operations table: Columns—Sequence #, Operation, Status, Duration
- [ ] Related Materials table: Columns—Material, Required Qty, Consumed Qty, Status
- [ ] Activity history table: Columns—Date, User, Action, Details

#### Workflows

- [ ] Load WO detail: Fetches WO with related operations, materials, history
- [ ] Edit WO: Open modal → Modify fields → Submit → Refresh detail page
- [ ] Change status: Click Approve/Release → Status transitions
- [ ] Cancel WO: Click Cancel → Confirm dialog → WO cancelled → Return to list
- [ ] View operations: Related operations displayed in table
- [ ] View materials: Related materials with consumption tracking displayed
- [ ] View history: Activity timeline shown

#### Error States

- [ ] Not found: "Work order not found" message
- [ ] Cannot edit: "Work order is locked (in progress or completed)"
- [ ] Validation error: Field-specific error messages displayed
- [ ] API error: Toast with error message and retry option
- [ ] Unauthorized: Buttons hidden or disabled if user lacks permissions

---

## Purchase Orders Module

### Route: `/planning/purchase-orders`

#### Buttons

- [ ] Create Purchase Order button: Opens form modal
- [ ] Apply Filters button: Applies selected filters
- [ ] Clear Filters button: Resets all filters
- [ ] Bulk action buttons: Approve, Reject, Print, Export (when rows selected)

#### Forms

- [ ] Search input: Text field, searches PO number, vendor name, SKU
- [ ] Vendor filter: Single-select dropdown
- [ ] Status filter: Multi-select checkboxes (Draft, Pending Approval, Approved, In Transit, Delivered, Cancelled)
- [ ] Approval status filter: Multi-select (Pending, Approved, Rejected)
- [ ] Date range filters: From date and To date pickers

#### Tables

- [ ] Purchase Orders table: Columns—PO Number, Vendor, Total, Status, Approval Status, Created Date, Actions
- [ ] Bulk selection checkboxes: Multi-select rows
- [ ] Pagination: Navigate between pages, adjust page size
- [ ] Row click: Navigate to PO detail page

#### Workflows

- [ ] Load POs: Fetches list with applied filters
- [ ] Filter POs: Apply/clear filters → Results update → Page resets to 1
- [ ] Search POs: Debounced search by PO number, vendor, or SKU
- [ ] Create PO: Click "Create PO" → Form modal opens → Add line items → Submit → List refreshes
- [ ] Edit PO: Click pencil → Form opens with current data → Update items → Save → List refreshes
- [ ] Approve PO: Click approve icon → Confirmation shown → Submit → Status updates
- [ ] Reject PO: Click reject → Reason modal opens → Enter reason → Submit → Status updates
- [ ] Bulk actions: Approve/reject multiple POs

#### Error States

- [ ] Empty list: "No purchase orders found" message
- [ ] Validation error: Toast or field-level error message
- [ ] API error: Toast with error message and Retry button
- [ ] Duplicate SKU: "SKU already added" warning displayed
- [ ] Vendor required: "Please select a vendor" error message
- [ ] No line items: "At least one line item required" error message

---

### Route: `/planning/purchase-orders/[id]`

#### Buttons

- [ ] Back button: Returns to PO list
- [ ] Edit button: Opens edit modal
- [ ] Approve button: Submits approval
- [ ] Reject button: Shows reason modal
- [ ] Receive button: Opens goods receipt modal
- [ ] Cancel button: Shows confirmation dialog
- [ ] Print button: Opens print dialog
- [ ] Export button: Downloads as PDF

#### Forms

- [ ] PO Number: Text input, read-only
- [ ] Vendor: Dropdown, required
- [ ] Delivery Date: Date picker, required
- [ ] Line Items table: SKU, Description, Qty, Unit Price, Total
- [ ] Add Line Item button: Adds new row to line items
- [ ] Notes: Textarea, optional

#### Modals & Dialogs

- [ ] Edit PO modal: Update vendor, delivery date, line items
- [ ] Reject reason modal: Collect rejection reason/comments
- [ ] Goods Receipt modal: Record received quantities
- [ ] Cancel confirmation dialog: Confirms PO cancellation

#### Tables

- [ ] Line Items table: Columns—SKU, Description, Qty, Unit Price, Extended Price, Received, Status
- [ ] Receipts history table: Columns—Date, Qty Received, User, Notes
- [ ] Approvals history table: Columns—Date, User, Action (Approved/Rejected), Comments

#### Workflows

- [ ] Load PO detail: Fetches PO with line items, approvals, receipts
- [ ] Edit PO: Open modal → Update items/vendor → Save → Refresh
- [ ] Approve PO: Show confirmation → Submit approval → Status updates
- [ ] Reject PO: Open reason modal → Enter reason → Submit → Status updates
- [ ] Receive goods: Open receipt modal → Record quantities → Submit
- [ ] Cancel PO: Show confirmation → Cancel → Return to list
- [ ] View approvals: Shows approval chain with comments

#### Error States

- [ ] Cannot edit: "PO is approved and cannot be edited"
- [ ] Qty exceeded: "Received qty cannot exceed ordered qty"
- [ ] Approval required: "PO must be approved before receiving"
- [ ] Duplicate line: "SKU already in PO"
- [ ] Empty items list: Item list required validation error

---

## Transfer Orders Module

### Route: `/planning/transfer-orders`

#### Buttons

- [ ] Create Transfer Order button: Opens form modal
- [ ] Apply Filters button: Applies selected filters
- [ ] Clear Filters button: Resets all filters
- [ ] Bulk actions: Print, Export, Cancel (when rows selected)

#### Forms

- [ ] Search input: Text field, searches TO number, SKU, source/dest warehouse
- [ ] Source Warehouse filter: Single-select dropdown
- [ ] Destination Warehouse filter: Single-select dropdown
- [ ] Status filter: Multi-select checkboxes (Draft, In Transit, Delivered, Cancelled)
- [ ] Date range filters: From date and To date pickers

#### Tables

- [ ] Transfer Orders table: Columns—TO Number, Source Warehouse, Dest Warehouse, Total Qty, Status, Created Date, Actions
- [ ] Bulk selection checkboxes: Multi-select rows
- [ ] Pagination: Navigate between pages, adjust page size
- [ ] Row click: Navigate to TO detail page

#### Workflows

- [ ] Load TOs: Fetches list with applied filters
- [ ] Filter TOs: Apply/clear filters → Results update → Page resets to 1
- [ ] Search TOs: Debounced search by TO number, SKU, or warehouse
- [ ] Create TO: Click "Create TO" → Form modal opens → Select warehouses → Add items → Submit → List refreshes
- [ ] Edit TO: Click pencil → Form opens with current data → Update items → Save → Refresh
- [ ] Cancel TO: Click cancel button → Confirmation shown → Submit → Status updates
- [ ] Bulk actions: Cancel multiple TOs

#### Error States

- [ ] Empty list: "No transfer orders found" message
- [ ] Same warehouse: "Source and destination must be different" error
- [ ] No items: "At least one item required" error
- [ ] Duplicate item: "Item already added" warning
- [ ] API error: Toast with error message and Retry button

---

### Route: `/planning/transfer-orders/[id]`

#### Buttons

- [ ] Back button: Returns to TO list
- [ ] Edit button: Opens edit modal
- [ ] Ship button: Changes status to in transit
- [ ] Receive button: Opens goods receipt modal
- [ ] Cancel button: Shows confirmation dialog
- [ ] Print button: Opens print dialog
- [ ] Export button: Downloads as PDF

#### Forms

- [ ] TO Number: Text input, read-only
- [ ] Source Warehouse: Dropdown, required
- [ ] Destination Warehouse: Dropdown, required
- [ ] Line Items: SKU, Qty, Source Location, Dest Location
- [ ] Add Line button: Adds new item row
- [ ] Notes: Textarea, optional

#### Modals & Dialogs

- [ ] Edit TO modal: Update warehouses and line items
- [ ] Ship confirmation dialog: Confirms transition to in transit
- [ ] Goods Receipt modal: Records received quantities
- [ ] Cancel confirmation dialog: Confirms cancellation

#### Tables

- [ ] Line Items table: Columns—SKU, Qty, Source Loc, Dest Loc, Shipped, Received, Status
- [ ] Shipments history table: Columns—Date, Qty Shipped, User
- [ ] Receipts history table: Columns—Date, Qty Received, User, Notes

#### Workflows

- [ ] Load TO detail: Fetches TO with items, shipments, receipts
- [ ] Edit TO: Open modal → Update items/warehouses → Save → Refresh
- [ ] Ship TO: Click Ship → Confirmation shown → Submit → Status updates to in transit
- [ ] Receive TO: Open receipt modal → Record quantities → Submit
- [ ] Cancel TO: Show confirmation → Cancel → Return to list

#### Error States

- [ ] Different warehouse required: "Source and destination must differ"
- [ ] Cannot edit: "TO is in transit, cannot edit"
- [ ] Qty mismatch: "Received qty exceeds shipped qty"
- [ ] No items: Item list required error

---

## Buttons

### Primary Action Buttons

- [ ] Create PO button: Opens form modal, blue style
- [ ] Create TO button: Opens form modal, blue style
- [ ] Create WO button: Opens form modal, blue style

### Secondary Buttons

- [ ] Edit button: Pencil icon, opens edit modal
- [ ] Approve button: CheckCircle icon, submits approval
- [ ] Reject button: X icon, opens reason modal
- [ ] Release button: Transitions WO status
- [ ] Ship button: Marks TO as in transit

### Destructive Buttons

- [ ] Cancel button: Red style, shows confirmation before executing
- [ ] Delete line item button: Trash icon, removes item from form

### Filter Buttons

- [ ] Apply Filters button: Applies selected filter values
- [ ] Clear Filters button: Resets all filters to default
- [ ] Search button: Submits search query (or automatic debounce)

### Bulk Action Buttons

- [ ] Bulk Approve: Available when multiple rows selected
- [ ] Bulk Reject: Available when multiple rows selected
- [ ] Bulk Print: Available when rows selected
- [ ] Bulk Export: Available when rows selected
- [ ] Bulk Cancel: Available when rows selected

### Utility Buttons

- [ ] Print button: Opens print dialog
- [ ] Export button: Downloads as PDF
- [ ] Retry button: Refetches data on error
- [ ] Back button: Returns to list page

---

## Forms

### Work Order Form

- [ ] Product dropdown: Required, links to product master
- [ ] Planned Quantity number input: Required, positive value, auto-calculates
- [ ] Unit of Measure dropdown: Required field
- [ ] Production Line dropdown: Required, selects production line
- [ ] Scheduled Start Date picker: Required, past dates disabled
- [ ] Scheduled End Date picker: Required, must be ≥ start date
- [ ] Priority dropdown: Options (Low, Medium, High, Critical)
- [ ] Notes textarea: Optional, max 1000 characters
- [ ] WO Number display: Auto-generated, read-only

### Purchase Order Form

- [ ] PO Number display: Auto-generated, read-only
- [ ] Vendor dropdown: Required, filters available vendors
- [ ] Delivery Date picker: Required, future dates only
- [ ] Line Items section: Add/remove items, inline editing
  - [ ] SKU search/dropdown: Required
  - [ ] Description: Auto-populated from product
  - [ ] Quantity input: Required, positive
  - [ ] Unit Price input: Required, positive
  - [ ] Extended Price: Auto-calculated (Qty × Price)
- [ ] Subtotal display: Auto-calculated sum
- [ ] Notes textarea: Optional

### Transfer Order Form

- [ ] TO Number display: Auto-generated, read-only
- [ ] Source Warehouse dropdown: Required
- [ ] Destination Warehouse dropdown: Required, must differ from source
- [ ] Line Items section: Add/remove items
  - [ ] SKU dropdown: Required
  - [ ] Quantity input: Required, positive
  - [ ] Source Location dropdown: Required
  - [ ] Destination Location dropdown: Required
- [ ] Notes textarea: Optional

### Filter Forms

- [ ] Multi-select checkboxes: Status, approval status
- [ ] Single-select dropdowns: Product, vendor, warehouse, line
- [ ] Date range pickers: From/To dates
- [ ] Search input field: Debounced 300ms

### Validation

- [ ] Required fields: Highlighted in red, error messages shown
- [ ] Date validation: End date ≥ start date, past dates disabled
- [ ] Positive numbers: Quantity, price, dimensions must be > 0
- [ ] Duplicate checking: SKU, item already added warnings
- [ ] Async validation: Vendor/product/warehouse availability checked

---

## Modals & Dialogs

### Work Order Form Modal

- [ ] Type: Dialog modal
- [ ] Fields: WO Number, Product, Qty, UOM, Line, Dates, Priority, Notes
- [ ] Validation: All required fields checked before submit
- [ ] Buttons: Cancel (outline), Save (blue primary)
- [ ] API: POST/PUT `/api/planning/work-orders`
- [ ] Success: Modal closes, list refreshes, toast confirmation
- [ ] Error: Modal stays open, error message displayed

### Purchase Order Form Modal

- [ ] Type: Dialog modal
- [ ] Fields: PO Number, Vendor, Delivery Date, Line Items
- [ ] Line Items: Nested form with add/remove capabilities
- [ ] Validation: Vendor required, delivery date required, positive prices
- [ ] Buttons: Cancel, Save
- [ ] API: POST/PUT `/api/planning/purchase-orders`
- [ ] Line management: Add button creates new row, delete removes

### Transfer Order Form Modal

- [ ] Type: Dialog modal
- [ ] Fields: TO Number, Source/Dest Warehouses, Items
- [ ] Items section: Add/remove buttons, source/dest location selection
- [ ] Validation: Different warehouses, positive quantities
- [ ] Buttons: Cancel, Save
- [ ] API: POST/PUT `/api/planning/transfer-orders`

### Approval Modals

- [ ] Approve PO dialog: Confirmation + optional comments field
- [ ] Reject PO dialog: Reason required, comments optional
- [ ] Cancel WO/PO/TO dialog: Confirmation before destructive action
- [ ] Ship TO dialog: Confirmation transition to in transit status

### Edit Modals

- [ ] Edit WO modal: Pre-filled with current WO data
- [ ] Edit PO modal: Pre-filled with vendor, delivery date, line items
- [ ] Edit TO modal: Pre-filled with warehouses and items

### Confirmation Dialogs

- [ ] Cancel WO dialog: "Are you sure you want to cancel this WO?"
- [ ] Cancel PO dialog: "Are you sure you want to cancel this PO?"
- [ ] Cancel TO dialog: "Are you sure you want to cancel this TO?"
- [ ] Delete line item: Confirmation before removing from form

---

## Tables

### Work Orders List Table

- [ ] Columns: WO Number, Product, Qty, Priority, Status, Scheduled Date, Production Line, Actions
- [ ] Sorting: Click headers to sort (WO #, product, qty, date)
- [ ] Filtering: Applied via filter panel above table
- [ ] Pagination: 25 per page, navigate between pages
- [ ] Row selection: Checkbox column, multi-select capability
- [ ] Row click: Navigate to WO detail page
- [ ] Status badge: Color-coded (Draft, Planned, Released, In Progress, Completed, Cancelled)
- [ ] Priority badge: Color-coded (Low, Medium, High, Critical)
- [ ] Actions column: Edit (pencil), Delete (trash), Menu (3-dots)

### Purchase Orders List Table

- [ ] Columns: PO Number, Vendor, Total, Status, Approval Status, Created Date, Actions
- [ ] Sorting: Click headers to sort by each column
- [ ] Filtering: Applied via filter panel
- [ ] Pagination: 25 per page
- [ ] Row selection: Checkbox column, bulk action buttons available
- [ ] Row click: Navigate to PO detail
- [ ] Status badge: Color-coded (Draft, Pending, Approved, In Transit, Delivered, Cancelled)
- [ ] Approval status badge: Color-coded (Pending, Approved, Rejected)

### Transfer Orders List Table

- [ ] Columns: TO Number, Source Warehouse, Dest Warehouse, Total Qty, Status, Created Date, Actions
- [ ] Sorting: Click headers
- [ ] Filtering: Applied via filter panel
- [ ] Pagination: 25 per page
- [ ] Row selection: Checkbox column
- [ ] Row click: Navigate to TO detail
- [ ] Status badge: Color-coded (Draft, In Transit, Delivered, Cancelled)

### Related Data Tables (Detail Pages)

- [ ] Operations table: Sequence #, Operation, Status, Duration
- [ ] Materials table: Material, Required Qty, Consumed Qty, Status
- [ ] Line Items table: SKU, Description, Qty, Unit Price, Extended Price
- [ ] History tables: Date, User, Action, Details
- [ ] Approvals history: Date, User, Action, Comments
- [ ] Receipts history: Date, Qty, User, Notes

---

## Workflows

### Create Work Order Workflow

- [ ] Step 1: Click "Create WO" button on dashboard
- [ ] Step 2: Work Order form modal opens
- [ ] Step 3: Fill required fields (Product, Qty, UOM, Line, Dates, Priority)
- [ ] Step 4: Optionally add notes
- [ ] Step 5: Click "Save" button
- [ ] Step 6: Validate all required fields
- [ ] Step 7: Submit via POST `/api/planning/work-orders`
- [ ] Step 8: Modal closes on success
- [ ] Step 9: Navigate to WO detail page or refresh list
- [ ] Step 10: Toast success message displayed

### Create Purchase Order Workflow

- [ ] Step 1: Click "Create PO" button
- [ ] Step 2: PO form modal opens
- [ ] Step 3: Select vendor (required)
- [ ] Step 4: Set delivery date (required)
- [ ] Step 5: Click "Add Line" to add line items
- [ ] Step 6: For each line: Select SKU, enter qty, unit price auto-populates
- [ ] Step 7: Delete any unwanted lines
- [ ] Step 8: Optionally add notes
- [ ] Step 9: Click "Save" button
- [ ] Step 10: Validate (vendor, date, at least 1 line item)
- [ ] Step 11: Submit via POST `/api/planning/purchase-orders`
- [ ] Step 12: Modal closes, list refreshes, success toast shown

### Create Transfer Order Workflow

- [ ] Step 1: Click "Create TO" button
- [ ] Step 2: TO form modal opens
- [ ] Step 3: Select source warehouse (required)
- [ ] Step 4: Select destination warehouse (must differ from source)
- [ ] Step 5: Click "Add Item" to add transfer items
- [ ] Step 6: For each item: Select SKU, qty, source location, dest location
- [ ] Step 7: Delete unwanted items
- [ ] Step 8: Optionally add notes
- [ ] Step 9: Click "Save" button
- [ ] Step 10: Validate (different warehouses, at least 1 item, positive qty)
- [ ] Step 11: Submit via POST `/api/planning/transfer-orders`
- [ ] Step 12: Modal closes, list refreshes

### Approve Purchase Order Workflow

- [ ] Step 1: Navigate to PO list
- [ ] Step 2: Click row to open PO detail
- [ ] Step 3: Click "Approve" button
- [ ] Step 4: Confirmation dialog opens
- [ ] Step 5: Optionally add approval comments
- [ ] Step 6: Click "Approve" to confirm
- [ ] Step 7: Submit approval via API
- [ ] Step 8: PO status changes to "Approved"
- [ ] Step 9: Approval record added to history
- [ ] Step 10: Success toast displayed

### Reject Purchase Order Workflow

- [ ] Step 1: Navigate to PO detail
- [ ] Step 2: Click "Reject" button
- [ ] Step 3: Rejection reason modal opens
- [ ] Step 4: Enter rejection reason (required)
- [ ] Step 5: Optionally add additional comments
- [ ] Step 6: Click "Reject" to confirm
- [ ] Step 7: Submit rejection via API
- [ ] Step 8: PO status changes to "Rejected"
- [ ] Step 9: Rejection record added to history
- [ ] Step 10: Success message displayed

### Receive Goods Workflow

- [ ] Step 1: Navigate to PO/TO detail
- [ ] Step 2: Click "Receive" button
- [ ] Step 3: Goods receipt modal opens
- [ ] Step 4: For each line item, enter received quantity
- [ ] Step 5: Optionally add receipt notes
- [ ] Step 6: Click "Receive" to confirm
- [ ] Step 7: Submit receipt via API
- [ ] Step 8: Line items update with received quantities
- [ ] Step 9: Receipt record added to history
- [ ] Step 10: Success message displayed

### Cancel Order Workflow

- [ ] Step 1: Navigate to WO/PO/TO detail
- [ ] Step 2: Click "Cancel" button
- [ ] Step 3: Confirmation dialog opens
- [ ] Step 4: Click "Cancel" to confirm
- [ ] Step 5: Submit cancellation via API
- [ ] Step 6: Order status changes to "Cancelled"
- [ ] Step 7: Return to list view
- [ ] Step 8: Cancelled order still visible in list (read-only)

### Filter & Search Workflow

- [ ] Step 1: Navigate to WO/PO/TO list
- [ ] Step 2: Enter search term in search input
- [ ] Step 3: Search executes with 300ms debounce
- [ ] Step 4: Results filter by search term
- [ ] Step 5: Use filter panel to apply additional filters
- [ ] Step 6: Click "Apply Filters" to execute
- [ ] Step 7: Results update with all filters applied
- [ ] Step 8: Page resets to page 1
- [ ] Step 9: Click "Clear Filters" to reset all
- [ ] Step 10: Full list displayed again

---

## Error States

### Loading States

- [ ] Dashboard KPI cards: Skeleton loaders displayed
- [ ] List page table: Skeleton rows for each item
- [ ] Detail page: Skeleton for all sections
- [ ] Form submit: Spinner shown on Save button

### API Error States

- [ ] 400 Bad Request: Validation error message displayed
- [ ] 401 Unauthorized: User redirected to login
- [ ] 403 Forbidden: "You don't have permission for this action"
- [ ] 404 Not Found: "Order not found" message
- [ ] 500 Server Error: "Server error occurred" with retry option
- [ ] Network error: "Network connection failed" with retry

### Validation Error States

- [ ] Required field missing: Red border, error message below field
- [ ] Invalid date: "End date must be after start date"
- [ ] Duplicate SKU: "SKU already added to line items"
- [ ] Same warehouse: "Source and destination warehouses must be different"
- [ ] No items: "At least one line item required"
- [ ] Negative quantity: "Quantity must be greater than 0"

### Empty States

- [ ] No WOs found: "No work orders found" with Create button
- [ ] No POs found: "No purchase orders found" with Create button
- [ ] No TOs found: "No transfer orders found" with Create button
- [ ] No line items: "No items added yet" with Add button
- [ ] No activities: "No recent activities"

### Permission Error States

- [ ] Cannot edit: "Order is locked and cannot be edited"
- [ ] Cannot approve: "You lack approval authority for this action"
- [ ] Cannot receive: "You don't have warehouse permission for this action"
- [ ] Hidden buttons: Edit, Approve, Receive buttons hidden if no permission

### Business Logic Errors

- [ ] Qty exceeded: "Received quantity cannot exceed ordered quantity"
- [ ] Already received: "This order has already been received"
- [ ] Invalid transition: "Cannot transition from this status to requested status"
- [ ] Missing dependencies: "PO must be approved before receiving goods"

---

## Accessibility

### Keyboard Navigation

- [ ] Tab through all form fields and buttons
- [ ] Enter submits forms and dialogs
- [ ] Escape closes modals and dropdowns
- [ ] Arrow keys navigate dropdown options
- [ ] Space toggles checkboxes and radio buttons
- [ ] Focus visible on all interactive elements

### Screen Reader Support

- [ ] Table headers announced correctly
- [ ] Form labels associated with inputs
- [ ] Error messages announced
- [ ] Status badges have semantic meaning
- [ ] Modal dialogs announced as dialogs
- [ ] Loading states announced
- [ ] Button purposes clear from label or aria-label

### Color Contrast

- [ ] Text meets WCAG AA standards (4.5:1 for normal text)
- [ ] Status badges readable (color + icon/text)
- [ ] Focus indicators visible
- [ ] Error highlighting clear

---

## Permission-Based Variations

### Work Order Permissions

- [ ] Create: Planner, Supervisor, Admin roles
- [ ] Edit: Owner or Admin only
- [ ] Approve: Supervisor, Manager, Admin
- [ ] Cancel: Owner or Admin
- [ ] View: All authenticated users

### Purchase Order Permissions

- [ ] Create: Planner, Procurement, Admin
- [ ] Edit: Owner or Admin (draft only)
- [ ] Approve: Approver role only
- [ ] Reject: Approver role only
- [ ] Receive: Warehouse Manager, Admin
- [ ] View: All authenticated users

### Transfer Order Permissions

- [ ] Create: Warehouse, Planner, Admin
- [ ] Edit: Owner or Admin (draft only)
- [ ] Ship: Warehouse, Admin
- [ ] Receive: Warehouse, Admin
- [ ] View: All authenticated users

---

**Test Coverage**: 100% of Planning module interactive elements  
**Last Updated**: 2026-02-08
