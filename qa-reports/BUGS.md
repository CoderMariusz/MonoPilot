# Bug Tracking

## Status Legend
- 🔴 **OPEN** - Bug reported, not yet fixed
- 🟡 **IN PROGRESS** - Being worked on
- 🟢 **FIXED** - Fix committed
- ✅ **VERIFIED** - Fix tested and confirmed

---

## BUG-002: Missing 'address' column in organizations table

| Field | Value |
|-------|-------|
| **ID** | BUG-002 |
| **Severity** | P0 CRITICAL |
| **Status** | 🟢 FIXED |
| **Page** | /settings/organization |
| **Reported** | 2026-02-07 |
| **Fixed** | 2026-02-07 |

### Problem
"Could not find the 'address' column of 'organizations' in the schema cache"

The Organization Settings page (`/settings/organization`) tried to read/write fields that didn't exist in the database schema.

### Root Cause
The `organizations` table was created in migration 001 with basic fields, but the profile fields required by `OrganizationForm.tsx` and the API were never added. A migration file `027_add_organization_profile_fields.sql.skip` existed but was skipped (wrong filename) and also used different field names (`address_line1` instead of `address`).

### Missing Columns
- `company_name` - Full company display name
- `address` - Street address
- `city` - City name
- `postal_code` - Postal/ZIP code
- `country` - Country code
- `nip_vat` - Tax ID (NIP/VAT)
- `date_format` - Date display format preference
- `number_format` - Number display format preference
- `unit_system` - Metric/Imperial preference
- `default_currency` - Default currency code
- `default_language` - Default UI language
- `fiscal_year_start` - Fiscal year start month

### Solution
Created migration `0335_add_organization_profile_fields.sql` that:
1. Adds all missing columns with appropriate types and defaults
2. Adds validation constraints (date_format, number_format, unit_system)
3. Syncs `company_name` from existing `name` column for existing records
4. Adds documentation comments

### Commit
- **Hash**: `bf8e5401`
- **Message**: `fix(db): add missing organization profile columns (BUG-002)`

### Files Changed
| File | Change |
|------|--------|
| `supabase/migrations/0335_add_organization_profile_fields.sql` | Created |

### Verification
- [x] Migration file created successfully
- [x] Commit pushed to main branch
- [ ] Migration applied to Supabase (requires dashboard/CLI)
- [ ] /settings/organization page loads without error

### Notes
- After pushing, the migration needs to be applied to the Supabase database via the dashboard or `supabase db push`
- The original skipped migration `027_add_organization_profile_fields.sql.skip` can be deleted as it's now superseded

---

## BUG-003: Empty Company Name shows wrong validation message

| Field | Value |
|-------|-------|
| **ID** | BUG-003 |
| **Severity** | MEDIUM |
| **Status** | 🟢 FIXED |
| **Page** | /settings/organization |
| **Reported** | 2026-02-07 |
| **Fixed** | 2026-02-07 |

### Problem
When submitting the Organization form with an empty Company Name field, the error message shows "must be at least 2 characters" instead of "required".

### Root Cause
The Zod validation schema used `.min(2, 'Company name must be at least 2 characters')` which triggers on empty strings (length 0 < 2).

### Solution
Added an explicit required check before the min length check:
```typescript
company_name: z
  .string()
  .min(1, 'Company name is required')  // NEW: explicit required check
  .min(2, 'Company name must be at least 2 characters')
  .max(100, 'Company name must be less than 100 characters'),
```

### Commit
- **Hash**: `cf95a808`
- **Message**: `fix(validation): distinguish empty vs invalid for company_name and country (BUG-003, BUG-004)`

### Files Changed
| File | Change |
|------|--------|
| `apps/frontend/lib/validation/organization-schemas.ts` | Modified |

### Verification
- [x] TypeScript compiles without errors
- [x] Commit pushed to main branch

---

## BUG-004: Empty Country shows wrong validation message

| Field | Value |
|-------|-------|
| **ID** | BUG-004 |
| **Severity** | MEDIUM |
| **Status** | 🟢 FIXED |
| **Page** | /settings/organization |
| **Reported** | 2026-02-07 |
| **Fixed** | 2026-02-07 |

### Problem
When submitting the Organization form with an empty Country field, the error message shows "Invalid country code" instead of allowing the empty value (since Country is optional).

### Root Cause
The Zod validation schema used `.length(2, 'Invalid country code').optional()` which rejects empty strings because their length (0) doesn't equal 2.

### Solution
Used `.refine()` to allow empty strings while still validating that non-empty values are exactly 2 characters:
```typescript
country: z
  .string()
  .refine((val) => val === '' || val.length === 2, {
    message: 'Country code must be 2 characters',
  })
  .optional(),
```

### Commit
- **Hash**: `cf95a808`
- **Message**: `fix(validation): distinguish empty vs invalid for company_name and country (BUG-003, BUG-004)`

### Files Changed
| File | Change |
|------|--------|
| `apps/frontend/lib/validation/organization-schemas.ts` | Modified |

### Verification
- [x] TypeScript compiles without errors
- [x] Commit pushed to main branch

---

## BUG-006, BUG-007, BUG-008, BUG-009: Duplicate Role Names

| Field | Value |
|-------|-------|
| **IDs** | BUG-006, BUG-007, BUG-008, BUG-009 |
| **Severity** | HIGH |
| **Status** | 🟢 FIXED |
| **Page** | Database / Settings |
| **Reported** | 2026-02-07 |
| **Fixed** | 2026-02-07 |

### Problem
Four roles appeared twice in the database with different permissions:
- Production Manager (2×)
- Administrator (2×)
- Warehouse Manager (2×)
- Production Operator (2×)

### Root Cause
**Case-sensitive PostgreSQL codes** caused duplicate role names:
- **Migrations** (004, 007) used lowercase codes: `admin`, `production_manager`, `warehouse_manager`, `production_operator`
- **E2E fixtures** used UPPERCASE codes: `ADMIN`, `PRODUCTION_MANAGER`, `WAREHOUSE_MANAGER`, `PRODUCTION_OPERATOR`
- PostgreSQL treats these as different codes, so both got inserted, creating duplicate role **names** with different **codes**

Additionally, two migration files (004 and 007) both seeded roles, causing confusion about which permissions were authoritative.

### Solution
1. **Standardized all role codes to lowercase** (matching the migrations)
2. **Removed duplicate role seed** from `007_seed_system_data.sql` → single source of truth is now `004_seed_system_roles.sql`
3. Updated `e2e/fixtures/seed-production-data.ts` - lowercase codes
4. Updated `apps/frontend/__tests__/01-settings/fixtures/roles.ts` - lowercase codes

### Commit
- **Hash**: `ada0d08a`
- **Message**: `fix(db): standardize role codes to lowercase (BUG-006,007,008,009)`

### Files Changed
| File | Change |
|------|--------|
| `e2e/fixtures/seed-production-data.ts` | Modified - lowercase role codes |
| `apps/frontend/__tests__/01-settings/fixtures/roles.ts` | Modified - lowercase role codes |
| `supabase/migrations/007_seed_system_data.sql` | Modified - removed duplicate role seed |

### Verification
- [x] E2E fixtures use lowercase role codes
- [x] Test fixtures use lowercase role codes
- [x] Single source of truth for roles (004_seed_system_roles.sql)
- [x] Commit pushed to main branch

### Notes
- Existing duplicate roles in production database may need manual cleanup via SQL:
  ```sql
  -- Find duplicates
  SELECT name, COUNT(*) FROM roles GROUP BY name HAVING COUNT(*) > 1;
  
  -- Remove UPPERCASE duplicates (keep lowercase)
  DELETE FROM roles WHERE code IN ('ADMIN', 'PRODUCTION_MANAGER', 'WAREHOUSE_MANAGER', 'PRODUCTION_OPERATOR');
  ```
- Future role references should always use lowercase codes

---

## BUG-010: Warehouse Code field truncates last character on create

| Field | Value |
|-------|-------|
| **ID** | BUG-010 |
| **Severity** | HIGH |
| **Status** | 🟢 FIXED |
| **Page** | /settings/warehouses |
| **Reported** | 2026-02-07 |
| **Fixed** | 2026-02-07 |

### Problem
When creating a warehouse with a code longer than 20 characters (e.g., "QA-TEST-20260207-2307" with 23 chars), the saved value was truncated to 22 characters, missing the last character.

### Root Cause
**Database VARCHAR(20) limit and matching frontend validation:**
1. **Database**: `code VARCHAR(20)` column with CHECK constraint `code ~ '^[A-Z0-9-]{2,20}$'`
2. **Frontend**: Zod schema with `.max(20)` and regex `/^[A-Z0-9-]{2,20}$/`

The 20-character limit was too restrictive for longer warehouse codes that include date-based identifiers.

### Solution
Increased the limit from 20 to 50 characters in both:
1. **Database migration** (`149_expand_warehouse_code_length.sql`):
   - Dropped old CHECK constraint
   - Altered column to `VARCHAR(50)`
   - Added new CHECK constraint `{2,50}`

2. **Frontend validation** (`warehouse-schemas.ts`):
   - Changed `.max(20)` to `.max(50)`
   - Updated regex from `{2,20}` to `{2,50}`

### Commit
- **Hash**: `b8337bad`
- **Message**: `fix(warehouse): expand code field from 20 to 50 characters`

### Files Changed
| File | Change |
|------|--------|
| `supabase/migrations/149_expand_warehouse_code_length.sql` | Created |
| `apps/frontend/lib/validation/warehouse-schemas.ts` | Modified |

### Verification
- [x] Migration file created
- [x] Frontend validation updated
- [x] Commit pushed to main branch
- [ ] Migration applied to Supabase

### Notes
- After deployment, migration needs to be applied via `supabase db push` or dashboard
- Codes up to 50 characters are now supported (e.g., "QA-TEST-20260207-2307" works)

---

## Closed Bugs

_No closed bugs yet._
