# Production Module Test Plan

## Overview
This document outlines comprehensive testing procedures for the Production module, covering work order execution, material consumption, production tracking, scanner operations, and integration with Planning and Warehouse modules.

## Test Environment Setup

### Prerequisites
- Planning module fully functional
- Work orders created and released
- Material reservations in place
- Scanner terminals configured
- Production lines operational

### Test Data Requirements
- Released work orders with material requirements
- Material inventory with LP data
- Production line capacity data
- Scanner terminal configurations
- User roles and permissions

## Functional Test Cases

### Test Case 1: Start Work Order
**Objective**: Verify work order start functionality

**Steps**:
1. Navigate to Production → Work Orders
2. Select released work order
3. Click "Start Work Order"
4. Verify:
   - Status changed to "in_progress"
   - Start time recorded
   - Material reservations activated
   - Production line assigned

**Expected Results**:
- Work order started successfully
- Status updated to "in_progress"
- Start time recorded accurately
- Material reservations active
- Production line assigned

**Test Data**:
```json
{
  "wo_id": 1,
  "status": "in_progress",
  "actual_start": "2024-01-15T08:00:00Z",
  "production_line": "Line 1"
}
```

### Test Case 2: Consume RM Materials (Standard Quantity)
**Objective**: Verify standard material consumption

**Steps**:
1. Start work order with RM materials
2. Navigate to Scanner → Process
3. Scan material LP
4. Enter consumption quantity
5. Record consumption
6. Verify:
   - Material consumed correctly
   - LP quantity updated
   - Stock move recorded
   - Consumption tracked

**Expected Results**:
- Material consumed successfully
- LP quantity reduced by consumed amount
- Stock move recorded accurately
- Consumption tracked properly

### Test Case 3: Consume RM Materials (One-to-One LP Mode)
**Objective**: Verify one-to-one LP consumption

**Steps**:
1. Start work order with 1:1 LP materials
2. Navigate to Scanner → Process
3. Scan material LP
4. Record consumption (should consume entire LP)
5. Verify:
   - Entire LP consumed
   - LP status changed to consumed
   - Stock move recorded
   - Consumption tracked

**Expected Results**:
- Entire LP consumed regardless of quantity
- LP status updated to consumed
- Stock move recorded correctly
- One-to-one logic working

### Test Case 4: Consume PR Materials
**Objective**: Verify PR material consumption

**Steps**:
1. Start work order with PR materials
2. Navigate to Scanner → Process
3. Scan PR material LP
4. Record consumption
5. Verify:
   - PR material consumed
   - LP composition tracked
   - Parent-child relationships maintained
   - Traceability preserved

**Expected Results**:
- PR material consumed successfully
- LP composition tracked correctly
- Parent-child relationships maintained
- Traceability preserved

### Test Case 5: Record Production Output
**Objective**: Verify production output recording

**Steps**:
1. Complete material consumption
2. Navigate to Scanner → Pack
3. Record production output:
   - Output quantity
   - Quality parameters
   - Production line
   - Operator information
4. Create output LP
5. Verify:
   - Output LP created
   - Quantity recorded
   - Quality data saved
   - Production tracked

**Expected Results**:
- Production output recorded successfully
- Output LP created correctly
- Quantity and quality data saved
- Production tracked accurately

### Test Case 6: Stage-based LP Creation
**Objective**: Verify stage-based LP creation (S1, S2, etc.)

**Steps**:
1. Start work order with multiple stages
2. Complete Stage 1:
   - Consume materials
   - Create S1 LP
   - Record stage completion
3. Complete Stage 2:
   - Use S1 LP as input
   - Create S2 LP
   - Record stage completion
4. Verify:
   - Stage LPs created correctly
   - Parent-child relationships maintained
   - Stage progression tracked
   - Traceability preserved

**Expected Results**:
- Stage LPs created successfully
- Parent-child relationships maintained
- Stage progression tracked correctly
- Traceability preserved

### Test Case 7: Insufficient Material Warning
**Objective**: Verify insufficient material handling

**Steps**:
1. Start work order with insufficient materials
2. Attempt to consume materials
3. Verify:
   - Warning message displayed
   - Consumption blocked
   - Alternative suggestions provided
   - Material availability checked

**Expected Results**:
- Warning message displayed clearly
- Consumption blocked appropriately
- Alternative suggestions provided
- Material availability checked

### Test Case 8: Scrap Recording
**Objective**: Verify scrap recording functionality

**Steps**:
1. Start work order
2. Record material consumption
3. Record scrap:
   - Scrap quantity
   - Scrap reason
   - Scrap category
4. Verify:
   - Scrap recorded correctly
   - Scrap reasons tracked
   - Scrap impact on yield
   - Scrap reporting

**Expected Results**:
- Scrap recorded successfully
- Scrap reasons tracked
- Scrap impact on yield calculated
- Scrap reporting functional

### Test Case 9: Yield Calculation
**Objective**: Verify yield calculation functionality

**Steps**:
1. Start work order
2. Record material consumption
3. Record production output
4. Record scrap
5. Verify yield calculation:
   - Standard yield calculation
   - Scrap-adjusted yield
   - Yield reporting
   - Yield trends

**Expected Results**:
- Yield calculated correctly
- Scrap-adjusted yield accurate
- Yield reporting functional
- Yield trends tracked

### Test Case 10: Complete Work Order
**Objective**: Verify work order completion

**Steps**:
1. Complete all production activities
2. Navigate to Production → Work Orders
3. Click "Complete Work Order"
4. Verify:
   - Status changed to "completed"
   - End time recorded
   - Final yield calculated
   - Production summary generated

**Expected Results**:
- Work order completed successfully
- Status updated to "completed"
- End time recorded accurately
- Final yield calculated
- Production summary generated

### Test Case 11: Traceability (Forward/Backward)
**Objective**: Verify traceability functionality

**Steps**:
1. Complete work order with traceability
2. Test forward traceability:
   - Find all products made from specific material
   - Track material through production
   - Verify LP composition
3. Test backward traceability:
   - Find all materials used in specific product
   - Track product back to materials
   - Verify material sources

**Expected Results**:
- Forward traceability functional
- Backward traceability functional
- LP composition tracked correctly
- Material sources verified

### Test Case 12: Production KPIs
**Objective**: Verify production KPI tracking

**Steps**:
1. Complete multiple work orders
2. Verify KPI calculations:
   - Production efficiency
   - Material utilization
   - Yield rates
   - Cycle times
3. Test KPI reporting
4. Verify KPI trends

**Expected Results**:
- KPI calculations accurate
- KPI reporting functional
- KPI trends tracked
- Performance metrics available

### Test Case 13: Scanner Terminal Operations
**Objective**: Verify scanner terminal functionality

**Steps**:
1. Test pack terminal:
   - LP scanning
   - Material consumption
   - Production output
   - Quality recording
2. Test process terminal:
   - Material processing
   - Stage-based operations
   - Quality control
   - Data recording

**Expected Results**:
- Pack terminal functional
- Process terminal functional
- LP scanning accurate
- Data recording correct

### Test Case 14: Offline Mode Sync
**Objective**: Verify offline mode synchronization

**Steps**:
1. Test offline mode:
   - Disconnect from network
   - Perform production operations
   - Record data locally
2. Test sync when online:
   - Reconnect to network
   - Sync offline data
   - Verify data integrity
   - Handle conflicts

**Expected Results**:
- Offline mode functional
- Data recorded locally
- Sync when online works
- Data integrity maintained
- Conflicts handled properly

## Automated Test Cases

### Unit Tests

#### Test: Work Order Execution
```typescript
describe('Work Order Execution', () => {
  test('should start work order successfully', async () => {
    const workOrder = await WorkOrdersAPI.getById(1);
    const result = await ProductionAPI.startWorkOrder(workOrder.id);
    expect(result.status).toBe('in_progress');
    expect(result.actual_start).toBeDefined();
  });

  test('should complete work order successfully', async () => {
    const workOrder = await WorkOrdersAPI.getById(1);
    const result = await ProductionAPI.completeWorkOrder(workOrder.id);
    expect(result.status).toBe('completed');
    expect(result.actual_end).toBeDefined();
  });
});
```

#### Test: Material Consumption
```typescript
describe('Material Consumption', () => {
  test('should consume materials with standard quantity', async () => {
    const consumptionData = {
      wo_id: 1,
      lp_id: 1,
      quantity: 50.0,
      material_id: 1
    };
    const result = await ProductionAPI.consumeMaterial(consumptionData);
    expect(result.id).toBeDefined();
    expect(result.quantity).toBe(50.0);
  });

  test('should consume entire LP for one-to-one materials', async () => {
    const consumptionData = {
      wo_id: 1,
      lp_id: 1,
      quantity: 100.0, // Will be overridden by one-to-one logic
      material_id: 1,
      one_to_one: true
    };
    const result = await ProductionAPI.consumeMaterial(consumptionData);
    expect(result.quantity).toBe(100.0); // Entire LP consumed
  });
});
```

#### Test: Production Output
```typescript
describe('Production Output', () => {
  test('should record production output', async () => {
    const outputData = {
      wo_id: 1,
      product_id: 1,
      quantity: 100.0,
      quality_params: {
        weight: 1.0,
        temperature: 20.0
      }
    };
    const result = await ProductionAPI.recordOutput(outputData);
    expect(result.id).toBeDefined();
    expect(result.quantity).toBe(100.0);
  });
});
```

#### Test: Yield Calculation
```typescript
describe('Yield Calculation', () => {
  test('should calculate yield correctly', () => {
    const productionData = {
      planned_quantity: 100,
      actual_quantity: 95,
      scrap_quantity: 5
    };
    const yield = calculateYield(productionData);
    expect(yield.standard_yield).toBe(95.0);
    expect(yield.scrap_rate).toBe(5.0);
  });
});
```

### Integration Tests

#### Test: Scanner Integration
```typescript
describe('Scanner Integration', () => {
  test('should scan LP and consume material', async () => {
    const scanData = {
      lp_number: 'LP-001',
      wo_id: 1,
      operation: 'consume'
    };
    const result = await ScannerAPI.scanLP(scanData);
    expect(result.success).toBe(true);
    expect(result.material_consumed).toBeDefined();
  });
});
```

#### Test: Traceability Integration
```typescript
describe('Traceability Integration', () => {
  test('should track material through production', async () => {
    const materialId = 1;
    const traceability = await TraceabilityAPI.getForwardTraceability(materialId);
    expect(traceability.products.length).toBeGreaterThan(0);
  });
});
```

## Performance Tests

### Test: High-Volume Production
**Objective**: Verify performance with high-volume production

**Steps**:
1. Create work order for 10,000 units
2. Test material consumption performance
3. Test production output recording
4. Verify database performance

**Expected Results**:
- Consumption time < 10 seconds
- Output recording < 5 seconds
- Database performance acceptable
- No memory leaks

### Test: Concurrent Production
**Objective**: Verify performance with concurrent production

**Steps**:
1. Simulate 10 concurrent work orders
2. Test material consumption
3. Test production output
4. Verify data consistency

**Expected Results**:
- No deadlocks
- Data consistency maintained
- Acceptable response times
- No performance degradation

## Security Tests

### Test: Scanner Terminal Security
**Objective**: Verify scanner terminal security

**Steps**:
1. Test unauthorized access
2. Test data validation
3. Test input sanitization
4. Verify audit logging

**Expected Results**:
- Unauthorized access blocked
- Data validation enforced
- Input sanitized properly
- Audit logging functional

### Test: Production Data Security
**Objective**: Verify production data security

**Steps**:
1. Test data encryption
2. Test access control
3. Test data integrity
4. Verify backup procedures

**Expected Results**:
- Data encrypted properly
- Access control enforced
- Data integrity maintained
- Backup procedures functional

## Error Handling Tests

### Test: Scanner Terminal Errors
**Objective**: Verify scanner terminal error handling

**Steps**:
1. Test network disconnection
2. Test invalid LP scanning
3. Test data validation errors
4. Test recovery procedures

**Expected Results**:
- Network errors handled gracefully
- Invalid scans rejected
- Data validation enforced
- Recovery procedures functional

### Test: Production Errors
**Objective**: Verify production error handling

**Steps**:
1. Test material shortage errors
2. Test quality control errors
3. Test equipment failures
4. Test error recovery

**Expected Results**:
- Material shortage handled
- Quality control enforced
- Equipment failures managed
- Error recovery functional

## Test Data Management

### Test Data Setup
```sql
-- Sample work orders for testing
INSERT INTO work_orders (wo_number, product_id, quantity_planned, status) VALUES
('WO-001', 1, 100, 'released'),
('WO-002', 2, 50, 'in_progress'),
('WO-003', 3, 200, 'completed');

-- Sample material LPs for testing
INSERT INTO license_plates (lp_number, product_id, quantity, status) VALUES
('LP-001', 1, 100.0, 'active'),
('LP-002', 2, 50.0, 'active'),
('LP-003', 3, 200.0, 'consumed');
```

### Test Data Cleanup
```sql
-- Cleanup after tests
DELETE FROM stock_moves WHERE wo_id IN (1, 2, 3);
DELETE FROM lp_compositions WHERE parent_lp_id IN (1, 2, 3);
DELETE FROM license_plates WHERE id IN (1, 2, 3);
DELETE FROM work_orders WHERE id IN (1, 2, 3);
```

## Test Execution Schedule

### Phase 1: Unit Tests (Day 1)
- Work order execution tests
- Material consumption tests
- Production output tests
- Yield calculation tests

### Phase 2: Integration Tests (Day 2)
- Scanner integration tests
- Traceability tests
- KPI calculation tests
- Offline sync tests

### Phase 3: Functional Tests (Day 3-4)
- Manual test case execution
- Scanner terminal testing
- Production workflow testing
- Error handling testing

### Phase 4: Performance Tests (Day 5)
- Load testing
- Stress testing
- Memory usage testing
- Database performance testing

### Phase 5: Security Tests (Day 6)
- Scanner security testing
- Data security testing
- Access control testing
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

This comprehensive test plan ensures thorough testing of the Production module, covering all functional requirements, scanner operations, and integration points. The combination of manual and automated testing provides confidence in the system's reliability and performance.
