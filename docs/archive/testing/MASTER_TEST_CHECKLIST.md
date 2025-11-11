# Master Test Checklist

## Overview
This document provides a comprehensive checklist for testing the entire MonoPilot MES system, covering all modules and their integration points.

## Test Environment Setup

### Prerequisites
- [ ] Database with all migrations applied
- [ ] Test data seeded
- [ ] API endpoints accessible
- [ ] Frontend application running
- [ ] Scanner terminals configured
- [ ] Production lines operational

### Test Data Requirements
- [ ] Sample products for each category
- [ ] Complete BOMs with various component types
- [ ] Test users with appropriate roles
- [ ] Sample suppliers and materials
- [ ] Work orders in various states
- [ ] Material inventory data

### Database State Requirements (per module)

- Technical:
  - [ ] products contain valid taxonomy (product_group, product_type)
  - [ ] boms and bom_items exist for PR/FG products
  - [ ] routings and routing_operations exist for routed products
- Production:
  - [ ] work_orders exist across statuses (planned, released, in_progress, completed)
  - [ ] wo_operations sequences exist per routing
  - [ ] lp_reservations seeded for staging scenarios
- Planning:
  - [ ] purchase_orders with purchase_order_items exist
  - [ ] transfer_orders with transfer_order_items exist
  - [ ] suppliers and supplier_products seeded
- Warehouse:
  - [ ] grns with grn_items exist and link to POs
  - [ ] license_plates exist with valid locations and QA status
  - [ ] stock_moves exist for move types (TRANSFER, ISSUE, RECEIPT)

## BOM Module Testing

### Critical Bug Fixes
- [ ] **Test Case 1**: Checkbox Toggle Functionality
  - [ ] is_optional checkbox can be toggled on/off
  - [ ] is_phantom checkbox can be toggled on/off
  - [ ] one_to_one checkbox can be toggled on/off
  - [ ] All checkboxes maintain state correctly

- [ ] **Test Case 2**: Supplier Field Visibility
  - [ ] Supplier field hidden for PROCESS products
  - [ ] Supplier field hidden for FINISHED_GOODS products
  - [ ] Supplier field visible for MEAT products
  - [ ] Supplier field visible for DRYGOODS products

- [ ] **Test Case 3**: One-to-One LP Consumption
  - [ ] One-to-one field added to BOM components
  - [ ] Field functional in UI
  - [ ] Data saved correctly
  - [ ] Consumption logic working

### Product Creation Tests
- [ ] **Test Case 4**: Create MEAT Product
  - [ ] Product created successfully
  - [ ] All fields saved correctly
  - [ ] Supplier field required
  - [ ] Expiry policy working

- [ ] **Test Case 5**: Create DRYGOODS Product
  - [ ] Product created successfully
  - [ ] Subtype field functional
  - [ ] Supplier field required
  - [ ] All fields saved correctly

- [ ] **Test Case 6**: Create PROCESS Product with BOM
  - [ ] Product created successfully
  - [ ] BOM components saved correctly
  - [ ] Supplier field hidden
  - [ ] One-to-one LP checkbox functional

- [ ] **Test Case 7**: Create FINISHED_GOODS Product with Complex BOM
  - [ ] Product created successfully
  - [ ] Complex BOM saved correctly
  - [ ] Supplier field hidden
  - [ ] Production lines assigned
  - [ ] All component types handled

### BOM Component Tests
- [ ] **Test Case 8**: BOM Component Validation
  - [ ] Invalid combinations rejected
  - [ ] Appropriate error messages shown
  - [ ] Valid combinations accepted
  - [ ] All validation rules enforced

- [ ] **Test Case 9**: Allergen Inheritance
  - [ ] Allergens automatically inherited
  - [ ] Manual override functional
  - [ ] Allergen list accurate
  - [ ] UI shows allergen sources

- [ ] **Test Case 10**: Production Lines Integration
  - [ ] Production lines assigned correctly
  - [ ] Line restrictions enforced
  - [ ] BOM variations supported
  - [ ] Validation working properly

### Database Integration Tests
- [ ] **Test Case 11**: Database Endpoints
  - [ ] All product categories save to database
  - [ ] BOM components saved correctly
  - [ ] One-to-one field persisted
  - [ ] Data integrity maintained

- [ ] **Test Case 12**: API Functionality
  - [ ] ProductsAPI.create() working
  - [ ] ProductsAPI.update() working
  - [ ] BOM data handled correctly
  - [ ] Error handling functional

## Planning Module Testing

### Work Order Creation Tests
- [ ] **Test Case 13**: Create Work Order for PROCESS Product
  - [ ] Work order created successfully
  - [ ] BOM snapshot created
  - [ ] Material requirements calculated
  - [ ] Work order appears in list

- [ ] **Test Case 14**: Create Work Order for FINISHED_GOODS Product
  - [ ] Work order created successfully
  - [ ] Complex BOM snapshot created
  - [ ] All material requirements calculated
  - [ ] Production line assignments verified

### Material Planning Tests
- [ ] **Test Case 15**: Material Requirement Calculation
  - [ ] Material requirements accurate
  - [ ] Scrap percentages applied correctly
  - [ ] One-to-one LP logic working
  - [ ] UoM conversions correct

- [ ] **Test Case 16**: Material Reservation
  - [ ] Materials reserved successfully
  - [ ] Insufficient material warnings shown
  - [ ] Reservation conflicts handled
  - [ ] Reservation status accurate

### Work Order Management Tests
- [ ] **Test Case 17**: Work Order Status Transitions
  - [ ] Status transitions work correctly
  - [ ] Invalid transitions blocked
  - [ ] Audit trail maintained
  - [ ] Status changes logged

- [ ] **Test Case 18**: Work Order Editing
  - [ ] Work order updated successfully
  - [ ] BOM snapshot handling correct
  - [ ] Edit restrictions enforced
  - [ ] Changes saved properly

## Production Module Testing

### Work Order Execution Tests
- [ ] **Test Case 19**: Start Work Order
  - [ ] Work order started successfully
  - [ ] Status updated to "in_progress"
  - [ ] Start time recorded accurately
  - [ ] Material reservations active

- [ ] **Test Case 20**: Consume RM Materials (Standard Quantity)
  - [ ] Material consumed successfully
  - [ ] LP quantity reduced by consumed amount
  - [ ] Stock move recorded accurately
  - [ ] Consumption tracked properly

- [ ] **Test Case 21**: Consume RM Materials (One-to-One LP Mode)
  - [ ] Entire LP consumed regardless of quantity
  - [ ] LP status updated to consumed
  - [ ] Stock move recorded correctly
  - [ ] One-to-one logic working

### Production Output Tests
- [ ] **Test Case 22**: Record Production Output
  - [ ] Production output recorded successfully
  - [ ] Output LP created correctly
  - [ ] Quantity and quality data saved
  - [ ] Production tracked accurately

- [ ] **Test Case 23**: Stage-based LP Creation
  - [ ] Stage LPs created successfully
  - [ ] Parent-child relationships maintained
  - [ ] Stage progression tracked correctly
  - [ ] Traceability preserved

### Quality and Yield Tests
- [ ] **Test Case 24**: Scrap Recording
  - [ ] Scrap recorded successfully
  - [ ] Scrap reasons tracked
  - [ ] Scrap impact on yield calculated
  - [ ] Scrap reporting functional

- [ ] **Test Case 25**: Yield Calculation
  - [ ] Yield calculated correctly
  - [ ] Scrap-adjusted yield accurate
  - [ ] Yield reporting functional
  - [ ] Yield trends tracked

## Scanner Module Testing

### Scanner Terminal Tests
- [ ] **Test Case 26**: Pack Terminal Operations
  - [ ] LP scanning functional
  - [ ] Material consumption working
  - [ ] Production output recording
  - [ ] Quality recording functional

- [ ] **Test Case 27**: Process Terminal Operations
  - [ ] Material processing functional
  - [ ] Stage-based operations working
  - [ ] Quality control functional
  - [ ] Data recording correct

### Offline Mode Tests
- [ ] **Test Case 28**: Offline Mode Sync
  - [ ] Offline mode functional
  - [ ] Data recorded locally
  - [ ] Sync when online works
  - [ ] Data integrity maintained

## Integration Testing

### Cross-Module Integration
- [ ] **Test Case 29**: BOM → Planning Integration
  - [ ] BOM data used in work order creation
  - [ ] Material requirements calculated correctly
  - [ ] BOM snapshot created properly
  - [ ] Data consistency maintained

- [ ] **Test Case 30**: Planning → Production Integration
  - [ ] Work orders released to production
  - [ ] Material reservations activated
  - [ ] Production execution functional
  - [ ] Status updates propagated

- [ ] **Test Case 31**: Production → Warehouse Integration
  - [ ] Material consumption recorded
  - [ ] Production output created
  - [ ] LP management functional
  - [ ] Inventory updates accurate

### End-to-End Workflow Tests
- [ ] **Test Case 32**: Complete Production Workflow
  - [ ] Product creation → BOM definition
  - [ ] Work order creation → Material planning
  - [ ] Production execution → Material consumption
  - [ ] Output recording → LP creation
  - [ ] Quality tracking → Yield calculation

- [ ] **Test Case 33**: Traceability Workflow
  - [ ] Forward traceability functional
  - [ ] Backward traceability functional
  - [ ] LP composition tracked correctly
  - [ ] Material sources verified

## Performance Testing

### Load Testing
- [ ] **Test Case 34**: High-Volume Product Creation
  - [ ] Create 100+ products with BOMs
  - [ ] Performance acceptable
  - [ ] No memory leaks
  - [ ] Database performance good

- [ ] **Test Case 35**: Concurrent User Performance
  - [ ] 10+ concurrent users
  - [ ] No deadlocks
  - [ ] Acceptable response times
  - [ ] Data consistency maintained

### Stress Testing
- [ ] **Test Case 36**: Large BOM Performance
  - [ ] BOMs with 100+ components
  - [ ] Load time < 2 seconds
  - [ ] Edit performance acceptable
  - [ ] Save time < 5 seconds

- [ ] **Test Case 37**: High-Volume Production
  - [ ] Work orders with 10,000+ units
  - [ ] Material consumption < 10 seconds
  - [ ] Output recording < 5 seconds
  - [ ] Database performance acceptable

## Security Testing

### Access Control Tests
- [ ] **Test Case 38**: Role-Based Access Control
  - [ ] Technical module access control
  - [ ] Planning module access control
  - [ ] Production module access control
  - [ ] Scanner terminal access control

- [ ] **Test Case 39**: Data Security
  - [ ] Data encryption functional
  - [ ] Access control enforced
  - [ ] Data integrity maintained
  - [ ] Audit trail functional

### Input Validation Tests
- [ ] **Test Case 40**: Input Validation
  - [ ] Malicious input blocked
  - [ ] Input sanitized properly
  - [ ] Error handling secure
  - [ ] No security vulnerabilities

## Error Handling Testing

### Database Error Tests
- [ ] **Test Case 41**: Database Connection Errors
  - [ ] Connection loss handled gracefully
  - [ ] Error messages appropriate
  - [ ] Recovery procedures functional
  - [ ] Data consistency maintained

- [ ] **Test Case 42**: Validation Error Handling
  - [ ] Invalid data rejected
  - [ ] Error messages clear
  - [ ] Data integrity maintained
  - [ ] User experience acceptable

### Business Logic Error Tests
- [ ] **Test Case 43**: Material Shortage Handling
  - [ ] Shortage warnings displayed
  - [ ] Alternative suggestions provided
  - [ ] Resolution procedures functional
  - [ ] User experience acceptable

- [ ] **Test Case 44**: Production Error Handling
  - [ ] Equipment failures managed
  - [ ] Quality control enforced
  - [ ] Error recovery functional
  - [ ] Production continuity maintained

## Browser Compatibility Testing

### Browser Support Tests
- [ ] **Test Case 45**: Chrome Compatibility
  - [ ] All features functional
  - [ ] Performance acceptable
  - [ ] No rendering issues
  - [ ] Scanner integration working

- [ ] **Test Case 46**: Firefox Compatibility
  - [ ] All features functional
  - [ ] Performance acceptable
  - [ ] No rendering issues
  - [ ] Scanner integration working

- [ ] **Test Case 47**: Safari Compatibility
  - [ ] All features functional
  - [ ] Performance acceptable
  - [ ] No rendering issues
  - [ ] Scanner integration working

### Mobile Compatibility Tests
- [ ] **Test Case 48**: Mobile Device Support
  - [ ] Responsive design functional
  - [ ] Touch interactions working
  - [ ] Scanner integration functional
  - [ ] Performance acceptable

## Test Execution Schedule

### Phase 1: Critical Bug Fixes (Day 1)
- [ ] Checkbox toggle functionality
- [ ] Supplier field visibility
- [ ] One-to-one LP consumption
- [ ] Database endpoints

### Phase 2: BOM Module Testing (Day 2)
- [ ] Product creation tests
- [ ] BOM component tests
- [ ] Allergen inheritance tests
- [ ] Production line integration tests

### Phase 3: Planning Module Testing (Day 3)
- [ ] Work order creation tests
- [ ] Material planning tests
- [ ] Work order management tests
- [ ] Integration tests

### Phase 4: Production Module Testing (Day 4)
- [ ] Work order execution tests
- [ ] Production output tests
- [ ] Quality and yield tests
- [ ] Scanner terminal tests

### Phase 5: Integration Testing (Day 5)
- [ ] Cross-module integration tests
- [ ] End-to-end workflow tests
- [ ] Performance tests
- [ ] Security tests

### Phase 6: Final Validation (Day 6)
- [ ] Browser compatibility tests
- [ ] Mobile compatibility tests
- [ ] Error handling tests
- [ ] Final validation

## Test Results Documentation

### Test Results Template
```
Test Case: [Test Case Name]
Module: [BOM/Planning/Production/Scanner]
Status: [PASS/FAIL]
Execution Date: [Date]
Tester: [Name]
Notes: [Any additional notes]
Screenshots: [If applicable]
Defects Found: [List of defects]
```

### Defect Reporting Template
```
Defect ID: [Unique ID]
Title: [Brief description]
Module: [BOM/Planning/Production/Scanner]
Severity: [Critical/High/Medium/Low]
Priority: [P1/P2/P3/P4]
Steps to Reproduce: [Detailed steps]
Expected Result: [What should happen]
Actual Result: [What actually happened]
Environment: [Test environment details]
Screenshots: [If applicable]
```

## Success Criteria

### Critical Success Criteria
- [ ] All critical bugs fixed
- [ ] All product categories functional
- [ ] All BOM features working
- [ ] All work order operations functional
- [ ] All production operations working
- [ ] All scanner operations functional

### Performance Success Criteria
- [ ] Product creation < 2 seconds
- [ ] Work order creation < 3 seconds
- [ ] Material consumption < 5 seconds
- [ ] Production output < 3 seconds
- [ ] Database performance acceptable
- [ ] No memory leaks

### Quality Success Criteria
- [ ] All validations working
- [ ] Error handling functional
- [ ] Security measures in place
- [ ] Audit trail maintained
- [ ] Data integrity preserved
- [ ] User experience acceptable

## Conclusion

This master test checklist ensures comprehensive testing of the entire MonoPilot MES system. By following this checklist, we can verify that all modules are functioning correctly, all integrations are working, and the system meets all performance and quality requirements.

The checklist is organized by module and test type, making it easy to track progress and ensure complete coverage. Each test case includes specific steps and expected results, providing clear guidance for test execution.

Regular updates to this checklist will ensure it remains current with system changes and new requirements.
