# Forza MES - TODO List

## Phase 0-2: Planning UI Enhancements ✅ COMPLETED

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

## Phase 9: RLS Policies ✅ COMPLETED

### Basic Security Implementation ✅
- [x] Created 002_rls_policies.sql with Row Level Security
- [x] Enabled RLS on all planning tables
- [x] Added basic read policies (all users)
- [x] Added basic write policies (authenticated users)
- [x] Applied policies to work_orders, purchase_orders, transfer_orders, audit_events

## Phase 10: ASN Upload Modal ✅ COMPLETED

### UploadASNModal Component ✅
- [x] Created UploadASNModal with form fields (ASN number, expected arrival, PO reference)
- [x] Integrated with ASNsAPI.create() method
- [x] Added form validation and error handling
- [x] Integrated modal into PurchaseOrderDetailsModal
- [x] Added "Coming Soon" note for file upload/item entry features

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

## Phase 14: Production Module Enhancement - UI Components ✅ COMPLETED

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

## Phase 16: Production Module Enhancement - Testing ✅ COMPLETED

### API Integration Tests ✅
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

## Phase 17: Production Module Enhancement - Documentation & Deployment 🔄 IN PROGRESS

### Documentation Updates 🔄 IN PROGRESS
- [ ] **API Reference**: Update API_REFERENCE.md with new endpoints and examples
- [ ] **Database Schema**: Update DATABASE_SCHEMA.md with new tables and relationships
- [ ] **Production Delta Guide**: Create production module implementation guide
- [ ] **Scanner Integration Guide**: Create scanner integration documentation

### Seed Data Enhancement 🔄 IN PROGRESS
- [ ] **Update Seed Script**: Add 1:1 flags, reservations, compositions, pallets to seed data
- [ ] **Test Data Sets**: Create comprehensive test data for all scenarios
- [ ] **Cross-WO Scenarios**: Add test data for cross-WO PR intake validation
- [ ] **Traceability Chains**: Create complex traceability test data

### Supabase MCP Integration 🔄 IN PROGRESS
- [ ] **Apply Migrations**: Use Supabase MCP to apply all new migrations (019-025)
- [ ] **Verify Schema**: Check all tables, indexes, constraints, and triggers
- [ ] **Test RPC Functions**: Verify all business logic functions work correctly
- [ ] **RLS Policies**: Test Row Level Security policies for new tables

### Performance Testing 🔄 IN PROGRESS
- [ ] **Large Dataset Testing**: Test with realistic production data volumes
- [ ] **Query Performance**: Verify index usage and query optimization
- [ ] **API Response Times**: Monitor and optimize API endpoint performance
- [ ] **UI Responsiveness**: Test UI components with large datasets

## Phase 18: Future Enhancements (Not Implemented)

### Advanced Production Features
- [ ] **Multi-Phase Routing**: Enhanced routing with per-phase yield tracking
- [ ] **Shelf-Life Policy**: Multi-tier shelf-life policies with per-phase adjustments
- [ ] **Advanced Traceability**: LP tree visualization and complex composition tracking
- [ ] **Real-Time Monitoring**: Live production monitoring with WebSocket updates

### Advanced Scanner Features
- [ ] **Offline Queue**: Handle scanner operations when offline
- [ ] **Batch Operations**: Process multiple LPs in batch operations
- [ ] **Advanced QA**: Multi-level QA approval workflows
- [ ] **Mobile Optimization**: Enhanced mobile scanner interface

### Reporting & Analytics
- [ ] **Advanced KPIs**: Machine learning-based yield predictions
- [ ] **Trend Analysis**: Historical trend analysis and forecasting
- [ ] **Cost Analysis**: Detailed cost tracking per operation
- [ ] **Quality Metrics**: Advanced quality tracking and reporting

## Phase 16: Future Enhancements (Not Implemented)

### Role-Based Access Control (RBAC)
- [ ] Document RBAC approach for future implementation
- [ ] Add role column to users table
- [ ] Update RLS policies to check user roles
- [ ] Hide/disable UI elements based on role
- [ ] Add role checks in API methods

### Advanced Features
- [ ] Add BOM snapshot on WO creation
- [ ] Implement GRN expiry calculation logic
- [ ] Add reporting hooks (prep, no UI change yet)
- [ ] Create CreateSupplierModal and EditSupplierModal components
- [ ] Create CreateWarehouseModal and EditWarehouseModal components

### Advanced Shelf-Life Policy System
- [ ] Implement multi-tier shelf-life policies with per-phase adjustments
- [ ] Add shelf_life_policies and shelf_life_overrides tables
- [ ] Create expiry calculation service with baseline events
- [ ] Add per-phase expiry adjustments to routing operations

### Multi-Phase Scanner with Yield Tracking
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

## Current Status
- ✅ **Phase 0-14**: Fully implemented and tested
- 🔄 **Phase 15**: Future enhancements (RBAC, advanced features)
- 📋 **Ready for**: Supabase migration deployment and production testing

## Next Steps
1. Deploy SQL migrations to Supabase (001_planning_tables.sql, 002_rls_policies.sql, 003_phase14_schema.sql, 004_phase14_rpc_functions.sql)
2. Test with `NEXT_PUBLIC_USE_MOCK_DATA=false` to verify Supabase integration
3. Implement Phase 15 RBAC when user roles are defined
4. Add Phase 15 advanced features as needed
5. Create modal components for Supplier and Warehouse CRUD operations
