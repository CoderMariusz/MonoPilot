# Error Handling Patterns

## Overview
This document outlines standard error handling approaches for the MonoPilot application, ensuring robust error management at all levels.

## Error Types and Classification

### 1. API Errors
```typescript
// lib/errors/APIError.ts
export class APIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// lib/errors/ValidationError.ts
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// lib/errors/NetworkError.ts
export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message)
    this.name = 'NetworkError'
  }
}
```

### 2. Error Classification
```typescript
// lib/errors/types.ts
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

export interface ErrorDetails {
  type: ErrorType
  message: string
  code?: string
  field?: string
  timestamp: string
  userId?: string
  requestId?: string
}
```

## API Level Error Handling

### 1. Supabase Error Handling
```typescript
// lib/api/base.ts
import { PostgrestError } from '@supabase/supabase-js'
import { APIError, ValidationError, NetworkError } from '@/lib/errors'

export function handleSupabaseError(error: PostgrestError): never {
  console.error('Supabase error:', error)

  switch (error.code) {
    case '23505': // Unique constraint violation
      throw new ValidationError('This record already exists', 'unique_constraint')
    
    case '23503': // Foreign key constraint violation
      throw new ValidationError('Referenced record does not exist', 'foreign_key')
    
    case '23502': // Not null constraint violation
      throw new ValidationError('Required field is missing', 'not_null')
    
    case 'PGRST116': // Row not found
      throw new APIError('Record not found', 'NOT_FOUND', 404)
    
    case 'PGRST301': // JWT expired
      throw new APIError('Authentication expired', 'AUTHENTICATION', 401)
    
    default:
      throw new APIError('Database operation failed', error.code, 500, error)
  }
}

export function handleNetworkError(error: Error): never {
  console.error('Network error:', error)
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new NetworkError('Network connection failed', error)
  }
  
  throw new APIError('Network operation failed', 'NETWORK', 500, error)
}
```

### 2. API Class Error Handling
```typescript
// lib/api/products.ts
import { supabase } from '@/lib/supabase/client'
import { handleSupabaseError, handleNetworkError } from '@/lib/api/base'
import { APIError, ValidationError } from '@/lib/errors'

export class ProductsAPI {
  static async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        handleSupabaseError(error)
      }

      return data || []
    } catch (error) {
      if (error instanceof APIError || error instanceof ValidationError) {
        throw error
      }
      handleNetworkError(error as Error)
    }
  }

  static async create(data: CreateProductData): Promise<Product> {
    try {
      // Validate input
      if (!data.name || data.name.trim().length === 0) {
        throw new ValidationError('Product name is required', 'name')
      }

      if (data.name.length > 100) {
        throw new ValidationError('Product name must be less than 100 characters', 'name')
      }

      const { data: result, error } = await supabase
        .from('products')
        .insert(data)
        .select()
        .single()

      if (error) {
        handleSupabaseError(error)
      }

      return result
    } catch (error) {
      if (error instanceof APIError || error instanceof ValidationError) {
        throw error
      }
      handleNetworkError(error as Error)
    }
  }

  static async update(id: number, data: UpdateProductData): Promise<Product> {
    try {
      if (!id || id <= 0) {
        throw new ValidationError('Invalid product ID', 'id')
      }

      const { data: result, error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        handleSupabaseError(error)
      }

      if (!result) {
        throw new APIError('Product not found', 'NOT_FOUND', 404)
      }

      return result
    } catch (error) {
      if (error instanceof APIError || error instanceof ValidationError) {
        throw error
      }
      handleNetworkError(error as Error)
    }
  }

  static async delete(id: number): Promise<void> {
    try {
      if (!id || id <= 0) {
        throw new ValidationError('Invalid product ID', 'id')
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
        handleSupabaseError(error)
      }
    } catch (error) {
      if (error instanceof APIError || error instanceof ValidationError) {
        throw error
      }
      handleNetworkError(error as Error)
    }
  }
}
```

## Component Level Error Handling

### 1. Error Boundary Component
```typescript
// components/ErrorBoundary.tsx
'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>An unexpected error occurred. Please try refreshing the page.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 2. Error Display Component
```typescript
// components/ErrorDisplay.tsx
'use client'

import { APIError, ValidationError, NetworkError } from '@/lib/errors'

interface ErrorDisplayProps {
  error: Error | null
  onRetry?: () => void
  onDismiss?: () => void
}

export function ErrorDisplay({ error, onRetry, onDismiss }: ErrorDisplayProps) {
  if (!error) return null

  const getErrorMessage = (error: Error): string => {
    if (error instanceof ValidationError) {
      return `Validation Error: ${error.message}`
    }
    
    if (error instanceof NetworkError) {
      return 'Network Error: Please check your connection and try again'
    }
    
    if (error instanceof APIError) {
      return `API Error: ${error.message}`
    }
    
    return 'An unexpected error occurred'
  }

  const getErrorType = (error: Error): string => {
    if (error instanceof ValidationError) return 'validation'
    if (error instanceof NetworkError) return 'network'
    if (error instanceof APIError) return 'api'
    return 'unknown'
  }

  return (
    <div className={`error-display error-${getErrorType(error)}`}>
      <div className="error-content">
        <h3>Error</h3>
        <p>{getErrorMessage(error)}</p>
        
        <div className="error-actions">
          {onRetry && (
            <button onClick={onRetry} className="btn-retry">
              Try Again
            </button>
          )}
          {onDismiss && (
            <button onClick={onDismiss} className="btn-dismiss">
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 3. Form Error Handling
```typescript
// components/ProductForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { ProductsAPI } from '@/lib/api/products'
import { APIError, ValidationError } from '@/lib/errors'
import { ErrorDisplay } from '@/components/ErrorDisplay'

export default function ProductForm() {
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<Error | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      try {
        setError(null)
        setFieldErrors({})
        
        await ProductsAPI.create({ name })
        setName('')
      } catch (err) {
        if (err instanceof ValidationError) {
          setFieldErrors({ [err.field || 'name']: err.message })
        } else if (err instanceof APIError) {
          setError(err)
        } else {
          setError(new Error('An unexpected error occurred'))
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Product Name</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldErrors.name ? 'error' : ''}
          required
        />
        {fieldErrors.name && (
          <span className="field-error">{fieldErrors.name}</span>
        )}
      </div>

      <ErrorDisplay 
        error={error} 
        onRetry={() => setError(null)}
        onDismiss={() => setError(null)}
      />

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  )
}
```

## Context Level Error Handling

### 1. Error Context
```typescript
// contexts/ErrorContext.tsx
'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { ErrorDisplay } from '@/components/ErrorDisplay'

interface ErrorContextType {
  error: Error | null
  setError: (error: Error | null) => void
  clearError: () => void
  handleError: (error: Error) => void
}

const ErrorContext = createContext<ErrorContextType | null>(null)

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((error: Error) => {
    console.error('Context error:', error)
    setError(error)
  }, [])

  return (
    <ErrorContext.Provider value={{
      error,
      setError,
      clearError,
      handleError
    }}>
      {children}
      <ErrorDisplay 
        error={error} 
        onRetry={clearError}
        onDismiss={clearError}
      />
    </ErrorContext.Provider>
  )
}

export function useError() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within ErrorProvider')
  }
  return context
}
```

### 2. Products Context with Error Handling
```typescript
// contexts/ProductsContext.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { ProductsAPI } from '@/lib/api/products'
import { APIError, ValidationError } from '@/lib/errors'
import { useError } from '@/contexts/ErrorContext'

interface ProductsContextType {
  products: Product[]
  loading: boolean
  error: Error | null
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
  const [error, setError] = useState<Error | null>(null)
  const { handleError } = useError()

  const refresh = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ProductsAPI.getAll()
      setProducts(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch products')
      setError(error)
      handleError(error)
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
      const error = err instanceof Error ? err : new Error('Failed to create product')
      setError(error)
      handleError(error)
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
      const error = err instanceof Error ? err : new Error('Failed to update product')
      setError(error)
      handleError(error)
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
      const error = err instanceof Error ? err : new Error('Failed to delete product')
      setError(error)
      handleError(error)
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

## Server Component Error Handling

### 1. Server Component Error Page
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
    <div className="error-page">
      <h2>Something went wrong!</h2>
      <p>An unexpected error occurred. Please try again.</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### 2. Server Component with Error Handling
```typescript
// app/products/page.tsx
import { ProductsAPI } from '@/lib/api/products'
import { ProductsList } from '@/components/ProductsList'
import { APIError, ValidationError } from '@/lib/errors'

export default async function ProductsPage() {
  try {
    const products = await ProductsAPI.getAll()
    return <ProductsList products={products} />
  } catch (error) {
    console.error('Server component error:', error)
    
    if (error instanceof APIError) {
      return (
        <div className="error-page">
          <h2>API Error</h2>
          <p>{error.message}</p>
        </div>
      )
    }
    
    if (error instanceof ValidationError) {
      return (
        <div className="error-page">
          <h2>Validation Error</h2>
          <p>{error.message}</p>
        </div>
      )
    }
    
    return (
      <div className="error-page">
        <h2>Something went wrong</h2>
        <p>An unexpected error occurred. Please try again later.</p>
      </div>
    )
  }
}
```

## Global Error Handling

### 1. Global Error Handler
```typescript
// lib/errors/globalHandler.ts
import { APIError, ValidationError, NetworkError } from '@/lib/errors'

export function globalErrorHandler(error: Error, context?: string) {
  console.error(`Global error${context ? ` in ${context}` : ''}:`, error)
  
  // Log to external service (e.g., Sentry)
  if (typeof window !== 'undefined') {
    // Client-side logging
    // Sentry.captureException(error)
  } else {
    // Server-side logging
    // logger.error(error)
  }
  
  // Return user-friendly message
  if (error instanceof ValidationError) {
    return `Validation Error: ${error.message}`
  }
  
  if (error instanceof NetworkError) {
    return 'Network Error: Please check your connection and try again'
  }
  
  if (error instanceof APIError) {
    return `API Error: ${error.message}`
  }
  
  return 'An unexpected error occurred'
}
```

### 2. Error Logging Service
```typescript
// lib/errors/logger.ts
interface ErrorLog {
  message: string
  stack?: string
  context?: string
  userId?: string
  timestamp: string
  userAgent?: string
  url?: string
}

export class ErrorLogger {
  static log(error: Error, context?: string, userId?: string) {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      context,
      userId,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorLog)
    }
    
    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(errorLog)
    }
  }
  
  private static sendToExternalService(errorLog: ErrorLog) {
    // Implement external logging service integration
    // e.g., Sentry, LogRocket, etc.
  }
}
```

## Testing Error Handling

### 1. Error Boundary Testing
```typescript
// __tests__/components/ErrorBoundary.test.tsx
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

test('ErrorBoundary catches errors', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  
  render(
    <ErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ErrorBoundary>
  )
  
  expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  
  consoleSpy.mockRestore()
})
```

### 2. API Error Testing
```typescript
// __tests__/api/products.test.ts
import { ProductsAPI } from '@/lib/api/products'
import { APIError, ValidationError } from '@/lib/errors'

describe('ProductsAPI Error Handling', () => {
  test('should throw ValidationError for invalid input', async () => {
    await expect(ProductsAPI.create({ name: '' })).rejects.toThrow(ValidationError)
  })
  
  test('should throw APIError for server errors', async () => {
    // Mock Supabase to return error
    jest.spyOn(ProductsAPI, 'create').mockRejectedValue(new APIError('Server error'))
    
    await expect(ProductsAPI.create({ name: 'Test' })).rejects.toThrow(APIError)
  })
})
```

## Error Recovery Strategies

### 1. Retry Logic
```typescript
// lib/utils/retry.ts
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxAttempts) {
        throw lastError
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError!
}
```

### 2. Fallback Data
```typescript
// components/ProductsList.tsx
'use client'

import { useState, useEffect } from 'react'
import { ProductsAPI } from '@/lib/api/products'
import { retry } from '@/lib/utils/retry'

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        setError(null)
        
        // Retry logic with fallback
        const data = await retry(() => ProductsAPI.getAll(), 3, 1000)
        setProducts(data)
      } catch (err) {
        setError(err as Error)
        
        // Fallback to cached data or empty array
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

## Conclusion

These error handling patterns ensure:

1. **Comprehensive Coverage**: Error handling at all levels (API, Component, Context, Global)
2. **User Experience**: Clear error messages and recovery options
3. **Developer Experience**: Detailed error logging and debugging information
4. **Robustness**: Graceful degradation and fallback strategies
5. **Maintainability**: Consistent error handling patterns across the application

Follow these patterns to ensure a robust, user-friendly, and maintainable error handling system.
