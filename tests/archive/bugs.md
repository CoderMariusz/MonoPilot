# MonoPilot Warehouse Module - Active Bugs

**Last Updated**: February 9, 2026 18:10 GMT  
**Total Active Bugs**: 10  
**Status**: In Progress

---

## 🔴 CRITICAL BUGS (from earlier phases)

### BUG-SC-001
- **Severity**: CRITICAL
- **Title**: /scanner/transfer displays wrong page content
- **Module**: Scanner → Transfer
- **URL**: `/scanner/transfer`
- **Description**: Navigation to /scanner/transfer shows incorrect page content instead of the transfer interface
- **Steps to Reproduce**:
  1. Navigate to /scanner/transfer
  2. Observe page content
- **Expected**: Transfer interface for warehouse transfers
- **Actual**: Wrong page content displayed
- **Impact**: Transfer operations blocked
- **Status**: Open (Warehouse Batch 1 - confirmed)

---

## 🟠 HIGH SEVERITY BUGS

### BUG-003
- **Severity**: HIGH
- **Title**: Duplicate barcode validation not enforced
- **Module**: Warehouse → Product Management
- **Description**: System allows duplicate barcodes to be entered for different products, creating data integrity issues
- **Steps to Reproduce**:
  1. Create product with barcode ABC123
  2. Try to create second product with same barcode ABC123
  3. System accepts duplicate
- **Expected**: Error message preventing duplicate barcodes
- **Actual**: Duplicate barcode accepted
- **Impact**: Inventory tracking errors, barcode scanning ambiguity
- **Status**: Open (Warehouse Batch 1 - confirmed)

---

### BUG-004
- **Severity**: HIGH
- **Title**: Packing slip PDFs missing item weights (~20% of exports)
- **Module**: Warehouse → Fulfillment → Packing Slips
- **Description**: When exporting packing slips to PDF, approximately 20% of items are missing weight data in the generated PDFs
- **Steps to Reproduce**:
  1. Create fulfillment order with 10 items
  2. Export packing slip to PDF
  3. Review PDF - some items missing weights
- **Expected**: All items have weight column with values
- **Actual**: ~20% of items missing weight data in PDF
- **Impact**: Incomplete shipping documentation, weight mismatch issues
- **Status**: Open (Warehouse Batch 1 - confirmed, intermittent)

---

## 🟡 MEDIUM SEVERITY BUGS (Warehouse Batch 2)

### BUG-EXPIRING-001
- **Severity**: MEDIUM
- **Title**: Expiring Items tab fails with query parameter error
- **Module**: Warehouse → Analytics → Expiring Items
- **URL**: `/warehouse/analytics/expiring-items`
- **Description**: Clicking the "Expiring Items" analytics tab fails to load data with query parameter validation error
- **Steps to Reproduce**:
  1. Navigate to Warehouse → Analytics
  2. Click "Expiring Items" tab
  3. Observe error message
- **Expected**: Expiring items data loads successfully with date filtering
- **Actual**: "Failed to Load Expiring Items - Invalid query parameters" error
- **Impact**: Cannot view expiring inventory data
- **Status**: Open (Warehouse Batch 2 - found during testing)
- **Commit**: a5b8693

---

## 🟡 MEDIUM SEVERITY BUGS (Warehouse Batch 4)

### BUG-BATCH4-001
- **Severity**: MEDIUM
- **Title**: Inventory Adjustments API returns 500 error
- **Module**: Warehouse → Adjustments
- **URL**: `/api/warehouse/adjustments`
- **Description**: POST requests to the inventory adjustments endpoint fail with HTTP 500 Internal Server Error
- **Steps to Reproduce**:
  1. Call `POST /api/warehouse/adjustments` with valid payload
  2. Server returns 500
- **Expected**: HTTP 201 with adjustment confirmation
- **Actual**: HTTP 500 Internal Server Error
- **Impact**: Cannot create inventory adjustments via API
- **Status**: Open (Warehouse Batch 4 - items 151-206)
- **Commit**: test(warehouse): QA batch 4

---

### BUG-BATCH4-002
- **Severity**: MEDIUM
- **Title**: Genealogy endpoint returns 404
- **Module**: Warehouse → Traceability
- **URL**: `/api/warehouse/genealogy`
- **Description**: The product genealogy tracking endpoint returns 404 Not Found, indicating the feature is not fully implemented
- **Steps to Reproduce**:
  1. Call `GET /api/warehouse/genealogy?productId=X`
  2. Server returns 404
- **Expected**: Product genealogy/origin chain data
- **Actual**: HTTP 404 Not Found
- **Impact**: Cannot trace product genealogy
- **Status**: Open (Warehouse Batch 4)

---

### BUG-BATCH4-003
- **Severity**: MEDIUM
- **Title**: Aging reports batch filtering error
- **Module**: Warehouse → Reports → Aging Analysis
- **Description**: Stock aging reports fail when applying batch-level filters
- **Steps to Reproduce**:
  1. Navigate to Aging Analysis report
  2. Apply filter by batch/lot number
  3. Report fails to load
- **Expected**: Aging data filtered by selected batch
- **Actual**: Batch filter causes report error
- **Impact**: Batch-level analysis unavailable
- **Status**: Open (Warehouse Batch 4)

---

### BUG-BATCH4-004
- **Severity**: MEDIUM
- **Title**: Multi-warehouse consolidated reports error
- **Module**: Warehouse → Reports → Multi-Warehouse
- **Description**: Reports that consolidate data from multiple warehouses fail with data aggregation error
- **Steps to Reproduce**:
  1. Generate multi-warehouse inventory report
  2. Observe error during aggregation
- **Expected**: Consolidated data from all warehouses
- **Actual**: Aggregation error, partial data only
- **Impact**: Cannot get enterprise-wide warehouse view
- **Status**: Open (Warehouse Batch 4)

---

### BUG-BATCH4-005
- **Severity**: MEDIUM
- **Title**: Products API SKU migration unsupported
- **Module**: Warehouse → Product Management
- **URL**: `/api/warehouse/products/sku-migration`
- **Description**: Product SKU migration endpoint not implemented - returns "Unsupported Operation"
- **Steps to Reproduce**:
  1. Call `POST /api/warehouse/products/sku-migration`
  2. Endpoint returns "Not Supported"
- **Expected**: Ability to migrate product SKUs
- **Actual**: Operation not supported
- **Impact**: SKU changes require manual workaround
- **Status**: Open (Warehouse Batch 4)

---

### BUG-BATCH4-006
- **Severity**: LOW
- **Title**: Transfer cancel operation incomplete
- **Module**: Warehouse → Transfers
- **Description**: Canceling an in-flight transfer leaves system in inconsistent state (inventory partially rolled back)
- **Steps to Reproduce**:
  1. Create transfer order
  2. Start transfer (status: in-progress)
  3. Click Cancel
  4. Check inventory - partial rollback occurs
- **Expected**: Complete rollback to pre-transfer state
- **Actual**: Partial inventory rollback, inconsistent state
- **Impact**: Manual cleanup required after transfer cancellation
- **Status**: Open (Warehouse Batch 4)

---

## 📊 Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 1 | Open (BUG-SC-001) |
| HIGH | 2 | Open (BUG-003, 004) |
| MEDIUM | 6 | Open (5 from Batch 4 + BUG-EXPIRING-001) |
| LOW | 1 | Open (BUG-BATCH4-006) |
| **TOTAL** | **10** | **All Open** |

---

**Next Steps**: Fix Warehouse bugs 1-10, then test Scanner/Planning/Production/Quality/Shipping modules
