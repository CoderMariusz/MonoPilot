# Implementation Guidelines

## Overview
This document provides comprehensive guidelines for implementing API endpoints, data flow patterns, and error handling in the MonoPilot application.

## API Endpoint Implementation

### 1. API Class Structure
All API classes should follow this consistent pattern:

```typescript
// lib/api/[entity].ts
import { supabase } from '@/lib/supabase/client'
import type { Entity, CreateEntityData, UpdateEntityData } from '@/lib/types'

export class EntityAPI {
  static async getAll(): Promise<Entity[]> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching entities:', error)
      throw new Error('Failed to fetch entities')
    }

    return data || []
  }

  static async getById(id: number): Promise<Entity | null> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching entity:', error)
      return null
    }

    return data
  }

  static async create(data: CreateEntityData): Promise<Entity> {
    const { data: result, error } = await supabase
      .from('entities')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Error creating entity:', error)
      throw new Error('Failed to create entity')
    }

    return result
  }

  static async update(id: number, data: UpdateEntityData): Promise<Entity> {
    const { data: result, error } = await supabase
      .from('entities')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating entity:', error)
      throw new Error('Failed to update entity')
    }

    return result
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('entities')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting entity:', error)
      throw new Error('Failed to delete entity')
    }
  }
}
```

### 2. Required API Classes
Based on the application structure, implement these API classes:

#### Core APIs (Priority 1)
- `ProductsAPI` ✅ (Already implemented)
- `WorkOrdersAPI` - Work order management
- `LicensePlatesAPI` - License plate tracking
- `StockMovesAPI` - Stock movement tracking

#### Settings APIs (Priority 2)
- `LocationsAPI` - Location management
- `MachinesAPI` - Machine management
- `AllergensAPI` - Allergen management
- `SuppliersAPI` - Supplier management
- `WarehousesAPI` - Warehouse management
- `TaxCodesAPI` - Tax code management
- `RoutingsAPI` - Routing management

#### Admin APIs (Priority 3)
- `UsersAPI` - User management
- `SessionsAPI` - Session management
- `SettingsAPI` - Application settings

### 3. API Route Handlers
Create corresponding API route handlers in `app/api/`:

```typescript
// app/api/entities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EntityAPI } from '@/lib/api/entities'

export async function GET() {
  try {
    const entities = await EntityAPI.getAll()
    return NextResponse.json(entities)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch entities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const entity = await EntityAPI.create(data)
    return NextResponse.json(entity, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create entity' },
      { status: 500 }
    )
  }
}
```

```typescript
// app/api/entities/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EntityAPI } from '@/lib/api/entities'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entity = await EntityAPI.getById(parseInt(id))
    
    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(entity)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch entity' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const entity = await EntityAPI.update(parseInt(id), data)
    return NextResponse.json(entity)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update entity' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await EntityAPI.delete(parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete entity' },
      { status: 500 }
    )
  }
}
```

## Data Flow Patterns

### 1. Server Component Data Fetching
```typescript
// app/entities/page.tsx
import { EntityAPI } from '@/lib/api/entities'
import { EntitiesTable } from '@/components/EntitiesTable'

export default async function EntitiesPage() {
  try {
    const entities = await EntityAPI.getAll()
    return <EntitiesTable entities={entities} />
  } catch (error) {
    return <div>Error loading entities</div>
  }
}
```

### 2. Client Component with SWR
```typescript
// components/EntitiesTable.tsx
'use client'

import useSWR from 'swr'
import { EntityAPI } from '@/lib/api/entities'

const fetcher = () => EntityAPI.getAll()

export function EntitiesTable() {
  const { data: entities, error, mutate } = useSWR('entities', fetcher)

  if (error) return <div>Error loading entities</div>
  if (!entities) return <div>Loading...</div>

  const handleDelete = async (id: number) => {
    try {
      await EntityAPI.delete(id)
      mutate() // Refresh data
    } catch (error) {
      console.error('Error deleting entity:', error)
    }
  }

  return (
    <div>
      {entities.map((entity) => (
        <div key={entity.id}>
          {entity.name}
          <button onClick={() => handleDelete(entity.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
```

### 3. Hybrid Approach (Server + Client)
```typescript
// app/entities/page.tsx (Server Component)
import { EntityAPI } from '@/lib/api/entities'
import { EntitiesTable } from '@/components/EntitiesTable'

export default async function EntitiesPage() {
  // Server-side initial data
  const initialEntities = await EntityAPI.getAll()
  
  return (
    <div>
      <h1>Entities</h1>
      <EntitiesTable initialEntities={initialEntities} />
    </div>
  )
}
```

```typescript
// components/EntitiesTable.tsx (Client Component)
'use client'

import { useState, useEffect } from 'react'
import { EntityAPI } from '@/lib/api/entities'

interface EntitiesTableProps {
  initialEntities: Entity[]
}

export function EntitiesTable({ initialEntities }: EntitiesTableProps) {
  const [entities, setEntities] = useState(initialEntities)
  const [loading, setLoading] = useState(false)

  const handleCreate = async (data: CreateEntityData) => {
    setLoading(true)
    try {
      const newEntity = await EntityAPI.create(data)
      setEntities(prev => [...prev, newEntity])
    } catch (error) {
      console.error('Error creating entity:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {entities.map((entity) => (
        <div key={entity.id}>{entity.name}</div>
      ))}
    </div>
  )
}
```

## Error Handling Patterns

### 1. API Level Error Handling
```typescript
// lib/api/entities.ts
export class EntityAPI {
  static async getAll(): Promise<Entity[]> {
    try {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw new APIError('Failed to fetch entities', error.code)
      }

      return data || []
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      console.error('Unexpected error:', error)
      throw new APIError('An unexpected error occurred')
    }
  }
}

// Custom error class
export class APIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'APIError'
  }
}
```

### 2. Component Level Error Handling
```typescript
// components/EntitiesTable.tsx
'use client'

import { useState } from 'react'
import { EntityAPI, APIError } from '@/lib/api/entities'

export function EntitiesTable() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEntities() {
      try {
        setLoading(true)
        setError(null)
        const data = await EntityAPI.getAll()
        setEntities(data)
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.message)
        } else {
          setError('An unexpected error occurred')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchEntities()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {entities.map((entity) => (
        <div key={entity.id}>{entity.name}</div>
      ))}
    </div>
  )
}
```

### 3. Global Error Handling
```typescript
// app/error.tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

## State Management Patterns

### 1. Remove Mock Data from ClientState
```typescript
// lib/clientState.ts
class ClientState {
  // Remove all mock data initializations
  private products: Product[] = [] // ✅ Empty initially
  private workOrders: WorkOrder[] = [] // ✅ Empty initially
  // ... other entities

  // Update getters to fetch from API if empty
  async getProducts(): Promise<Product[]> {
    if (this.products.length === 0) {
      this.products = await ProductsAPI.getAll()
    }
    return [...this.products]
  }

  // Add refresh methods
  async refreshProducts(): Promise<void> {
    this.products = await ProductsAPI.getAll()
    this.notifyProductListeners()
  }
}
```

### 2. SWR Integration
```typescript
// hooks/useEntities.ts
import useSWR from 'swr'
import { EntityAPI } from '@/lib/api/entities'

export function useEntities() {
  const { data, error, mutate } = useSWR('entities', () => EntityAPI.getAll())

  return {
    entities: data || [],
    loading: !data && !error,
    error,
    refresh: mutate
  }
}
```

### 3. Context Providers
```typescript
// contexts/EntitiesContext.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { EntityAPI } from '@/lib/api/entities'

interface EntitiesContextType {
  entities: Entity[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createEntity: (data: CreateEntityData) => Promise<void>
  updateEntity: (id: number, data: UpdateEntityData) => Promise<void>
  deleteEntity: (id: number) => Promise<void>
}

const EntitiesContext = createContext<EntitiesContextType | null>(null)

export function EntitiesProvider({ children }: { children: React.ReactNode }) {
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await EntityAPI.getAll()
      setEntities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch entities')
    } finally {
      setLoading(false)
    }
  }

  const createEntity = async (data: CreateEntityData) => {
    try {
      const newEntity = await EntityAPI.create(data)
      setEntities(prev => [...prev, newEntity])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entity')
    }
  }

  const updateEntity = async (id: number, data: UpdateEntityData) => {
    try {
      const updatedEntity = await EntityAPI.update(id, data)
      setEntities(prev => prev.map(entity => 
        entity.id === id ? updatedEntity : entity
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entity')
    }
  }

  const deleteEntity = async (id: number) => {
    try {
      await EntityAPI.delete(id)
      setEntities(prev => prev.filter(entity => entity.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entity')
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <EntitiesContext.Provider value={{
      entities,
      loading,
      error,
      refresh,
      createEntity,
      updateEntity,
      deleteEntity
    }}>
      {children}
    </EntitiesContext.Provider>
  )
}

export function useEntities() {
  const context = useContext(EntitiesContext)
  if (!context) {
    throw new Error('useEntities must be used within EntitiesProvider')
  }
  return context
}
```

## Testing Patterns

### 1. API Testing
```typescript
// __tests__/api/entities.test.ts
import { EntityAPI } from '@/lib/api/entities'
import { createMockSupabase } from '@/lib/supabase/mock'

describe('EntityAPI', () => {
  beforeEach(() => {
    // Setup mock Supabase
    createMockSupabase()
  })

  test('should fetch all entities', async () => {
    const entities = await EntityAPI.getAll()
    expect(entities).toBeDefined()
    expect(Array.isArray(entities)).toBe(true)
  })

  test('should create entity', async () => {
    const entityData = { name: 'Test Entity' }
    const entity = await EntityAPI.create(entityData)
    
    expect(entity).toBeDefined()
    expect(entity.name).toBe('Test Entity')
  })
})
```

### 2. Component Testing
```typescript
// __tests__/components/EntitiesTable.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EntitiesTable } from '@/components/EntitiesTable'
import { EntityAPI } from '@/lib/api/entities'

jest.mock('@/lib/api/entities')

describe('EntitiesTable', () => {
  test('should render entities', async () => {
    const mockEntities = [
      { id: 1, name: 'Entity 1' },
      { id: 2, name: 'Entity 2' }
    ]

    ;(EntityAPI.getAll as jest.Mock).mockResolvedValue(mockEntities)

    render(<EntitiesTable />)

    await waitFor(() => {
      expect(screen.getByText('Entity 1')).toBeInTheDocument()
      expect(screen.getByText('Entity 2')).toBeInTheDocument()
    })
  })
})
```

## Migration Checklist

### Phase 1: Core APIs
- [ ] Implement ProductsAPI ✅
- [ ] Implement WorkOrdersAPI
- [ ] Implement LicensePlatesAPI
- [ ] Implement StockMovesAPI

### Phase 2: Settings APIs
- [ ] Implement LocationsAPI
- [ ] Implement MachinesAPI
- [ ] Implement AllergensAPI
- [ ] Implement SuppliersAPI
- [ ] Implement WarehousesAPI
- [ ] Implement TaxCodesAPI
- [ ] Implement RoutingsAPI

### Phase 3: Admin APIs
- [ ] Implement UsersAPI
- [ ] Implement SessionsAPI
- [ ] Implement SettingsAPI

### Phase 4: Integration
- [ ] Update all components to use APIs
- [ ] Remove mock data from ClientState
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Test all functionality

### Phase 5: Optimization
- [ ] Add caching strategies
- [ ] Implement optimistic updates
- [ ] Add real-time subscriptions
- [ ] Performance testing

## Conclusion

These implementation guidelines ensure:

1. **Consistent API patterns** across all entities
2. **Proper error handling** at all levels
3. **Efficient data flow** from server to client
4. **Maintainable code structure** with clear separation of concerns
5. **Comprehensive testing** coverage
6. **Smooth migration** from mock data to real database

Follow these patterns to ensure a robust, scalable, and maintainable application architecture.
