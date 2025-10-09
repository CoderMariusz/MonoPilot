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
```