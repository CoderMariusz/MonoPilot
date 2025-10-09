# Forza MES - Manufacturing Execution System

## Overview
Comprehensive Manufacturing Execution System (MES) built with modern stack:
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Prisma ORM (to be connected)
- **Database**: Supabase/Replit PostgreSQL (to be configured)
- **Auth**: Replit Auth or NextAuth (to be implemented)
- **Architecture**: Next.js-only monorepo with client-side state management

## Project Structure
```
forza-mes/
├── apps/
│   └── frontend/         # Next.js 15 + TypeScript + Tailwind
│       ├── app/          # App Router pages
│       ├── components/   # React components
│       └── lib/          # Utilities, types, client state
├── packages/
│   └── shared/           # Shared types, contracts (future use)
└── infra/                # Infrastructure config (future use)
```

## Current Status (October 2025 - Complete Frontend Rebuild)

### Phase 1 - Frontend Complete ✅
All modules built with static data and client-side state management:

- ✅ **Planning Module** - Work Orders, Purchase Orders, Transfer Orders (full CRUD)
- ✅ **Production Module** - Work Orders view, Yield Report, Consume Report
- ✅ **Technical Module** - BOM & Items Catalog (Meat, Dry Goods, Process, Finished Goods)
- ✅ **Warehouse Module** - GRN, Stock Move, LP Operations (full CRUD)
- ✅ **Scanner Module** - Process & Pack terminals (mobile-optimized for handheld devices)
- ✅ **Admin Module** - User Management, Sessions, Settings
- ✅ Client-side state management (lib/clientState.ts) with reactive hooks
- ✅ Comprehensive mock data for all modules
- ✅ Filament-like UI design (neutral/slate colors, 10px base font)

### Phase 2 - Backend Integration (Next Steps)
- 🔄 Set up Prisma ORM with complete schema
- 🔄 Configure Supabase or Replit PostgreSQL
- 🔄 Implement authentication (Replit Auth preferred)
- 🔄 Create Next.js API routes for all modules
- 🔄 Connect frontend to backend (replace clientState with API calls)
- 🔄 Implement RBAC (7 roles: Operator, Planner, Technical, Purchasing, Warehouse, QC, Admin)

## Technology Stack

### Frontend (Current)
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS (10px base font size, 12px on mobile)
- Lucide React (icons)
- Client-side state management with hooks
- Toast notifications

### Backend (To Be Implemented)
- Prisma ORM
- Next.js API routes
- PostgreSQL (Supabase or Replit)
- Authentication (Replit Auth or NextAuth)
- RBAC with 7 roles

### Infrastructure
- Node.js 20
- pnpm workspaces
- Single Next.js application (port 5000)

## Key Features (Planned)

### Planning Module
- Work Orders (WO) management with material availability checking
- Purchase Orders (PO) tracking
- Transfer Orders (TO) management
- MRP calculations

### Production Module
- Overview dashboard (machine-by-WO)
- Reporting (Yield Reports, Consume Reports)
- Scanner module (Process & Pack terminals)

### Warehouse Module
- Goods Receipt (GRN) with auto LP generation
- Stock movements and transfers
- LP operations (Split, Amend, QA Status)
- Location-based inventory

### Technical Module
- BOM editor with Process Recipes
- Item type management (Meat, Dry Goods, Finish Good, Process)
- ECN workflow
- Machine/Calibration management

### Admin Panel
- User management
- Login activity tracking
- Session monitoring
- System-wide settings

## Development Workflow

### Running the Application
```bash
# Frontend (Next.js on port 5000)
cd apps/frontend && pnpm dev
```

### Future: Database Migrations (Prisma)
```bash
# Push schema to database
npm run db:push

# Generate Prisma client
npx prisma generate
```

## Architecture Decisions

### Authentication
- Laravel Sanctum with session-based auth
- Same domain for frontend and backend
- 7 roles: Operator, Planner, Technical, Purchasing, Warehouse, QC, Admin

### UI/UX Guidelines
- Filament-like styling (neutral/slate color scheme)
- Base font size: 10px (1rem = 10px)
- Dark left sidebar
- Topbar with search and user avatar
- All text in English
- Lucide icons throughout

### 13-Step Workflow
1. Add Item to system
2. Create Process Recipe (multiple RM → one PR)
3. Create Finish Product BOM (multiple items → one FG)
4. Create PO or TO for items
5. Receive items in warehouse (GRN)
6. Move items between locations
7. Create Work Order (Planning)
8. Start Work Order (Production/Scanner)
9. Consume Stock (reserve items to WO)
10. Create Item from WO (against BOM)
11. Move items to Warehouse (putaway)
12. Close Work Order (consume, calculate yields)
13. Send Items Out (shipping/dispatch)

## Security Notes
- `.env` files are gitignored and never committed
- `.env.example` uses environment variable placeholders (${PGHOST}, ${PGPORT}, etc.)
- Database credentials are managed through Replit secrets
- All sensitive configuration uses environment variables

## Recent Changes

- 2025-10-09: **Scanner Module Workflow Enhancement - Separated Confirm & Create Actions**
  - **Workflow Separation**: Separated "Confirm Quantity" from "Create Item" into distinct actions
  - **New Flow**: Scan LP → Enter Quantity → Confirm → Create Item (can repeat without rescanning)
  - **Repeat Functionality**: Users can create multiple items from same LP by confirming new quantities
  - **Quantity Lock**: Input disabled when confirmed to prevent accidental changes during creation
  - **UI Navigation**: Removed sidebar from scanner terminals, added back button in topbar
  - **Full-Width Layout**: Both terminals now display full-width without main app sidebar
  - **Process Terminal**: Blue "Confirm Quantity" button, then green "Create Process Recipe" button
  - **Pack Terminal**: Green "Confirm Quantity" button, then "Create Finished Good" button
  - **Mobile-First**: Large touch-friendly buttons maintained throughout
  - **Architecture**: All state changes persist in clientState, ready for backend integration

- 2025-10-09: **Scanner Module Final Fixes - Unified Workflow Complete**
  - **AlertDialog Component**: Created reusable modal component for validation errors
  - **BOM Validation Alerts**: Both terminals now show modal pop-up (not toast) when LP doesn't match BOM
  - **Auto-Focus Feature**: After alert dismissal, LP input auto-focuses for continuous scanning flow
  - **Process Terminal**: Creates PR items at default location (location_id: 3) with PR-{timestamp} LP codes
  - **Pack Terminal**: Creates FG items at default location (location_id: 1) with FG-{timestamp} LP codes
  - **Unified Workflow**: Both terminals identical except header color (blue/green) and output type (PR/FG)
  - **UI Fix**: Removed location selector from Pack terminal to match Process terminal exactly
  - **Created Items Display**: Fixed undefined labels, both terminals display output items correctly
  - **Complete Flow**: Select WO → Scan LP → Validate → Enter Quantity → Create Output → Auto-focus for next scan
  - **Architecture**: All state changes persist in clientState, ready for backend integration

- 2025-10-09: **Frontend Fixes & Enhancements - Planning & Scanner Modules**
  - **Planning Module Enhancements**:
    - Added search functionality to all tables (WO, PO, TO) with item code search
    - Added item code column to Work Orders table
    - Added delete functionality to Work Orders table with confirmation
    - Added schedule time fields (from/to) in CreateWorkOrderModal
    - Updated WorkOrder type with scheduled_start and scheduled_end fields
  - **Scanner Module Redesign**:
    - Redesigned Process terminal with unified workflow (scan LP → select order → create PR)
    - Redesigned Pack terminal with unified workflow (scan LP → select order → create FG)
    - Added order selector dropdown filtering only "planned" status work orders
    - Fixed quantity deduction bug - WOs now properly update quantities
    - Added validation alerts for wrong item scans
    - Both terminals now follow same pattern with different outputs
  - **Architecture**: All changes use client-side state management, ready for backend integration

- 2025-10-09: **Complete Frontend Rebuild - All Modules Completed**
  - **Backend Removal**: Deleted entire Laravel/PHP backend, removed Backend workflow
  - **Client-Side State Management**: Built reactive state system (lib/clientState.ts) with hooks for all entities
  - **Static Data Layer**: Created comprehensive mock data (lib/mockData.ts) for all modules
  - **Planning Module Enhancement**: Added full PO and TO CRUD operations (create, edit, delete, view)
  - **Warehouse Module**: Built GRN, Stock Move, and LP Operations interfaces with full functionality
  - **Scanner Module**: Created mobile-optimized Process and Pack terminals for handheld devices
    - Large touch-friendly buttons (48px+ height)
    - Barcode scanning simulation
    - Real-time inventory updates
    - Responsive design for small screens (12px base font on mobile)
  - **Admin Module**: Built User Management, Session Monitoring, and System Settings
    - 7 role types with color-coded badges
    - User CRUD operations
    - Session revoke functionality
    - System-wide settings configuration
  - **Architecture**: Pure Next.js application, ready for Prisma/Supabase backend integration

## Recent Changes (Previous - Laravel Era)
- 2025-10-08: Work Order Creation & Details functionality completed
  - **CreateWorkOrderModal**: Added machine dropdown with api.machines.list() loading
  - **WorkOrderDetailsModal**: Shows BOM components, stock levels, and completion progress
  - **Critical Fix - Completed Quantity Calculation**: Changed from "produce" to "consume" moves tracking
    - Now accurately tracks how much of each BOM component has been consumed for the work order
    - Properly reflects work order progress based on material consumption
  - **MachineController**: Created backend controller with index() and show() endpoints
    - Returns active machines ordered by name
    - Routes: GET /machines and GET /machines/{machine}
  - **Frontend API**: Added machines namespace with list() and get() methods
  - **WO Number**: Auto-generated with format WO-{timestamp}
  - **Filtering**: Only PR and FG products can have work orders created (RM excluded)
  - All TypeScript errors resolved, architect review passed

- 2025-10-08: Technical Module - BOM Edit & Delete functionality completed
  - **Fixed category-to-type mapping**: MEAT/DRYGOODS→RM, PROCESS→PR, FINISHED_GOODS→FG (corrected from WIP to PR)
  - **Material selection for BOMs**: Process can now use Meat + Dry Goods; Finished Goods can use Meat + Dry Goods + Process
  - **Delete functionality**: Replaced View icon with Delete (red trash) icon, added confirmation dialog, DELETE API route with 204 handling
  - **Edit functionality**: Full edit support with pre-filled modal, BOM component editing, PUT API route
  - **Type definitions**: Added BomItem interface with material relationship, updated Bom interface with bomItems array
  - **Backend updates**: ProductController now handles BOM updates (delete existing, create new), loads activeBom.bomItems.material
  - All CRUD operations (Create, Read, Update, Delete) now working for all product categories

- 2025-10-08: Technical Module completed
  - Extended products table with category, subtype, expiry_policy, shelf_life_days, std_price fields
  - Created product_line_settings table for FG per-line cost/rate configurations
  - Built ProductController API with category-specific validation and BOM creation
  - Built ProductLineSettingsController for bulk upsert and per-line management
  - Created Filament ProductResource with Details, BOM, and Per-Line Settings tabs
  - Built /technical/bom page with 4 category tabs (Meat, Dry Goods, Finished Goods, Process)
  - Implemented Add Item modal with dynamic fields based on category selection (MEAT/DRYGOODS: expiry policies; FINISHED_GOODS: BOM components; PROCESS: creation date expiry)
  - Used Next.js Server Components to resolve client-side fetch issues in development mode
  - Toast notification system for user feedback
  - Complete TypeScript types and Zod validation for all product categories
  - Fixed 405 error: Added POST handler to /api/products/route.ts (specific route was missing mutating methods)

- 2025-10-08: Production Module completed
  - Created Production page (/production) with 3 tabs: Work Orders, Yield Report, Consume Report
  - Built backend API endpoints: `/api/production/yield-report` and `/api/production/consume-report`
  - Implemented yield calculation (based on WO completion status) and consumption calculation (based on BOM items)
  - Created shared WorkOrdersTable component used by both Planning and Production (ensures identical WO views)
  - Added proper TypeScript types for all report data structures
  - All reports fetch real data from backend with loading/error states

- 2025-10-08: Planning Module completed
  - Created Planning page (/planning) with 3 tabs: Work Orders, Purchase Orders, Transfer Orders
  - Built Laravel API with WorkOrderController, PurchaseOrderController, TransferOrderController
  - Created Next.js API proxy at /app/api/[...path]/route.ts with proper status code/header forwarding
  - Implemented type-safe API client in lib/api.ts
  - Fixed Next.js 15 async params requirement

- 2025-10-08: Initial project setup completed
  - Monorepo structure created (apps/backend, apps/frontend, packages/shared, infra)
  - Laravel 12 + Filament v4 installed and configured
  - Next.js 15 + Tailwind CSS installed and configured  
  - PostgreSQL 17 database configured with environment variables
  - Both Backend (port 8000) and Frontend (port 5000) workflows running successfully
  - Shared package with TypeScript types and Zod schemas initialized
  - Infrastructure files (docker-compose.yml, nginx.conf) created
  - Security: .env properly gitignored, .env.example uses env var placeholders
