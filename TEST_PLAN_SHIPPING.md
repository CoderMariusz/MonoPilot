# Shipping Module Test Plan

**Module**: Shipping (`/shipping`)  
**Last Updated**: 2026-02-08  
**Coverage**: All clickable elements, forms, modals, tables, CRUD operations

---

## 📑 Table of Contents

1. [Customers CRUD](#customers-crud)
2. [Sales Orders CRUD](#sales-orders-crud)
3. [Shipments Module](#shipments-module)
4. [Packing Module](#packing-module)
5. [RMA Module](#rma-module)
6. [Buttons](#buttons)
7. [Forms](#forms)
8. [Modals & Dialogs](#modals--dialogs)
9. [Tables](#tables)
10. [Workflows](#workflows)
11. [Error States](#error-states)

---

## Customers CRUD

### Route: `/shipping/customers`

#### Buttons

- [ ] Create Customer button: Opens CustomerModal in create mode
- [ ] Retry button: Refetch customers on error (visible only in error state)
- [ ] Row Click: Navigate to detail or open CustomerModal in edit mode
- [ ] Delete Icon: Trash button per row, opens DeleteConfirmDialog
- [ ] Search Button: Submit search form with entered term
- [ ] Clear Search Icon: Clears search input and resets results

#### Forms

- [ ] Search Input: Text field, filters by name/customer code, synced to URL param
- [ ] Category Filter: Select dropdown with options (all, retail, wholesale, distributor)
- [ ] Status Filter: Select dropdown with options (all, active, inactive)

#### Modals & Dialogs

- [ ] CustomerModal: Create/Edit mode, fields (Name, Email, Phone, Website, Category, Contact Person, Notes, Allergen Restrictions, Shipping Addresses)
- [ ] Shipping Addresses Sub-section: Add Address button, address rows with delete per row
- [ ] Delete Confirmation Dialog: Title "Delete Customer?", warning about permanent deletion, Cancel/Delete buttons

#### Tables

- [ ] Customer DataTable: Columns—Name, Email, Category, Status, Address Count, Actions
- [ ] Column Sorting: Click headers to sort by each column (sort_by, sort_order)
- [ ] Pagination: 25 items per page, page navigation buttons
- [ ] Row Actions: Click row to edit, trash icon to delete

#### Workflows

- [ ] Create Customer: Click Create → Fill form (Name, Email, Category required) → Add addresses → Click Save → Add to list
- [ ] Edit Customer: Click row → Modal opens with pre-filled data → Modify fields → Save → Update list
- [ ] Delete Customer: Click trash → Confirm in dialog → Remove from list and redirect
- [ ] Filter & Search: Enter search term or select filter → Results update → Pagination resets

#### Error States

- [ ] Loading State: Skeleton loaders for table rows
- [ ] Error State: Error alert with retry button, offline/failed status
- [ ] Empty State: "No customers found" message with Create button
- [ ] Validation Error: Form fields show error messages on invalid input

---

## Sales Orders CRUD

### Route: `/shipping/sales-orders`

#### Buttons

- [ ] Create Sales Order button: Opens SOModal in create mode
- [ ] Row Click: Navigate to detail view
- [ ] Edit Icon: Pencil button, navigates to edit page
- [ ] Delete Icon: Trash button, opens DeleteConfirmDialog
- [ ] Confirm Icon: Lock button, opens ConfirmConfirmDialog
- [ ] Add Line Button: Plus button in SOLineForm, adds new order line
- [ ] Delete Line Button: Trash icon per line in SOLineTable, removes line
- [ ] Edit Line Button: Pencil icon, opens edit form for line

#### Forms

- [ ] Customer Select: Dropdown from available customers, required
- [ ] Ship To Address: Radio buttons showing customer's shipping addresses
- [ ] Product Select: Combobox/dropdown for products in line form
- [ ] Quantity Input: Number field > 0, required, shows warning if over-allocated
- [ ] Unit Price: Auto-populated from product, editable, required
- [ ] Discount Type: Select dropdown (none, percent, fixed)
- [ ] Discount Value: Number input (0-100 for %, 0-infinite for fixed)
- [ ] Notes: Textarea per line or order

#### Modals & Dialogs

- [ ] SOModal: Create mode with customer, address, line items, order summary sections
- [ ] SOLineForm: Nested form for adding/editing order lines
- [ ] SOLineTable: Display existing lines with edit/delete actions
- [ ] Delete Confirmation Dialog: Title "Delete Sales Order?", warning, Cancel/Delete
- [ ] Confirm Confirmation Dialog: Title "Confirm Sales Order?", irreversibility warning, Cancel/Confirm

#### Tables

- [ ] Sales Orders Table: Columns—Order #, Customer, Status, Order Date, Total, Actions
- [ ] Column Sorting: Default sort by order_date desc, click headers to change
- [ ] Pagination: 25 items per page
- [ ] SOLineTable (nested): Columns—Product, Qty, Unit Price, Discount, Line Total, Actions

#### Workflows

- [ ] Create Sales Order: Click Create → Select customer → Select ship-to address → Add order lines (product, qty, price, discount) → Review summary → Click Save
- [ ] Edit Sales Order: Navigate to detail → Click Edit → Modify fields and lines → Save → Update display
- [ ] Delete Sales Order: Click trash → Confirm → Remove from list
- [ ] Confirm Order: Click lock icon → Confirm dialog → Order locked, cannot edit
- [ ] Add Line: Click "Add Line" → SOLineForm opens → Fill product, qty, price, discount → Click Add → Line appears in table

#### Validations

- [ ] Required Fields: Customer and address required, at least 1 line required
- [ ] Product Warning: Amber warning if product has no standard price
- [ ] Quantity Warning: Show available quantity if over-allocation detected
- [ ] Discount Validation: Percent cannot exceed 100%
- [ ] Line Total: Calculated real-time (Qty × Price - Discount)

#### Error States

- [ ] Loading State: Skeleton loaders for table and form
- [ ] Error State: Error alert with retry button
- [ ] Empty State: "No sales orders found" message
- [ ] Validation Error: Field-level error messages, form stays open

---

### Route: `/shipping/sales-orders/new`

#### Buttons

- [ ] Same as `/shipping/sales-orders` Create button workflow

#### Forms

- [ ] Same form fields as SOModal

#### Workflows

- [ ] Dedicated new order creation page with same workflow as modal

---

### Route: `/shipping/sales-orders/[id]`

#### Buttons

- [ ] Back Button: Navigate to sales orders list
- [ ] Edit Button: Navigate to edit page (if editable)
- [ ] Delete Button: Open delete confirmation (if deletable)
- [ ] Confirm Button: Lock the order

#### Forms

- [ ] All order and line details display (read-only in detail view)

#### Workflows

- [ ] View Detail: Load order → Display all fields → Show all order lines → Show totals

#### Error States

- [ ] Loading State: Skeleton loaders
- [ ] Error State: Alert with retry button

---

## Shipments Module

### Route: `/shipping/shipments`

#### Buttons

- [ ] Row Click: Navigate to `/shipping/shipments/[id]` detail view
- [ ] Manifest Button: Outline style, visible when status='packed', opens manifest workflow
- [ ] Ship Button: Destructive style, visible when status in [packed, manifested], opens ShipConfirmDialog
- [ ] Mark Delivered Button: Outline style, visible when status='shipped' AND user in [Manager, Admin], marks as delivered
- [ ] View Tracking Button: Outline style, visible when status in [shipped, delivered], opens TrackingDialog

#### Forms

- [ ] No direct form input on shipments list/detail (status-driven workflow)

#### Modals & Dialogs

- [ ] ShipConfirmDialog: AlertDialog with warning, shipment details card, irreversibility warnings, acknowledgment checkbox, Cancel/Ship buttons
- [ ] TrackingDialog: Displays carrier info, tracking number, external link, TrackingTimeline with steps (Packed, Manifested, Shipped, Delivered)

#### Tables

- [ ] ShipmentsTable: Columns—Shipment #, SO #, Customer, Status, Boxes, Weight
- [ ] Status Badge: Color-coded (pending:yellow, packing:blue, packed:green, manifested:purple, shipped:indigo, delivered:emerald, exception:red)
- [ ] PackListTable (within shipment detail): Columns—Box #, Weight, Dimensions, Items, SSCC, Actions
- [ ] PackListTable Row Expansion: Click chevron to expand → Sub-table shows contents (Product, LP Number, Lot Number, Quantity)

#### Workflows

- [ ] Ship Workflow: Click Ship button → ShipConfirmDialog opens → Verify shipment details → Check warning impacts → Acknowledge irreversibility → Click "Ship Shipment" → Status updates to shipped
- [ ] Mark Delivered: Click "Mark Delivered" → Status updates to delivered (no confirmation required)
- [ ] View Tracking: Click "View Tracking" → TrackingDialog opens → Shows carrier, tracking number, timeline
- [ ] Manifest Shipment: Click "Manifest" button → Shipment status updates to manifested

#### Error States

- [ ] Loading State: Spinner on action buttons during async operations
- [ ] Error State: Toast error notification for failed operations
- [ ] Loading Dialog: TrackingDialog shows skeleton for loading, error state with retry

---

### Route: `/shipping/shipments/[id]`

#### Buttons

- [ ] Back Button: Navigate to shipments list
- [ ] Manifest Button: Execute manifest action (if status='packed')
- [ ] Ship Button: Open ShipConfirmDialog (if status in [packed, manifested])
- [ ] Mark Delivered Button: Execute delivery (if status='shipped')
- [ ] View Tracking Button: Open TrackingDialog (if status in [shipped, delivered])
- [ ] Edit Box Button: Pencil icon per box in PackListTable, opens edit form (if editable)
- [ ] Delete Box Button: Trash icon per box, removes box (if editable)

#### Forms

- [ ] No direct edit forms (status-driven with modal confirmations)

#### Tables

- [ ] PackListTable: Box #, Weight, Dimensions, Items count, SSCC
- [ ] Expandable Rows: Click chevron to show contents sub-table
- [ ] Contents Sub-table: Product, LP Number, Lot Number, Quantity
- [ ] Row Actions: Edit and Delete buttons (conditional on status)

#### Workflows

- [ ] View Shipment Detail: Load shipment info → Display status and customer info → Show PackListTable → Ready for actions based on status
- [ ] Execute Shipment Actions: Click button → Confirmation dialog → Verify details → Acknowledge impacts → Execute → Status updates

#### Error States

- [ ] Loading State: Skeleton loaders for shipment info and pack list
- [ ] Error State: Alert with retry/back buttons
- [ ] No Boxes State: Message "No boxes in this shipment" with Add button (if editable)

---

## Packing Module

### Route: `/shipping/packing`

#### Buttons

- [ ] Add to Box Button: Disabled if no LP selected or no active box
- [ ] Add Box Button: Plus icon to create new box (disabled while adding)
- [ ] Complete Packing Button: Enabled if all boxes have weight AND all LPs packed, shows loading spinner
- [ ] Add to Box (in AddItemDialog): Enabled if quantity valid and item selected

#### Forms

- [ ] Weight Input: Number field (0-25 kg max), required for each box
- [ ] Dimensions Inputs: Length, Width, Height (10-200 cm each), required
- [ ] LP Search Input: Searchable "Search LP, product, lot..." with debounce
- [ ] Box Quantity Input: Number field in AddItemDialog, min 1, max available

#### Modals & Dialogs

- [ ] AllergenWarningDialog: AlertDialog with allergen conflict warning, conflicting allergen badges, Cancel/Continue buttons
- [ ] AddItemDialog: Alternative add workflow with box select, LP search, quantity input, validation errors

#### Tables

- [ ] LP Selector Cards (left column): LP Number, Quantity badge, Product name, Lot number, Location (clickable cards)
- [ ] Box Contents List (center column): LP number, Product, Lot + Qty info cards in each box
- [ ] No Items State: "No items in this box yet" message

#### Workflows

- [ ] 3-Column Packing Layout: Left (LP Selector) → Center (Box Builder) → Right (Packing Summary)
- [ ] Add LP to Box: Search LP in left panel → Click to select → Click "Add to Box" → Added to active box in center
- [ ] Create Box: Click "+ Add Box" → New box tab appears → Enter weight and dimensions → Show in box tabs
- [ ] Pack Workflow: Select LP → Add to box → Set weight/dimensions → Repeat for all LPs → Click "Complete Packing" when all conditions met
- [ ] Handle Allergen Warning: If product allergen conflicts with customer restrictions → AllergenWarningDialog opens → Click Continue to proceed

#### Packing Summary (Right Column)

- [ ] Shipment Details Card: Shipment #, Customer, Status (pending/packing/packed)
- [ ] Pack Progress: Large percentage display (0-100%), progress bar, counter "X / Y LPs"
- [ ] Totals Card: Total Boxes count, Total Weight sum
- [ ] Missing Weight Alert: Red alert if any box missing weight
- [ ] Remaining Items Alert: Blue alert if LPs not yet packed
- [ ] Complete Packing Button: Enabled only when all boxes have weight AND all LPs packed

#### Error States

- [ ] Loading State: Spinner while submitting complete packing
- [ ] Validation Errors: Red text below weight/dimension inputs
- [ ] Allergen Warning: Dialog appears for conflicting allergens
- [ ] Submission Error: Toast error if complete packing fails

---

## RMA Module

### Route: `/shipping/rma`

#### Buttons

- [ ] Create RMA button: Opens RMAModal in create mode
- [ ] Row Click: Navigate to detail view
- [ ] Edit Icon: Pencil button, opens RMAModal in edit mode (only if status='pending')
- [ ] Delete Icon: Trash button, opens DeleteConfirmDialog (conditional on canDelete)
- [ ] Approve Icon: CheckCircle button, opens ApproveConfirmDialog (only if status='pending' AND canApprove)
- [ ] Add Line Button: Plus button to add RMA line items
- [ ] Delete Line Button: Trash per line, removes line from RMA
- [ ] Edit Line Button: Pencil per line, opens edit form

#### Forms

- [ ] Customer Select: Dropdown from customers, required
- [ ] Sales Order Select: Dropdown filtered by selected customer
- [ ] Reason Code Select: Dropdown of RMA reasons, required
- [ ] Reason Notes: Textarea, free text explanation
- [ ] Disposition Select: Dropdown (credit, repair, replace, etc.)
- [ ] General Notes: Textarea for RMA-level notes

#### Modals & Dialogs

- [ ] RMAModal: Create/Edit mode with customer, SO, reason, disposition, RMA lines, notes
- [ ] Delete Confirmation Dialog: Title "Delete RMA?", warning, Cancel/Delete
- [ ] Approve Confirmation Dialog: Title "Approve RMA?", irreversibility warning, Cancel/Approve

#### Tables

- [ ] RMA DataTable: Columns—RMA #, Customer, Product, Reason, Status, Disposition, Actions
- [ ] Column Sorting: Click headers to sort
- [ ] Pagination: 25 items per page
- [ ] RMA Lines Table (nested): Columns—Product, Lot Number, Qty Expected, Reason Notes, Disposition, Actions

#### Stats Summary

- [ ] Pending Card: Count of pending RMAs
- [ ] Approved Card: Count of approved RMAs
- [ ] Total Card: Total count of RMAs

#### Workflows

- [ ] Create RMA: Click Create → Select customer → Select sales order → Select reason → Add RMA lines (product, lot, qty, notes) → Click Save → Add to list
- [ ] Edit RMA: Click pencil (if pending) → RMAModal opens → Modify fields and lines → Save → Update list
- [ ] Delete RMA: Click trash → Confirm → Remove from list
- [ ] Approve RMA: Click checkmark → ApproveConfirmDialog → Confirm → Status changes to approved → Enables receiving workflow
- [ ] Add RMA Line: Click "Add Line" in modal → Form opens → Fill product, lot, qty, disposition → Add to lines table

#### Error States

- [ ] Loading State: Skeleton loaders for table and stats cards
- [ ] Error State: Error alert with retry button
- [ ] Empty State: "No RMAs found" message with Create button
- [ ] Validation Error: Form field errors, form stays open

---

## Buttons

### Primary Buttons

- [ ] Create Button: Blue background, plus icon, opens create modal or navigates to create page
- [ ] Save Button: Blue background, white text, submits forms and modals
- [ ] Approve Button: Primary style, executes approval workflow
- [ ] Add Button: Blue style, adds items or lines

### Action Buttons

- [ ] Ship Button: Destructive style, opens confirmation dialog for irreversible action
- [ ] Manifest Button: Outline style, executes manifest workflow
- [ ] Mark Delivered Button: Outline style, marks shipment as delivered
- [ ] View Tracking Button: Outline style, opens tracking information dialog

### Ghost/Secondary Buttons

- [ ] Back Button: Ghost style with arrow icon, navigates back
- [ ] Cancel Button: Outline style, closes modals without saving
- [ ] Retry Button: Outline style, refetches data on error

### Destructive Buttons

- [ ] Delete Button: Red background, trash icon, opens delete confirmation
- [ ] Remove Button: Red style, removes item from list

### Icon Buttons

- [ ] Clear Search: X icon in search field
- [ ] Row Expand: Chevron down/up per row
- [ ] Edit Icon: Pencil icon per row
- [ ] Delete Icon: Trash icon per row

---

## Forms

### Input Fields

- [ ] Text Input: Name, Email, Product, Customer, etc. with placeholder text
- [ ] Email Input: Valid email format validation
- [ ] Phone Input: Phone format validation
- [ ] URL Input: Valid URL format validation
- [ ] Number Input: Quantity, Price, Weight, Dimensions with min/max ranges
- [ ] Textarea: Notes, Reason Notes with character limits and counter
- [ ] Select/Dropdown: Category, Status, Reason, Disposition with enum options
- [ ] Combobox: Product and customer search with filtering
- [ ] Checkbox: Allergen selections, acknowledgments
- [ ] Radio: Disposition options (Release, Rework, Scrap, Return; Credit, Repair, Replace)
- [ ] Address Fields: Address Line 1, Address Line 2, City, State, Postal Code, Country

### Validation

- [ ] Required Fields: Highlighted in red, error message below
- [ ] Email Validation: Valid format required
- [ ] Number Validation: Min/max ranges enforced, > 0 for quantities
- [ ] Character Limits: Min/max enforced, character counter shown
- [ ] Percent Discount: Cannot exceed 100%
- [ ] Quantity Warning: Show available quantity if over-allocation
- [ ] Date Validation: Future dates, format validation

### Form States

- [ ] Loading: Inputs disabled, spinner on submit button
- [ ] Dirty: Unsaved changes indicator appears
- [ ] Success: Form closes, toast notification, navigate if applicable
- [ ] Error: Field-level errors, form stays open, submit button shows error state

---

## Modals & Dialogs

### CustomerModal

- [ ] Type: Dialog
- [ ] Mode: create | edit
- [ ] Fields: Name, Email, Phone, Website, Category, Contact Person, Notes, Allergen Restrictions
- [ ] Shipping Addresses: Add Address button, address field rows, delete button per row
- [ ] Buttons: Cancel (outline), Save (primary)

### SOModal

- [ ] Type: Dialog
- [ ] Mode: create
- [ ] Sections: Customer & Address, Order Lines (SOLineForm + SOLineTable), Order Summary
- [ ] Order Summary: Subtotal, Total Discount, Total Tax, Order Total (all calculated real-time)
- [ ] Buttons: Cancel, Save

### SOLineForm

- [ ] Type: Form component (nested in SOModal)
- [ ] Fields: Product (combobox), Quantity (number), Unit Price (auto-populated), Discount Type (select), Discount Value (number), Notes (textarea)
- [ ] Warnings: Product price warning (amber), Quantity over-allocation warning
- [ ] Line Total: Bold calculated display
- [ ] Buttons: Add Line (blue), Cancel (outline)

### ShipConfirmDialog

- [ ] Type: AlertDialog
- [ ] Title: "Confirm Shipment" with warning icon
- [ ] Warning Text: "This action is irreversible. Once shipped, you cannot undo this action."
- [ ] Shipment Details Card: Shipment #, Customer, Boxes, Weight, LP Count, Sales Order
- [ ] Impact Warning: List of irreversible impacts (mark shipped, consume LPs, update SO, etc.)
- [ ] Acknowledgment Checkbox: "I understand this action is irreversible" (must be checked to enable Ship button)
- [ ] Buttons: Cancel (outline), Ship Shipment (destructive, enabled if checkbox checked)

### TrackingDialog

- [ ] Type: Dialog
- [ ] States: Loading (skeleton), Error (with retry button), Success (full tracking info)
- [ ] Carrier Information: Carrier name, tracking number, status
- [ ] External Link: "Track Online" link with ExternalLink icon, opens in new tab
- [ ] TrackingTimeline: 4 steps (Packed, Manifested, Shipped, Delivered) with icons, dates, users
- [ ] Step States: Completed (CheckCircle, colored), Active (icon, colored), Pending (Clock, gray), In Transit (MapPin pulse, amber)
- [ ] Buttons: Track Online (if external URL), Close

### RMAModal

- [ ] Type: Dialog
- [ ] Mode: create | edit
- [ ] Sections: Customer & SO, Reason (code + notes), Disposition, RMA Lines, General Notes
- [ ] RMA Lines Table: Product, Lot Number, Qty Expected, Reason Notes, Disposition, Edit/Delete actions
- [ ] Buttons: Cancel, Save

### DeleteConfirmDialog

- [ ] Type: AlertDialog
- [ ] Title: Context-specific (e.g., "Delete Customer?", "Delete Sales Order?", "Delete RMA?")
- [ ] Description: Warning about permanent deletion and associated data
- [ ] Buttons: Cancel (outline), Delete (red destructive)

### ApproveConfirmDialog

- [ ] Type: AlertDialog
- [ ] Title: "Approve RMA?"
- [ ] Description: "Approving this RMA will enable the receiving workflow. This action cannot be undone."
- [ ] Buttons: Cancel, Approve

### AllergenWarningDialog

- [ ] Type: AlertDialog
- [ ] Title: "Allergen Warning" with warning icon
- [ ] Description: "The product [name] contains allergens that conflict with customer restrictions."
- [ ] Conflict List: Badge list of conflicting allergens
- [ ] Question: "Do you want to continue adding this item to the box?"
- [ ] Buttons: Cancel (dismiss, don't add), Continue (proceed with adding)

---

## Tables

### Customer DataTable

- [ ] Columns: Name, Email, Category, Status, Address Count, Actions
- [ ] Row Click: Opens CustomerModal in edit mode
- [ ] Sorting: Click headers to sort
- [ ] Pagination: 25 per page
- [ ] Row Actions: Edit (click row), Delete (trash icon)

### Sales Orders Table

- [ ] Columns: Order #, Customer, Status, Order Date, Total, Actions
- [ ] Column Sorting: Default by order_date desc, click to change
- [ ] Pagination: 25 per page
- [ ] Row Click: Navigate to detail
- [ ] Row Actions: Edit (pencil), Delete (trash), Confirm (lock icon)

### SOLineTable

- [ ] Columns: Product, Qty, Unit Price, Discount, Line Total, Actions
- [ ] Row Actions: Edit (pencil), Delete (trash)
- [ ] Line Total: Auto-calculated display
- [ ] Empty State: "No lines added yet"

### ShipmentsTable

- [ ] Columns: Shipment #, SO #, Customer, Status, Boxes, Weight
- [ ] Status Badge: Color-coded by status value
- [ ] Row Click: Navigate to detail
- [ ] Sorting: Available on columns

### PackListTable

- [ ] Columns: Box #, Weight, Dimensions, Items, SSCC, Actions
- [ ] Sortable: Box #, Weight
- [ ] Row Expansion: Click chevron to expand/collapse
- [ ] Expanded Content: Sub-table with Product, LP Number, Lot Number, Quantity
- [ ] Row Actions: Edit Box (pencil), Delete Box (trash), conditional on editable state
- [ ] Empty State: "No boxes in this shipment"

### RMA DataTable

- [ ] Columns: RMA #, Customer, Product, Reason, Status, Disposition, Actions
- [ ] Column Sorting: Click headers
- [ ] Pagination: 25 per page
- [ ] Row Click: Navigate to detail
- [ ] Row Actions: View (eye), Edit (pencil, if pending), Delete (trash), Approve (checkmark, if pending)
- [ ] Status Values: pending, approved, received, closed

### RMA Lines Table

- [ ] Columns: Product, Lot Number, Qty Expected, Reason Notes, Disposition, Actions
- [ ] Row Actions: Edit (pencil), Delete (trash)
- [ ] Nested: Inside RMAModal

---

## Workflows

### Customer Management Workflow

- [ ] Create: Click "Create Customer" → Fill name, email, category → Add shipping addresses → Save → Added to list
- [ ] Edit: Click row → Modal opens with pre-filled data → Modify → Save → Updated in list
- [ ] Delete: Click trash → Confirm → Remove from list
- [ ] Filter: Select category/status filter → Results update
- [ ] Search: Enter search term → Results filter by name/code

### Sales Order Workflow

- [ ] Create: Click "Create SO" → Select customer → Select ship-to address → Add order lines → Review summary → Save → Added to list
- [ ] Add Line: Click "Add Line" in modal → Select product → Enter qty, price, discount → Click "Add" → Line appears in table
- [ ] Edit Line: Click pencil on line → Edit form opens → Modify → Update in table
- [ ] Delete Line: Click trash on line → Line removed
- [ ] Delete Order: Click trash → Confirm → Remove from list
- [ ] Confirm Order: Click lock icon → Confirm dialog → Order locked
- [ ] Review: Subtotal, discounts, tax, and total calculated real-time

### Shipment & Packing Workflow

- [ ] Packing: Navigate to packing → Select LPs from left panel → Add to box → Set weight/dimensions → Complete when all boxes weighted and all LPs packed
- [ ] Manifest: Click "Manifest" button → Status updates to manifested
- [ ] Ship: Click "Ship" button → Confirm dialog → Verify details → Acknowledge irreversibility → Click "Ship Shipment" → Status updates to shipped
- [ ] Track: Click "View Tracking" → TrackingDialog shows carrier, tracking #, timeline, external link
- [ ] Deliver: Click "Mark Delivered" → Status updates to delivered (Manager/Admin only)

### RMA Workflow

- [ ] Create: Click "Create RMA" → Select customer → Select SO → Select reason → Add RMA lines → Save → Added to list
- [ ] Edit: Click pencil (if pending) → Modify → Save → Update
- [ ] Delete: Click trash → Confirm → Remove
- [ ] Approve: Click checkmark → Confirm → Status changes to approved → Enables receiving
- [ ] Add Line: In modal, click "Add Line" → Fill product, lot, qty, disposition → Add to table

### Search & Filter Workflow

- [ ] Text Search: Enter search term → Results filter → Pagination resets
- [ ] Category/Status Filter: Select option → Results filter → Can combine multiple filters
- [ ] Clear Search: Click X button → All results displayed
- [ ] Column Sorting: Click header → Sort asc/desc → Toggle direction with second click
- [ ] Pagination: Navigate pages → URL params update → Data reloads

---

## Error States

### Loading States

- [ ] Skeleton Loaders: Table rows, cards, form sections show placeholder animation
- [ ] Spinner Icon: Animated icon on buttons during async operations
- [ ] Loading Text: "Creating...", "Saving...", "Loading..." shown contextually
- [ ] Disabled Inputs: Form fields disabled during submission

### Error Alerts

- [ ] Error Box: Red border, red background, AlertCircle icon
- [ ] Error Message: Clear text describing the issue
- [ ] Retry Button: "Retry" option to attempt operation again
- [ ] Back Button: Navigation option to return to previous state

### Empty States

- [ ] Icon Display: Contextual icon (Customers, Orders, Box, etc.)
- [ ] Heading: "No [items] found" message
- [ ] Description: Brief explanation
- [ ] Action Button: "Create [item]" button to start workflow

### Validation Errors

- [ ] Field Highlight: Red border on invalid input
- [ ] Error Text: Red text below field describing error
- [ ] Toast Notification: Toast error for form submission errors
- [ ] Modal Persistence: Form stays open on validation error

### Offline/Connectivity

- [ ] Offline Detection: Connectivity loss indication
- [ ] Error Message: "Failed to load data" or similar
- [ ] Retry Mechanism: Automatic retry or manual retry button

### Accessibility & Keyboard Navigation

- [ ] Tab Navigation: Tab through all interactive elements
- [ ] Enter Key: Submit forms, confirm dialogs, open dropdowns
- [ ] Escape Key: Close modals, dialogs, dropdowns
- [ ] Arrow Keys: Navigate through select options, radio buttons
- [ ] Space: Toggle checkboxes, expand rows
- [ ] ARIA Labels: All inputs have semantic labels
- [ ] Focus Visible: Clear focus indicators on all interactive elements
- [ ] Screen Reader: Table headers announced, form labels associated

---

## Permission-Based Variations

### Customers Module

- [ ] All Users: View customers list, view customer details
- [ ] Shipping Manager/Admin: Can create, edit, and delete customers

### Sales Orders Module

- [ ] All Users: View sales orders list and details
- [ ] Sales Manager/Admin: Can create, edit, delete, and confirm orders

### Shipments Module

- [ ] All Users: View shipments list and details, view tracking
- [ ] Warehouse Manager: Can manifest shipments
- [ ] Manager/Admin: Can mark as delivered
- [ ] Picker/Warehouse: Can execute packing workflow

### RMA Module

- [ ] All Users: View RMA list and details
- [ ] RMA Manager/Admin: Can create, edit, delete RMAs
- [ ] Approval User/Manager/Admin: Can approve RMAs

---

## Route Navigation

- [ ] `/shipping` → Redirects to `/shipping/dashboard`
- [ ] `/shipping/dashboard` → Main dashboard page (KPIs, alerts, recent activity)
- [ ] `/shipping/customers` → Customers list page with CRUD
- [ ] `/shipping/sales-orders` → Sales orders list page with CRUD
- [ ] `/shipping/sales-orders/new` → Create sales order page
- [ ] `/shipping/sales-orders/[id]` → Sales order detail page
- [ ] `/shipping/shipments` → Shipments list page
- [ ] `/shipping/shipments/[id]` → Shipment detail page with actions
- [ ] `/shipping/packing` → Packing modal (opened from shipment context)
- [ ] `/shipping/rma` → RMA list page with CRUD

---

**Test Coverage**: 100% of Shipping module interactive elements  
**Last Updated**: 2026-02-08
