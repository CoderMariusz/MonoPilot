# ADR-001: Multi-Tenancy with org_id

## Status
Accepted

## Date
2025-11-01

## Context
MonoPilot is a SaaS application serving multiple food manufacturing organizations. Each organization's data must be completely isolated from others for security and compliance.

## Decision
Implement multi-tenancy using `org_id` foreign key on all data tables with Row Level Security (RLS) policies.

### Implementation
1. **Every table** with business data includes `org_id UUID REFERENCES organizations(id)`
2. **RLS policies** on all tables: `USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))`
3. **User context** stored in `users.org_id` after organization assignment
4. **Supabase RLS** enforced at database level, not application level

### Tables exempt from org_id
- `users` - references org_id directly
- `organizations` - the org itself
- System tables (migrations, etc.)

## Consequences

### Positive
- Complete data isolation at database level
- Cannot accidentally leak data across organizations
- Supabase handles enforcement automatically
- Simplified application code (no manual filtering)

### Negative
- Every new table requires org_id + RLS policy
- Migrations must include both table AND policies
- Testing requires organization context setup
- Cannot do cross-organization queries (by design)

## Compliance
- [ ] All new tables include `org_id NOT NULL`
- [ ] All new tables have RLS policies for SELECT, INSERT, UPDATE, DELETE
- [ ] Migration files include both CREATE TABLE and CREATE POLICY

---
*Related: ADR-002 RLS Policy Patterns*
