# Quality Module Test Plan

**Module**: Quality (`/quality`)  
**Last Updated**: 2026-02-08  
**Coverage**: All clickable elements, forms, modals, tables, CRUD operations

---

## 📑 Table of Contents

1. [Quality Holds CRUD](#quality-holds-crud)
2. [Quality Specifications CRUD](#quality-specifications-crud)
3. [NCR Management](#ncr-management)
4. [Quality Settings](#quality-settings)
5. [Buttons](#buttons)
6. [Forms](#forms)
7. [Modals & Dialogs](#modals--dialogs)
8. [Tables](#tables)
9. [Workflows](#workflows)
10. [Error States](#error-states)

---

## Quality Holds CRUD

### Route: `/quality/holds`

#### Buttons

- [ ] Create Hold button: Primary button with plus icon, opens HoldForm modal
- [ ] Refresh Icon: Appears during loading state with spinner animation
- [ ] Row Click: Navigates to `/quality/holds/{id}` detail page
- [ ] Delete Button: Red destructive button, opens delete confirmation (only when status='active' AND items.length=0)
- [ ] Release Hold button: Opens ReleaseModal (only when status='active')

#### Forms

- [ ] Search Input: Text field, searches by hold_number with 300ms debounce
- [ ] Status Filter: Dropdown with options (All, Active, Released, Disposed)
- [ ] Priority Filter: Dropdown with options (All, Low, Medium, High, Critical)

#### Tables

- [ ] Holds Table (Desktop): Columns—Hold Number, Status, Priority, Type, Reason, Items, Held By, Age
- [ ] Hold Number Link: Clickable, navigates to detail page with stopPropagation
- [ ] Cards View (Mobile): Expandable cards showing hold summary with ChevronUp/Down toggle
- [ ] Pagination Controls: Previous/Next buttons disabled when at page boundaries; shows "Showing X to Y of Z"

#### Workflows

- [ ] Create Hold: Fill form → Add Items → Select Disposition → Submit → Navigate to detail
- [ ] Release Hold: Select disposition (release/rework/scrap/return) → Enter release notes → Submit → Update status to "released"
- [ ] Delete Hold: Click delete → Confirm in dialog → Remove from list (only available for active holds with 0 items)
- [ ] Filter & Search: Apply filters → Results update → Pagination resets to page 1

#### Error States

- [ ] Loading State: Skeleton loaders displayed for page sections
- [ ] Error Alert: Red alert box with error message and retry button
- [ ] Empty State: Shield icon + "No Quality Holds" message + Create button
- [ ] Validation Error: Form field errors shown below input with red text

---

### Route: `/quality/holds/{id}`

#### Buttons

- [ ] Back Button: Arrow icon, navigates to `/quality/holds`
- [ ] Release Hold button: Opens ReleaseModal (only if status='active')
- [ ] Edit Button: Disabled pencil icon (edit not currently supported)
- [ ] Delete Button: Red destructive, opens delete confirmation (only if status='active' AND items.length=0)

#### Forms

- [ ] Reason Input: Textarea with min 10, max 500 chars validation (displayed as read-only in detail)
- [ ] Release Notes: Textarea in ReleaseModal, min 10, max 1000 chars required

#### Modals & Dialogs

- [ ] ReleaseModal: Opens with disposition radios (Release/Rework/Scrap/Return), release notes textarea, Cancel/Release buttons
- [ ] Delete AlertDialog: Title "Delete Quality Hold", description warning, Cancel/Delete buttons
- [ ] Scrap Confirmation: Additional confirmation required when selecting scrap disposition

#### Tables

- [ ] Hold Items Table: Columns—Reference Type, Reference ID, Quantity Held, UOM, Location
- [ ] Disposition Badge: Color-coded display in released hold information card

#### Workflows

- [ ] View Detail: Load hold info → Display tracking info → Show release info (if released) → Display hold items
- [ ] Release Hold: Select disposition → Enter notes → For scrap, confirm warning → Update status and lock hold
- [ ] Delete Hold: Click delete → Confirm → Remove hold and navigate back

#### Error States

- [ ] Page Loading: Skeleton loaders for sections
- [ ] Error State: Alert box with error message and retry/back buttons
- [ ] Validation Error: Toast notifications for form submission errors

---

## Quality Specifications CRUD

### Route: `/quality/specifications`

#### Buttons

- [ ] Create Button: Blue primary button, navigates to `/quality/specifications/new`
- [ ] Row Click Action: Navigate to specification detail page
- [ ] Edit Button: Pencil icon, navigates to edit page (only visible for draft status)
- [ ] Approve Button: Opens ApproveModal (only visible for draft status)
- [ ] Clone/Version Button: Copy icon, creates new draft with incremented version (only for active status)
- [ ] Delete Button: Trash icon, opens delete dialog (only for draft status)

#### Forms

- [ ] Search Input: Text field synced to URL param `search`, debounced
- [ ] Status Filter: Dropdown filter synced to URL param `status`
- [ ] Product Filter: Dropdown filter synced to URL param `product_id`
- [ ] Sort Headers: Clickable column headers, synced to URL params `sort_by` and `sort_order`

#### Tables

- [ ] Specifications Table: Columns—Spec Number, Product, Status, Version, Effective Date, Review Date, Actions
- [ ] Column Sorting: Click header to toggle asc/desc; icon indicators show current sort direction
- [ ] Pagination: Page buttons and items per page selector, synced to URL params

#### Workflows

- [ ] Create Specification: Click Create → Fill form (Product, Name, Description, Dates, Review Frequency) → Submit → Navigate to detail
- [ ] Approve Spec: Navigate to draft detail → Click Approve → Enter approval notes → Submit → Status changes to active
- [ ] Clone Specification: Navigate to active spec → Click Clone → New draft created with version incremented
- [ ] Delete Specification: Navigate to draft spec → Click Delete → Confirm → Remove from list

#### Error States

- [ ] Loading State: Table skeleton loaders
- [ ] Empty State: "No specifications found" message with Create button
- [ ] Error State: Error message with retry button
- [ ] Validation Error: Field-level errors displayed in form

---

### Route: `/quality/specifications/new`

#### Forms

- [ ] Product Select: Searchable dropdown, UUID validation, required
- [ ] Name Input: Text field, min 3 max 200 chars, required
- [ ] Description: Textarea, max 2000 chars, optional
- [ ] Effective Date: Date input, required
- [ ] Expiry Date: Date input, must be > effective_date, optional
- [ ] Review Frequency: Number input, 1-3650 days, required
- [ ] Notes: Textarea, max 2000 chars, optional

#### Buttons

- [ ] Cancel Button: Ghost button, navigates to `/quality/specifications`
- [ ] Submit Button: Blue primary, labeled "Create Specification", shows loading state during submission

#### Workflows

- [ ] Form Validation: Required fields checked, date validation enforced, character limits applied
- [ ] Submit Success: Navigate to `/quality/specifications/{id}` detail page
- [ ] Submit Error: Show error toast with message, form remains open

#### Error States

- [ ] Required Field: Red highlight with validation message
- [ ] Invalid Date: Error message "Expiry date must be after effective date"
- [ ] Submission Error: Toast notification with API error details

---

### Route: `/quality/specifications/{id}`

#### Buttons

- [ ] Back Button: Arrow icon, navigates to specifications list
- [ ] Edit Button: Pencil icon, navigates to edit page (only if status='draft')
- [ ] Approve Button: Opens ApproveModal (only if status='draft')
- [ ] Clone/New Version Button: Creates new draft version (only if status='active')
- [ ] Complete Review Button: Opens CompleteReviewDialog (only if status='active')
- [ ] Delete Button: Trash icon, opens delete confirmation (only if status='draft')

#### Forms

- [ ] Parameter Editor: Modal form to add/edit parameters with name, type, unit, min/max, critical flag, test method
- [ ] Approval Notes: Textarea in ApproveModal, required field

#### Modals & Dialogs

- [ ] ApproveModal: Title "Approve Specification", approval notes textarea, disposition select, Cancel/Approve buttons
- [ ] CompleteReviewDialog: Review notes textarea, next review date picker, Cancel/Complete Review buttons
- [ ] CloneVersionDialog: Displays new version number, Cancel/Create Draft buttons
- [ ] Delete AlertDialog: Confirmation for deletion, shows spec number

#### Tables

- [ ] Parameter Table: Columns—Parameter Name, Type, Unit, Min/Max, Critical, Test Method, Actions
- [ ] Parameter Actions: Edit (pencil) and Delete (trash) buttons per row

#### Workflows

- [ ] View Detail: Load spec data → Display all fields → Show parameters table → Show version history
- [ ] Approve Specification: Click Approve → Enter notes → Submit → Status changes to active
- [ ] Clone Version: Click Clone → New draft created with incremented version number
- [ ] Complete Review: Click Complete Review → Enter notes → Select next review date → Submit → Update review status

#### Error States

- [ ] Page Loading: Section skeleton loaders
- [ ] Error State: Alert with error message and retry/back buttons
- [ ] Parameter Validation: Inline errors for parameter form fields

---

### Route: `/quality/specifications/{id}/edit`

#### Forms

- [ ] Product Select: Disabled field (cannot change product after creation)
- [ ] Name Input: Editable text field, same validation as create
- [ ] Description: Editable textarea
- [ ] Effective Date: Editable date input
- [ ] Expiry Date: Editable date input with validation
- [ ] Review Frequency: Editable number input
- [ ] Notes: Editable textarea

#### Buttons

- [ ] Cancel Button: Navigates back to specification detail
- [ ] Submit Button: Labeled "Update Specification", shows loading state

#### Workflows

- [ ] Load Form: Pre-populate all fields with current values (except product field is disabled)
- [ ] Submit Changes: Validate form → Update specification → Navigate back to detail page
- [ ] Guard Check: Only accessible for draft status specs; shows error card for non-draft specs

#### Error States

- [ ] Edit Guard: Shows error card "Cannot Edit Specification" with current status and suggestion to clone
- [ ] Validation Errors: Same as create form with field-level error messages

---

## NCR Management

### Route: `/quality/ncr`

#### Buttons

- [ ] Back to Quality Button: Navigates to `/quality`
- [ ] Create NCR Button: Navigates to `/quality/ncr/new`

#### Workflows

- [ ] Navigation: Landing page shows placeholder content indicating NCR management under development
- [ ] Create Flow: Click Create NCR → Redirect to creation workflow

#### Error States

- [ ] Under Development: Placeholder message with "Under development" indicator

---

### Route: `/quality/ncr/new`

#### Workflows

- [ ] Redirect: Route redirects to `/quality/ncr?action=create` with loading message "Redirecting to NCR management..."

---

## Quality Settings

### Route: `/quality/settings`

#### Buttons

- [ ] Save Button: Sticky top-right button, disabled if no unsaved changes, visible only for authorized users (Admin, Owner, QA Manager)
- [ ] Section Toggle: Each collapsible section header, click to expand/collapse

#### Forms

- [ ] Inspection Settings: Toggles for auto-create on GRN, incoming/final inspection settings
- [ ] NCR Settings: Auto-numbering toggle, response SLA input, root cause requirement toggle
- [ ] CAPA Settings: Auto-numbering toggle, effectiveness requirements
- [ ] HACCP Settings: CCP deviation escalation toggle, auto-NCR creation toggle
- [ ] Audit Settings: Change reason requirement toggle, retention period input

#### Workflows

- [ ] Load Settings: Fetch organization settings → Display in collapsible sections
- [ ] Edit Settings: Modify values → "Unsaved changes" warning appears → Click Save → Update backend
- [ ] Cancel Edit: Click back without saving → Confirmation dialog → Discard changes

#### Permission-Based Features

- [ ] Read-Only View: Non-admin users see all settings but Save button is hidden
- [ ] Edit Access: Admin/Owner/QA Manager users can edit and save settings
- [ ] Unsaved Changes Warning: Toast/inline warning when form is dirty

#### Error States

- [ ] Loading State: LoadingSkeleton for all 5 sections
- [ ] Error State: ErrorState component with retry button
- [ ] Empty State: Option to initialize default settings
- [ ] Permission Error: Save button hidden with message "Admin access required"

---

## Buttons

### Primary Buttons

- [ ] Create/Save Button: Blue background, white text, plus icon for create actions
- [ ] Release/Approve Button: Primary style, executes important state changes
- [ ] Submit Button: Primary style, labeled contextually (Create, Update, Release, Approve)

### Secondary Buttons

- [ ] Cancel Button: Outline style, ghost appearance
- [ ] Back Button: Arrow left icon, navigates back
- [ ] Edit Button: Pencil icon, secondary style

### Destructive Buttons

- [ ] Delete Button: Red background, white text, trash icon
- [ ] Scrap Button: Red destructive style, with warning confirmation

### Ghost/Icon Buttons

- [ ] Refresh Icon: Spinner animation during loading
- [ ] Row Expand: ChevronUp/ChevronDown toggle for mobile cards
- [ ] Add Item Button: Plus icon in nested tables

---

## Forms

### Input Fields

- [ ] Reason Textarea: Min 10, max 500 chars, character counter, required for hold creation
- [ ] Release Notes: Min 10, max 1000 chars, textarea, required for release
- [ ] Approval Notes: Textarea, required in approval modals
- [ ] Search Input: Text field, debounced 300ms, searches hold_number or spec number
- [ ] Date Inputs: Valid date format, enforces date > constraints, calendar picker

### Validation

- [ ] Required Fields: Highlighted in red, show error message below input
- [ ] Character Limits: Enforce min/max, show character counter
- [ ] Date Validation: Expiry > Effective date, invalid date shows error
- [ ] Dropdown Validation: Required selections highlighted

### Form States

- [ ] Loading State: Disabled inputs, spinner on submit button
- [ ] Dirty State: Unsaved changes warning appears
- [ ] Success: Toast notification, modal closes, navigate if applicable

---

## Modals & Dialogs

### HoldForm Modal

- [ ] Open: Click "Create Hold" button
- [ ] Fields: Reason (textarea), Hold Type (select), Priority (select), Items (nested modal)
- [ ] Items Sub-section: "Add Items" button → Opens ItemSelector modal → Select items → Display in table
- [ ] Buttons: Cancel (close), Submit (create hold)
- [ ] Validation: All required fields validated before submit

### ItemSelector Modal (Nested)

- [ ] Toggle Buttons: License Plates | Work Orders button group
- [ ] Search Input: Debounced search for items
- [ ] Items Table: Columns vary by type (LP: number, quantity, location; WO: number, status, quantity)
- [ ] Checkboxes: Select multiple items
- [ ] Add Button: Add selected items to hold, disabled if none selected

### ReleaseModal

- [ ] Disposition Radios: Release, Rework, Scrap, Return options with icons and descriptions
- [ ] Release Notes: Textarea field, min 10 chars required
- [ ] Warning Banner: Shown for scrap disposition with irreversibility warning
- [ ] Buttons: Cancel, Release Shipment

### Delete AlertDialog

- [ ] Title: Context-specific (e.g., "Delete Quality Hold")
- [ ] Description: Warning text about irreversibility
- [ ] Buttons: Cancel (outline), Delete (red destructive)

### ApproveModal

- [ ] Approval Notes: Textarea field, required
- [ ] Buttons: Cancel, Approve

### CompleteReviewDialog

- [ ] Review Notes: Textarea
- [ ] Next Review Date: Date picker
- [ ] Buttons: Cancel, Complete Review

---

## Tables

### Holds Table (Desktop)

- [ ] Columns: Hold Number (link), Status, Priority, Type, Reason, Items, Held By, Age
- [ ] Status Badge: Color-coded for Active/Released/Disposed
- [ ] Priority Badge: Color-coded Low/Medium/High/Critical
- [ ] Row Click: Navigate to detail (stopPropagation on link click)
- [ ] Sorting: No sorting available for this table

### Holds Cards (Mobile)

- [ ] Card Layout: Expandable card with hold number and status visible by default
- [ ] Expand/Collapse: ChevronUp/Down icons toggle details view
- [ ] Expanded Content: Priority, Type, Reason, Items count, Held By, "View Details" button
- [ ] View Details Button: Navigates to detail page

### Specifications Table

- [ ] Columns: Spec Number, Product, Status, Version, Effective Date, Review Date, Actions
- [ ] Status Badge: Color-coded for Draft/Active/Expired
- [ ] Column Sorting: Click headers to sort asc/desc, direction icons show current sort
- [ ] Row Click: Navigate to specification detail
- [ ] Action Buttons: Edit (if draft), Approve (if draft), Clone (if active), Delete (if draft)

### Parameters Table

- [ ] Columns: Parameter Name, Type, Unit, Min/Max, Critical, Test Method, Actions
- [ ] Parameter Type Badge: Color-coded badge display
- [ ] Critical Badge: Boolean indicator
- [ ] Row Actions: Edit (pencil), Delete (trash) buttons

### Hold Items Table (Detail Page)

- [ ] Columns: Reference Type, Reference ID/Number, Quantity Held, UOM, Location
- [ ] Display Only: No edit/delete actions
- [ ] Empty State: Message if no items in hold

---

## Workflows

### Create Hold Workflow

- [ ] Step 1: Click "Create Hold" button → HoldForm modal opens
- [ ] Step 2: Fill reason (10-500 chars), select hold type, select priority
- [ ] Step 3: Click "Add Items" → ItemSelector opens
- [ ] Step 4: Toggle item type (LP/WO) → Search items → Select with checkboxes
- [ ] Step 5: Click "Add X Items" → Items added to table in modal
- [ ] Step 6: Click delete/trash on item rows to remove items
- [ ] Step 7: Click "Create Hold" button → Form submits → Navigate to detail page

### Release Hold Workflow

- [ ] Step 1: Navigate to active hold detail page
- [ ] Step 2: Click "Release Hold" button → ReleaseModal opens
- [ ] Step 3: Select disposition (Release/Rework/Scrap/Return)
- [ ] Step 4: If Scrap selected, warning shown; additional confirmation required
- [ ] Step 5: Enter release notes (10-1000 chars required)
- [ ] Step 6: Click "Release Shipment" button → Submit → Status updates to "released"
- [ ] Step 7: Release info section appears with user, date, notes, disposition

### Delete Hold Workflow

- [ ] Condition: Only available for active holds with 0 items
- [ ] Step 1: Click Delete button → DeleteConfirmDialog opens
- [ ] Step 2: Click Delete to confirm → Hold removed from database
- [ ] Step 3: Redirect to holds list → Hold no longer displayed

### Create Specification Workflow

- [ ] Step 1: Click "Create Specification" button → Navigate to `/quality/specifications/new`
- [ ] Step 2: Select product from dropdown
- [ ] Step 3: Enter name (3-200 chars), description, effective date
- [ ] Step 4: Enter expiry date (must be > effective date)
- [ ] Step 5: Enter review frequency (1-3650 days)
- [ ] Step 6: Click "Create Specification" → Submit form
- [ ] Step 7: Navigate to specification detail page → Status is "draft"

### Approve Specification Workflow

- [ ] Step 1: Navigate to draft specification detail
- [ ] Step 2: Click "Approve" button → ApproveModal opens
- [ ] Step 3: Enter approval notes
- [ ] Step 4: Click "Approve" button → Submit → Specification status changes to "active"
- [ ] Step 5: Edit button hidden, "Complete Review" button appears

### Clone Specification Workflow

- [ ] Step 1: Navigate to active specification detail
- [ ] Step 2: Click "Clone" button → CloneVersionDialog opens
- [ ] Step 3: Dialog shows new version number
- [ ] Step 4: Click "Create Draft" → New draft created
- [ ] Step 5: Navigate to new specification detail page

### Settings Edit Workflow

- [ ] Step 1: Navigate to `/quality/settings`
- [ ] Step 2: Only admin/owner/QA manager users see Save button; others see read-only view
- [ ] Step 3: Modify settings in collapsible sections
- [ ] Step 4: "Unsaved changes" warning appears
- [ ] Step 5: Click "Save" button → Submit changes → Toast success
- [ ] Step 6: Refresh page → Settings changes persisted

---

## Error States

### Loading States

- [ ] Skeleton Loaders: Displayed for table rows, cards, and form sections
- [ ] Spinner Icon: Animated RefreshCw icon during async operations
- [ ] Loading Text: "Creating...", "Saving...", "Deleting..." shown on buttons

### Error Alerts

- [ ] Error Box: Red border and background, AlertCircle icon
- [ ] Error Message: Clear text describing what went wrong
- [ ] Retry Button: "Retry" or "Refresh" button to attempt operation again
- [ ] Back Button: Alternative navigation option to return to previous page

### Empty States

- [ ] Icon: Contextual icon (Shield for holds, etc.)
- [ ] Heading: "No Quality Holds" or similar
- [ ] Description: Brief explanation
- [ ] Action Button: "Create Hold" or "Create Specification" button to start workflow

### Validation Errors

- [ ] Field Highlight: Red border on invalid input
- [ ] Error Message: Red text below field
- [ ] Toast Error: For form submission errors
- [ ] Modal Stays Open: Form doesn't close on validation error

### Accessibility & Keyboard Navigation

- [ ] Tab Navigation: Move through all form fields and buttons
- [ ] Enter Key: Submit forms, confirm dialogs
- [ ] Escape Key: Close modals and dialogs
- [ ] Arrow Keys: Navigate dropdown and radio options
- [ ] Space: Toggle checkboxes and buttons
- [ ] ARIA Labels: All inputs and buttons have semantic labels
- [ ] Focus Visible: Clear focus indicators on all interactive elements

---

## Permission-Based Variations

### Quality Holds

- [ ] All Users: View holds list, view hold details, search/filter
- [ ] QA Manager: Can create holds, release holds, approve releases
- [ ] Admin: Full access including delete

### Quality Specifications

- [ ] All Users: View specifications list, view specification details
- [ ] Quality Manager: Can create specifications, edit drafts, approve
- [ ] Admin: Full access including delete drafts

### Quality Settings

- [ ] Authenticated Users: View settings in read-only mode
- [ ] Admin/Owner/QA Manager: Edit and save settings
- [ ] Save Button: Hidden for non-authorized users

---

**Test Coverage**: 100% of Quality module interactive elements  
**Last Updated**: 2026-02-08
