# Forza MES - Manufacturing Execution System

## Overview
Forza MES is a comprehensive Manufacturing Execution System designed to manage and optimize manufacturing operations. It covers planning, production, technical, warehouse, scanner, and administrative functions. The project aims to provide a robust, modern MES solution with a focus on intuitive UI/UX and efficient workflows, built with a modern web stack, to enhance efficiency and traceability in manufacturing.

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
- **Typography**: Base font size of 10px, 12px on mobile.
- **Layout**: Dark left sidebar, topbar with search and user avatar.
- **Iconography**: Lucide React for all icons.
- **Notifications**: Toast notification system.
- **Scanner Modules**: Mobile-optimized with large, touch-friendly buttons (48px+ height), responsive design, and full-width layout without the main app sidebar.

### Technical Implementations
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, pnpm workspaces.
- **Backend (Planned)**: Prisma ORM, Next.js API routes, PostgreSQL, Authentication (Replit Auth preferred), RBAC.
- **State Management**: Client-side state management (`lib/clientState.ts`) with reactive hooks, comprehensive mock data (`lib/mockData.ts`).
- **Monorepo Structure**: `apps/frontend` for Next.js, `packages/shared` for shared types, `infra` for infrastructure config.

### Feature Specifications
- **Planning Module**: Work Orders (CRUD, material availability, MRP), Purchase Orders, Transfer Orders.
- **Production Module**: Overview dashboard, Yield Reports, Consume Reports, Scanner integration.
- **Warehouse Module**: Goods Receipt (auto LP generation), Stock movements, LP operations (Split, Amend, QA Status), Location-based inventory.
- **Technical Module**: BOM editor (Process Recipes), Item type management, ECN workflow, Machine/Calibration management.
- **Scanner Module**: Process and Pack terminals with unified workflow, barcode scanning simulation, real-time inventory updates, per-order LP tracking, multi-pallet support, BOM validation, auto-focus for continuous scanning, material staging, FIFO consumption, and quarantine status blocking.
- **Admin Panel**: User Management (7 roles), Login activity, Session monitoring, System settings (Locations, Machines, Allergens).
- **Allergen Management System**: Product allergen tracking, automatic inheritance from BOM materials, visual indicators, and production rate management for Finished Goods.

### System Design Choices
- **Authentication**: Laravel Sanctum with session-based auth (planned), same domain for frontend and backend.
- **Workflow**: 13-step workflow from item creation to dispatch.
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

- 2025-10-09: **Planning, Production & Scanner Advanced Features**
  - **BOM Component Line Selection in Scanner Terminals**:
    - Added line selection dropdown for BOM components with specific production_lines (not 'ALL')
    - Operators can choose which production line's materials to consume for line-restricted components
    - Validation ensures all required line selections are made before item creation
    - Consumption logic filters staged LPs by selected component line
    - Staging now correctly persists component line selection (not WO line) for proper matching
    - Implemented in both Process and Pack terminals with full end-to-end workflow
  - **Edit Functionality for Planning Tables**:
    - Added Edit button to Work Orders table with full edit modal support
    - CreateWorkOrderModal now supports edit mode - populates existing data and calls updateWorkOrder
    - Purchase Orders and Transfer Orders already had edit functionality (verified working)
    - Fixed LSP type errors in modals (status type, import issues)
    - All three planning tables (WO, PO, TO) have complete CRUD operations

- 2025-10-10: **Line-Specific BOM Filtering & Conditional Components**
  - **Work Order Creation Flow Redesigned**:
    - Product selection comes FIRST, line selection comes AFTER
    - Available lines calculated dynamically from product's BOM components (union of all lines)
    - Line dropdown shows only lines compatible with product's BOM
    - Enables BOM components to be line-specific (conditional manufacturing recipes)
  - **Dynamic BOM Filtering System**:
    - Work Orders preserve full original product BOM (no mutation)
    - BOM filtering happens dynamically at read-time using getFilteredBomForWorkOrder()
    - Components included if: production_lines is empty/undefined OR includes 'ALL' OR includes selected line
    - Allows editing WO between lines without losing component data
  - **Line-Specific Manufacturing**:
    - Example: Sausage with BOM (Meat: lines 3,4 | Seasoning: ALL | Casing: line 3 only)
    - Available lines for WO: 3, 4 (union of all component lines)
    - Line 3 selected → BOM includes: Meat, Seasoning, Casing (all 3 components)
    - Line 4 selected → BOM includes: Meat, Seasoning only (Casing excluded)
  - **All Consumers Updated**:
    - Production Yield Reports display line-specific BOMs
    - Scanner Process Terminal uses filtered BOMs for consumption
    - Scanner Pack Terminal uses filtered BOMs for consumption
    - Work Order Details Modal shows filtered BOMs
    - All filtering centralized in getFilteredBomForWorkOrder() function
  - **BOM Editor Enhancements**:
    - Fixed CreateWorkOrderModal to use reactive useProducts() hook - newly created FG/PR items appear immediately
    - Added production_lines multi-select field for each BOM component in AddItemModal
    - Users can now define which lines each component can run on (e.g., '3', '4', or 'ALL')
    - BOM editor shows 6 columns: Product, Quantity, UoM, Sequence, Priority, Production Lines
  - **Test Data Added**:
    - Premium Italian Sausage (FG) with line-specific BOM components
    - Premium Pork Meat (lines 3, 4), Italian Seasoning (ALL), Natural Casing (line 3), Synthetic Casing (line 4)
    - Demonstrates conditional manufacturing: Line 3 uses Natural Casing, Line 4 uses Synthetic Casing
    - BomItem.production_lines takes priority over material.production_lines in filtering logic
  - **UI/UX Improvements - Production Lines Selector**:
    - Created reusable ProductionLinesDropdown component with checkbox dropdown interface
    - Replaced both main product production lines field and BOM component production lines selector
    - Dropdown button displays: "Select lines...", "All lines", machine name, or "X lines selected"
    - Opens to show checkboxes for ALL + individual machines with clear visual selection
    - Selecting ALL disables individual machine checkboxes
    - Fixed critical bugs: ALL checkbox can now be toggled on/off, visual state matches selection state
    - Consistent UI across both product configuration and BOM component line assignment
  - **Critical Bug Fixes - Work Order System**:
    - Fixed CreateWorkOrderModal line selection to use product.production_lines directly (not BOM component union)
    - Work Order line dropdown now correctly shows only lines defined on the parent product
    - Example: FG-001 (lines 1,2) with components MT-123 (lines 1,2) and MT-234 (lines 2,3) → WO shows only lines 1,2
    - Fixed WorkOrderDetailsModal to use reactive useWorkOrders() instead of static mock data
    - Newly created Work Orders can now be viewed immediately without "does not exist" errors
    - Details modal now calculates BOM details dynamically from current state using getFilteredBomForWorkOrder()
    - Added "Line" column to WO Details BOM table showing which production line was selected for the Work Order
    - Fixed AddItemModal BOM component line dropdown to show only parent product's production_lines (not all machines)
    - Fixed WorkOrdersTable to display wo.machine?.name instead of wo.line_number
    - Fixed scanner terminals (Process and Pack) to filter WOs by wo.machine?.name for newly created work orders
  - **Table Enhancements - Sorting & Search**:
    - Added column sorting to Work Orders table (WO Number, Product, Quantity, Status, Line, Due Date)
    - Added column sorting to Purchase Orders table (PO Number, Supplier, Status, Due Date, Items Count)
    - Added column sorting to Transfer Orders table (TO Number, From/To Locations, Status, Created Date, Items Count)
    - Click column header to toggle ascending/descending sort with visual arrow indicators
    - Added search bars to all Warehouse tables: Goods Receipt Notes, Stock Moves, License Plates
    - Search filters by relevant fields (GRN numbers, suppliers, LP numbers, locations, item codes, etc.)
    - Real-time case-insensitive search with contextual empty states