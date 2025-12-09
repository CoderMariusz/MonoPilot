# ADR-002: RLS Policy Patterns

## Status
Accepted

## Date
2025-11-01

## Context
With multi-tenancy via org_id (ADR-001), we need consistent RLS policy patterns across all tables.

## Decision
Use standardized RLS policy templates for all tables.

### Standard Policy Template

```sql
-- Enable RLS
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can read their org's data
CREATE POLICY "{table_name}_select_policy"
ON {table_name}
FOR SELECT
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT: Users can insert into their org
CREATE POLICY "{table_name}_insert_policy"
ON {table_name}
FOR INSERT
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- UPDATE: Users can update their org's data
CREATE POLICY "{table_name}_update_policy"
ON {table_name}
FOR UPDATE
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- DELETE: Users can delete their org's data
CREATE POLICY "{table_name}_delete_policy"
ON {table_name}
FOR DELETE
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### Naming Convention
- Policy name: `{table_name}_{operation}_policy`
- Operations: select, insert, update, delete
- Example: `work_orders_select_policy`

## Consequences

### Positive
- Consistent security model
- Easy to audit policies
- Copy-paste template reduces errors
- Clear naming convention

### Negative
- Verbose migrations (4 policies per table)
- Must remember all 4 operations
- Testing requires auth context

## Validation Checklist
- [ ] Table has ENABLE ROW LEVEL SECURITY
- [ ] SELECT policy exists
- [ ] INSERT policy with WITH CHECK exists
- [ ] UPDATE policy exists
- [ ] DELETE policy exists (if deletion allowed)

---
*Related: ADR-001 Multi-Tenancy*
