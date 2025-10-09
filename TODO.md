# Forza MES - TODO List

## Phase 1: Frontend Fixes (Current Priority)

### Planning Module Fixes
- [ ] Add search fields to all tables (WO, PO, TO) with item code search capability
- [ ] Add item code column to Work Orders table
- [ ] Add delete/remove functionality to all order tables
- [ ] Add schedule time fields (from/to) in create order modals

### Scanner Module Fixes
- [ ] Redesign Process terminal - unified workflow (scan LP → select order → create PR)
- [ ] Redesign Pack terminal - unified workflow (scan LP → select order → create FG)
- [ ] Add order switcher dropdown at top of both terminals
- [ ] Filter to show only 'planned' status orders in scanner
- [ ] Fix quantity deduction bug in process terminal
- [ ] Add validation alerts for wrong item scans

## Phase 2: Backend Integration

### Data Storage & Authentication
- [ ] Set up Prisma ORM with complete database schema
- [ ] Configure Supabase or Replit PostgreSQL connection
- [ ] Implement Replit Auth for sign-in
- [ ] Create Next.js API routes for all modules
- [ ] Replace clientState with real API calls

### User Access Levels
- [ ] Implement RBAC with 7 user access levels:
  - Operator
  - Planner
  - Technical
  - Purchasing
  - Warehouse
  - QC
  - Admin

## Phase 3: Tool Connections
- [ ] Connect website to external tools (TBD based on requirements)

---

## Notes
- Frontend is complete with static data and client-side state management
- All modules functional: Planning, Production, Technical, Warehouse, Scanner, Admin
- Mobile-optimized Scanner terminals for handheld devices
- Ready for backend integration once fixes are complete
