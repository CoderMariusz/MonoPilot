# Scanner Module Test Plan

**Module**: `app/(authenticated)/scanner`  
**Last Updated**: February 8, 2026

---

## 📋 Scanner Dashboard

### Buttons
- [ ] Start Scan: Activates camera/barcode scanner
- [ ] Stop Scan: Deactivates scanner
- [ ] Switch Camera: Toggles between front/rear cameras (mobile)
- [ ] Settings: Opens scanner configuration
- [ ] Clear History: Clears recent scans
- [ ] Mode selector: Switches between scan modes (Goods Receipt, Inventory Move, Picking, etc.)

### Forms
- [ ] No forms on dashboard (scanner interface)

### Modals
- [ ] Scanner settings modal: Configure camera, scan speed, beep settings
- [ ] Scan result modal: Shows scanned item details, quantity, action

### Tables
- [ ] Scan history: Timestamp, Item Code, Type, Quantity, Status
- [ ] Current session: Running count of scanned items

### Workflows
- [ ] Activate scanner: Opens camera feed
- [ ] Scan barcode/QR: Reads code, displays item info
- [ ] Select action: Perform action (receive, move, pick, etc.)
- [ ] Quantity input: Enter or confirm quantity scanned
- [ ] Confirm: Add to current session
- [ ] Complete: End scanning session, submit data

### Error States
- [ ] Camera not available: "Camera access denied, please check permissions"
- [ ] Invalid scan: "Barcode not recognized"
- [ ] Item not found: "Item not found in system"
- [ ] Scan too fast: "Please wait before next scan"
- [ ] Permission denied: "Microphone/camera access denied"

---

## 📋 Goods Receipt via Scanner

### Buttons
- [ ] Start Receipt: Begins goods receipt scanning session
- [ ] Scan Item: Opens scanner interface
- [ ] Manual Entry: Allows typing item code if barcode fails
- [ ] Confirm Quantity: Confirms received amount
- [ ] Remove Item: Removes scanned item from receipt
- [ ] Complete Receipt: Submits receipt and updates inventory
- [ ] Cancel Receipt: Abandons scanning session

### Forms
- [ ] Purchase Order: Dropdown or barcode scan to select PO
- [ ] Receiving location: Dropdown or scan location barcode
- [ ] Quantity per item: Number input after scan
- [ ] Condition: Dropdown (Good, Damaged, Partial, etc.)
- [ ] Notes: Textarea for receipt notes

### Modals
- [ ] PO selection modal: Shows pending POs to scan for
- [ ] Location selection modal: Shows available receiving locations
- [ ] Item detail modal: After scan, shows product info, quantity fields
- [ ] Complete confirmation: Confirms receipt completion

### Tables
- [ ] Scanned items table: Item Code, Item Name, Expected Qty, Received Qty, Condition, Status
- [ ] Running totals: Items scanned, total qty received

### Workflows
- [ ] Select PO: Choose PO to receive against
- [ ] Select location: Choose receiving location
- [ ] Scan items: Scanner opens, reads barcodes
- [ ] Confirm qty: Enter received quantity (defaults to expected)
- [ ] Add to receipt: Item added to current receipt
- [ ] View summary: Shows all scanned items before completion
- [ ] Complete: Submits receipt, updates inventory, closes session

### Error States
- [ ] PO not found: "Purchase order not found"
- [ ] Location invalid: "Invalid receiving location"
- [ ] Qty mismatch: "Received qty does not match expected"
- [ ] Item not in PO: "Item not part of this PO"
- [ ] Session expired: "Scanning session expired, please restart"
- [ ] Already received: "Item already fully received"

---

## 📋 Inventory Movement via Scanner

### Buttons
- [ ] Start Move: Begins inventory transfer session
- [ ] Scan Source Location: Scans source location barcode
- [ ] Scan Items: Opens scanner for item barcodes
- [ ] Confirm Qty: Confirms quantity to move
- [ ] Remove Item: Removes item from movement
- [ ] Scan Dest Location: Scans destination location barcode
- [ ] Complete Move: Submits movement, updates inventory
- [ ] Cancel Move: Abandons session

### Forms
- [ ] Source location: Barcode scan or dropdown
- [ ] Item code: Barcode scan (primary method)
- [ ] Quantity: Number input after scan
- [ ] Destination location: Barcode scan or dropdown
- [ ] Reason: Dropdown (Consolidation, Picking, Audit, Other)
- [ ] Notes: Textarea, optional

### Modals
- [ ] Location selection: Shows available source locations
- [ ] Item confirmation: After scan, shows current qty available, asks for move qty
- [ ] Destination selection: Shows available destination locations
- [ ] Complete confirmation: Shows summary before submitting

### Tables
- [ ] Items to move: Source Location, Item Code, Item Name, Qty Available, Qty to Move, Dest Location, Status
- [ ] Movement summary: Total items, total qty

### Workflows
- [ ] Select source: Scan or select source location
- [ ] Scan items: Scanner reads item barcodes from source location
- [ ] Enter qty: Confirms quantity to move (up to available)
- [ ] Add to movement: Item added to movement
- [ ] Select destination: Scan or select destination location
- [ ] Validate path: Checks valid location path
- [ ] Review summary: Shows all items before completion
- [ ] Complete: Updates inventory, closes session

### Error States
- [ ] Location not found: "Location barcode not recognized"
- [ ] Invalid path: "Cannot move from source to destination"
- [ ] Qty not available: "Insufficient qty at source location"
- [ ] Same location: "Source and destination must differ"
- [ ] Item not at location: "Item not found at source location"
- [ ] Session expired: "Scanning session expired"

---

## 📋 Picking via Scanner

### Buttons
- [ ] Start Picking: Begins picking session for work order/order
- [ ] Scan Location: Scans picking location barcode
- [ ] Scan Item: Opens scanner for item barcode
- [ ] Confirm Qty: Confirms picked quantity
- [ ] Next Location: Advances to next pick location
- [ ] Complete Pick: Finishes picking, updates allocation
- [ ] Cancel Pick: Abandons picking session
- [ ] Print Pick List: Prints location/item sequence

### Forms
- [ ] Work Order/Sales Order: Dropdown or barcode scan to select
- [ ] Location code: Barcode scan (primary)
- [ ] Item code: Barcode scan (primary)
- [ ] Quantity picked: Number input after scan
- [ ] Container/License Plate: Scan container barcode

### Modals
- [ ] Order selection modal: Shows pending orders to pick
- [ ] Item confirmation modal: After scan, shows expected qty, asks for picked qty
- [ ] Location confirmation modal: Confirms next pick location
- [ ] Complete confirmation modal: Shows total picked, asks to confirm

### Tables
- [ ] Picking list: Seq #, Location, Item Code, Item Name, Expected Qty, Picked Qty, Container, Status
- [ ] Picking summary: Items picked, qty picked, containers

### Workflows
- [ ] Select order: Choose work order or sales order to pick
- [ ] Get first location: System suggests first pick location
- [ ] Navigate to location: Operator scans location barcode to confirm
- [ ] Scan items: Scanner reads item barcodes at location
- [ ] Confirm qty: Enters quantity picked (up to allocation)
- [ ] Scan container: Assigns items to container/LP
- [ ] Next location: Advances to next pick location in sequence
- [ ] Review pick: Shows all picked items before completion
- [ ] Complete: Updates allocations, creates shipment

### Error States
- [ ] Order not found: "Order not found"
- [ ] No allocation: "No items allocated for picking"
- [ ] Location wrong: "Expected different location, confirm to override"
- [ ] Item not allocated: "Item not in pick list"
- [ ] Qty exceeded: "Picked qty exceeds allocation"
- [ ] Session expired: "Picking session expired"
- [ ] Container full: "Container capacity exceeded"

---

## 📋 Stock Audit via Scanner

### Buttons
- [ ] Start Audit: Begins audit session for location/warehouse
- [ ] Scan Location: Scans location barcode
- [ ] Scan Items: Opens scanner for item barcodes
- [ ] Enter Qty: Enters physical count
- [ ] Skip Item: Marks as not found (variance)
- [ ] Next Location: Moves to next location
- [ ] Complete Audit: Submits audit, calculates variances
- [ ] Cancel Audit: Abandons session
- [ ] View Discrepancies: Shows count vs. system differences

### Forms
- [ ] Location: Dropdown or barcode scan
- [ ] Item code: Barcode scan (primary)
- [ ] Physical count: Number input (counted quantity)
- [ ] Notes: Textarea for discrepancy notes

### Modals
- [ ] Location selection modal: Shows locations to audit
- [ ] Item variance modal: Shows system qty vs. count, collects notes
- [ ] Audit summary modal: Shows all variances before submission
- [ ] Discrepancy detail modal: Shows specific variances, allows adjustment

### Tables
- [ ] Audit list: Location, Item Code, Item Name, System Qty, Physical Qty, Variance, Status
- [ ] Audit summary: Locations audited, items scanned, total variance %, critical items

### Workflows
- [ ] Select location: Choose location to audit
- [ ] Scan items: Scanner reads all item barcodes in location
- [ ] Enter count: Enters physical count for each item (may auto-populate 0 if not scanned)
- [ ] Flag variances: System flags items with qty discrepancies
- [ ] Skip items: Marks items not physically present
- [ ] Review audit: Shows all items with variances
- [ ] Complete: Submits audit, generates report

### Error States
- [ ] Location not found: "Location not found"
- [ ] No items: "No items in location"
- [ ] Significant variance: "Variance >10%, please verify count"
- [ ] Missing critical item: "Critical item missing, contact manager"
- [ ] Session expired: "Audit session expired"

---

## 📋 Quality Control via Scanner

### Buttons
- [ ] Start Inspection: Begins QC session
- [ ] Scan Item: Opens scanner for item barcode
- [ ] Scan Lot/Batch: Scans lot barcode
- [ ] Pass: Marks item as passed QC
- [ ] Fail: Marks item as failed, opens reason modal
- [ ] Hold: Marks item as on hold, pending further review
- [ ] Next Item: Advances to next item in batch
- [ ] Complete Inspection: Submits QC results
- [ ] Print Label: Prints passed/failed label

### Forms
- [ ] Work Order/Batch: Dropdown or barcode scan
- [ ] Item code: Barcode scan
- [ ] Lot/Batch number: Barcode scan
- [ ] QC result: Radio buttons (Pass, Fail, Hold)
- [ ] Failure reason: Dropdown (if Fail selected)
- [ ] Notes: Textarea for QC observations

### Modals
- [ ] Item selection modal: Shows items to inspect
- [ ] Failure reason modal: Collects reason for failure
- [ ] QC summary modal: Shows results before submission
- [ ] Label printing modal: Prints pass/fail labels

### Tables
- [ ] Inspection log: Item Code, Lot Number, Result (Pass/Fail/Hold), Reason, Date, Inspector
- [ ] QC summary: Items passed, failed, held, pass rate %

### Workflows
- [ ] Select batch: Choose work order or batch to inspect
- [ ] Scan item: Scanner reads item barcode
- [ ] Scan lot: Scanner reads lot/batch barcode
- [ ] Perform checks: Visual/functional checks based on checklist
- [ ] Record result: Pass, Fail, or Hold
- [ ] Add notes: Comments on inspection results
- [ ] Next item: Advances to next item
- [ ] Review results: Shows all items inspected
- [ ] Complete: Submits QC, generates report

### Error States
- [ ] Batch not found: "Batch/Work order not found"
- [ ] Item not in batch: "Item not in this batch"
- [ ] Lot not found: "Lot number not recognized"
- [ ] No items: "No items to inspect"
- [ ] Session expired: "Inspection session expired"

---

## 📋 Scanner Settings & Configuration

### Buttons
- [ ] Camera selection: Dropdown to switch cameras
- [ ] Resolution setting: Dropdown for scan resolution
- [ ] Beep toggle: Enable/disable beep on successful scan
- [ ] Vibrate toggle: Enable/disable vibration feedback
- [ ] Auto-focus: Toggle for auto-focus mode
- [ ] Light adjustment: Slider for brightness
- [ ] Save settings: Saves preferences to local storage

### Forms
- [ ] Camera source: Dropdown (front/rear camera on mobile)
- [ ] Scan mode: Dropdown (1D barcode, 2D QR, both)
- [ ] Beep volume: Slider (0-100%)
- [ ] Vibration pattern: Dropdown (short, long, custom)
- [ ] Auto-advance: Toggle for auto-advance on successful scan
- [ ] Confirm before submit: Toggle to require confirmation
- [ ] Scan timeout: Number input (seconds before timeout)
- [ ] Session timeout: Number input (minutes before session expires)

### Modals
- [ ] Settings modal: Configuration options above

### Tables
- [ ] None (settings-only interface)

### Workflows
- [ ] Open settings: Settings modal opens
- [ ] Change setting: Selection updates immediately
- [ ] Test camera: Can test camera before closing settings
- [ ] Save: Saves all settings to local storage
- [ ] Reset: Resets to default settings

### Error States
- [ ] Camera not found: "Camera not available on this device"
- [ ] Permission denied: "Camera access denied, check permissions"
- [ ] Setting invalid: "Invalid setting value"

---

## 📋 Accessibility & Permissions

### Buttons - Permission Variations
- [ ] Start Scan: Visible to warehouse operator, supervisor
- [ ] Goods Receipt: Visible to warehouse manager, supervisor
- [ ] Inventory Move: Visible to warehouse operator, supervisor
- [ ] Picking: Visible to picker, supervisor
- [ ] Audit: Visible to warehouse manager, supervisor
- [ ] QC: Visible to QC inspector, supervisor
- [ ] Complete/Submit: May require manager approval

### Forms - Permission Variations
- [ ] Notes field: Read-only for certain roles
- [ ] Location selection: Filtered by user's warehouse access
- [ ] Order selection: Filtered by user's assigned orders

### Workflows - Permission Variations
- [ ] Receive goods: Requires warehouse manager role
- [ ] Move inventory: Requires operator+ role
- [ ] Picking: Requires picker or supervisor role
- [ ] Audit: Requires warehouse manager role
- [ ] QC: Requires QC inspector role

### Error States - Permission Variations
- [ ] Unauthorized: "You don't have permission for this operation"
- [ ] Warehouse access: "You don't have access to this warehouse"

---

## ✅ Testing Checklist Summary

- [ ] Scanner activates and camera works
- [ ] Barcodes scan correctly (1D, 2D)
- [ ] QR codes scan correctly
- [ ] Invalid scans handled gracefully
- [ ] Scanner timeout works
- [ ] Session expiry handled
- [ ] Beep/vibration feedback works
- [ ] Camera switching works on mobile
- [ ] Manual entry works if scan fails
- [ ] Goods receipt flow complete
- [ ] Inventory move flow complete
- [ ] Picking flow complete
- [ ] Stock audit flow complete
- [ ] QC inspection flow complete
- [ ] All session types submit correctly
- [ ] Quantity entry validates (positive, integer)
- [ ] Dropdown selections work
- [ ] History/summary display correct
- [ ] Permissions prevent unauthorized access
- [ ] Error messages helpful and actionable
- [ ] Settings persist across sessions
- [ ] Mobile responsive design works
- [ ] Camera permissions request works
- [ ] Keyboard input works alongside scanner

---

**Generated**: 2026-02-08  
**Version**: 1.0 (Unified Format)
