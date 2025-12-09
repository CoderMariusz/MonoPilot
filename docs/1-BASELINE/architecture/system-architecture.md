# System Architecture - MonoPilot

**Version:** 1.0
**Date:** 2025-12-09
**Status:** BASELINE

---

## 1. Overview

MonoPilot to system MES/ERP dla przemyslu spozywczego (food manufacturing), zoptymalizowany pod katem:
- Multi-tenancy z izolacja danych per organizacja
- License Plate (LP) based inventory tracking
- FDA/HACCP traceability compliance
- Mobile-first scanner workflows

### 1.1 System Context

```
+-------------------+       +-------------------+       +-------------------+
|   Web Browser     |       |   Mobile Device   |       |   Zebra Scanner   |
|   (Desktop UI)    |       |   (Scanner PWA)   |       |   (ZPL Print)     |
+--------+----------+       +--------+----------+       +--------+----------+
         |                           |                           |
         +---------------------------+---------------------------+
                                     |
                            +--------v--------+
                            |    Vercel CDN   |
                            |   (Edge Cache)  |
                            +--------+--------+
                                     |
                            +--------v--------+
                            |   Next.js 15    |
                            |   App Router    |
                            |  (API Routes)   |
                            +--------+--------+
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
+--------v--------+         +--------v--------+         +--------v--------+
|  Supabase Auth  |         | Supabase DB     |         |  Upstash Redis  |
|  (JWT/RLS)      |         | (PostgreSQL)    |         |  (Cache/Queue)  |
+-----------------+         +--------+--------+         +-----------------+
                                     |
                            +--------v--------+
                            | Supabase Storage|
                            | (Files/Images)  |
                            +-----------------+
```

---

## 2. Architecture Layers

### 2.1 High-Level Architecture (ASCII)

```
+==============================================================================+
|                              PRESENTATION LAYER                               |
+------------------------------------------------------------------------------+
|  Desktop UI (React 19)     |  Scanner PWA (React 19)  |  Print Service       |
|  - Settings Pages          |  - Receive Workflow      |  - ZPL Generation    |
|  - Technical Pages         |  - Move Workflow         |  - Label Templates   |
|  - Planning Pages          |  - Pick Workflow         |  - Zebra Integration |
|  - Warehouse Pages         |  - Pack Workflow         |                      |
|  - Production Pages        |  - Count Workflow        |                      |
|  - Dashboard               |  - QA Workflow           |                      |
+==============================================================================+
                                       |
                                       v
+==============================================================================+
|                                 API LAYER                                     |
+------------------------------------------------------------------------------+
|  Next.js 15 App Router - Route Handlers (/api/*)                             |
|  +-----------------+  +-----------------+  +-----------------+               |
|  | /api/settings/* |  | /api/technical/*|  | /api/planning/* |               |
|  +-----------------+  +-----------------+  +-----------------+               |
|  +-----------------+  +-----------------+  +-----------------+               |
|  | /api/warehouse/*|  | /api/production |  | /api/quality/*  |               |
|  +-----------------+  +-----------------+  +-----------------+               |
|  +-----------------+  +-----------------+  +-----------------+               |
|  | /api/shipping/* |  | /api/scanner/*  |  | /api/dashboard/*|               |
|  +-----------------+  +-----------------+  +-----------------+               |
+==============================================================================+
                                       |
                                       v
+==============================================================================+
|                               SERVICE LAYER                                   |
+------------------------------------------------------------------------------+
|  lib/services/*.ts                                                           |
|  +-------------------+  +-------------------+  +-------------------+          |
|  | warehouse-service |  | lp-service        |  | grn-service       |          |
|  +-------------------+  +-------------------+  +-------------------+          |
|  +-------------------+  +-------------------+  +-------------------+          |
|  | work-order-service|  | purchase-order-svc|  | traceability-svc  |          |
|  +-------------------+  +-------------------+  +-------------------+          |
|  +-------------------+  +-------------------+  +-------------------+          |
|  | bom-service       |  | routing-service   |  | invitation-service|          |
|  +-------------------+  +-------------------+  +-------------------+          |
+==============================================================================+
                                       |
                                       v
+==============================================================================+
|                             DATA ACCESS LAYER                                 |
+------------------------------------------------------------------------------+
|  +-------------------+  +-------------------+  +-------------------+          |
|  | Supabase Admin    |  | Supabase Auth     |  | Upstash Redis     |          |
|  | Client (Service)  |  | Client (User)     |  | Client            |          |
|  +-------------------+  +-------------------+  +-------------------+          |
|                                                                               |
|  RLS Policy Pattern:                                                          |
|  - Service layer uses Admin Client (bypasses RLS)                            |
|  - Manual org_id filtering in queries                                        |
|  - Auth Client only for authentication operations                            |
+==============================================================================+
                                       |
                                       v
+==============================================================================+
|                             PERSISTENCE LAYER                                 |
+------------------------------------------------------------------------------+
|  PostgreSQL (Supabase)              |  Redis (Upstash)                       |
|  +-----------------------------+    |  +-----------------------------+       |
|  | organizations               |    |  | session:blacklist:*         |       |
|  | users                       |    |  | cache:warehouses:*          |       |
|  | warehouses, locations       |    |  | cache:dashboard:*           |       |
|  | products, boms, routings    |    |  | queue:print:*               |       |
|  | license_plates, grns        |    |  | queue:email:*               |       |
|  | work_orders, purchase_orders|    |  +-----------------------------+       |
|  | stock_movements, lp_genealogy    |                                        |
|  +-----------------------------+    |  Supabase Storage                      |
|                                     |  +-----------------------------+       |
|                                     |  | logos/*                      |       |
|                                     |  | documents/*                  |       |
|                                     |  | coa/*                        |       |
|                                     |  +-----------------------------+       |
+==============================================================================+
```

---

## 3. Tech Stack Details

### 3.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.x | React framework, App Router, SSR/SSG |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | latest | UI component library |
| React Hook Form | 7.x | Form management |
| Zod | 3.x | Schema validation |
| TanStack Query | 5.x | Server state management |
| Lucide Icons | latest | Icon library |

### 3.2 Backend (Next.js API Routes)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js Route Handlers | 15.x | API endpoints |
| Supabase JS | 2.x | Database client |
| Zod | 3.x | Request validation |
| date-fns | 3.x | Date manipulation |
| nanoid | 5.x | ID generation |

### 3.3 Database & Storage

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 15.x | Primary database (Supabase) |
| Supabase Auth | - | Authentication, JWT |
| Supabase Storage | - | File storage (S3-compatible) |
| Upstash Redis | - | Caching, session blacklist |

### 3.4 Infrastructure

| Technology | Purpose |
|------------|---------|
| Vercel | Frontend hosting, Edge Functions |
| Supabase | Database, Auth, Storage |
| Upstash | Redis, Rate limiting |
| SendGrid | Email delivery |

---

## 4. Deployment Architecture

```
                    +-------------------+
                    |    DNS/Domain     |
                    |  monopilot.app    |
                    +--------+----------+
                             |
                    +--------v----------+
                    |   Vercel Edge     |
                    |   Network (CDN)   |
                    +--------+----------+
                             |
         +-------------------+-------------------+
         |                                       |
+--------v----------+               +-----------v-----------+
|  Vercel Serverless|               |   Vercel Edge         |
|  Functions        |               |   Middleware          |
|  (API Routes)     |               |   (Auth Check)        |
+--------+----------+               +-----------------------+
         |
         +-------------------+-------------------+
         |                   |                   |
+--------v--------+ +--------v--------+ +--------v--------+
|  Supabase       | |  Supabase       | |  Upstash        |
|  (eu-central-1) | |  Storage        | |  Redis          |
|  PostgreSQL     | |  (Files)        | |  (Global)       |
+-----------------+ +-----------------+ +-----------------+
```

### 4.1 Environment Configuration

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# SendGrid
SENDGRID_API_KEY=SG.xxx

# App
NEXT_PUBLIC_APP_URL=https://monopilot.app
```

---

## 5. Multi-Tenancy Pattern

### 5.1 Data Isolation Strategy

MonoPilot uses **Row Level Security (RLS)** combined with **org_id** column on every tenant-scoped table.

```sql
-- Every table has org_id
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    -- other columns...
);

-- RLS Policy Example
CREATE POLICY products_org_isolation ON products
    FOR ALL
    USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
        OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
    );
```

### 5.2 Service Layer Pattern

```typescript
// Service always uses Admin Client + manual org_id filtering
export async function listProducts(filters?: ProductFilters) {
  const supabaseAdmin = createServerSupabaseAdmin()
  const orgId = await getCurrentOrgId()

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('org_id', orgId)  // Manual org isolation
    .order('name')

  return { success: !error, data, error }
}
```

### 5.3 Why Admin Client?

| Approach | Pros | Cons |
|----------|------|------|
| Auth Client + RLS | Auto-enforced isolation | JWT must have org_id, user re-login needed |
| Admin Client + Manual | Reliable, no JWT dependency | Must remember to filter |

**Decision:** Use Admin Client with manual `org_id` filtering for reliability.

---

## 6. Caching Strategy

### 6.1 Cache Layers

```
+-------------------+     +-------------------+     +-------------------+
|   Browser Cache   | --> |   Vercel Edge     | --> |   Upstash Redis   |
|   (SWR/React Q)   |     |   (CDN Cache)     |     |   (Server Cache)  |
+-------------------+     +-------------------+     +-------------------+
```

### 6.2 Cache Patterns

| Data Type | Cache Location | TTL | Invalidation |
|-----------|---------------|-----|--------------|
| Static assets | Vercel CDN | 1 year | Build hash |
| Dashboard metrics | Redis | 5 min | Manual |
| Warehouse list | Redis | 15 min | On mutation |
| Session blacklist | Redis | 24h | On logout |
| Product list | SWR | 30s stale | On mutation |

### 6.3 Redis Key Structure

```
session:blacklist:{sessionId}     -> "1" (TTL: 24h)
cache:warehouses:{orgId}          -> JSON (TTL: 15min)
cache:dashboard:{orgId}           -> JSON (TTL: 5min)
queue:print:{orgId}:{timestamp}   -> JSON (no TTL)
```

---

## 7. Security Architecture

### 7.1 Authentication Flow

```
+----------+     +----------+     +----------+     +----------+
|  User    | --> | Next.js  | --> | Supabase | --> | Database |
|  Login   |     | API      |     | Auth     |     | users    |
+----------+     +----------+     +----------+     +----------+
     |                                  |
     |          JWT Token               |
     |<---------------------------------|
     |
     +----------> Store in httpOnly cookie
```

### 7.2 Authorization Layers

| Layer | Mechanism | Scope |
|-------|-----------|-------|
| API Route | Middleware | Check session exists |
| Service | getCurrentOrgId() | Verify user belongs to org |
| Database | RLS (backup) | Final safety net |
| UI | Role check | Hide/show features |

### 7.3 Role-Based Access

```typescript
enum UserRole {
  OWNER = 'owner',    // Full access
  ADMIN = 'admin',    // Settings + all modules
  USER = 'user'       // Module access only
}

// Permission check in routes
const user = await getCurrentUser()
if (user.role !== 'admin' && user.role !== 'owner') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## 8. Module Architecture

### 8.1 Module Dependency Graph

```
+-------------------+
|     Settings      |  <-- Foundation module (always enabled)
|  (Epic 1 - 100%)  |
+--------+----------+
         |
         v
+-------------------+
|    Technical      |  <-- Core product data
|  (Epic 2 - 100%)  |
+--------+----------+
         |
    +----+----+
    |         |
    v         v
+--------+ +--------+
|Planning| |Warehouse|  <-- Operations modules
|(Epic 3)| |(Epic 5) |
| 100%   | | 92%     |
+---+----+ +----+----+
    |           |
    +-----+-----+
          |
          v
    +-----+-----+
    | Production|  <-- Manufacturing execution
    | (Epic 4)  |
    |   85%     |
    +-----+-----+
          |
    +-----+-----+
    |           |
    v           v
+--------+ +--------+
| Quality| |Shipping|  <-- Phase 2 modules
|(Epic 6)| |(Epic 7)|
|PLANNED | |PLANNED |
+--------+ +--------+
```

### 8.2 Module Enable/Disable

```typescript
// Organization has modules_enabled array
interface Organization {
  modules_enabled: ('settings' | 'technical' | 'planning' |
                   'warehouse' | 'production' | 'quality' | 'shipping')[]
}

// Middleware checks module access
if (!org.modules_enabled.includes('warehouse')) {
  redirect('/dashboard')
}
```

---

## 9. Integration Architecture

### 9.1 Internal Module Integrations

```
Planning (PO) ----creates----> Warehouse (GRN) ----creates----> LP
                                    ^
                                    |
Production (WO) ----consumes/produces----> LP ----genealogy----> Traceability
                                    |
                                    v
Quality (QA) ----validates----> LP.qa_status
                                    |
                                    v
Shipping (Pick) ----ships----> LP.status = 'shipped'
```

### 9.2 External Integration Points (Phase 2+)

| Integration | Protocol | Purpose | Phase |
|-------------|----------|---------|-------|
| Zebra Printers | ZPL/IPP | Label printing | Phase 1 (partial) |
| GS1 Barcodes | GS1-128 | Barcode generation | Phase 2 |
| Accounting (Comarch) | REST API | Invoice sync | Phase 3 |
| EDI | AS2/EDIFACT | B2B orders | Phase 3 |
| Carrier APIs | REST | Shipping labels | Phase 3 |

---

## 10. Scalability Considerations

### 10.1 Current Limits (Single-Region)

| Resource | Limit | Notes |
|----------|-------|-------|
| Concurrent users | ~500 | Vercel Serverless |
| Database connections | 100 | Supabase pooler |
| File storage | 100GB | Supabase Storage |
| Redis operations | 10K/day | Upstash free tier |

### 10.2 Scaling Path

1. **Vertical:** Upgrade Supabase/Vercel plans
2. **Horizontal:** Enable read replicas
3. **Regional:** Multi-region Supabase (future)
4. **Sharding:** Per-org database (enterprise)

---

## 11. Monitoring & Observability

### 11.1 Current Stack

| Tool | Purpose |
|------|---------|
| Vercel Analytics | Performance, Web Vitals |
| Supabase Dashboard | Database metrics |
| Upstash Console | Redis metrics |
| Browser DevTools | Client debugging |

### 11.2 Logging Pattern

```typescript
// Structured logging in services
console.log(JSON.stringify({
  level: 'info',
  service: 'lp-service',
  action: 'createLP',
  orgId: orgId,
  lpNumber: lp.lp_number,
  timestamp: new Date().toISOString()
}))
```

---

## 12. Disaster Recovery

### 12.1 Backup Strategy

| Data | Backup | Retention | RTO |
|------|--------|-----------|-----|
| PostgreSQL | Supabase daily | 7 days | 1h |
| File Storage | Supabase | 30 days | 4h |
| Redis | Not backed up | N/A | Regenerate |
| Code | GitHub | Unlimited | 15min |

### 12.2 Recovery Procedures

1. **Database:** Point-in-time recovery via Supabase
2. **Storage:** Restore from Supabase backup
3. **Application:** Redeploy from GitHub main branch

---

## 13. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | Architect | Initial baseline architecture |
