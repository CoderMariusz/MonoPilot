# Forza MES - Manufacturing Execution System

## Overview
Comprehensive Manufacturing Execution System (MES) built as a monorepo with:
- **Backend**: Laravel 12 + Filament v4 admin panel
- **Frontend**: Next.js 15 + Tailwind CSS
- **Database**: PostgreSQL
- **Architecture**: Monorepo with pnpm workspaces

## Project Structure
```
forza-mes/
├── apps/
│   ├── backend/          # Laravel 12 + Filament v4
│   └── frontend/         # Next.js 15 + Tailwind
├── packages/
│   └── shared/           # Shared types, contracts, utilities
└── infra/                # Docker, Nginx configuration
```

## Current Status

### Completed
- ✅ Monorepo structure created
- ✅ Laravel 12 + Filament v4 backend installed
- ✅ Next.js 15 frontend with Tailwind CSS
- ✅ PostgreSQL database configured
- ✅ Laravel Sanctum for authentication
- ✅ Filament admin panel installed
- ✅ Frontend running on port 5000
- ✅ Database models and migrations (WorkOrder, Product, BOM, PurchaseOrder, TransferOrder, etc.)
- ✅ **Planning Module** - Work Orders, Purchase Orders, Transfer Orders tabs with API integration
- ✅ **Production Module** - Work Orders view, Yield Report, Consume Report with backend API
- ✅ **Technical Module** - BOM & Items Catalog with 4 category tabs, dynamic Add Item modal, Filament admin resource

### In Progress
- 🔄 Scanner module (/scanner route)
- 🔄 Warehouse module (GRN, Stock Move, LP operations)
- 🔄 Authentication with RBAC (7 roles)

## Technology Stack

### Backend
- PHP 8.4
- Laravel 12
- Filament v4
- Laravel Sanctum (authentication)
- Spatie Laravel Permission (RBAC)
- Spatie Laravel Activity Log (audit trail)
- Barryvdh Laravel DomPDF (label printing)
- Maatwebsite Excel (exports)

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS (10px base font size)
- Lucide React (icons)
- SWR (data fetching)
- Zod (validation)

### Infrastructure
- PostgreSQL 17
- pnpm workspaces
- Node.js 20

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
# Frontend (already running on port 5000)
cd apps/frontend && pnpm dev

# Backend (Laravel)
cd apps/backend && php artisan serve --host=0.0.0.0 --port=8000
```

### Database Migrations
```bash
cd apps/backend && php artisan migrate
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
