# API Specification - MonoPilot

**Version:** 1.0
**Date:** 2025-12-09
**Framework:** Next.js 15 App Router
**Status:** BASELINE

---

## 1. Overview

### 1.1 API Architecture

MonoPilot uses **Next.js 15 App Router Route Handlers** for all API endpoints. The architecture follows:

```
Request --> Middleware (Auth) --> Route Handler --> Service Layer --> Database
                                       |
                                       v
                               Response (JSON)
```

### 1.2 Key Characteristics

| Aspect | Implementation |
|--------|----------------|
| Protocol | HTTPS (REST-like) |
| Format | JSON |
| Authentication | Supabase JWT (httpOnly cookie) |
| Authorization | Role-based (owner/admin/user) |
| Validation | Zod schemas |
| Error Format | RFC 7807 Problem Details |
| Versioning | URL path (v1 implicit, v2 when needed) |

---

## 2. API Conventions

### 2.1 URL Structure

```
/api/{module}/{resource}
/api/{module}/{resource}/{id}
/api/{module}/{resource}/{id}/{sub-resource}
/api/{module}/{resource}/{id}/{action}
```

**Examples:**
```
GET    /api/warehouse/license-plates
GET    /api/warehouse/license-plates/123
POST   /api/warehouse/license-plates/123/split
GET    /api/warehouse/license-plates/123/history
GET    /api/technical/products/456/allergens
POST   /api/planning/purchase-orders/789/approve
```

### 2.2 HTTP Methods

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Read resource(s) | Yes | Yes |
| POST | Create resource / Action | No | No |
| PUT | Full update | Yes | No |
| PATCH | Partial update | Yes | No |
| DELETE | Remove resource | Yes | No |

### 2.3 Naming Conventions

- **Resources:** Plural, kebab-case (`license-plates`, `purchase-orders`)
- **Actions:** Verb, kebab-case (`/split`, `/approve`, `/ship`)
- **Query params:** snake_case (`warehouse_id`, `page_size`)
- **JSON fields:** snake_case (`lp_number`, `created_at`)

---

## 3. Request/Response Format

### 3.1 Request Headers

```http
Content-Type: application/json
Accept: application/json
Cookie: sb-access-token=xxx; sb-refresh-token=xxx
```

### 3.2 Standard Response - Success

```json
{
  "data": { /* resource or array */ },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "pages": 2
  }
}
```

### 3.3 Standard Response - Error

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "quantity",
      "message": "Quantity must be greater than 0"
    }
  ],
  "status": 400
}
```

### 3.4 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not authorized for action |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Unique constraint violation |
| 422 | Unprocessable | Business rule violation |
| 500 | Server Error | Unexpected error |

---

## 4. Authentication

### 4.1 Auth Flow

```
1. User logs in via Supabase Auth
2. JWT stored in httpOnly cookies (sb-access-token)
3. Middleware extracts and validates JWT
4. Request proceeds to route handler
5. Service layer verifies org_id access
```

### 4.2 Auth Middleware

```typescript
// middleware.ts
import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*']
}
```

### 4.3 Route Handler Auth Check

```typescript
// Standard pattern in route handlers
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Continue with authenticated request...
}
```

---

## 5. Service Layer Pattern

### 5.1 Service Architecture

```typescript
// lib/services/example-service.ts
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

export async function listItems(filters?: ItemFilters) {
  // Admin client for DB operations (bypasses RLS)
  const supabaseAdmin = createServerSupabaseAdmin()
  const orgId = await getCurrentOrgId()

  const { data, error } = await supabaseAdmin
    .from('items')
    .select('*')
    .eq('org_id', orgId)
    .order('name')

  return { success: !error, data, error }
}

export async function createItem(input: CreateItemInput) {
  const supabase = await createServerSupabase()
  const supabaseAdmin = createServerSupabaseAdmin()

  // Auth client for user info
  const { data: { user } } = await supabase.auth.getUser()
  const orgId = await getCurrentOrgId()

  // Admin client for INSERT
  const { data, error } = await supabaseAdmin
    .from('items')
    .insert({
      org_id: orgId,
      ...input,
      created_by: user?.id
    })
    .select()
    .single()

  return { success: !error, data, error }
}
```

### 5.2 getCurrentOrgId Helper

```typescript
export async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  return userData?.org_id || null
}
```

---

## 6. Validation Pattern

### 6.1 Zod Schema

```typescript
// lib/validations/item-schema.ts
import { z } from 'zod'

export const createItemSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(1).max(255),
  quantity: z.number().positive(),
  status: z.enum(['active', 'inactive']).default('active')
})

export type CreateItemInput = z.infer<typeof createItemSchema>
```

### 6.2 Route Handler Validation

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Validate
  const parsed = createItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: parsed.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    }, { status: 400 })
  }

  // Process valid input
  const result = await createItem(parsed.data)
  // ...
}
```

---

## 7. Pagination Pattern

### 7.1 Request

```http
GET /api/technical/products?page=2&limit=25&search=flour&type=RM
```

### 7.2 Response

```json
{
  "data": [
    { "id": "...", "code": "RM-001", "name": "Flour" }
  ],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 25,
    "pages": 6
  }
}
```

### 7.3 Implementation

```typescript
export async function listProducts(filters: ProductFilters) {
  const supabaseAdmin = createServerSupabaseAdmin()
  const orgId = await getCurrentOrgId()

  const page = filters.page || 1
  const limit = Math.min(filters.limit || 50, 100)
  const offset = (page - 1) * limit

  // Count total
  const { count } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)

  // Get page
  let query = supabaseAdmin
    .from('products')
    .select('*')
    .eq('org_id', orgId)
    .range(offset, offset + limit - 1)
    .order('name')

  if (filters.search) {
    query = query.or(`code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  return {
    data,
    meta: {
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit)
    }
  }
}
```

---

## 8. Error Handling

### 8.1 Error Types

```typescript
// lib/errors.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number = 400,
    public details?: any[]
  ) {
    super(message)
  }
}

export class ValidationError extends ApiError {
  constructor(details: any[]) {
    super('VALIDATION_ERROR', 'Validation failed', 400, details)
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404)
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super('CONFLICT', message, 409)
  }
}

export class BusinessRuleError extends ApiError {
  constructor(message: string) {
    super('BUSINESS_RULE_VIOLATION', message, 422)
  }
}
```

### 8.2 Error Handler

```typescript
export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({
      error: error.message,
      code: error.code,
      details: error.details
    }, { status: error.status })
  }

  console.error('Unexpected error:', error)
  return NextResponse.json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  }, { status: 500 })
}
```

---

## 9. API Modules

### 9.1 Settings Module (`/api/settings/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/settings/warehouses` | GET | List warehouses |
| `/api/settings/warehouses` | POST | Create warehouse |
| `/api/settings/warehouses/:id` | GET | Get warehouse |
| `/api/settings/warehouses/:id` | PUT | Update warehouse |
| `/api/settings/warehouses/:id` | DELETE | Delete warehouse |
| `/api/settings/locations` | GET | List locations |
| `/api/settings/locations` | POST | Create location |
| `/api/settings/locations/:id` | PUT | Update location |
| `/api/settings/machines` | GET/POST | Machines CRUD |
| `/api/settings/lines` | GET/POST | Production lines CRUD |
| `/api/settings/allergens` | GET/POST | Allergens CRUD |
| `/api/settings/tax-codes` | GET/POST | Tax codes CRUD |
| `/api/settings/users` | GET | List users |
| `/api/settings/users/:id` | PUT | Update user role |
| `/api/settings/invitations` | GET/POST | Invitations |
| `/api/settings/organization` | GET/PUT | Organization settings |
| `/api/settings/modules` | GET/PUT | Module enable/disable |

### 9.2 Technical Module (`/api/technical/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/technical/products` | GET | List products (paginated) |
| `/api/technical/products` | POST | Create product |
| `/api/technical/products/:id` | GET/PUT/DELETE | Product CRUD |
| `/api/technical/products/:id/allergens` | GET/POST/DELETE | Product allergens |
| `/api/technical/products/:id/history` | GET | Version history |
| `/api/technical/boms` | GET/POST | BOMs list/create |
| `/api/technical/boms/:id` | GET/PUT/DELETE | BOM CRUD |
| `/api/technical/boms/:id/items` | GET/POST | BOM items |
| `/api/technical/boms/:id/items/:itemId` | PUT/DELETE | BOM item update |
| `/api/technical/boms/:id/clone` | POST | Clone BOM |
| `/api/technical/boms/:id/allergens` | GET | Calculated allergens |
| `/api/technical/routings` | GET/POST | Routings |
| `/api/technical/routings/:id/operations` | GET/POST | Routing operations |
| `/api/technical/tracing/forward` | POST | Forward trace |
| `/api/technical/tracing/backward` | POST | Backward trace |
| `/api/technical/settings` | GET/PUT | Technical settings |

### 9.3 Planning Module (`/api/planning/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/planning/suppliers` | GET/POST | Suppliers |
| `/api/planning/suppliers/:id` | GET/PUT/DELETE | Supplier CRUD |
| `/api/planning/suppliers/:id/products` | GET/POST | Supplier products |
| `/api/planning/purchase-orders` | GET/POST | POs |
| `/api/planning/purchase-orders/:id` | GET/PUT | PO CRUD |
| `/api/planning/purchase-orders/:id/lines` | GET/POST | PO lines |
| `/api/planning/purchase-orders/:id/approve` | POST | Approve PO |
| `/api/planning/purchase-orders/:id/reject` | POST | Reject PO |
| `/api/planning/transfer-orders` | GET/POST | TOs |
| `/api/planning/transfer-orders/:id/ship` | POST | Ship TO |

### 9.4 Warehouse Module (`/api/warehouse/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/warehouse/license-plates` | GET | List LPs |
| `/api/warehouse/license-plates` | POST | Create LP |
| `/api/warehouse/license-plates/:id` | GET/PUT | LP CRUD |
| `/api/warehouse/license-plates/:id/split` | POST | Split LP |
| `/api/warehouse/license-plates/merge` | POST | Merge LPs |
| `/api/warehouse/license-plates/:id/print` | POST | Print label |
| `/api/warehouse/license-plates/:id/genealogy` | GET | LP genealogy |
| `/api/warehouse/license-plates/:id/history` | GET | Movement history |
| `/api/warehouse/grns` | GET/POST | GRNs |
| `/api/warehouse/grns/:id` | GET | GRN detail |
| `/api/warehouse/grns/:id/receive` | POST | Complete receipt |
| `/api/warehouse/stock-movements` | GET/POST | Stock movements |
| `/api/warehouse/settings` | GET/PUT | Warehouse settings |

### 9.5 Scanner Module (`/api/scanner/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scanner/pending-receipts` | GET | Pending PO/TO for receipt |
| `/api/scanner/receive` | POST | Quick receive |
| `/api/scanner/move` | POST | Quick move LP |
| `/api/scanner/split` | POST | Quick split LP |
| `/api/scanner/lp/:barcode` | GET | Lookup LP by barcode |
| `/api/scanner/location/:barcode` | GET | Lookup location |
| `/api/scanner/product/:barcode` | GET | Lookup product |

### 9.6 Production Module (`/api/production/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/production/work-orders` | GET/POST | Work orders |
| `/api/production/work-orders/:id` | GET/PUT | WO CRUD |
| `/api/production/work-orders/:id/start` | POST | Start WO |
| `/api/production/work-orders/:id/pause` | POST | Pause WO |
| `/api/production/work-orders/:id/complete` | POST | Complete WO |
| `/api/production/work-orders/:id/materials` | GET | WO materials |
| `/api/production/work-orders/:id/reserve` | POST | Reserve materials |
| `/api/production/work-orders/:id/consume` | POST | Consume materials |
| `/api/production/work-orders/:id/output` | POST | Register output |
| `/api/production/dashboard` | GET | Production dashboard |

### 9.7 Quality Module (`/api/quality/*`) - Phase 2

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/quality/license-plates/:id/qa-status` | PUT | Update QA status |
| `/api/quality/holds` | GET/POST | Quality holds |
| `/api/quality/holds/:id/release` | POST | Release hold |
| `/api/quality/specifications` | GET/POST | Specifications |
| `/api/quality/tests` | GET/POST | Quality tests |
| `/api/quality/ncrs` | GET/POST | NCRs |
| `/api/quality/ncrs/:id/close` | POST | Close NCR |
| `/api/quality/dashboard` | GET | QA dashboard |

### 9.8 Shipping Module (`/api/shipping/*`) - Phase 2

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/shipping/sales-orders` | GET/POST | Sales orders |
| `/api/shipping/sales-orders/:id/confirm` | POST | Confirm SO |
| `/api/shipping/shipments` | GET/POST | Shipments |
| `/api/shipping/shipments/:id/ship` | POST | Mark shipped |
| `/api/shipping/pick-lists` | GET/POST | Pick lists |
| `/api/shipping/pick-lists/:id/complete` | POST | Complete pick |
| `/api/shipping/packages` | GET/POST | Packages |

---

## 10. Rate Limiting

### 10.1 Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Auth endpoints | 5 | 15 min |
| Mutation (POST/PUT/DELETE) | 100 | 1 hour |
| Read (GET) | 300 | 1 hour |
| Scanner operations | 500 | 1 hour |

### 10.2 Implementation

```typescript
// Using Upstash Rate Limit
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'),
  analytics: true
})

export async function rateLimitMiddleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const { success, limit, reset, remaining } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED'
    }, {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString()
      }
    })
  }
}
```

---

## 11. Webhook APIs

### 11.1 Auth Webhook

```
POST /api/webhooks/auth
```

**Triggers:** Supabase Auth events (user.created, user.updated, user.deleted)

**Payload:**
```json
{
  "type": "user.created",
  "record": {
    "id": "user-uuid",
    "email": "user@example.com",
    "raw_app_meta_data": { "org_id": "org-uuid" }
  }
}
```

### 11.2 Webhook Security

```typescript
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-supabase-signature')
  const body = await request.text()

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Process webhook...
}
```

---

## 12. Cron Jobs

### 12.1 Cleanup Invitations

```
GET /api/cron/cleanup-invitations
```

**Schedule:** Daily at 00:00 UTC (Vercel Cron)

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

### 12.2 Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-invitations",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## 13. API Testing

### 13.1 Test Pattern

```typescript
// __tests__/api/products.test.ts
import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/technical/products/route'

describe('Products API', () => {
  it('should list products', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toBeInstanceOf(Array)
  })

  it('should validate required fields', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: { name: 'Test' } // Missing code
    })
    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })
})
```

---

## 14. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | Architect | Initial API specification |
