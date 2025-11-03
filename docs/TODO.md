# Forza MES - TODO List

**Priorytety:**
- 🟢 **P0** - MVP (Tydz. 1-8, Deadline: 28 XII 2025)
- 🟡 **P1** - Po MVP (Q1 2026)
- ⚪ **P2** - Nice-to-have (Future)

---

## Phase 0-2: Planning UI Enhancements ✅ COMPLETED (P0 - Częściowo zrobione)

### Work Orders Table Enhancements ✅
- [x] Added new columns: WO #, Product, Qty + UoM, Status, Line/Machine, Dates, Priority, Progress %, Shortages, Actions
- [x] Implemented Cancel action with status validation (draft, planned, released)
- [x] Added placeholder calculations for Progress % and Shortages columns

### Work Order Details Modal Enhancements ✅
- [x] Added KPI tiles: Shortages, Plan vs Real, Progress/Yield
- [x] Extended BOM table with Reserved and Shortage columns
- [x] Implemented Cancel WO button with status validation
- [x] Fixed BOM Line column to show production line restrictions instead of machine name

### Client State Updates ✅
- [x] Added cancelWorkOrder function with audit event tracking
- [x] Added cancelPurchaseOrder function with GRN validation
- [x] Added cancelTransferOrder function with status validation
- [x] Fixed TransferOrderDetailsModal to use useTransferOrders hook

## Phase 3: Purchase Orders - Cancel & ASN Prep ✅ COMPLETED

### PurchaseOrderDetailsModal Enhancements ✅
- [x] Added Cancel PO button (enabled if no GRNs, status allows)
- [x] Added Upload ASN button (opens ASN upload modal)
- [x] Implemented GRN validation for cancel action
- [x] Added status-based button enabling/disabling

## Phase 4: Transfer Orders - Cancel Action ✅ COMPLETED

### TransferOrderDetailsModal Enhancement ✅
- [x] Added Cancel Transfer button with status validation
- [x] Enabled for draft, submitted, in_transit statuses
- [x] Disabled for received, cancelled statuses
- [x] Integrated with API layer for cancellation

## Phase 5: Client State Cancel Functions ✅ COMPLETED

### Cancel Functions Implementation ✅
- [x] Implemented cancelPurchaseOrder with GRN checks and audit events
- [x] Implemented cancelTransferOrder with status checks and audit events
- [x] Added proper error handling and success messages
- [x] Exported functions for use in components

## Phase 6: API Layer Extension ✅ COMPLETED

### Supabase Client Pattern Implementation ✅
- [x] Created PurchaseOrdersAPI with getAll, getById, cancel, close methods
- [x] Created TransferOrdersAPI with getAll, getById, cancel methods
- [x] Created ASNsAPI with create, getAll, getById methods (stub for Phase 10)
- [x] Updated WorkOrdersAPI with cancel method
- [x] Updated API index file to export new API classes
- [x] Maintained dual-mode pattern (mock/real data) with feature flag

## Phase 7: Supabase Schema ✅ COMPLETED

### SQL Migration Files ✅
- [x] Created 001_planning_tables.sql with all planning tables:
  - Products, BOMs, BOM Items, Work Orders, WO Materials
  - Suppliers, Purchase Orders, Purchase Order Items, GRNs, GRN Items
  - Transfer Orders, Transfer Order Items, Audit Events
  - ASNs, ASN Items
- [x] Added proper indexes for performance optimization
- [x] Included foreign key relationships and constraints

## Phase 8: Component API Integration ✅ COMPLETED

### Modal Component Updates ✅
- [x] Updated WorkOrderDetailsModal to use WorkOrdersAPI.cancel()
- [x] Updated PurchaseOrderDetailsModal to use PurchaseOrdersAPI.cancel()
- [x] Updated TransferOrderDetailsModal to use TransferOrdersAPI.cancel()
- [x] Maintained existing hooks (useWorkOrders, usePurchaseOrders, useTransferOrders)
- [x] Added proper error handling and user feedback

## Phase 9: RLS Policies ✅ COMPLETED (🟢 P0 - MVP)

### Basic Security Implementation ✅
- [x] Created 002_rls_policies.sql with Row Level Security
- [x] Enabled RLS on all planning tables
- [x] Added basic read policies (all users)
- [x] Added basic write policies (authenticated users)
- [x] Applied policies to work_orders, purchase_orders, transfer_orders, audit_events

### 🟢 P0 MVP - Wymagane dodatkowo:
- [ ] **Smoke-test przecieków danych** (multi-tenant testing)
- [ ] **RLS policies dla wszystkich tabel** (production, warehouse, technical)
- [ ] **Test scenariuszy zabezpieczeń** (unauthorized access, cross-tenant)

## Phase 10: ASN → GRN → LP Flow ✅ COMPLETED PARTIALLY (🟢 P0 - MVP)

### UploadASNModal Component ✅
- [x] Created UploadASNModal with form fields (ASN number, expected arrival, PO reference)
- [x] Integrated with ASNsAPI.create() method
- [x] Added form validation and error handling
- [x] Integrated modal into PurchaseOrderDetailsModal
- [x] Added "Coming Soon" note for file upload/item entry features

### 🟢 P0 MVP - Pełny flow ASN→GRN→LP:
- [ ] **Walidacja ASN vs PO** (quantity matching, product matching)
- [ ] **Różnice ilości** (over/under delivery handling)
- [ ] **Autogeneracja LP** z GRN (automatic license plate creation)
- [ ] **Lokacje wejściowe** (receiving locations setup)
- [ ] **Numeracja dokumentów** (GRN numbering system)
- [ ] **GRN → LP** (complete integration with license plates)
- [ ] **ASN Items management** (full item entry, not just header)

## Phase 11: Role-Based Access Control (Future Enhancement)

### RBAC Implementation (Placeholder)
- [ ] Document RBAC approach for future implementation
- [ ] Add role column to users table
- [ ] Update RLS policies to check user roles
- [ ] Hide/disable UI elements based on role
- [ ] Add role checks in API methods

## Phase 13: UI-Only Changes ✅ COMPLETED

### Status Values Alignment ✅
- [x] Updated WorkOrderStatus, PurchaseOrderStatus, TransferOrderStatus types
- [x] Added missing type definitions for Supplier, Warehouse, ProductionOutput
- [x] Updated Location interface to include warehouse_id field
- [x] Updated BomItem interface to include unit_cost_std field

### Button Enablement & Frontend Guards ✅
- [x] Updated WorkOrdersTable canCancel() and added canDelete(), canEditQuantityOnly()
- [x] Updated WorkOrderDetailsModal canCancel() and added canEditQuantityOnly()
- [x] Updated PurchaseOrderDetailsModal canCancelPO() with proper status checks
- [x] Updated TransferOrderDetailsModal canCancel() with proper status checks

### WO List - Made & Progress Bar ✅
- [x] Added production_outputs store to clientState
- [x] Created getWoProductionStats() helper function
- [x] Added "Made" and "Progress" columns to WorkOrdersTable with progress bars
- [x] Added KPI tiles to WorkOrderDetailsModal showing Made/Planned quantities

### PO - Supplier Select + Buyer from Session ✅
- [x] Created mockSuppliers with sample supplier data
- [x] Added suppliers store to clientState with getSuppliers() method
- [x] Created useSuppliers() hook
- [x] Updated CreatePurchaseOrderModal and EditPurchaseOrderModal to use supplier select
- [x] Auto-set buyer from AuthContext profile (buyer_id and buyer_name)

### PO Pricing - Default from BOM ✅
- [x] Added unit_cost_std field to all mockBomItems with realistic pricing
- [x] Created resolveDefaultUnitPrice() helper function in clientState
- [x] Updated CreatePurchaseOrderModal and EditPurchaseOrderModal to auto-fill unit price
- [x] Implemented pricing fallback chain: BOM standard cost → Product standard price → 0

### TO Uses Warehouses (Not Locations) ✅
- [x] Created mockWarehouses with sample warehouse data
- [x] Updated mockLocations to reference warehouse_id
- [x] Added warehouses store to clientState with getWarehouses() method
- [x] Created useWarehouses() hook
- [x] Updated CreateTransferOrderModal and EditTransferOrderModal to use warehouse selects
- [x] Updated TransferOrderDetailsModal to display warehouse names

## Phase 14: Backend Implementation ✅ COMPLETED

### Supabase Schema Updates ✅
- [x] Created 003_phase14_schema.sql with warehouses, suppliers, production_outputs tables
- [x] Added unit_cost_std to bom_items, buyer fields to purchase_orders
- [x] Updated transfer_orders to use warehouse references
- [x] Added proper indexes for performance optimization
- [x] Included sample data for warehouses and suppliers

### API Extensions ✅
- [x] Extended WorkOrdersAPI with getProductionStats() method
- [x] Extended PurchaseOrdersAPI with getDefaultUnitPrice() method
- [x] Created SuppliersAPI class with full CRUD operations
- [x] Created WarehousesAPI class with full CRUD operations
- [x] Updated all cancel methods to use RPC functions

### RPC Functions ✅
- [x] Created 004_phase14_rpc_functions.sql with business logic functions
- [x] Implemented get_material_std_cost() for pricing resolution
- [x] Implemented cancel_work_order(), cancel_purchase_order(), cancel_transfer_order()
- [x] Added set_po_buyer_snapshot() for audit trail
- [x] All functions include proper status validation and audit event creation

### API-RPC Integration ✅
- [x] Updated WorkOrdersAPI.cancel() to use cancel_work_order RPC
- [x] Updated PurchaseOrdersAPI.cancel() to use cancel_purchase_order RPC
- [x] Updated TransferOrdersAPI.cancel() to use cancel_transfer_order RPC
- [x] All cancel operations now enforce business rules server-side

### Settings CRUD UIs ✅
- [x] Updated Settings page to include Suppliers and Warehouses tabs
- [x] Created SuppliersTable component with full CRUD interface
- [x] Created WarehousesTable component with full CRUD interface
- [x] Added proper icons, status indicators, and action buttons
- [x] Integrated with SuppliersAPI and WarehousesAPI classes

## Phase 15: BOM System Enhancement ✅ COMPLETED

### Database Schema & Migrations ✅
- [x] Created migration 005_product_taxonomy_enums.sql with enums, alter products table, migrate data, add constraints
- [x] Created migration 006_tax_allergens.sql with tax codes table, enhance allergens, create product_allergens junction
- [x] Created migration 007_supplier_products.sql with supplier_products junction table for per-supplier pricing
- [x] Created migration 008_bom_routing.sql with BOM versioning, routings, routing_operations, wo_operations tables
- [x] Created migration 009_routing_requirements.sql with multi-choice routing requirements (Smoke, Roast, Dice, Mix)

### TypeScript Types & API Layer ✅
- [x] Updated packages/shared/types.ts with ProductGroup, ProductType enums and all new interfaces (TaxCode, SupplierProduct, Routing, etc.)
- [x] Created apps/frontend/lib/api/taxCodes.ts with TaxCodesAPI class (getAll, getById, create, update)
- [x] Created apps/frontend/lib/api/supplierProducts.ts with SupplierProductsAPI class (getBySupplier, getByProduct, create, update, delete)
- [x] Created apps/frontend/lib/api/routings.ts with RoutingsAPI class (getAll, getById, create, update, delete)

### Client State & Mock Data ✅
- [x] Updated apps/frontend/lib/clientState.ts with new stores (taxCodes, supplierProducts, routings, productAllergens) and hooks, enhance resolveDefaultUnitPrice
- [x] Updated apps/frontend/lib/mockData.ts with mockTaxCodes, mockSupplierProducts, mockRoutings, mockProductAllergens, update mockProducts with new fields

### UI Components & User Experience ✅
- [x] Refactor apps/frontend/components/BomCatalogClient.tsx to use group/type instead of category, update badge colors
- [x] Enhanced apps/frontend/components/AddItemModal.tsx with new sections: Purchasing, enhanced Allergens, BOM & Routing, Drygoods specifics
- [x] Enhanced BOM editor in AddItemModal with scrap%, optional, phantom, versioning UI (duplicate, version up, activate, schedule)
- [x] Made AddItemModal 20% wider (max-w-3xl → max-w-6xl) for better component editing experience

### Settings Management ✅
- [x] Added Tax Codes tab to apps/frontend/app/settings/page.tsx and create TaxCodesTable.tsx component
- [x] Added Routings tab to settings with multi-choice requirements management
- [x] Added supplier product pricing UI (either in SuppliersTable or AddItemModal) for managing supplier-specific pricing

### Business Logic Implementation ✅
- [x] Updated PO creation logic to use supplier_products pricing first, then BOM cost, then std_price in CreatePurchaseOrderModal and EditPurchaseOrderModal
- [x] Implemented routing requirements with multi-choice selection (Smoke, Roast, Dice, Mix) and rebuild routing UI
- [x] Test migration, UI workflows (product creation, BOM versioning, allergen propagation), data integrity, and RLS policies

### Key Features Delivered ✅
- **Multi-phase routing** with yield per phase and per-phase adjustments
- **Full traceability** via License Plates with parent-child relationships
- **Shelf-life policy** foundation with per-phase adjustments
- **Explicit Drygoods types** (WEB, LABEL, BOX, ING, SAUCE)
- **Supplier links** with per-supplier pricing
- **Allergen tagging** with many-to-many relationships
- **FG rule enforcement** (always COMPOSITE, never MEAT)

## Phase 11: Production Module Enhancement - Database Schema ✅ COMPLETED

### Database Schema & Migrations ✅
- [x] **New Tables Created**: wo_materials (BOM snapshot), lp_reservations, lp_compositions, pallets, pallet_items
- [x] **Enhanced Existing Tables**: Updated enums, license_plates, work_orders, wo_operations with proper constraints
- [x] **BOM Snapshot Trigger**: Created trigger to automatically snapshot BOM on work order creation
- [x] **LP Numbering Enhancement**: Updated stage_suffix constraint to allow 2-letter codes
- [x] **Trace Functions**: Enhanced forward/backward trace to include lp_compositions and pallets

### Database Tests ✅
- [x] **LP Numbering Tests**: Test 8-digit LP numbering with parent relationships
- [x] **Reservation Tests**: Test available quantity calculations and reservation conflicts
- [x] **Composition Tests**: Test LP composition chains and multi-level relationships
- [x] **QA Gate Tests**: Test QA blocking and supervisor override functionality
- [x] **BOM Snapshot Tests**: Test BOM snapshot creation and versioning

## Phase 12: Production Module Enhancement - API Layer ✅ COMPLETED

### Read APIs ✅
- [x] **Work Orders API**: Enhanced with filters, stage status, and Supabase MCP integration
- [x] **Yield API**: Created PR/FG yield APIs with time bucket filtering
- [x] **Consume API**: Created consumption tracking with variance calculations
- [x] **Traceability API**: Enhanced forward/backward trace with composition support
- [x] **License Plates API**: Created LP management with composition tracking

### Write APIs ✅
- [x] **Close Work Order**: Implemented with validation and audit trail
- [x] **Record Weights**: Created operation weight recording with 1:1 validation
- [x] **Reservations**: Implemented LP reservation system with available quantity checks
- [x] **BOM Snapshot Updates**: Created manual BOM snapshot update functionality
- [x] **Pallets**: Implemented pallet creation and LP composition management

### Scanner Integration APIs ✅
- [x] **Stage Board API**: Real-time operation status with color coding
- [x] **Process Terminal**: Staging, weight recording, operation completion
- [x] **Pack Terminal**: Pallet creation and LP composition tracking
- [x] **QA Override**: Supervisor PIN-based QA status changes

## Phase 13: Production Module Enhancement - Excel Exports ✅ COMPLETED

### Export Infrastructure ✅
- [x] **SheetJS Integration**: Installed xlsx package and created export utilities
- [x] **Export Helpers**: Created CSV and XLSX conversion utilities
- [x] **Export Endpoints**: Created Excel export APIs for all data types:
  - [x] Yield reports (PR/FG)
  - [x] Consumption reports
  - [x] Traceability reports
  - [x] Work orders export
  - [x] License plates export
  - [x] Stock moves export

## Phase 14: Production Module Enhancement - UI Components ✅ COMPLETED (🟢 P0 - MVP wymagają usprawnień)

### Production UI Components ✅
- [x] **Work Orders Tab**: Enhanced with filters, yield calculations, and close actions
- [x] **Yield Tab**: Created with KPI cards, trend charts, and time bucket selection
- [x] **Consume Tab**: Created with variance tracking and color-coded indicators
- [x] **Operations Tab**: Created with per-operation weight tracking
- [x] **Trace Tab**: Created with tree view for forward/backward traceability
- [x] **Record Weights Modal**: Enhanced with yield calculation and validation

### Scanner UI Components ✅
- [x] **Stage Board**: Real-time operation status with color coding (red/amber/green)
- [x] **Staged LPs List**: LP management with reservation tracking
- [x] **Scanner Panel**: Enhanced with stage suffix display and LP barcode input
- [x] **Record Weights Modal**: Scanner-specific weight recording with 1:1 validation
- [x] **QA Override Modal**: Supervisor PIN-based QA status changes

### 🟢 P0 MVP - Scanner UX Improvements:
- [ ] **Ścieżki błędów** (comprehensive error handling and user feedback)
- [ ] **Retry mechanisms** (graceful retry on failures)
- [ ] **Skan kodów** (improved barcode scanning with validation)
- [ ] **Komunikaty** (clear user messages in Polish/English)
- [ ] **Ergonomia** (mobile-first design, large buttons, touch-friendly)

### 🟢 P0 MVP - Warehouse Mobile (Pick/Putaway):
- [ ] **Reguły lokacji** (location rules and validation)
- [ ] **Rezerwacje LP** (LP reservation management)
- [ ] **Tryb "gruba rękawica"** (glove-friendly UI, large touch targets)
- [ ] **Responsywność** (mobile optimization for warehouse devices)

## Phase 15: Production Module Enhancement - Business Logic ✅ COMPLETED

### Business Rules Implementation ✅
- [x] **Sequential Routing**: Enforces operation sequence validation
- [x] **Hard 1:1 Rule**: Validates one-to-one component relationships
- [x] **Cross-WO PR Validation**: Ensures exact product matching across work orders
- [x] **Reservation-Safe Operations**: Prevents operations exceeding available quantities
- [x] **QA Gate Enforcement**: Blocks operations with failed QA status (with supervisor override)

### Business Logic Orchestrator ✅
- [x] **Staging Validation**: Combines all validation rules for staging operations
- [x] **Weight Recording Validation**: Validates 1:1 relationships and sequential routing
- [x] **Operation Completion**: Ensures proper completion sequence and weight recording

## 🟢 P0 MVP - QA Lite + COA (Tydz. 3-4)

### QA System Enhancement (NOWE)
- [ ] **Statusy LP** (Pending/Passed/Failed/Quarantine - rozszerzenie obecnych)
- [ ] **COA PDF Generation** (Certificate of Analysis per LP)
  - [ ] Tabela wyników testów per LP
  - [ ] Format PDF z logo i danymi firmy
  - [ ] Download/print functionality
  - [ ] Email COA to supplier
- [ ] **QA Test Results** (tabela wyników QA)
- [ ] **QA Workflow** (proces testowania z assignee)

## 🟢 P0 MVP - Drukowanie Etykiet (Tydz. 3-4)

### Label Printing System (NOWE)
- [ ] **LP Labels (ZPL)** 
  - [ ] ZPL template for license plates
  - [ ] Barcode generation (LP number)
  - [ ] Product info, quantity, dates
  - [ ] Zebra printer integration
- [ ] **PO/NCR Labels (PDF)**
  - [ ] PDF templates for PO
  - [ ] PDF templates for NCR
  - [ ] Standard label printer support
  - [ ] Batch printing capability

## 🟢 P0 MVP - NCR → RTS System (Tydz. 3-4)

### Non-Conformance Report (NOWE)
- [ ] **NCR Creation** (zgłoszenie z produkcji)
  - [ ] NCR form with issue description
  - [ ] Auto-trace (automatic traceability)
  - [ ] LP → Quarantine (automatic status change)
  - [ ] Severity levels
- [ ] **MRB Process** (Material Review Board)
  - [ ] Review workflow
  - [ ] Disposition options (scrap/rework/use-as-is/return)
  - [ ] Approval workflow
- [ ] **RTS - Return to Supplier** (Stage 1-3)
  - [ ] Stage 1: Create RTS request
  - [ ] Stage 2: Supplier notification (auto-email)
  - [ ] Stage 3: Track return status
- [ ] **Auto-mail do dostawcy** (email notifications)

## 🟢 P0 MVP - Supplier Portal (Tydz. 5-6)

### Supplier Collaboration Portal (NOWE)
- [ ] **Public Link/Token** (unauthenticated access with token)
- [ ] **PO View** (supplier can view their POs)
- [ ] **Accept/Reject** PO with comment
- [ ] **Timeline** (PO history and status changes)
- [ ] **ASN Upload** (supplier uploads ASN)
- [ ] **NCR View** (supplier sees NCR related to them)
- [ ] **Email Notifications** (automatic alerts)

## 🟢 P0 MVP - Costing Basic (Tydz. 5-6)

### WO P&L Reporting (NOWE)
- [ ] **Unit Cost Standard** (`unit_cost_std` integration)
- [ ] **Actual vs Standard** comparison
  - [ ] Material costs (zużycia)
  - [ ] Output values (wyjścia)
  - [ ] Variance analysis
- [ ] **WO P&L Report** (per Work Order profitability)
  - [ ] Total material cost
  - [ ] Total output value
  - [ ] Labor cost (basic)
  - [ ] Profit/Loss calculation
- [ ] **Export to Excel**

## 🟢 P0 MVP - Settings (Tydz. 5-6)

### Cost Variance Thresholds (NOWE)
- [ ] **Settings Modal** (`/settings/costing`)
- [ ] **Progi % odchyleń** (percentage thresholds)
  - [ ] Material cost variance %
  - [ ] Yield variance %
- [ ] **Progi kwotowe** (absolute value thresholds)
  - [ ] Max material cost variance
  - [ ] Max P&L variance
- [ ] **Database Table** (`costing_settings`)
- [ ] **Alerts** (trigger alerts when thresholds exceeded)

## 🟢 P0 MVP - QA Reporting (Tydz. 7-8)

### Quality Metrics (NOWE - rozszerzenie Phase 13)
- [ ] **FPY** (First Pass Yield calculation)
- [ ] **Scrap Rate** (scrap percentage tracking)
- [ ] **MV/Rollups** (material variance rollups)
- [ ] **Filtry** (org/plant/line/product filters)
- [ ] **Eksport CSV/PDF** (export capabilities)
- [ ] **Dashboard** (QA metrics visualization)

## 🟢 P0 MVP - Hardening (Tydz. 7-8)

### Production Readiness (rozszerzenie Phase 17)
- [ ] **Indeksy/Performance** (database index optimization)
- [ ] **Logi błędów** (comprehensive error logging)
- [ ] **Retry/Idempotencja** (retry logic and idempotent APIs)
- [ ] **DPIA** (Data Protection Impact Assessment)
- [ ] **DPA** (Data Processing Agreement)
- [ ] **NDA** (Non-Disclosure Agreement templates)
- [ ] **Backup Strategy** (database backup plan)
- [ ] **Monitoring** (application monitoring setup)

## Phase 16: Production Module Enhancement - Testing ✅ COMPLETED (🟢 P0 - Brak większości testów)

### API Integration Tests ✅ (DO USUNIĘCIA - user nie ma testów)
- [x] **Work Orders Tests**: Test close WO, stage status, and business logic
- [x] **Operations Tests**: Test weight recording, 1:1 enforcement, and sequential routing
- [x] **Reservations Tests**: Test create/delete reservations and available quantity
- [x] **Traceability Tests**: Test forward/backward trace and tree building
- [x] **Exports Tests**: Test Excel generation and error handling

### UI Component Tests ✅
- [x] **WorkOrdersTable Tests**: Test filtering, sorting, and action buttons
- [x] **YieldReportTab Tests**: Test KPI calculations and view toggles
- [x] **StageBoard Tests**: Test color codes, metrics, and user interactions
- [x] **RecordWeightsModal Tests**: Test validation, 1:1 enforcement, and yield calculation

### Jest Configuration ✅
- [x] **Test Setup**: Created jest.config.js and jest.setup.js with proper mocks
- [x] **Mock Configuration**: Mocked Supabase client, Next.js router, and API modules
- [x] **Coverage Thresholds**: Set 70% coverage requirements for all modules
- [x] **Test Scripts**: Added test, test:watch, test:coverage, test:ci scripts

## Phase 17: Production Module Enhancement - Documentation & Deployment 🔄 IN PROGRESS (🟢 P0 - MVP)

### Documentation Updates 🔄 IN PROGRESS (🟢 P0)
- [ ] **API Reference**: Update API_REFERENCE.md with new endpoints and examples
- [ ] **Database Schema**: Update DATABASE_SCHEMA.md with new tables and relationships
- [ ] **Production Delta Guide**: Create production module implementation guide
- [ ] **Scanner Integration Guide**: Create scanner integration documentation
- [ ] **Automatic Docs Update Script**: Create script to auto-generate docs from code

### Seed Data Enhancement 🔄 IN PROGRESS (🟢 P0)
- [ ] **Update Seed Script**: Add 1:1 flags, reservations, compositions, pallets to seed data
- [ ] **Test Data Sets**: Create comprehensive test data for all scenarios
- [ ] **Cross-WO Scenarios**: Add test data for cross-WO PR intake validation
- [ ] **Traceability Chains**: Create complex traceability test data

### Supabase MCP Integration 🔄 IN PROGRESS (🟢 P0)
- [ ] **Apply Migrations**: Use Supabase MCP to apply all new migrations (019-025)
- [ ] **Verify Schema**: Check all tables, indexes, constraints, and triggers
- [ ] **Test RPC Functions**: Verify all business logic functions work correctly
- [ ] **RLS Policies**: Test Row Level Security policies for new tables

### Performance Testing 🔄 IN PROGRESS (🟢 P0 - część Hardening)
- [ ] **Large Dataset Testing**: Test with realistic production data volumes
- [ ] **Query Performance**: Verify index usage and query optimization
- [ ] **API Response Times**: Monitor and optimize API endpoint performance
- [ ] **UI Responsiveness**: Test UI components with large datasets

### 🟢 P0 MVP - Testy E2E (Playwright + Supabase):
- [x] **Auth Tests**: Zachowane (login, signup, auth-state, debug-login)
- [ ] **P0 Coverage**: Planning, Production, Warehouse, Scanner E2E tests (DO STWORZENIA)

## Phase 18: BOM Lifecycle & Versioning ✅ COMPLETED

### BOM Lifecycle Management ✅
- [x] Renamed `one_to_one` → `consume_whole_lp` in `bom_items` and `wo_materials`
- [x] Added BOM status ENUM ('draft', 'active', 'archived')
- [x] Implemented single active BOM per product (unique index)
- [x] Created guard trigger to prevent hard delete of active/archived BOMs
- [x] Added `archived_at` and `deleted_at` timestamps for audit trail

### BOM Versioning ✅
- [x] Implemented automatic version bumping (minor vs major changes)
- [x] Minor changes: Description, Std Price, Expiry Policy, Shelf Life, Allergens
- [x] Major changes: BOM items added/removed/modified
- [x] Added "Change Version" button for manual override
- [x] Version format: X.Y (e.g., 1.0, 1.1, 2.0)

### Clone-on-Edit Pattern ✅
- [x] Editing active BOM creates new draft version
- [x] Draft BOMs can be edited directly
- [x] Activating draft BOM archives previous active
- [x] Preserves BOM history for audit and rollback

### PO Prefill from BOM ✅
- [x] Added `tax_code_id`, `lead_time_days`, `moq` to `bom_items`
- [x] Snapshot prefill data to `wo_materials` on WO creation
- [x] PO creation can use BOM prefill data

### Archive Tab ✅
- [x] Added ARCHIVE tab to BomCatalogClient
- [x] MEAT/DRYGOODS: Archive when `is_active = false`
- [x] COMPOSITE (PR/FG): Archive when `boms.status = 'archived'`
- [x] Proper filtering logic for all tabs

### UI Enhancements ✅
- [x] Updated CompositeProductModal with BOM management UI
- [x] Added BOM status buttons (Active/Draft/Archive)
- [x] Implemented allergen inheritance from BOM components
- [x] Added loading indicators for allergens
- [x] Hidden BOM columns for MEAT/DRYGOODS tabs
- [x] Updated SingleProductModal with Product Status (is_active)

### Documentation ✅
- [x] Updated DATABASE_SCHEMA.md with BOM lifecycle tables
- [x] Updated DATABASE_RELATIONSHIPS.md with BOM versioning
- [x] Updated BOM_ARCHITECTURE.md with lifecycle management
- [x] Updated TODO.md with completed tasks

## Phase 19: Data Validation & Audit Trail (🟡 P1 - Po MVP)

### BOM Data Validation (🟡 P1)
- [ ] **Circular BOM Reference Detection**: Prevent infinite loops in BOM structure
  - Create recursive query to detect circular references
  - Add validation before BOM activation
  - Display error message with circular path
  
- [ ] **Version Format Validation**: Ensure version follows X.Y format
  - Add regex validation: `^[0-9]+\.[0-9]+$`
  - Validate in frontend (CompositeProductModal)
  - Validate in backend (BOM API endpoints)
  
- [ ] **Product Type Material Validation**: Enforce allowed materials per product type
  - PR can only use MEAT, DRYGOODS
  - FG can use MEAT, DRYGOODS, PR
  - Add database constraint or trigger
  - Frontend validation in component selection
  
- [ ] **Max BOM Depth Limit**: Prevent excessively nested BOMs
  - Define max depth (e.g., 5 levels)
  - Create recursive function to calculate depth
  - Block BOM activation if depth exceeded

### Audit Trail System (🟡 P1)
- [ ] **Create audit_log Table**: Track all changes to critical data
  ```sql
  CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'ARCHIVE', 'ACTIVATE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_reason TEXT,
    ip_address INET,
    user_agent TEXT
  );
  ```
  
- [ ] **Add Triggers for Audit Logging**: Auto-populate audit_log
  - BOM status changes (draft → active → archived)
  - Product activation/deactivation (`is_active`)
  - BOM version bumps
  - Critical field changes (price, allergens, BOM items)
  - Work order snapshot updates
  
- [ ] **Implement Change Reason Field**: Require user to explain changes
  - Add "Change Reason" modal for major changes
  - Required for: BOM activation, version bumps, archiving
  - Optional for: Minor edits (description, price)
  - Store in `audit_log.change_reason`
  
- [ ] **Create Audit Trail Viewer UI**: Admin panel to view change history
  - Filter by: table, user, date range, action type
  - Display: old values → new values (diff view)
  - Export audit log to Excel
  - Search functionality

### BOM Approval Workflow (🟡 P1)
- [ ] **Create bom_approvals Table**: Track approval requests
  ```sql
  CREATE TABLE bom_approvals (
    id SERIAL PRIMARY KEY,
    bom_id INTEGER REFERENCES boms(id),
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE
  );
  ```
  
- [ ] **Implement Approval Workflow**: Require manager approval for BOM activation
  - User submits BOM for approval
  - Manager reviews and approves/rejects
  - Email notifications for approval requests
  - BOM can only be activated after approval

### BOM Comparison & History (🟡 P1)
- [ ] **BOM Comparison Tool**: Visual diff between BOM versions
  - Side-by-side comparison view
  - Highlight added/removed/modified items
  - Show field-level changes
  - Export comparison to PDF
  
- [ ] **BOM History Viewer**: Display all BOM versions
  - Timeline view of BOM changes
  - Version metadata (created by, date, status)
  - Restore previous version (clone)
  - Version notes/comments

## Phase 20: Work Order Snapshot Management (🟡 P1 - Po MVP)

### WO Snapshot Update (🟡 P1)
- [ ] **Implement Snapshot Update API**: `POST /api/production/work-orders/:id/snapshot-update`
  - Allowed only for PLANNED WOs
  - Blocked if issues or outputs exist
  - Preview diff before applying
  - Confirm update with user
  
- [ ] **Snapshot Preview with Diff**: Show changes before applying
  - Display added materials
  - Display removed materials
  - Display modified quantities
  - Highlight breaking changes
  
- [ ] **Conflict Detection**: Identify issues before update
  - Check for reserved LPs
  - Check for issued materials
  - Check for production outputs
  - Block update if conflicts exist
  
- [ ] **Snapshot Update Approval**: Require approval for critical updates
  - Production manager approval
  - Audit trail for snapshot changes
  - Rollback capability

### Scanner Validation (🟡 P1)
- [ ] **Enforce 1:1 Validation**: For `consume_whole_lp` materials
  - Check `wo_materials.consume_whole_lp` flag
  - Validate: scanned qty = LP qty
  - Display error if partial consumption attempted
  - Track 1:1 violations in audit log
  
- [ ] **Scanner Validation Rules Table**: Configurable validation rules
  ```sql
  CREATE TABLE scanner_validation_rules (
    id SERIAL PRIMARY KEY,
    rule_name TEXT NOT NULL,
    rule_type TEXT CHECK (rule_type IN ('qty_match', 'expiry_check', 'qa_gate', 'location_check')),
    is_active BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```
  
- [ ] **Real-time Validation Feedback**: Instant validation in scanner UI
  - Visual indicators (green/red)
  - Audio feedback (beep on error)
  - Detailed error messages
  - Override capability for supervisors
  
- [ ] **Scanner Error Logging**: Track all scanner errors
  - Error type and message
  - User who encountered error
  - Timestamp and location
  - Resolution (override, corrected, cancelled)

### PO Prefill Enhancement (🟡 P1)
- [ ] **Modify PO Creation Endpoint**: Use BOM prefill data
  - `GET /api/planning/boms/:bomId/prefill-data`
  - Return: unit_cost_std, tax_code_id, lead_time_days, moq
  - Auto-populate PO line items
  
- [ ] **Override Capability**: Allow manual override of prefilled values
  - Track prefilled vs manual values
  - Display indicator for prefilled fields
  - Audit trail for overrides
  
- [ ] **Prefill Accuracy Reporting**: Track prefill vs actual values
  - Compare prefilled price vs final PO price
  - Identify materials with frequent overrides
  - Suggest BOM cost updates

## Phase 21: Future Enhancements (⚪ P2 - Nice-to-have)

### Advanced Production Features (⚪ P2)
- [ ] **Multi-Phase Routing**: Enhanced routing with per-phase yield tracking
- [ ] **Shelf-Life Policy**: Multi-tier shelf-life policies with per-phase adjustments
- [ ] **Advanced Traceability**: LP tree visualization and complex composition tracking
- [ ] **Real-Time Monitoring**: Live production monitoring with WebSocket updates

### Advanced Scanner Features (⚪ P2)
- [ ] **Offline Queue**: Handle scanner operations when offline
- [ ] **Batch Operations**: Process multiple LPs in batch operations
- [ ] **Advanced QA**: Multi-level QA approval workflows
- [ ] **Mobile Optimization**: Enhanced mobile scanner interface

### Reporting & Analytics (⚪ P2)
- [ ] **Advanced KPIs**: Machine learning-based yield predictions
- [ ] **Trend Analysis**: Historical trend analysis and forecasting
- [ ] **Cost Analysis**: Detailed cost tracking per operation
- [ ] **Quality Metrics**: Advanced quality tracking and reporting

## 🟡 P1 - NPD / Idea Management (Po MVP - BRAK w obecnym TODO)

### ETAP 1: Pomysły (🟡 P1 - NOWE)
- [ ] **Idea Submission** (formularz zgłaszania pomysłów)
- [ ] **Idea Review** (proces oceny pomysłów)
- [ ] **Idea Board** (tablica pomysłów w stylu Kanban)
- [ ] **Voting System** (głosowanie na pomysły)

### ETAP 2: NPD Pipeline (🟡 P1 - NOWE)
- [ ] **Project Creation** (tworzenie projektów NPD)
- [ ] **Stage Gates** (bramy etapowe)
- [ ] **Approval Workflow** (przepływ zatwierdzeń)
- [ ] **Resource Allocation** (alokacja zasobów)

### ETAP 3: Commercialization (🟡 P1 - NOWE)
- [ ] **Product Launch** (wprowadzenie produktu)
- [ ] **Recipe Management** (zarządzanie recepturami)
- [ ] **Cost Estimation** (szacowanie kosztów)
- [ ] **Market Readiness** (gotowość rynkowa)

## 🟡 P1 - Engineering / CMMS-lite (Po MVP - BRAK w obecnym TODO)

### Equipment Management (🟡 P1 - NOWE)
- [ ] **Equipment Registry** (rejestr wyposażenia)
- [ ] **Maintenance Schedule** (harmonogram konserwacji)
- [ ] **Work Orders** (zlecenia prac)
- [ ] **Spare Parts** (części zamienne)

### Calibration Management (🟡 P1 - NOWE)
- [ ] **Calibration Schedule** (harmonogram kalibracji)
- [ ] **Calibration Records** (rekordy kalibracji)
- [ ] **Certificate Management** (zarządzanie certyfikatami)
- [ ] **Alerts** (powiadomienia o upływających terminach)

### Preventive Maintenance (🟡 P1 - NOWE)
- [ ] **PM Plans** (plany konserwacji zapobiegawczej)
- [ ] **PM Execution** (wykonanie PM)
- [ ] **Checklist Management** (zarządzanie checklistami)
- [ ] **History Tracking** (historia konserwacji)

## Phase 11: Role-Based Access Control (🟡 P1 - Future Enhancement)

### RBAC Implementation (Placeholder) (🟡 P1)
- [ ] Document RBAC approach for future implementation
- [ ] Add role column to users table
- [ ] Update RLS policies to check user roles
- [ ] Hide/disable UI elements based on role
- [ ] Add role checks in API methods

### Advanced Features (⚪ P2)
- [ ] Add BOM snapshot on WO creation
- [ ] Implement GRN expiry calculation logic
- [ ] Add reporting hooks (prep, no UI change yet)
- [ ] Create CreateSupplierModal and EditSupplierModal components
- [ ] Create CreateWarehouseModal and EditWarehouseModal components

### Advanced Shelf-Life Policy System (⚪ P2)
- [ ] Implement multi-tier shelf-life policies with per-phase adjustments
- [ ] Add shelf_life_policies and shelf_life_overrides tables
- [ ] Create expiry calculation service with baseline events
- [ ] Add per-phase expiry adjustments to routing operations

### Multi-Phase Scanner with Yield Tracking (⚪ P2)
- [ ] Enhance scanner to support multi-phase production workflows
- [ ] Implement automatic yield calculation and weight tracking
- [ ] Add expiry computation per phase
- [ ] Create LP tree visualization for traceability

---

## Architecture Decisions Made

### Backend Integration Approach
- **Decision**: Use Supabase Client directly (not Prisma) for consistency with existing pattern
- **Rationale**: Avoid over-engineering, maintain existing dual-mode pattern
- **Implementation**: Extended existing `lib/api` layer with new API classes
- **Benefit**: Seamless switching between mock and real data via feature flag

### API Layer Pattern
- **Pattern**: Dual-mode classes with static methods (like existing UsersAPI)
- **Feature Flag**: `shouldUseMockData()` function controls mock vs Supabase
- **Consistency**: All new API classes follow same pattern as existing code

### Security Approach
- **RLS**: Basic Row Level Security with read/write permissions
- **Future**: Role-based policies can be added in Phase 15
- **Audit**: All cancel actions create audit events for tracking

### Business Rules Implementation
- **Frontend Guards**: UI-level validation for immediate user feedback
- **Backend Validation**: RPC functions enforce business rules server-side
- **Audit Trail**: All business rule violations and changes are logged
- **Status Management**: Comprehensive status-based access control

---

---

## 📊 Current Status Summary

### ✅ Completed (Phases 0-18)
- Planning UI & Backend (WO/PO/TO)
- BOM System Enhancement (versioning, routing, taxonomy)
- Production Module (database, API, UI, business logic)
- Scanner Integration (Stage Board, terminals)
- BOM Lifecycle & Versioning

### 🔄 In Progress (Phase 17)
- Documentation & Deployment
- Seed Data Enhancement
- Supabase MCP Integration
- Performance Testing

### 🟢 P0 MVP - Do Zrobienia (Deadline: 28 XII 2025)
**Tydz. 1-2: Fundamenty**
- RLS + multi-tenant smoke tests
- ASN→GRN→LP pełny flow
- Scanner UX improvements
- Warehouse Mobile (Pick/Putaway)

**Tydz. 3-4: QA & Etykiety & NCR**
- QA Lite + COA PDF
- Drukowanie etykiet (LP ZPL, PO/NCR PDF)
- NCR → RTS (lite) z auto-mail

**Tydz. 5-6: Dostawcy & Koszty & Settings**
- Supplier Portal (MVP)
- Costing Basic (WO P&L)
- Settings — progi odchyleń

**Tydz. 7-8: Raporty & Hardening & Testy**
- QA Reporting (lite)
- Hardening (indeksy, logi, retry, DPIA/DPA/NDA)
- Testy E2E (Playwright + Supabase)

### 🟡 P1 - Po MVP (Q1 2026)
- Data Validation & Audit Trail (Phase 19)
- Work Order Snapshot Management (Phase 20)
- NPD / Idea Management (ETAP 1-3)
- Engineering / CMMS-lite

### ⚪ P2 - Nice-to-have (Future)
- Advanced Production Features (Phase 21)
- Advanced Scanner Features
- Reporting & Analytics (ML-based)
- Advanced Shelf-Life Policy System

---

## 🎯 Next Steps (MVP)
1. ✅ Zaktualizować TODO.md z priorytetami P0/P1/P2
2. 🔄 Usunąć testy (poza auth)
3. 🔄 Stworzyć automatyczny skrypt aktualizacji dokumentacji
4. 🟢 Zaimplementować zadania P0 MVP (Tydz. 1-8)
5. 🔄 Deploy SQL migrations to Supabase
6. 🔄 Test with `NEXT_PUBLIC_USE_MOCK_DATA=false`
