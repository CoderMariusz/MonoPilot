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

### Completed (Phase 1)
- ✅ Monorepo structure created
- ✅ Laravel 12 + Filament v4 backend installed
- ✅ Next.js 15 frontend with Tailwind CSS
- ✅ PostgreSQL database configured
- ✅ Laravel Sanctum for authentication
- ✅ Filament admin panel installed
- ✅ Frontend running on port 5000

### In Progress
- 🔄 Database models and migrations
- 🔄 Authentication with RBAC (7 roles)
- 🔄 Module development (Planning, Production, Warehouse, Technical)

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
- 2025-10-08: Initial project setup completed
  - Monorepo structure created (apps/backend, apps/frontend, packages/shared, infra)
  - Laravel 12 + Filament v4 installed and configured
  - Next.js 15 + Tailwind CSS installed and configured  
  - PostgreSQL 17 database configured with environment variables
  - Both Backend (port 8000) and Frontend (port 5000) workflows running successfully
  - Shared package with TypeScript types and Zod schemas initialized
  - Infrastructure files (docker-compose.yml, nginx.conf) created
  - Security: .env properly gitignored, .env.example uses env var placeholders
