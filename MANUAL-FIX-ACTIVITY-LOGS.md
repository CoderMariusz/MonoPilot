# Manual Fix: Apply activity_logs Migration

## Problem
Migration 061_create_activity_logs_table.sql cannot be applied via CLI due to migration ordering issues with routing tables.

## Solution
Apply the migration manually via Supabase Dashboard SQL Editor.

## Steps

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/pgroxddbtaevdegnidaz
   - Navigate to: SQL Editor

2. **Run the SQL from migration 061**
   - Copy the entire content from: `supabase/migrations/061_create_activity_logs_table.sql`
   - Paste into SQL Editor
   - Click "Run"

3. **Verify the table was created**
   - Run this query to verify:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'activity_logs';
   ```

4. **Test the activity feed API**
   - The dashboard activity feed should now work without errors
   - Test: `GET /api/dashboard/activity`

## Alternative: CLI Push (Advanced)
If you want to fix the migration order and push via CLI:

1. Rename migrations to fix order:
   - 050_create_routings_table.sql → 045_create_routings_table.sql
   - This puts routings table before routing_operations

2. Then run:
   ```bash
   export SUPABASE_ACCESS_TOKEN=sbp_6be6d9c3e23b75aef1614dddb81f31b8665794a3
   npx supabase db push
   ```

## Status
✅ Routing "User not found" error - FIXED
✅ Product modal not opening - FIXED
✅ products.type column error - FIXED
⏳ activity_logs table - Needs manual application (SQL provided above)
