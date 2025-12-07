# Infrastructure Architecture

## Overview

MonoPilot infrastructure is designed for cloud-native deployment with future self-hosting capability.

## Hosting Strategy

### Current (MVP)
- **Frontend**: Vercel (Edge Network, automatic scaling)
- **Database**: Supabase (managed PostgreSQL)
- **Cache**: Upstash Redis (serverless)

### Future Options
- Docker self-hosting for on-premise enterprise
- Kubernetes for large-scale deployments

## Multi-Tenant Architecture

### Standard Tenants
```
┌─────────────────────────────────────┐
│     Single Supabase Project         │
├─────────────────────────────────────┤
│  org_1  │  org_2  │  org_3  │ ...   │
│  (RLS)  │  (RLS)  │  (RLS)  │       │
└─────────────────────────────────────┘
```

- All tenants share same database
- Row Level Security (RLS) enforces isolation
- Cost-effective for SMB customers

### Enterprise Tenants
```
┌──────────────┐  ┌──────────────┐
│  Enterprise  │  │  Enterprise  │
│  Project A   │  │  Project B   │
└──────────────┘  └──────────────┘
```

- Dedicated Supabase project per enterprise
- Separate connection strings
- Custom backup policies
- Compliance isolation (SOC2, HIPAA)

## Database Configuration

### Connection Pooling
```typescript
// Supabase handles pooling via PgBouncer
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
})
```

### Read Replicas
- Enabled on start for read-heavy operations
- Automatic failover
- Used for: reports, dashboards, exports

### Indexes Strategy
Priority tables for composite indexes:
- `stock_moves` (org_id, created_at, from_location_id, to_location_id)
- `license_plates` (org_id, status, product_id, expiry_date)
- `wo_materials` (wo_id, product_id, status)
- `production_outputs` (wo_id, created_at)

## Caching Architecture

### Cache Layers
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │ ──► │   Upstash   │ ──► │  Supabase   │
│   (SWR)     │     │   Redis     │     │  PostgreSQL │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Cached Data
| Data Type | TTL | Invalidation |
|-----------|-----|--------------|
| Product catalog | 5 min | On product update |
| BOM lookups | 5 min | On BOM update |
| Settings | 10 min | On settings update |
| User permissions | 5 min | On role change |

### Cache Invalidation Strategy
```typescript
// Individual key invalidation
async function invalidateProductCache(orgId: string, productId: string) {
  await redis.del(`product:${orgId}:${productId}`)
  await redis.del(`product-list:${orgId}`)
}

// Pattern-based invalidation
async function invalidateBomCache(orgId: string, productId: string) {
  const keys = await redis.keys(`bom:${orgId}:${productId}:*`)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}
```

## Edge Functions (Phase 2)

### Use Cases
- Webhook processing
- ML model inference
- Scheduled tasks (cleanup, notifications)
- Real-time aggregations

### Architecture
```typescript
// Supabase Edge Function example
Deno.serve(async (req) => {
  const { product_id } = await req.json()

  // ML prediction
  const prediction = await runModel(product_id)

  return new Response(JSON.stringify(prediction))
})
```

## Real-time Architecture (Post-MVP)

### Supabase Realtime Channels
```typescript
// Subscribe to WO status changes
const channel = supabase
  .channel('wo-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'work_orders',
      filter: `org_id=eq.${orgId}`,
    },
    (payload) => {
      updateWOStatus(payload.new)
    }
  )
  .subscribe()
```

### Real-time Tables (Post-MVP)
- `work_orders` - status changes after machine integration
- Future: `license_plates`, `production_outputs`

## Deployment Pipeline

### Environments
| Environment | Branch | Database | Purpose |
|-------------|--------|----------|---------|
| Development | feature/* | dev-db | Local development |
| Staging | develop | staging-db | QA testing |
| Production | main | prod-db | Live system |

### CI/CD Flow
```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  Push   │ ──► │  Tests  │ ──► │ Deploy  │
│         │     │ Lint    │     │ Vercel  │
└─────────┘     │ Type    │     └─────────┘
                └─────────┘
```

### Preview Deployments
- Automatic for PRs
- Dedicated preview URL
- Isolated from production data

## Monitoring & Observability

### Logging
```typescript
// Structured JSON logging
const log = {
  level: 'info',
  message: 'WO created',
  timestamp: new Date().toISOString(),
  org_id: orgId,
  wo_id: woId,
  user_id: userId,
  metadata: { ... }
}
```

### Metrics (Phase 3)
- APM integration
- Custom dashboards
- Alerting rules

### Health Checks
```typescript
// API health endpoint
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    cache: await checkRedis(),
    auth: await checkAuth(),
  }

  const healthy = Object.values(checks).every(c => c.status === 'ok')

  return Response.json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
  })
}
```

## Backup & Recovery

### Supabase Backups
- Daily automated backups
- Point-in-time recovery (7 days)
- Cross-region replication (enterprise)

### Application State
- No server-side sessions (JWT-based)
- All state in database or cache
- Stateless deployments

## Security Infrastructure

### Network
- HTTPS everywhere (Vercel default)
- Supabase connection via SSL
- No direct database access

### Secrets Management
- Vercel environment variables
- Supabase vault for sensitive data
- No secrets in code

## Scaling Considerations

### Horizontal Scaling
- Vercel auto-scales frontend
- Supabase handles connection pooling
- Redis scales with Upstash

### Vertical Scaling
- Database compute upgrade path
- Cache memory increase
- Read replica addition

### Future Considerations
- Sharding for very large tenants
- Regional deployments
- CDN for static assets
