# ADR-003: Multi-Tenancy via Row-Level Security (RLS)

## Status: ACCEPTED

**Date**: 2025-12-10
**Decision Makers**: Architecture Team
**Related**: All Modules

---

## Context

MonoPilot is a multi-tenant SaaS serving multiple food manufacturing organizations. Each tenant must:
1. See only their own data
2. Be isolated from other tenants completely
3. Scale without dedicated infrastructure per tenant

Multi-tenancy approaches:
1. **Database per tenant**: Complete isolation, complex ops
2. **Schema per tenant**: Good isolation, migration complexity
3. **Row-level tenant ID**: Shared tables, requires enforcement
4. **RLS (Row-Level Security)**: Database-enforced row filtering

---

## Decision

**Implement multi-tenancy using PostgreSQL Row-Level Security (RLS) with `org_id` tenant identifier on all tables.**

Every table includes:
- `org_id UUID NOT NULL` column
- RLS policy enforcing tenant isolation
- Service layer always filters by org_id (defense in depth)

---

## Implementation

### Database Schema Pattern

```sql
-- Every table has org_id
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  -- ... other columns
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, code)  -- Unique within org
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Tenant isolation" ON products
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::UUID);
```

### JWT Claims

Supabase Auth JWT includes org_id claim:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "org_id": "org-uuid",
  "role": "operator",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Service Layer Pattern

```typescript
// Always filter by org_id - defense in depth
async function getProducts(): Promise<Product[]> {
  const supabase = await createServerSupabase()
  const orgId = await getCurrentOrgId()

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('org_id', orgId)  // Explicit filter + RLS

  return data
}
```

### Admin Client Bypass

For system operations (cron jobs, migrations):
```typescript
// Service role key bypasses RLS
const supabaseAdmin = createServerSupabaseAdmin()

// MUST manually filter by org_id
const { data } = await supabaseAdmin
  .from('products')
  .select('*')
  .eq('org_id', targetOrgId)  // CRITICAL: manual filter required
```

---

## Table List (43 tables with RLS)

| Module | Tables |
|--------|--------|
| Settings | organizations, users, roles, warehouses, locations, machines, production_lines, allergens, tax_codes, modules |
| Technical | products, product_types, product_allergens, boms, bom_items, bom_item_alternatives, routings, routing_operations |
| Planning | purchase_orders, po_lines, transfer_orders, to_lines, work_orders, wo_materials, wo_operations, suppliers |
| Production | wo_material_reservations, wo_outputs, wo_pauses, lp_genealogy |
| Warehouse | license_plates, grn, stock_movements |
| Quality | qa_statuses, holds, inspections, ncr (planned) |
| Shipping | sales_orders, so_lines, shipments (planned) |

---

## Alternatives

| Option | Pros | Cons |
|--------|------|------|
| **DB per tenant** | Complete isolation; easy backup/restore | Ops complexity; connection overhead; costly |
| **Schema per tenant** | Good isolation; separate migrations | Migration complexity; connection pool issues |
| **Row-level ID only** | Simple implementation | App bugs can leak data; no DB enforcement |
| **RLS (chosen)** | DB-enforced; shared infra; cost-effective | Requires careful policy design; JWT setup |

---

## Consequences

### Positive

1. **Database-Enforced Isolation**: Even buggy code cannot access other tenants
2. **Shared Infrastructure**: Single database for all tenants; cost-effective
3. **Simpler Operations**: One backup, one migration, one connection pool
4. **Horizontal Scaling**: Add tenants without infrastructure changes
5. **Defense in Depth**: RLS + service layer filtering = two barriers

### Negative

1. **JWT Complexity**: org_id must be in JWT claims
2. **Admin Bypass Risk**: Service role key bypasses RLS
3. **Performance Consideration**: RLS adds WHERE clause to all queries
4. **Cross-Tenant Queries**: System reports need special handling
5. **Policy Maintenance**: Each new table needs RLS policy

### Mitigation

| Challenge | Mitigation |
|-----------|------------|
| JWT complexity | Supabase Auth handles JWT; custom claims in trigger |
| Admin bypass risk | Code review; restrict admin client usage; logging |
| Performance | Indexed org_id column; query analysis |
| Cross-tenant queries | Dedicated reporting schema; aggregated views |
| Policy maintenance | Migration template includes RLS; CI check |

---

## Security Considerations

### Attack Vectors Mitigated

1. **SQL Injection**: RLS applies even if SQL injected
2. **API Parameter Tampering**: Cannot access other org_id
3. **Developer Mistakes**: Forgotten WHERE clause still filtered

### Remaining Risks

1. **Service Role Key Exposure**: Would bypass all RLS
2. **JWT Manipulation**: Mitigated by Supabase signature verification
3. **Logging Leaks**: Ensure logs don't expose other tenant data

### Security Checklist

- [x] All tables have org_id column
- [x] All tables have RLS enabled
- [x] All tables have isolation policy
- [x] Service role key in environment only
- [x] Admin client usage logged
- [x] Cross-tenant queries audited

---

## Migration Pattern

```sql
-- Template for new tables
CREATE TABLE new_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  -- columns
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Always add RLS
ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON new_feature
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::UUID);

-- Index for performance
CREATE INDEX idx_new_feature_org_id ON new_feature(org_id);
```

---

## Validation

This decision was validated against:
- [x] SOC 2 tenant isolation requirements
- [x] GDPR data separation requirements
- [x] Performance testing with 100+ tenants
- [x] Security penetration testing

---

## References

- PostgreSQL RLS Docs: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Supabase RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- Service Layer: `apps/frontend/lib/services/`
