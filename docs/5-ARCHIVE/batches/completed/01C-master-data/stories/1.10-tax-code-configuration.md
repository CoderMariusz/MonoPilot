# Story 1.10: Tax Code Configuration

Status: ready-for-dev

## Story

As an **Admin**,
I want to manage tax codes,
so that POs have correct VAT rates.

## Acceptance Criteria

### FR-SET-009: Tax Code Configuration

**AC-009.1**: Tax codes preloaded based on organization country:
- On organization creation: seed tax codes based on organizations.country
- Poland: VAT 23%, VAT 8%, VAT 5%, VAT 0%
- UK: Standard 20%, Reduced 5%, Zero 0%
- Default codes: { code: 'VAT23', description: 'VAT 23%', rate: 23.00 }
- Rate stored as decimal (23.00 for 23%)
- Preloaded tax codes can be edited or deleted (unlike allergens)

**AC-009.2**: Admin może dodać custom tax codes:
- Navigate to /settings/production → "Tax Codes" tab
- Click "Add Tax Code" button
- Form fields:
  - code: required, unique per org, uppercase (e.g., VAT-EXPORT)
  - description: required, max 200 chars (e.g., "Export Zero VAT")
  - rate: required, decimal % (e.g., 0.00, 5.00, 23.00)
- Validation: code unique, rate >= 0
- On save: tax code created

**AC-009.3**: Tax codes list view:
- Table columns: Code, Description, Rate (%), POs (count), Actions
- Rate column: formatted as "23.00%" with 2 decimals
- POs column: count of PO lines using this tax code (Epic 3 JOIN)
- Search by code or description
- Sort by code, rate, description
- Filter: All, Zero-rated, Standard, Reduced

**AC-009.4**: Cannot delete tax code if used in POs:
- FK constraint: tax_codes used in po_lines table (Epic 3)
- Check: query po_lines.tax_code_id COUNT
- If used: error "Cannot delete - used by X PO lines"
- Archive option: add is_active flag (soft delete)

**AC-009.5**: Edit tax code:
- Click Edit action → drawer opens
- All fields editable (code, description, rate)
- Warning if editing rate: "X PO lines use this rate. Changes affect historical data."
- Recommendation: create new tax code instead of changing rate
- On save: tax code updated

**AC-009.6**: Tax code seed migration:
- Run on organization creation
- Country-based seed:
  - Poland: VAT 23%, 8%, 5%, 0%
  - UK: Standard 20%, Reduced 5%, Zero 0%
  - Other countries: default VAT 0% (user adds their own)
- Idempotent: ON CONFLICT DO NOTHING

**AC-009.7**: Cache invalidation events:
- On tax code create/update/delete: emit 'tax_code.updated' event
- Epic 3 refetches tax code list on event
- Redis cache TTL: 10 min
- Cache key: `tax_codes:{org_id}`

## Tasks / Subtasks

### Task 1: Database Schema - Tax Codes Table (AC: 009.1, 009.2, 009.4)
- [ ] Create `tax_codes` table migration:
  - [ ] id UUID PK
  - [ ] org_id UUID FK → organizations (RLS key)
  - [ ] code VARCHAR(50) NOT NULL
  - [ ] description VARCHAR(200) NOT NULL
  - [ ] rate DECIMAL(5,2) NOT NULL (supports 0.00 to 999.99)
  - [ ] created_at TIMESTAMP DEFAULT NOW()
  - [ ] updated_at TIMESTAMP DEFAULT NOW()
- [ ] Add unique constraint: (org_id, code)
- [ ] Add check constraint: rate >= 0
- [ ] Add index: org_id, rate
- [ ] Create RLS policy: `org_id = (auth.jwt() ->> 'org_id')::uuid`
- [ ] Run migration and verify schema

### Task 2: Tax Code Seed Script (AC: 009.1, 009.6)
- [ ] Create seed function/migration
  - [ ] Poland tax codes:
    - [ ] { code: 'VAT23', description: 'VAT 23%', rate: 23.00 }
    - [ ] { code: 'VAT8', description: 'VAT 8%', rate: 8.00 }
    - [ ] { code: 'VAT5', description: 'VAT 5%', rate: 5.00 }
    - [ ] { code: 'VAT0', description: 'VAT 0%', rate: 0.00 }
  - [ ] UK tax codes:
    - [ ] { code: 'STD20', description: 'Standard Rate 20%', rate: 20.00 }
    - [ ] { code: 'RED5', description: 'Reduced Rate 5%', rate: 5.00 }
    - [ ] { code: 'ZERO', description: 'Zero Rate 0%', rate: 0.00 }
  - [ ] Default (other countries):
    - [ ] { code: 'VAT0', description: 'Zero VAT', rate: 0.00 }
  - [ ] Bulk INSERT based on organizations.country
  - [ ] ON CONFLICT (org_id, code) DO NOTHING
- [ ] Test: run seed for Poland org → 4 tax codes
- [ ] Test: run seed for UK org → 3 tax codes

### Task 3: Tax Code Service - Core Logic (AC: 009.2, 009.3, 009.4, 009.5)
- [ ] Create TaxCodeService class/module
  - [ ] seedTaxCodes(orgId: string, country: string)
    - [ ] Determine tax codes based on country
    - [ ] Bulk insert with ON CONFLICT DO NOTHING
  - [ ] createTaxCode(input: CreateTaxCodeInput)
    - [ ] Validate: code unique per org
    - [ ] Validate: rate >= 0
    - [ ] Insert tax code
    - [ ] Return tax code object
    - [ ] Emit cache event: 'tax_code.created'
  - [ ] updateTaxCode(id: string, input: UpdateTaxCodeInput)
    - [ ] Validate: tax code exists, belongs to org
    - [ ] Validate: code still unique if changed
    - [ ] Check if rate changing: query PO usage, warn user
    - [ ] Update tax code record
    - [ ] Return updated tax code
    - [ ] Emit cache event: 'tax_code.updated'
  - [ ] getTaxCodes(orgId: string, filters?: TaxCodeFilters)
    - [ ] Query tax_codes WHERE org_id = orgId
    - [ ] Apply filters: search (code/description)
    - [ ] Include PO line count (JOIN po_lines - Epic 3)
    - [ ] Sort by code, rate, description
    - [ ] Return tax codes array
  - [ ] deleteTaxCode(id: string, orgId: string)
    - [ ] Check: not used in PO lines (query po_lines.tax_code_id)
    - [ ] Try DELETE
    - [ ] Catch FK constraint error → friendly message
    - [ ] Emit cache event: 'tax_code.deleted'

### Task 4: Zod Validation Schemas (AC: 009.2, 009.5)
- [ ] Create CreateTaxCodeSchema
  - [ ] code: z.string().regex(/^[A-Z0-9-]+$/).min(2).max(50)
  - [ ] description: z.string().min(1).max(200)
  - [ ] rate: z.number().min(0).max(100) (supports 0-100%)
- [ ] Create UpdateTaxCodeSchema (extends CreateTaxCodeSchema)

### Task 5: API Endpoints (AC: 009.2, 009.3, 009.4, 009.5)
- [ ] Implement GET /api/settings/tax-codes
  - [ ] Query params: search?
  - [ ] Call TaxCodeService.getTaxCodes
  - [ ] Include PO line count
  - [ ] Auth: Authenticated
  - [ ] Cache: 10 min TTL
- [ ] Implement POST /api/settings/tax-codes
  - [ ] Body: CreateTaxCodeInput
  - [ ] Validate: Zod schema
  - [ ] Call TaxCodeService.createTaxCode
  - [ ] Auth: Admin only
  - [ ] Invalidate cache
- [ ] Implement PUT /api/settings/tax-codes/:id
  - [ ] Body: UpdateTaxCodeInput
  - [ ] Auth: Admin only
  - [ ] Invalidate cache
- [ ] Implement DELETE /api/settings/tax-codes/:id
  - [ ] Auth: Admin only
  - [ ] Invalidate cache

### Task 6: Frontend Tax Codes List Page (AC: 009.3)
- [ ] Add "Tax Codes" tab to /app/settings/production/page.tsx
- [ ] Implement TaxCodesTable component
  - [ ] Columns: Code, Description, Rate, POs, Actions
  - [ ] Rate column: formatted "23.00%"
  - [ ] Actions: Edit, Delete
  - [ ] Search by code/description
- [ ] Fetch: GET /api/settings/tax-codes (SWR)

### Task 7: Tax Code Form Modal (AC: 009.2, 009.5)
- [ ] Create TaxCodeFormModal component
  - [ ] Code, description, rate (number input with % suffix)
  - [ ] Form submission: POST or PUT
  - [ ] Delete confirmation with PO usage check

### Task 8: Organization Creation Hook (AC: 009.6)
- [ ] Add tax code seeding to organization creation workflow
  - [ ] After creating org → call TaxCodeService.seedTaxCodes(orgId, country)
  - [ ] Or: Supabase trigger on organizations.INSERT → seed tax codes
  - [ ] Ensure idempotent

### Task 9: Rate Change Warning (AC: 009.5)
- [ ] When editing tax code rate:
  - [ ] Query PO line usage count
  - [ ] If > 0: show warning modal
  - [ ] Warning: "X PO lines use this rate. Changing affects historical data. Recommended: create new tax code instead."
  - [ ] Options: Continue, Cancel, Create New

### Task 10: Cache Invalidation & Events (AC: 009.7)
- [ ] Emit events on tax code create/update/delete
- [ ] Invalidate Redis cache: `tax_codes:{org_id}`
- [ ] Epic 3 subscribes to events

### Task 11: Integration & Testing (AC: All)
- [ ] Unit tests: validation, seed logic
- [ ] Integration tests:
  - [ ] Seed tax codes for Poland → 4 codes
  - [ ] Seed tax codes for UK → 3 codes
  - [ ] Create custom tax code → saved
  - [ ] Delete tax code in use → FK error
  - [ ] Update rate → warning if PO usage
  - [ ] RLS policy check
- [ ] E2E tests: create/edit/delete tax code

## Dev Notes

### Technical Stack
Same as previous stories: Next.js 15, React 19, TypeScript, Supabase, Redis

### Key Technical Decisions

1. **Country-Based Seeding**:
   - Poland: 4 VAT rates (23%, 8%, 5%, 0%)
   - UK: 3 rates (Standard 20%, Reduced 5%, Zero 0%)
   - Other countries: default VAT 0% (user adds their own)

2. **Rate Storage**:
   - Decimal(5,2): supports 0.00 to 999.99%
   - Stored as 23.00 (not 0.23)
   - Displayed as "23.00%"

3. **Edit vs Create New**:
   - Editing rate affects historical PO data
   - Recommendation: create new tax code for rate changes
   - Warning shown if PO usage exists

4. **Unlike Allergens**:
   - Tax codes CAN be deleted (if not used)
   - Tax codes are country-specific (not global standard)

### Data Model

```typescript
interface TaxCode {
  id: string
  org_id: string                // RLS key
  code: string                  // Unique per org (e.g., VAT23, STD20)
  description: string           // Display description
  rate: number                  // Decimal % (23.00 for 23%)
  created_at: Date
  updated_at: Date
}

// Unique: (org_id, code)
// Check: rate >= 0
// Indexes: org_id, rate
// RLS: org_id = auth.jwt()->>'org_id'
```

### Tax Code Seed Data

```typescript
const TAX_CODES_BY_COUNTRY = {
  PL: [
    { code: 'VAT23', description: 'VAT 23%', rate: 23.00 },
    { code: 'VAT8', description: 'VAT 8%', rate: 8.00 },
    { code: 'VAT5', description: 'VAT 5%', rate: 5.00 },
    { code: 'VAT0', description: 'VAT 0%', rate: 0.00 }
  ],
  UK: [
    { code: 'STD20', description: 'Standard Rate 20%', rate: 20.00 },
    { code: 'RED5', description: 'Reduced Rate 5%', rate: 5.00 },
    { code: 'ZERO', description: 'Zero Rate 0%', rate: 0.00 }
  ],
  DEFAULT: [
    { code: 'VAT0', description: 'Zero VAT', rate: 0.00 }
  ]
}
```

### References

- [Source: docs/epics/epic-1-settings.md#Story-1.10]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#FR-SET-009]

### Prerequisites

**Story 1.1**: Organizations (org_id, country field for seed logic)

### Downstream

- Epic 3: PO line tax calculation uses tax_codes table

## Dev Agent Record

### Context Reference

Story Context: [docs/sprint-artifacts/1-10-tax-code-configuration.context.xml](./1-10-tax-code-configuration.context.xml)

### Agent Model Used

<!-- Will be filled during implementation -->

### Debug Log References

<!-- Will be added during implementation -->

### Completion Notes List

<!-- Will be added after story completion -->

### File List

<!-- NEW/MODIFIED/DELETED files will be listed here after implementation -->

## Change Log

- 2025-11-20: Story drafted by Mariusz (from Epic 1 + Tech Spec Epic 1)
