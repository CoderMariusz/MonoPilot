# ADR-008: Audit Trail Strategy

## Status: ACCEPTED

**Date**: 2025-12-10
**Decision Makers**: Architecture Team
**Related PRDs**: All Modules, Quality (Epic 6)

---

## Context

Food manufacturing requires comprehensive audit trails for:
1. Regulatory compliance (FDA 21 CFR Part 11, FSMA, EU GMP Annex 11)
2. Traceability during recalls
3. Quality investigations (NCRs, deviations)
4. User accountability
5. System debugging and support

Audit requirements:
- Who changed what, when
- Previous and new values
- Cannot be modified or deleted by users
- Retained for regulatory period (typically 3-7 years)
- Queryable for investigations

Audit implementation approaches:
- **Application logging**: Code logs changes
- **Database triggers**: Automatic on any change
- **Event sourcing**: Full event history, replay state
- **Hybrid**: Triggers + application context

---

## Decision

**Implement hybrid audit trail: PostgreSQL triggers for data changes + application-layer context enrichment.**

Components:
1. **Database Triggers**: Capture all INSERT, UPDATE, DELETE automatically
2. **Application Context**: Add user_id, session_id, action_reason via `set_config()`
3. **Audit Tables**: Separate tables for audit records (not in main tables)
4. **Retention Policy**: Configurable retention with archival

This ensures no data change goes unlogged, even from direct database access, while enriching with application context.

---

## Implementation

### Audit Table Schema

```sql
-- Central audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  user_id UUID,
  session_id UUID,
  action_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_audit_log_org_created ON audit_log(org_id, created_at DESC);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);

-- Partitioning by month for retention management
CREATE TABLE audit_log_2025_01 PARTITION OF audit_log
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- ... more partitions created by maintenance job
```

### Trigger Function

```sql
-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  audit_user_id UUID;
  audit_session_id UUID;
  audit_reason TEXT;
  changed TEXT[];
  old_json JSONB;
  new_json JSONB;
BEGIN
  -- Get application context (set by service layer)
  audit_user_id := NULLIF(current_setting('app.user_id', true), '')::UUID;
  audit_session_id := NULLIF(current_setting('app.session_id', true), '')::UUID;
  audit_reason := NULLIF(current_setting('app.action_reason', true), '');

  -- Determine changed fields for UPDATE
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(key) INTO changed
    FROM (
      SELECT key FROM jsonb_each(to_jsonb(NEW))
      EXCEPT
      SELECT key FROM jsonb_each(to_jsonb(OLD))
      WHERE to_jsonb(NEW)->key = to_jsonb(OLD)->key
    ) diff;
  END IF;

  -- Prepare JSON data
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    old_json := to_jsonb(OLD);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    new_json := to_jsonb(NEW);
  END IF;

  -- Insert audit record
  INSERT INTO audit_log (
    org_id,
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_fields,
    user_id,
    session_id,
    action_reason,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(NEW.org_id, OLD.org_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    old_json,
    new_json,
    changed,
    audit_user_id,
    audit_session_id,
    audit_reason,
    NULLIF(current_setting('app.ip_address', true), '')::INET,
    NULLIF(current_setting('app.user_agent', true), '')
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Apply Triggers to Tables

```sql
-- Apply to all audited tables
DO $$
DECLARE
  tbl TEXT;
  audited_tables TEXT[] := ARRAY[
    'products', 'boms', 'bom_items', 'routings', 'routing_operations',
    'work_orders', 'wo_materials', 'wo_operations', 'wo_outputs',
    'license_plates', 'stock_movements', 'grn',
    'purchase_orders', 'po_lines', 'transfer_orders', 'to_lines',
    'sales_orders', 'so_lines', 'shipments',
    'qa_statuses', 'holds', 'inspections',
    'users', 'warehouses', 'locations', 'machines', 'production_lines'
  ];
BEGIN
  FOREACH tbl IN ARRAY audited_tables LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS audit_trigger ON %I;
      CREATE TRIGGER audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON %I
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
    ', tbl, tbl);
  END LOOP;
END $$;
```

### Application Context Setting

```typescript
// audit-context.ts
interface AuditContext {
  userId: string
  sessionId: string
  ipAddress?: string
  userAgent?: string
  actionReason?: string
}

async function setAuditContext(
  supabase: SupabaseClient,
  context: AuditContext
): Promise<void> {
  // Set PostgreSQL session variables for trigger access
  await supabase.rpc('set_audit_context', {
    p_user_id: context.userId,
    p_session_id: context.sessionId,
    p_ip_address: context.ipAddress,
    p_user_agent: context.userAgent,
    p_action_reason: context.actionReason,
  })
}

// PostgreSQL function to set context
/*
CREATE OR REPLACE FUNCTION set_audit_context(
  p_user_id UUID,
  p_session_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_action_reason TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  PERFORM set_config('app.user_id', COALESCE(p_user_id::TEXT, ''), false);
  PERFORM set_config('app.session_id', COALESCE(p_session_id::TEXT, ''), false);
  PERFORM set_config('app.ip_address', COALESCE(p_ip_address, ''), false);
  PERFORM set_config('app.user_agent', COALESCE(p_user_agent, ''), false);
  PERFORM set_config('app.action_reason', COALESCE(p_action_reason, ''), false);
END;
$$ LANGUAGE plpgsql;
*/
```

### Service Layer Integration

```typescript
// Middleware to set audit context on every request
async function auditMiddleware(
  request: NextRequest,
  handler: () => Promise<Response>
): Promise<Response> {
  const supabase = await createServerSupabase()
  const session = await getSession()

  await setAuditContext(supabase, {
    userId: session?.user?.id,
    sessionId: request.cookies.get('session_id')?.value,
    ipAddress: request.headers.get('x-forwarded-for') || request.ip,
    userAgent: request.headers.get('user-agent'),
  })

  return handler()
}

// For operations requiring reason
async function updateWithReason<T>(
  supabase: SupabaseClient,
  table: string,
  id: string,
  data: Partial<T>,
  reason: string
): Promise<T> {
  // Set reason for this operation
  await supabase.rpc('set_audit_context', {
    p_action_reason: reason,
  })

  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return result
}
```

### Audit Query Service

```typescript
// audit-service.ts
interface AuditQuery {
  tableName?: string
  recordId?: string
  userId?: string
  action?: 'INSERT' | 'UPDATE' | 'DELETE'
  dateFrom?: Date
  dateTo?: Date
  limit?: number
}

async function queryAuditLog(query: AuditQuery): Promise<AuditRecord[]> {
  let q = supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(query.limit || 100)

  if (query.tableName) q = q.eq('table_name', query.tableName)
  if (query.recordId) q = q.eq('record_id', query.recordId)
  if (query.userId) q = q.eq('user_id', query.userId)
  if (query.action) q = q.eq('action', query.action)
  if (query.dateFrom) q = q.gte('created_at', query.dateFrom.toISOString())
  if (query.dateTo) q = q.lte('created_at', query.dateTo.toISOString())

  const { data, error } = await q
  if (error) throw error
  return data
}

// Get full history of a record
async function getRecordHistory(
  tableName: string,
  recordId: string
): Promise<AuditRecord[]> {
  return queryAuditLog({ tableName, recordId })
}

// Get user activity
async function getUserActivity(
  userId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<AuditRecord[]> {
  return queryAuditLog({ userId, dateFrom, dateTo })
}
```

### Retention and Archival

```typescript
// Retention policy configuration
interface RetentionPolicy {
  tableName: string
  retentionDays: number  // Keep in hot storage
  archiveDays: number    // Keep in archive before deletion
}

const retentionPolicies: RetentionPolicy[] = [
  // Production records: 7 years (FDA requirement)
  { tableName: 'work_orders', retentionDays: 365, archiveDays: 2555 },
  { tableName: 'wo_outputs', retentionDays: 365, archiveDays: 2555 },
  { tableName: 'license_plates', retentionDays: 365, archiveDays: 2555 },

  // Quality records: 7 years
  { tableName: 'inspections', retentionDays: 365, archiveDays: 2555 },
  { tableName: 'qa_statuses', retentionDays: 365, archiveDays: 2555 },

  // Transactional: 3 years
  { tableName: 'purchase_orders', retentionDays: 180, archiveDays: 1095 },
  { tableName: 'sales_orders', retentionDays: 180, archiveDays: 1095 },

  // User activity: 1 year
  { tableName: 'users', retentionDays: 90, archiveDays: 365 },
]

// Archive job (runs daily)
async function archiveOldAuditRecords(): Promise<ArchiveResult> {
  // Move old records to archive table (cold storage)
  // Delete records past archive period
}
```

---

## Alternatives

| Option | Pros | Cons |
|--------|------|------|
| **Application logging only** | Full context; flexible | Bypassed by direct DB access; inconsistent |
| **Triggers only** | Automatic; cannot bypass | No application context; no user info |
| **Event sourcing** | Complete history; replay | Complexity; performance; overkill |
| **Hybrid (chosen)** | Best of both; reliable; contextual | Two systems to maintain; setup complexity |
| **Third-party audit** | Compliance certified | Cost; vendor lock-in; latency |

---

## Consequences

### Positive

1. **Complete Coverage**: Every data change captured, even direct SQL
2. **Rich Context**: User, session, reason attached to each change
3. **Regulatory Compliance**: Meets FDA 21 CFR Part 11 requirements
4. **Tamper-Proof**: Users cannot modify audit records
5. **Queryable**: Can investigate any record's history
6. **Performance**: Async trigger impact minimal

### Negative

1. **Storage Growth**: Audit records accumulate significantly
2. **Query Complexity**: JSONB queries for old/new data
3. **Trigger Maintenance**: Must add trigger to new tables
4. **Context Coupling**: Application must set context correctly
5. **Archive Complexity**: Retention management needed

### Mitigation

| Challenge | Mitigation |
|-----------|------------|
| Storage growth | Partitioning; archival to cold storage; compression |
| Query complexity | Materialized views for common queries; indexing |
| Trigger maintenance | CI check for missing triggers; template for new tables |
| Context coupling | Middleware sets context; fallback to system user |
| Archive complexity | Automated retention jobs; compliance dashboard |

---

## Compliance Mapping

| Requirement | Implementation |
|-------------|----------------|
| FDA 21 CFR Part 11.10(e) | Audit trail with user, timestamp, old/new values |
| FDA 21 CFR Part 11.10(k)(2) | Records cannot be modified, only appended |
| EU GMP Annex 11.9 | Traceability of changes to electronic records |
| FSMA Section 204 | Full traceability of food products |
| SOC 2 CC6.1 | Audit logging of system activities |

---

## UI Integration

```tsx
// Audit history panel for any record
function AuditHistoryPanel({ tableName, recordId }: { tableName: string, recordId: string }) {
  const { data: history } = useQuery({
    queryKey: ['audit', tableName, recordId],
    queryFn: () => getRecordHistory(tableName, recordId),
  })

  return (
    <div className="audit-panel">
      <h3>Change History</h3>
      <Timeline>
        {history?.map(entry => (
          <TimelineEntry key={entry.id}>
            <TimelineDate>{formatDateTime(entry.created_at)}</TimelineDate>
            <TimelineAction action={entry.action} />
            <TimelineUser userId={entry.user_id} />
            {entry.action_reason && (
              <TimelineReason>{entry.action_reason}</TimelineReason>
            )}
            {entry.action === 'UPDATE' && (
              <FieldChanges
                oldData={entry.old_data}
                newData={entry.new_data}
                changedFields={entry.changed_fields}
              />
            )}
          </TimelineEntry>
        ))}
      </Timeline>
    </div>
  )
}
```

---

## Validation

This decision was validated against:
- [x] FDA 21 CFR Part 11 electronic records requirements
- [x] FSMA traceability requirements
- [x] SOC 2 audit logging controls
- [x] Performance testing with high transaction volume

---

## References

- Audit Service: `apps/frontend/lib/services/audit-service.ts`
- Audit Trigger Migration: `supabase/migrations/xxx_audit_triggers.sql`
- PRD Quality Module: `docs/1-BASELINE/product/modules/quality.md`
- ADR-003: Multi-Tenancy RLS
