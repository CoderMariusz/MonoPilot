# API Architecture

## Overview

RESTful API built with Next.js API routes, designed for easy GraphQL migration in future phases.

## API Pattern

### Class-Based Services
```typescript
// apps/frontend/lib/api/WorkOrdersAPI.ts
export class WorkOrdersAPI {
  private static client = createClient()

  static async getAll(filters?: WOFilters): Promise<WorkOrder[]> {
    let query = this.client
      .from('work_orders')
      .select('*, product:products(*)')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw new APIError(error)
    return data
  }

  static async getById(id: string): Promise<WorkOrder | null> {
    const { data, error } = await this.client
      .from('work_orders')
      .select('*, product:products(*), materials:wo_materials(*)')
      .eq('id', id)
      .single()

    if (error) throw new APIError(error)
    return data
  }

  static async create(data: CreateWOInput): Promise<WorkOrder> {
    // Validate with Zod
    const validated = createWOSchema.parse(data)

    const { data: wo, error } = await this.client
      .from('work_orders')
      .insert(validated)
      .select()
      .single()

    if (error) throw new APIError(error)
    return wo
  }

  static async updateStatus(id: string, status: WOStatus): Promise<WorkOrder> {
    // Business logic validation
    await this.validateStatusTransition(id, status)

    const { data, error } = await this.client
      .from('work_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new APIError(error)
    return data
  }

  // 15+ methods per API class...
}
```

### API Route Handler
```typescript
// apps/frontend/app/api/work-orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { WorkOrdersAPI } from '@/lib/api/WorkOrdersAPI'
import { createWOSchema } from '@/lib/schemas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      status: searchParams.get('status'),
      from_date: searchParams.get('from_date'),
      to_date: searchParams.get('to_date'),
    }

    const workOrders = await WorkOrdersAPI.getAll(filters)
    return NextResponse.json(workOrders)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const workOrder = await WorkOrdersAPI.create(body)
    return NextResponse.json(workOrder, { status: 201 })
  } catch (error) {
    return handleAPIError(error)
  }
}
```

## Validation Architecture

### Dual Validation (Client + Server)
```typescript
// packages/shared/src/schemas.ts
import { z } from 'zod'

export const createWOSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
  uom: z.string().min(1),
  scheduled_date: z.string().datetime(),
  production_line_id: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
})

export type CreateWOInput = z.infer<typeof createWOSchema>

// Client-side validation
const validated = createWOSchema.safeParse(formData)
if (!validated.success) {
  setErrors(validated.error.flatten())
  return
}

// Server-side validation (always re-validate)
const serverValidated = createWOSchema.parse(body)
```

### Schema Locations
- `packages/shared/src/schemas.ts` - Shared validation schemas
- `apps/frontend/lib/types.ts` - API response types
- `apps/frontend/lib/supabase/generated.types.ts` - Database types

## Error Handling

### RFC 7807 Problem Details
```typescript
// apps/frontend/lib/api/errors.ts
interface ProblemDetails {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
  errors?: Record<string, string[]>
}

export class APIError extends Error {
  constructor(
    public status: number,
    public type: string,
    public detail: string,
    public errors?: Record<string, string[]>
  ) {
    super(detail)
    this.name = 'APIError'
  }

  toProblemDetails(): ProblemDetails {
    return {
      type: `https://monopilot.app/errors/${this.type}`,
      title: this.message,
      status: this.status,
      detail: this.detail,
      errors: this.errors,
    }
  }
}

// Usage
export function handleAPIError(error: unknown): NextResponse {
  if (error instanceof APIError) {
    return NextResponse.json(error.toProblemDetails(), { status: error.status })
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json({
      type: 'https://monopilot.app/errors/validation',
      title: 'Validation Error',
      status: 400,
      detail: 'Request validation failed',
      errors: error.flatten().fieldErrors,
    }, { status: 400 })
  }

  // Unknown error
  console.error('Unhandled error:', error)
  return NextResponse.json({
    type: 'https://monopilot.app/errors/internal',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred',
  }, { status: 500 })
}
```

### Error Types
| Type | Status | Description |
|------|--------|-------------|
| validation | 400 | Input validation failed |
| not_found | 404 | Resource not found |
| conflict | 409 | Business rule violation |
| forbidden | 403 | Permission denied |
| rate_limit | 429 | Too many requests |
| internal | 500 | Unexpected error |

## Rate Limiting

### Per-Organization Limits
```typescript
// apps/frontend/middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
})

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const orgId = getOrgIdFromToken(request)
    const identifier = `api:${orgId}`

    const { success, limit, remaining } = await ratelimit.limit(identifier)

    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
        },
      })
    }
  }

  return NextResponse.next()
}
```

### Endpoint-Specific Limits
```typescript
// Higher limits for read operations
const readLimiter = Ratelimit.slidingWindow(500, '1 m')
// Lower limits for write operations
const writeLimiter = Ratelimit.slidingWindow(50, '1 m')
```

## API Versioning

### URL Versioning (When Needed)
```
/api/v1/work-orders
/api/v2/work-orders
```

### Breaking Change Handling
```typescript
// Support both versions during transition
export async function GET(request: NextRequest) {
  const version = request.headers.get('API-Version') || '1'

  if (version === '2') {
    return handleV2(request)
  }

  return handleV1(request)
}
```

### Deprecation Headers
```typescript
return NextResponse.json(data, {
  headers: {
    'Deprecation': 'true',
    'Sunset': 'Sat, 31 Dec 2025 23:59:59 GMT',
    'Link': '</api/v2/work-orders>; rel="successor-version"',
  },
})
```

## External Integrations

### Webhook System
```typescript
// apps/frontend/lib/api/webhooks.ts
interface WebhookConfig {
  id: string
  org_id: string
  url: string
  events: string[]
  secret: string
  active: boolean
}

export async function dispatchWebhook(
  event: string,
  payload: unknown,
  orgId: string
) {
  const webhooks = await getActiveWebhooks(orgId, event)

  for (const webhook of webhooks) {
    const signature = createHmacSignature(payload, webhook.secret)

    await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MonoPilot-Event': event,
        'X-MonoPilot-Signature': signature,
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      }),
    })
  }
}

// Event types
type WebhookEvent =
  | 'work_order.created'
  | 'work_order.completed'
  | 'purchase_order.received'
  | 'quality.ncr_created'
  | 'shipping.dispatched'
```

### OAuth2 for Third-Party Apps
```typescript
// apps/frontend/app/api/oauth/authorize/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const redirectUri = searchParams.get('redirect_uri')
  const scope = searchParams.get('scope')

  // Validate client
  const client = await getOAuthClient(clientId)
  if (!client || !client.redirect_uris.includes(redirectUri)) {
    return NextResponse.redirect('/error?code=invalid_client')
  }

  // Show consent screen
  return NextResponse.redirect(`/oauth/consent?${searchParams}`)
}
```

### API Keys for M2M
```typescript
// Machine-to-machine authentication
export async function validateAPIKey(request: NextRequest): Promise<string | null> {
  const apiKey = request.headers.get('X-API-Key')
  if (!apiKey) return null

  const { data } = await supabase
    .from('api_keys')
    .select('org_id')
    .eq('key_hash', hashKey(apiKey))
    .eq('active', true)
    .single()

  return data?.org_id || null
}
```

## Response Patterns

### List Response
```typescript
interface ListResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}
```

### Single Resource
```typescript
interface ResourceResponse<T> {
  data: T
}
```

### Pagination
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = Math.min(parseInt(searchParams.get('per_page') || '20'), 100)

  const { data, count } = await supabase
    .from('work_orders')
    .select('*', { count: 'exact' })
    .range((page - 1) * perPage, page * perPage - 1)

  return NextResponse.json({
    data,
    meta: {
      total: count,
      page,
      per_page: perPage,
      total_pages: Math.ceil(count / perPage),
    },
  })
}
```

## GraphQL Migration Path

### Structure for Easy Migration
```typescript
// Current REST structure maps to GraphQL resolvers
class WorkOrdersAPI {
  // Query resolvers
  static getAll()    → Query.workOrders
  static getById()   → Query.workOrder

  // Mutation resolvers
  static create()    → Mutation.createWorkOrder
  static update()    → Mutation.updateWorkOrder
  static delete()    → Mutation.deleteWorkOrder
}

// Zod schemas become GraphQL input types
// TypeScript types become GraphQL object types
```

### Migration Benefits (Future)
- Reduced over-fetching
- Strong typing across network
- Subscription support for real-time
- Self-documenting API

## Testing

### API Test Structure
```typescript
// apps/frontend/__tests__/api/work-orders.test.ts
describe('WorkOrdersAPI', () => {
  beforeEach(async () => {
    await seedTestData()
  })

  describe('getAll', () => {
    it('returns work orders for org', async () => {
      const response = await fetch('/api/work-orders', {
        headers: { Authorization: `Bearer ${testToken}` },
      })

      expect(response.status).toBe(200)
      const { data } = await response.json()
      expect(data).toHaveLength(5)
    })

    it('filters by status', async () => {
      const response = await fetch('/api/work-orders?status=in_progress')
      const { data } = await response.json()
      expect(data.every(wo => wo.status === 'in_progress')).toBe(true)
    })
  })

  describe('create', () => {
    it('validates required fields', async () => {
      const response = await fetch('/api/work-orders', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      expect(response.status).toBe(400)
      const error = await response.json()
      expect(error.type).toContain('validation')
    })
  })
})
```
