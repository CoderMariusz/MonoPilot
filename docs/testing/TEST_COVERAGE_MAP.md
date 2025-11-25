# Test Coverage Map

**Last Updated**: 2025-01-XX  
**Version**: 2.0 - Documentation Audit Update

## Overview
This document maps tests to database tables, APIs, and business rules to ensure comprehensive coverage.

## Table Coverage

| Table | Unit Tests | Integration Tests | E2E Tests |
|-------|------------|-------------------|-----------|
| products | ProductsAPI unit tests | BOM integration tests | BOM page workflows |
| boms | ProductsAPI BOM tests | BOM + Products | BOM management flows |
| bom_items | BOM item validation | BOM item save/load | Complex BOM editing |
| work_orders | WorkOrdersAPI unit tests | WO + Products | Production workflows |
| wo_operations | Sequencing logic | Stage status API | Scanner process flows |
| wo_materials | Snapshot logic | WO creation snapshot | WO creation flows |
| license_plates | LP validation | GRN + LP creation | LP lifecycle flows |
| lp_reservations | Reservation logic | Stage/complete flows | Staging workflows |
| stock_moves | Move validation | Move + LP updates | Stock movement flows |
| grns | GRN creation | PO → GRN | GRN processing flows |
| purchase_orders | PO validation | Suppliers + PO | Planning workflows |
| transfer_orders | TO validation | Warehouses + TO | Transfer workflows |

## API Coverage

| API | Unit | Integration | E2E |
|-----|------|-------------|-----|
| ProductsAPI | ✔ | ✔ | ✔ |
| WorkOrdersAPI | ✔ | ✔ | ✔ |
| RoutingsAPI | ✔ | ✔ |  |
| LicensePlatesAPI | ✔ | ✔ | ✔ |
| PurchaseOrdersAPI | ✔ | ✔ | ✔ |
| TransferOrdersAPI | ✔ | ✔ | ✔ |
| TraceabilityAPI | ✔ | ✔ | ✔ |
| YieldAPI | ✔ | ✔ | ✔ |

## Business Rules Coverage

- Product taxonomy validation (group/type)
- BOM component rules (optional/phantom/one-to-one)
- Work order status transitions and sequencing
- Material reservation safety and 1:1 validation
- QA gate enforcement
- GRN validation against PO
- Stock movement constraints
- Traceability chain integrity

## Gaps and Follow-ups

- Add dedicated tests for pallet flows
- Expand ASN processing tests
- Increase performance tests around large BOMs and WOs
