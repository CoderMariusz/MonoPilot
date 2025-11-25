# Planning Module - Manual Test Instructions

**Last Updated**: 2025-01-22  
**Version**: 1.0  
**Scope**: Transfer Orders (TO), Purchase Orders (PO), Work Orders (WO)

---

## Overview

This document provides manual test instructions for the Planning Module based on the implementation completed in Phase 1-3. Each test scenario is designed to verify the functionality of newly implemented features.

---

## Test Environment Setup

### Prerequisites
- Access to the MonoPilot MES application
- Valid user credentials with Planning module access
- Test data: at least 2 warehouses, 1 supplier, 1 product, 1 BOM

### Test Data Requirements
- **Warehouses**: At least 2 warehouses (e.g., "Main Warehouse", "Secondary Warehouse")
- **Suppliers**: At least 1 supplier (e.g., "Test Supplier")
- **Products**: At least 1 product with an active BOM
- **BOM**: At least 1 active BOM for the test product

---

## Phase 1: Transfer Orders (TO) - Shipping & Receiving Workflow

### Test 1.1: Create Transfer Order with Planned Dates

**Objective**: Verify that a Transfer Order can be created with planned ship and receive dates.

**Steps**:
1. Navigate to `/planning` page
2. Click "Create Transfer Order" button
3. Fill in the form:
   - From Warehouse: Select "Main Warehouse"
   - To Warehouse: Select "Secondary Warehouse"
   - Planned Ship Date: Select a future date (e.g., tomorrow)
   - Planned Receive Date: Select a date after ship date (e.g., day after tomorrow)
   - Add at least one line item with product and quantity
4. Click "Create Transfer Order"

**Expected Results**:
- Transfer Order is created successfully
- Status is "draft"
- Planned Ship Date is saved correctly
- Planned Receive Date is saved correctly
- Planned Receive Date is after Planned Ship Date

**Validation**:
- Check Transfer Orders table - verify dates are displayed in "Planned Ship" and "Planned Receive" columns
- Open Transfer Order details - verify dates are shown in "Shipping & Receiving" section

---

### Test 1.2: Validate Planned Receive Date Cannot Be Before Ship Date

**Objective**: Verify that validation prevents planned_receive_date from being earlier than planned_ship_date.

**Steps**:
1. Create a new Transfer Order (or edit existing draft)
2. Set Planned Ship Date: Tomorrow
3. Set Planned Receive Date: Today (before ship date)
4. Try to save

**Expected Results**:
- Validation error message appears
- Transfer Order is not saved
- Error message: "Planned receive date must be after planned ship date"

**Validation**:
- Form validation prevents submission
- Date picker for receive date may be disabled or show min date = ship date

---

### Test 1.3: Mark Transfer Order as Shipped

**Objective**: Verify that a Transfer Order can be marked as shipped and status transitions correctly.

**Prerequisites**:
- Transfer Order with status "submitted"

**Steps**:
1. Navigate to Transfer Orders table
2. Find a Transfer Order with status "submitted"
3. Click to open Transfer Order details modal
4. Verify "Mark as Shipped" button is visible
5. Click "Mark as Shipped" button
6. Confirm the action if prompted

**Expected Results**:
- Status changes from "submitted" to "in_transit"
- Actual Ship Date is set to current date/time
- Actual Ship Date is displayed in green/bold in details modal
- "Mark as Shipped" button is no longer visible
- "Mark as Received" button becomes visible

**Validation**:
- Check Transfer Orders table - "Actual Ship" column shows the date
- Check Transfer Order details - "Actual Ship Date" is displayed in green

---

### Test 1.4: Mark Transfer Order as Received

**Objective**: Verify that a Transfer Order can be marked as received and status transitions correctly.

**Prerequisites**:
- Transfer Order with status "in_transit"

**Steps**:
1. Navigate to Transfer Orders table
2. Find a Transfer Order with status "in_transit"
3. Click to open Transfer Order details modal
4. Verify "Mark as Received" button is visible
5. Click "Mark as Received" button
6. Confirm the action if prompted

**Expected Results**:
- Status changes from "in_transit" to "received"
- Actual Receive Date is set to current date/time
- Actual Receive Date is displayed in green/bold in details modal
- "Mark as Received" button is no longer visible

**Validation**:
- Check Transfer Orders table - "Actual Receive" column shows the date
- Check Transfer Order details - "Actual Receive Date" is displayed in green

---

### Test 1.5: Edit Transfer Order Dates (Draft Status)

**Objective**: Verify that planned dates can be edited when Transfer Order is in draft status.

**Prerequisites**:
- Transfer Order with status "draft"

**Steps**:
1. Open Edit Transfer Order modal
2. Change Planned Ship Date to a new date
3. Change Planned Receive Date to a date after the new ship date
4. Save changes

**Expected Results**:
- Changes are saved successfully
- New dates are displayed in the table
- Dates can be edited freely when status is "draft"

---

### Test 1.6: Verify Dates Cannot Be Edited After Submission

**Objective**: Verify that planned dates cannot be edited after Transfer Order is submitted.

**Prerequisites**:
- Transfer Order with status "submitted" or later

**Steps**:
1. Open Edit Transfer Order modal for a submitted Transfer Order
2. Try to change Planned Ship Date or Planned Receive Date

**Expected Results**:
- Date fields are disabled
- Tooltip or help text indicates dates cannot be edited after submission
- Save button may be disabled or save fails with validation error

---

### Test 1.7: View License Plate and Batch in Transfer Order Details

**Objective**: Verify that LP ID and Batch fields are displayed in Transfer Order line items.

**Steps**:
1. Open a Transfer Order details modal
2. Navigate to "Transfer Items" section
3. Check the table columns

**Expected Results**:
- Table includes "License Plate" column
- Table includes "Batch" column
- Columns may be empty if not set (NULL values)

**Validation**:
- Verify columns are visible even if data is NULL
- Verify data is displayed correctly if LP ID or Batch is set

---

## Phase 2: Purchase Orders (PO) - Payment Terms & Currency

### Test 2.1: Create Purchase Order with Currency and Payment Due Date

**Objective**: Verify that a Purchase Order can be created with currency and payment due date.

**Steps**:
1. Navigate to `/planning` page
2. Click "Create Purchase Order" button
3. Fill in the form:
   - Supplier: Select a supplier
   - Currency: Select "EUR" (or another non-USD currency)
   - Exchange Rate: Enter a value (e.g., 1.1)
   - Payment Due Date: Select a future date (e.g., 30 days from today)
   - Add at least one line item with product, quantity, and unit price
4. Click "Create Purchase Order"

**Expected Results**:
- Purchase Order is created successfully
- Currency is saved as "EUR"
- Exchange Rate is saved correctly
- Payment Due Date is saved correctly
- Exchange Rate field is visible when currency is not USD

**Validation**:
- Check Purchase Orders table - verify "Currency", "Payment Due", and "Total Amount" columns
- Open Purchase Order details - verify "Financial Information" section shows all fields

---

### Test 2.2: Verify Default Currency (USD)

**Objective**: Verify that default currency is USD with exchange rate 1.0.

**Steps**:
1. Create a new Purchase Order
2. Leave Currency field as default (USD)
3. Verify Exchange Rate field is not visible (or shows 1.0)

**Expected Results**:
- Currency defaults to "USD"
- Exchange Rate field is hidden when currency is USD (or shows 1.0)
- Total Amount is calculated correctly

---

### Test 2.3: Verify Total Amount Calculation

**Objective**: Verify that total amount is calculated correctly including VAT.

**Steps**:
1. Create a Purchase Order with:
   - Line Item 1: Quantity 100, Unit Price 10.00, VAT Rate 20%
   - Line Item 2: Quantity 50, Unit Price 5.00, VAT Rate 10%
2. Calculate expected total:
   - Line 1: 100 * 10 * 1.20 = 1200
   - Line 2: 50 * 5 * 1.10 = 275
   - Total: 1475
3. Save Purchase Order

**Expected Results**:
- Total Amount is calculated as 1475
- Total Amount is displayed in the table
- Total Amount is displayed in details modal with currency prefix

**Validation**:
- Check Purchase Orders table - "Total Amount" column shows correct value
- Check Purchase Order details - "Financial Information" section shows total amount

---

### Test 2.4: Edit Purchase Order Financial Fields

**Objective**: Verify that currency, exchange rate, and payment due date can be edited.

**Prerequisites**:
- Purchase Order with status "draft"

**Steps**:
1. Open Edit Purchase Order modal
2. Change Currency from USD to EUR
3. Enter Exchange Rate (e.g., 1.15)
4. Change Payment Due Date
5. Save changes

**Expected Results**:
- Changes are saved successfully
- New values are displayed in table and details modal
- Exchange Rate field becomes visible when currency changes

---

## Phase 3: Work Orders (WO) - Source Tracking & Execution Times

### Test 3.1: Create Work Order Manually

**Objective**: Verify that a Work Order can be created manually with source tracking.

**Steps**:
1. Navigate to `/production` or `/planning` page
2. Click "Create Work Order" button
3. Fill in the form:
   - Source: Select "Manual"
   - Product: Select a product with active BOM
   - Quantity: Enter a quantity
   - BOM: Verify active BOM is auto-selected
   - Scheduled Start: Select a future date
   - Scheduled End: Select a date after start
4. Click "Create Work Order"

**Expected Results**:
- Work Order is created successfully
- Source is "Manual"
- Source Demand ID is NULL or empty
- BOM is automatically selected (active BOM preferred)
- Scheduled dates are saved

**Validation**:
- Check Work Orders table - "Source" column shows "Manual"
- Open Work Order details - "Source & BOM" section shows source as "Manual"

---

### Test 3.2: Create Work Order from Transfer Order

**Objective**: Verify that a Work Order can be created from a Transfer Order source.

**Prerequisites**:
- At least one Transfer Order with line items

**Steps**:
1. Click "Create Work Order" button
2. Fill in the form:
   - Source: Select "TO" (Transfer Order)
   - Source Demand: Select a Transfer Order from dropdown
   - Product: Verify product is auto-filled from TO
   - Quantity: Verify quantity is pre-filled from first TO line item
   - BOM: Verify BOM is auto-selected
3. Click "Create Work Order"

**Expected Results**:
- Work Order is created successfully
- Source is "TO-[TO_ID]" (e.g., "TO-5")
- Source Demand ID is set to selected Transfer Order ID
- Product and quantity are pre-filled correctly
- BOM is automatically selected

**Validation**:
- Check Work Orders table - "Source" column shows "TO-5" (or similar)
- Open Work Order details - "Source & BOM" section shows "TO #5"

---

### Test 3.3: Verify BOM Auto-Selection

**Objective**: Verify that BOM is automatically selected when product is chosen.

**Steps**:
1. Create a Work Order
2. Select a product
3. Observe BOM dropdown

**Expected Results**:
- BOM dropdown is populated with available BOMs for the product
- Active BOM is automatically selected (if exists)
- If no active BOM, latest draft BOM is selected
- Help text indicates auto-selection

**Validation**:
- Verify BOM dropdown shows BOM version and status (e.g., "BOM v2 (active)")
- Verify selected BOM is appropriate (active preferred)

---

### Test 3.4: Verify Actual Start/End Dates Display

**Objective**: Verify that actual start and end dates are displayed in the table.

**Prerequisites**:
- Work Orders with actual_start and actual_end set (may need to be set via API or database)

**Steps**:
1. Navigate to Work Orders table
2. Check "Actual Start" and "Actual End" columns

**Expected Results**:
- "Actual Start" column shows date if set, otherwise empty
- "Actual End" column shows date if set, otherwise empty
- Dates are displayed in readable format
- Dates with values are shown in bold/colored

**Validation**:
- Verify dates are formatted correctly
- Verify empty dates show as "-" or empty cell

---

### Test 3.5: View Work Order Execution Times

**Objective**: Verify that scheduled and actual execution times are displayed in details modal.

**Steps**:
1. Open a Work Order details modal
2. Navigate to "Execution Times" section

**Expected Results**:
- "Scheduled" shows: "Scheduled Start → Scheduled End" (or "Not scheduled")
- "Actual" shows: "Actual Start → Actual End" (or "Not started")
- Actual dates are displayed in blue/green if set
- Dates are formatted correctly

**Validation**:
- Verify scheduled dates are shown correctly
- Verify actual dates are shown correctly (if set)
- Verify formatting is consistent

---

### Test 3.6: View Work Order Source & BOM Information

**Objective**: Verify that source demand and BOM information are displayed correctly.

**Steps**:
1. Open a Work Order details modal
2. Navigate to "Source & BOM" section

**Expected Results**:
- Source shows: "Manual" or "TO-#ID" or "PO-#ID" or "SO-#ID"
- BOM Used shows: "BOM v2 (active)" or "Not specified"
- Created By shows: Username or "System"

**Validation**:
- Verify source is displayed correctly
- Verify BOM version and status are shown
- Verify created_by user is displayed (if available)

---

### Test 3.7: Verify Source Column in Work Orders Table

**Objective**: Verify that source column displays correctly in the table.

**Steps**:
1. Navigate to Work Orders table
2. Check "Source" column

**Expected Results**:
- Column shows "Manual" for manual work orders
- Column shows "TO-5" for Transfer Order source
- Column shows "PO-10" for Purchase Order source
- Column shows "SO-15" for Sales Order source

**Validation**:
- Verify source format is consistent
- Verify source is clickable or shows tooltip (if implemented)

---

## Cross-Module Integration Tests

### Test 4.1: Create WO from TO - End-to-End Flow

**Objective**: Verify complete workflow from Transfer Order to Work Order creation.

**Steps**:
1. Create a Transfer Order with status "submitted"
2. Navigate to Work Orders
3. Create Work Order with Source = "TO"
4. Select the Transfer Order created in step 1
5. Verify product and quantity are pre-filled
6. Complete Work Order creation

**Expected Results**:
- Work Order is created with correct source reference
- Product and quantity match Transfer Order
- Work Order can be viewed and verified

**Validation**:
- Check Work Order details - source shows correct TO reference
- Verify quantity matches TO line item

---

### Test 4.2: Verify Payment Due Date is Separate from Delivery Dates

**Objective**: Verify that payment_due_date is independent of delivery dates.

**Steps**:
1. Create a Purchase Order with:
   - Requested Delivery Date: Tomorrow
   - Promised Delivery Date: Day after tomorrow
   - Payment Due Date: 30 days from today
2. Save Purchase Order

**Expected Results**:
- All three dates are saved independently
- Payment Due Date can be different from delivery dates
- Dates are displayed correctly in table and details

**Validation**:
- Check Purchase Order details - all dates are shown separately
- Verify dates are not mixed up

---

## Error Handling Tests

### Test 5.1: Mark TO as Shipped from Wrong Status

**Objective**: Verify that markShipped() fails if TO is not in "submitted" status.

**Steps**:
1. Try to mark a TO as shipped when status is "draft"
2. Try to mark a TO as shipped when status is "in_transit"

**Expected Results**:
- Error message: "Transfer order must be in 'submitted' status to mark as shipped"
- Status does not change
- Actual Ship Date is not set

---

### Test 5.2: Mark TO as Received from Wrong Status

**Objective**: Verify that markReceived() fails if TO is not in "in_transit" status.

**Steps**:
1. Try to mark a TO as received when status is "submitted"
2. Try to mark a TO as received when status is "received"

**Expected Results**:
- Error message: "Transfer order must be in 'in_transit' status to mark as received"
- Status does not change
- Actual Receive Date is not set

---

### Test 5.3: Create PO with Invalid Exchange Rate

**Objective**: Verify that exchange rate validation works.

**Steps**:
1. Create a Purchase Order with currency "EUR"
2. Enter exchange rate as 0 or negative value
3. Try to save

**Expected Results**:
- Validation error prevents saving
- Error message indicates exchange rate must be positive

---

## Performance Tests

### Test 6.1: Load Transfer Orders Table with Many Records

**Objective**: Verify that table loads efficiently with many Transfer Orders.

**Steps**:
1. Create 50+ Transfer Orders (or use test data)
2. Navigate to Transfer Orders table
3. Verify loading time

**Expected Results**:
- Table loads within reasonable time (< 3 seconds)
- Sorting works correctly
- Pagination works if implemented

---

### Test 6.2: Load Purchase Orders Table with Currency Calculations

**Objective**: Verify that currency calculations don't slow down table rendering.

**Steps**:
1. Create 50+ Purchase Orders with various currencies
2. Navigate to Purchase Orders table
3. Verify loading time

**Expected Results**:
- Table loads within reasonable time
- Total amounts are calculated correctly
- Currency formatting is consistent

---

## Test Results Summary Template

### Test Execution Log

| Test ID | Test Name | Status | Notes | Date |
|---------|-----------|--------|-------|------|
| 1.1 | Create TO with Planned Dates | ⬜ | | |
| 1.2 | Validate Date Validation | ⬜ | | |
| 1.3 | Mark TO as Shipped | ⬜ | | |
| 1.4 | Mark TO as Received | ⬜ | | |
| ... | ... | ⬜ | | |

**Legend**:
- ✅ Pass
- ❌ Fail
- ⚠️ Pass with issues
- ⬜ Not tested

---

## Notes

- All dates should be tested with timezone considerations
- Currency formatting should be tested with different locales
- BOM selection should be tested with products that have multiple BOM versions
- Source tracking should be tested with all source types (Manual, TO, PO, SO)
- Error messages should be clear and user-friendly

---

## See Also

- [Planning Module Guide](../modules/planning/PLANNING_MODULE_GUIDE.md)
- [API Reference](../API_REFERENCE.md)
- [Database Schema](../DATABASE_SCHEMA.md)

