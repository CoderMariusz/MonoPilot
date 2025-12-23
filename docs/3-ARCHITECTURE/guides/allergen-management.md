# Allergen Management Developer Guide

**Story**: 01.12 - Allergens Management
**Module**: Settings
**Version**: 1.0.0
**Last Updated**: 2025-12-23

---

## Overview

This guide explains how to work with the Allergen Management system in MonoPilot. Unlike other resources (warehouses, machines, etc.), allergens are **global reference data** shared across all organizations, implementing a unique pattern in the codebase.

**Key Concepts**:
- Global reference data (NO org_id filtering)
- Read-only enforcement (405 for mutations)
- Multi-language support (EN, PL, DE, FR)
- Icon system with fallback
- Search across all language fields

---

## Architecture Overview

### Global Reference Data Pattern

Allergens are the first implementation of global reference data in MonoPilot:

```typescript
// WRONG: Standard org-scoped pattern (used for machines, warehouses, etc.)
const { data } = await supabase
  .from('allergens')
  .select('*')
  .eq('org_id', userOrgId) // DON'T DO THIS!

// CORRECT: Global reference data pattern
const { data } = await supabase
  .from('allergens')
  .select('*')
  .eq('is_active', true)
  .order('display_order')
```

**Why Global?**
- EU allergens are standardized across all food manufacturers
- Same 14 allergens apply to every organization
- Multi-language data benefits all users
- Eliminates data duplication (14 allergens vs 14 * N orgs)

### Data Flow

```
Database (PostgreSQL)
  ├── allergens table (14 EU allergens)
  │   ├── Migration: 076_create_allergens_table.sql
  │   ├── RLS Policy: allergens_select_authenticated (read-only)
  │   └── GIN Index: Full-text search across all languages
  │
  ↓
Service Layer (allergen-service.ts)
  ├── getAllergens(filters?) → AllergenListResult
  ├── getAllergenById(id) → AllergenServiceResult
  ├── getAllergenByCode(code) → AllergenServiceResult
  ├── getName(allergen, lang) → string
  └── getAllergensForSelect(lang) → SelectOption[]
  │
  ↓
API Routes
  ├── GET /api/v1/settings/allergens → 200 (list all 14)
  ├── GET /api/v1/settings/allergens/:id → 200 (single)
  ├── POST /api/v1/settings/allergens → 405 (read-only)
  ├── PUT /api/v1/settings/allergens/:id → 405 (read-only)
  └── DELETE /api/v1/settings/allergens/:id → 405 (read-only)
  │
  ↓
React Hooks (use-allergens.ts)
  └── useAllergens() → { data, isLoading, error, refetch }
  │
  ↓
Components
  ├── AllergensDataTable (list view with search)
  ├── AllergenIcon (icon display with fallback)
  ├── AllergenBadge (compact badge for cross-module use)
  └── AllergenReadOnlyBanner (info banner)
```

---

## Database Layer

### Schema

```sql
CREATE TABLE allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,           -- A01-A14
  name_en VARCHAR(100) NOT NULL,              -- English name
  name_pl VARCHAR(100) NOT NULL,              -- Polish name
  name_de VARCHAR(100),                       -- German name (nullable)
  name_fr VARCHAR(100),                       -- French name (nullable)
  icon_url TEXT,                              -- Path to icon SVG
  icon_svg TEXT,                              -- SVG content (future)
  is_eu_mandatory BOOLEAN DEFAULT true,       -- EU Regulation 1169/2011
  is_custom BOOLEAN DEFAULT false,            -- Org-specific (Phase 3)
  is_active BOOLEAN DEFAULT true,             -- Display visibility
  display_order INTEGER NOT NULL DEFAULT 0,   -- Sort order (1-14)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT allergens_code_unique UNIQUE(code),
  CONSTRAINT allergens_code_format CHECK (code ~ '^A[0-9]{2}$')
);
```

### Indexes

```sql
-- Code lookup (unique constraint creates index)
CREATE INDEX idx_allergens_code ON allergens(code);

-- Display order sorting
CREATE INDEX idx_allergens_display_order ON allergens(display_order);

-- Full-text search (GIN index for performance)
CREATE INDEX idx_allergens_search ON allergens USING GIN (
  to_tsvector('simple',
    coalesce(code, '') || ' ' ||
    coalesce(name_en, '') || ' ' ||
    coalesce(name_pl, '') || ' ' ||
    coalesce(name_de, '') || ' ' ||
    coalesce(name_fr, '')
  )
);
```

**Performance**: GIN index enables < 100ms search across all language fields.

### RLS Policies

```sql
-- SELECT: All authenticated users can read active allergens
CREATE POLICY allergens_select_authenticated
  ON allergens
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- NO INSERT/UPDATE/DELETE POLICIES = Read-only
```

**Key Difference**: No org_id check in USING clause (global data).

### Seed Data

Migration includes idempotent seeding of 14 EU allergens:

```sql
INSERT INTO allergens (code, name_en, name_pl, name_de, name_fr, icon_url, display_order, is_eu_mandatory, is_custom, is_active)
VALUES
  ('A01', 'Gluten', 'Gluten', 'Gluten', 'Gluten', '/icons/allergens/gluten.svg', 1, true, false, true),
  ('A02', 'Crustaceans', 'Skorupiaki', 'Krebstiere', 'Crustaces', '/icons/allergens/crustaceans.svg', 2, true, false, true),
  -- ... 12 more allergens
ON CONFLICT (code) DO NOTHING;
```

**Idempotency**: `ON CONFLICT DO NOTHING` allows safe re-runs during migrations.

---

## Service Layer

### allergen-service.ts

Class-less service with exported functions (consistent with other services).

#### getAllergens

```typescript
import { getAllergens } from '@/lib/services/allergen-service'

// Get all 14 allergens
const result = await getAllergens()
// Returns: { success: true, data: Allergen[], total: 14 }

// Get allergens with search
const result = await getAllergens({ search: 'milk' })
// Returns: { success: true, data: [A07], total: 1 }

// Get only EU mandatory allergens (all 14 in MVP)
const result = await getAllergens({ is_eu_mandatory: true })
// Returns: { success: true, data: Allergen[], total: 14 }
```

**Filter Options**:
```typescript
interface AllergenFilters {
  search?: string              // Search across all language fields
  is_eu_mandatory?: boolean    // Filter by EU mandatory status
  is_active?: boolean          // Filter by active status (default: true)
}
```

**Return Type**:
```typescript
interface AllergenListResult {
  success: boolean
  data?: Allergen[]
  total?: number
  error?: string
  code?: 'DATABASE_ERROR' | 'UNAUTHORIZED'
}
```

#### getAllergenById

```typescript
import { getAllergenById } from '@/lib/services/allergen-service'

const result = await getAllergenById('allergen-uuid')

if (result.success) {
  console.log(result.data.code) // "A07"
  console.log(result.data.name_en) // "Milk"
} else {
  console.error(result.error) // "Allergen not found"
}
```

#### getAllergenByCode

```typescript
import { getAllergenByCode } from '@/lib/services/allergen-service'

const result = await getAllergenByCode('A07')

if (result.success) {
  console.log(result.data.name_en) // "Milk"
  console.log(result.data.name_pl) // "Mleko"
}
```

**Use Case**: Lookup allergen by code when integrating with external systems.

#### getName (Helper)

```typescript
import { getName } from '@/lib/services/allergen-service'

const allergen = { code: 'A07', name_en: 'Milk', name_pl: 'Mleko', ... }

const englishName = getName(allergen, 'en') // "Milk"
const polishName = getName(allergen, 'pl') // "Mleko"
const germanName = getName(allergen, 'de') // "Milch"
const frenchName = getName(allergen, 'fr') // "Lait"
```

**Fallback**: If requested language is null/empty, falls back to English.

#### getAllergensForSelect (UI Helper)

```typescript
import { getAllergensForSelect } from '@/lib/services/allergen-service'

const options = await getAllergensForSelect('en')

// Returns:
// [
//   { value: "uuid-1", label: "Gluten", code: "A01", icon_url: "/icons/..." },
//   { value: "uuid-2", label: "Crustaceans", code: "A02", icon_url: "/icons/..." },
//   ...
// ]

// Use in Select component
<Select>
  {options.map(opt => (
    <SelectItem key={opt.value} value={opt.value}>
      {opt.label} ({opt.code})
    </SelectItem>
  ))}
</Select>
```

---

## API Layer

### GET /api/v1/settings/allergens

```typescript
// apps/frontend/app/api/v1/settings/allergens/route.ts

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch allergens - NO org_id filter
  const { data: allergens, error } = await supabase
    .from('allergens')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch allergens', details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(allergens || [], { status: 200 })
}
```

**Key Points**:
- NO org_id filtering (unlike machines, warehouses, etc.)
- Always returns 14 allergens (no pagination needed)
- Always sorted by display_order (A01 first, A14 last)

### POST/PUT/DELETE (Read-Only Enforcement)

```typescript
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}
```

**Why 405?** HTTP 405 indicates method is recognized but not supported for this resource.

**Headers**: `Allow: GET` header tells clients which methods are allowed.

---

## React Hooks

### useAllergens

```typescript
import { useAllergens } from '@/lib/hooks/use-allergens'

function AllergensPage() {
  const { data, isLoading, error, refetch } = useAllergens()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data?.map(allergen => (
        <div key={allergen.id}>
          {allergen.code} - {allergen.name_en}
        </div>
      ))}
    </div>
  )
}
```

**Implementation**:
```typescript
export function useAllergens(): UseAllergensResult {
  const [data, setData] = useState<Allergen[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  useEffect(() => {
    const fetchAllergens = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/v1/settings/allergens')
        if (!response.ok) throw new Error('Failed to fetch allergens')

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllergens()
  }, [refetchTrigger])

  const refetch = () => setRefetchTrigger(prev => prev + 1)

  return { data, isLoading, error, refetch }
}
```

**Caching Strategy**: Hook doesn't cache between mounts. Consider wrapping in React Context for session-level caching.

---

## Multi-Language Support

### Language Preference

```typescript
// Get language from user settings (future)
const userLanguage = user.settings?.language || 'en'

// Use in components
<AllergensDataTable allergens={allergens} userLanguage={userLanguage} />
<AllergenBadge allergen={allergen} language={userLanguage} />
```

### Localized Name Helper

```typescript
// lib/types/allergen.ts
export function getAllergenName(
  allergen: Allergen,
  lang: 'en' | 'pl' | 'de' | 'fr' = 'en'
): string {
  switch (lang) {
    case 'pl':
      return allergen.name_pl
    case 'de':
      return allergen.name_de || allergen.name_en // Fallback to EN
    case 'fr':
      return allergen.name_fr || allergen.name_en // Fallback to EN
    default:
      return allergen.name_en
  }
}
```

**Usage**:
```typescript
import { getAllergenName } from '@/lib/types/allergen'

const allergen = { code: 'A07', name_en: 'Milk', name_pl: 'Mleko', ... }

const label = getAllergenName(allergen, 'pl') // "Mleko"
```

### Search Across Languages

Service layer searches all language fields:

```typescript
// Service layer implementation
if (filters?.search && filters.search.trim().length > 0) {
  const searchTerm = filters.search.trim().toLowerCase()

  query = query.or(
    `code.ilike.%${searchTerm}%,` +
    `name_en.ilike.%${searchTerm}%,` +
    `name_pl.ilike.%${searchTerm}%,` +
    `name_de.ilike.%${searchTerm}%,` +
    `name_fr.ilike.%${searchTerm}%`
  )
}
```

**Result**: Search for "mleko" (Polish) finds A07 (Milk).

---

## Icon System

### Icon Storage

Icons are stored in `public/icons/allergens/`:

```
apps/frontend/public/icons/allergens/
  ├── gluten.svg
  ├── crustaceans.svg
  ├── eggs.svg
  ├── fish.svg
  ├── peanuts.svg
  ├── soybeans.svg
  ├── milk.svg
  ├── nuts.svg
  ├── celery.svg
  ├── mustard.svg
  ├── sesame.svg
  ├── sulphites.svg
  ├── lupin.svg
  └── molluscs.svg
```

**Icon URL Format**: `/icons/allergens/gluten.svg` (starts with `/` for Next.js public folder)

### Icon Component

```typescript
import { AllergenIcon } from '@/components/settings/allergens'

// With icon
<AllergenIcon icon_url="/icons/allergens/milk.svg" name="Milk" size={24} />

// Without icon (fallback to AlertTriangle)
<AllergenIcon icon_url={null} name="Unknown" size={24} />
```

### Fallback Behavior

When `icon_url` is null, component shows AlertTriangle icon:

```typescript
if (!icon_url) {
  return (
    <div className="bg-muted rounded" style={{ width: size, height: size }}>
      <AlertTriangle className="text-muted-foreground" />
    </div>
  )
}
```

**Use Case**: Custom allergens (Phase 3) without icons yet.

---

## Read-Only Enforcement

### Database Level

No INSERT/UPDATE/DELETE RLS policies:

```sql
-- Only SELECT policy exists
CREATE POLICY allergens_select_authenticated
  ON allergens FOR SELECT TO authenticated
  USING (is_active = true);
```

**Result**: Any INSERT/UPDATE/DELETE will fail with permission denied.

### API Level

API routes return 405 for mutations:

```typescript
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}
```

**Result**: Frontend can't accidentally create/update/delete allergens.

### UI Level

Component shows read-only banner:

```typescript
<AllergenReadOnlyBanner />
// "EU-mandated allergens are system-managed and cannot be edited or deleted."
```

**Result**: Users understand why CRUD actions are missing.

---

## Integration with Other Modules

### Technical Module (Product Formulations)

Products reference allergens via many-to-many relationship:

```sql
CREATE TABLE product_allergens (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  allergen_id UUID REFERENCES allergens(id) ON DELETE RESTRICT,
  PRIMARY KEY (product_id, allergen_id)
);
```

**Usage**:
```typescript
// Get product with allergens
const { data: product } = await supabase
  .from('products')
  .select(`
    *,
    allergens:product_allergens(
      allergen:allergens(*)
    )
  `)
  .eq('id', productId)
  .single()

// Display allergen badges
{product.allergens.map(({ allergen }) => (
  <AllergenBadge key={allergen.id} allergen={allergen} language="en" />
))}
```

### Shipping Module (Label Generation)

Labels display allergen warnings in multiple languages:

```typescript
import { getAllergenName } from '@/lib/types/allergen'

function generateLabel(product: Product, language: 'en' | 'pl') {
  const allergenNames = product.allergens
    .map(({ allergen }) => getAllergenName(allergen, language))
    .join(', ')

  return `
    **ALLERGENS**: ${allergenNames}
    (Contains: ${allergenNames})
  `
}
```

### Quality Module (Supplier Checks)

Quality control verifies supplier allergen declarations:

```typescript
function validateSupplierAllergens(
  supplierCodes: string[], // ['A07', 'A08']
  productAllergens: Allergen[]
) {
  const productCodes = new Set(productAllergens.map(a => a.code))
  const supplierSet = new Set(supplierCodes)

  // Ensure all product allergens are declared by supplier
  const missingAllergens = [...productCodes].filter(code => !supplierSet.has(code))

  return {
    isValid: missingAllergens.length === 0,
    missingAllergens
  }
}
```

---

## Testing

### Unit Tests

```typescript
import { getAllergens, getAllergenByCode } from '@/lib/services/allergen-service'

describe('allergen-service', () => {
  it('should return 14 EU allergens', async () => {
    const result = await getAllergens()
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(14)
    expect(result.total).toBe(14)
  })

  it('should search allergens by code', async () => {
    const result = await getAllergens({ search: 'A07' })
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].code).toBe('A07')
  })

  it('should get allergen by code', async () => {
    const result = await getAllergenByCode('A07')
    expect(result.success).toBe(true)
    expect(result.data.name_en).toBe('Milk')
  })
})
```

### API Tests

```typescript
import { GET, POST } from '@/app/api/v1/settings/allergens/route'

describe('GET /api/v1/settings/allergens', () => {
  it('should return 14 allergens', async () => {
    const request = new NextRequest('http://localhost/api/v1/settings/allergens')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(14)
  })

  it('should return 401 if not authenticated', async () => {
    // Mock unauthenticated user
    mockSession = null

    const request = new NextRequest('http://localhost/api/v1/settings/allergens')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })
})

describe('POST /api/v1/settings/allergens (Read-Only)', () => {
  it('should return 405 Method Not Allowed', async () => {
    const response = await POST()
    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('GET')
  })
})
```

### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { AllergensDataTable } from '@/components/settings/allergens'

describe('AllergensDataTable', () => {
  const mockAllergens = [
    { id: '1', code: 'A07', name_en: 'Milk', name_pl: 'Mleko', ... },
    { id: '2', code: 'A08', name_en: 'Nuts', name_pl: 'Orzechy', ... },
  ]

  it('should render all allergens', () => {
    render(<AllergensDataTable allergens={mockAllergens} />)
    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Nuts')).toBeInTheDocument()
  })

  it('should filter by search', async () => {
    render(<AllergensDataTable allergens={mockAllergens} />)

    const searchInput = screen.getByLabelText('Search allergens')
    fireEvent.change(searchInput, { target: { value: 'milk' } })

    // Wait for debounce (100ms)
    await new Promise(resolve => setTimeout(resolve, 150))

    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.queryByText('Nuts')).not.toBeInTheDocument()
  })
})
```

---

## Common Patterns

### Pattern 1: Fetch and Display Allergens

```typescript
import { useAllergens } from '@/lib/hooks/use-allergens'
import { AllergensDataTable } from '@/components/settings/allergens'

function AllergensPage() {
  const { data, isLoading, error, refetch } = useAllergens()

  return (
    <AllergensDataTable
      allergens={data || []}
      isLoading={isLoading}
      error={error?.message}
      onRetry={refetch}
      userLanguage="en"
    />
  )
}
```

### Pattern 2: Multi-Select Allergens in Form

```typescript
import { useAllergens } from '@/lib/hooks/use-allergens'
import { AllergenBadge } from '@/components/settings/allergens'

function ProductForm() {
  const { data: allergens } = useAllergens()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleAllergen = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="space-y-4">
      <label>Product Allergens</label>
      <div className="flex flex-wrap gap-2">
        {allergens?.map(allergen => (
          <button
            key={allergen.id}
            onClick={() => toggleAllergen(allergen.id)}
            className={selectedIds.includes(allergen.id) ? 'selected' : ''}
          >
            <AllergenBadge allergen={allergen} language="en" />
          </button>
        ))}
      </div>
    </div>
  )
}
```

### Pattern 3: Display Allergen in Badge

```typescript
import { AllergenBadge } from '@/components/settings/allergens'

function ProductCard({ product }) {
  return (
    <div>
      <h3>{product.name}</h3>
      <div className="allergens">
        {product.allergens.map(({ allergen }) => (
          <AllergenBadge
            key={allergen.id}
            allergen={allergen}
            language="en"
            showIcon={true}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## Performance Optimization

### Caching Strategy

Since allergens are static, implement session-level caching:

```typescript
// Context for global allergen state
import { createContext, useContext } from 'react'
import { useAllergens } from '@/lib/hooks/use-allergens'

const AllergensContext = createContext<Allergen[]>([])

export function AllergensProvider({ children }) {
  const { data: allergens } = useAllergens()

  return (
    <AllergensContext.Provider value={allergens || []}>
      {children}
    </AllergensContext.Provider>
  )
}

export function useCachedAllergens() {
  return useContext(AllergensContext)
}

// Usage
function App() {
  return (
    <AllergensProvider>
      <ProductForm /> {/* Uses cached allergens */}
      <ShippingLabel /> {/* Uses cached allergens */}
    </AllergensProvider>
  )
}
```

### Database Query Optimization

GIN index enables fast full-text search:

```sql
-- Search across all languages
SELECT * FROM allergens
WHERE to_tsvector('simple',
  coalesce(code, '') || ' ' ||
  coalesce(name_en, '') || ' ' ||
  coalesce(name_pl, '') || ' ' ||
  coalesce(name_de, '') || ' ' ||
  coalesce(name_fr, '')
) @@ to_tsquery('simple', 'milk');
```

**Performance**: < 100ms for search queries.

---

## Future Enhancements

### Phase 2
- Add allergen icons (SVG upload to database)
- Export allergen list as CSV/PDF
- Print-friendly allergen reference sheet

### Phase 3: Custom Allergens

Allow organizations to add custom allergens:

```sql
-- New column added in Phase 3
ALTER TABLE allergens ADD COLUMN org_id UUID REFERENCES organizations(id);

-- RLS policy for custom allergens
CREATE POLICY allergens_insert_custom
  ON allergens FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND is_custom = true
  );
```

**Usage**:
```typescript
// Create custom allergen (Phase 3)
const result = await createAllergen({
  code: 'C01',
  name_en: 'Proprietary Additive',
  name_pl: 'Dodatek firmowy',
  is_custom: true
})
```

---

## Troubleshooting

### Issue: Allergens Not Loading

**Problem**: `useAllergens` returns empty array

**Diagnosis**:
1. Check authentication: `auth.getUser()` returns user
2. Verify RLS policy: `allergens_select_authenticated` exists
3. Check database: `SELECT * FROM allergens WHERE is_active = true`
4. Verify API route: `GET /api/v1/settings/allergens` returns 200

### Issue: Search Not Working

**Problem**: Search doesn't filter allergens

**Diagnosis**:
1. Check GIN index exists: `\d allergens` (PostgreSQL)
2. Verify service layer uses `.or()` filter correctly
3. Check case-insensitive comparison: `.toLowerCase()`
4. Test raw SQL: `SELECT * FROM allergens WHERE name_en ILIKE '%milk%'`

### Issue: Icons Not Displaying

**Problem**: Icons show fallback (AlertTriangle)

**Diagnosis**:
1. Verify icon files exist: `public/icons/allergens/gluten.svg`
2. Check icon_url format: `/icons/allergens/gluten.svg` (starts with `/`)
3. Verify Next.js public folder is configured correctly
4. Check browser console for 404 errors

---

## Related Documentation

- [Allergen API Documentation](../api/settings/allergens.md)
- [Allergen Component Documentation](../frontend/components/allergens.md)
- [Database Schema - Allergens Table](../database/migrations/allergens.md)
- [Story 01.12 Specification](../../2-MANAGEMENT/epics/current/01-settings/01.12.allergens-management.md)
