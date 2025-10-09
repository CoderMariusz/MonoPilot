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
