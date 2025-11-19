# Story 0.13: Add Missing BOM API GET Endpoints

**Priority:** P0 (CRITICAL - Blocker for BOM edit)
**Effort:** 3 SP (6 hours)
**Epic:** Epic 0 - P0 Data Integrity Fixes
**Status:** ready-for-dev

## Dev Agent Record

### Context Reference
- `docs/sprint-artifacts/0-13-add-bom-api-get-endpoints.context.xml`

---

## Problem Statement

BOM edit functionality is broken because API routes are missing GET methods:
- `BomsAPI.getById(id)` calls GET `/api/technical/boms/{id}` → **405 Method Not Allowed**
- `BomsAPI.getItems(bomId)` calls GET `/api/technical/boms/{id}/items` → **405 Method Not Allowed**

Currently `CompositeProductModal` works around this by using Supabase directly, but this breaks API layer consistency and any other code using `BomsAPI`.

---

## User Story

**As a** developer maintaining MonoPilot,
**I want** BOM API routes to have GET methods,
**So that** `BomsAPI.getById()` and `BomsAPI.getItems()` work correctly and BOM edit flows function properly.

---

## Acceptance Criteria

### AC1: GET /api/technical/boms/[id]
**Given** a valid BOM ID exists in database
**When** client calls `BomsAPI.getById(bomId)`
**Then** API returns BOM with product and items included
**And** response matches `Bom` type from `lib/types.ts`

### AC2: GET /api/technical/boms/[id]/items
**Given** a valid BOM ID exists in database
**When** client calls `BomsAPI.getItems(bomId)`
**Then** API returns array of BOM items with material details
**And** items are ordered by sequence
**And** each item includes `material` object with product details

### AC3: Error Handling
**Given** invalid BOM ID (non-existent or malformed)
**When** client calls GET endpoint
**Then** API returns appropriate error (404 for not found, 400 for invalid)
**And** error format matches standard API error structure

### AC4: API Layer Consistency
**Given** BOM GET endpoints exist
**When** reviewing `CompositeProductModal`
**Then** component should be refactored to use `BomsAPI` instead of direct Supabase calls
**And** all BOM data access goes through API layer

---

## Technical Implementation

### Files to Modify

1. **`apps/frontend/app/api/technical/boms/[id]/route.ts`**
   - Add GET method (currently only has PATCH, DELETE)

2. **`apps/frontend/app/api/technical/boms/[id]/items/route.ts`**
   - Add GET method (currently only has PUT)

3. **`apps/frontend/components/CompositeProductModal.tsx`** (optional refactor)
   - Replace direct Supabase calls with `BomsAPI` methods

### Implementation Code

**GET /api/technical/boms/[id]:**

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bomId = parseInt(id);

    if (isNaN(bomId)) {
      return NextResponse.json({ error: 'Invalid BOM ID' }, { status: 400 });
    }

    const { data: bom, error } = await supabase
      .from('boms')
      .select(`
        *,
        product:products(id, part_number, description, uom),
        bom_items(
          *,
          material:products!bom_items_material_id_fkey(
            id, part_number, description, uom, is_active
          )
        )
      `)
      .eq('id', bomId)
      .single();

    if (error || !bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 });
    }

    return NextResponse.json(bom);

  } catch (error) {
    console.error('BOM GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**GET /api/technical/boms/[id]/items:**

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bomId = parseInt(id);

    if (isNaN(bomId)) {
      return NextResponse.json({ error: 'Invalid BOM ID' }, { status: 400 });
    }

    const { data: items, error } = await supabase
      .from('bom_items')
      .select(`
        *,
        material:products!bom_items_material_id_fkey(
          id, part_number, description, uom, is_active
        )
      `)
      .eq('bom_id', bomId)
      .order('sequence');

    if (error) {
      console.error('Failed to fetch BOM items:', error);
      return NextResponse.json({ error: 'Failed to fetch BOM items' }, { status: 500 });
    }

    return NextResponse.json(items || []);

  } catch (error) {
    console.error('BOM items GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## Testing Checklist

- [ ] GET `/api/technical/boms/1` returns BOM with product and items
- [ ] GET `/api/technical/boms/1/items` returns items array ordered by sequence
- [ ] GET with invalid ID returns 400
- [ ] GET with non-existent ID returns 404
- [ ] `BomsAPI.getById()` works correctly
- [ ] `BomsAPI.getItems()` works correctly
- [ ] BOM edit modal loads items correctly

---

## Definition of Done

- [ ] GET methods added to both routes
- [ ] Error handling matches existing patterns
- [ ] API returns all required fields
- [ ] No TypeScript errors
- [ ] Manual test: Edit BOM → items load correctly

---

## Architecture Reference

See: `docs/architecture.md` → **Pattern 22b: BOM API Route Requirements**

---

## Dependencies

- None (standalone fix)

## Blocked By

- None

## Blocks

- Story 0.14 (BOM History fix depends on working BOM edit)
