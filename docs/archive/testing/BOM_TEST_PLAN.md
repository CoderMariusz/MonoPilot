# BOM Module Test Plan

## Overview
This document outlines comprehensive testing procedures for the BOM (Bill of Materials) module, covering functional testing, automated testing, and integration testing.

## Test Environment Setup

### Prerequisites
- Database with all migrations applied
- Test data seeded
- API endpoints accessible
- Frontend application running

### Test Data Requirements
- Sample products for each category (MEAT, DRYGOODS, PROCESS, FINISHED_GOODS)
- Sample BOMs with various component types
- Test users with appropriate roles
- Sample suppliers and materials

## Functional Test Cases

### Test Case 1: Create MEAT Product
**Objective**: Verify MEAT product creation with all required fields

**Steps**:
1. Navigate to Technical → BOM → Meat tab
2. Click "Add Item" button
3. Select "Meat" category
4. Fill in required fields:
   - Item Number: "MEAT-001"
   - Name: "Premium Beef"
   - UoM: "kg"
   - Price: "25.50"
   - Expiry Policy: "FROM_DELIVERY_DATE"
   - Shelf Life: "7"
   - Preferred Supplier: "Beef Supplier Co"
5. Click "Save"

**Expected Results**:
- Product created successfully
- Appears in Meat tab
- Supplier field visible and required
- All fields saved correctly

**Test Data**:
```json
{
  "part_number": "MEAT-001",
  "description": "Premium Beef",
  "uom": "kg",
  "std_price": 25.50,
  "category": "MEAT",
  "expiry_policy": "FROM_DELIVERY_DATE",
  "shelf_life_days": 7,
  "preferred_supplier_id": 1
}
```

### Test Case 2: Create DRYGOODS Product
**Objective**: Verify DRYGOODS product creation with subtypes

**Steps**:
1. Navigate to Technical → BOM → Dry Goods tab
2. Click "Add Item" button
3. Select "Dry Goods" category
4. Fill in required fields:
   - Item Number: "DG-001"
   - Name: "Premium Flour"
   - UoM: "kg"
   - Price: "2.50"
   - Subtype: "DG_ING"
   - Expiry Policy: "DAYS_STATIC"
   - Shelf Life: "365"
   - Preferred Supplier: "Flour Supplier Co"
5. Click "Save"

**Expected Results**:
- Product created successfully
- Subtype field visible and required
- Supplier field visible and required
- All fields saved correctly

### Test Case 3: Create PROCESS Product with BOM
**Objective**: Verify PROCESS product creation with BOM components

**Steps**:
1. Navigate to Technical → BOM → Process tab
2. Click "Add Item" button
3. Select "Process" category
4. Fill in basic fields:
   - Item Number: "PR-001"
   - Name: "Processed Meat"
   - UoM: "kg"
   - Price: "30.00"
   - Shelf Life: "5"
5. Add BOM components:
   - Material: "MEAT-001" (Premium Beef)
   - Quantity: "1.0"
   - UoM: "kg"
   - Scrap %: "5.0"
   - Optional: false
   - Phantom: false
   - 1:1 LP: true
   - Unit Cost: "25.50"
6. Click "Save"

**Expected Results**:
- Product created successfully
- BOM components saved correctly
- Supplier field hidden (not visible)
- One-to-one LP checkbox functional
- All BOM fields saved

### Test Case 4: Create FINISHED_GOODS Product with Complex BOM
**Objective**: Verify FINISHED_GOODS product creation with mixed BOM components

**Steps**:
1. Navigate to Technical → BOM → Finished Goods tab
2. Click "Add Item" button
3. Select "Finished Goods" category
4. Fill in basic fields:
   - Item Number: "FG-001"
   - Name: "Premium Sausage"
   - UoM: "kg"
   - Price: "45.00"
   - Rate: "100"
   - Production Lines: "Line 1, Line 2"
5. Add BOM components:
   - Component 1: "PR-001" (Processed Meat), Qty: "0.8", 1:1 LP: true
   - Component 2: "DG-001" (Premium Flour), Qty: "0.1", Optional: true
   - Component 3: "DG-002" (Spices), Qty: "0.05", Phantom: true
6. Click "Save"

**Expected Results**:
- Product created successfully
- Complex BOM saved correctly
- Supplier field hidden (not visible)
- Production lines assigned
- All component types handled correctly

### Test Case 5: Edit Existing Product
**Objective**: Verify product editing functionality

**Steps**:
1. Navigate to any product tab
2. Click "Edit" on existing product
3. Modify fields:
   - Change price
   - Add/remove BOM components
   - Toggle checkboxes (optional, phantom, 1:1 LP)
4. Click "Save"

**Expected Results**:
- Changes saved successfully
- Checkboxes can be toggled on/off
- BOM components updated correctly
- No data loss

### Test Case 6: BOM Component Validation
**Objective**: Verify BOM component validation rules

**Steps**:
1. Create PROCESS product
2. Try to add invalid BOM components:
   - Add FG product as component (should fail)
   - Add same material twice (should warn)
   - Add component with zero quantity (should fail)
3. Test valid combinations:
   - Add MEAT and DRYGOODS components
   - Set different flags (optional, phantom, 1:1 LP)

**Expected Results**:
- Invalid combinations rejected
- Appropriate error messages shown
- Valid combinations accepted
- All validation rules enforced

### Test Case 7: Allergen Inheritance
**Objective**: Verify automatic allergen inheritance from BOM components

**Steps**:
1. Create materials with allergens:
   - Material A: Contains "Nuts"
   - Material B: Contains "Dairy"
2. Create FG product using both materials
3. Check inherited allergens
4. Test manual override:
   - Suppress "Dairy" allergen
   - Verify final allergen list

**Expected Results**:
- Allergens automatically inherited
- Manual override functional
- Allergen list accurate
- UI shows allergen sources

### Test Case 8: Production Lines Integration
**Objective**: Verify production line restrictions and assignments

**Steps**:
1. Create FG product with production lines
2. Add BOM components with line restrictions
3. Test line-specific BOM variations
4. Verify line assignment validation

**Expected Results**:
- Production lines assigned correctly
- Line restrictions enforced
- BOM variations supported
- Validation working properly

### Test Case 9: Scrap Percentage Calculation
**Objective**: Verify scrap percentage handling in BOM components

**Steps**:
1. Create BOM with various scrap percentages
2. Test edge cases:
   - 0% scrap
   - 100% scrap
   - Invalid percentages (negative, >100%)
3. Verify calculation accuracy

**Expected Results**:
- Scrap percentages saved correctly
- Invalid values rejected
- Calculations accurate
- Edge cases handled properly

### Test Case 10: One-to-One LP Consumption
**Objective**: Verify one-to-one LP consumption flag functionality

**Steps**:
1. Create BOM component with 1:1 LP flag
2. Test consumption logic:
   - LP: 500kg material
   - BOM: 0.5kg per unit, 1:1 LP = true
   - Production: 100 units
   - Expected: Consume entire 500kg LP
3. Test without 1:1 LP flag:
   - Expected: Consume only 50kg (0.5 × 100)

**Expected Results**:
- 1:1 LP flag functional
- Consumption logic correct
- Flag affects material usage
- Production planning accurate

### Test Case 11: Delete Product with BOM
**Objective**: Verify product deletion with BOM cleanup

**Steps**:
1. Create product with BOM
2. Delete product
3. Verify BOM cleanup
4. Check for orphaned records

**Expected Results**:
- Product deleted successfully
- BOM and BOM items deleted
- No orphaned records
- Clean database state

### Test Case 12: BOM Versioning
**Objective**: Verify BOM versioning functionality

**Steps**:
1. Create product with BOM version 1.0
2. Modify BOM components
3. Create new BOM version 2.0
4. Test version switching
5. Verify version history

**Expected Results**:
- BOM versioning functional
- Version history maintained
- Version switching works
- Data integrity preserved

## Automated Test Cases

### Unit Tests

#### Test: Checkbox Toggle Functionality
```typescript
describe('BOM Component Checkboxes', () => {
  test('should toggle is_optional checkbox', () => {
    const component = { is_optional: false };
    const result = updateBomComponent(0, 'is_optional', true);
    expect(result.is_optional).toBe(true);
  });

  test('should toggle is_phantom checkbox', () => {
    const component = { is_phantom: false };
    const result = updateBomComponent(0, 'is_phantom', true);
    expect(result.is_phantom).toBe(true);
  });

  test('should toggle one_to_one checkbox', () => {
    const component = { one_to_one: false };
    const result = updateBomComponent(0, 'one_to_one', true);
    expect(result.one_to_one).toBe(true);
  });
});
```

#### Test: Category-Based Field Visibility
```typescript
describe('Category-Based Field Visibility', () => {
  test('should hide supplier field for PROCESS category', () => {
    const modal = render(<AddItemModal category="PROCESS" />);
    expect(modal.queryByText('Preferred Supplier')).toBeNull();
  });

  test('should hide supplier field for FINISHED_GOODS category', () => {
    const modal = render(<AddItemModal category="FINISHED_GOODS" />);
    expect(modal.queryByText('Preferred Supplier')).toBeNull();
  });

  test('should show supplier field for MEAT category', () => {
    const modal = render(<AddItemModal category="MEAT" />);
    expect(modal.getByText('Preferred Supplier')).toBeInTheDocument();
  });
});
```

#### Test: BOM Component Validation
```typescript
describe('BOM Component Validation', () => {
  test('should validate required fields', () => {
    const component = { product_id: '', quantity: '' };
    const errors = validateBomComponent(component);
    expect(errors.product_id).toBeDefined();
    expect(errors.quantity).toBeDefined();
  });

  test('should validate quantity is positive', () => {
    const component = { quantity: '-1' };
    const errors = validateBomComponent(component);
    expect(errors.quantity).toBeDefined();
  });

  test('should validate scrap percentage range', () => {
    const component = { scrap_std_pct: '150' };
    const errors = validateBomComponent(component);
    expect(errors.scrap_std_pct).toBeDefined();
  });
});
```

#### Test: Allergen Inheritance Logic
```typescript
describe('Allergen Inheritance', () => {
  test('should inherit allergens from BOM components', () => {
    const components = [
      { allergens: ['Nuts'] },
      { allergens: ['Dairy'] }
    ];
    const inherited = getInheritedAllergens(components);
    expect(inherited).toContain('Nuts');
    expect(inherited).toContain('Dairy');
  });

  test('should handle suppressed allergens', () => {
    const components = [
      { allergens: ['Nuts'] },
      { allergens: ['Dairy'] }
    ];
    const suppressed = ['Dairy'];
    const inherited = getInheritedAllergens(components, suppressed);
    expect(inherited).toContain('Nuts');
    expect(inherited).not.toContain('Dairy');
  });
});
```

### Integration Tests

#### Test: Product Creation API
```typescript
describe('Product Creation API', () => {
  test('should create MEAT product', async () => {
    const productData = {
      part_number: 'MEAT-001',
      description: 'Premium Beef',
      category: 'MEAT',
      // ... other fields
    };
    const result = await ProductsAPI.create(productData);
    expect(result.id).toBeDefined();
    expect(result.category).toBe('MEAT');
  });

  test('should create PROCESS product with BOM', async () => {
    const productData = {
      part_number: 'PR-001',
      description: 'Processed Meat',
      category: 'PROCESS',
      bom_items: [
        {
          material_id: 1,
          quantity: 1.0,
          one_to_one: true
        }
      ]
    };
    const result = await ProductsAPI.create(productData);
    expect(result.id).toBeDefined();
    expect(result.activeBom).toBeDefined();
  });
});
```

#### Test: BOM Component API
```typescript
describe('BOM Component API', () => {
  test('should save BOM components with all fields', async () => {
    const bomData = {
      material_id: 1,
      quantity: 1.0,
      scrap_std_pct: 5.0,
      is_optional: false,
      is_phantom: false,
      one_to_one: true,
      unit_cost_std: 25.50
    };
    const result = await BomAPI.createComponent(bomData);
    expect(result.one_to_one).toBe(true);
    expect(result.scrap_std_pct).toBe(5.0);
  });
});
```

## Performance Tests

### Test: Large BOM Performance
**Objective**: Verify performance with large BOMs

**Steps**:
1. Create product with 100+ BOM components
2. Measure load time
3. Test edit performance
4. Verify save performance

**Expected Results**:
- Load time < 2 seconds
- Edit performance acceptable
- Save time < 5 seconds
- No memory leaks

### Test: Concurrent User Performance
**Objective**: Verify performance with multiple users

**Steps**:
1. Simulate 10 concurrent users
2. Test product creation
3. Test BOM editing
4. Monitor database performance

**Expected Results**:
- No deadlocks
- Acceptable response times
- Data consistency maintained
- No performance degradation

## Security Tests

### Test: Role-Based Access Control
**Objective**: Verify proper access control

**Steps**:
1. Test with different user roles
2. Verify access restrictions
3. Test unauthorized access attempts
4. Verify audit logging

**Expected Results**:
- Proper access control enforced
- Unauthorized access blocked
- Audit trail maintained
- Security policies followed

## Error Handling Tests

### Test: Database Connection Errors
**Objective**: Verify error handling for database issues

**Steps**:
1. Simulate database connection loss
2. Test error messages
3. Verify recovery procedures
4. Test data consistency

**Expected Results**:
- Appropriate error messages
- Graceful degradation
- Data consistency maintained
- Recovery procedures functional

### Test: Validation Error Handling
**Objective**: Verify validation error handling

**Steps**:
1. Test invalid data submission
2. Verify error messages
3. Test error recovery
4. Verify data integrity

**Expected Results**:
- Clear error messages
- Data integrity maintained
- Recovery procedures functional
- User experience acceptable

## Test Data Management

### Test Data Setup
```sql
-- Sample products for testing
INSERT INTO products (part_number, description, category, type) VALUES
('MEAT-001', 'Premium Beef', 'MEAT', 'RM'),
('DG-001', 'Premium Flour', 'DRYGOODS', 'RM'),
('PR-001', 'Processed Meat', 'PROCESS', 'PR'),
('FG-001', 'Premium Sausage', 'FINISHED_GOODS', 'FG');

-- Sample BOMs for testing
INSERT INTO bom (product_id, version, is_active) VALUES
(3, '1.0', true),
(4, '1.0', true);

-- Sample BOM items for testing
INSERT INTO bom_items (bom_id, material_id, quantity, uom, one_to_one) VALUES
(1, 1, 1.0, 'kg', true),
(2, 1, 0.8, 'kg', true),
(2, 2, 0.1, 'kg', false);
```

### Test Data Cleanup
```sql
-- Cleanup after tests
DELETE FROM bom_items WHERE bom_id IN (SELECT id FROM bom WHERE product_id IN (3, 4));
DELETE FROM bom WHERE product_id IN (3, 4);
DELETE FROM products WHERE id IN (3, 4);
```

## Test Execution Schedule

### Phase 1: Unit Tests (Day 1)
- Checkbox functionality tests
- Field visibility tests
- Validation tests
- Allergen inheritance tests

### Phase 2: Integration Tests (Day 2)
- API endpoint tests
- Database integration tests
- BOM component tests
- Product creation tests

### Phase 3: Functional Tests (Day 3-4)
- Manual test case execution
- User interface testing
- End-to-end workflows
- Error handling testing

### Phase 4: Performance Tests (Day 5)
- Load testing
- Stress testing
- Memory usage testing
- Database performance testing

### Phase 5: Security Tests (Day 6)
- Access control testing
- Authentication testing
- Authorization testing
- Audit trail testing

## Test Results Documentation

### Test Results Template
```
Test Case: [Test Case Name]
Status: [PASS/FAIL]
Execution Date: [Date]
Tester: [Name]
Notes: [Any additional notes]
Screenshots: [If applicable]
```

### Defect Reporting Template
```
Defect ID: [Unique ID]
Title: [Brief description]
Severity: [Critical/High/Medium/Low]
Priority: [P1/P2/P3/P4]
Steps to Reproduce: [Detailed steps]
Expected Result: [What should happen]
Actual Result: [What actually happened]
Environment: [Test environment details]
```

## Test Automation Setup

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.{js,jsx,ts,tsx}'],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test Database Setup
```javascript
// jest.setup.js
import { setupTestDatabase } from './test-utils/database';

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await cleanupTestDatabase();
});
```

## Conclusion

This comprehensive test plan ensures thorough testing of the BOM module, covering all functional requirements, edge cases, and integration points. The combination of manual and automated testing provides confidence in the system's reliability and performance.
