# Data Flow Patterns

## Overview
This document outlines the correct data flow patterns from database to UI in the MonoPilot application, ensuring optimal performance and maintainability.

## Architecture Overview

```
Database (Supabase) → API Layer → State Management → UI Components
```

## Data Flow Patterns

### 1. Server-Side Data Fetching (Recommended)

#### Pattern: Server Component → Client Component
```typescript
// app/entities/page.tsx (Server Component)
import { EntityAPI } from '@/lib/api/entities'
import { EntitiesTable } from '@/components/EntitiesTable'

export default async function EntitiesPage() {
  // Server-side data fetching
  const entities = await EntityAPI.getAll()
  
  return (
    <div>
      <h1>Entities</h1>
      <EntitiesTable entities={entities} />
    </div>
  )
}
```

```typescript
// components/EntitiesTable.tsx (Client Component)
'use client'

interface EntitiesTableProps {
  entities: Entity[]
}

export function EntitiesTable({ entities }: EntitiesTableProps) {
  // Client-side interactivity
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  
  return (
    <div>
      {entities.map((entity) => (
        <div 
          key={entity.id}
          onClick={() => setSelectedEntity(entity)}
        >
          {entity.name}
        </div>
      ))}
    </div>
  )
}
```

**Benefits:**
- ✅ SEO-friendly
- ✅ Fast initial load
- ✅ Server-side caching
- ✅ No client-side loading states needed

### 2. Client-Side Data Fetching with SWR

#### Pattern: SWR Hook → Component
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

```typescript
// components/EntitiesTable.tsx
'use client'

import { useEntities } from '@/hooks/useEntities'

export function EntitiesTable() {
  const { entities, loading, error, refresh } = useEntities()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      {entities.map((entity) => (
        <div key={entity.id}>{entity.name}</div>
      ))}
    </div>
  )
}
```

**Benefits:**
- ✅ Automatic caching
- ✅ Background revalidation
- ✅ Optimistic updates
- ✅ Error handling

### 3. Hybrid Approach (Server + Client)

#### Pattern: Server Initial Data + Client Updates
```typescript
// app/entities/page.tsx (Server Component)
import { EntityAPI } from '@/lib/api/entities'
import { EntitiesProvider } from '@/contexts/EntitiesContext'

export default async function EntitiesPage() {
  // Server-side initial data
  const initialEntities = await EntityAPI.getAll()
  
  return (
    <EntitiesProvider initialEntities={initialEntities}>
      <EntitiesPageContent />
    </EntitiesProvider>
  )
}
```

```typescript
// contexts/EntitiesContext.tsx
'use client'

import { createContext, useContext, useState } from 'react'
import { EntityAPI } from '@/lib/api/entities'

interface EntitiesContextType {
  entities: Entity[]
  loading: boolean
  error: string | null
  createEntity: (data: CreateEntityData) => Promise<void>
  updateEntity: (id: number, data: UpdateEntityData) => Promise<void>
  deleteEntity: (id: number) => Promise<void>
}

const EntitiesContext = createContext<EntitiesContextType | null>(null)

export function EntitiesProvider({ 
  children, 
  initialEntities 
}: { 
  children: React.ReactNode
  initialEntities: Entity[]
}) {
  const [entities, setEntities] = useState(initialEntities)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createEntity = async (data: CreateEntityData) => {
    setLoading(true)
    try {
      const newEntity = await EntityAPI.create(data)
      setEntities(prev => [...prev, newEntity])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entity')
    } finally {
      setLoading(false)
    }
  }

  const updateEntity = async (id: number, data: UpdateEntityData) => {
    setLoading(true)
    try {
      const updatedEntity = await EntityAPI.update(id, data)
      setEntities(prev => prev.map(entity => 
        entity.id === id ? updatedEntity : entity
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entity')
    } finally {
      setLoading(false)
    }
  }

  const deleteEntity = async (id: number) => {
    setLoading(true)
    try {
      await EntityAPI.delete(id)
      setEntities(prev => prev.filter(entity => entity.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entity')
    } finally {
      setLoading(false)
    }
  }

  return (
    <EntitiesContext.Provider value={{
      entities,
      loading,
      error,
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

**Benefits:**
- ✅ Fast initial load (server data)
- ✅ Real-time updates (client state)
- ✅ Optimistic updates
- ✅ Error handling

## Data Flow by Module

### 1. BOM Module Data Flow

```typescript
// app/technical/bom/page.tsx
import { ProductsAPI } from '@/lib/api/products'
import { BomCatalogClient } from '@/components/BomCatalogClient'

export default async function BOMPage() {
  // Server-side data fetching
  const meatProducts = await ProductsAPI.getByCategory('MEAT')
  const dryGoodsProducts = await ProductsAPI.getByCategory('DRYGOODS')
  const finishedGoodsProducts = await ProductsAPI.getByCategory('FINISHED_GOODS')
  const processProducts = await ProductsAPI.getByCategory('PROCESS')

  return (
    <BomCatalogClient 
      initialData={{
        meat: meatProducts,
        dryGoods: dryGoodsProducts,
        finishedGoods: finishedGoodsProducts,
        process: processProducts
      }}
    />
  )
}
```

```typescript
// components/BomCatalogClient.tsx
'use client'

import { useState } from 'react'
import { ProductsAPI } from '@/lib/api/products'

interface BomCatalogClientProps {
  initialData: {
    meat: Product[]
    dryGoods: Product[]
    finishedGoods: Product[]
    process: Product[]
  }
}

export default function BomCatalogClient({ initialData }: BomCatalogClientProps) {
  const [activeTab, setActiveTab] = useState<'MEAT' | 'DRYGOODS' | 'FINISHED_GOODS' | 'PROCESS'>('MEAT')
  const [products, setProducts] = useState(initialData)

  const handleProductCreate = async (productData: CreateProductData) => {
    try {
      const newProduct = await ProductsAPI.create(productData)
      setProducts(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], newProduct]
      }))
    } catch (error) {
      console.error('Error creating product:', error)
    }
  }

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex space-x-4">
        {Object.keys(products).map((category) => (
          <button
            key={category}
            onClick={() => setActiveTab(category as any)}
            className={activeTab === category ? 'active' : ''}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products table */}
      <ProductsTable 
        products={products[activeTab]}
        onProductCreate={handleProductCreate}
      />
    </div>
  )
}
```

### 2. Settings Module Data Flow

```typescript
// app/settings/page.tsx
import { LocationsAPI } from '@/lib/api/locations'
import { MachinesAPI } from '@/lib/api/machines'
import { AllergensAPI } from '@/lib/api/allergens'
import { SettingsClient } from '@/components/SettingsClient'

export default async function SettingsPage() {
  // Server-side data fetching for all settings
  const [locations, machines, allergens] = await Promise.all([
    LocationsAPI.getAll(),
    MachinesAPI.getAll(),
    AllergensAPI.getAll()
  ])

  return (
    <SettingsClient 
      initialData={{
        locations,
        machines,
        allergens
      }}
    />
  )
}
```

### 3. Production Module Data Flow

```typescript
// app/production/page.tsx
import { WorkOrdersAPI } from '@/lib/api/workOrders'
import { ProductionClient } from '@/components/ProductionClient'

export default async function ProductionPage() {
  // Server-side data fetching
  const workOrders = await WorkOrdersAPI.getActive()
  const productionOutputs = await WorkOrdersAPI.getProductionOutputs()

  return (
    <ProductionClient 
      initialData={{
        workOrders,
        productionOutputs
      }}
    />
  )
}
```

## State Management Patterns

### 1. Remove Mock Data from ClientState

```typescript
// lib/clientState.ts
class ClientState {
  // ❌ Remove mock data initializations
  // private products: Product[] = [...mockProducts]

  // ✅ Start with empty arrays
  private products: Product[] = []
  private workOrders: WorkOrder[] = []
  private locations: Location[] = []
  // ... other entities

  // ✅ Fetch from API if empty
  async getProducts(): Promise<Product[]> {
    if (this.products.length === 0) {
      this.products = await ProductsAPI.getAll()
    }
    return [...this.products]
  }

  // ✅ Add refresh methods
  async refreshProducts(): Promise<void> {
    this.products = await ProductsAPI.getAll()
    this.notifyProductListeners()
  }

  // ✅ Add CRUD methods
  async addProduct(product: CreateProductData): Promise<Product> {
    const newProduct = await ProductsAPI.create(product)
    this.products = [...this.products, newProduct]
    this.notifyProductListeners()
    return newProduct
  }

  async updateProduct(id: number, updates: UpdateProductData): Promise<Product> {
    const updatedProduct = await ProductsAPI.update(id, updates)
    this.products = this.products.map(p => p.id === id ? updatedProduct : p)
    this.notifyProductListeners()
    return updatedProduct
  }

  async deleteProduct(id: number): Promise<void> {
    await ProductsAPI.delete(id)
    this.products = this.products.filter(p => p.id !== id)
    this.notifyProductListeners()
  }
}
```

### 2. SWR Integration

```typescript
// hooks/useProducts.ts
import useSWR from 'swr'
import { ProductsAPI } from '@/lib/api/products'

export function useProducts() {
  const { data, error, mutate } = useSWR('products', () => ProductsAPI.getAll())

  return {
    products: data || [],
    loading: !data && !error,
    error,
    refresh: mutate,
    createProduct: async (data: CreateProductData) => {
      const newProduct = await ProductsAPI.create(data)
      mutate()
      return newProduct
    },
    updateProduct: async (id: number, data: UpdateProductData) => {
      const updatedProduct = await ProductsAPI.update(id, data)
      mutate()
      return updatedProduct
    },
    deleteProduct: async (id: number) => {
      await ProductsAPI.delete(id)
      mutate()
    }
  }
}
```

### 3. Context Providers

```typescript
// contexts/ProductsContext.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { ProductsAPI } from '@/lib/api/products'

interface ProductsContextType {
  products: Product[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createProduct: (data: CreateProductData) => Promise<void>
  updateProduct: (id: number, data: UpdateProductData) => Promise<void>
  deleteProduct: (id: number) => Promise<void>
}

const ProductsContext = createContext<ProductsContextType | null>(null)

export function ProductsProvider({ 
  children, 
  initialProducts 
}: { 
  children: React.ReactNode
  initialProducts: Product[]
}) {
  const [products, setProducts] = useState(initialProducts)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ProductsAPI.getAll()
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const createProduct = async (data: CreateProductData) => {
    try {
      setLoading(true)
      setError(null)
      const newProduct = await ProductsAPI.create(data)
      setProducts(prev => [...prev, newProduct])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  const updateProduct = async (id: number, data: UpdateProductData) => {
    try {
      setLoading(true)
      setError(null)
      const updatedProduct = await ProductsAPI.update(id, data)
      setProducts(prev => prev.map(product => 
        product.id === id ? updatedProduct : product
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      await ProductsAPI.delete(id)
      setProducts(prev => prev.filter(product => product.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProductsContext.Provider value={{
      products,
      loading,
      error,
      refresh,
      createProduct,
      updateProduct,
      deleteProduct
    }}>
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductsContext)
  if (!context) {
    throw new Error('useProducts must be used within ProductsProvider')
  }
  return context
}
```

## Performance Optimization

### 1. Caching Strategies

```typescript
// Server Component with caching
export default async function ProductsPage() {
  // Cache for 1 hour
  const products = await ProductsAPI.getAll()
  
  return <ProductsList products={products} />
}

// Add caching headers
export const revalidate = 3600 // 1 hour
```

### 2. Optimistic Updates

```typescript
// components/ProductForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { ProductsAPI } from '@/lib/api/products'

export default function ProductForm() {
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      try {
        await ProductsAPI.create({ name })
        setName('')
        // Optimistic update - UI updates immediately
      } catch (error) {
        console.error('Error creating product:', error)
        // Revert optimistic update on error
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Product name"
        required
      />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  )
}
```

### 3. Real-Time Updates

```typescript
// components/ProductsList.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function ProductsList({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('products')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload) => {
          setProducts(prev => [...prev, payload.new])
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          setProducts(prev => prev.map(product => 
            product.id === payload.new.id ? payload.new : product
          ))
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'products' },
        (payload) => {
          setProducts(prev => prev.filter(product => 
            product.id !== payload.old.id
          ))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

## Error Handling Patterns

### 1. API Level Error Handling

```typescript
// lib/api/products.ts
export class ProductsAPI {
  static async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw new APIError('Failed to fetch products', error.code)
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
```

### 2. Component Level Error Handling

```typescript
// components/ProductsList.tsx
'use client'

import { useState, useEffect } from 'react'
import { ProductsAPI, APIError } from '@/lib/api/products'

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        setError(null)
        const data = await ProductsAPI.getAll()
        setProducts(data)
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

    fetchProducts()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

## Migration Strategy

### Phase 1: Core Data Flow
1. ✅ Implement ProductsAPI
2. Update BOM page to use server-side data fetching
3. Remove mock data from ClientState
4. Test BOM functionality

### Phase 2: Settings Data Flow
1. Implement settings APIs (Locations, Machines, Allergens, etc.)
2. Update settings page to use server-side data fetching
3. Remove mock data from settings components
4. Test settings functionality

### Phase 3: Production Data Flow
1. Implement production APIs (WorkOrders, etc.)
2. Update production page to use server-side data fetching
3. Remove mock data from production components
4. Test production functionality

### Phase 4: Optimization
1. Add caching strategies
2. Implement optimistic updates
3. Add real-time subscriptions
4. Performance testing

## Conclusion

These data flow patterns ensure:

1. **Optimal Performance**: Server-side data fetching for initial load
2. **Real-time Updates**: Client-side state management for interactivity
3. **Error Handling**: Comprehensive error handling at all levels
4. **Maintainability**: Clear separation of concerns
5. **Scalability**: Patterns that work for all modules

Follow these patterns to ensure a robust, performant, and maintainable application architecture.
