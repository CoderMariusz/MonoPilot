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

## Closed Bugs

_No closed bugs yet._
