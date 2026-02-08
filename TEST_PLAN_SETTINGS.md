# Settings Module Test Plan

**Module**: `app/(authenticated)/settings`  
**Last Updated**: February 8, 2026

---

## 📋 Settings Dashboard

### Buttons
- [ ] Edit Organization Profile: Navigates to organization settings (admin only)
- [ ] Manage Users & Roles: Navigates to user management page
- [ ] Manage Infrastructure: Navigates to warehouses page
- [ ] Manage Master Data: Navigates to allergens page
- [ ] Manage Integrations: Navigate to API keys (future)
- [ ] Manage System: Navigates to modules page
- [ ] Manage Security: Navigates to security settings page
- [ ] View All Audit Logs: Navigates to audit logs (future)

### Forms
- [ ] No forms on dashboard (read-only)

### Modals
- [ ] None on dashboard

### Tables
- [ ] None on dashboard (card-based layout only)

### Workflows
- [ ] Page load: Cards display with role-based visibility
- [ ] Quick access navigation: Clicking cards navigates to respective settings page
- [ ] Activity section: Shows recent activity from audit log
- [ ] Organization summary: Displays company info

### Error States
- [ ] Loading state: Skeleton loaders for cards
- [ ] Error state: Error card with Retry button
- [ ] No permission: Dashboard with limited visible cards
- [ ] Empty state: Setup wizard promotion for new org

---

## 📋 Organization Settings

### Buttons
- [ ] Upload Logo: Opens file picker (accepts jpg, png, webp)
- [ ] Change Logo: Shows when logo exists
- [ ] Remove Logo: Deletes current logo
- [ ] Save Changes: Submits form, disabled during submission
- [ ] Reset: Discards changes, resets to fetched values

### Forms
- [ ] Company name: Text input, required, placeholder "Acme Corp"
- [ ] Address: Text input, optional
- [ ] City: Text input, optional, placeholder "Warsaw"
- [ ] Postal code: Text input, optional
- [ ] Country: Text input, optional, ISO 2-letter code
- [ ] VAT/NIP: Text input, optional
- [ ] Date format: Dropdown (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- [ ] Number format: Dropdown (1,234.56 | 1.234,56 | 1 234.56)
- [ ] Unit system: Dropdown (Metric, Imperial)
- [ ] Timezone: Text input, IANA format, required
- [ ] Default currency: Dropdown (PLN, EUR, USD, GBP)
- [ ] Default language: Dropdown (Polish, English)

### Modals
- [ ] Logo upload modal: File picker, size validation (2MB max)

### Tables
- [ ] None in organization settings

### Workflows
- [ ] Fetch settings on page load
- [ ] Submit form: Validates all fields, submits to API
- [ ] Logo upload: Uploads file, shows preview, deletes on remove
- [ ] Success toast: Displays "Organization settings updated successfully"
- [ ] Error handling: Toast shows API error message

### Error States
- [ ] Loading: Spinner centered
- [ ] Error: Error toast notification
- [ ] Validation error: Inline error messages
- [ ] File too large: "File must be less than 2MB"
- [ ] Invalid file type: "Only JPG, PNG, WebP accepted"

---

## 📋 User Management

### Buttons
- [ ] Add User: Opens user invite modal
- [ ] Edit (per user): Opens edit drawer
- [ ] Delete/Deactivate: Shows confirmation dialog
- [ ] Resend Invitation: Resends invite to pending user (invitations tab)
- [ ] Copy Link: Copies invitation token
- [ ] Send Another: Copies new invitation link

### Forms
- [ ] Search input: Debounced (300ms), searches name/email
- [ ] First name: Text input, required
- [ ] Last name: Text input, required
- [ ] Email: Text input, required, validates format
- [ ] Role: Dropdown, required (Admin, Manager, Operator, Viewer, etc.)
- [ ] Department: Text input, optional

### Modals
- [ ] Add User modal: Form with invite flow, shows success with token
- [ ] Invitation Modal: Displays token, copy button, QR code (future)
- [ ] Edit User Drawer: Allows updating name, role, department
- [ ] Deactivate Confirmation: Confirms action, warns about logout

### Tables
- [ ] Users table: Name, Email, Role, Status, Last Login, Actions
- [ ] Invitations table: Email, Sent Date, Expires, Status, Actions

### Workflows
- [ ] Load users: Fetches with filters applied
- [ ] Create user: Opens modal, submits invite, shows token
- [ ] Edit user: Opens drawer, updates fields, saves
- [ ] Deactivate user: Shows confirmation, deactivates, logs out
- [ ] Resend invitation: Resends invite to pending user
- [ ] Filter users: By role, by status
- [ ] Search users: Debounced input filters list

### Error States
- [ ] User not found: "No users found" empty state
- [ ] Email exists: "Email already in use"
- [ ] API error: Toast shows error message
- [ ] Loading: Skeleton rows in table
- [ ] Permission denied: Buttons disabled/hidden

---

## 📋 Warehouses Management

### Buttons
- [ ] Add Warehouse: Opens create modal (permission-gated)
- [ ] Edit: Opens edit modal
- [ ] Set Default: Shows confirmation dialog
- [ ] Manage Locations: Navigates to locations page
- [ ] Disable/Enable: Inline action or dialog
- [ ] Delete: Shows confirmation (if not default)

### Forms
- [ ] Search input: Searches warehouse code/name
- [ ] Warehouse code: Text input, required, 2-10 uppercase chars
- [ ] Name: Text input, required, max 100 chars
- [ ] Address: Text input, optional
- [ ] City: Text input, optional
- [ ] Postal code: Text input, optional
- [ ] Country: Text input, optional
- [ ] Max pallets: Number input, optional
- [ ] Manager: User select dropdown, optional
- [ ] Active status: Toggle

### Modals
- [ ] Create/Edit warehouse modal: 2-step form (basic info, capacity)
- [ ] Set Default confirmation: Confirms default warehouse change
- [ ] Disable confirmation: Warns about impact

### Tables
- [ ] Warehouses table: Code, Name, Location, Manager, Status, Default badge, Capacity %, Actions
- [ ] Pagination: 20 items per page

### Workflows
- [ ] Load warehouses: Fetches all with filters
- [ ] Create warehouse: Opens modal, saves, refreshes list
- [ ] Edit warehouse: Opens modal, updates, refreshes
- [ ] Set default: Shows confirmation, updates default
- [ ] Disable warehouse: Confirms action, disables
- [ ] Search/filter: Real-time filtering by type, region, status
- [ ] Pagination: Navigate between pages

### Error States
- [ ] Duplicate code: "Code already exists"
- [ ] Required fields: "Field is required" messages
- [ ] API error: Toast with error message
- [ ] 409 Conflict: "Cannot delete warehouse with active operations"
- [ ] Empty state: "No warehouses found"

---

## 📋 User Roles & Permissions

### Buttons
- [ ] Export to CSV: Downloads permissions matrix
- [ ] Print: Opens print dialog

### Forms
- [ ] None (read-only view)

### Modals
- [ ] None

### Tables
- [ ] Permission matrix: Rows = roles, columns = modules, cells = ✓ or blank

### Workflows
- [ ] Load permissions: Fetches role/permission matrix on page load
- [ ] Export CSV: Downloads matrix as CSV file
- [ ] Print: Opens browser print dialog (optimized layout)
- [ ] Display legend: Shows ✓ = granted, blank = denied

### Error States
- [ ] Loading: Skeleton for rows/columns
- [ ] Error: Banner with Retry button
- [ ] Empty: "No roles found"

---

## 📋 Security Settings

### Buttons
- [ ] Terminate Session: Per-session red button
- [ ] Change Password: Submits form
- [ ] Show/Hide Password: Toggle visibility on password fields

### Forms
- [ ] Current password: Password input, required, show/hide toggle
- [ ] New password: Password input, required, min 8 chars, show/hide toggle
- [ ] Confirm password: Password input, required, must match new password, show/hide toggle
- [ ] Password strength indicator: Visual strength meter (weak/medium/strong)

### Modals
- [ ] Terminate Session confirmation: Confirms device logout
- [ ] Change Password success: Toast shows "Password changed, logging out..."

### Tables
- [ ] Active sessions table: Device, IP, Location, Last Activity, Current indicator, Actions

### Workflows
- [ ] Load sessions: Fetches all active sessions on page load
- [ ] Terminate session: Shows confirmation, logs device out
- [ ] Change password: Validates fields, submits, logs out all sessions
- [ ] Password strength: Updates as user types
- [ ] Redirect after password change: Auto-redirect to login after 2s

### Error States
- [ ] Current password incorrect: "Incorrect password"
- [ ] Passwords don't match: "Passwords do not match"
- [ ] Password too weak: Shows strength requirements
- [ ] API error: Toast with error message
- [ ] Empty sessions: "No active sessions"

---

## 📋 Allergens Management

### Buttons
- [ ] None (read-only list)

### Forms
- [ ] Search input: Searches all language fields + code

### Modals
- [ ] None

### Tables
- [ ] Allergens table: Code, Icon, Name (EN, PL, DE, FR), EU Symbols

### Workflows
- [ ] Load allergens: Fetches 14 EU-mandated allergens
- [ ] Search: Filters across all language fields
- [ ] Display: Shows allergen names in 4 languages

### Error States
- [ ] Loading: Skeleton rows
- [ ] Error: Message with Retry button
- [ ] Empty: "No allergens found"

---

## 📋 Tax Codes Management

### Buttons
- [ ] Add Tax Code: Opens create modal
- [ ] Edit: Opens edit modal
- [ ] Set Default: Shows confirmation dialog
- [ ] Delete: Shows confirmation dialog

### Forms
- [ ] Search input: Searches code, name, country
- [ ] Tax code: Text input, required, 2-20 alphanumeric, unique
- [ ] Name: Text input, required, max 100 chars
- [ ] Rate: Number input, required, 0-100% with decimals
- [ ] Country: Dropdown, required, ISO 2-letter code
- [ ] Valid from: Date picker, required
- [ ] Valid until: Date picker, optional
- [ ] Description: Textarea, optional

### Modals
- [ ] Create/Edit tax code modal: Form with validation
- [ ] Set Default confirmation: Confirms default for country
- [ ] Delete confirmation: Warns about existing usage

### Tables
- [ ] Tax codes table: Code, Name, Rate, Country, Valid From, Valid Until, Status, Default badge, Actions
- [ ] Pagination: 20 items per page

### Workflows
- [ ] Create tax code: Opens modal, validates, saves, refreshes
- [ ] Edit tax code: Opens modal, updates, refreshes
- [ ] Set default: Confirms, sets as default for country
- [ ] Delete tax code: Confirms, deletes, refreshes
- [ ] Search/filter: By code, country, status
- [ ] Pagination: Navigate between pages

### Error States
- [ ] Duplicate code: "Code already exists"
- [ ] Invalid rate: "Rate must be 0-100%"
- [ ] Invalid dates: "Valid from must be before valid until"
- [ ] Used in transactions: "Cannot delete, used in active transactions"
- [ ] Empty state: "No tax codes found"

---

## 📋 Machines Management

### Buttons
- [ ] Add Machine: Opens create modal
- [ ] View Details: Navigates to machine detail page
- [ ] Edit: Opens edit modal
- [ ] Delete: Shows confirmation dialog

### Forms
- [ ] Search input: Searches code, name, warehouse
- [ ] Machine code: Text input, required, uppercase, unique
- [ ] Name: Text input, required
- [ ] Type: Dropdown, required (Oven, Mixer, Extruder, Packaging, etc.)
- [ ] Warehouse: Dropdown, required
- [ ] Serial number: Text input, optional
- [ ] Max speed: Number input, optional (pcs/hour)
- [ ] Max weight: Number input, optional (kg)
- [ ] Max volume: Number input, optional (liters)
- [ ] Require calibration: Toggle
- [ ] Allow manual input: Toggle
- [ ] Track downtime: Toggle

### Modals
- [ ] Create/Edit machine modal: 3 tabs (Basic, Capacity, Configuration)
- [ ] Delete confirmation: Warns if assigned to production lines

### Tables
- [ ] Machines table: Code, Name, Type, Warehouse, Production Line, Status, Capacity, Last Maintenance, Actions
- [ ] Pagination: 25 items per page

### Workflows
- [ ] Load machines: Fetches all with filters
- [ ] Create machine: Opens modal, saves, refreshes
- [ ] Edit machine: Opens modal, updates, refreshes
- [ ] Delete machine: Confirms, checks dependencies, deletes
- [ ] Filter by type, warehouse, status
- [ ] Search machines by code or name

### Error States
- [ ] Used in active operations: "Cannot delete, assigned to production lines"
- [ ] Duplicate code: "Code already exists"
- [ ] Missing required field: "Field is required"
- [ ] Empty state: "No machines found"
- [ ] Permission denied: Buttons disabled/hidden for non-managers

---

## 📋 Locations Management

### Buttons
- [ ] Add Location: Opens create modal
- [ ] QR Code: Opens location detail modal with scannable QR
- [ ] Edit: Opens edit modal
- [ ] Archive: Soft deletes location
- [ ] Delete: Hard deletes location
- [ ] Download QR: Downloads QR code PNG
- [ ] Print QR: Opens print dialog for QR code

### Forms
- [ ] Search input: Searches code, name
- [ ] Location code: Text input, required, format validation (WH-Z-A-R-001)
- [ ] Name: Text input, required
- [ ] Warehouse: Dropdown, required
- [ ] Level: Dropdown, required (Zone, Aisle, Rack, Bin)
- [ ] Type: Dropdown, required (Bulk, Pallet, Shelf, Floor, Staging)
- [ ] Parent location: Dropdown, optional, hierarchical validation
- [ ] Max pallets: Number input, optional
- [ ] Max weight: Number input, optional (kg)
- [ ] Description: Textarea, optional

### Modals
- [ ] Create/Edit location modal: Form with hierarchical validation
- [ ] Location Detail modal: Shows QR code, location path, details
- [ ] Archive confirmation: Confirms soft delete
- [ ] Delete confirmation: Confirms hard delete

### Tables
- [ ] Locations table: Code, Name, Warehouse, Level, Type, Path, Capacity, Status, Actions
- [ ] Pagination: Not used (load all)

### Workflows
- [ ] Load locations: Fetches all with hierarchical structure
- [ ] Create location: Opens modal, validates hierarchy, saves
- [ ] Edit location: Opens modal, updates, refreshes
- [ ] Archive location: Soft deletes, hides from list
- [ ] Hard delete: Confirms, deletes permanently
- [ ] Generate QR: Shows scannable QR code in modal
- [ ] Download/Print QR: Downloads PNG or opens print dialog

### Error States
- [ ] Invalid hierarchy: "Parent must be higher level than current"
- [ ] Default location: "Cannot delete warehouse default location"
- [ ] Duplicate code: "Code already exists"
- [ ] Empty state: "No locations found"
- [ ] Used in warehouse: "Cannot delete, used as warehouse default"

---

## 📋 Production Lines Management

### Buttons
- [ ] Add Production Line: Opens create modal
- [ ] Edit: Opens edit modal
- [ ] Delete: Shows confirmation dialog

### Forms
- [ ] Search input: Searches code, name
- [ ] Production line code: Text input, required, uppercase, unique
- [ ] Name: Text input, required
- [ ] Description: Textarea, optional
- [ ] Default output location: Dropdown, optional
- [ ] Machine sequencing: Drag-to-order list with add/remove
- [ ] Compatible products: Multi-select or allow all

### Modals
- [ ] Create/Edit modal: 3 tabs (Basic, Machines, Products)
- [ ] Delete confirmation: Warns if used in work orders

### Tables
- [ ] Production lines table: Code (sortable), Name (sortable), Output Location, Machines Count, Actions
- [ ] Sorting: Click headers to sort by Code or Name

### Workflows
- [ ] Load lines: Fetches all with sort options
- [ ] Create line: Opens modal, assigns machines, saves
- [ ] Edit line: Opens modal, updates, refreshes
- [ ] Delete line: Confirms, checks dependencies, deletes
- [ ] Sort by code/name: Click header to toggle sort
- [ ] Search: Real-time filter by code/name
- [ ] Machine sequencing: Drag machines to reorder

### Error States
- [ ] Duplicate code: "Code already exists"
- [ ] Used in work orders: "Cannot delete if used in active work orders"
- [ ] No machines assigned: "At least one machine must be assigned"
- [ ] Empty state: "No production lines found"

---

## 📋 Modules Management

### Buttons
- [ ] Enable Module: Toggle switch per module (opens confirmation)
- [ ] Disable Module: Toggle switch per module (opens confirmation)
- [ ] Expand All: Opens all module groups
- [ ] Collapse All: Closes all module groups

### Forms
- [ ] None (toggle-based)

### Modals
- [ ] Enable confirmation: Shows description, dependencies
- [ ] Disable confirmation: Shows warning if blockers (dependent modules)

### Tables
- [ ] None (card-based layout)

### Workflows
- [ ] Load modules: Fetches module status grouped by tier
- [ ] Expand group: Click header to expand, see modules
- [ ] Toggle module: Click switch to enable/disable
- [ ] Confirmation: Modal shows impact before toggle
- [ ] Auto-refresh: Page reloads after successful toggle
- [ ] Show dependencies: Lists dependent modules if disabling

### Error States
- [ ] Blocker modules: "Cannot disable, required by: {modules}"
- [ ] API error: Toast with error message
- [ ] Loading: Skeleton for groups/cards

---

## 📋 Product Types Management

### Buttons
- [ ] Add Custom Type: Opens create modal
- [ ] Status toggle: Activate/deactivate custom types
- [ ] Edit: Opens edit modal
- [ ] Delete: Shows confirmation dialog

### Forms
- [ ] Product type code: Text input, required, 2-10 uppercase letters, unique
- [ ] Name: Text input, required, max 100 chars

### Modals
- [ ] Create modal: Code and name fields
- [ ] Edit modal: Code disabled (read-only), name editable
- [ ] Delete confirmation: Shows if products use type (may deactivate instead)

### Tables
- [ ] Product types table: Code (monospace), Name, Type (Default/Custom badge), Status toggle, Actions
- [ ] Rows: Default types (RM, WIP, FG, PKG, BP) + custom types

### Workflows
- [ ] Load types: Fetches default + custom types
- [ ] Create custom type: Opens modal, validates code, saves
- [ ] Edit custom type: Opens modal, updates name only
- [ ] Toggle status: Activate/deactivate custom types
- [ ] Delete type: Confirms, may deactivate if products exist
- [ ] Reserved codes: Prevents creating RM, WIP, FG, PKG, BP

### Error States
- [ ] Reserved code: "This code is reserved for default types"
- [ ] Duplicate code: "This code already exists"
- [ ] Products using type: "Will be deactivated instead of deleted"
- [ ] Empty state: "No product types found"

---

## 📋 Planning Settings

### Buttons
- [ ] Cancel: Discards changes
- [ ] Save Changes: Submits form (disabled if no changes)

### Forms
- [ ] Auto-approve PO under amount: Currency input, optional
- [ ] Require approval chain: Toggle
- [ ] Default lead days: Number input, required, min 1, max 365
- [ ] Allow partial transfer: Toggle
- [ ] Require transfer approval: Toggle
- [ ] Auto-complete transfers: Toggle
- [ ] Auto-create WO on plan: Toggle
- [ ] Require WO approval: Toggle
- [ ] Planned lead days: Number input, required, min 1, max 365

### Modals
- [ ] None

### Tables
- [ ] None

### Workflows
- [ ] Load settings: Fetches on page load
- [ ] Update setting: Toggle or enter value
- [ ] Validate: Number ranges enforced
- [ ] Save: Submits all changes via API
- [ ] Feedback: Toast shows success or error

### Error States
- [ ] Loading: Skeleton for form
- [ ] Error loading: "Failed to load settings" with Retry
- [ ] Validation error: "Value must be between 1 and 365"
- [ ] API error: Toast with error message

---

## 📋 Production Execution Settings

### Buttons
- [ ] None (all toggles/inputs)

### Forms
- [ ] Allow pause WO: Toggle
- [ ] Auto-complete WO: Toggle
- [ ] Require operation sequence: Toggle
- [ ] Require QA on output: Toggle
- [ ] Auto-create by-product LPs: Toggle
- [ ] Allow over-consumption: Toggle
- [ ] Dashboard refresh interval: Number input (30-300 seconds)

### Modals
- [ ] None

### Tables
- [ ] None

### Workflows
- [ ] Load settings: Fetches on page load
- [ ] Toggle setting: Immediate update, no save needed
- [ ] Update number: Number input updates on blur/Enter
- [ ] Feedback: Toast confirms update
- [ ] Validation: Refresh interval must be 30-300 seconds

### Error States
- [ ] Loading: Spinner in center
- [ ] Error: "Failed to load settings" with Retry
- [ ] Invalid interval: Red error "Must be 30-300 seconds"
- [ ] API error: Toast with error message

---

## 📋 Warehouse Settings

### Buttons
- [ ] None (placeholder page)

### Forms
- [ ] Placeholder for future warehouse-specific settings

### Modals
- [ ] None

### Tables
- [ ] None

### Workflows
- [ ] Page load: Shows placeholder message

### Error States
- [ ] None (no interactive elements yet)

---

## ✅ Permission Variations

### Admin/Super Admin
- [ ] All buttons visible and enabled
- [ ] Can manage all settings sections
- [ ] Can create, edit, delete all entities

### Warehouse Manager
- [ ] Infrastructure page (warehouses, locations, machines)
- [ ] Cannot access users, roles, modules, security settings

### Production Manager
- [ ] Infrastructure page (machines, production lines)
- [ ] Production execution settings
- [ ] Cannot access users, security, organization settings

### Quality Manager
- [ ] Master data page (allergens, tax codes)
- [ ] Cannot modify (read-only)
- [ ] Cannot access users, security

### Regular Users
- [ ] Security settings (own password, sessions)
- [ ] Cannot access any admin/infrastructure pages

---

## ✅ Testing Checklist Summary

- [ ] All settings pages load correctly
- [ ] Forms validate all required fields
- [ ] CRUD operations work (Create, Read, Update, Delete)
- [ ] Permission checks prevent unauthorized access
- [ ] Search and filter functions work
- [ ] Modals open/close correctly
- [ ] Confirmation dialogs work before destructive actions
- [ ] Toast notifications display appropriately
- [ ] File uploads work (logo, size validation)
- [ ] API errors handled gracefully
- [ ] Loading states display correctly
- [ ] Empty states show helpful messages
- [ ] Navigation links work correctly
- [ ] Pagination works with correct page counts
- [ ] Keyboard navigation accessible throughout
- [ ] Form resets on successful submission

---

**Generated**: 2026-02-08  
**Version**: 1.0 (Unified Format)
