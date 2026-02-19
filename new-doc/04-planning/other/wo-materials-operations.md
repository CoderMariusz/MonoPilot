# WO Materials & Operations Technical Architecture

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Business Logic](#business-logic)
5. [Security & RLS](#security--rls)
6. [Performance](#performance)
7. [Integration Points](#integration-points)

## Overview

This document describes the technical architecture for Stories 03.11a (WO Materials - BOM Snapshot) and 03.12 (WO Operations - Routing Copy).

**Key Patterns**:
- BOM Snapshot (ADR-002): Immutable copy of BOM items at work order release time
- Routing Copy (03.12): Immutable copy of routing operations at work order release time
- Multi-tenancy: All tables enforce organization isolation via RLS (ADR-013)
- Decimal Precision: Materials use DECIMAL(15,6) for quantity scaling accuracy

## Database Schema

### wo_materials Table (Story 03.11a)

The `wo_materials` table stores the BOM snapshot for each work order. It's an immutable record of what materials were required at the time of release.

#### Columns

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `wo_id` | UUID | FK → work_orders(id) ON DELETE CASCADE | Parent work order |
| `organization_id` | UUID | FK → organizations(id) | Org isolation for RLS |
| `product_id` | UUID | FK → products(id) | Component product reference |
| `material_name` | TEXT | NOT NULL | Denormalized product name for snapshot |
| `required_qty` | DECIMAL(15,6) | NOT NULL | Scaled quantity from BOM |
| `consumed_qty` | DECIMAL(15,6) | DEFAULT 0 | Updated by Epic 04 production |
| `reserved_qty` | DECIMAL(15,6) | DEFAULT 0 | Set by Story 03.11b reservation |
| `uom` | TEXT | NOT NULL | Unit of measure (kg, L, boxes, etc.) |
| `sequence` | INTEGER | DEFAULT 0 | Display order in BOM |
| `consume_whole_lp` | BOOLEAN | DEFAULT FALSE | Consume entire license plate flag |
| `is_by_product` | BOOLEAN | DEFAULT FALSE | Indicates output product (not consumed) |
| `yield_percent` | DECIMAL(5,2) | Nullable | By-product yield percentage |
| `scrap_percent` | DECIMAL(5,2) | DEFAULT 0 | Waste percentage in scaling |
| `condition_flags` | JSONB | Nullable | Conditional item flags (Phase 1) |
| `bom_item_id` | UUID | Nullable | Reference to source bom_item for audit |
| `bom_version` | INTEGER | Nullable | BOM version at snapshot time |
| `notes` | TEXT | Nullable | Item-level notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | When snapshot was created |

#### Constraints

```sql
CONSTRAINT chk_required_qty CHECK (required_qty >= 0)
CONSTRAINT chk_consumed_qty CHECK (consumed_qty >= 0)
CONSTRAINT chk_reserved_qty CHECK (reserved_qty >= 0)
CONSTRAINT chk_scrap_percent CHECK (scrap_percent >= 0 AND scrap_percent <= 100)
```

#### Indexes

```sql
CREATE INDEX idx_wo_materials_wo ON wo_materials(wo_id);
CREATE INDEX idx_wo_materials_product ON wo_materials(product_id);
CREATE INDEX idx_wo_materials_org ON wo_materials(organization_id);
```

### wo_operations Table (Story 03.12)

The `wo_operations` table stores the routing snapshot for each work order—an immutable record of production steps from the time of release.

#### Columns

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `wo_id` | UUID | FK → work_orders(id) ON DELETE CASCADE | Parent work order |
| `organization_id` | UUID | FK → organizations(id) ON DELETE CASCADE | Org isolation |
| `sequence` | INTEGER | NOT NULL | Operation order in routing |
| `operation_name` | TEXT | NOT NULL | Operation description |
| `description` | TEXT | Nullable | Additional context |
| `instructions` | TEXT | Nullable | Detailed production instructions |
| `machine_id` | UUID | FK → machines(id) | Assigned machine |
| `line_id` | UUID | FK → production_lines(id) | Assigned production line |
| `expected_duration_minutes` | INTEGER | Nullable | Planned duration in minutes |
| `expected_yield_percent` | DECIMAL(5,2) | Nullable | Expected output percentage |
| `actual_duration_minutes` | INTEGER | Nullable | Recorded duration (filled by Epic 04) |
| `actual_yield_percent` | DECIMAL(5,2) | Nullable | Recorded yield (filled by Epic 04) |
| `status` | TEXT | CHECK IN ('pending', 'in_progress', 'completed', 'skipped') | Current state |
| `started_at` | TIMESTAMPTZ | Nullable | When operation started |
| `completed_at` | TIMESTAMPTZ | Nullable | When operation finished |
| `started_by` | UUID | FK → users(id) | Who started this operation |
| `completed_by` | UUID | FK → users(id) | Who completed this operation |
| `skip_reason` | TEXT | Nullable | Why operation was skipped |
| `notes` | TEXT | Nullable | Additional production notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | When operation was copied |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last modification time |

#### Constraints

```sql
CONSTRAINT wo_ops_unique_sequence UNIQUE(wo_id, sequence)
CONSTRAINT wo_ops_expected_duration_positive CHECK (expected_duration_minutes IS NULL OR expected_duration_minutes > 0)
CONSTRAINT wo_ops_actual_duration_positive CHECK (actual_duration_minutes IS NULL OR actual_duration_minutes >= 0)
CONSTRAINT wo_ops_expected_yield_range CHECK (expected_yield_percent IS NULL OR (expected_yield_percent >= 0 AND expected_yield_percent <= 100))
CONSTRAINT wo_ops_actual_yield_range CHECK (actual_yield_percent IS NULL OR (actual_yield_percent >= 0 AND actual_yield_percent <= 100))
```

#### Indexes

```sql
CREATE INDEX idx_wo_ops_wo_id ON wo_operations(wo_id);
CREATE INDEX idx_wo_ops_org_id ON wo_operations(organization_id);
CREATE INDEX idx_wo_ops_status ON wo_operations(status);
CREATE INDEX idx_wo_ops_machine ON wo_operations(machine_id);
CREATE INDEX idx_wo_ops_line ON wo_operations(line_id);
CREATE INDEX idx_wo_ops_sequence ON wo_operations(wo_id, sequence);
```

## API Endpoints

### Materials Endpoints

#### GET /api/planning/work-orders/:id/materials

Retrieve all materials (BOM snapshot) for a work order.

**Authentication**: Required (all authenticated users)

**Request**:
```http
GET /api/planning/work-orders/123e4567-e89b-12d3-a456-426614174000/materials
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "materials": [
    {
      "id": "mat-1",
      "wo_id": "wo-1",
      "product_id": "prod-1",
      "material_name": "Flour",
      "required_qty": 13.125,
      "consumed_qty": 0,
      "reserved_qty": 0,
      "uom": "kg",
      "sequence": 1,
      "consume_whole_lp": false,
      "is_by_product": false,
      "yield_percent": null,
      "scrap_percent": 5,
      "condition_flags": null,
      "bom_item_id": "bi-1",
      "bom_version": 2,
      "notes": null,
      "created_at": "2025-12-20T10:00:00Z",
      "product": {
        "id": "prod-1",
        "code": "FLR-001",
        "name": "Flour",
        "product_type": "RM"
      }
    }
  ],
  "total": 1,
  "bom_version": 2,
  "snapshot_at": "2025-12-20T10:00:00Z"
}
```

**Error Responses**:
| Status | Code | Message | When |
|--------|------|---------|------|
| 401 | UNAUTHORIZED | Unauthorized | No valid JWT |
| 404 | WO_NOT_FOUND | Work order not found | WO doesn't exist or belongs to different org |

**Performance**: < 500ms for up to 200 materials (indexed on wo_id)

#### POST /api/planning/work-orders/:id/snapshot

Create or refresh BOM snapshot. Only allowed for draft/planned WOs.

**Authentication**: Required
**Roles**: owner, admin, planner, production_manager

**Request**:
```http
POST /api/planning/work-orders/123e4567-e89b-12d3-a456-426614174000/snapshot
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

No body required—uses WO's existing bom_id.

**Response** (200 OK):
```json
{
  "success": true,
  "materials_count": 10,
  "message": "Snapshot created with 10 materials"
}
```

**Error Responses**:
| Status | Code | Message | When |
|--------|------|---------|------|
| 400 | NO_BOM_SELECTED | Work order has no BOM selected | WO.bom_id is null |
| 401 | UNAUTHORIZED | Unauthorized | No valid JWT |
| 403 | FORBIDDEN | Permission denied | User lacks required role |
| 404 | WO_NOT_FOUND | Work order not found | WO doesn't exist |
| 409 | WO_RELEASED | Cannot modify materials after WO is released | WO in released+ status |

**Performance**: < 2s for 100-item BOM (bulk insert in transaction)

### Operations Endpoints

#### GET /api/planning/work-orders/:wo_id/operations

Retrieve all operations for a work order, ordered by sequence.

**Authentication**: Required (all roles can read)

**Request**:
```http
GET /api/planning/work-orders/wo-1/operations
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "operations": [
    {
      "id": "op-1",
      "wo_id": "wo-1",
      "sequence": 1,
      "operation_name": "Mix Ingredients",
      "description": "Combine all dry ingredients",
      "machine_id": "m-1",
      "machine_code": "MIXER-01",
      "machine_name": "Industrial Mixer",
      "line_id": "l-1",
      "line_code": "LINE-A",
      "line_name": "Production Line A",
      "expected_duration_minutes": 30,
      "expected_yield_percent": null,
      "actual_duration_minutes": null,
      "actual_yield_percent": null,
      "status": "pending",
      "started_at": null,
      "completed_at": null,
      "started_by": null,
      "completed_by": null,
      "started_by_user": null,
      "completed_by_user": null,
      "skip_reason": null,
      "notes": null,
      "created_at": "2025-12-20T10:00:00Z"
    }
  ],
  "total": 1
}
```

**Error Responses**:
| Status | Code | Message | When |
|--------|------|---------|------|
| 401 | UNAUTHORIZED | Unauthorized | No valid JWT |
| 404 | WO_NOT_FOUND | Work order not found | WO doesn't exist |

#### GET /api/planning/work-orders/:wo_id/operations/:op_id

Retrieve full details of a single operation including variances.

**Authentication**: Required (all roles can read)

**Request**:
```http
GET /api/planning/work-orders/wo-1/operations/op-1
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "id": "op-1",
  "wo_id": "wo-1",
  "sequence": 1,
  "operation_name": "Mix Ingredients",
  "description": "Combine all dry ingredients",
  "instructions": "1. Add flour\n2. Add water\n3. Mix for 5 min",
  "machine_id": "m-1",
  "machine": {
    "id": "m-1",
    "code": "MIXER-01",
    "name": "Industrial Mixer"
  },
  "line_id": "l-1",
  "line": {
    "id": "l-1",
    "code": "LINE-A",
    "name": "Production Line A"
  },
  "expected_duration_minutes": 30,
  "expected_yield_percent": 98.5,
  "actual_duration_minutes": 35,
  "actual_yield_percent": 97.2,
  "duration_variance_minutes": 5,
  "yield_variance_percent": -1.3,
  "status": "completed",
  "started_at": "2025-12-20T11:00:00Z",
  "completed_at": "2025-12-20T11:35:00Z",
  "started_by": "user-1",
  "completed_by": "user-1",
  "started_by_user": {
    "id": "user-1",
    "name": "John Operator"
  },
  "completed_by_user": {
    "id": "user-1",
    "name": "John Operator"
  },
  "skip_reason": null,
  "notes": "Mixer was running hot, checked temperature",
  "created_at": "2025-12-20T10:00:00Z",
  "updated_at": "2025-12-20T11:35:00Z"
}
```

**Error Responses**:
| Status | Code | Message | When |
|--------|------|---------|------|
| 401 | UNAUTHORIZED | Unauthorized | No valid JWT |
| 404 | WO_NOT_FOUND | Work order not found | WO doesn't exist |
| 404 | OPERATION_NOT_FOUND | Operation not found | Operation doesn't exist |

#### POST /api/planning/work-orders/:wo_id/copy-routing

Manually trigger routing operations copy. Admin-only endpoint.

**Authentication**: Required
**Roles**: ADMIN, SUPER_ADMIN

**Request**:
```http
POST /api/planning/work-orders/wo-1/copy-routing
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

No body required.

**Response** (200 OK):
```json
{
  "success": true,
  "operations_created": 5,
  "message": "5 operations copied from routing"
}
```

**Error Responses**:
| Status | Code | Message | When |
|--------|------|---------|------|
| 400 | ROUTING_NOT_FOUND | Routing not found | WO has no routing_id or routing doesn't exist |
| 401 | UNAUTHORIZED | Unauthorized | No valid JWT |
| 403 | FORBIDDEN | Admin role required | User lacks admin role |
| 404 | WO_NOT_FOUND | Work order not found | WO doesn't exist |

## Business Logic

### BOM Snapshot Pattern (ADR-002)

The BOM snapshot captures the state of a Bill of Materials at a specific point in time (work order release). This ensures:

1. **Traceability**: What was actually required for each work order
2. **Immutability**: Production follows frozen specifications
3. **Auditability**: Changes to BOMs don't affect past work orders

#### Scaling Formula

```
required_qty = (wo_planned_qty / bom_output_qty) * bom_item_qty * (1 + scrap_percent / 100)
```

**Example**:
- BOM defined for 100 units with output_qty = 100
- BOM item: "Flour" with quantity = 5 kg, scrap_percent = 5%
- Work order planned_quantity = 250 units

Calculation:
```
required_qty = (250 / 100) * 5 * (1 + 5/100)
             = 2.5 * 5 * 1.05
             = 13.125 kg
```

#### Precision

Quantities use **DECIMAL(15,6)** for 6 decimal places of precision:
```typescript
export function scaleQuantity(
  itemQty: number,
  woQty: number,
  bomOutputQty: number,
  scrapPercent: number = 0
): number {
  const scaleFactor = woQty / bomOutputQty;
  const scrapMultiplier = 1 + (scrapPercent / 100);
  const result = itemQty * scaleFactor * scrapMultiplier;
  // Round to 6 decimal places
  return Math.round(result * 1000000) / 1000000;
}
```

#### By-Products

By-products are secondary outputs (not consumed inputs):
- `is_by_product = true`
- `required_qty = 0` (not tracked for consumption)
- `yield_percent` preserved for reference
- Displayed with distinct badge in UI

#### Column Mapping

| Source (bom_items) | Target (wo_materials) | Transform |
|-------------------|----------------------|-----------|
| product_id | product_id | Direct copy |
| products.name | material_name | Denormalized (snapshot) |
| quantity | required_qty | Scaling formula applied |
| uom | uom | Direct copy |
| sequence | sequence | Direct copy |
| scrap_percent | scrap_percent | Direct copy |
| consume_whole_lp | consume_whole_lp | Direct copy |
| is_by_product | is_by_product | Direct copy |
| yield_percent | yield_percent | Direct copy |
| condition_flags | condition_flags | Direct copy |
| id | bom_item_id | Audit reference |
| (from boms) version | bom_version | Audit reference |

### Routing Copy Pattern

Operations are copied from routing when a work order transitions to "released" status:

1. **Trigger**: Work order status changes from "planned" → "released"
2. **Idempotency**: Subsequent releases don't duplicate operations
3. **Setting Control**: `wo_copy_routing` setting enables/disables feature (default: true)
4. **Expected Duration**: Sum of duration + setup_time + cleanup_time
5. **Status**: All operations start with status = "pending"

#### Expected Duration Calculation

```sql
expected_duration_minutes = COALESCE(duration, 0) + COALESCE(setup_time, 0) + COALESCE(cleanup_time, 0)
```

Example:
- Duration: 30 min
- Setup time: 5 min
- Cleanup time: 5 min
- Expected total: 40 minutes

#### Column Mapping

| Source (routing_operations) | Target (wo_operations) | Transform |
|----------------------------|----------------------|-----------|
| sequence | sequence | Direct copy |
| name | operation_name | Direct copy |
| description | description | Direct copy |
| instructions | instructions | Direct copy |
| machine_id | machine_id | Direct copy |
| line_id | line_id | Direct copy |
| duration + setup_time + cleanup_time | expected_duration_minutes | Sum calculation |
| N/A | expected_yield_percent | Null (not in routing) |
| N/A | status | Default to "pending" |

### Immutability Rules

**After WO Release**:
- Materials: No modification (RLS prevents updates)
- Operations: No modification (RLS prevents updates)

**Before WO Release**:
- Materials: Can refresh (deletes old, creates new)
- Operations: Can be manually copied via API (admin only)

**Rationale**: Once production begins, changing requirements would cause confusion and break traceability.

## Security & RLS

### RLS Policies (ADR-013)

All tables enforce row-level security using organization_id isolation pattern:

```sql
organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
```

#### wo_materials Policies

**SELECT**: All authenticated users can read materials
```sql
organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
```

**INSERT**: Only planners and managers can create
```sql
organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
   IN ('owner', 'admin', 'planner', 'production_manager')
```

**UPDATE**: Operators can update consumed_qty, planners/managers can modify others
```sql
organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
   IN ('owner', 'admin', 'planner', 'production_manager', 'production_operator')
```

**DELETE**: Only planners can delete, and only for draft/planned WOs
```sql
organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
AND EXISTS (SELECT 1 FROM work_orders wo WHERE wo.id = wo_materials.wo_id AND wo.status IN ('draft', 'planned'))
AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
   IN ('owner', 'admin', 'planner')
```

#### wo_operations Policies

**SELECT**: All authenticated users can read
```sql
organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
```

**INSERT**: Only admins and planners
```sql
organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
   IN ('SUPER_ADMIN', 'ADMIN', 'PLANNER', 'PROD_MANAGER')
```

**UPDATE**: All roles except viewer can update (for tracking progress)
```sql
organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
   IN ('SUPER_ADMIN', 'ADMIN', 'PLANNER', 'PROD_MANAGER', 'OPERATOR')
```

**DELETE**: Only admins
```sql
organization_id = (SELECT org_id FROM users WHERE id = auth.uid())
AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
   IN ('SUPER_ADMIN', 'ADMIN')
```

### Org Isolation

Every query must filter by organization to enforce RLS:
```typescript
// Service layer enforces org_id
const { data } = await supabase
  .from('wo_materials')
  .select('*')
  .eq('organization_id', getCurrentOrgId());  // Required
```

## Performance

### Query Optimization

**Materials List**: Single query with JOIN to products
```sql
SELECT wm.*, p.id, p.code, p.name, p.product_type
FROM wo_materials wm
LEFT JOIN products p ON wm.product_id = p.id
WHERE wm.wo_id = $1
ORDER BY wm.sequence ASC
```
- Index: `idx_wo_materials_wo`
- Target: < 500ms for 200 materials

**Operations List**: Includes related data (machines, users, lines)
```sql
SELECT wo.*, m.id, m.code, m.name, l.id, l.code, l.name
FROM wo_operations wo
LEFT JOIN machines m ON wo.machine_id = m.id
LEFT JOIN production_lines l ON wo.line_id = l.id
WHERE wo.wo_id = $1
ORDER BY wo.sequence ASC
```
- Index: `idx_wo_ops_wo_id`
- Target: < 500ms for all operations

**Single Operation**: Detailed view with calculated variances
```typescript
// Variance calculated in application
const duration_variance = actual_duration_minutes - expected_duration_minutes;
const yield_variance = actual_yield_percent - expected_yield_percent;
```

### Caching Strategy

**Frontend (React Query)**:
- Materials: 30-second stale time
- Operations: 30-second stale time
- Query keys: `['wo-materials', woId]`, `['wo-operations', woId]`

**Server-side**: None (RLS prevents unsafe caching)

### Bulk Operations

**Snapshot Creation**: Single transaction
```sql
INSERT INTO wo_materials (...)
SELECT ... FROM bom_items
WHERE bom_id = $1
```
- Performance: < 2s for 100-item BOM
- All-or-nothing: Transaction ensures consistency

**Routing Copy**: Database function handles atomicity
```sql
INSERT INTO wo_operations (...)
SELECT ... FROM routing_operations
WHERE routing_id = $1
```
- Idempotent: Checks existing count first
- All-or-nothing: Transaction ensures consistency

## Integration Points

### With Story 03.10 (WO CRUD)

- **Depends on**: work_orders table, status lifecycle
- **Trigger**: Release action calls copyRoutingToWO()
- **Non-blocking**: Routing copy failures don't prevent release

Integration example:
```typescript
// In work-order-service.ts release() method
export async function release(id: string): Promise<WorkOrder> {
  const wo = await updateStatus(id, 'released');

  // Non-blocking copy operation
  try {
    const count = await copyRoutingToWO(id, wo.org_id);
    console.log(`Copied ${count} operations`);
  } catch (error) {
    console.error('Routing copy failed:', error);
    // Don't block release
  }

  return wo;
}
```

### With Story 03.11b (Material Reservation)

- **Depends on**: wo_materials table
- **Updates**: reserved_qty column
- **Immutable**: Materials list itself doesn't change

### With Epic 04 (Production)

- **Reads**: wo_materials and wo_operations
- **Updates**: consumed_qty, actual_duration_minutes, status, actual_yield_percent
- **Never deletes**: Snapshots are permanent audit trail

### With Story 03.13 (Material Availability)

- **Reads**: wo_materials required_qty, reserved_qty
- **Compares**: Against inventory LP quantity
- **Returns**: Availability status per material

### With Epic 05 (Warehouse)

- **Reads**: wo_materials for picking
- **Uses**: consume_whole_lp flag for LP consumption
- **Updates**: consumed_qty through production

### With Epic 10 (OEE)

- **Reads**: wo_operations for performance metrics
- **Analyzes**: Duration and yield variances
- **Calculates**: OEE scores based on actual vs expected

## Related Documentation

- **ADR-002**: [BOM Snapshot Pattern](../../1-BASELINE/architecture/decisions/ADR-002-bom-snapshot-pattern.md)
- **ADR-013**: [RLS Org Isolation Pattern](../../1-BASELINE/architecture/decisions/ADR-013-rls-org-isolation-pattern.md)
- **API Reference**: [Planning WO Materials & Operations API](../api/planning-wo-materials-operations.md)
- **Developer Guide**: [WO Materials & Operations Development](../dev-guide/wo-materials-operations-dev-guide.md)
- **User Guide**: [Work Order Materials & Operations](../../4-USER-GUIDE/planning/work-order-materials-operations.md)
