# Supabase Cloud Connection Guide

**CRITICAL**: Use this guide when you lose connection to Supabase cloud or after context clear.

## Project Details

- **Project Reference ID**: `pgroxddbtaevdegnidaz`
- **Project URL**: `https://pgroxddbtaevdegnidaz.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/pgroxddbtaevdegnidaz

## Authentication Credentials

### Access Token (for CLI)
Stored in `.env` file:
```bash
SUPABASE_ACCESS_TOKEN=sbp_6be6d9c3e23b75aef1614dddb81f31b8665794a3
```

### Database Password
```
MA2025ma!!!
```

### API Keys (from .env)
```bash
SUPABASE_URL=https://pgroxddbtaevdegnidaz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg
```

## Step-by-Step Connection

### 1. Link Project to Cloud

**IMPORTANT**: The access token must be exported as environment variable BEFORE running link command.

```bash
# Set access token from .env
export SUPABASE_ACCESS_TOKEN=sbp_6be6d9c3e23b75aef1614dddb81f31b8665794a3

# Link to cloud project
npx supabase link --project-ref pgroxddbtaevdegnidaz
```

Expected output:
```
Finished supabase link.
```

### 2. Verify Connection

```bash
export SUPABASE_ACCESS_TOKEN=sbp_6be6d9c3e23b75aef1614dddb81f31b8665794a3
npx supabase migration list
```

This should show all migrations in sync (Local | Remote | Time).

## Common Issues & Solutions

### Issue 1: "Unauthorized" Error

**Symptoms**:
```
Unexpected error retrieving remote project status: {"message":"Unauthorized"}
```

**Solution**:
1. Verify access token is exported:
   ```bash
   export SUPABASE_ACCESS_TOKEN=sbp_6be6d9c3e23b75aef1614dddb81f31b8665794a3
   ```
2. DO NOT use database password for linking - use access token only
3. Access token format is `sbp_XXXXX` (NOT `sbp_v0_XXXXX` - old CLI versions don't support this)

### Issue 2: "Remote migration versions not found"

**Symptoms**:
```
Remote migration versions not found in local migrations directory.
```

**Solution**:
Mark remote migrations as reverted (this happened when we renumbered migrations):

```bash
export SUPABASE_ACCESS_TOKEN=sbp_6be6d9c3e23b75aef1614dddb81f31b8665794a3

npx supabase migration repair --status reverted [list of migration IDs]
```

Then push new migrations:
```bash
npx supabase db push
```

### Issue 3: Cannot connect to database directly

**Note**: Database password `MA2025ma!!!` is used for:
- Direct PostgreSQL connections (psql, GUI clients)
- Supabase Dashboard login
- NOT for CLI operations (use access token instead)

## Push Migrations to Cloud

After linking project:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_6be6d9c3e23b75aef1614dddb81f31b8665794a3
npx supabase db push
```

This will:
1. Show list of migrations to apply
2. Ask for confirmation (Y/n)
3. Apply all migrations in order
4. Update migration history table

## Verify Cloud Database

After migrations:

1. **Via CLI**:
   ```bash
   export SUPABASE_ACCESS_TOKEN=sbp_6be6d9c3e23b75aef1614dddb81f31b8665794a3
   npx supabase migration list
   ```

2. **Via Dashboard**:
   - Go to: https://supabase.com/dashboard/project/pgroxddbtaevdegnidaz
   - Navigate to: Table Editor
   - Check tables: organizations, roles, users, modules, warehouses, locations, etc.

3. **Via SQL**:
   - Dashboard → SQL Editor
   - Run: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`

## Current Cloud Database State (as of 2025-12-23)

- ✅ 26 migrations applied (001-026)
- ✅ 12 tables created
- ✅ 10 system roles seeded
- ✅ 11 modules seeded
- ✅ All RLS policies active

### Tables in Cloud:
1. organizations
2. roles
3. users
4. modules
5. organization_modules
6. warehouses
7. locations
8. machines
9. production_lines
10. allergens
11. tax_codes
12. user_sessions
13. password_history
14. user_invitations

## Important Notes

1. **Always export access token first** - CLI won't work without it
2. **Use bash export** - `set` doesn't work in Git Bash
3. **Check .env file** - contains all current credentials
4. **Local vs Cloud** - Local runs on Docker (localhost:54321), Cloud is at supabase.co
5. **Migration History** - Keep in sync using `migration repair` if needed

## Quick Connect Checklist

- [ ] Export SUPABASE_ACCESS_TOKEN from .env
- [ ] Run `npx supabase link --project-ref pgroxddbtaevdegnidaz`
- [ ] Verify with `npx supabase migration list`
- [ ] If migrations out of sync, run `migration repair`
- [ ] Push changes with `npx supabase db push`

## Backup Files Created

- `cloud_database_setup.sql` - All migrations combined (manual fallback)
- `cloud_cleanup.sql` - Safe cleanup script (skips system extensions)
- `verify_cloud_db.sql` - Database verification queries

## References

- [Supabase CLI Link Docs](https://supabase.com/docs/reference/cli/supabase-link)
- [Database Migrations Guide](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase db push Reference](https://supabase.com/docs/reference/cli/supabase-db-push)
