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

- [x] Create Customer button: Opens CustomerModal in create mode
- [x] Retry button: Refetch customers on error (visible only in error state)
- [x] Row Click: Navigate to detail or open CustomerModal in edit mode
- [x] Delete Icon: Trash button per row, opens DeleteConfirmDialog
- [x] Search Button: Submit search form with entered term
- [x] Clear Search Icon: Clears search input and resets results

#### Forms

- [x] Search Input: Text field, filters by name/customer code, synced to URL param
- [x] Category Filter: Select dropdown with options (all, retail, wholesale, distributor)
- [x] Status Filter: Select dropdown with options (all, active, inactive)

#### Modals & Dialogs

- [x] CustomerModal: Create/Edit mode, fields (Name, Email, Phone, Website, Category, Contact Person, Notes, Allergen Restrictions, Shipping Addresses)
- [x] Shipping Addresses Sub-section: Add Address button, address rows with delete per row
- [x] Delete Confirmation Dialog: Title "Delete Customer?", warning about permanent deletion, Cancel/Delete buttons

#### Tables

- [x] Customer DataTable: Columns—Name, Email, Category, Status, Address Count, Actions
- [x] Column Sorting: Click headers to sort by each column (sort_by, sort_order)
- [x] Pagination: 25 items per page, page navigation buttons
- [x] Row Actions: Click row to edit, trash icon to delete

#### Workflows

- [x] Create Customer: Click Create → Fill form (Name, Email, Category required) → Add addresses → Click Save → Add to list
- [x] Edit Customer: Click row → Modal opens with pre-filled data → Modify fields → Save → Update list
- [x] Delete Customer: Click trash → Confirm in dialog → Remove from list and redirect
- [x] Filter & Search: Enter search term or select filter → Results update → Pagination resets

#### Error States

- [x] Loading State: Skeleton loaders for table rows
- [x] Error State: Error alert with retry button, offline/failed status
- [x] Empty State: "No customers found" message with Create button
- [x] Validation Error: Form fields show error messages on invalid input

---

## Sales Orders CRUD

### Route: `/shipping/sales-orders`

#### Buttons

- [x] Create Sales Order button: Opens SOModal in create mode
- [x] Row Click: Navigate to detail view
- [x] Edit Icon: Pencil button, navigates to edit page
- [x] Delete Icon: Trash button, opens DeleteConfirmDialog
- [x] Confirm Icon: Lock button, opens ConfirmConfirmDialog
- [x] Add Line Button: Plus button in SOLineForm, adds new order line
- [x] Delete Line Button: Trash icon per line in SOLineTable, removes line
- [x] Edit Line Button: Pencil icon, opens edit form for line

#### Forms

- [x] Customer Select: Dropdown from available customers, required
- [x] Ship To Address: Radio buttons showing customer's shipping addresses
- [x] Product Select: Combobox/dropdown for products in line form
- [x] Quantity Input: Number field > 0, required, shows warning if over-allocated
- [x] Unit Price: Auto-populated from product, editable, required
- [x] Discount Type: Select dropdown (none, percent, fixed)
- [x] Discount Value: Number input (0-100 for %, 0-infinite for fixed)
- [x] Notes: Textarea per line or order

#### Modals & Dialogs

- [x] SOModal: Create mode with customer, address, line items, order summary sections
- [x] SOLineForm: Nested form for adding/editing order lines
- [x] SOLineTable: Display existing lines with edit/delete actions
- [x] Delete Confirmation Dialog: Title "Delete Sales Order?", warning, Cancel/Delete
- [x] Confirm Confirmation Dialog: Title "Confirm Sales Order?", irreversibility warning, Cancel/Confirm

#### Tables

- [x] Sales Orders Table: Columns—Order #, Customer, Status, Order Date, Total, Actions
- [x] Column Sorting: Default sort by order_date desc, click headers to change
- [x] Pagination: 25 items per page
- [x] SOLineTable (nested): Columns—Product, Qty, Unit Price, Discount, Line Total, Actions

#### Workflows

- [x] Create Sales Order: Click Create → Select customer → Select ship-to address → Add order lines (product, qty, price, discount) → Review summary → Click Save
- [x] Edit Sales Order: Navigate to detail → Click Edit → Modify fields and lines → Save → Update display
- [x] Delete Sales Order: Click trash → Confirm → Remove from list
- [x] Confirm Order: Click lock icon → Confirm dialog → Order locked, cannot edit
- [x] Add Line: Click "Add Line" → SOLineForm opens → Fill product, qty, price, discount → Click Add → Line appears in table

#### Validations

- [x] Required Fields: Customer and address required, at least 1 line required
- [x] Product Warning: Amber warning if product has no standard price
- [x] Quantity Warning: Show available quantity if over-allocation detected
- [x] Discount Validation: Percent cannot exceed 100%
- [x] Line Total: Calculated real-time (Qty × Price - Discount)

#### Error States

- [x] Loading State: Skeleton loaders for table and form
- [x] Error State: Error alert with retry button
- [x] Empty State: "No sales orders found" message
- [x] Validation Error: Field-level error messages, form stays open

---

### Route: `/shipping/sales-orders/new`

#### Buttons

- [x] Same as `/shipping/sales-orders` Create button workflow

#### Forms

- [x] Same form fields as SOModal

#### Workflows

- [x] Dedicated new order creation page with same workflow as modal

---

### Route: `/shipping/sales-orders/[id]`

#### Buttons

- [x] Back Button: Navigate to sales orders list
- [x] Edit Button: Navigate to edit page (if editable)
- [x] Delete Button: Open delete confirmation (if deletable)
- [x] Confirm Button: Lock the order

#### Forms

- [x] All order and line details display (read-only in detail view)

#### Workflows

- [x] View Detail: Load order → Display all fields → Show all order lines → Show totals

#### Error States

- [x] Loading State: Skeleton loaders
- [x] Error State: Alert with retry button

---

## Shipments Module

### Route: `/shipping/shipments`

#### Buttons

- [x] Row Click: Navigate to `/shipping/shipments/[id]` detail view
- [x] Manifest Button: Outline style, visible when status='packed', opens manifest workflow
- [x] Ship Button: Destructive style, visible when status in [packed, manifested], opens ShipConfirmDialog
- [x] Mark Delivered Button: Outline style, visible when status='shipped' AND user in [Manager, Admin], marks as delivered
- [x] View Tracking Button: Outline style, visible when status in [shipped, delivered], opens TrackingDialog

#### Forms

- [ ] No direct form input on shipments list/detail (status-driven workflow)

#### Modals & Dialogs

- [x] ShipConfirmDialog: AlertDialog with warning, shipment details card, irreversibility warnings, acknowledgment checkbox, Cancel/Ship buttons
- [x] TrackingDialog: Displays carrier info, tracking number, external link, TrackingTimeline with steps (Packed, Manifested, Shipped, Delivered)

#### Tables

- [x] ShipmentsTable: Columns—Shipment #, SO #, Customer, Status, Boxes, Weight
- [x] Status Badge: Color-coded (pending:yellow, packing:blue, packed:green, manifested:purple, shipped:indigo, delivered:emerald, exception:red)
- [x] PackListTable (within shipment detail): Columns—Box #, Weight, Dimensions, Items, SSCC, Actions
- [x] PackListTable Row Expansion: Click chevron to expand → Sub-table shows contents (Product, LP Number, Lot Number, Quantity)

#### Workflows

- [x] Ship Workflow: Click Ship button → ShipConfirmDialog opens → Verify shipment details → Check warning impacts → Acknowledge irreversibility → Click "Ship Shipment" → Status updates to shipped
- [x] Mark Delivered: Click "Mark Delivered" → Status updates to delivered (no confirmation required)
- [x] View Tracking: Click "View Tracking" → TrackingDialog opens → Shows carrier, tracking number, timeline
- [x] Manifest Shipment: Click "Manifest" button → Shipment status updates to manifested

#### Error States

- [x] Loading State: Spinner on action buttons during async operations
- [x] Error State: Toast error notification for failed operations
- [x] Loading Dialog: TrackingDialog shows skeleton for loading, error state with retry

---

### Route: `/shipping/shipments/[id]`

#### Buttons

- [x] Back Button: Navigate to shipments list
- [x] Manifest Button: Execute manifest action (if status='packed')
- [x] Ship Button: Open ShipConfirmDialog (if status in [packed, manifested])
- [x] Mark Delivered Button: Execute delivery (if status='shipped')
- [x] View Tracking Button: Open TrackingDialog (if status in [shipped, delivered])
- [x] Edit Box Button: Pencil icon per box in PackListTable, opens edit form (if editable)
- [x] Delete Box Button: Trash icon per box, removes box (if editable)

#### Forms

- [x] No direct edit forms (status-driven with modal confirmations)

#### Tables

- [x] PackListTable: Box #, Weight, Dimensions, Items count, SSCC
- [x] Expandable Rows: Click chevron to show contents sub-table
- [x] Contents Sub-table: Product, LP Number, Lot Number, Quantity
- [x] Row Actions: Edit and Delete buttons (conditional on status)

#### Workflows

- [x] View Shipment Detail: Load shipment info → Display status and customer info → Show PackListTable → Ready for actions based on status
- [x] Execute Shipment Actions: Click button → Confirmation dialog → Verify details → Acknowledge impacts → Execute → Status updates

#### Error States

- [x] Loading State: Skeleton loaders for shipment info and pack list
- [x] Error State: Alert with retry/back buttons
- [x] No Boxes State: Message "No boxes in this shipment" with Add button (if editable)

---

## Packing Module

### Route: `/shipping/packing`

#### Buttons

- [x] Add to Box Button: Disabled if no LP selected or no active box
- [x] Add Box Button: Plus icon to create new box (disabled while adding)
- [x] Complete Packing Button: Enabled if all boxes have weight AND all LPs packed, shows loading spinner
- [x] Add to Box (in AddItemDialog): Enabled if quantity valid and item selected

#### Forms

- [x] Weight Input: Number field (0-25 kg max), required for each box
- [x] Dimensions Inputs: Length, Width, Height (10-200 cm each), required
- [x] LP Search Input: Searchable "Search LP, product, lot..." with debounce
- [x] Box Quantity Input: Number field in AddItemDialog, min 1, max available

#### Modals & Dialogs

- [x] AllergenWarningDialog: AlertDialog with allergen conflict warning, conflicting allergen badges, Cancel/Continue buttons
- [x] AddItemDialog: Alternative add workflow with box select, LP search, quantity input, validation errors

#### Tables

- [x] LP Selector Cards (left column): LP Number, Quantity badge, Product name, Lot number, Location (clickable cards)
- [x] Box Contents List (center column): LP number, Product, Lot + Qty info cards in each box
- [x] No Items State: "No items in this box yet" message

#### Workflows

- [x] 3-Column Packing Layout: Left (LP Selector) → Center (Box Builder) → Right (Packing Summary)
- [x] Add LP to Box: Search LP in left panel → Click to select → Click "Add to Box" → Added to active box in center
- [x] Create Box: Click "+ Add Box" → New box tab appears → Enter weight and dimensions → Show in box tabs
- [x] Pack Workflow: Select LP → Add to box → Set weight/dimensions → Repeat for all LPs → Click "Complete Packing" when all conditions met
- [x] Handle Allergen Warning: If product allergen conflicts with customer restrictions → AllergenWarningDialog opens → Click Continue to proceed

#### Packing Summary (Right Column)

- [x] Shipment Details Card: Shipment #, Customer, Status (pending/packing/packed)
- [x] Pack Progress: Large percentage display (0-100%), progress bar, counter "X / Y LPs"
- [x] Totals Card: Total Boxes count, Total Weight sum
- [x] Missing Weight Alert: Red alert if any box missing weight
- [x] Remaining Items Alert: Blue alert if LPs not yet packed
- [x] Complete Packing Button: Enabled only when all boxes have weight AND all LPs packed

#### Error States

- [x] Loading State: Spinner while submitting complete packing
- [x] Validation Errors: Red text below weight/dimension inputs
- [x] Allergen Warning: Dialog appears for conflicting allergens
- [x] Submission Error: Toast error if complete packing fails

---

## RMA Module

### Route: `/shipping/rma`

#### Buttons

- [x] Create RMA button: Opens RMAModal in create mode
- [x] Row Click: Navigate to detail view
- [x] Edit Icon: Pencil button, opens RMAModal in edit mode (only if status='pending')
- [x] Delete Icon: Trash button, opens DeleteConfirmDialog (conditional on canDelete)
- [x] Approve Icon: CheckCircle button, opens ApproveConfirmDialog (only if status='pending' AND canApprove)
- [x] Add Line Button: Plus button to add RMA line items
- [x] Delete Line Button: Trash per line, removes line from RMA
- [x] Edit Line Button: Pencil per line, opens edit form

#### Forms

- [x] Customer Select: Dropdown from customers, required
- [x] Sales Order Select: Dropdown filtered by selected customer
- [x] Reason Code Select: Dropdown of RMA reasons, required
- [x] Reason Notes: Textarea, free text explanation
- [x] Disposition Select: Dropdown (credit, repair, replace, etc.)
- [x] General Notes: Textarea for RMA-level notes

#### Modals & Dialogs

- [x] RMAModal: Create/Edit mode with customer, SO, reason, disposition, RMA lines, notes
- [x] Delete Confirmation Dialog: Title "Delete RMA?", warning, Cancel/Delete
- [x] Approve Confirmation Dialog: Title "Approve RMA?", irreversibility warning, Cancel/Approve

#### Tables

- [x] RMA DataTable: Columns—RMA #, Customer, Product, Reason, Status, Disposition, Actions
- [x] Column Sorting: Click headers to sort
- [x] Pagination: 25 items per page
- [x] RMA Lines Table (nested): Columns—Product, Lot Number, Qty Expected, Reason Notes, Disposition, Actions

#### Stats Summary

- [x] Pending Card: Count of pending RMAs
- [x] Approved Card: Count of approved RMAs
- [x] Total Card: Total count of RMAs

#### Workflows

- [x] Create RMA: Click Create → Select customer → Select sales order → Select reason → Add RMA lines (product, lot, qty, notes) → Click Save → Add to list
- [x] Edit RMA: Click pencil (if pending) → RMAModal opens → Modify fields and lines → Save → Update list
- [x] Delete RMA: Click trash → Confirm → Remove from list
- [x] Approve RMA: Click checkmark → ApproveConfirmDialog → Confirm → Status changes to approved → Enables receiving workflow
- [x] Add RMA Line: Click "Add Line" in modal → Form opens → Fill product, lot, qty, disposition → Add to lines table

#### Error States

- [x] Loading State: Skeleton loaders for table and stats cards
- [x] Error State: Error alert with retry button
- [x] Empty State: "No RMAs found" message with Create button
- [x] Validation Error: Form field errors, form stays open

---

## Buttons

### Primary Buttons

- [x] Create Button: Blue background, plus icon, opens create modal or navigates to create page
- [x] Save Button: Blue background, white text, submits forms and modals
- [x] Approve Button: Primary style, executes approval workflow
- [x] Add Button: Blue style, adds items or lines

### Action Buttons

- [x] Ship Button: Destructive style, opens confirmation dialog for irreversible action
- [x] Manifest Button: Outline style, executes manifest workflow
- [x] Mark Delivered Button: Outline style, marks shipment as delivered
- [x] View Tracking Button: Outline style, opens tracking information dialog

### Ghost/Secondary Buttons

- [x] Back Button: Ghost style with arrow icon, navigates back
- [x] Cancel Button: Outline style, closes modals without saving
- [x] Retry Button: Outline style, refetches data on error

### Destructive Buttons

- [x] Delete Button: Red background, trash icon, opens delete confirmation
- [x] Remove Button: Red style, removes item from list

### Icon Buttons

- [x] Clear Search: X icon in search field
- [x] Row Expand: Chevron down/up per row
- [x] Edit Icon: Pencil icon per row
- [x] Delete Icon: Trash icon per row

---

## Forms

### Input Fields

- [x] Text Input: Name, Email, Product, Customer, etc. with placeholder text
- [x] Email Input: Valid email format validation
- [x] Phone Input: Phone format validation
- [x] URL Input: Valid URL format validation
- [x] Number Input: Quantity, Price, Weight, Dimensions with min/max ranges
- [x] Textarea: Notes, Reason Notes with character limits and counter
- [x] Select/Dropdown: Category, Status, Reason, Disposition with enum options
- [x] Combobox: Product and customer search with filtering
- [x] Checkbox: Allergen selections, acknowledgments
- [x] Radio: Disposition options (Release, Rework, Scrap, Return; Credit, Repair, Replace)
- [x] Address Fields: Address Line 1, Address Line 2, City, State, Postal Code, Country

### Validation

- [x] Required Fields: Highlighted in red, error message below
- [x] Email Validation: Valid format required
- [x] Number Validation: Min/max ranges enforced, > 0 for quantities
- [x] Character Limits: Min/max enforced, character counter shown
- [x] Percent Discount: Cannot exceed 100%
- [x] Quantity Warning: Show available quantity if over-allocation
- [x] Date Validation: Future dates, format validation

### Form States

- [x] Loading: Inputs disabled, spinner on submit button
- [x] Dirty: Unsaved changes indicator appears
- [x] Success: Form closes, toast notification, navigate if applicable
- [x] Error: Field-level errors, form stays open, submit button shows error state

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
