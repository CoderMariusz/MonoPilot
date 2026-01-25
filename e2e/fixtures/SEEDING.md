# E2E Test Data Seeding

This document describes the test data seeding system for Production module E2E tests.

## Overview

The seeding system automatically creates all required test data before running E2E tests:
- Test organization with fixed UUID
- Test users (admin and operator roles)
- Production settings for the test org
- Products (Flour, Yeast, Bread)
- BOM (Bill of Materials) for bread production
- Production lines and machines
- Work order with status='released'
- License plate with test inventory

## Key Features

- **Predictable UUIDs**: All test data uses fixed UUIDs for consistency across test runs
- **Idempotency**: Seeding script checks if data already exists before inserting
- **Automatic**: Seeding runs automatically during global setup before any tests
- **Cleanup**: Optional cleanup after tests complete

## Test Data IDs

### Fixed IDs Used in Tests

```
Organization:      550e8400-e29b-41d4-a716-446655440001
Work Order:        wo-id-123 (status=released, quantity=100)
License Plate:     LP-001 (qty=100 KG flour)
Product (Flour):   550e8400-e29b-41d4-a716-446655440401
Product (Bread):   550e8400-e29b-41d4-a716-446655440403
Line A:            550e8400-e29b-41d4-a716-446655440601
Line B:            550e8400-e29b-41d4-a716-446655440602
```

These IDs must match what's used in test files (search for 'wo-id-123', 'LP-001').

## How Seeding Works

### Automatic Seeding (Default)

Seeding runs automatically before tests via `e2e/global-setup.ts`:

```bash
# Just run tests - seeding happens automatically
pnpm test:e2e

# Run specific test file
pnpm test:e2e e2e/tests/production/consumption-desktop.spec.ts
```

### Manual Seeding

If you need to seed data manually:

```bash
# Create a script to run seeding (if needed)
pnpm run build  # Build the project first
node -r tsx e2e/fixtures/seed-production-data.ts
```

### Cleanup

By default, test data persists after tests for faster subsequent runs.

To clean up:

```bash
# Clean up test database data after tests
CLEANUP_TEST_DATA=true pnpm test:e2e

# Clean up both database AND auth files
CLEANUP_AUTH=true CLEANUP_TEST_DATA=true pnpm test:e2e
```

## Seeding Flow

The seeding script creates data in this order:

1. **Organization** - Test org container
2. **Users** - Admin and operator users
3. **Production Settings** - Module configuration
4. **Warehouse** - Main warehouse
5. **Locations** - Raw materials and finished goods bins
6. **Products** - Flour, yeast, bread
7. **BOM** - Recipe for bread with flour and yeast
8. **Production Lines** - Line A and Line B
9. **Machines** - Oven and mixer
10. **Work Order** - Released WO for bread (wo-id-123)
11. **License Plates** - Flour inventory (LP-001, 100 KG)

Each step includes an idempotency check - if data already exists, it's skipped.

## RLS & Test User

All seeded data belongs to the test organization. Tests use:

- **Email**: admin@monopilot.com
- **Password**: test1234
- **Role**: admin
- **Organization**: e2e-test-org

See `.env.test` for test credentials.

## Troubleshooting

### Tests Fail: "wo-id-123 not found"

This means seeding didn't run or failed. Check:

1. Environment variables are set in `.env.test`
2. Supabase credentials are correct:
   ```bash
   cat .env.test | grep SUPABASE
   ```
3. Database migrations are up to date:
   ```bash
   pnpm supabase:sync
   ```

### Seeding Timeout

If seeding takes too long:

1. Check internet connection to Supabase
2. Check Supabase project status
3. Run cleanup and try again:
   ```bash
   CLEANUP_TEST_DATA=true pnpm test:e2e
   ```

### RLS Policy Errors

If you see "permission denied" errors:

1. Verify SUPABASE_SERVICE_ROLE_KEY is set (not the anon key)
2. Check RLS policies on production_settings table:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'production_settings';
   ```

## Exported Test Data

The seeding script exports `PRODUCTION_TEST_DATA` constant:

```typescript
import { PRODUCTION_TEST_DATA } from '../fixtures/seed-production-data';

// Use in tests:
const woId = PRODUCTION_TEST_DATA.workOrder.id;  // 'wo-id-123'
const lpQty = PRODUCTION_TEST_DATA.licensePlate.quantity;  // 100
```

## Adding New Test Data

To add more seeded data:

1. Add UUID to `TEST_UUIDS` object
2. Create seed function (e.g., `seedMyNewData`)
3. Call it from `seedProductionData()`
4. Export in `PRODUCTION_TEST_DATA`
5. Update cleanup function to handle deletion

Example:

```typescript
const seedMyNewData = async (client: SupabaseClient) => {
  console.log('📋 Seeding my data...');

  const { data: existing } = await client
    .from('my_table')
    .select('id')
    .eq('org_id', TEST_UUIDS.org);

  if (existing?.length > 0) {
    console.log('  ✓ Data already exists');
    return;
  }

  const { error } = await client.from('my_table').insert([
    { /* your data */ }
  ]);

  if (error) throw new Error(`Failed: ${error.message}`);
  console.log('  ✓ Data created');
};
```

## Database Schema Reference

See `.claude/TABLES.md` for the complete database schema.

Key tables:
- organizations
- users
- roles
- production_settings
- warehouses
- locations
- products
- boms
- bom_items
- production_lines
- machines
- work_orders
- license_plates

## Performance Notes

- Seeding runs once per test session (before all tests)
- Data persists by default for faster subsequent runs
- First run takes ~2-5 seconds, subsequent runs ~1 second (idempotency checks)
- Tests can query or manipulate seeded data safely

## References

- Seeding script: `e2e/fixtures/seed-production-data.ts`
- Global setup: `e2e/global-setup.ts`
- Cleanup: `e2e/auth.cleanup.ts`
- Production schema: `supabase/migrations/129_create_production_settings.sql`
