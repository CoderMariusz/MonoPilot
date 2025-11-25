# Planning Module Test Plan

## Overview
This document outlines comprehensive testing procedures for the Planning module, covering work order creation, material planning, scheduling, and integration with BOM and Production modules.

## Test Environment Setup

### Prerequisites
- BOM module fully functional
- Products and BOMs created
- Material availability data
- Production capacity data
- User roles and permissions

### Test Data Requirements
- Sample products (MEAT, DRYGOODS, PROCESS, FINISHED_GOODS)
- Complete BOMs with various component types
- Material inventory data
- Production line capacity
- Work order templates

## Functional Test Cases

### Test Case 1: Create Work Order for PROCESS Product
**Objective**: Verify work order creation for PROCESS products with BOM snapshot

**Steps**:
1. Navigate to Planning → Work Orders
2. Click "Create Work Order"
3. Select product: "PR-001" (Processed Meat)
4. Fill in work order details:
   - WO Number: "WO-001"
   - Quantity: "100"
   - Priority: "High"
   - KPI Scope: "PR"
   - Planned Start: "2024-01-15 08:00"
   - Planned End: "2024-01-15 16:00"
5. Click "Create"

**Expected Results**:
- Work order created successfully
- BOM snapshot created in wo_materials
- Material requirements calculated
- Work order appears in list

**Test Data**:
```json
{
  "wo_number": "WO-001",
  "product_id": 3,
  "quantity_planned": 100,
  "priority": "high",
  "kpi_scope": "PR",
  "planned_start": "2024-01-15T08:00:00Z",
  "planned_end": "2024-01-15T16:00:00Z"
}
```

### Test Case 2: Create Work Order for FINISHED_GOODS Product
**Objective**: Verify work order creation for FINISHED_GOODS products with complex BOM

**Steps**:
1. Navigate to Planning → Work Orders
2. Click "Create Work Order"
3. Select product: "FG-001" (Premium Sausage)
4. Fill in work order details:
   - WO Number: "WO-002"
   - Quantity: "50"
   - Priority: "Normal"
   - KPI Scope: "FG"
   - Planned Start: "2024-01-16 09:00"
   - Planned End: "2024-01-16 17:00"
5. Click "Create"

**Expected Results**:
- Work order created successfully
- Complex BOM snapshot created
- All material requirements calculated
- Production line assignments verified

### Test Case 3: Material Requirement Calculation
**Objective**: Verify accurate material requirement calculation

**Steps**:
1. Create work order for product with BOM
2. Review material requirements:
   - Check quantities match BOM
   - Verify scrap percentage application
   - Check one-to-one LP consumption
   - Validate UoM conversions
3. Test edge cases:
   - Zero quantity
   - Very large quantities
   - Decimal quantities

**Expected Results**:
- Material requirements accurate
- Scrap percentages applied correctly
- One-to-one LP logic working
- UoM conversions correct
- Edge cases handled properly

### Test Case 4: Material Reservation
**Objective**: Verify material reservation functionality

**Steps**:
1. Create work order with material requirements
2. Check material availability
3. Reserve materials:
   - Reserve available materials
   - Handle insufficient materials
   - Check reservation conflicts
4. Verify reservation status

**Expected Results**:
- Materials reserved successfully
- Insufficient material warnings shown
- Reservation conflicts handled
- Reservation status accurate

### Test Case 5: Work Order Status Transitions
**Objective**: Verify work order status management

**Steps**:
1. Create work order (status: "planned")
2. Test status transitions:
   - Planned → Released
   - Released → In Progress
   - In Progress → Completed
   - Any status → Cancelled
3. Verify status restrictions
4. Check status change audit trail

**Expected Results**:
- Status transitions work correctly
- Invalid transitions blocked
- Audit trail maintained
- Status changes logged

### Test Case 6: Scheduling and Capacity Planning
**Objective**: Verify production scheduling functionality

**Steps**:
1. Create multiple work orders
2. Test scheduling:
   - Auto-schedule based on capacity
   - Manual schedule adjustment
   - Conflict detection
   - Resource optimization
3. Verify capacity constraints
4. Test schedule optimization

**Expected Results**:
- Scheduling works correctly
- Capacity constraints enforced
- Conflicts detected and resolved
- Optimization algorithms functional

### Test Case 7: Work Order Editing
**Objective**: Verify work order modification functionality

**Steps**:
1. Create work order
2. Edit work order:
   - Change quantity
   - Modify schedule
   - Update priority
   - Change KPI scope
3. Verify BOM snapshot handling
4. Test edit restrictions

**Expected Results**:
- Work order updated successfully
- BOM snapshot handling correct
- Edit restrictions enforced
- Changes saved properly

### Test Case 8: Work Order Cancellation
**Objective**: Verify work order cancellation functionality

**Steps**:
1. Create work order with reservations
2. Cancel work order
3. Verify:
   - Material reservations released
   - Status changed to cancelled
   - Audit trail maintained
   - Cleanup performed

**Expected Results**:
- Work order cancelled successfully
- Reservations released
- Status updated correctly
- Cleanup performed
- Audit trail maintained

### Test Case 9: Multi-Line Work Orders
**Objective**: Verify work orders spanning multiple production lines

**Steps**:
1. Create work order for product with multiple production lines
2. Test line assignments:
   - Assign to specific lines
   - Distribute across lines
   - Handle line capacity
3. Verify line-specific requirements
4. Test line coordination

**Expected Results**:
- Multi-line work orders supported
- Line assignments correct
- Capacity constraints enforced
- Line coordination functional

### Test Case 10: Priority Management
**Objective**: Verify work order priority handling

**Steps**:
1. Create work orders with different priorities
2. Test priority-based scheduling:
   - High priority work orders scheduled first
   - Priority conflicts resolved
   - Resource allocation based on priority
3. Verify priority change impact
4. Test priority escalation

**Expected Results**:
- Priority-based scheduling works
- Conflicts resolved appropriately
- Resource allocation correct
- Priority changes effective

## Automated Test Cases

### Unit Tests

#### Test: Work Order Creation
```typescript
describe('Work Order Creation', () => {
  test('should create work order with valid data', async () => {
    const workOrderData = {
      wo_number: 'WO-001',
      product_id: 1,
      quantity_planned: 100,
      priority: 'high',
      kpi_scope: 'PR'
    };
    const result = await WorkOrdersAPI.create(workOrderData);
    expect(result.id).toBeDefined();
    expect(result.status).toBe('planned');
  });

  test('should validate required fields', () => {
    const workOrderData = {
      wo_number: '',
      product_id: null,
      quantity_planned: 0
    };
    const errors = validateWorkOrder(workOrderData);
    expect(errors.wo_number).toBeDefined();
    expect(errors.product_id).toBeDefined();
    expect(errors.quantity_planned).toBeDefined();
  });
});
```

#### Test: Material Requirement Calculation
```typescript
describe('Material Requirement Calculation', () => {
  test('should calculate material requirements correctly', () => {
    const bom = {
      items: [
        { material_id: 1, quantity: 1.0, scrap_std_pct: 5.0 },
        { material_id: 2, quantity: 0.5, scrap_std_pct: 0.0 }
      ]
    };
    const woQuantity = 100;
    const requirements = calculateMaterialRequirements(bom, woQuantity);
    
    expect(requirements[0].quantity_required).toBe(105.0); // 1.0 * 100 * 1.05
    expect(requirements[1].quantity_required).toBe(50.0); // 0.5 * 100 * 1.0
  });

  test('should handle one-to-one LP consumption', () => {
    const bom = {
      items: [
        { material_id: 1, quantity: 0.5, one_to_one: true }
      ]
    };
    const woQuantity = 100;
    const requirements = calculateMaterialRequirements(bom, woQuantity);
    
    expect(requirements[0].one_to_one).toBe(true);
    expect(requirements[0].quantity_required).toBe(0.5); // Not multiplied by WO quantity
  });
});
```

#### Test: Material Reservation
```typescript
describe('Material Reservation', () => {
  test('should reserve materials successfully', async () => {
    const reservationData = {
      wo_id: 1,
      material_id: 1,
      quantity: 100.0,
      lp_id: 1
    };
    const result = await MaterialReservationAPI.create(reservationData);
    expect(result.id).toBeDefined();
    expect(result.status).toBe('active');
  });

  test('should handle insufficient materials', async () => {
    const reservationData = {
      wo_id: 1,
      material_id: 1,
      quantity: 1000.0, // More than available
      lp_id: 1
    };
    await expect(MaterialReservationAPI.create(reservationData))
      .rejects.toThrow('Insufficient material available');
  });
});
```

#### Test: Status Transitions
```typescript
describe('Work Order Status Transitions', () => {
  test('should transition from planned to released', async () => {
    const workOrder = await WorkOrdersAPI.create(validWorkOrderData);
    const result = await WorkOrdersAPI.updateStatus(workOrder.id, 'released');
    expect(result.status).toBe('released');
  });

  test('should prevent invalid transitions', async () => {
    const workOrder = await WorkOrdersAPI.create(validWorkOrderData);
    await expect(WorkOrdersAPI.updateStatus(workOrder.id, 'completed'))
      .rejects.toThrow('Invalid status transition');
  });
});
```

### Integration Tests

#### Test: BOM Snapshot Creation
```typescript
describe('BOM Snapshot Integration', () => {
  test('should create BOM snapshot on work order creation', async () => {
    const workOrderData = {
      product_id: 1, // Product with BOM
      quantity_planned: 100
    };
    const workOrder = await WorkOrdersAPI.create(workOrderData);
    
    const bomSnapshot = await WorkOrdersAPI.getBomSnapshot(workOrder.id);
    expect(bomSnapshot.length).toBeGreaterThan(0);
    expect(bomSnapshot[0].wo_id).toBe(workOrder.id);
  });
});
```

#### Test: Material Availability Check
```typescript
describe('Material Availability Integration', () => {
  test('should check material availability before reservation', async () => {
    const workOrderData = {
      product_id: 1,
      quantity_planned: 100
    };
    const availability = await MaterialAvailabilityAPI.check(workOrderData);
    expect(availability.available).toBeDefined();
    expect(availability.shortages).toBeDefined();
  });
});
```

## Performance Tests

### Test: Large Work Order Creation
**Objective**: Verify performance with large work orders

**Steps**:
1. Create work order with 1000+ material requirements
2. Measure creation time
3. Test BOM snapshot performance
4. Verify memory usage

**Expected Results**:
- Creation time < 5 seconds
- BOM snapshot < 2 seconds
- Memory usage acceptable
- No performance degradation

### Test: Concurrent Work Order Creation
**Objective**: Verify performance with multiple concurrent work orders

**Steps**:
1. Simulate 20 concurrent work order creations
2. Test database performance
3. Verify data consistency
4. Monitor resource usage

**Expected Results**:
- No deadlocks
- Data consistency maintained
- Acceptable response times
- No resource exhaustion

## Security Tests

### Test: Role-Based Access Control
**Objective**: Verify proper access control for planning functions

**Steps**:
1. Test with different user roles:
   - Planner: Full access
   - Production: Limited access
   - Viewer: Read-only access
2. Verify permission enforcement
3. Test unauthorized access attempts

**Expected Results**:
- Proper access control enforced
- Unauthorized access blocked
- Role-based restrictions working
- Audit trail maintained

### Test: Data Validation
**Objective**: Verify input validation and sanitization

**Steps**:
1. Test malicious input:
   - SQL injection attempts
   - XSS attacks
   - Invalid data types
2. Verify input sanitization
3. Test error handling

**Expected Results**:
- Malicious input blocked
- Input sanitized properly
- Error handling secure
- No security vulnerabilities

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

### Test: Material Shortage Handling
**Objective**: Verify handling of material shortages

**Steps**:
1. Create work order with insufficient materials
2. Test shortage warnings
3. Verify alternative material suggestions
4. Test shortage resolution

**Expected Results**:
- Shortage warnings displayed
- Alternative suggestions provided
- Resolution procedures functional
- User experience acceptable

## Test Data Management

### Test Data Setup
```sql
-- Sample work orders for testing
INSERT INTO work_orders (wo_number, product_id, quantity_planned, status, priority) VALUES
('WO-001', 1, 100, 'planned', 'high'),
('WO-002', 2, 50, 'released', 'normal'),
('WO-003', 3, 200, 'in_progress', 'low');

-- Sample material reservations
INSERT INTO lp_reservations (lp_id, wo_id, quantity, status) VALUES
(1, 1, 100.0, 'active'),
(2, 2, 50.0, 'active'),
(3, 3, 200.0, 'active');
```

### Test Data Cleanup
```sql
-- Cleanup after tests
DELETE FROM lp_reservations WHERE wo_id IN (1, 2, 3);
DELETE FROM wo_materials WHERE wo_id IN (1, 2, 3);
DELETE FROM work_orders WHERE id IN (1, 2, 3);
```

## Test Execution Schedule

### Phase 1: Unit Tests (Day 1)
- Work order creation tests
- Material calculation tests
- Status transition tests
- Validation tests

### Phase 2: Integration Tests (Day 2)
- BOM snapshot tests
- Material reservation tests
- Availability check tests
- API endpoint tests

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
- Input validation testing
- Authentication testing
- Authorization testing

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

This comprehensive test plan ensures thorough testing of the Planning module, covering all functional requirements, integration points, and performance considerations. The combination of manual and automated testing provides confidence in the system's reliability and performance.
