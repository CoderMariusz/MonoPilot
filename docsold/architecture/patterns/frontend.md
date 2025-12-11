# Frontend Architecture

## Overview

Next.js 15 App Router application with React 19, TypeScript, Tailwind CSS, and Shadcn/UI components.

## Application Structure

```
apps/frontend/
├── app/                    # App Router pages
│   ├── (auth)/            # Auth group (login, signup)
│   ├── (dashboard)/       # Dashboard layout group
│   │   ├── planning/      # Planning module
│   │   ├── production/    # Production module
│   │   ├── warehouse/     # Warehouse module
│   │   ├── technical/     # Technical module
│   │   ├── quality/       # Quality module
│   │   ├── shipping/      # Shipping module
│   │   ├── scanner/       # Scanner PWA
│   │   └── settings/      # Settings module
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # Shared components
│   ├── ui/               # Shadcn/UI primitives
│   ├── forms/            # Form components
│   ├── tables/           # Data table components
│   └── layouts/          # Layout components
├── lib/                   # Utilities and services
│   ├── api/              # API classes
│   ├── hooks/            # Custom hooks
│   ├── supabase/         # Supabase clients
│   └── utils/            # Helper functions
└── styles/               # Global styles
```

## Component Architecture

### Server vs Client Components
```typescript
// Default: Server Component (data fetching)
// app/planning/work-orders/page.tsx
export default async function WorkOrdersPage() {
  const workOrders = await WorkOrdersAPI.getAll()

  return (
    <div>
      <WorkOrdersHeader />
      <WorkOrdersTable data={workOrders} />
    </div>
  )
}

// Client Component (interactivity)
// components/WorkOrdersTable.tsx
'use client'

import { useState } from 'react'

export function WorkOrdersTable({ data }: Props) {
  const [selected, setSelected] = useState<string[]>([])

  return (
    <DataTable
      data={data}
      onSelect={setSelected}
      // ...
    />
  )
}
```

### Component Strategy
| Type | Usage | Example |
|------|-------|---------|
| Server | Data fetching, SEO, static | Page layouts, lists |
| Client | Interactivity, state, events | Forms, tables, modals |
| Mixed | Composition of both | Page with interactive table |

## State Management

### SWR for Data Fetching
```typescript
// lib/hooks/useWorkOrders.ts
import useSWR from 'swr'

export function useWorkOrders(filters?: WOFilters) {
  const key = filters
    ? `/api/work-orders?${new URLSearchParams(filters)}`
    : '/api/work-orders'

  const { data, error, mutate, isLoading } = useSWR(key, fetcher)

  return {
    workOrders: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Optimistic update
async function updateWOStatus(id: string, status: string) {
  // Optimistic update
  mutate(
    (current) => ({
      ...current,
      data: current.data.map(wo =>
        wo.id === id ? { ...wo, status } : wo
      ),
    }),
    false // Don't revalidate yet
  )

  // API call
  await WorkOrdersAPI.updateStatus(id, status)

  // Revalidate
  mutate()
}
```

### Optimistic Updates
Enabled for key operations:
- LP moves
- WO status changes
- PO status changes
- Receive/delivery operations

### Complex State (Phase 4)
```typescript
// Future: Zustand for complex UI state
import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  notifications: Notification[]
  toggleSidebar: () => void
  addNotification: (n: Notification) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  notifications: [],
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  addNotification: (n) => set(s => ({
    notifications: [...s.notifications, n]
  })),
}))
```

## Form Management

### React Hook Form + Zod
```typescript
// components/forms/CreateWOForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createWOSchema, CreateWOInput } from '@/lib/schemas'

export function CreateWOForm({ onSuccess }: Props) {
  const form = useForm<CreateWOInput>({
    resolver: zodResolver(createWOSchema),
    defaultValues: {
      quantity: 1,
      uom: 'EA',
    },
  })

  const onSubmit = async (data: CreateWOInput) => {
    try {
      const wo = await WorkOrdersAPI.create(data)
      onSuccess(wo)
    } catch (error) {
      if (error instanceof APIError) {
        // Set field errors from API
        Object.entries(error.errors || {}).forEach(([field, messages]) => {
          form.setError(field as any, { message: messages[0] })
        })
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="product_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <ProductSelect {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More fields... */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Create Work Order
        </Button>
      </form>
    </Form>
  )
}
```

## UI Components

### Shadcn/UI Base
```typescript
// components/ui/button.tsx
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```

### Data Table Component
```typescript
// components/tables/DataTable.tsx
'use client'

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'

export function DataTable<T>({
  data,
  columns,
  onRowSelect,
  searchColumn,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [filtering, setFiltering] = useState('')
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      globalFilter: filtering,
      rowSelection,
    },
  })

  return (
    <div>
      <Input
        placeholder="Search..."
        value={filtering}
        onChange={(e) => setFiltering(e.target.value)}
      />
      <Table>
        {/* Table implementation */}
      </Table>
      <DataTablePagination table={table} />
    </div>
  )
}
```

## Offline Support (PWA)

### Service Worker Setup
```typescript
// public/sw.js
const CACHE_NAME = 'monopilot-v1'
const OFFLINE_URLS = [
  '/',
  '/scanner',
  '/offline',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS)
    })
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone)
        })
        return response
      })
      .catch(() => {
        // Return cached version
        return caches.match(event.request)
      })
  )
})
```

### Offline Toggle (Per Org)
```typescript
// Controlled via settings
interface OrgSettings {
  enable_offline_mode: boolean
  offline_sync_interval: number // minutes
}

// Component respects setting
function ScannerPage() {
  const { settings } = useOrgSettings()

  if (settings.enable_offline_mode) {
    return <OfflineEnabledScanner />
  }

  return <OnlineOnlyScanner />
}
```

### Sync Strategy
```typescript
// lib/sync/offlineSync.ts
interface SyncQueue {
  id: string
  action: 'create' | 'update'
  entity: string
  data: unknown
  timestamp: number
}

// Queue operations when offline
export async function queueOfflineOperation(op: Omit<SyncQueue, 'id' | 'timestamp'>) {
  const queue = await getOfflineQueue()
  queue.push({
    ...op,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  })
  await saveOfflineQueue(queue)
}

// Sync when back online
export async function syncOfflineQueue() {
  const queue = await getOfflineQueue()

  for (const op of queue) {
    try {
      await syncOperation(op)
      await removeFromQueue(op.id)
    } catch (error) {
      // Keep in queue for retry
      console.error('Sync failed:', error)
    }
  }
}

// Background sync registration
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.sync.register('offline-sync')
  })
}
```

### Conflict Resolution
```typescript
// Simple last-write-wins for MVP
// Server timestamp takes precedence
interface SyncResult {
  success: boolean
  conflict?: {
    local: unknown
    server: unknown
    resolved: unknown
  }
}
```

## Accessibility

### WCAG AA Compliance
```typescript
// All interactive elements
<Button
  aria-label="Create work order"
  aria-describedby="wo-help"
>
  Create
</Button>

// Focus management
useEffect(() => {
  if (isOpen) {
    firstInputRef.current?.focus()
  }
}, [isOpen])

// Keyboard navigation
function handleKeyDown(e: KeyboardEvent) {
  switch (e.key) {
    case 'Escape':
      onClose()
      break
    case 'Enter':
      if (e.ctrlKey) onSubmit()
      break
  }
}
```

### RTL Support
```typescript
// Layout direction from org settings
<html dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>

// Tailwind RTL utilities
<div className="ml-4 rtl:mr-4 rtl:ml-0">
  {/* Content */}
</div>
```

## Internationalization

### Setup
```typescript
// lib/i18n/index.ts
import { createI18n } from 'next-intl'

export const locales = ['en', 'pl'] as const
export type Locale = typeof locales[number]

// Org-level language setting
export async function getOrgLocale(orgId: string): Promise<Locale> {
  const settings = await getOrgSettings(orgId)
  return settings.language || 'en'
}
```

### Usage
```typescript
// components/WorkOrderStatus.tsx
import { useTranslations } from 'next-intl'

export function WorkOrderStatus({ status }: Props) {
  const t = useTranslations('WorkOrder')

  return (
    <Badge variant={getStatusVariant(status)}>
      {t(`status.${status}`)}
    </Badge>
  )
}

// messages/en.json
{
  "WorkOrder": {
    "status": {
      "draft": "Draft",
      "scheduled": "Scheduled",
      "in_progress": "In Progress",
      "completed": "Completed"
    }
  }
}

// messages/pl.json
{
  "WorkOrder": {
    "status": {
      "draft": "Szkic",
      "scheduled": "Zaplanowane",
      "in_progress": "W trakcie",
      "completed": "Zakończone"
    }
  }
}
```

### Content Translation
```typescript
// Product names stored in multiple languages
interface ProductTranslation {
  product_id: string
  locale: string
  name: string
  description: string
}

// Fallback chain
function getProductName(product: Product, locale: Locale): string {
  return product.translations[locale]?.name
    || product.translations['en']?.name
    || product.name
}
```

## Performance

### Image Optimization
```typescript
import Image from 'next/image'

<Image
  src={product.image_url}
  alt={product.name}
  width={200}
  height={200}
  placeholder="blur"
  blurDataURL={product.blur_hash}
/>
```

### Code Splitting
```typescript
// Dynamic imports for heavy components
const BOMDiffView = dynamic(() => import('@/components/BOMDiffView'), {
  loading: () => <Skeleton className="h-96" />,
})

// Route-based splitting (automatic with App Router)
```

### Prefetching
```typescript
// Link prefetch (default in Next.js)
<Link href="/planning/work-orders" prefetch>
  Work Orders
</Link>

// Manual prefetch for likely navigation
router.prefetch('/planning/work-orders/new')
```

## Error Boundaries

```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error tracking (Phase 3)
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

## Testing

### Component Testing
```typescript
// __tests__/components/WorkOrdersTable.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkOrdersTable } from '@/components/WorkOrdersTable'

describe('WorkOrdersTable', () => {
  it('renders work orders', () => {
    render(<WorkOrdersTable data={mockWorkOrders} />)

    expect(screen.getByText('WO-001')).toBeInTheDocument()
  })

  it('handles row selection', async () => {
    const onSelect = jest.fn()
    render(<WorkOrdersTable data={mockWorkOrders} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('checkbox', { name: /select wo-001/i }))

    expect(onSelect).toHaveBeenCalledWith(['wo-001-id'])
  })
})
```

### E2E Testing
```typescript
// e2e/work-orders.spec.ts
import { test, expect } from '@playwright/test'

test('create work order flow', async ({ page }) => {
  await page.goto('/planning/work-orders')
  await page.click('button:has-text("Create")')

  await page.fill('[name="product_id"]', 'Product A')
  await page.fill('[name="quantity"]', '100')
  await page.click('button:has-text("Save")')

  await expect(page.locator('.toast')).toContainText('Work order created')
})
```
