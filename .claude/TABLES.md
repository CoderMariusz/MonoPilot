# Database Tables Reference

## Core Tables

### organizations
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | Organization ID |
| company_name | VARCHAR(100) | - | Nazwa firmy |
| nip_vat | VARCHAR(50) | - | NIP/VAT |
| timezone | VARCHAR(50) | - | IANA timezone |
| default_currency | VARCHAR(3) | - | ISO 4217 (PLN/EUR/USD/GBP) |
| default_language | VARCHAR(2) | - | ISO 639-1 (PL/EN) |

### users
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | auth.users(id) | User ID |
| org_id | UUID FK | organizations(id) | Multi-tenancy |
| email | VARCHAR(255) | - | Email |
| role | VARCHAR(20) | - | admin/manager/operator/planner/etc. |
| status | VARCHAR(20) | - | invited/active/inactive |

---

## Warehouse Management

### warehouses
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | Warehouse ID |
| org_id | UUID FK | organizations(id) | Multi-tenancy |
| code | VARCHAR(50) | - | Unique code per org |
| name | VARCHAR(100) | - | Display name |
| default_receiving_location_id | UUID FK | locations(id) | Default receiving |
| default_shipping_location_id | UUID FK | locations(id) | Default shipping |
| is_active | BOOLEAN | - | Soft delete |

### locations
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | Location ID |
| org_id | UUID FK | organizations(id) | Multi-tenancy |
| warehouse_id | UUID FK | warehouses(id) | Parent warehouse |
| code | VARCHAR(50) | - | Unique per warehouse |
| type | VARCHAR(20) | - | receiving/production/storage/shipping/transit/quarantine |
| barcode | VARCHAR(100) | - | Auto-generated LOC-{code}-{seq} |
| zone | VARCHAR(100) | - | Optional zone |
| capacity | DECIMAL(10,2) | - | Optional capacity |
| is_active | BOOLEAN | - | Soft delete |

---

## Products & BOMs

### products
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | Product ID |
| org_id | UUID FK | organizations(id) | Multi-tenancy |
| code | TEXT | - | Immutable, unique per org |
| name | TEXT | - | Display name |
| type | product_type | - | RM/WIP/FG/PKG/BP/CUSTOM |
| uom | TEXT | - | Unit of measure |
| version | NUMERIC(4,1) | - | Auto-incremented (1.0 → 1.1 → 2.0) |
| status | TEXT | - | active/inactive/obsolete |

### boms
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | BOM ID |
| org_id | UUID FK | organizations(id) | Multi-tenancy |
| product_id | UUID FK | products(id) | Output product |
| version | VARCHAR(10) | - | Version (e.g., 1.0) |
| effective_from | DATE | - | Start date |
| effective_to | DATE | - | End date (nullable) |
| status | bom_status | - | draft/active/phased_out/inactive |
| output_qty | DECIMAL(10,3) | - | Output quantity |

### bom_items
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | Item ID |
| bom_id | UUID FK | boms(id) | Parent BOM |
| product_id | UUID FK | products(id) | Input material |
| quantity | DECIMAL(10,3) | - | Required quantity |
| uom | TEXT | - | Unit of measure |
| scrap_percent | DECIMAL(5,2) | - | 0-100% |
| is_by_product | BOOLEAN | - | Output by-product flag |
| yield_percent | DECIMAL(5,2) | - | By-product yield % |
| consume_whole_lp | BOOLEAN | - | Consume entire LP flag |

---

## Work Orders & Production

### work_orders
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | WO ID |
| org_id | UUID FK | organizations(id) | Multi-tenancy |
| wo_number | VARCHAR(50) | - | Unique WO number |
| product_id | UUID FK | products(id) | Product to produce |
| planned_quantity | DECIMAL(12,3) | - | Planned qty |
| produced_quantity | DECIMAL(12,3) | - | Actual produced |
| status | VARCHAR(20) | - | draft/released/in_progress/completed/closed/cancelled |
| bom_id | UUID FK | boms(id) | BOM snapshot |
| is_over_produced | BOOLEAN | - | Over-production flag |
| over_production_qty | DECIMAL(15,6) | - | Over-production quantity |

### wo_materials
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | Material line ID |
| organization_id | UUID FK | organizations(id) | Multi-tenancy |
| work_order_id | UUID FK | work_orders(id) | Parent WO |
| product_id | UUID FK | products(id) | Material product |
| quantity_required | DECIMAL(15,6) | - | Total required |
| quantity_issued | DECIMAL(15,6) | - | Issued/consumed |
| quantity_reserved | DECIMAL(15,6) | - | Reserved quantity |
| bom_item_id | UUID FK | bom_items(id) | Original BOM item |

### wo_operations
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | Operation ID |
| organization_id | UUID FK | organizations(id) | Multi-tenancy |
| work_order_id | UUID FK | work_orders(id) | Parent WO |
| operation_number | INTEGER | - | Sequence number |
| operation_name | VARCHAR(255) | - | Operation name |
| work_center_id | UUID FK | machines(id) | Work center |
| status | VARCHAR(20) | - | pending/in_progress/completed/skipped |
| quantity_completed | DECIMAL(15,3) | - | Completed qty |

### wo_material_reservations
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | Reservation ID |
| org_id | UUID FK | organizations(id) | Multi-tenancy (uses org_id) |
| wo_material_id | UUID FK | wo_materials(id) | Material line |
| work_order_id | UUID FK | work_orders(id) | Parent WO |
| lp_id | UUID FK | license_plates(id) | Reserved LP |
| reserved_qty | DECIMAL(15,6) | - | Reserved quantity |
| status | VARCHAR(20) | - | pending/confirmed/consumed/cancelled |
| reserved_at | TIMESTAMPTZ | - | Reservation timestamp |
| reserved_by | UUID FK | users(id) | Reserved by user |

### wo_consumption
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | Consumption ID |
| org_id | UUID FK | organizations(id) | Multi-tenancy |
| wo_id | UUID FK | work_orders(id) | Work order |
| material_id | UUID FK | wo_materials(id) | Material line |
| lp_id | UUID FK | license_plates(id) | License plate |
| consumed_qty | DECIMAL(15,6) | - | Consumed quantity |
| status | VARCHAR(20) | - | consumed/reversed |
| reversed_at | TIMESTAMPTZ | - | Reversal timestamp |
| output_id | UUID FK | production_outputs(id) | Linked output |

### production_outputs
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | Output ID |
| organization_id | UUID FK | organizations(id) | Multi-tenancy |
| wo_id | UUID FK | work_orders(id) | Work order |
| lp_id | UUID FK | license_plates(id) | Output LP |
| output_number | INTEGER | - | Sequential per WO (1,2,3...) |
| quantity | DECIMAL(15,6) | - | Output quantity |
| is_over_production | BOOLEAN | - | Over-production flag |
| qa_status | VARCHAR(20) | - | pass/fail/pending |

---

## License Plates & Traceability

### license_plates
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | LP ID |
| org_id | UUID FK | organizations(id) | Multi-tenancy |
| lp_number | VARCHAR(50) | - | Unique LP number |
| product_id | UUID FK | products(id) | Product |
| current_qty | DECIMAL(15,6) | - | Current quantity |
| location_id | UUID FK | locations(id) | Current location |
| consumed_by_wo_id | UUID FK | work_orders(id) | Consuming WO |
| consumed_at | TIMESTAMPTZ | - | Consumption timestamp |

### lp_genealogy
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | Genealogy ID |
| parent_lp_id | UUID FK | license_plates(id) | Output LP |
| child_lp_id | UUID FK | license_plates(id) | Input LP |
| quantity_used | DECIMAL(15,6) | - | Used quantity |
| work_order_id | UUID FK | work_orders(id) | WO context |
| status | VARCHAR(20) | - | active/reversed |
| is_over_production | BOOLEAN | - | Over-production flag |

### lp_movements
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | Movement ID |
| org_id | UUID FK | organizations(id) | Multi-tenancy |
| lp_id | UUID FK | license_plates(id) | License plate |
| movement_type | VARCHAR(30) | - | creation/receipt/consumption/reversal/adjustment/transfer |
| qty_change | DECIMAL(15,6) | - | Quantity delta |
| qty_before | DECIMAL(15,6) | - | Before qty |
| qty_after | DECIMAL(15,6) | - | After qty |

---

## Planning & Receiving

### asn
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | ASN ID |
| org_id | UUID FK | organizations(id) | Multi-tenancy |
| asn_number | VARCHAR(50) | - | Unique per org |
| po_id | UUID FK | purchase_orders(id) | Purchase order |
| supplier_id | UUID FK | suppliers(id) | Supplier |
| warehouse_id | UUID FK | warehouses(id) | Target warehouse |
| expected_arrival_date | DATE | - | Expected arrival |
| carrier | VARCHAR(100) | - | Carrier name |
| tracking_number | VARCHAR(100) | - | Tracking number |
| status | VARCHAR(20) | - | draft/submitted/receiving/received/cancelled |
| notes | TEXT | - | Additional notes |
| created_by | UUID FK | users(id) | Creator |

### asn_items
| Kolumna | Typ | Relacje | Opis |
|---------|-----|---------|------|
| id | UUID PK | - | Item ID |
| org_id | UUID FK | organizations(id) | Multi-tenancy |
| asn_id | UUID FK | asn(id) | Parent ASN |
| sequence | INTEGER | - | Line sequence (auto-increment) |
| po_line_id | UUID FK | po_lines(id) | PO line reference |
| product_id | UUID FK | products(id) | Product |
| expected_qty | DECIMAL(15,6) | - | Expected quantity |
| received_qty | DECIMAL(15,6) | - | Actual received |
| uom | VARCHAR(20) | - | Unit of measure |
| supplier_batch_number | VARCHAR(100) | - | External batch/lot |
| manufacture_date | DATE | - | Manufacture date |
| expiry_date | DATE | - | Expiry date |
| created_at | TIMESTAMPTZ | - | Creation timestamp |
| updated_at | TIMESTAMPTZ | - | Update timestamp |

---

## Quick Lookup Patterns

### Multi-tenancy
Wszystkie tabele mają `org_id UUID FK → organizations(id)` + RLS policy

### Soft Delete
`is_active BOOLEAN` lub `deleted_at TIMESTAMPTZ`

### Audit Trail
`created_by`, `updated_by`, `created_at`, `updated_at`

### Org Column Naming (UWAGA!)
Niektóre tabele używają różnych nazw:
| Tabela | Kolumna |
|--------|---------|
| wo_materials | organization_id |
| wo_operations | organization_id |
| production_outputs | organization_id |
| wo_consumption | org_id |
| wo_material_reservations | org_id |
| lp_movements | org_id |

### Status Enums
- `users.role`: admin/manager/operator/viewer/planner/technical/purchasing/warehouse/qc/finance
- `users.status`: invited/active/inactive
- `locations.type`: receiving/production/storage/shipping/transit/quarantine
- `products.type`: RM/WIP/FG/PKG/BP/CUSTOM
- `boms.status`: draft/active/phased_out/inactive
- `work_orders.status`: draft/released/in_progress/completed/closed/cancelled
- `asn.status`: draft/submitted/receiving/received/cancelled
