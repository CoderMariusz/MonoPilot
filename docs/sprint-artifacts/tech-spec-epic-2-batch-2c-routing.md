# Tech Spec: Routing System (Epic 2 Batch 2C)

**Date:** 2025-11-23
**Author:** Claude AI
**Stories:** 2.15, 2.16, 2.17
**Status:** Draft

---

## Overview

The Routing System defines step-by-step production processes (operations) that can be assigned to products. A routing contains a sequence of operations, each specifying machine/line assignments, duration, yield expectations, and costs. Routings can be reusable (assigned to multiple products) or product-specific.

**Key Features:**
- Routing CRUD with reusability toggle (Story 2.15)
- Operations management with sequencing (Story 2.16)
- Product-routing many-to-many assignments (Story 2.17)

---

## Database Schema

### routings Table

```sql
CREATE TABLE public.routings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic Data
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Status and Reusability
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, inactive
  is_reusable BOOLEAN NOT NULL DEFAULT true,

  -- Audit Trail
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT routings_org_code_unique UNIQUE (org_id, code),
  CONSTRAINT routings_code_format CHECK (code ~ '^[A-Z0-9-]+$'),
  CONSTRAINT routings_status_check CHECK (status IN ('active', 'inactive'))
);
```

### routing_operations Table

```sql
CREATE TABLE public.routing_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_id UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE,

  -- Operation Details
  sequence INTEGER NOT NULL, -- Execution order (1, 2, 3...)
  operation_name VARCHAR(100) NOT NULL,

  -- Resource Assignment (optional)
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,

  -- Time and Yield
  expected_duration_minutes INTEGER NOT NULL,
  expected_yield_percent DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  setup_time_minutes INTEGER DEFAULT 0,

  -- Costing (optional)
  labor_cost DECIMAL(10,2),

  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT routing_operations_sequence_check CHECK (sequence > 0),
  CONSTRAINT routing_operations_yield_check CHECK (expected_yield_percent > 0 AND expected_yield_percent <= 100),
  CONSTRAINT routing_operations_duration_check CHECK (expected_duration_minutes > 0),
  CONSTRAINT routing_operations_unique_sequence UNIQUE (routing_id, sequence)
);
```

### product_routings Table (Many-to-Many)

```sql
CREATE TABLE public.product_routings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  routing_id UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT product_routings_unique UNIQUE (product_id, routing_id)
);
```

---

## API Endpoints

### Routing CRUD (Story 2.15)

```
GET    /api/technical/routings
  Query: ?status=active&search=text&sort_by=code&sort_direction=asc
  Response: { routings: Routing[], total: number }

POST   /api/technical/routings
  Body: { code, name, description?, status?, is_reusable? }
  Response: { routing: Routing }

GET    /api/technical/routings/:id
  Response: { routing: Routing, operations: Operation[], assigned_products: Product[] }

PUT    /api/technical/routings/:id
  Body: { name?, description?, status?, is_reusable? }
  Response: { routing: Routing }

DELETE /api/technical/routings/:id
  Response: { success: boolean }
```

### Routing Operations (Story 2.16)

```
GET    /api/technical/routings/:id/operations
  Response: { operations: Operation[] }

POST   /api/technical/routings/:id/operations
  Body: { sequence, operation_name, machine_id?, line_id?, expected_duration_minutes, expected_yield_percent?, setup_time_minutes?, labor_cost? }
  Response: { operation: Operation }

PUT    /api/technical/routings/:routingId/operations/:operationId
  Body: { sequence?, operation_name?, machine_id?, line_id?, expected_duration_minutes?, expected_yield_percent?, setup_time_minutes?, labor_cost? }
  Response: { operation: Operation }

DELETE /api/technical/routings/:routingId/operations/:operationId
  Response: { success: boolean }

POST   /api/technical/routings/:id/operations/reorder
  Body: { operations: Array<{id, sequence}> }
  Response: { success: boolean }
```

### Product-Routing Assignment (Story 2.17)

```
GET    /api/technical/routings/:id/products
  Response: { products: Product[], default_product_id?: string }

PUT    /api/technical/routings/:id/products
  Body: { product_ids: string[], default_product_id?: string }
  Response: { success: boolean }

GET    /api/technical/products/:id/routings
  Response: { routings: Routing[], default_routing_id?: string }

PUT    /api/technical/products/:id/routings
  Body: { routing_ids: string[], default_routing_id?: string }
  Response: { success: boolean }
```

---

## Data Models (TypeScript)

```typescript
export interface Routing {
  id: string
  org_id: string
  code: string
  name: string
  description: string | null
  status: 'active' | 'inactive'
  is_reusable: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  operations?: RoutingOperation[]
  assigned_products?: Product[]
  products_count?: number
}

export interface RoutingOperation {
  id: string
  routing_id: string
  sequence: number
  operation_name: string
  machine_id: string | null
  line_id: string | null
  expected_duration_minutes: number
  expected_yield_percent: number
  setup_time_minutes: number
  labor_cost: number | null
  created_at: string
  updated_at: string
  machine?: { id: string; code: string; name: string }
  line?: { id: string; code: string; name: string }
}

export interface ProductRouting {
  id: string
  product_id: string
  routing_id: string
  is_default: boolean
  created_at: string
}
```

---

## Validation Rules

### Routing (Story 2.15)
- Code: Required, unique per org, 2-50 chars, uppercase alphanumeric + hyphens
- Name: Required, 1-100 chars
- Description: Optional, max 1000 chars
- Status: Enum ('active', 'inactive')
- is_reusable: Boolean, default true

### Routing Operation (Story 2.16)
- sequence: Required, positive integer, unique within routing
- operation_name: Required, 1-100 chars
- machine_id: Optional, must exist in machines table
- line_id: Optional, must exist in production_lines table
- expected_duration_minutes: Required, positive integer
- expected_yield_percent: Optional, 0.01-100.00 (default 100.00)
- setup_time_minutes: Optional, non-negative integer (default 0)
- labor_cost: Optional, decimal (2 decimal places)

### Product-Routing Assignment (Story 2.17)
- product_id: Required, must exist in products table
- routing_id: Required, must exist in routings table
- is_default: Boolean, max 1 default routing per product
- Reusable routings can be assigned to multiple products
- Non-reusable routings can only be assigned to 1 product

---

## Business Rules

1. **Unique Codes**: Routing codes must be unique within organization (composite unique constraint)

2. **Operation Sequencing**: Operations have sequence numbers (1, 2, 3...) that determine execution order. Sequence must be unique within routing.

3. **Reusability**:
   - Reusable routing can be assigned to multiple products
   - Non-reusable routing can only be assigned to 1 product (enforced by validation)

4. **Default Routing**:
   - A product can have multiple routings assigned
   - Only 1 routing can be marked as default per product
   - Enforced by application validation (not DB constraint due to complexity)

5. **Cascade Delete**:
   - Delete routing → cascade delete all operations and product assignments
   - Delete machine/line → set to NULL in operations (ON DELETE SET NULL)
   - Delete product → cascade delete product_routings

6. **Operations Drag-Drop**: UI allows reordering operations, which updates sequence numbers

---

## RLS Policies

All tables have standard RLS policies:
- **SELECT**: org_id = auth.jwt()->>'org_id'
- **INSERT**: org_id = auth.jwt()->>'org_id' AND user is admin/technical
- **UPDATE**: org_id = auth.jwt()->>'org_id' AND user is admin/technical
- **DELETE**: org_id = auth.jwt()->>'org_id' AND user is admin

---

## Performance Considerations

### Indexes
- `idx_routings_org_id` ON routings(org_id)
- `idx_routings_code` ON routings(org_id, code)
- `idx_routings_status` ON routings(status)
- `idx_routing_operations_routing_id` ON routing_operations(routing_id)
- `idx_routing_operations_sequence` ON routing_operations(routing_id, sequence)
- `idx_product_routings_product_id` ON product_routings(product_id)
- `idx_product_routings_routing_id` ON product_routings(routing_id)

### Caching
- Routing list: 5 min TTL
- Routing operations: 5 min TTL
- Cache invalidation on CREATE/UPDATE/DELETE

---

## Integration Points

### Epic 1 Dependencies
- Machines (machine_id FK)
- Production Lines (line_id FK)
- Organizations (org_id FK)
- Users (created_by, updated_by FK)

### Epic 2 Dependencies
- Products (product_id FK for assignments)

### Future Epics
- **Epic 3 (Work Orders)**: WO creation references default routing for product
- **Epic 4 (Production)**: Operation tracking follows routing sequence
- **Epic 8 (NPD)**: Formulations can define custom routings

---

## Acceptance Criteria Summary

### Story 2.15: Routing CRUD
- ✅ AC-015.1: Technical user can create routing with code, name, description, status, is_reusable
- ✅ AC-015.2: Routing list shows code, name, status, products count
- ✅ AC-015.3: Can search by code/name, filter by status
- ✅ AC-015.4: Unique code validation per org
- ✅ AC-015.5: Admin/Technical role required for create/edit/delete

### Story 2.16: Routing Operations
- ✅ AC-016.1: Add operations with sequence, name, machine, line, duration, yield, setup time, labor cost
- ✅ AC-016.2: Operations displayed in sequence order
- ✅ AC-016.3: Drag-drop reordering updates sequence numbers
- ✅ AC-016.4: Can edit/delete individual operations
- ✅ AC-016.5: Machine and line dropdowns filtered by org

### Story 2.17: Routing-Product Assignment
- ✅ AC-017.1: Reusable routing can be assigned to multiple products
- ✅ AC-017.2: Non-reusable routing can only be assigned to 1 product
- ✅ AC-017.3: Can set one routing as default per product
- ✅ AC-017.4: Routing detail shows list of assigned products
- ✅ AC-017.5: Product edit shows assigned routings
- ✅ AC-017.6: Bi-directional assignment (from routing or product side)

---

## Testing Strategy

### Unit Tests
- Routing validation schemas (Zod)
- Operation sequence validation
- Default routing logic
- Reusability constraint validation

### Integration Tests
- Routing CRUD operations
- Operations CRUD with sequencing
- Product-routing assignments
- Cascade delete behavior
- RLS policy enforcement

### E2E Tests
- Create routing with operations
- Assign routing to products
- Drag-drop operation reordering
- Default routing selection
- Reusable vs non-reusable validation

---

**Implementation Order:**
1. Migration 020: Create routings table
2. Migration 021: Create routing_operations table
3. Migration 022: Create product_routings table
4. Service layer: routing-service.ts
5. API routes: /api/technical/routings
6. Validation schemas: routing-schemas.ts
7. Tests
