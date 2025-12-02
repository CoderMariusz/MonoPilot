# Database Tables - Quick Schema Reference

> AI: Użyj tego zamiast czytać migracje SQL

---

## Core Tables

### organizations
```
id, name, slug, settings (jsonb),
wizard_completed, wizard_step, logo_url,
created_at, updated_at
```

### users
```
id, email, full_name, role, org_id,
avatar_url, is_active, last_sign_in_at,
created_at, updated_at
```

### user_sessions
```
id, user_id, token, ip_address, user_agent,
expires_at, created_at
```

### user_invitations
```
id, email, role, org_id, invited_by,
token, status, expires_at, created_at
```

### user_preferences
```
id, user_id, preferences (jsonb), created_at, updated_at
```

### activity_logs
```
id, org_id, user_id, action, entity_type, entity_id,
details (jsonb), created_at
```

---

## Settings Tables

### warehouses
```
id, org_id, name, code, address, is_active,
is_default, created_at, updated_at
```

### locations
```
id, org_id, warehouse_id, name, code, type,
is_active, created_at, updated_at
```

### machines
```
id, org_id, name, code, type, status,
is_active, created_at, updated_at
```

### machine_line_assignments
```
id, machine_id, line_id, is_primary, created_at
```

### production_lines
```
id, org_id, warehouse_id, name, code,
is_active, created_at, updated_at
```

### allergens
```
id, org_id, name, code, description, eu_code,
is_eu_standard, is_active, created_at, updated_at
```

### tax_codes
```
id, org_id, name, code, rate, description,
is_default, is_active, created_at, updated_at
```

---

## Technical Tables

### products
```
id, org_id, name, sku, description, type,
unit_of_measure, cost, price, status,
is_active, created_at, updated_at
```

### product_version_history
```
id, product_id, version, changes (jsonb),
changed_by, created_at
```

### product_allergens
```
id, product_id, allergen_id, level (contains/may_contain/free),
created_at
```

### product_type_config
```
id, org_id, type_code, name, settings (jsonb),
is_active, created_at, updated_at
```

### technical_settings
```
id, org_id, settings (jsonb), created_at, updated_at
```

### boms (Bill of Materials)
```
id, org_id, product_id, name, version, status,
is_active, effective_from, effective_to,
created_at, updated_at
```

### bom_items
```
id, bom_id, product_id, quantity, unit,
sequence, notes, created_at, updated_at
```

### routings
```
id, org_id, name, code, description,
is_active, created_at, updated_at
```

### routing_operations
```
id, routing_id, name, sequence, duration,
machine_id, line_id, instructions,
created_at, updated_at
```

### product_routings
```
id, product_id, routing_id, is_default, created_at
```

---

## Planning Tables

### suppliers
```
id, org_id, name, code, contact_name, email, phone,
address, is_active, created_at, updated_at
```

### supplier_products
```
id, supplier_id, product_id, supplier_sku,
lead_time_days, min_order_qty, price,
created_at, updated_at
```

### purchase_orders
```
id, org_id, supplier_id, po_number, status,
order_date, expected_date, total_amount,
notes, created_at, updated_at
```

### po_lines
```
id, po_id, product_id, quantity, unit_price,
received_qty, status, created_at, updated_at
```

### po_approvals
```
id, po_id, user_id, action, comments, created_at
```

### po_status_history
```
id, po_id, status, changed_by, created_at
```

### planning_settings
```
id, org_id, settings (jsonb), created_at, updated_at
```

### work_orders
```
id, org_id, wo_number, product_id, bom_id, routing_id,
quantity, status, scheduled_start, scheduled_end,
actual_start, actual_end, line_id,
created_at, updated_at
```

### wo_materials
```
id, wo_id, product_id, planned_qty, consumed_qty,
status, created_at, updated_at
```

### wo_operations
```
id, wo_id, operation_id, sequence, status,
planned_duration, actual_duration,
started_at, completed_at, created_at, updated_at
```

### transfer_orders
```
id, org_id, to_number, status,
source_warehouse_id, dest_warehouse_id,
scheduled_date, shipped_date, received_date,
created_at, updated_at
```

### to_lines
```
id, to_id, product_id, quantity, received_qty,
status, created_at, updated_at
```

### to_line_lps
```
id, to_line_id, lp_id, quantity, created_at
```

### to_status_history
```
id, to_id, status, changed_by, created_at
```

---

## Warehouse Tables

### license_plates
```
id, org_id, lp_number, product_id, quantity,
status, location_id, expiry_date,
lot_number, batch_number,
created_at, updated_at
```

### lp_genealogy
```
id, parent_lp_id, child_lp_id, relationship_type,
quantity, created_at
```

### traceability_links
```
id, org_id, source_type, source_id,
target_type, target_id, link_type,
quantity, created_at
```

### recall_simulations
```
id, org_id, name, criteria (jsonb),
results (jsonb), created_at
```

---

## Common Patterns

### Wszystkie tabele mają:
- `id` - UUID primary key
- `org_id` - FK do organizations (multi-tenant)
- `created_at`, `updated_at` - timestamps

### RLS Pattern:
```sql
-- Wszystkie tabele: authenticated users only
USING (true) / WITH CHECK (true)
```

### Status Enums:
- **PO/TO/WO**: draft, pending, approved, in_progress, completed, cancelled
- **Products**: active, inactive, discontinued
- **LP**: available, reserved, consumed, expired
