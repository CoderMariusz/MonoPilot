# Epic 5 Batch C: Stories Implementation
## Scanner & Offline Operations

**Batch:** 5C
**Stories:** 5.23 - 5.36 (14 stories)
**Status:** Drafted
**Effort:** ~90-110 hours

---

## Story 5.23: Scanner Guided Workflows

**User Story:**
> As an **Operator**, I want guided scanner workflows, so that I don't make mistakes.

**Story Points:** 8

### Acceptance Criteria

#### AC 1: Scanner Home Menu
- **Given** opening /scanner
- **When** authenticated
- **Then** show main menu with large buttons (48px min touch targets):
  - 📦 **Receive** - Receive goods from PO/ASN
  - 💨 **Put-Away** - Move from receiving to storage (future P1)
  - 🎯 **Pick** - Move from storage to production/shipping (future P1)
  - 🚚 **Move** - Move LP between locations
  - 📊 **Inventory Count** - Cycle count operation

#### AC 2: Receive Workflow (State Machine)
- **State 1: Scan PO/ASN**
  - Display: "Scan PO Number or ASN Number"
  - Input: barcode/text (PO-XXX or ASN-XXX)
  - Validate: PO exists, status Confirmed+
  - Next: State 2

- **State 2: Display Items to Receive**
  - Display: "PO #12345: 3 items to receive"
  - Table: Product, Qty to Receive
  - Next: State 3 (scan first item)

- **State 3: Scan Product**
  - Display: "Scan Product Barcode"
  - Input: product barcode
  - Validate: product exists, in PO items
  - Feedback: ✅ "Flour-001 found" (green)
  - Next: State 4

- **State 4: Enter Qty**
  - Display: "Qty received: [0] kg"
  - Input: numeric keypad or text
  - Validate: qty > 0, qty <= remaining in PO
  - Next: State 5

- **State 5: Enter Batch**
  - Display: "Batch Number:"
  - Input: text field
  - Validate: not empty
  - Next: State 6

- **State 6: Scan Location**
  - Display: "Scan Location Barcode"
  - Input: location barcode
  - Validate: location exists, active, in same warehouse
  - Feedback: ✅ "Storage A-01" (green)
  - Next: State 7

- **State 7: Confirm & Summarize**
  - Display: Summary of receiving
    - Product: Flour-001
    - Qty: 50 kg
    - Batch: BATCH-123
    - Location: WH-A-01
  - Buttons: "Confirm" / "Cancel"
  - On Confirm:
    - Call API: POST /api/warehouse/stock-moves or GRN creation
    - Show: ✅ "LP created: LP-20250127-0001"
    - Auto-proceed (2 sec delay) or show "Next" button
    - Return to Step 2 for next item or quit

#### AC 3: Workflow Navigation
- **Given** in any workflow state
- **When** clicking "Back" button
- **Then** go to previous state (with data preserved)
- **And** clicking "Home" → confirm "Exit workflow?" then return to menu

#### AC 4: Error Handling in Workflow
- **Given** barcode doesn't match expected
- **When** validation fails
- **Then** show:
  - ❌ "Product not found: ABC-123"
  - Options: "Retry" / "Cancel"
  - Do NOT proceed to next state

#### AC 5: Mobile Optimization
- **Given** viewing scanner workflow
- **When** on mobile device
- **Then** ensure:
  - Full-width buttons and inputs
  - Large text (16px+)
  - Numeric keypad for qty input
  - Landscape orientation support (auto-rotate)
  - No horizontal scrolling

### Technical Tasks

**Backend**
- [ ] Implement state machine endpoints:
  - POST /api/scanner/workflows/receive/start
  - POST /api/scanner/workflows/receive/step/:step/validate
  - POST /api/scanner/workflows/receive/complete

- [ ] Workflow validation per state

**Frontend**
- [ ] Create /scanner page (PWA, service worker ready)
- [ ] Create ScannerHome component (menu buttons)
- [ ] Create WorkflowContainer component (state machine container)
- [ ] Create workflow steps:
  - ScanPOStep, DisplayItemsStep, ScanProductStep, EnterQtyStep, etc.
- [ ] Create FormInputs:
  - BarcodeInput (focus-managed, auto-submit on scan)
  - NumericInput (with keypad)
  - TextInput

- [ ] Create ErrorBanner component (❌ red banner)
- [ ] Create SuccessBanner component (✅ green banner)

**Tests**
- [ ] Unit: state transitions (all valid paths)
- [ ] Unit: invalid barcode → error state
- [ ] Integration: full workflow from PO to completion
- [ ] E2E: open scanner → receive workflow → complete

### Definition of Done
- ✅ All 5 workflow states working
- ✅ Navigation (back/home) functional
- ✅ Mobile optimized
- ✅ Error handling at each step
- ✅ E2E: complete full receive workflow

**Dependencies:** Requires Story 5.11 (GRN creation)
**Estimated Effort:** 8 hours

---

## Story 5.24: Scanner Barcode Validation

**User Story:**
> As a **System**, I want to validate scanned barcodes, so that correct items are processed.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: Barcode Format Support
- **Given** scanning barcode
- **When** validating
- **Then** support formats:
  - **LP Barcode**: `LP-20250127-0001` (from label)
  - **Product Barcode**: EAN-13, EAN-8, Code128
  - **Location Barcode**: `WH-A-01` (location code)
  - **PO Barcode**: `PO-12345`
  - **WO Barcode**: `WO-999` (Work Order)

#### AC 2: Real-time Validation
- **Given** barcode scanned
- **When** barcode matches expected
- **Then** show:
  - ✅ Green banner: "Flour-001 (Product found)"
  - Auto-proceed to next state after 1 sec
- **When** barcode doesn't match
- **Then** show:
  - ❌ Red banner: "Expected: Product. Got: Location"
  - Beep sound (if enabled)
  - Stay in current state (require retry)

#### AC 3: Expected Value Display
- **Given** workflow expects specific barcode type
- **When** scanning wrong type
- **Then** show:
  - "❌ Expected: Product (LP-001 found)"
  - Suggestion: "Scan product barcode for [Product-Name]"

#### AC 4: Barcode Input Methods
- **Given** on scanner page
- **When** scanning
- **Then** support:
  - Physical barcode scanner (auto-input to field)
  - Manual text input (for fallback)
  - Camera (Barcode Detection API - future P1)

### Technical Tasks

**Backend**
- [ ] Create barcode validation service:
  - Identify barcode type (regex patterns)
  - Lookup in database (LP, Product, Location, PO, WO)
  - Return validation result + entity details

- [ ] Implement POST /api/scanner/validate-barcode
  - Input: barcode string, expected_type (optional)
  - Output: { valid: true/false, type, entity_id, entity_data, message }

**Frontend**
- [ ] Create BarcodeInput component
  - Auto-focus on load
  - Auto-submit on enter
  - Clear field after validation
  - Show validation result (✅/❌ banner)

- [ ] Create barcode validator utility (client-side format check)

**Tests**
- [ ] Unit: barcode format detection (LP, EAN-13, Code128, etc.)
- [ ] Integration: validate barcode → lookup → return entity
- [ ] E2E: scan valid → green, scan invalid → red

### Definition of Done
- ✅ All barcode formats recognized
- ✅ Real-time validation working
- ✅ Correct/incorrect feedback clear
- ✅ Auto-proceed on success
- ✅ Error messages helpful

**Dependencies:** Requires Story 5.23 (Workflows)
**Estimated Effort:** 5 hours

---

## Story 5.25: Scanner Feedback

**User Story:**
> As an **Operator**, I want clear feedback on scanner, so that I know operation status.

**Story Points:** 3

### Acceptance Criteria

#### AC 1: Visual Feedback
- **Given** operation succeeds
- **When** completed
- **Then** show:
  - ✅ Green banner: "LP created: LP-20250127-0001"
  - Duration: 2-3 seconds auto-dismiss
  - Icon: checkmark

- **Given** operation fails
- **When** validation error
- **Then** show:
  - ❌ Red banner: "Product not found"
  - Duration: persistent (require action)
  - Icon: X mark
  - "Retry" or "Cancel" button

- **Given** operation warning
- **When** qty matches with tolerance
- **Then** show:
  - ⚠️ Yellow banner: "Qty mismatch (expected 100, received 95)"
  - Buttons: "Accept" / "Adjust"

#### AC 2: Haptic Feedback (Vibration)
- **Given** operation completes
- **When** warehouse_settings.enable_haptic = true
- **Then** vibrate device:
  - Success: 1x short vibration (50ms)
  - Error: 3x short vibrations (50ms, 100ms gap)
  - Warning: 2x medium vibrations (100ms, 100ms gap)

#### AC 3: Audio Feedback
- **Given** operation completes
- **When** warehouse_settings.enable_audio = true
- **Then** play sound:
  - Success: beep (1000 Hz, 200ms)
  - Error: buzz (200 Hz, 500ms)
  - Warning: chirp (500 Hz, 300ms)

#### AC 4: Auto-Proceed
- **Given** operation succeeds
- **When** displaying success banner
- **Then** auto-proceed to next state after 2 seconds (configurable)
- **And** show countdown: "Next in 2..."
- **And** allow manual "Next" button to skip wait

### Technical Tasks

**Backend**
- [ ] Ensure API responses include result status (success/error/warning)

**Frontend**
- [ ] Create FeedbackBanner component (success/error/warning variants)
- [ ] Implement Vibration API:
  - navigator.vibrate() for haptic feedback
  - Fallback: silent if API unavailable

- [ ] Implement Audio API:
  - Web Audio API for beep/buzz/chirp sounds
  - Settings: enable_haptic, enable_audio

- [ ] Create auto-proceed logic with countdown

**Tests**
- [ ] Unit: feedback message generation
- [ ] E2E: operation success → see green banner → auto-proceed

### Definition of Done
- ✅ Visual feedback working
- ✅ Haptic feedback optional
- ✅ Audio feedback optional
- ✅ Auto-proceed with countdown
- ✅ Settings configurable

**Dependencies:** Requires Story 5.23
**Estimated Effort:** 3 hours

---

## Story 5.26: Scanner Operations Menu

**User Story:**
> As an **Operator**, I want quick access to scanner operations, so that I can work efficiently.

**Story Points:** 3

### Acceptance Criteria

#### AC 1: Main Menu Layout
- **Given** opening /scanner
- **When** authenticated
- **Then** show menu with buttons (48px min):
  - **📦 Receive** (from ASN/PO)
  - **💨 Consume** (for WO - future P1)
  - **📤 Output** (for WO - future P1)
  - **🚚 Move** (location to location)
  - **📊 Inventory Count** (cycle count)

#### AC 2: Menu Button States
- **Given** modules configured
- **When** certain modules disabled
- **Then** hide irrelevant operations:
  - If Production disabled: hide Consume/Output
  - If Planning disabled: hide operations needing WO

#### AC 3: User Role Filtering
- **Given** user with warehouse role
- **When** viewing menu
- **Then** show only allowed operations:
  - warehouse role: Receive, Move, Count (no Consume)
  - operator role: Consume, Output, Move
  - viewer role: Count only

#### AC 4: Keyboard Shortcuts
- **Given** on scanner home
- **When** operator presses numeric key
- **Then** support shortcuts:
  - "1" → Receive
  - "2" → Consume
  - "3" → Output
  - "4" → Move
  - "5" → Count
  - "?" → Help

### Technical Tasks

**Backend**
- [ ] No backend changes needed (menu logic is frontend)

**Frontend**
- [ ] Create ScannerMenu component
  - Large buttons (48px+)
  - Icons + labels
  - Role-based visibility
  - Keyboard shortcut listeners

- [ ] Implement role filtering logic:
  - Check user.role from JWT
  - Show/hide buttons accordingly

**Tests**
- [ ] Unit: role filtering logic
- [ ] E2E: different users see different menus

### Definition of Done
- ✅ Menu buttons all functional
- ✅ Role-based filtering working
- ✅ Touch targets 48px+
- ✅ Keyboard shortcuts working

**Dependencies:** Requires Story 5.23
**Estimated Effort:** 3 hours

---

## Story 5.27: Scanner Session Timeout

**User Story:**
> As a **System**, I want to timeout inactive sessions, so that security is maintained.

**Story Points:** 3

### Acceptance Criteria

#### AC 1: Idle Timeout
- **Given** operator using scanner
- **When** idle for 5 minutes (default, configurable)
- **Then** show warning dialog:
  - "⏰ Session will expire in 30 seconds"
  - "Tap to continue" button
  - Auto-countdown timer

- **When** warning expires without interaction
- **Then** logout:
  - Clear auth tokens
  - Clear offline queue (or preserve for next session)
  - Redirect to login page

#### AC 2: Activity Detection
- **Given** timeout running
- **When** user interaction detected (tap, scan, input)
- **Then** reset timeout timer

#### AC 3: Settings Configuration
- **Given** Admin navigates to /settings/scanner
- **When** configuring timeout
- **Then** can set:
  - Idle timeout duration (default: 5 min, range: 1-30 min)
  - Warning delay before logout (default: 30 sec)
  - Enable/disable timeout

#### AC 4: Preserve Offline Queue
- **Given** session timing out
- **When** logout triggered
- **Then** preserve offline queue:
  - Store queue in IndexedDB
  - On next login: restore queue, offer to sync

### Technical Tasks

**Backend**
- [ ] No backend changes (session is frontend + JWT expiry)

**Frontend**
- [ ] Create SessionManager utility:
  - Track inactivity timer
  - Listen for user interactions
  - Show warning dialog
  - Handle logout

- [ ] Create TimeoutWarning modal:
  - Countdown timer display
  - "Continue" button

- [ ] Integrate with scanner pages:
  - All scanner pages should reset timeout on interaction

- [ ] Preserve offline queue on logout

**Tests**
- [ ] Unit: timeout logic (idle → warning → logout)
- [ ] Unit: activity detection resets timer
- [ ] E2E: be idle 5 min → see warning → wait 30s → logout

### Definition of Done
- ✅ Timeout working (logout after idle)
- ✅ Warning dialog shows
- ✅ Activity resets timer
- ✅ Offline queue preserved
- ✅ Settings configurable

**Dependencies:** Requires Story 5.23
**Estimated Effort:** 3 hours

---

## Story 5.28: Forward/Backward Traceability

**User Story:**
> As a **QC Manager**, I want to trace LP relationships, so that I can investigate issues.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: LP Trace UI
- **Given** viewing LP detail page
- **When** scrolling to "Traceability" section
- **Then** show two buttons:
  - "Trace Forward (Children)"
  - "Trace Backward (Parents)"

#### AC 2: Forward Trace
- **Given** clicking "Trace Forward"
- **When** page loads
- **Then** display tree visualization:
  - Parent LP (root): LP-001 (100 kg)
    - Child 1: LP-002 (50 kg, operation: split)
    - Child 2: LP-003 (50 kg, operation: split)
      - Grandchild: LP-004 (25 kg, operation: split)
  - Each LP clickable → view detail
  - Show operation type (split, merge, consume, produce)
  - Show timestamp and user

#### AC 3: Backward Trace
- **Given** clicking "Trace Backward"
- **When** page loads
- **Then** display tree visualization:
  - Child LP (root): LP-009 (25 kg)
    - Parent 1: LP-008 (50 kg, operation: split from)
      - Grandparent: LP-007 (100 kg, operation: split from)
  - Each LP clickable → view detail

#### AC 4: Full Genealogy Table
- **Given** in trace view
- **When** expanding genealogy table
- **Then** show:
  - All genealogy links in table format
  - Columns: Parent LP, Child LP, Operation, WO, Timestamp, User
  - Can sort by any column
  - Can export to CSV

### Technical Tasks

**Backend**
- [ ] Implement GET /api/warehouse/license-plates/:id/trace-forward
  - Use recursive CTE to get all descendants
  - Return tree structure (with parent-child relationships)
  - Limit depth to 10 levels (prevent infinite loops)

- [ ] Implement GET /api/warehouse/license-plates/:id/trace-backward
  - Use recursive CTE to get all ancestors
  - Return tree structure
  - Limit depth to 10 levels

**Frontend**
- [ ] Create TraceForwardModal component
  - Tree visualization (using tree library like react-tree)
  - Recursive rendering of genealogy

- [ ] Create TraceBackwardModal component
  - Same tree visualization

- [ ] Create GenealogyTable component
  - All genealogy links in table format
  - Export to CSV button

**Tests**
- [ ] Integration: create genealogy links → forward trace returns all descendants
- [ ] Integration: create genealogy links → backward trace returns all ancestors
- [ ] E2E: split LP 3 times → trace forward → see all children

### Definition of Done
- ✅ Forward trace shows all descendants
- ✅ Backward trace shows all ancestors
- ✅ Tree visualization clear and interactive
- ✅ Can click LP in tree → view detail
- ✅ Export to CSV working

**Dependencies:** Requires Batch 5A (genealogy)
**Estimated Effort:** 5 hours

---

## Story 5.29: Genealogy Recording

**User Story:**
> As a **System**, I want to record all LP relationships, so that traceability is complete.

**Story Points:** 3

### Acceptance Criteria

#### AC 1: Genealogy Recording (Already Implemented in 5.7)
- **Given** LP operation (split, merge, consume, produce)
- **When** operation completes
- **Then** automatically create genealogy record:
  - split: parent_lp_id (original), child_lp_id (new split LP)
  - merge: multiple parent_lp_ids (sources), one child_lp_id (target)
  - consume: parent_lp_id (input), child_lp_id (output), wo_id
  - produce: same as consume

#### AC 2: Genealogy Immutability
- **Given** genealogy record created
- **When** verifying audit trail
- **Then** ensure:
  - ✅ Records created_at, created_by_user_id
  - ❌ Cannot UPDATE genealogy record
  - ❌ Cannot DELETE genealogy record
  - ✅ Audit trail permanent

#### AC 3: Operation Type Semantics
- **Given** genealogy created
- **When** viewing operation_type
- **Then** display human-readable:
  - split = "Split"
  - merge = "Merged"
  - consume = "Consumed in WO"
  - produce = "Produced in WO"

### Technical Tasks

**Backend**
- [ ] Story 5.7 already implements genealogy creation
- [ ] No additional backend work needed

**Frontend**
- [ ] Add genealogy display to LP detail page
- [ ] Show operation type with labels

**Tests**
- [ ] Already tested in Story 5.7

### Definition of Done
- ✅ Genealogy recorded for all LP operations
- ✅ Immutable (no delete/update)
- ✅ Audit trail complete

**Dependencies:** Requires Story 5.7 (genealogy)
**Estimated Effort:** 3 hours (mostly UI display)

---

## Story 5.30: Source Document Linking

**User Story:**
> As a **Warehouse user**, I want LPs linked to source documents, so that I can trace origin.

**Story Points:** 3

### Acceptance Criteria

#### AC 1: LP Source Information
- **Given** LP created
- **When** recording creation
- **Then** store source info:
  - `source` field: 'receiving', 'production', 'transfer', 'manual'
  - Source document ID: po_id / grn_id / wo_id / to_id (as applicable)

#### AC 2: Source Display
- **Given** viewing LP detail
- **When** expanding "Source Document" section
- **Then** show:
  - Source Type: "Receiving"
  - Source Document: "GRN GRN-20250127-0001" (clickable link)
  - Related PO: "PO #12345" (clickable)
  - Date: when received

#### AC 3: Link Navigation
- **Given** clicking on source document link
- **When** source is GRN
- **Then** navigate to /warehouse/grns/:id
- **When** source is WO
- **Then** navigate to /production/work-orders/:id

#### AC 4: Polymorphic Sources
- **Given** LP from different sources
- **When** querying source
- **Then** support:
  - Receiving: po_id + grn_id
  - Production: wo_id
  - Transfer: from_to_id
  - Manual: null (no source document)

### Technical Tasks

**Backend**
- [ ] Add `source` and source_id fields to license_plates table
  - source VARCHAR(20): 'receiving', 'production', 'transfer', 'manual'
  - source_id UUID: polymorphic reference

- [ ] Update GRN creation (Story 5.11) to set:
  - LP.source = 'receiving'
  - LP.source_id = grn_id

- [ ] Implement GET /api/warehouse/license-plates/:id/source
  - Return source document details (PO, GRN, WO, etc.)

**Frontend**
- [ ] Add "Source Document" section to LP detail page
- [ ] Create SourceDocumentLink component
  - Show source type (badge)
  - Link to source document
  - Show related documents (PO if from GRN, etc.)

**Tests**
- [ ] Integration: create LP from GRN → source = 'receiving', source_id = grn_id
- [ ] E2E: view LP → click source → navigate to GRN detail

### Definition of Done
- ✅ LP linked to source document
- ✅ Source links navigable
- ✅ Multiple source types supported
- ✅ Source document displayed in LP detail

**Dependencies:** Requires Story 5.11 (GRN), Batch 5A (LP)
**Estimated Effort:** 3 hours

---

## Story 5.31: Warehouse Settings Configuration

**User Story:**
> As an **Admin**, I want to configure Warehouse module settings, so that operations match our process.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: Settings Page
- **Given** Admin navigates to /settings/warehouse
- **When** page loads
- **Then** show form with sections:
  - **License Plates**
    - LP Number Format: text field (default: LP-YYYYMMDD-NNNN)
    - Pallet Format: text field
  - **Receiving**
    - Allow Over-Receipt: checkbox
    - Auto-Print Labels: checkbox
    - Printer Name: text field
    - Label Format: dropdown (ZPL, PDF)
  - **Scanner**
    - Session Timeout (min): number field (default: 5)
    - Queue Max Size: number field (default: 100)
    - Queue Warning Threshold (%): number field (default: 80)
    - Auto-Sync Enabled: checkbox
    - Sync Batch Size: number field (default: 10)
    - Failed Queue Retention (days): number field (default: 7)
    - Enable Haptic Feedback: checkbox
    - Enable Audio Feedback: checkbox

#### AC 2: Save Settings
- **Given** form filled with values
- **When** clicking "Save"
- **Then**:
  - Validate all values
  - Update warehouse_settings record
  - Clear any affected caches
  - Show success: "Settings saved"
  - Emit event to refresh scanner if open

#### AC 3: Validation
- **Given** saving settings
- **When** validating
- **Then** reject if:
  - Session Timeout < 1 min
  - Queue Max Size < 10
  - Invalid format strings

#### AC 4: Reset to Defaults
- **Given** on settings page
- **When** clicking "Reset to Defaults"
- **Then** show confirmation dialog
- **And** on confirm: reset all settings to defaults

### Technical Tasks

**Backend**
- [ ] Update warehouse_settings table with scanner_* columns (see tech-spec)
- [ ] Implement GET/PATCH /api/warehouse/settings
  - GET: return current settings
  - PATCH: update settings + cache invalidation

**Frontend**
- [ ] Create /app/settings/warehouse page
- [ ] Create WarehouseSettingsForm component
  - Form validation
  - Save handler
  - Reset button

- [ ] Create hooks/useWarehouseSettings.ts for settings management

**Tests**
- [ ] Unit: validation logic (timeout < 1 min)
- [ ] Integration: update settings → verify in DB
- [ ] E2E: update LP format → verify format used in creation

### Definition of Done
- ✅ All settings displayed and editable
- ✅ Validation working
- ✅ Settings saved to DB
- ✅ Defaults button working
- ✅ Changes applied immediately

**Dependencies:** Independent
**Estimated Effort:** 5 hours

---

## Story 5.32: Receive from PO (Desktop)

**User Story:**
> As a **Warehouse user**, I want to receive goods against PO from desktop, so that I can process deliveries.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: Desktop Receiving Page
- **Given** navigating to /warehouse/receiving
- **When** page loads
- **Then** show form:
  - PO Number (autocomplete dropdown)
  - PO details (read-only): supplier, total qty, status
  - Items table with input fields:
    - Product (read-only)
    - Ordered Qty (read-only)
    - Qty to Receive (input)
    - Batch Number (input)
    - Expiry Date (date picker)
    - Location (dropdown)
  - "Receive Goods" button

#### AC 2: Desktop Receive Execution
- **Given** all fields filled
- **When** clicking "Receive Goods"
- **Then**:
  - Call same API as scanner: POST /api/warehouse/grns
  - Create GRN with LPs
  - Show success: "GRN GRN-20250127-0001 created with 5 LPs"
  - Redirect to GRN detail

#### AC 3: Input Validation
- **Given** filling form
- **When** entering data
- **Then** validate in real-time:
  - Qty > 0
  - Qty <= remaining in PO
  - Batch required
  - Location required

### Technical Tasks

**Backend**
- [ ] Existing API from Story 5.11 (POST /api/warehouse/grns)

**Frontend**
- [ ] Create /app/warehouse/receiving page
- [ ] Create ReceivingForm component
  - PO autocomplete
  - Items input table
  - Validation

- [ ] Reuse validation from scanner (same business logic)

**Tests**
- [ ] Unit: qty validation
- [ ] Integration: desktop receive → same as scanner
- [ ] E2E: receive from PO on desktop → see GRN in list

### Definition of Done
- ✅ Desktop receiving form functional
- ✅ Same API as scanner (consistency)
- ✅ GRN created successfully
- ✅ Validation working

**Dependencies:** Requires Story 5.11 (GRN API)
**Estimated Effort:** 5 hours

---

## Story 5.33: Receive from TO (Desktop)

**User Story:**
> As a **Warehouse user**, I want to receive goods from transfer order, so that inter-warehouse transfers complete.

**Story Points:** 3

### Acceptance Criteria

#### AC 1: TO Receive Form
- **Given** navigating to /warehouse/receiving?mode=transfer-order
- **When** page loads
- **Then** show form similar to PO but for TO:
  - TO Number (autocomplete)
  - From Warehouse (read-only)
  - To Warehouse (read-only, = current org warehouse)
  - Items: Product, Shipped Qty, Received Qty (input)

#### AC 2: TO Receive Execution
- **Given** form filled
- **When** clicking "Confirm Receipt"
- **Then**:
  - Update LP.location_id (already in destination warehouse, just update location)
  - Update to_line.received_qty
  - Update TO status → 'Received' (if all lines received)
  - Show success message

#### AC 3: Validation
- **Given** receiving TO
- **When** validating
- **Then** reject if:
  - TO status != 'Shipped'
  - received_qty > shipped_qty

### Technical Tasks

**Backend**
- [ ] Implement POST /api/warehouse/transfer-orders/:id/receive
  - Update to_lines: received_qty
  - Update TO status
  - Update LP locations

**Frontend**
- [ ] Extend ReceivingForm to support TO mode
  - Show TO-specific fields
  - Call TO endpoint instead of GRN

**Tests**
- [ ] Unit: TO receive validation
- [ ] E2E: receive TO → TO status changes to 'Received'

### Definition of Done
- ✅ TO receive form working
- ✅ LPs relocated to destination location
- ✅ TO status updated
- ✅ Validation working

**Dependencies:** Requires Epic 3 (Transfer Orders), Story 5.14 (LP move)
**Estimated Effort:** 3 hours

---

## Story 5.34: Scanner Receive Workflow

**User Story:**
> As an **Operator**, I want to receive via scanner, so that I can work on the dock.

**Story Points:** 8

### Acceptance Criteria

#### AC 1: Scanner Receive Full Workflow
**Step-by-step workflow matching Story 5.23 but focused on receiving:**

1. **Scan PO/ASN** → Validate PO/ASN exists
2. **Display Items to Receive** → Show PO lines (Product, Qty)
3. **Scan Product Barcode** → Validate product in PO
4. **Enter Qty** → Input received quantity
5. **Enter Batch Number** → Required field
6. **Scan Location** → Validate location exists, active
7. **Confirm Summary** → Show all details
8. **Create LP & GRN** → Call API, show result
9. **Print Label** → If auto-print enabled, send to printer
10. **Next Item** → Return to step 2 or exit

#### AC 2: Barcode Scanning
- **Given** at barcode input step
- **When** scanning/entering barcode
- **Then** validate against expected type:
  - Expected: Product → Validate product barcode
  - Expected: Location → Validate location barcode
  - Show ✅ or ❌ feedback

#### AC 3: Label Printing
- **Given** LP created
- **When** warehouse_settings.auto_print_labels = true
- **Then** print label to configured printer
- **And** show: "Label sent to printer: WH-ZEBRA-01"

#### AC 4: Error Recovery
- **Given** operation fails (e.g., LP already exists)
- **When** error shown
- **Then** show "Retry" button → go back to step 1
- **And** "Cancel Workflow" → return to menu

### Technical Tasks

**Backend**
- [ ] Ensure all scanner endpoints working (from previous stories)

**Frontend**
- [ ] Create ReceiveWorkflow component
  - Implements all 10 steps
  - State machine management
  - Calls POST /api/warehouse/grns
  - Handles print job

**Tests**
- [ ] E2E: complete receive workflow from PO → LP created → label printed

### Definition of Done
- ✅ All 10 steps implemented
- ✅ Barcode validation working
- ✅ Label printing working
- ✅ Error recovery functional
- ✅ E2E: PO scan → product → qty → batch → location → LP created

**Dependencies:** Requires Story 5.23-5.27 (Scanner framework), 5.11 (GRN), 5.12 (Labels)
**Estimated Effort:** 8 hours

---

## Story 5.35: Inventory Count

**User Story:**
> As a **Warehouse user**, I want to perform inventory counts, so that I can verify accuracy.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: Inventory Count Workflow
- **Given** initiating count
- **When** starting count on scanner
- **Then** workflow:
  - Step 1: Select Location (dropdown or barcode scan)
  - Step 2: Display Expected LPs at location (from DB)
  - Step 3: Scan Each LP at Location
    - If scanned: ✅ Mark as found, remove from expected list
    - If not scanned: ⚠️ Mark as missing (at end)
    - If extra LP scanned (not in expected): ❌ Mark as found but unexpected

#### AC 2: Count Results
- **Given** count completed
- **When** finalizing count
- **Then** show variance report:
  - Expected: 10 LPs
  - Found: 9 LPs
  - Missing: 1 LP (LP-001)
  - Unexpected: 1 LP (LP-999)
  - Accuracy: 90%

#### AC 3: Action on Variance
- **Given** variance detected
- **When** creating inventory adjustment
- **Then** (future P1):
  - Create adjustment records
  - Update LP quantities
  - Flag for investigation

#### AC 4: Count History
- **Given** navigating to /warehouse/inventory-counts
- **When** page loads
- **Then** show:
  - All counts performed
  - Location, Date, Accuracy %, Variances
  - Link to count detail

### Technical Tasks

**Backend**
- [ ] Create inventory_counts table:
  ```sql
  CREATE TABLE inventory_counts (
    id UUID,
    org_id UUID,
    location_id UUID,
    count_date TIMESTAMP,
    expected_count INT,
    actual_count INT,
    variance INT,
    variance_pct DECIMAL,
    created_by_user_id UUID
  );
  ```

- [ ] Create inventory_count_items table (expected vs found)
- [ ] Implement POST /api/warehouse/inventory-counts
- [ ] Implement GET /api/warehouse/inventory-counts

**Frontend**
- [ ] Create InventoryCountWorkflow (scanner workflow)
- [ ] Create /app/warehouse/inventory-counts page (history)
- [ ] Create CountResultsModal (variance report)

**Tests**
- [ ] E2E: scan location → scan 9 of 10 LPs → see variance report

### Definition of Done
- ✅ Count workflow functional
- ✅ Variance report accurate
- ✅ Count history tracked
- ✅ E2E: perform count, see results

**Dependencies:** Requires Story 5.23 (Scanner), Batch 5A (LP list)
**Estimated Effort:** 5 hours

---

## Story 5.36: Scanner Offline Queue Management (Sprint 0 - Gap 5)

**User Story:**
> As an **Operator**, I want the scanner to queue operations while offline, so that I can continue working during network outages without losing data.

**Story Points:** 21 (Complex - 10 ACs)

### Acceptance Criteria

#### AC 1: Offline Queue Capacity Limits

**Given** Scanner PWA offline, Operator performing operations
**When** operations executed offline
**Then** verify queue management:
- ✅ Operations stored in IndexedDB
- ✅ Max capacity: 100 offline operations (configurable)
- ⚠️ Warning at 80%: "80/100 offline operations queued. Reconnect to sync soon."
- ❌ Block at 100%: "Offline queue full (100/100). Please reconnect to sync before continuing."
- ✅ Each op stores: operation_type, payload, timestamp, user_id, retry_count

**Supported Operations Offline:**
- Receive (GRN + LP)
- Consume (WO material)
- Output (WO output)
- LP Move
- LP Split
- Inventory Count

**Technical Implementation:**
```typescript
// IndexedDB key: scanner_offline_queue_{org_id}_{user_id}
// Queue structure: Array of OfflineOperation objects

if (queueSize >= 100) {
  throw new Error('Queue full');
}
if (queueSize >= 80) {
  showWarningBanner('80/100 operations queued...');
}
queue.push(operation);
```

---

#### AC 2: Offline Queue UI Indicators

**Given** Scanner PWA with queued operations
**When** viewing scanner interface
**Then** verify UI indicators:
- ✅ Network badge top-right: **"🔴 Offline"** (red) or **"🟢 Online"** (green)
- ✅ Queue counter badge top-center: **"📦 Queue: 23"** (always visible when >0 ops)
- ✅ Sync status indicator: **"⏳ Syncing..."** (during sync) or **"✅ Synced"** (when complete)
- ⚠️ Warning banner at 80%: **"80/100 operations queued. Reconnect to sync."**
- ❌ Error banner at 100%: **"Queue full. Sync required before continuing."**

**UI Placement:**
- Network status: Top-right corner (persistent)
- Queue counter: Top-center (persistent when >0)
- Sync status: Top-center (during sync only)
- Warning/error: Full-width at top

**Technical:**
```typescript
// Real-time queue count updates
useEffect(() => {
  const count = getQueueCount();
  setQueueSize(count);
  setNetworkStatus(navigator.onLine);
}, [userInteraction]);
```

---

#### AC 3: Automatic Sync on Reconnect

**Given** Scanner PWA with 50 queued operations, Network restored
**When** connection detected
**Then** verify auto-sync:
- ✅ Sync starts within 2 seconds
- ✅ UI shows: **"⏳ Syncing 50 operations..."**
- ✅ Operations synced in FIFO order
- ✅ Progress indicator: **"Syncing 10/50... 20/50... 30/50..."**
- ✅ Sync complete: **"✅ All 50 operations synced successfully"**
- ✅ Queue cleared after success
- ✅ IndexedDB offline queue emptied

**Sync Strategy:**
- Batch size: 10 operations per API call
- Retry: 3 attempts with exponential backoff (2s, 4s, 8s)
- If batch fails after 3 attempts: Mark as failed, continue next batch

**Technical:**
```typescript
window.addEventListener('online', async () => {
  const queue = await getOfflineQueue();
  for (let i = 0; i < queue.length; i += 10) {
    const batch = queue.slice(i, i + 10);
    try {
      await POST /api/scanner/sync-offline-queue with batch;
      updateProgress(`${i + 10}/${queue.length}`);
    } catch (err) {
      // Retry 3 times
      // If fails: mark as failed, continue
    }
  }
});
```

---

#### AC 4: Partial Sync with Failure Handling

**Given** 100 queued operations, network reconnects but some fail
**When** sync executes
**Then** verify failure handling:
- ✅ Ops 1-70: Sync successfully
- ❌ Op 71: Fails (LP-001 no longer exists) → Moved to failed queue
- ✅ Ops 72-100: Continue syncing (don't block)
- ✅ UI shows: **"⚠️ 70/100 synced. 1 failed. 29 remaining."**
- ✅ Failed ops shown in "Failed Queue" section (separate UI)
- ✅ User can "Retry" or "Discard" failed ops

**Failed Queue UI:**
- Shows: Operation type, timestamp, error message, payload
- Example: **"❌ LP Move failed: LP-001 no longer exists. (2025-01-20 14:32)"**
- Buttons: "Retry" / "Discard"

**Technical:**
```typescript
// Failed queue stored separately
IndexedDB key: scanner_failed_queue
Max size: 50 ops (auto-purge oldest after 7 days)

// On error
try {
  await syncOp();
} catch (err) {
  moveToFailedQueue(op, err.message);
  continue; // Don't block entire sync
}
```

---

#### AC 5: Manual Sync Trigger

**Given** Scanner PWA with queued operations, network available
**When** Operator clicks "Sync Now"
**Then** verify manual sync:
- ✅ Sync starts immediately
- ✅ UI shows progress indicator
- ✅ Sync completes with summary
- ✅ Button disabled during sync
- ✅ Re-enabled after complete

**Button Placement:**
- Top-right next to network badge
- Only visible when queue >0 ops
- Label: "Sync Now (23)" showing count

**Technical:**
```typescript
<button onClick={handleManualSync} disabled={isSyncing}>
  Sync Now ({queueSize})
</button>
```

---

#### AC 6: Queue Persistence Across App Restarts

**Given** 30 queued operations, Operator closes app
**When** Operator reopens scanner
**Then** verify persistence:
- ✅ All 30 ops still in queue (from IndexedDB)
- ✅ UI shows: **"📦 Queue: 30"**
- ✅ Operations maintain order (FIFO)
- ✅ If online: Auto-sync starts within 5 seconds

**Technical:**
```typescript
// On app load
const queue = await getOfflineQueue();
if (queue.length > 0) {
  setQueueSize(queue.length);
  if (navigator.onLine) {
    startAutoSync();
  }
}
```

---

#### AC 7: Offline Operation Timestamps

**Given** Scanner offline 2 hours, 50 ops performed
**When** operations sync
**Then** verify timestamps:
- ✅ Each op records: performed_at (when user executed) + synced_at (when uploaded)
- ✅ Server respects performed_at for audit trail (not synced_at)
- ✅ Example: Performed 10:00 AM, synced 12:00 PM → Audit shows 10:00 AM
- ✅ UI shows both: "Performed: 10:00 AM, Synced: 12:00 PM"

**Technical:**
```typescript
const operation = {
  ...payload,
  performed_at: new Date().toISOString(),
  // synced_at set by server on success
};
```

---

#### AC 8: Multi-User Queue Isolation

**Given** 2 operators on same device, different accounts
**User A**: 20 queued ops, **User B**: 15 queued ops
**When** each logs in
**Then** verify isolation:
- ✅ User A sees: **"📦 Queue: 20"**
- ✅ User B sees: **"📦 Queue: 15"**
- ✅ Queues stored separately: `scanner_offline_queue_{org_id}_{userId}`
- ✅ On sync: Only current user's queue synced

**Technical:**
```typescript
const queueKey = `scanner_offline_queue_${org_id}_${user_id}`;
```

---

#### AC 9: Queue Size Settings

**Given** Admin navigates to /settings/scanner
**Then** verify configurable settings:
- ✅ Max queue size: default 100, range 50-500
- ✅ Warning threshold %: default 80%, range 50-90%
- ✅ Auto-sync on reconnect: default enabled (toggle)
- ✅ Sync batch size: default 10, range 5-50
- ✅ Failed queue retention: default 7 days, range 1-30

**When** Admin changes max to 200
**Then** verify:
- ✅ Scanner allows 200 ops before blocking
- ✅ Warning threshold updates: 80% of 200 = 160 ops

**Technical:**
```sql
-- Add to warehouse_settings
scanner_max_queue_size INT DEFAULT 100
scanner_warning_threshold INT DEFAULT 80
scanner_auto_sync_enabled BOOLEAN DEFAULT true
scanner_sync_batch_size INT DEFAULT 10
scanner_failed_queue_retention_days INT DEFAULT 7
```

---

#### AC 10: E2E Test - 100 Offline Operations + Sync

**Test Scenario: Full Queue Capacity**

**Given** Scanner PWA offline
**When** 100 consecutive operations:
1. Receive 50 LPs (from PO)
2. Consume 30 LPs (for WO)
3. Move 15 LPs (location change)
4. Split 5 LPs

**Then** verify offline queue:
- ✅ All 100 ops in IndexedDB
- ✅ UI shows: **"⚠️ Queue full (100/100). Sync required."**
- ❌ 101st op blocked: **"Offline queue full. Please reconnect."**

**When** network reconnects
**Then** verify sync:
- ✅ Auto-sync starts within 2 seconds
- ✅ UI shows: **"⏳ Syncing 100 operations..."**
- ✅ Progress: 10/100, 20/100, ..., 100/100
- ✅ All 100 synced successfully (<30 sec)
- ✅ Database verification:
  - 50 GRNs + 50 LPs created (receive)
  - 30 wo_consumption records (consume)
  - 15 lp_movement records (move)
  - 5 LP split records + genealogy (split)
- ✅ Queue cleared: **"✅ All operations synced"**
- ✅ IndexedDB queue empty

**Performance:**
- ✅ 100 ops sync in <30 seconds (10 batches × 10 ops)
- ✅ 100% success rate for valid operations

---

### Technical Tasks

**Backend**
- [ ] Implement POST /api/scanner/sync-offline-queue
  - Accept: array of 10 operations (max)
  - For each op: validate + execute
  - Return: success/failed list
  - Mark performed_at timestamp in response

- [ ] Implement POST /api/scanner/sync-offline-queue/retry
  - Accept: array of failed op IDs
  - Retry individual operations
  - Return: updated status

- [ ] Implement GET /api/scanner/queue-status
  - Return: current queue size, failed count, sync status

**Frontend**
- [ ] Create Service Worker for offline detection
  - Listen to online/offline events
  - Trigger sync on reconnect

- [ ] Create OfflineQueueManager (IndexedDB)
  - Add operation to queue
  - Get queue
  - Clear queue
  - Persist/restore

- [ ] Create SyncEngine
  - Batch 10 ops per request
  - Retry with exponential backoff
  - Separate failed ops
  - Update UI progress

- [ ] Create Queue UI Components
  - NetworkBadge (🔴/🟢 status)
  - QueueCounter ("📦 Queue: 23")
  - SyncProgressBar ("⏳ Syncing...")
  - FailedQueueModal (review failed ops)
  - Warnings/Errors (banner)

- [ ] Update all scanner workflows:
  - On complete: add to queue if offline, sync if online

**Database**
- [ ] Create warehouse_settings columns for scanner config

**Tests**
- [ ] Unit: queue add/remove/clear
- [ ] Unit: sync batch logic (10 ops per call)
- [ ] Unit: exponential backoff retry (2s, 4s, 8s)
- [ ] Integration: offline op → queue → reconnect → synced
- [ ] Integration: partial failure → failed queue → retry
- [ ] E2E: 100 offline ops → sync → all created in DB
- [ ] E2E: 2 users on same device → queues isolated
- [ ] E2E: app restart → queue persisted → auto-sync

### Definition of Done
- ✅ All 10 ACs implemented and tested
- ✅ Max 100 operations enforced
- ✅ Queue size configurable
- ✅ UI shows queue status, sync status, network status
- ✅ Auto-sync on reconnect (within 2 sec)
- ✅ Manual sync trigger available
- ✅ Queue persists across app restarts
- ✅ Failed operations in separate queue for review
- ✅ Multi-user queue isolation working
- ✅ E2E: 100 offline ops → 100% success on sync
- ✅ Performance: 100 ops sync in <30 seconds

**Dependencies:** Requires Story 5.23 (Scanner), Batch 5A (all operations)
**Estimated Effort:** 21 hours (complex due to offline sync, error handling, E2E testing)

---

## Summary

**Batch 5C Total:**
- **Stories:** 5.23-5.36 (14 stories)
- **Total Story Points:** 104
- **Total Effort Estimate:** ~90-110 hours
- **Duration:** ~3-4 weeks (2-person team)

**Key Dependencies:**
- ✅ Batch 5A: LP, ASN, GRN, genealogy
- ✅ Batch 5B: Stock moves, pallets
- ✅ Epic 3: Purchase Orders, Transfer Orders
- ✅ Epic 4: Work Orders (for consume/output)

**Implementation Sequence:**
1. **Week 1**: Scanner framework (5.23-5.27) + Settings (5.31)
2. **Week 2**: Traceability & Source (5.28-5.30) + Receive workflows (5.32-5.34)
3. **Week 3**: Inventory Count (5.35) + Offline Queue (5.36)
4. **Week 4**: Integration testing, refinement, deployment prep

**Parallel Tracks:**
- **Track A** (Week 1-2): Scanner UI (5.23-5.27) - 10-12 hours/day
- **Track B** (Week 2): Workflows (5.28-5.34) - 10-12 hours/day
- **Track C** (Week 3): Advanced features (5.35-5.36) - 10-12 hours/day

**Batch 5C Success Criteria:**
- ✅ All 14 stories implemented
- ✅ Scanner PWA functional (all workflows)
- ✅ Offline queue with 100-op capacity
- ✅ Auto-sync on reconnect (FIFO, batch 10)
- ✅ Failed operations manageable (review & retry)
- ✅ Traceability UI (forward/backward trace)
- ✅ Source document linking (PO/GRN/WO/TO)
- ✅ Inventory count workflow
- ✅ Multi-user support (role-based, queue isolation)
- ✅ E2E: 100 offline ops → 100% sync success
- ✅ Performance: 100 ops sync in <30 seconds
- ✅ RLS policies for multi-tenancy
