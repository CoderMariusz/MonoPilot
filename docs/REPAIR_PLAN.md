# MonoPilot MES - Repair Plan

## Executive Summary

Based on analysis of the technical module documentation and testing issues, this document outlines critical fixes needed for the BOM Components functionality and overall system consistency. The main issues stem from field name mismatches, data type inconsistencies, and incomplete API implementations.

## Critical Issues Identified

### 1. Field Name Mismatches (High Priority)

**Problem**: Test data uses `price` but form expects `std_price`
- **Location**: `apps/frontend/e2e/bom/bom-components.spec.ts:31`
- **Impact**: Form validation fails, preventing API calls
- **Root Cause**: Inconsistent field naming between test fixtures and form validation

**Problem**: `production_lines` type mismatch
- **Location**: Test provides string `"All lines"`, form expects `string[]`
- **Impact**: Type validation errors, potential serialization issues
- **Root Cause**: Test data doesn't match form data structure

### 2. Database Schema Inconsistencies (High Priority)

**Problem**: Table name mismatch - `boms` vs `bom`
- **Location**: `apps/frontend/lib/api/products.ts:66`
- **Impact**: Database insert failures
- **Root Cause**: API uses `boms` but schema defines `bom`

**Problem**: Column name mismatch - `production_lines` vs `production_line_restrictions`
- **Location**: BOM items table
- **Impact**: Data not properly stored/retrieved
- **Root Cause**: Frontend sends `production_lines`, database expects `production_line_restrictions`

### 3. Expiry Policy Value Mismatches (Medium Priority)

**Problem**: Test data uses legacy values (`use_by`, `best_before`, `indefinite`)
- **Location**: Test fixtures and existing data
- **Impact**: Validation failures, data inconsistency
- **Root Cause**: Schema migration didn't update all existing data

### 4. Missing API Functionality (Medium Priority)

**Problem**: BOM versioning functions not implemented
- **Location**: `AddItemModal.tsx:1180-1205`
- **Impact**: UI shows non-functional buttons
- **Root Cause**: Placeholder implementations not completed

## Detailed Repair Plan

### Phase 1: Critical Field Fixes (Day 1)

#### 1.1 Fix Test Data Field Names
**File**: `apps/frontend/e2e/bom/bom-components.spec.ts`

```typescript
// BEFORE (line 31)
price: '50.00',

// AFTER
std_price: '50.00',
```

**File**: `apps/frontend/e2e/bom/bom-components.spec.ts`

```typescript
// BEFORE (line 40)
await helpers.selectProductionLines(['ALL']);

// AFTER - Ensure this returns string[] not string
await helpers.selectProductionLines(['ALL']); // Already correct, verify helper implementation
```

#### 1.2 Add Field Name Tolerance in Frontend
**File**: `apps/frontend/components/AddItemModal.tsx`

Add before line 554 (in `handleSubmit` function):

```typescript
// Add field name tolerance
if ((formData as any).price && !formData.std_price) {
  updateFormField('std_price', (formData as any).price);
}

// Normalize production_lines to array
if (typeof formData.production_lines === 'string') {
  setFormData(prev => ({
    ...prev,
    production_lines: formData.production_lines === 'ALL' ? ['ALL'] : []
  }));
}
```

### Phase 2: Database Schema Fixes (Day 1-2)

#### 2.1 Fix Table Name in API
**File**: `apps/frontend/lib/api/products.ts`

```typescript
// BEFORE (line 66)
.from('boms')

// AFTER
.from('bom')
```

**File**: `apps/frontend/lib/api/products.ts`

```typescript
// BEFORE (line 132)
.from('bom')

// AFTER
.from('bom')
```

#### 2.2 Fix Column Mapping in BOM Items
**File**: `apps/frontend/lib/api/products.ts`

Update lines 90 and 182:

```typescript
// BEFORE
production_lines: item.production_lines || [],

// AFTER
production_line_restrictions: item.production_lines || [],
production_lines: undefined, // Remove this field
```

### Phase 3: Expiry Policy Value Mapping (Day 2)

#### 3.1 Add Value Mapping in Frontend
**File**: `apps/frontend/components/AddItemModal.tsx`

Add in `handleSubmit` function before API call:

```typescript
// Map legacy expiry policy values
const mapExpiryPolicy = (policy: string) => {
  const mapping: Record<string, string> = {
    'use_by': 'FROM_MFG_DATE',
    'best_before': 'FROM_DELIVERY_DATE',
    'indefinite': 'DAYS_STATIC'
  };
  return mapping[policy] || policy;
};

// Apply mapping
if (payload.expiry_policy) {
  payload.expiry_policy = mapExpiryPolicy(payload.expiry_policy);
}
```

### Phase 4: Complete Missing API Functions (Day 3)

#### 4.1 Implement BOM Versioning Functions
**File**: `apps/frontend/lib/api/products.ts`

Add new methods:

```typescript
static async duplicateBom(productId: number, bomId: number): Promise<void> {
  // Get current BOM
  const { data: currentBom } = await supabase
    .from('bom')
    .select('*')
    .eq('id', bomId)
    .single();

  // Get BOM items
  const { data: bomItems } = await supabase
    .from('bom_items')
    .select('*')
    .eq('bom_id', bomId);

  // Create new version
  const newVersion = this.incrementVersion(currentBom.version);
  const { data: newBom } = await supabase
    .from('bom')
    .insert([{
      product_id: productId,
      version: newVersion,
      is_active: false,
      created_by: null,
      updated_by: null
    }])
    .select()
    .single();

  // Copy BOM items
  if (bomItems && bomItems.length > 0) {
    const newBomItems = bomItems.map(item => ({
      ...item,
      bom_id: newBom.id,
      id: undefined
    }));

    await supabase
      .from('bom_items')
      .insert(newBomItems);
  }
}

static async activateBom(bomId: number): Promise<void> {
  // Deactivate all other BOMs for this product
  const { data: bom } = await supabase
    .from('bom')
    .select('product_id')
    .eq('id', bomId)
    .single();

  await supabase
    .from('bom')
    .update({ is_active: false })
    .eq('product_id', bom.product_id);

  // Activate this BOM
  await supabase
    .from('bom')
    .update({ is_active: true })
    .eq('id', bomId);
}

private static incrementVersion(version: string): string {
  const parts = version.split('.');
  const major = parseInt(parts[0]);
  const minor = parseInt(parts[1]) + 1;
  return `${major}.${minor}`;
}
```

### Phase 5: Update Documentation (Day 3-4)

#### 5.1 Update Technical Module Guide
**File**: `docs/modules/technical/TECHNICAL_MODULE_GUIDE.md`

- Fix table name references (`boms` → `bom`)
- Add production_line_restrictions column documentation
- Update API examples with correct field names
- Add BOM versioning section

#### 5.2 Update Test Plan
**File**: `docs/testing/BOM_TEST_PLAN.md`

- Update test data examples to use `std_price`
- Add production_lines array format examples
- Include BOM versioning test cases
- Add field mapping validation tests

#### 5.3 Update Database Schema
**File**: `docs/DATABASE_SCHEMA.md`

- Add production_line_restrictions column to bom_items table
- Update table name from `boms` to `bom`
- Add BOM versioning workflow documentation

### Phase 6: Testing and Validation (Day 4-5)

#### 6.1 Unit Tests
- Test field name mapping functions
- Test BOM versioning API methods
- Test expiry policy value mapping
- Test production_lines array handling

#### 6.2 Integration Tests
- Test complete product creation flow
- Test BOM component creation with all flags
- Test BOM versioning workflow
- Test data consistency across API calls

#### 6.3 E2E Tests
- Update existing BOM component tests
- Add BOM versioning E2E tests
- Test error handling scenarios
- Validate form submission with corrected field names

## Implementation Priority

### Critical (Must Fix First)
1. Field name mismatches (`price` vs `std_price`)
2. Table name corrections (`boms` → `bom`)
3. Column mapping fixes (`production_lines` → `production_line_restrictions`)

### High Priority
1. Production lines type handling
2. Expiry policy value mapping
3. Test data consistency

### Medium Priority
1. BOM versioning implementation
2. Documentation updates
3. Additional test coverage

## Success Criteria

- [ ] All BOM component tests pass
- [ ] Form validation works with correct field names
- [ ] Database operations complete successfully
- [ ] BOM versioning functions are operational
- [ ] Documentation reflects actual implementation
- [ ] No console errors during product creation
- [ ] Data consistency maintained across all operations

## Risk Mitigation

1. **Backup Database**: Before making schema changes
2. **Incremental Testing**: Test each fix individually
3. **Rollback Plan**: Keep original code commented for quick rollback
4. **Data Migration**: Plan for updating existing data with new field mappings

## Timeline

- **Day 1**: Critical field fixes and basic API corrections
- **Day 2**: Database schema fixes and value mapping
- **Day 3**: BOM versioning implementation
- **Day 4**: Documentation updates and additional testing
- **Day 5**: Final validation and deployment

## Notes

- All changes should be backward compatible where possible
- Test data should be updated to match new field requirements
- Consider adding migration scripts for existing data
- Monitor performance impact of new BOM versioning features
