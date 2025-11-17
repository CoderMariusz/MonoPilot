# Database Migrations & Edge Functions Deployment

**Last Updated**: 2025-11-16 (Epic NPD-6 Story 6.6)

## Overview

This document describes the deployment process for:
1. **Database Migrations** - SQL schema changes applied to Supabase PostgreSQL
2. **Edge Functions** - Deno TypeScript serverless functions deployed to Supabase Edge Runtime

---

## Table of Contents

- [Database Migrations](#database-migrations)
  - [Migration Workflow](#migration-workflow)
  - [Migration Naming Convention](#migration-naming-convention)
  - [Applying Migrations](#applying-migrations)
  - [Rollback Procedure](#rollback-procedure)
- [Edge Functions Deployment](#edge-functions-deployment)
  - [Prerequisites](#prerequisites)
  - [Manual Deployment](#manual-deployment)
  - [Automated Deployment (CI/CD)](#automated-deployment-cicd)
  - [Troubleshooting](#troubleshooting)
- [References](#references)

---

## Database Migrations

### Migration Workflow

MonoPilot uses **sequential numbered migrations** stored in `apps/frontend/lib/supabase/migrations/`.

**Lifecycle:**
1. Developer creates migration file (e.g., `103_modify_existing_tables_for_npd.sql`)
2. Migration executed manually in Supabase Dashboard (SQL Editor)
3. Documentation auto-generated via `pnpm docs:update`
4. TypeScript types updated via `pnpm gen-types` (requires Supabase CLI + access token)

### Migration Naming Convention

```
<sequence_number>_<description>.sql
```

**Examples:**
- `100_create_npd_core_tables.sql`
- `101_create_npd_supporting_tables.sql`
- `102_create_npd_rls_policies.sql`

**Rules:**
- Sequential numbering (no gaps)
- Lowercase with underscores
- Descriptive names (not "update_schema.sql")

### Applying Migrations

#### Option 1: Supabase Dashboard (Recommended for Development)

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **SQL Editor**
3. Copy migration file contents
4. Execute SQL
5. Verify success in **Table Editor**

#### Option 2: Supabase CLI (Production)

```bash
# Set environment variables
export SUPABASE_ACCESS_TOKEN=<your-access-token>
export SUPABASE_PROJECT_ID=<your-project-id>

# Apply migration
npx supabase db execute --file apps/frontend/lib/supabase/migrations/100_create_npd_core_tables.sql --project-ref $SUPABASE_PROJECT_ID
```

#### Post-Migration Steps

```bash
# Update auto-generated documentation
pnpm docs:update

# Update TypeScript types (requires SUPABASE_ACCESS_TOKEN)
pnpm gen-types

# Verify type safety
pnpm type-check
```

### Rollback Procedure

**⚠️ Migrations are NOT automatically reversible.**

**Manual Rollback:**
1. Identify migration to revert (e.g., `103_modify_existing_tables_for_npd.sql`)
2. Write **reverse migration** (e.g., `DROP COLUMN`, `ALTER TABLE`, etc.)
3. Execute reverse migration in Supabase Dashboard
4. Update documentation: `pnpm docs:update`

**Example Reverse Migration:**
```sql
-- Rollback for Migration 103 (add npd_project_id columns)
ALTER TABLE work_orders DROP COLUMN IF EXISTS npd_project_id;
ALTER TABLE products DROP COLUMN IF EXISTS npd_project_id;
-- etc.
```

**Best Practice:**
- Test migrations in **staging environment** first
- Keep backups before major schema changes
- Document rollback steps in migration comments

---

## Edge Functions Deployment

### Prerequisites

1. **Supabase CLI** (available via `npx supabase`)
2. **Access Token**: Generate at [https://app.supabase.com/account/tokens](https://app.supabase.com/account/tokens)
3. **Project ID**: Get from Supabase Dashboard URL (e.g., `gvnkzwokxtztyxsfshct`)

**Set Environment Variables:**
```bash
export SUPABASE_ACCESS_TOKEN=<your-access-token>
export SUPABASE_PROJECT_ID=<your-project-id>
```

### Manual Deployment

**Deploy NPD Event Processor:**
```bash
chmod +x scripts/deploy-edge-function.sh
./scripts/deploy-edge-function.sh npd-event-processor
```

**What the script does:**
1. Validates Supabase CLI installation
2. Checks if function directory exists (`apps/frontend/supabase/functions/npd-event-processor/`)
3. Authenticates with Supabase (`supabase link`)
4. Deploys function (`supabase functions deploy`)
5. Tests function availability (HTTP request)
6. Reports deployment status and function URL

**Function URL Format:**
```
https://<project-id>.supabase.co/functions/v1/<function-name>
```

### Automated Deployment (CI/CD)

Edge Functions are deployed via **GitHub Actions** on:
- Push to `main` branch (if function code changes)
- Manual trigger via **Actions** tab → **Deploy Edge Functions** → **Run workflow**

**Workflow File:** `.github/workflows/deploy-edge-functions.yml`

**Required GitHub Secrets:**
- `SUPABASE_ACCESS_TOKEN` - Supabase access token
- `SUPABASE_PROJECT_ID` - Supabase project ID

**Configure Secrets:**
1. Go to GitHub repository **Settings** → **Secrets and variables** → **Actions**
2. Add **New repository secret**:
   - Name: `SUPABASE_ACCESS_TOKEN`
   - Value: `<your-access-token>`
3. Add **New repository secret**:
   - Name: `SUPABASE_PROJECT_ID`
   - Value: `<your-project-id>`

**Manual Trigger:**
1. Go to **Actions** tab
2. Select **Deploy Edge Functions** workflow
3. Click **Run workflow**
4. Select environment (staging/production)
5. Enter function name (default: `npd-event-processor`)
6. Click **Run workflow**

### Troubleshooting

#### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `SUPABASE_ACCESS_TOKEN not set` | Missing environment variable | Set: `export SUPABASE_ACCESS_TOKEN=<token>` |
| `Failed to authenticate` | Invalid access token | Regenerate token at [Supabase Account](https://app.supabase.com/account/tokens) |
| `Function directory not found` | Function code doesn't exist | Create function at `apps/frontend/supabase/functions/<name>/index.ts` |
| `Deployment failed` | Syntax error in function code | Check Supabase Dashboard logs for details |
| `HTTP 500` response | Runtime error in function | View logs: `npx supabase functions logs <function-name>` |

#### Debugging Edge Functions

**View Logs (CLI):**
```bash
npx supabase functions logs npd-event-processor --project-ref $SUPABASE_PROJECT_ID
```

**View Logs (Dashboard):**
```
https://app.supabase.com/project/<project-id>/functions/<function-name>/logs
```

**Test Function Locally:**
```bash
npx supabase functions serve npd-event-processor
# Test: curl http://localhost:54321/functions/v1/npd-event-processor
```

**Test Function (Production):**
```bash
curl https://<project-id>.supabase.co/functions/v1/npd-event-processor
```

#### Rollback Procedure

Supabase keeps **previous Edge Function versions for 7 days**.

**Rollback to Previous Version:**
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Edge Functions** → Select function
3. Click **Versions** tab
4. Find previous working version
5. Click **Restore**

**Or redeploy previous version from Git:**
```bash
# Checkout previous commit
git checkout <previous-commit-hash>

# Redeploy function
./scripts/deploy-edge-function.sh npd-event-processor

# Return to main branch
git checkout main
```

---

## NPD Module Migrations (Epic NPD-6)

### Story 6.1: Core NPD Tables
**Migration:** `100_create_npd_core_tables.sql`
- `npd_projects` - NPD project management (Stage-Gate workflow)
- `npd_formulations` - Multi-version formulations with temporal versioning
- `npd_formulation_items` - Formulation ingredients/components

### Story 6.2: Supporting NPD Tables
**Migration:** `101_create_npd_supporting_tables.sql`
- `npd_costing` - Target/estimated/actual cost tracking with variance
- `npd_risks` - Risk register with auto-calculated risk scores
- `npd_documents` - Document metadata for Supabase Storage
- `npd_events` - Outbox pattern for event sourcing (Handoff Wizard)

### Story 6.3: RLS Policies
**Migration:** `102_create_npd_rls_policies.sql`
- 28 RLS policies (SELECT/INSERT/UPDATE/DELETE × 7 tables)
- Multi-tenant org_id isolation (first proper RLS in MonoPilot)
- Session variable: `app.org_id` (set by middleware)

### Story 6.4: Modify Existing Tables
**Migration:** `103_modify_existing_tables_for_npd.sql`
- `work_orders`: type (regular/pilot) + npd_project_id FK
- `products`: npd_project_id FK + source (manual/npd_handoff/import)
- `boms`: npd_formulation_id FK + source (manual/npd_handoff)
- `production_outputs`: type (production/trial) + npd_trial_id (future)

### Story 6.5: Temporal Versioning Constraints
**Migration:** `104_create_npd_temporal_versioning.sql`
- **Extension:** btree_gist (required for EXCLUDE constraints)
- **EXCLUDE constraint:** Prevents overlapping formulation versions
- **Immutability trigger:** Prevents editing locked formulations (FDA 21 CFR Part 11)
- **GENERATED column:** `is_current_version` (auto-calculated)

### Story 6.6: Edge Functions CI/CD
**Files Created:**
- `scripts/deploy-edge-function.sh` - Deployment script
- `.github/workflows/deploy-edge-functions.yml` - GitHub Actions workflow
- `apps/frontend/supabase/functions/npd-event-processor/index.ts` - Placeholder function

**Note:** Real Edge Function implementation will be added in **Epic NPD-1 Story 4** (Event Sourcing Implementation).

---

## References

- **Supabase CLI Docs**: [https://supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)
- **Supabase Edge Functions**: [https://supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- **PostgreSQL Migrations**: [https://www.postgresql.org/docs/15/sql-altertable.html](https://www.postgresql.org/docs/15/sql-altertable.html)
- **DATABASE_SCHEMA.md**: Auto-generated schema reference
- **NPD Module Architecture**: `docs/NPD-Module-Architecture-2025-11-15.md`

---

**Epic NPD-6 Complete** ✅
**Next**: Epic NPD-1 (Core NPD Project Management) - API classes, UI components, Stage-Gate workflow
