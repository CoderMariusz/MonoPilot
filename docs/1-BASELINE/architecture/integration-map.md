# Integration Map

## Version
- **Date**: 2025-12-10
- **Status**: Current + Planned Integrations

---

## System Context Diagram

```
+------------------+     +------------------+     +------------------+
|   Supabase Auth  |     |  Vercel Edge     |     |   Vercel KV      |
|   (Identity)     |     |  (Hosting/CDN)   |     |  (Cache/Sessions)|
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         |                        |                        |
         v                        v                        v
+------------------------------------------------------------------------+
|                                                                        |
|                            MONOPILOT MES                               |
|                                                                        |
|  +------------------+  +------------------+  +------------------+       |
|  |   Next.js App    |  |   API Routes     |  |   Service Layer  |      |
|  |   (Frontend)     |  |   (Backend)      |  |   (Business)     |      |
|  +--------+---------+  +--------+---------+  +--------+---------+      |
|           |                     |                     |                |
|           +---------------------+---------------------+                |
|                                 |                                      |
|                                 v                                      |
|                    +------------+-------------+                        |
|                    |        Supabase          |                        |
|                    |      (PostgreSQL +       |                        |
|                    |       RLS + Realtime)    |                        |
|                    +------------+-------------+                        |
|                                 |                                      |
+------------------------------------------------------------------------+
         |                        |                        |
         v                        v                        v
+------------------+     +------------------+     +------------------+
|   Email Service  |     | Barcode Scanner  |     |  Label Printer   |
|   (SendGrid/     |     |   (Browser API)  |     |   (ZPL/PDF)      |
|    Resend)       |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
```

---

## Current Integrations

### 1. Supabase Platform

| Component | Purpose | Status |
|-----------|---------|--------|
| **PostgreSQL** | Primary database | Active |
| **Auth** | User authentication, JWT | Active |
| **RLS** | Row-level security | Active |
| **Realtime** | Live updates | Partial |
| **Edge Functions** | Webhooks, cron | Active |
| **Storage** | File uploads | Planned |

**Data Flow**:
```
Browser -> Next.js API -> Supabase Client -> PostgreSQL
                               |
                               +-> RLS Policy Check (org_id)
                               |
                               +-> Data Returned
```

**Connection**:
- Protocol: HTTPS + WebSocket (realtime)
- Auth: Service Role Key (admin) / Anon Key (client)
- Env Vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

### 2. Vercel Platform

| Component | Purpose | Status |
|-----------|---------|--------|
| **Hosting** | App deployment | Active |
| **Edge Network** | CDN, edge functions | Active |
| **Build** | CI/CD pipeline | Active |
| **Analytics** | Usage metrics | Planned |
| **KV** | Redis-compatible cache | Planned |

**Deployment Flow**:
```
GitHub Push -> Vercel Build -> Edge Deployment -> CDN Distribution
```

---

### 3. Email Service

| Provider | Purpose | Status |
|----------|---------|--------|
| **Supabase Email** | Auth emails | Active |
| **SendGrid/Resend** | Transactional | Planned |

**Email Types**:
- User invitations (`invitation-service.ts`)
- Password reset (Supabase built-in)
- Email verification (Supabase built-in)

---

### 4. Browser APIs

| API | Purpose | Implementation |
|-----|---------|----------------|
| **Camera** | Barcode scanning | `navigator.mediaDevices.getUserMedia()` |
| **IndexedDB** | Offline cache | Planned for scanner |
| **Service Worker** | PWA support | Planned |

---

## Planned Integrations (Epic 11)

### External Systems

```
+------------------------------------------------------------------+
|                     INTEGRATION LAYER (Epic 11)                   |
|                                                                   |
|  +-------------+  +-------------+  +-------------+  +-----------+ |
|  | ERP Sync    |  | EDI Gateway |  | Supplier    |  | Customer  | |
|  | (Comarch    |  | (X12/       |  | Portal      |  | Portal    | |
|  |  Optima)    |  |  EDIFACT)   |  |             |  |           | |
|  +------+------+  +------+------+  +------+------+  +-----+-----+ |
|         |                |                |               |       |
+---------|----------------|----------------|---------------|-------+
          |                |                |               |
          v                v                v               v
   +-----------+    +-----------+    +-----------+    +-----------+
   |  Financial|    |  Purchase |    |  ASN/     |    |  Order    |
   |  Data     |    |  Orders   |    |  GRN      |    |  Status   |
   +-----------+    +-----------+    +-----------+    +-----------+
```

### 1. Comarch Optima (ERP)

**Purpose**: Financial system synchronization

| Direction | Data | Frequency |
|-----------|------|-----------|
| MonoPilot -> Optima | Production costs | Daily batch |
| MonoPilot -> Optima | Inventory valuations | Daily batch |
| Optima -> MonoPilot | GL codes | On-demand |
| Optima -> MonoPilot | Cost centers | On-demand |

**Integration Pattern**: REST API + scheduled sync

---

### 2. EDI Gateway

**Purpose**: B2B document exchange

| Document | Direction | Standard |
|----------|-----------|----------|
| Purchase Order (850) | Inbound | X12/EDIFACT |
| ASN (856) | Inbound | X12/EDIFACT |
| Invoice (810) | Outbound | X12/EDIFACT |
| Ship Notice (856) | Outbound | X12/EDIFACT |

**Integration Pattern**: EDI translator + message queue

---

### 3. Supplier Portal

**Purpose**: Supplier self-service

| Feature | Data Flow |
|---------|-----------|
| ASN submission | Supplier -> MonoPilot |
| PO acknowledgment | Supplier -> MonoPilot |
| Document upload | Supplier -> MonoPilot |
| Order visibility | MonoPilot -> Supplier |

**Integration Pattern**: API + web portal

---

### 4. Customer Portal

**Purpose**: Customer self-service

| Feature | Data Flow |
|---------|-----------|
| Order placement | Customer -> MonoPilot |
| Order tracking | MonoPilot -> Customer |
| CoA download | MonoPilot -> Customer |
| Inventory visibility | MonoPilot -> Customer |

**Integration Pattern**: API + web portal

---

## Internal Data Flows

### Production Flow

```
Technical Module                Planning Module               Production Module
+----------------+             +----------------+             +----------------+
|   Products     | -------->   |  Work Orders   | -------->   |  WO Execution  |
|   BOMs         |  (product   |  Materials     |  (start/    |  Reservations  |
|   Routings     |   lookup)   |  Operations    |   consume)  |  Outputs       |
+----------------+             +----------------+             +----------------+
       |                              |                              |
       |                              |                              |
       v                              v                              v
+----------------------------------------------------------------------+
|                        Warehouse Module                               |
|  License Plates  <->  GRN/Receiving  <->  Stock Movements            |
+----------------------------------------------------------------------+
       |                              |                              |
       v                              v                              v
+----------------+             +----------------+             +----------------+
| Quality Module |             | Shipping Module|             | Finance Module |
| QA Status      |             | Sales Orders   |             | Costing        |
| Holds          |             | Picking        |             | Variance       |
| Inspections    |             | Shipments      |             | Margins        |
+----------------+             +----------------+             +----------------+
```

### Traceability Flow

```
Raw Material LP          Production           Finished Good LP
+-------------+         +----------+         +-------------+
| LP-001-RAW  | ------> |   WO     | ------> | LP-002-FG   |
| Lot: ABC    |  input  | BOM snap |  output | Lot: XYZ    |
+-------------+         +----------+         +-------------+
       |                     |                      |
       |                     |                      |
       +---------------------+----------------------+
                             |
                    +--------v--------+
                    |  lp_genealogy   |
                    | parent -> child |
                    | full trace tree |
                    +-----------------+
```

---

## API Endpoints by Integration Point

### Webhook Receivers

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `/api/webhooks/auth` | Supabase auth events | Supabase signature |
| `/api/webhooks/edi` | EDI document receipt | API key (planned) |
| `/api/webhooks/supplier` | Supplier events | OAuth (planned) |

### External API Providers

| Endpoint | Consumers | Auth |
|----------|-----------|------|
| `/api/v1/orders` | Customer portal | API key + org_id |
| `/api/v1/inventory` | Supplier portal | API key + org_id |
| `/api/v1/documents` | EDI gateway | API key |

---

## Data Synchronization Patterns

### 1. Real-time (Supabase Realtime)

Used for:
- Dashboard updates
- Work order status changes
- Alert notifications

```typescript
supabase
  .channel('work-orders')
  .on('postgres_changes', { table: 'work_orders' }, handleChange)
  .subscribe()
```

### 2. Event-Driven (Webhooks)

Used for:
- Auth events (user created, deleted)
- External system notifications

```typescript
// Edge function handler
export async function POST(req: Request) {
  const payload = await req.json()
  await processEvent(payload.type, payload.data)
}
```

### 3. Batch Sync (Scheduled)

Used for:
- ERP synchronization
- Report generation
- Data archival

```sql
-- Cron job via pg_cron or Vercel cron
SELECT sync_to_erp();
```

---

## Security by Integration

| Integration | Auth Method | Data Encrypted | Audit |
|-------------|-------------|----------------|-------|
| Supabase | Service role key | Yes (TLS) | Built-in |
| Vercel | Deploy tokens | Yes (TLS) | Built-in |
| Email | API key | Yes (TLS) | No |
| ERP (planned) | OAuth 2.0 | Yes (TLS) | Yes |
| EDI (planned) | AS2/SFTP | Yes (TLS/SSH) | Yes |
| Portals (planned) | OAuth + API key | Yes (TLS) | Yes |

---

## Integration Roadmap

| Phase | Integration | Timeline |
|-------|-------------|----------|
| Current | Supabase, Vercel, Email | Active |
| Phase 1 | Scanner PWA, Offline mode | Q1 2026 |
| Phase 2 | Comarch Optima | Q2 2026 |
| Phase 3 | EDI Gateway | Q2 2026 |
| Phase 4 | Supplier/Customer Portals | Q3 2026 |
| Phase 5 | Advanced webhooks | Q4 2026 |

---

## Error Handling by Integration

| Integration | Retry Policy | Fallback |
|-------------|--------------|----------|
| Supabase | 3x exponential | Cache read |
| Email | 3x, 5min delay | Queue for retry |
| ERP | 5x, 15min delay | Manual sync |
| EDI | 3x, 1hr delay | Email alert |

---

## Monitoring

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| API latency | Vercel Analytics | > 2s p95 |
| DB connections | Supabase | > 80% pool |
| Auth failures | Supabase | > 10/min |
| Integration errors | App logs | Any failure |
