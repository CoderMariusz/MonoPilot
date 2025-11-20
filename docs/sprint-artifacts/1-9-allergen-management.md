# Story 1.9: Allergen Management

Status: ready-for-dev

## Story

As an **Admin**,
I want to manage the allergen library,
so that products can have proper allergen declarations.

## Acceptance Criteria

### FR-SET-008: Allergen Management

**AC-008.1**: 14 EU major allergens preloaded:
- On organization creation: seed 14 EU major allergens
- List: Milk, Eggs, Fish, Shellfish, Tree Nuts, Peanuts, Wheat, Soybeans, Sesame, Mustard, Celery, Lupin, Sulphites, Molluscs
- Fields: code (e.g., MILK, EGGS), name (localized: "Mleko", "Jaja"), is_major = true, is_custom = false
- Preloaded allergens cannot be deleted (FK constraints, UI disabled)
- Can be edited (e.g., change name translation)

**AC-008.2**: Preloaded allergens non-deletable:
- Delete button disabled for is_custom = false allergens
- Tooltip: "Cannot delete EU major allergen"
- FK constraint: allergens used in product_allergens table (Epic 2)
- If deletion attempted: error "This allergen is in use by X products"

**AC-008.3**: Admin może dodać custom allergens:
- Navigate to /settings/production → "Allergens" tab
- Click "Add Allergen" button
- Form fields:
  - code: required, unique per org, uppercase (e.g., CUSTOM-01)
  - name: required, max 100 chars
  - is_major: toggle (default false - for custom allergens)
- On save: allergen created with is_custom = true
- Custom allergens appear in product allergen assignment (Epic 2)

**AC-008.4**: Custom allergens editable and deletable:
- Edit: all fields (code, name, is_major)
- Delete: only if not used in products (FK constraint check)
- Delete confirmation: "Delete custom allergen? This cannot be undone."
- If used in products: error "Cannot delete - used by X products"

**AC-008.5**: Allergens list view:
- Table columns: Code, Name, Is Major (badge), Is Custom (badge), Products (count), Actions
- Is Major badge: Yes (orange badge) or No (gray)
- Is Custom badge: Custom (blue) or Standard (gray)
- Products column: count of products using this allergen (Epic 2 JOIN)
- Search by code or name
- Filter: All, Major only, Custom only
- Sort by code, name, is_major

**AC-008.6**: Allergen localization (optional - Phase 2):
- Store name in multiple languages: name_pl, name_en
- Default: use English names for preload
- Admin can edit translations
- Display based on organization.default_language

**AC-008.7**: Allergen seed migration:
- Run on organization creation (trigger or manual seed)
- Idempotent: ON CONFLICT DO NOTHING (safe to re-run)
- Seed script includes all 14 EU allergens with codes and names

**AC-008.8**: Cache invalidation events:
- On allergen create/update/delete: emit 'allergen.updated' event
- Epic 2, 8 refetch allergen list on event
- Redis cache TTL: 10 min (master data, rarely changes)
- Cache key: `allergens:{org_id}`

## Tasks / Subtasks

### Task 1: Database Schema - Allergens Table (AC: 008.1, 008.2, 008.3, 008.4)
- [ ] Create `allergens` table migration:
  - [ ] id UUID PK
  - [ ] org_id UUID FK → organizations (RLS key, nullable for shared allergens - future)
  - [ ] code VARCHAR(50) NOT NULL
  - [ ] name VARCHAR(100) NOT NULL
  - [ ] is_major BOOLEAN DEFAULT false
  - [ ] is_custom BOOLEAN DEFAULT true (false for preloaded)
  - [ ] created_at TIMESTAMP DEFAULT NOW()
  - [ ] updated_at TIMESTAMP DEFAULT NOW()
- [ ] Add unique constraint: (org_id, code)
- [ ] Add index: org_id, is_major, is_custom
- [ ] Create RLS policy: `org_id = (auth.jwt() ->> 'org_id')::uuid`
- [ ] Run migration and verify schema

### Task 2: Allergen Seed Script (AC: 008.1, 008.7)
- [ ] Create seed function/migration
  - [ ] 14 EU allergens with codes and names:
    - [ ] { code: 'MILK', name: 'Milk', is_major: true, is_custom: false }
    - [ ] { code: 'EGGS', name: 'Eggs', is_major: true, is_custom: false }
    - [ ] { code: 'FISH', name: 'Fish', is_major: true, is_custom: false }
    - [ ] { code: 'SHELLFISH', name: 'Crustaceans', is_major: true, is_custom: false }
    - [ ] { code: 'TREENUTS', name: 'Tree Nuts', is_major: true, is_custom: false }
    - [ ] { code: 'PEANUTS', name: 'Peanuts', is_major: true, is_custom: false }
    - [ ] { code: 'WHEAT', name: 'Gluten (Wheat)', is_major: true, is_custom: false }
    - [ ] { code: 'SOYBEANS', name: 'Soybeans', is_major: true, is_custom: false }
    - [ ] { code: 'SESAME', name: 'Sesame Seeds', is_major: true, is_custom: false }
    - [ ] { code: 'MUSTARD', name: 'Mustard', is_major: true, is_custom: false }
    - [ ] { code: 'CELERY', name: 'Celery', is_major: true, is_custom: false }
    - [ ] { code: 'LUPIN', name: 'Lupin', is_major: true, is_custom: false }
    - [ ] { code: 'SULPHITES', name: 'Sulphur Dioxide/Sulphites', is_major: true, is_custom: false }
    - [ ] { code: 'MOLLUSCS', name: 'Molluscs', is_major: true, is_custom: false }
  - [ ] Bulk INSERT with ON CONFLICT (org_id, code) DO NOTHING
  - [ ] Run on organization creation (trigger or manual)
- [ ] Test: run seed, verify 14 allergens inserted
- [ ] Test: re-run seed, verify idempotent (no duplicates)

### Task 3: Allergen Service - Core Logic (AC: 008.3, 008.4, 008.5)
- [ ] Create AllergenService class/module
  - [ ] seedAllergens(orgId: string)
    - [ ] Bulk insert 14 EU allergens for org
    - [ ] Set is_custom = false, is_major = true
    - [ ] ON CONFLICT DO NOTHING (idempotent)
  - [ ] createAllergen(input: CreateAllergenInput)
    - [ ] Validate: code unique per org
    - [ ] Insert allergen with is_custom = true
    - [ ] Return allergen object
    - [ ] Emit cache event: 'allergen.created'
  - [ ] updateAllergen(id: string, input: UpdateAllergenInput)
    - [ ] Validate: allergen exists, belongs to org
    - [ ] Validate: code still unique if changed
    - [ ] Update allergen record
    - [ ] Return updated allergen
    - [ ] Emit cache event: 'allergen.updated'
  - [ ] getAllergens(orgId: string, filters?: AllergenFilters)
    - [ ] Query allergens WHERE org_id = orgId
    - [ ] Apply filters: is_major, is_custom, search
    - [ ] Include product count (JOIN product_allergens - Epic 2)
    - [ ] Sort by code, name, is_major
    - [ ] Return allergens array
  - [ ] deleteAllergen(id: string, orgId: string)
    - [ ] Validate: is_custom = true (cannot delete preloaded)
    - [ ] Check: not used in products (query product_allergens)
    - [ ] Try DELETE
    - [ ] Catch FK constraint error → friendly message
    - [ ] Emit cache event: 'allergen.deleted'

### Task 4: Zod Validation Schemas (AC: 008.3, 008.4)
- [ ] Create CreateAllergenSchema
  - [ ] code: z.string().regex(/^[A-Z0-9-]+$/).min(2).max(50)
  - [ ] name: z.string().min(1).max(100)
  - [ ] is_major: z.boolean().default(false)
- [ ] Create UpdateAllergenSchema (extends CreateAllergenSchema)

### Task 5: API Endpoints (AC: 008.3, 008.4, 008.5)
- [ ] Implement GET /api/settings/allergens
  - [ ] Query params: is_major?, is_custom?, search?
  - [ ] Call AllergenService.getAllergens
  - [ ] Include product count
  - [ ] Auth: Authenticated
  - [ ] Cache: 10 min TTL
- [ ] Implement POST /api/settings/allergens
  - [ ] Body: CreateAllergenInput
  - [ ] Validate: Zod schema
  - [ ] Call AllergenService.createAllergen
  - [ ] Auth: Admin only
  - [ ] Invalidate cache
- [ ] Implement PUT /api/settings/allergens/:id
  - [ ] Body: UpdateAllergenInput
  - [ ] Auth: Admin only
  - [ ] Invalidate cache
- [ ] Implement DELETE /api/settings/allergens/:id
  - [ ] Validate: is_custom = true
  - [ ] Auth: Admin only
  - [ ] Invalidate cache

### Task 6: Frontend Allergens List Page (AC: 008.5)
- [ ] Add "Allergens" tab to /app/settings/production/page.tsx
- [ ] Implement AllergensTable component
  - [ ] Columns: Code, Name, Is Major, Is Custom, Products, Actions
  - [ ] Badges: Is Major (orange/gray), Is Custom (blue/gray)
  - [ ] Actions: Edit, Delete (disabled for preloaded)
  - [ ] Search and filter (major, custom)
- [ ] Fetch: GET /api/settings/allergens (SWR)

### Task 7: Allergen Form Modal (AC: 008.3, 008.4)
- [ ] Create AllergenFormModal component
  - [ ] Code, name, is_major toggle
  - [ ] Form submission: POST or PUT
  - [ ] Delete confirmation for custom allergens

### Task 8: Organization Creation Hook (AC: 008.7)
- [ ] Add allergen seeding to organization creation workflow
  - [ ] After creating organization → call AllergenService.seedAllergens
  - [ ] Or: Supabase trigger on organizations.INSERT → seed allergens
  - [ ] Ensure idempotent (safe to re-run)

### Task 9: Cache Invalidation & Events (AC: 008.8)
- [ ] Emit events on allergen create/update/delete
- [ ] Invalidate Redis cache: `allergens:{org_id}`
- [ ] Epic 2, 8 subscribe to events

### Task 10: Integration & Testing (AC: All)
- [ ] Unit tests: validation, seed logic
- [ ] Integration tests:
  - [ ] Seed allergens → 14 inserted
  - [ ] Create custom allergen → saved
  - [ ] Delete preloaded allergen → error
  - [ ] Delete custom allergen in use → FK error
  - [ ] RLS policy check
- [ ] E2E tests: create/edit/delete custom allergen

## Dev Notes

### Technical Stack
Same as previous stories: Next.js 15, React 19, TypeScript, Supabase, Redis

### Key Technical Decisions

1. **14 EU Major Allergens** (Regulation EU 1169/2011):
   - Mandatory declaration in EU food products
   - Preloaded on org creation
   - Cannot be deleted (business rule + FK constraints)
   - Can be edited (e.g., translate name)

2. **Custom Allergens**:
   - Organizations can add custom allergens (e.g., additives, spices)
   - is_custom = true
   - Can be deleted if not used in products

3. **Allergen Code Convention**:
   - Preloaded: MILK, EGGS, FISH, etc. (English names, uppercase)
   - Custom: CUSTOM-01, ADDITIVE-X, etc. (org-defined)

4. **Seed Strategy**:
   - Run on organization creation
   - Idempotent: ON CONFLICT DO NOTHING
   - Future: support multiple languages (name_pl, name_en)

### Data Model

```typescript
interface Allergen {
  id: string
  org_id: string                // RLS key (nullable for shared - future)
  code: string                  // Unique per org (e.g., MILK, CUSTOM-01)
  name: string                  // Display name
  is_major: boolean             // True for 14 EU allergens
  is_custom: boolean            // False for preloaded, true for custom
  created_at: Date
  updated_at: Date
}

// Unique: (org_id, code)
// Indexes: org_id, is_major, is_custom
// RLS: org_id = auth.jwt()->>'org_id'
```

### 14 EU Major Allergens (Preload Data)

```typescript
const EU_ALLERGENS = [
  { code: 'MILK', name: 'Milk' },
  { code: 'EGGS', name: 'Eggs' },
  { code: 'FISH', name: 'Fish' },
  { code: 'SHELLFISH', name: 'Crustaceans' },
  { code: 'TREENUTS', name: 'Tree Nuts' },
  { code: 'PEANUTS', name: 'Peanuts' },
  { code: 'WHEAT', name: 'Gluten (Wheat)' },
  { code: 'SOYBEANS', name: 'Soybeans' },
  { code: 'SESAME', name: 'Sesame Seeds' },
  { code: 'MUSTARD', name: 'Mustard' },
  { code: 'CELERY', name: 'Celery' },
  { code: 'LUPIN', name: 'Lupin' },
  { code: 'SULPHITES', name: 'Sulphur Dioxide/Sulphites' },
  { code: 'MOLLUSCS', name: 'Molluscs' }
]
```

### References

- [Source: docs/epics/epic-1-settings.md#Story-1.9]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#FR-SET-008]
- [EU Regulation 1169/2011: Food Allergen Labeling]

### Prerequisites

**Story 1.1**: Organizations (org_id FK, seed on org creation)

### Downstream

- Epic 2: Product allergen assignment uses allergens table
- Epic 8: NPD formulation auto-aggregates allergens from ingredients

## Dev Agent Record

### Context Reference

Story Context: [docs/sprint-artifacts/1-9-allergen-management.context.xml](./1-9-allergen-management.context.xml)

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
