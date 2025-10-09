# Forza MES - Manufacturing Execution System

## Overview
Forza MES is a comprehensive Manufacturing Execution System designed to manage and optimize manufacturing operations. It covers planning, production, technical, warehouse, scanner, and administrative functions. The project aims to provide a robust, modern MES solution with a focus on intuitive UI/UX and efficient workflows, built with a modern web stack.

## User Preferences
- All text in English
- I prefer a Filament-like UI design with a neutral/slate color scheme.
- The base font size should be 10px, with 12px on mobile.
- Use Lucide icons throughout the application.
- I prefer iterative development.
- Ask before making major changes.
- I like functional programming.

## System Architecture

### UI/UX Decisions
- **Design System**: Filament-like styling with a neutral/slate color scheme.
- **Typography**: Base font size of 10px (1rem = 10px), 12px on mobile.
- **Layout**: Dark left sidebar, topbar with search and user avatar.
- **Iconography**: Lucide React for all icons.
- **Notifications**: Toast notification system for user feedback.
- **Scanner Modules**: Mobile-optimized with large, touch-friendly buttons (48px+ height) and responsive design. Full-width layout without main app sidebar for scanner terminals.

### Technical Implementations
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Client-side state management with reactive hooks, pnpm workspaces.
- **Backend (To Be Implemented)**: Prisma ORM, Next.js API routes, PostgreSQL, Authentication (Replit Auth preferred), RBAC.
- **State Management**: Client-side state management (`lib/clientState.ts`) with reactive hooks, comprehensive mock data for all modules (`lib/mockData.ts`).
- **Monorepo Structure**: `apps/frontend` for Next.js, `packages/shared` for shared types, `infra` for infrastructure config.

### Feature Specifications
- **Planning Module**: Work Orders (CRUD, material availability, MRP), Purchase Orders (tracking), Transfer Orders (management).
- **Production Module**: Overview dashboard, Yield Reports, Consume Reports, Scanner module integration.
- **Warehouse Module**: Goods Receipt (auto LP generation), Stock movements, LP operations (Split, Amend, QA Status), Location-based inventory.
- **Technical Module**: BOM editor (Process Recipes), Item type management (Meat, Dry Goods, Finish Good, Process), ECN workflow, Machine/Calibration management.
- **Scanner Module**: Process and Pack terminals with unified workflow, barcode scanning simulation, real-time inventory updates, per-order LP tracking, multi-pallet support in Pack Terminal, BOM validation, auto-focus for continuous scanning.
- **Admin Panel**: User Management (7 roles: Operator, Planner, Technical, Purchasing, Warehouse, QC, Admin), Login activity, Session monitoring, System settings.

### System Design Choices
- **Authentication**: Laravel Sanctum with session-based auth (planned). Same domain for frontend and backend.
- **Workflow**: 13-step workflow from item creation to dispatch, encompassing all MES functionalities.
- **Database**: PostgreSQL.
- **APIs**: Next.js API routes for backend integration.

## External Dependencies
- **Frontend Framework**: Next.js 15
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **ORM (Planned)**: Prisma ORM
- **Database (Planned)**: Supabase PostgreSQL or Replit PostgreSQL
- **Authentication (Planned)**: Replit Auth or NextAuth
- **Package Manager**: pnpm
## Recent Changes

- 2025-10-09: **Stock Movement & Yield Report Improvements**
  - **Stock Movement Enhancements**:
    - **Data Enrichment**: Added locations to ClientState and enriched getStockMoves() to populate full nested objects (LP with product, from_location, to_location) by joining based on IDs
    - **Display Logic for Item Creation**:
      - From Location: Shows Work Order number (e.g., "WO-2024-001")
      - To Location: Shows warehouse default location from admin settings
      - LP Number: Displays the created LP number
      - Item Code: Shows product part_number
    - **Display Logic for Manual Consume**:
      - From Location: Shows LP's actual location (where it was before consumption)
      - To Location: Shows Work Order number (what it was consumed to)
      - LP Number: Displays the consumed LP number
      - Item Code: Shows product part_number from consumed LP
    - Added Item Code column to Stock Movements table
    - Added wo_number field to StockMove interface for better traceability
    - Date now shows full timestamp (YYYY-MM-DD HH:MM:SS) instead of just date
    - Both FIFO consumption and manual consume properly record all tracking data
  - **Warehouse LP Stock**:
    - Renamed "LP Operations" tab to "LP Stock" throughout warehouse module
    - Added Item Code column to LP Stock table (shows product part_number)
    - Table now displays: LP Number, Item Code, Product, Location, Quantity, QA Status, Actions
  - **Production Yield Report**:
    - Connected to real-time data from scanner terminals (replaced mock data)
    - Updated table columns to: WO Number, Product, Line, Target Qty, Actual Qty, BOM Materials, Consumed Materials, Yield %
    - BOM Materials column fetches requirements from work order
    - Consumed Materials column shows actual materials used from yield report
    - Efficiency color-coded: Green ≥90%, Orange ≥70%, Red <70%
    - Reports sorted newest first for easy tracking
    - Removed summary cards to focus on individual order details

- 2025-10-09: **LP Stock & Consumption Tracking**
  - **LP Stock Table Enhancements**:
    - Enriched getLicensePlates() to populate full product and location objects
    - No more N/A values - all fields display correctly: Item Code, Product, Location, QA Status
    - QA Status for scanner-created items now defaults to 'Passed' instead of 'Pending'
  - **Stock Movement Improvements**:
    - Item creation movements: From Location shows WO number, To Location shows warehouse from admin settings
    - Updated StockMove type to allow null for from_location_id and to_location_id
  - **Consumption Tracking (NEW)**:
    - Added negative quantity stock movements for consumed materials
    - Each consumed LP creates a movement showing: LP number, item code, quantity consumed (-5 kg), from location (LP's location), to location (WO number), timestamp
    - Both FIFO and manual consume create consumption movements
    - Provides complete traceability: see what was consumed AND what was created

- 2025-10-09: **Settings Module & Allergen Management System**
  - **Settings Page (NEW)**:
    - Added Settings link to main menu sidebar (between Technical and Admin)
    - Three management tabs: Locations, Machines, Allergens
    - Full CRUD functionality for all master data entities
  - **Location Management**:
    - Table displays: Code, Name, Zone, Status (Active/Inactive)
    - Add/Edit/Delete operations with modal forms
    - Form validation and toast notifications
    - Integrated with warehouse operations
  - **Machine Management**:
    - Table displays: Code, Name, Type, Status (Active/Inactive)
    - Add/Edit/Delete operations with modal forms
    - Used for production line equipment tracking
  - **Allergen Management**:
    - Table displays: Code, Name, Description
    - Add/Edit/Delete operations with modal forms
    - Foundation for product allergen tracking
  - **Product Allergen System**:
    - Added allergen_ids field to Product type
    - Multi-select allergen UI in BOM editor
    - Products can have multiple allergens assigned
  - **Allergen Inheritance Logic**:
    - Automatic inheritance from BOM materials
    - If RM has allergen and used in formula, product inherits it
    - Display shows: "Gluten from DG-006 Breadcrumbs"
    - Visual indicator with amber warning styling
    - Works for PROCESS and FINISHED_GOODS products
  - **Production Rates**:
    - Added rate field to FG (Finished Goods) products
    - Measured in units per hour
    - Only visible for FINISHED_GOODS category
    - Used for production planning and scheduling

- 2025-10-09: **Scanner Terminals Complete Rebuild - Manufacturing Staging Workflow**
  - **Complete Workflow Redesign**: Rebuilt both Process and Pack terminals from scratch
  - **Line Selection First**: Production line (Line 1-4) must be selected before work order
  - **Material Staging Workflow**: 
    - Scan LP → Enter quantity to stage → Confirm → Add to staging list
    - Build material staging area before creating items
    - Staging list shows all staged LPs with quantities
  - **Required Materials Section**: 
    - Displays BOM components with check/X icons
    - Green tick when component is staged on the line
    - Red X when component is missing
  - **Smart Create Button**:
    - Positioned below staging table
    - Inactive until all BOM components present (checks items, not kg)
    - Calculates materials needed based on BOM × quantity to create
  - **Missing Materials Handling**:
    - Pop-up modal shows shortages with details
    - Option to "Proceed Anyway" or "Cancel"
  - **FIFO Consumption Logic**:
    - Consumes materials top-to-bottom from staging list
    - Removes LPs when quantity reaches 0
    - Moves to next LP for remaining quantity
  - **Critical Bug Fix**: Prevent staging same LP beyond available quantity
    - Tracks already staged quantity per LP
    - Shows: Original Quantity, Already Staged, Available to Stage
    - Blocks staging if would exceed LP's total quantity
  - **Architecture**: Proper manufacturing staging workflow with BOM validation and FIFO consumption

- 2025-10-09: **Planning & Quality Enhancements**
  - **Planning Modal UOM Fix**:
    - UOM field now auto-populates from selected product's BOM
    - UOM field is read-only/disabled (not editable)
    - Only quantity and product code are user-editable
  - **BOM Priority System**:
    - Added optional priority field to BOM items (number input)
    - Scanner consumption logic now sorts by priority (lower priority consumed first)
    - Items without priority consume together (FIFO within group)
    - Enables custom consumption order for special manufacturing processes
  - **Allergen Display & Management**:
    - Added "Allergens" column to Work Order tables
    - Displays product allergens as amber pill badges
    - Shows inherited allergens from BOM components
  - **Smart Auto-Allergen System**:
    - When adding BOM components with allergens, automatically suggests those allergens for the product
    - Tracks manual vs auto-suggested allergens separately
    - Users can freely remove auto-suggested allergens (suppressions tracked)
    - When BOM component removed, its auto-allergens removed (unless user manually re-added)
    - Prevents stale allergen data and respects user choices
  - **Quarantine Status Blocking**:
    - Scanner terminals now validate LP QA status before staging
    - LPs with "Quarantine" status cannot be scanned/used
    - Shows clear error toast: "Cannot scan LP {number} - Status: Quarantine"
    - Prevents quarantined materials from entering production
    - Implemented in both Process and Pack terminals

- 2025-10-09: **Scanner, Warehouse & Production Fixes**
  - **Scanner Terminal Start Button**:
    - Added "Start Work Order" button for Released work orders
    - Updates order status from Released to In Progress
    - Shows success toast on status change
    - Implemented in both Process and Pack terminals
  - **GRN (Goods Receipt) Enhancements**:
    - Fixed GRN table to display PO number, supplier, and date with timestamp
    - Data enrichment joins PO and supplier information
    - Date displays in YYYY-MM-DD HH:MM:SS format
    - Changed default LP QA status from Pending to Passed (items immediately available)
    - Added GRN tracking to Stock Movement table:
      - Move number: GRN-XXXXX
      - From Location: PO number
      - To Location: Main warehouse
      - Includes LP number, item code, quantity, timestamp
      - Complete traceability from PO to warehouse
  - **Production Yield Report Fixes**:
    - Target Qty: Shows work order quantity (boxes to make)
    - Actual Qty: Shows boxes actually completed
    - BOM Materials: Calculated requirements (target qty × BOM qty per box)
    - Consumed Materials: Actual materials used from yield report
    - Yield %: Correctly calculated as (Actual / Target) × 100
    - Color-coded efficiency: Green ≥90%, Orange ≥70%, Red <70%
  - **Scanner Order Persistence (NEW)**:
    - Added OrderProgress state tracking for in-progress work orders
    - Saves staged LPs, box count, line, and consumed materials
    - Auto-saves progress on every state change
    - Restores full state when returning to order after navigation
    - Progress persists until order is formally closed
    - Shows toast notification when progress is restored
    - Operators can navigate away without losing work
    - Implemented in both Process and Pack terminals
