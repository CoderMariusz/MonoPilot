# Story 1.4.1: Spreadsheet Mode Bulk Creation

Status: drafted

## Story

As a **Production Planner / Purchasing Manager**,
I want **Excel-like spreadsheet mode for bulk PO/WO creation with drag-drop row reordering**,
so that **I can create 8 Work Orders in 48 seconds (vs 24 minutes with modals) and control production priority visually**.

## Acceptance Criteria

### AC-1: Spreadsheet Table Component
- Create `<SpreadsheetTable>` component with editable grid (6-10 columns depending on entity type: PO/TO/WO)
- Column types: text input, number input, dropdown (product, line, shift), date picker, validation icon
- Inline editing: Click cell → edit in place → Tab/Enter to move to next cell → auto-save on blur
- Real-time validation: ✓ (green), ⚠️ (yellow), ❌ (red) icons per row + red cell border for errors
- Keyboard shortcuts: Tab (next cell), Shift+Tab (previous cell), Enter (next row), Esc (cancel edit), Ctrl+Z (undo)
- Support for 1-50 rows (virtualization if >50 for performance)

### AC-2: Excel Paste & CSV Import
- Excel paste: Ctrl+V when focused on first row → parse clipboard data → populate rows automatically
- CSV import: Click "Import CSV" button → file upload dialog → parse CSV → populate table
- Auto-fill logic: If product code pasted → auto-populate product_name, supplier, UoM, BOM version (for WO), default location (for PO)
- Paste validation: Show warnings for invalid product codes, out-of-range quantities, missing required fields
- Paste formats supported: Tab-delimited (Excel), comma-delimited (CSV), pipe-delimited

### AC-3: Drag-Drop Row Reordering (Priority Control)
- Drag handle (⋮⋮ icon) on left side of each row
- Drag row #5 → drop between row #1 and #2 → row becomes new #2, renumber all rows
- Visual feedback: Ghost row (50% opacity) while dragging, green drop zone indicator (2px line), purple border on row #1 (highest priority)
- Priority column: Auto-calculated based on row order (#1, #2, #3, ..., #N) → maps to work_orders.priority field
- Keyboard shortcuts: Alt+↑ (move row up), Alt+↓ (move row down)
- Drag constraints: Cannot drag while editing cell (must blur first)

### AC-4: Auto-Scheduling & Smart Defaults
- Click "Auto-Schedule" button (WO only) → system assigns:
  - Production line (BOM preferred_line OR lowest capacity line)
  - Start time (earliest available slot on assigned line)
  - End time (start_time + duration calculated from BOM routing)
  - Shift (inferred from start_time: 8:00-16:00 = Day, 16:00-00:00 = Swing, 00:00-8:00 = Night)
- Smart defaults on row add:
  - Due date: Today + supplier_lead_time (PO) OR scheduled_start + duration (WO)
  - Warehouse: User's default warehouse from profile (PO/TO)
  - UoM: Product's default_uom from products table
  - BOM version: Latest active BOM with effective_from <= scheduled_date (WO)
- Conflict warnings: If auto-scheduling results in line >100% capacity → show ⚠️ "Line A overbooked 120%" with yellow background

### AC-5: Batch Creation API
- Click "Create 8 Work Orders" button → single batch API call (not 8 separate calls)
- API endpoint: `POST /api/work-orders/batch` with payload: `{ items: WorkOrder[] }`
- Transaction: All 8 WOs created atomically (if 1 fails → rollback all, show error)
- Validation: Server-side validation for each WO (duplicate check, BOM exists, line assignment valid)
- Response: `{ success: true, created: [WO-0109, WO-0110, ...], errors: [] }` OR `{ success: false, errors: [{ row: 3, message: "Invalid product" }] }`
- Results screen: Summary table with links to created WOs, "Create More" / "View Timeline" / "Done" buttons

### AC-6: Mode Selection & Transitions
- On "Create Work Order" click → Mode selection dialog shows with 3 options:
  - ⚡ Spreadsheet Mode (recommended for bulk planning 8+ WOs)
  - 📅 Timeline Mode (recommended for rescheduling)
  - 🧭 Wizard Mode (recommended for first-time users)
- Default mode: Wizard for new users (first 2 weeks), Spreadsheet for experienced users
- Remember choice: "☑️ Don't show this again" checkbox → save to user preferences
- Mode toggle: Top-right toggle buttons (Spreadsheet ↔ Timeline) → bi-directional sync (row order = timeline priority)
- Exit confirmation: If unsaved changes → "You have 8 unsaved rows. Discard changes?" modal

### AC-7: Work Order Spreadsheet Columns (WO-Specific)
- Columns: Row #, ⋮⋮ Drag, Product (dropdown), Quantity (number), UoM (read-only), Line (dropdown), Date (date picker), Shift (dropdown), BOM Version (dropdown), Priority (read-only, auto-calculated), Status (✓⚠️❌)
- Optional columns (hidden by default, show via column picker): Due Date, Source Demand Type, Order Flags, Notes
- Column widths: Product (250px), Quantity (100px), Line (150px), Date (150px), Shift (120px), BOM (180px)
- Sticky header: Header row stays visible when scrolling (virtual scroll support)

### AC-8: Purchase Order Spreadsheet Columns (PO-Specific)
- Columns: Row #, ⋮⋮ Drag, Product (dropdown), Quantity (number), UoM (read-only), Supplier (read-only, auto-filled), Warehouse (dropdown), Location (dropdown), Expected Delivery (date), Status (✓⚠️❌)
- Auto-grouping by supplier: Sort rows by supplier_id → create 1 PO per supplier group automatically
- Supplier pre-fill: Type product code → auto-populate supplier from products.preferred_supplier_id

### AC-9: Documentation
- Update `docs/architecture.md` with Spreadsheet Mode workflow diagram
- Document drag-drop row reordering algorithm and priority calculation
- Update `docs/API_REFERENCE.md` with batch creation endpoints
- Add UX documentation: keyboard shortcuts, Excel paste formats, column definitions

## Tasks / Subtasks

### Task 1: Spreadsheet Table Component (AC-1, AC-7, AC-8) - 12 hours
- [ ] 1.1: Create `<SpreadsheetTable>` base component with editable grid
- [ ] 1.2: Implement inline editing (click cell → edit → Tab/Enter navigation)
- [ ] 1.3: Add column type support: text, number, dropdown, date picker
- [ ] 1.4: Implement real-time validation (✓⚠️❌ icons, red cell borders)
- [ ] 1.5: Add keyboard shortcuts (Tab, Shift+Tab, Enter, Esc, Ctrl+Z)
- [ ] 1.6: Implement WO-specific columns (Product, Quantity, Line, Date, Shift, BOM, Priority)
- [ ] 1.7: Implement PO-specific columns (Product, Quantity, Supplier, Warehouse, Location, Expected Delivery)
- [ ] 1.8: Add sticky header with virtual scroll support
- [ ] 1.9: Add column picker (show/hide optional columns)
- [ ] 1.10: Add unit tests for cell editing, keyboard navigation, validation

### Task 2: Excel Paste & CSV Import (AC-2) - 8 hours
- [ ] 2.1: Implement clipboard paste handler (Ctrl+V → parse → populate rows)
- [ ] 2.2: Support paste formats: Tab-delimited, comma-delimited, pipe-delimited
- [ ] 2.3: Implement auto-fill logic (product code → product_name, supplier, UoM, BOM)
- [ ] 2.4: Add CSV file upload dialog with file parsing
- [ ] 2.5: Implement paste validation (invalid codes, out-of-range quantities)
- [ ] 2.6: Show paste warnings modal (non-blocking, allow manual fix)
- [ ] 2.7: Add unit tests for paste parsing, auto-fill logic, CSV import

### Task 3: Drag-Drop Row Reordering (AC-3) - 10 hours
- [ ] 3.1: Add drag handle (⋮⋮ icon) to each row
- [ ] 3.2: Implement drag-drop using react-beautiful-dnd or @dnd-kit/core
- [ ] 3.3: Visual feedback: ghost row (50% opacity), green drop zone indicator
- [ ] 3.4: Renumber rows on drop (calculate new priority values)
- [ ] 3.5: Add purple border to row #1 (highest priority indicator)
- [ ] 3.6: Implement keyboard shortcuts (Alt+↑, Alt+↓ for row move)
- [ ] 3.7: Prevent drag while editing cell (blur constraint)
- [ ] 3.8: Add E2E test: drag row #5 to position #2 → verify priority updated

### Task 4: Auto-Scheduling & Smart Defaults (AC-4) - 10 hours
- [ ] 4.1: Implement "Auto-Schedule" button logic (WO only)
- [ ] 4.2: Line assignment algorithm: BOM preferred_line OR lowest capacity line
- [ ] 4.3: Start time calculation: earliest available slot on assigned line
- [ ] 4.4: End time calculation: start_time + duration from BOM routing
- [ ] 4.5: Shift inference: 8:00-16:00 = Day, 16:00-00:00 = Swing, 00:00-8:00 = Night
- [ ] 4.6: Smart defaults on row add: due_date (today + lead_time), warehouse (user default), UoM (product default)
- [ ] 4.7: BOM version auto-selection: latest active with effective_from <= scheduled_date
- [ ] 4.8: Conflict detection: if line capacity >100% → show ⚠️ "Line A overbooked 120%"
- [ ] 4.9: Add unit tests for auto-scheduling, smart defaults, conflict detection

### Task 5: Batch Creation API (AC-5) - 8 hours
- [ ] 5.1: Create `POST /api/work-orders/batch` endpoint
- [ ] 5.2: Create `POST /api/purchase-orders/batch` endpoint
- [ ] 5.3: Implement atomic transaction (all or nothing rollback)
- [ ] 5.4: Server-side validation per item (duplicate check, FK validation, business rules)
- [ ] 5.5: Return structured response: { success, created: [], errors: [] }
- [ ] 5.6: Implement results screen component (summary table, links to created entities)
- [ ] 5.7: Add "Create More" / "View Timeline" / "Done" buttons on results screen
- [ ] 5.8: Add unit tests for batch API (success, partial failure, full failure scenarios)

### Task 6: Mode Selection & Transitions (AC-6) - 6 hours
- [ ] 6.1: Create Mode Selection Dialog component
- [ ] 6.2: Implement 3 mode options: Spreadsheet, Timeline, Wizard (with descriptions)
- [ ] 6.3: Default mode logic: Wizard for new users (< 2 weeks), Spreadsheet otherwise
- [ ] 6.4: "Remember my choice" checkbox → save to user_preferences table
- [ ] 6.5: Mode toggle buttons (Spreadsheet ↔ Timeline) with bi-directional sync
- [ ] 6.6: Exit confirmation modal if unsaved changes
- [ ] 6.7: Add E2E test: switch modes → verify data synced correctly

### Task 7: Purchase Order Auto-Grouping (AC-8) - 4 hours
- [ ] 7.1: Implement supplier auto-grouping (sort by supplier_id → 1 PO per group)
- [ ] 7.2: Supplier pre-fill on product selection (from products.preferred_supplier_id)
- [ ] 7.3: Visual grouping in table (gray separator line between supplier groups)
- [ ] 7.4: Preview modal: "Creating 3 Purchase Orders (Supplier A: 5 items, Supplier B: 3 items, Supplier C: 2 items)"
- [ ] 7.5: Add unit tests for auto-grouping logic

### Task 8: E2E Tests (8 hours)
- [ ] 8.1: E2E test: Paste 8 WOs from Excel → auto-fill works → create batch → success
- [ ] 8.2: E2E test: Drag row #5 to position #2 → priority updated → create WOs → execution order correct
- [ ] 8.3: E2E test: CSV import 15 POs → auto-grouping by supplier → 3 POs created
- [ ] 8.4: E2E test: Invalid product code → ❌ validation icon → fix error → ✓ icon → create
- [ ] 8.5: E2E test: Auto-schedule 8 WOs → lines assigned → start/end times calculated → no conflicts
- [ ] 8.6: E2E test: Switch Spreadsheet → Timeline → verify data synced (row order = priority)
- [ ] 8.7: E2E test: Keyboard shortcuts (Tab, Enter, Alt+↑, Ctrl+Z) work correctly

### Task 9: Documentation (AC-9) - 2 hours
- [ ] 9.1: Run `pnpm docs:update` to regenerate API docs
- [ ] 9.2: Update `docs/architecture.md` with Spreadsheet Mode workflow diagram
- [ ] 9.3: Document drag-drop algorithm and priority calculation formula
- [ ] 9.4: Create keyboard shortcuts cheat sheet (in-app help modal)
- [ ] 9.5: Document Excel paste formats and column mapping

**Total Estimated Effort:** 68 hours (~8-10 days)

## Dev Notes

### Requirements Source
[Source: docs/ux-design-planning-module.md#Variant-B-Spreadsheet-Mode, lines 426-465]

**Spreadsheet Mode Key Features:**
- Excel-like bulk entry with drag-drop row reordering
- 97% time savings (8 WOs in 48s vs 24 min)
- Ctrl+V paste from Excel, CSV import
- Inline editing (click cell → edit in place)
- Real-time validation (✓⚠️❌ indicators)
- Auto-scheduling with conflict detection
- Batch API creation (1 request, not 8)
- Keyboard shortcuts (Tab, Enter, Ctrl+Z, Alt+↑↓)

[Source: docs/ux-design-planning-module.md#Expected-Impact, lines 54-61]
**Quantitative Benefits:**
- Time to create 15 POs: 15 min → 24s (97% faster)
- Time to create 8 WOs: 24 min → 48s (97% faster)
- Error rate: 30% → <1% (97% reduction)
- Daily time saved per planner: 76 min/day (1.27 hours/day)

### Architecture Constraints

**Drag-Drop Priority System:**
- Visual row order (#1, #2, #3) maps to `work_orders.priority` INTEGER field
- Priority determines production execution order (scheduler picks lowest priority # first)
- Algorithm: On row drop → recalculate priority for all rows (1-based index)
- Database update: UPDATE work_orders SET priority = new_row_index WHERE id = wo_id

**BOM Snapshot Pattern (Critical Constraint):**
- WO creation must capture BOM to `wo_materials` table (immutability requirement)
- BOM version selection: Latest active BOM with effective_from <= scheduled_date
- Auto-scheduling must respect BOM constraints: preferred_line, routing duration, allergen separation

**Multi-Tenant Isolation:**
- All batch API calls filtered by org_id (RLS enforcement)
- User can only see products, lines, warehouses from their org_id

**Paste Formats:**
```
Tab-delimited (Excel): PRODUCT-001\t100\tLine A\t2025-11-18\tDay
Comma-delimited (CSV): PRODUCT-001,100,Line A,2025-11-18,Day
Pipe-delimited: PRODUCT-001|100|Line A|2025-11-18|Day
```

**Column Mapping (WO):**
| Excel Column | Database Field | Auto-Fill Logic |
|--------------|----------------|-----------------|
| Product Code | product_id | Lookup products table by code |
| Quantity | quantity | Direct value |
| Line | line_id | Lookup machines table by name |
| Date | scheduled_date | Parse date (YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY) |
| Shift | shift | Enum: Day, Swing, Night |
| BOM Version | bom_id | Latest active BOM for product + date |

### Testing Strategy

**Risk-Based E2E Coverage:**
- HIGH RISK: Drag-drop priority calculation (production order impact) = E2E required
- HIGH RISK: Batch creation transaction (partial failure rollback) = E2E required
- COMPLEX: Excel paste + auto-fill (multi-column parsing, FK lookups) = E2E required
- COMPLEX: Mode transitions (Spreadsheet ↔ Timeline sync) = E2E required
- Simple: Inline cell editing, keyboard navigation = unit test sufficient

**E2E Test Scenarios:**
1. Paste 8 WOs from Excel → auto-fill works → create batch → all WOs created
2. Drag row #5 to position #2 → priority updated → WOs execute in new order
3. CSV import 15 POs → auto-grouping by supplier → 3 POs created (5+3+2 items)
4. Invalid product code in row #3 → ❌ validation → fix error → ✓ validation → create
5. Auto-schedule 8 WOs → lines assigned → no capacity conflicts → start/end times correct
6. Switch Spreadsheet → Timeline → drag WO box → switch back → row order synced
7. Keyboard shortcuts: Tab (next cell), Enter (next row), Alt+↑ (move row up), Ctrl+Z (undo)

### Project Structure Notes

**Files to Create/Modify:**
- `apps/frontend/components/SpreadsheetTable.tsx` - Main spreadsheet component
- `apps/frontend/components/SpreadsheetRow.tsx` - Editable row component
- `apps/frontend/components/SpreadsheetCell.tsx` - Inline editable cell
- `apps/frontend/components/DragHandle.tsx` - ⋮⋮ drag handle component
- `apps/frontend/components/ModeSelectionDialog.tsx` - Mode selection modal
- `apps/frontend/components/BatchResultsScreen.tsx` - Results summary after batch creation
- `apps/frontend/app/api/work-orders/batch/route.ts` - Batch WO creation API
- `apps/frontend/app/api/purchase-orders/batch/route.ts` - Batch PO creation API
- `apps/frontend/lib/api/workOrders.ts` - Extend with createBatch() method
- `apps/frontend/lib/api/purchaseOrders.ts` - Extend with createBatch() method
- `apps/frontend/lib/utils/pasteParser.ts` - Excel/CSV paste parsing utility
- `apps/frontend/lib/utils/autoScheduler.ts` - Auto-scheduling algorithm
- `apps/frontend/__tests__/spreadsheetTable.test.ts` - Unit tests
- `apps/frontend/e2e/spreadsheet-mode-bulk-creation.spec.ts` - E2E tests
- `docs/architecture.md` - Spreadsheet Mode documentation

### MVP Scope

✅ **MVP Features** (ship this):
- Spreadsheet table with inline editing (6 core columns: Product, Qty, Line, Date, Shift, BOM)
- Excel paste (Tab-delimited format only, no CSV import in MVP)
- Drag-drop row reordering with priority calculation
- Auto-scheduling (line assignment, start/end time calculation)
- Batch creation API (WO only, defer PO/TO to Growth)
- Keyboard shortcuts (Tab, Enter, Esc - defer Ctrl+Z, Alt+↑↓ to Growth)
- Mode selection dialog (3 modes, remember choice)

❌ **Growth Phase** (defer):
- CSV file import (use Excel paste in MVP)
- Advanced paste formats (pipe-delimited, custom delimiters)
- Undo/Redo (Ctrl+Z/Y) - manual row delete in MVP
- Column customization (reorder, resize, hide/show) - fixed columns in MVP
- Multi-select rows (Ctrl+Click) for batch delete/edit
- Conditional formatting (highlight overbooked lines, expired dates)
- Export to Excel (reverse flow - download spreadsheet)
- Templates (save spreadsheet as template for reuse)
- Collaborative editing (real-time multi-user)

### Dependencies

**Prerequisites:**
- Existing work_orders, purchase_orders tables with priority field (Epic 0 done)
- BOM snapshot pattern already implemented (wo_materials table)
- Auto-scheduling algorithm (may need new implementation)
- Drag-drop library: @dnd-kit/core or react-beautiful-dnd

**Blocks:**
- Story 1.4.2 (Timeline Mode) - requires Spreadsheet Mode for data model sync
- Story 1.4.3 (Wizard Mode) - independent, can be parallel

### References

- [react-beautiful-dnd Documentation](https://github.com/atlassian/react-beautiful-dnd)
- [@dnd-kit/core Documentation](https://docs.dndkit.com/)
- [Excel Clipboard Formats](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [Virtual Scrolling with react-window](https://github.com/bvaughn/react-window)

### Learnings from Previous Stories

**From Story 1.1 (pgAudit Extension):**
- Performance testing required (<5% overhead in 1.1, <200ms paste response in 1.4.1)
- RLS policy pattern → batch API must filter by org_id

**From Story 1.2 (Electronic Signatures):**
- Modal UI pattern → apply to Mode Selection Dialog, Results Screen
- Transaction pattern → batch creation is all-or-nothing (like signature + entity update)

**From Story 1.3 (FSMA 204):**
- Compliance validation → apply to WO batch creation (KDE validation if FTL product)
- CTE logging → batch creation should log 8 CTE_CREATION events

**From Epic 0 Retrospective:**
- Risk-Based E2E Strategy → drag-drop priority is HIGH RISK (production order impact)
- MVP Discipline → defer CSV import, Ctrl+Z, column customization to Growth Phase
- Incremental Documentation → document only Spreadsheet Mode workflow, not entire Planning module

**Reuse Patterns:**
- QuickPOEntryModal pattern (apps/frontend/components/QuickPOEntryModal.tsx) → inspiration for multi-line entry, auto-fill logic
- Inline editing pattern → similar to existing table edit cells (if implemented elsewhere)
- Keyboard shortcuts → consistent with existing app shortcuts (if any)

### Keyboard Shortcuts Cheat Sheet

**Cell Navigation:**
- Tab: Move to next cell (right)
- Shift+Tab: Move to previous cell (left)
- Enter: Move to next row (down), same column
- Esc: Cancel edit, revert changes

**Row Operations (MVP):**
- Click ⋮⋮ handle + drag: Reorder rows

**Row Operations (Growth Phase):**
- Alt+↑: Move row up
- Alt+↓: Move row down
- Ctrl+Z: Undo last change
- Ctrl+Y: Redo last undone change
- Ctrl+D: Duplicate row
- Delete: Delete selected row

**Data Entry (Growth Phase):**
- Ctrl+V: Paste from clipboard
- Ctrl+C: Copy selected rows
- Ctrl+A: Select all rows

## Dev Agent Record

### Context Reference

<!-- Will be added by story-context workflow -->

### Agent Model Used

<!-- Will be filled during dev-story execution -->

### Debug Log References

### Completion Notes List

### File List
