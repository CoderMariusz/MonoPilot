# Allergen Components Documentation

**Story**: 01.12 - Allergens Management
**Module**: Settings
**Component Path**: `apps/frontend/components/settings/allergens/`
**Version**: 1.0.0
**Last Updated**: 2025-12-23

---

## Overview

Allergen components provide reusable UI elements for displaying and interacting with EU-mandated allergens throughout the MonoPilot system. These components support multi-language display, icon rendering, and read-only enforcement.

**Component Count**: 4 components
**Pattern**: Composition-based with ShadCN UI primitives
**Accessibility**: Full ARIA support, keyboard navigation, screen reader compatible

---

## Components

### 1. AllergensDataTable

**File**: `AllergensDataTable.tsx`

Primary table component for displaying the list of 14 EU allergens with search, filtering, and multi-language support.

#### Props

```typescript
interface AllergensDataTableProps {
  allergens: Allergen[]           // Array of allergen objects
  isLoading?: boolean              // Loading state (shows skeleton)
  error?: string                   // Error message (shows error state)
  onRetry?: () => void             // Retry callback for error state
  userLanguage?: 'en' | 'pl' | 'de' | 'fr'  // Display language (default: 'en')
}
```

#### Features

- **Search**: Debounced 100ms search across all language fields (code, name_en, name_pl, name_de, name_fr)
- **Multi-Language Columns**: Displays localized name + EN + PL columns
- **Icon Display**: Shows allergen icons with fallback
- **Tooltips**: Hover tooltips showing all language names
- **Loading State**: Skeleton loader with 5 rows
- **Error State**: Error message with retry button
- **Empty State**: Message when no allergens found (should never happen)
- **No Pagination**: Only 14 items, no need for pagination

#### Usage

```typescript
import { AllergensDataTable } from '@/components/settings/allergens'
import { useAllergens } from '@/lib/hooks/use-allergens'

function AllergensPage() {
  const { data: allergens, isLoading, error, refetch } = useAllergens()

  return (
    <AllergensDataTable
      allergens={allergens || []}
      isLoading={isLoading}
      error={error?.message}
      onRetry={refetch}
      userLanguage="en"
    />
  )
}
```

#### Table Columns

| Column | Description | Width |
|--------|-------------|-------|
| Code | Allergen code (A01-A14) | Fixed |
| Icon | 24x24 icon with fallback | Fixed (40px) |
| Name (User Language) | Localized name based on userLanguage prop | Auto |
| Name EN | English name (always shown) | Auto |
| Name PL | Polish name (always shown) | Auto |
| Status | Active/Inactive badge (always Active for EU allergens) | Fixed |

#### Search Behavior

```typescript
// Search is debounced 100ms to prevent excessive re-renders
const [searchValue, setSearchValue] = useState('')
const [debouncedSearch, setDebouncedSearch] = useState('')

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchValue)
  }, 100)
  return () => clearTimeout(timer)
}, [searchValue])

// Filters allergens by search across all fields
const filteredAllergens = allergens.filter(allergen =>
  allergen.code.toLowerCase().includes(searchLower) ||
  allergen.name_en.toLowerCase().includes(searchLower) ||
  allergen.name_pl.toLowerCase().includes(searchLower) ||
  allergen.name_de?.toLowerCase().includes(searchLower) ||
  allergen.name_fr?.toLowerCase().includes(searchLower)
)
```

#### States

**Loading State**:
```tsx
{isLoading && (
  <div data-testid="skeleton-loader">
    <Skeleton className="h-10 w-full" />
    {/* 5 skeleton rows */}
  </div>
)}
```

**Error State**:
```tsx
{error && (
  <div className="error-container">
    <p className="text-destructive">Failed to load allergens</p>
    <p className="text-muted-foreground">{error}</p>
    <button onClick={onRetry}>Retry</button>
  </div>
)}
```

**Empty State** (should never occur):
```tsx
{allergens.length === 0 && (
  <div className="empty-state">
    <p>No allergens found</p>
    <p className="text-muted-foreground">Contact support if allergens are not loading.</p>
  </div>
)}
```

#### Accessibility

- Search input has `aria-label="Search allergens"`
- Table rows have `role="row"` (implicit from TableRow)
- Tooltips use `TooltipProvider` for screen reader support
- Cursor changes to `cursor-help` on hover to indicate tooltip availability

---

### 2. AllergenIcon

**File**: `AllergenIcon.tsx`

Displays allergen icon with fallback to alert triangle when icon is missing.

#### Props

```typescript
interface AllergenIconProps {
  icon_url: string | null    // Path to icon SVG
  name: string                // Allergen name (for alt text)
  size?: 24 | 48              // Icon size in pixels (default: 24)
}
```

#### Features

- **Icon Display**: Next.js Image component for optimized loading
- **Fallback**: AlertTriangle icon when icon_url is null
- **Responsive Sizing**: 24x24 (list) or 48x48 (detail view)
- **Accessibility**: Alt text with allergen name

#### Usage

```typescript
import { AllergenIcon } from '@/components/settings/allergens'

// With icon URL
<AllergenIcon
  icon_url="/icons/allergens/milk.svg"
  name="Milk"
  size={24}
/>

// Without icon (shows fallback)
<AllergenIcon
  icon_url={null}
  name="Unknown Allergen"
  size={24}
/>
```

#### Rendering Logic

```typescript
// If icon_url is null, show fallback
if (!icon_url) {
  return (
    <div
      className="flex items-center justify-center bg-muted rounded"
      style={{ width: size, height: size }}
      aria-label={`${name} allergen icon (fallback)`}
    >
      <AlertTriangle className="text-muted-foreground" style={{ width: size / 2, height: size / 2 }} />
    </div>
  )
}

// Otherwise, show icon image
return (
  <Image
    src={icon_url}
    alt={`${name} allergen icon`}
    width={size}
    height={size}
    className="object-contain"
  />
)
```

#### Icon Locations

Icons should be placed in:
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

**Future Enhancement**: SVG content can be stored in `icon_svg` column for inline rendering.

---

### 3. AllergenBadge

**File**: `AllergenBadge.tsx`

Reusable badge component for displaying allergen code and name, used across multiple modules (Technical, Shipping, Quality).

#### Props

```typescript
interface AllergenBadgeProps {
  allergen: Allergen                    // Allergen object
  language?: 'en' | 'pl' | 'de' | 'fr'  // Display language (default: 'en')
  showIcon?: boolean                     // Show icon (default: true)
}
```

#### Features

- **Compact Display**: Code + localized name in single badge
- **Optional Icon**: 24x24 icon display (can be disabled)
- **Multi-Language**: Adapts to user preference
- **Consistent Styling**: Uses ShadCN Badge with outline variant

#### Usage

```typescript
import { AllergenBadge } from '@/components/settings/allergens'

// With icon (default)
<AllergenBadge allergen={milkAllergen} language="en" />
// Renders: [ICON] A07 - Milk

// Without icon
<AllergenBadge allergen={milkAllergen} language="pl" showIcon={false} />
// Renders: A07 - Mleko

// Multiple badges in product form
{product.allergens.map(allergen => (
  <AllergenBadge key={allergen.id} allergen={allergen} language="en" />
))}
```

#### Rendering

```typescript
<Badge variant="outline" className="flex items-center gap-1.5 px-2 py-1">
  {showIcon && <AllergenIcon icon_url={allergen.icon_url} name={name} size={24} />}
  <span className="text-xs font-medium">
    {allergen.code} - {name}
  </span>
</Badge>
```

#### Localized Name Logic

```typescript
import { getAllergenName } from '@/lib/types/allergen'

const name = getAllergenName(allergen, language)
// Returns: allergen.name_pl if language='pl', fallback to name_en
```

---

### 4. AllergenReadOnlyBanner

**File**: `AllergenReadOnlyBanner.tsx`

Info banner explaining that EU allergens are system-managed and cannot be edited or deleted.

#### Props

None (stateless component)

#### Features

- **Informational Alert**: Blue background with info icon
- **Clear Message**: Explains read-only nature and future support
- **Consistent Styling**: Uses ShadCN Alert component

#### Usage

```typescript
import { AllergenReadOnlyBanner } from '@/components/settings/allergens'

function AllergensPage() {
  return (
    <div>
      <h1>Allergens</h1>
      <AllergenReadOnlyBanner />
      <AllergensDataTable allergens={allergens} />
    </div>
  )
}
```

#### Rendering

```typescript
<Alert className="bg-blue-50 border-blue-200">
  <Info className="h-4 w-4 text-blue-600" />
  <AlertDescription className="text-sm text-blue-800">
    EU-mandated allergens are system-managed and cannot be edited or deleted.
    Contact support for custom allergen requests.
  </AlertDescription>
</Alert>
```

#### Design Rationale

- **Why Blue?**: Blue indicates informational message (not warning/error)
- **Why Show Banner?**: Users might expect CRUD operations like other settings pages
- **Future Support**: Banner text hints at Phase 3 custom allergen support

---

## Component Composition

### Page Layout Example

```typescript
import {
  AllergensDataTable,
  AllergenReadOnlyBanner
} from '@/components/settings/allergens'
import { useAllergens } from '@/lib/hooks/use-allergens'

export default function AllergensPage() {
  const { data: allergens, isLoading, error, refetch } = useAllergens()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Allergens</h1>
        <p className="text-muted-foreground">
          EU-mandated allergens list for food labeling compliance (EU Regulation 1169/2011)
        </p>
      </div>

      {/* Read-only banner */}
      <AllergenReadOnlyBanner />

      {/* Data table */}
      <AllergensDataTable
        allergens={allergens || []}
        isLoading={isLoading}
        error={error?.message}
        onRetry={refetch}
        userLanguage="en"
      />
    </div>
  )
}
```

### Product Form Integration

```typescript
import { AllergenBadge } from '@/components/settings/allergens'
import { useAllergens } from '@/lib/hooks/use-allergens'

function ProductAllergenSelector({ selectedIds, onChange }) {
  const { data: allergens } = useAllergens()

  return (
    <div>
      <label>Product Allergens</label>
      <div className="flex flex-wrap gap-2">
        {allergens?.map(allergen => {
          const isSelected = selectedIds.includes(allergen.id)
          return (
            <button
              key={allergen.id}
              onClick={() => toggleAllergen(allergen.id)}
              className={isSelected ? 'selected' : ''}
            >
              <AllergenBadge allergen={allergen} language="en" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

---

## Styling Conventions

### Color Palette

All allergen components use consistent color scheme:

```typescript
// Active badge (green)
className="bg-green-100 text-green-800 border-none"

// Info banner (blue)
className="bg-blue-50 border-blue-200 text-blue-800"

// Fallback icon background (muted)
className="bg-muted text-muted-foreground"
```

### Spacing

```typescript
// Badge internal spacing
className="gap-1.5 px-2 py-1"

// Table row padding
className="p-4"

// Page container spacing
className="space-y-6"
```

### Typography

```typescript
// Badge text
className="text-xs font-medium"

// Table cell code
className="font-mono font-semibold"

// Table cell name
className="font-medium"
```

---

## Accessibility Features

### ARIA Labels

```typescript
// Search input
<Input
  aria-label="Search allergens"
  placeholder="Search allergens by code or name..."
/>

// Icon fallback
<div aria-label={`${name} allergen icon (fallback)`}>
  <AlertTriangle />
</div>

// Icon image
<Image alt={`${name} allergen icon`} />
```

### Keyboard Navigation

- Table rows are focusable (implicit from TableRow)
- Search input is keyboard accessible
- Tooltips appear on focus (not just hover)

### Screen Reader Support

- Tooltip content is announced when row receives focus
- Error messages are announced immediately
- Loading state has accessible loading indicator

---

## Performance Considerations

### Debounced Search

Search input is debounced 100ms to prevent excessive re-renders:

```typescript
const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

useEffect(() => {
  if (searchTimerRef.current) {
    clearTimeout(searchTimerRef.current)
  }
  searchTimerRef.current = setTimeout(() => {
    setDebouncedSearch(searchValue)
  }, 100)
  return () => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }
  }
}, [searchValue])
```

### Memoized Filtering

Filtered allergens are memoized to prevent unnecessary recalculations:

```typescript
const filteredAllergens = useMemo(() => {
  if (!debouncedSearch) return allergens
  const searchLower = debouncedSearch.toLowerCase()
  return allergens.filter(allergen =>
    allergen.code.toLowerCase().includes(searchLower) ||
    allergen.name_en.toLowerCase().includes(searchLower) ||
    // ... other fields
  )
}, [allergens, debouncedSearch])
```

### Icon Optimization

Next.js Image component provides automatic optimization:

- Lazy loading (icons load as they enter viewport)
- WebP conversion for supported browsers
- Responsive sizing (24x24 or 48x48)

---

## Testing

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react'
import { AllergenIcon, AllergenBadge } from '@/components/settings/allergens'

describe('AllergenIcon', () => {
  it('should display icon when icon_url provided', () => {
    render(<AllergenIcon icon_url="/icons/milk.svg" name="Milk" />)
    expect(screen.getByAltText('Milk allergen icon')).toBeInTheDocument()
  })

  it('should display fallback when icon_url is null', () => {
    render(<AllergenIcon icon_url={null} name="Unknown" />)
    expect(screen.getByLabelText(/fallback/)).toBeInTheDocument()
  })
})

describe('AllergenBadge', () => {
  const allergen = {
    id: '1',
    code: 'A07',
    name_en: 'Milk',
    name_pl: 'Mleko',
    // ... other fields
  }

  it('should display code and localized name', () => {
    render(<AllergenBadge allergen={allergen} language="en" />)
    expect(screen.getByText(/A07 - Milk/)).toBeInTheDocument()
  })

  it('should display Polish name when language is pl', () => {
    render(<AllergenBadge allergen={allergen} language="pl" />)
    expect(screen.getByText(/A07 - Mleko/)).toBeInTheDocument()
  })
})
```

### Integration Tests

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AllergensDataTable } from '@/components/settings/allergens'

describe('AllergensDataTable', () => {
  const mockAllergens = [
    { id: '1', code: 'A07', name_en: 'Milk', name_pl: 'Mleko', ... },
    { id: '2', code: 'A08', name_en: 'Nuts', name_pl: 'Orzechy', ... },
  ]

  it('should filter allergens by search', async () => {
    render(<AllergensDataTable allergens={mockAllergens} />)

    const searchInput = screen.getByLabelText('Search allergens')
    fireEvent.change(searchInput, { target: { value: 'milk' } })

    await waitFor(() => {
      expect(screen.getByText('Milk')).toBeInTheDocument()
      expect(screen.queryByText('Nuts')).not.toBeInTheDocument()
    })
  })

  it('should show skeleton loader when loading', () => {
    render(<AllergensDataTable allergens={[]} isLoading={true} />)
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument()
  })
})
```

---

## Common Issues

### Issue: Icons Not Displaying

**Problem**: Icons show fallback even though icon_url is set

**Solution**:
1. Verify icons exist in `public/icons/allergens/`
2. Check icon_url path format: `/icons/allergens/gluten.svg` (starts with `/`)
3. Ensure Next.js public folder is correctly configured

### Issue: Search Not Working

**Problem**: Search doesn't filter allergens

**Solution**:
1. Verify debounced search is used (not direct searchValue)
2. Check search logic includes all language fields
3. Ensure case-insensitive comparison (`.toLowerCase()`)

### Issue: Tooltips Not Showing

**Problem**: Hover tooltips don't appear

**Solution**:
1. Verify `TooltipProvider` wraps the table
2. Check `TooltipTrigger` has `asChild` prop
3. Ensure tooltip content is valid

---

## Future Enhancements

### Phase 2
- Add "Copy to clipboard" button for allergen codes
- Export allergen list as CSV/PDF
- Print-friendly view for allergen reference sheet

### Phase 3
- Custom allergen creation (org-specific)
- Allergen icon upload
- Additional language support (ES, IT, NL)
- Allergen grouping (cereals, dairy, nuts, etc.)

---

## Related Documentation

- [Allergen API Documentation](../../api/settings/allergens.md)
- [Allergen Developer Guide](../../guides/allergen-management.md)
- [Database Schema - Allergens Table](../../database/migrations/allergens.md)
- [ShadCN UI Components](https://ui.shadcn.com/)
