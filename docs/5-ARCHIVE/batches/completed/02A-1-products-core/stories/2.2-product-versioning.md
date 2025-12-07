# Story 2.2: Product Edit with Versioning

**Epic:** 2 - Technical Core
**Batch:** 2A - Products + Settings
**Status:** Pending
**Priority:** P0 (Blocker)
**Story Points:** 3
**Created:** 2025-11-23

---

## Goal

Implement automatic version tracking for product edits using an X.Y versioning scheme, ensuring complete change history and audit compliance for all product modifications.

## User Story

**As a** Technical user
**I want** product edits to automatically increment versions
**So that** we maintain a complete history of all changes for compliance and traceability

---

## Problem Statement

In manufacturing (especially food, pharma, and regulated industries), product specifications are critical for compliance and traceability. When a product's formulation, packaging, or other attributes change, we must:

1. **Track what changed** - Which fields were modified
2. **Track when it changed** - Timestamp of modification
3. **Track who changed it** - User accountability
4. **Maintain version lineage** - Clear progression from v1.0 → v1.1 → v2.0

Without automatic versioning:
- Manual version tracking is error-prone
- Change history can be lost
- Compliance audits are difficult
- Traceability is incomplete

---

## Acceptance Criteria

### AC-2.2.1: Automatic Version Increment on Edit

**Given** a product exists with version 1.0
**When** a Technical user edits any business field (name, description, UoM, inventory settings, etc.)
**And** clicks "Save Changes"
**Then** the product version automatically increments to 1.1
**And** the version increment happens server-side (via database trigger)
**And** the user does NOT manually set the version

**Success Criteria:**
- Version increment is atomic with the update transaction
- No manual version input field in the edit form
- Version shown as read-only in UI
- Update fails if trigger fails (all-or-nothing)

---

### AC-2.2.2: Version Format X.Y with Rollover

**Given** a product has various versions
**Then** the versioning follows this format:

**Initial creation:** Version 1.0
**First edit:** 1.0 → 1.1
**Second edit:** 1.1 → 1.2
**...continuing:**
- 1.8 → 1.9
- 1.9 → 2.0 (rollover to next major version)
- 2.0 → 2.1
- 2.9 → 3.0
- ... up to 9.9 → 10.0

**And** the version is stored as NUMERIC(4,1) in the database

**Success Criteria:**
- Version increment logic in database function `increment_product_version()`
- Rollover at X.9 → (X+1).0 works correctly
- Version supports up to 99.9 (reasonable limit)

---

### AC-2.2.3: Version History Record Creation

**Given** a product is edited and version increments from 1.5 to 1.6
**When** the save completes
**Then** a new record is inserted into `product_version_history` table with:
- `product_id`: UUID of the product
- `version`: 1.6 (new version)
- `changed_fields`: JSONB object containing old → new values for changed fields
- `changed_by`: UUID of the user who made the edit
- `changed_at`: Timestamp of the change
- `org_id`: Organization UUID

**Example changed_fields JSONB:**
```json
{
  "name": { "old": "Wheat Flour", "new": "Organic Wheat Flour" },
  "shelf_life_days": { "old": 180, "new": 365 }
}
```

**And** only fields that actually changed are recorded
**And** audit columns (created_at, updated_at, created_by, updated_by) are NOT tracked in changed_fields

**Success Criteria:**
- Database trigger `trigger_track_product_version` handles version history
- JSONB format allows querying specific field changes
- Empty edits (no field changes) do NOT create history record or increment version

---

### AC-2.2.4: Edit Drawer Shows Current Version

**Given** I am editing a product with version 2.3
**When** the Edit Drawer opens
**Then** I see a version indicator at the top:
- Text: "Current version: 2.3"
- Helper text: "Version will auto-increment to 2.4 when you save changes"
- Styled as info badge or alert

**And** the version field is NOT editable (read-only display)

**Success Criteria:**
- Version clearly visible in edit UI
- User understands versioning is automatic
- No confusion about how versioning works

---

### AC-2.2.5: No Version Increment for Unchanged Edits

**Given** I open a product for editing
**When** I change a field value, then change it back to the original value
**And** click "Save Changes"
**Then** the version does NOT increment (remains at current version)
**And** NO version history record is created
**And** only `updated_at` and `updated_by` are updated

**Success Criteria:**
- Trigger compares OLD vs NEW values for each field
- Only actual changes trigger versioning
- No-op edits don't pollute history

---

### AC-2.2.6: Version Increment for All Business Fields

**Given** a product exists
**When** I edit any of these business fields:
- name
- type
- description
- category
- uom
- status
- shelf_life_days
- min_stock_qty
- max_stock_qty
- reorder_point
- cost_per_unit

**Then** the version increments
**And** the change is recorded in version history

**When** I edit only audit fields (updated_at, updated_by)
**Then** the version does NOT increment (these are metadata, not business data)

**Success Criteria:**
- Clear definition of "business fields" vs "audit fields"
- Trigger logic only checks business fields
- All business field changes are versioned

---

### AC-2.2.7: Soft Delete Does NOT Increment Version

**Given** a product exists with version 3.5
**When** the product is soft deleted (deleted_at set)
**Then** the version remains 3.5 (no increment)
**And** no version history record is created
**And** the deleted_at timestamp is set

**Success Criteria:**
- Trigger skips versioning if deleted_at is being set
- Delete operation is fast (no version processing overhead)

---

## Technical Implementation

### Database Trigger: track_product_version()

**Function Definition:**

```sql
CREATE OR REPLACE FUNCTION track_product_version()
RETURNS TRIGGER AS $$
DECLARE
  changed JSONB := '{}';
  field TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  -- Skip if soft delete operation
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Track changed fields (excluding audit columns)
  FOREACH field IN ARRAY ARRAY[
    'code', 'name', 'type', 'description', 'category', 'uom',
    'shelf_life_days', 'min_stock_qty', 'max_stock_qty',
    'reorder_point', 'cost_per_unit', 'status'
  ]
  LOOP
    EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', field, field)
      INTO old_val, new_val
      USING OLD, NEW;

    IF old_val IS DISTINCT FROM new_val THEN
      changed := changed || jsonb_build_object(
        field,
        jsonb_build_object('old', old_val, 'new', new_val)
      );
    END IF;
  END LOOP;

  -- If any fields changed, increment version and log
  IF changed <> '{}' THEN
    -- Increment version
    NEW.version := increment_product_version(OLD.version);

    -- Insert version history
    INSERT INTO product_version_history (
      product_id, version, changed_fields, changed_by, org_id
    ) VALUES (
      NEW.id, NEW.version, changed, NEW.updated_by, NEW.org_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
CREATE TRIGGER trigger_track_product_version
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION track_product_version();
```

### Database Function: increment_product_version()

```sql
CREATE OR REPLACE FUNCTION increment_product_version(current_version NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  major_ver INTEGER;
  minor_ver INTEGER;
BEGIN
  -- Extract major and minor parts
  major_ver := floor(current_version);
  minor_ver := round((current_version - major_ver) * 10);

  -- Increment
  IF minor_ver >= 9 THEN
    -- Rollover to next major version
    RETURN (major_ver + 1.0);
  ELSE
    -- Increment minor version
    RETURN (major_ver + (minor_ver + 1) * 0.1);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### API Changes (No New Endpoints)

**PUT /api/technical/products/:id**
- No changes to request/response contract
- Version increment happens transparently via trigger
- Response includes new version number

**Example Request:**
```json
{
  "name": "Organic Wheat Flour",
  "shelf_life_days": 365
}
```

**Example Response:**
```json
{
  "id": "uuid",
  "code": "FLOUR-001",
  "name": "Organic Wheat Flour",
  "version": 1.1,
  "shelf_life_days": 365,
  "updated_at": "2025-11-23T10:30:00Z",
  "updated_by": { "id": "uuid", "name": "John Doe" }
}
```

### Frontend Changes

**ProductEditDrawer.tsx:**

```tsx
export function ProductEditDrawer({ product, open, onClose, onSuccess }: Props) {
  const nextVersion = calculateNextVersion(product.version) // Helper function

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit Product</SheetTitle>
          <div className="mt-2">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Current version: <strong>{product.version}</strong>
                <br />
                Changes will create version <strong>{nextVersion}</strong>
              </AlertDescription>
            </Alert>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Form fields - same as Story 2.1 */}
            {/* Code field is disabled */}

            <SheetFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

// Helper function
function calculateNextVersion(currentVersion: number): number {
  const major = Math.floor(currentVersion)
  const minor = Math.round((currentVersion - major) * 10)

  if (minor >= 9) {
    return major + 1.0
  } else {
    return major + (minor + 1) * 0.1
  }
}
```

**ProductDetailView.tsx:**

```tsx
// Show version prominently
<div className="flex items-center gap-2">
  <h1>{product.name}</h1>
  <Badge variant="secondary">v{product.version}</Badge>
</div>
```

---

## UI/UX Specifications

### Version Display

**Product List:**
- Version column shows version number (e.g., "1.0", "1.5", "2.0")
- No special styling needed

**Product Detail:**
- Version badge next to product name
- Format: "v1.0", "v2.3", etc.
- Badge color: secondary (gray)

**Edit Drawer:**
- Alert box at top with:
  - Icon: Info icon
  - Message: "Current version: X.Y. Changes will create version X.Y+1"
  - Style: Info alert (blue background)

### User Experience

**Transparent Versioning:**
- Users don't need to think about versioning
- Version increments happen automatically
- Clear indication that versioning is happening
- No manual intervention required

**Error Handling:**
- If version trigger fails, entire update rolls back
- User sees error: "Failed to update product. Please try again."
- No partial updates (version + data always in sync)

---

## Testing Checklist

### Unit Tests

```typescript
// Test: increment_product_version function
describe('increment_product_version', () => {
  test('increments minor version', () => {
    expect(incrementProductVersion(1.0)).toBe(1.1)
    expect(incrementProductVersion(1.5)).toBe(1.6)
    expect(incrementProductVersion(2.3)).toBe(2.4)
  })

  test('rolls over at X.9', () => {
    expect(incrementProductVersion(1.9)).toBe(2.0)
    expect(incrementProductVersion(5.9)).toBe(6.0)
    expect(incrementProductVersion(9.9)).toBe(10.0)
  })
})

// Test: calculateNextVersion helper
describe('calculateNextVersion', () => {
  test('matches database logic', () => {
    expect(calculateNextVersion(1.0)).toBe(1.1)
    expect(calculateNextVersion(1.9)).toBe(2.0)
  })
})
```

### Integration Tests

```typescript
test('PUT /api/technical/products/:id increments version', async () => {
  // Create product (version 1.0)
  const product = await createProduct({
    code: 'TEST-001',
    name: 'Test Product',
    type: 'RM',
    uom: 'kg'
  })
  expect(product.version).toBe(1.0)

  // Update name
  const updated = await updateProduct(product.id, {
    name: 'Updated Product'
  })
  expect(updated.version).toBe(1.1)

  // Update again
  const updated2 = await updateProduct(product.id, {
    description: 'New description'
  })
  expect(updated2.version).toBe(1.2)
})

test('No version increment for unchanged edits', async () => {
  const product = await createProduct({
    code: 'TEST-002',
    name: 'Test',
    type: 'RM',
    uom: 'kg'
  })

  // Edit but don't change anything
  const updated = await updateProduct(product.id, {
    name: 'Test' // Same value
  })
  expect(updated.version).toBe(1.0) // No increment
})

test('Version history created on edit', async () => {
  const product = await createProduct({
    code: 'TEST-003',
    name: 'Original',
    type: 'RM',
    uom: 'kg'
  })

  await updateProduct(product.id, { name: 'Changed' })

  const history = await getProductHistory(product.id)
  expect(history).toHaveLength(1)
  expect(history[0].version).toBe(1.1)
  expect(history[0].changed_fields.name).toEqual({
    old: 'Original',
    new: 'Changed'
  })
})
```

### Database Tests (SQL)

```sql
-- Test: Version increment trigger
DO $$
DECLARE
  product_id UUID;
  result_version NUMERIC;
BEGIN
  -- Create product
  INSERT INTO products (code, name, type, uom, org_id)
  VALUES ('TEST-001', 'Test', 'RM', 'kg', 'test-org-id')
  RETURNING id INTO product_id;

  -- Update product
  UPDATE products SET name = 'Updated' WHERE id = product_id;

  -- Check version
  SELECT version INTO result_version FROM products WHERE id = product_id;
  ASSERT result_version = 1.1, 'Version should be 1.1';

  -- Check history
  ASSERT (SELECT COUNT(*) FROM product_version_history WHERE product_id = product_id) = 1,
    'History record should exist';
END $$;
```

### E2E Tests (Playwright)

```typescript
test('Edit product and verify version increment', async ({ page }) => {
  // Create product first
  await createTestProduct({ code: 'E2E-001', name: 'E2E Product' })

  // Navigate to product detail
  await page.goto('/technical/products/[product-id]')
  await expect(page.locator('text=v1.0')).toBeVisible()

  // Edit
  await page.click('button:has-text("Edit")')
  await page.fill('input[name="name"]', 'E2E Product Updated')

  // Verify version preview in drawer
  await expect(page.locator('text=Changes will create version 1.1')).toBeVisible()

  // Save
  await page.click('button:has-text("Save Changes")')

  // Verify version updated
  await expect(page.locator('text=v1.1')).toBeVisible()
})

test('Multiple edits increment version correctly', async ({ page }) => {
  await createTestProduct({ code: 'E2E-002', name: 'Product' })

  for (let i = 1; i <= 5; i++) {
    await page.goto('/technical/products/[product-id]')
    await page.click('button:has-text("Edit")')
    await page.fill('input[name="description"]', `Edit ${i}`)
    await page.click('button:has-text("Save Changes")')

    const expectedVersion = `v1.${i}`
    await expect(page.locator(`text=${expectedVersion}`)).toBeVisible()
  }
})
```

---

## Dependencies

**Required Before This Story:**
- ✅ Story 2.1 (Product CRUD) - Edit functionality exists
- ✅ Database migration with trigger and function
- ✅ product_version_history table created

**Blocks:**
- Story 2.3 (Product History) - Needs version history data
- All downstream features that depend on product versioning

---

## Notes

### Design Decisions

1. **Server-Side Versioning:** Version increment happens in database trigger (not application code) for:
   - Data integrity guarantee
   - No risk of version skew
   - Atomic with the update transaction

2. **JSONB for Changed Fields:** Flexible, queryable format that:
   - Allows efficient storage of sparse data
   - Enables queries like "find all products where 'name' changed"
   - Supports future schema evolution

3. **X.Y Format (not Semantic Versioning):**
   - Simple, easy to understand
   - Suitable for manufacturing context
   - No need for "patch" level (X.Y.Z)

4. **Audit Columns Excluded:** created_at, updated_at, created_by, updated_by are metadata, not business data, so they don't trigger versioning

### Performance Considerations

- Trigger adds ~10-20ms overhead to UPDATE operations
- JSONB storage is efficient (compressed)
- History table grows linearly with edits (not a concern for product master data)
- Index on product_version_history(product_id, changed_at DESC) keeps history queries fast

### Future Enhancements

- Version comparison UI (Story 2.3)
- Rollback to previous version
- Version branching (major versions)
- Change approval workflow before version increment
- Version freeze/lock for compliance

---

## Definition of Done

- [ ] Database function `increment_product_version()` created
- [ ] Database trigger `track_product_version` created and tested
- [ ] Product edit UI shows current version and next version
- [ ] Version increments automatically on save
- [ ] Version history records created with changed fields
- [ ] No version increment for unchanged edits
- [ ] No version increment for soft delete
- [ ] Unit tests for version increment logic (100% coverage)
- [ ] Integration tests for version tracking (100% coverage)
- [ ] E2E tests for edit with versioning
- [ ] Database migration script tested
- [ ] Code review approved
- [ ] Story documentation committed

---

## Estimation Breakdown

**3 Story Points = ~5-7 hours**
- Database function and trigger: 2 hours
- Migration script: 30 min
- Frontend version display in edit drawer: 1 hour
- Unit tests (DB function): 1 hour
- Integration tests (API + trigger): 1.5 hours
- E2E tests: 1 hour
- Testing and bug fixes: 1 hour
