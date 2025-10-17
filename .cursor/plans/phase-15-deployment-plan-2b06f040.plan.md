<!-- 2b06f040-64d0-499d-8170-89fbf3497105 616496ef-73bd-4437-b965-9ba3ff9cde05 -->
# Phase 15.3: Live Testing & Validation - Completion Plan

## Step 1: Create Minimal Mock Data for Local Development

Create a new `apps/frontend/lib/mockData.ts` with minimal data for local development only:

- Export empty arrays for all required entities (Products, WorkOrders, PurchaseOrders, etc.)
- Add 2-3 sample records per entity for basic testing
- Use `@ts-nocheck` at the top to bypass type checking
- This file will only be used when `NEXT_PUBLIC_USE_MOCK_DATA=true` (local dev)

Example structure:

```typescript
// @ts-nocheck
export const mockProducts: Product[] = [];
export const mockWorkOrders: WorkOrder[] = [];
export const mockPurchaseOrders: PurchaseOrder[] = [];
// ... etc
```

## Step 2: Fix Vercel Configuration Error

Update `vercel.json`:

- Remove line 4: `"name": "monopilot",` (deprecated property causing warning)
- Keep the correct function pattern: `"apps/frontend/app/api/**/*.ts"`

## Step 3: Start Local Development Server

Run the dev server on localhost:

```bash
cd apps/frontend && npm run dev
```

The server should start on `http://localhost:5000`

## Step 4: Manual Testing on Localhost

Test all major routes manually in browser at `localhost:5000`:

1. **Health Check**: `http://localhost:5000/api/health`

   - Expected: `{"status":"ok","timestamp":"..."}`

2. **Login Page**: `http://localhost:5000/login`

   - Expected: Login form renders without errors

3. **Planning Module**: `http://localhost:5000/planning`

   - Expected: Work Orders table loads

4. **Production Module**: `http://localhost:5000/production`

   - Expected: Production overview renders

5. **Warehouse Module**: `http://localhost:5000/warehouse`

   - Expected: License Plates table renders

6. **Settings Module**: `http://localhost:5000/settings`

   - Expected: Settings tabs render (Suppliers, Warehouses, Tax Codes,

### To-dos

- [ ] Remove deprecated 'name' property from vercel.json
- [ ] Configure Vercel production environment variables (NEXT_PUBLIC_USE_MOCK_DATA=false, Supabase keys)
- [ ] Test all major routes on localhost:5000 (health, login, planning, production, warehouse, settings)
- [ ] Deploy to Vercel production with updated configuration
- [ ] Validate production deployment using Vercel MCP or manual testing
- [ ] Verify live Supabase database connection and test CRUD operations
- [ ] Run Supabase advisors for security and performance checks
- [ ] Update TODO.md with Phase 15.3 completion status and deployment summary