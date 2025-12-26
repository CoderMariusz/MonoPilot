# API Contract: Allergen Product Counts

**Story:** TD-209 - Products Column in Allergens Table
**Epic:** 01-settings
**Date:** 2025-12-24
**Status:** DESIGNED

---

## Overview

This API provides endpoints for retrieving product counts per allergen, enabling the "Products" column on the Allergens management page.

**Design Decision:** Product-allergen relationships are stored in a junction table `product_allergens` with RPC functions for efficient batch queries. This approach was chosen because:
1. Efficient single query for all allergen counts (vs N+1 individual queries)
2. Database-level security via RLS and SECURITY DEFINER functions
3. Consistent with existing MonoPilot patterns

---

## Endpoints

### 1. Get All Allergen Product Counts (Batch)

**Endpoint:** `GET /api/v1/settings/allergens/counts`

**Description:** Returns product count for all active allergens. Efficient batch query for the allergens list page.

**Authentication:** Required (Supabase Auth JWT)

**Authorization:** Results filtered by user's org_id automatically

#### Request

```http
GET /api/v1/settings/allergens/counts
Authorization: Bearer {jwt_token}
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "counts": {
      "a01-uuid-gluten": 12,
      "a02-uuid-crustaceans": 5,
      "a03-uuid-eggs": 8,
      "a04-uuid-fish": 0,
      "a05-uuid-peanuts": 3,
      "a06-uuid-soybeans": 15,
      "a07-uuid-milk": 23,
      "a08-uuid-nuts": 7,
      "a09-uuid-celery": 0,
      "a10-uuid-mustard": 2,
      "a11-uuid-sesame": 4,
      "a12-uuid-sulphites": 9,
      "a13-uuid-lupin": 0,
      "a14-uuid-molluscs": 1
    },
    "total_products": 45,
    "cached_at": null
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `counts` | object | Map of allergen_id -> product_count |
| `total_products` | number | Total unique products with allergens |
| `cached_at` | string | null | ISO timestamp if response was cached |

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Not authenticated |
| 500 | INTERNAL_ERROR | Database error |

---

### 2. Get Single Allergen Product Count

**Endpoint:** `GET /api/v1/settings/allergens/{allergen_id}/count`

**Description:** Returns product count for a specific allergen.

**Authentication:** Required (Supabase Auth JWT)

**Authorization:** Results filtered by user's org_id automatically

#### Request

```http
GET /api/v1/settings/allergens/a01-uuid-gluten/count
Authorization: Bearer {jwt_token}
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "allergen_id": "a01-uuid-gluten",
    "product_count": 12
  }
}
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Not authenticated |
| 404 | NOT_FOUND | Allergen not found |
| 500 | INTERNAL_ERROR | Database error |

---

### 3. Get Products by Allergen

**Endpoint:** `GET /api/v1/settings/allergens/{allergen_id}/products`

**Description:** Returns list of products containing a specific allergen. Used for navigation from allergen count to products page.

**Authentication:** Required (Supabase Auth JWT)

**Authorization:** Results filtered by user's org_id automatically

#### Request

```http
GET /api/v1/settings/allergens/a01-uuid-gluten/products
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Max products to return |
| `offset` | number | 0 | Pagination offset |

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "allergen_id": "a01-uuid-gluten",
    "allergen_name": "Gluten",
    "products": [
      { "id": "prod-uuid-1", "code": "FG-001", "name": "Wheat Bread" },
      { "id": "prod-uuid-2", "code": "FG-002", "name": "Pasta" },
      { "id": "prod-uuid-3", "code": "RM-015", "name": "Flour" }
    ],
    "total_count": 12,
    "has_more": true
  }
}
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Not authenticated |
| 404 | NOT_FOUND | Allergen not found |
| 500 | INTERNAL_ERROR | Database error |

---

## Database Layer

### Table: product_allergens

Junction table linking products to allergens.

```sql
CREATE TABLE product_allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  CONSTRAINT uq_product_allergen UNIQUE(product_id, allergen_id)
);
```

**Indexes:**
```sql
CREATE INDEX idx_product_allergens_product ON product_allergens(product_id);
CREATE INDEX idx_product_allergens_allergen ON product_allergens(allergen_id);
CREATE INDEX idx_product_allergens_org ON product_allergens(org_id);
CREATE INDEX idx_product_allergens_org_allergen ON product_allergens(org_id, allergen_id);
```

### RPC Functions

**get_all_allergen_product_counts()**
- Returns table of (allergen_id, product_count)
- Filters by current user's org_id
- Excludes soft-deleted products
- Includes allergens with 0 products

**get_allergen_product_count(p_allergen_id UUID)**
- Returns single count for specific allergen
- Filters by current user's org_id
- Excludes soft-deleted products

**get_products_by_allergen(p_allergen_id UUID)**
- Returns table of (product_id, product_code, product_name)
- Filters by current user's org_id
- Excludes soft-deleted products
- Ordered by product code

---

## Service Layer

**File:** `apps/frontend/lib/services/allergen-service.ts` (UPDATE)

```typescript
// Existing interface extended
interface AllergenService {
  // EXISTING methods...
  getAllergens(filters?: AllergenFilters): Promise<Allergen[]>;
  getAllergenById(id: string): Promise<Allergen | null>;
  getName(allergen: Allergen, lang: SupportedLanguage): string;

  // NEW methods for TD-209
  getAllergenProductCounts(): Promise<Map<string, number>>;
  getProductCount(allergenId: string): Promise<number>;
  getProductsByAllergen(allergenId: string): Promise<ProductSummary[]>;
}

interface ProductSummary {
  id: string;
  code: string;
  name: string;
}
```

---

## Validation Schema

**File:** `apps/frontend/lib/validation/allergen-schemas.ts` (UPDATE)

```typescript
import { z } from 'zod';

// Existing schemas...

// NEW: Allergen counts response schema
export const allergenCountsResponseSchema = z.object({
  counts: z.record(z.string().uuid(), z.number().int().nonnegative()),
  total_products: z.number().int().nonnegative(),
  cached_at: z.string().datetime().nullable()
});

// NEW: Products by allergen response schema
export const productsByAllergenSchema = z.object({
  allergen_id: z.string().uuid(),
  allergen_name: z.string(),
  products: z.array(z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string()
  })),
  total_count: z.number().int().nonnegative(),
  has_more: z.boolean()
});

export type AllergenCountsResponse = z.infer<typeof allergenCountsResponseSchema>;
export type ProductsByAllergenResponse = z.infer<typeof productsByAllergenSchema>;
```

---

## API Route Implementation

**File:** `apps/frontend/app/api/v1/settings/allergens/counts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  // Call RPC function for batch counts
  const { data, error } = await supabase.rpc('get_all_allergen_product_counts');

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  // Transform to map format
  const counts: Record<string, number> = {};
  let totalProducts = 0;

  for (const row of data || []) {
    counts[row.allergen_id] = row.product_count;
    totalProducts += row.product_count;
  }

  return NextResponse.json({
    success: true,
    data: {
      counts,
      total_products: totalProducts,
      cached_at: null
    }
  });
}
```

**File:** `apps/frontend/app/api/v1/settings/allergens/[allergen_id]/count/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { allergen_id: string } }
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  const { allergen_id } = params;

  // Validate allergen exists
  const { data: allergen, error: allergenError } = await supabase
    .from('allergens')
    .select('id')
    .eq('id', allergen_id)
    .single();

  if (allergenError || !allergen) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Allergen not found' } },
      { status: 404 }
    );
  }

  // Call RPC function for single count
  const { data: count, error } = await supabase.rpc('get_allergen_product_count', {
    p_allergen_id: allergen_id
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      allergen_id,
      product_count: count || 0
    }
  });
}
```

---

## Frontend Integration

### React Hook

**File:** `apps/frontend/hooks/use-allergen-counts.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { AllergenService } from '@/lib/services/allergen-service';

export function useAllergenCounts() {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await AllergenService.getAllergenProductCounts();
      setCounts(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const getCount = (allergenId: string): number => {
    return counts.get(allergenId) || 0;
  };

  return { counts, getCount, isLoading, error, refetch: loadCounts };
}
```

### Navigation Handler

**File:** `apps/frontend/components/settings/allergens/AllergensDataTable.tsx` (UPDATE)

```typescript
// Add navigation to products page with filter
const handleProductCountClick = (allergenId: string, count: number) => {
  if (count > 0) {
    router.push(`/technical/products?allergen_id=${allergenId}`);
  }
};

// Products column with click handler
{
  accessorKey: 'product_count',
  header: 'Products',
  cell: ({ row }) => {
    const count = productCounts.get(row.original.id) || 0;
    return (
      <Button
        variant="link"
        className={count === 0 ? 'text-muted-foreground cursor-default' : ''}
        onClick={() => handleProductCountClick(row.original.id, count)}
        disabled={count === 0}
      >
        {count} {count === 1 ? 'product' : 'products'}
      </Button>
    );
  }
}
```

---

## Caching Strategy

### Client-Side Caching

```typescript
// Cache allergen counts for 60 seconds
const CACHE_TTL = 60 * 1000; // 1 minute

export function useAllergenCounts() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['allergen-counts'],
    queryFn: () => AllergenService.getAllergenProductCounts(),
    staleTime: CACHE_TTL,
    cacheTime: CACHE_TTL * 2
  });
}
```

### Server-Side Caching (Future)

Consider adding Redis caching for high-traffic organizations:
```typescript
// Cache key: allergen_counts:{org_id}
// TTL: 60 seconds
// Invalidate on: product_allergens INSERT/DELETE
```

---

## Test Scenarios

### Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Get all counts (authenticated) | Returns counts for all active allergens |
| Get single count (valid allergen) | Returns correct count |
| Get single count (invalid allergen) | Returns 404 NOT_FOUND |
| Get products by allergen | Returns product list |
| Get counts (unauthenticated) | Returns 401 UNAUTHORIZED |

### Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Counts filtered by org | User sees only their org's products |
| Soft-deleted products excluded | Counts exclude deleted_at != NULL |
| Product created | Count increments |
| Product-allergen link removed | Count decrements |

### E2E Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Click product count | Navigates to /technical/products?allergen_id={id} |
| Products page shows filter | Breadcrumb shows "Filtered by {allergen_name}" |
| Zero count not clickable | Button disabled for 0 products |

---

## Performance Considerations

1. **Batch Query:** `get_all_allergen_product_counts()` returns all counts in single query
2. **Indexed Lookups:** Composite index on (org_id, allergen_id) for efficient filtering
3. **Soft Delete Check:** JOIN condition excludes deleted products
4. **RLS Overhead:** ~1ms per ADR-013 benchmarks

### Query Performance Target

| Query | Target | Actual |
|-------|--------|--------|
| Batch counts (14 allergens) | <50ms | TBD |
| Single count | <10ms | TBD |
| Products list (50 items) | <50ms | TBD |

---

## Security Considerations

1. **RLS Enforcement:** Junction table filtered by org_id
2. **SECURITY DEFINER:** RPC functions bypass RLS with explicit org filtering
3. **No Cross-Tenant Leak:** User cannot see other orgs' product counts
4. **Input Validation:** allergen_id validated as UUID

---

## Related Documents

- **Migration:** `supabase/migrations/032_create_product_allergens_table.sql`
- **ADR-013:** RLS Org Isolation Pattern
- **Story TD-209:** Products Column in Allergens Table
- **Wireframe SET-020:** Allergen List with Products Column
- **Products Table:** `supabase/migrations/028_create_products_table.sql`
