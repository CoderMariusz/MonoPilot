/**
 * ProductSelector Component (Story 02.4)
 * Searchable combobox for selecting products (FG/WIP types)
 *
 * Features:
 * - Debounced search (300ms)
 * - Filter by product type (FG, WIP)
 * - Displays product code + name
 * - Locked mode for edit forms
 * - Keyboard navigation support
 * - All 4 UI states
 *
 * Acceptance Criteria:
 * - AC-10: Product selection with search
 * - AC-15: Product locked in edit mode
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, ChevronsUpDown, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Product {
  id: string
  code: string
  name: string
  type: string
  uom: string
}

interface ProductSelectorProps {
  value: string | null
  onChange: (productId: string | null, product: Product | null) => void
  disabled?: boolean
  locked?: boolean
  lockedProduct?: Product | null
  placeholder?: string
  className?: string
  'aria-label'?: string
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

export function ProductSelector({
  value,
  onChange,
  disabled = false,
  locked = false,
  lockedProduct = null,
  placeholder = 'Select product...',
  className,
  'aria-label': ariaLabel = 'Select product',
}: ProductSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(lockedProduct)

  const debouncedSearch = useDebounce(search, 300)

  // Fetch products based on search
  const fetchProducts = useCallback(async (searchTerm: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      // Filter to FG and WIP types only (products that can have BOMs)
      params.append('type', 'FG,WIP')
      params.append('status', 'active')
      params.append('limit', '20')

      const response = await fetch(`/api/technical/products?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      setProducts(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch products when search changes
  useEffect(() => {
    if (open) {
      fetchProducts(debouncedSearch)
    }
  }, [debouncedSearch, open, fetchProducts])

  // Fetch selected product details when value changes
  useEffect(() => {
    if (value && !selectedProduct) {
      // Fetch product details for the selected value
      fetch(`/api/technical/products/${value}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setSelectedProduct(data.data)
          }
        })
        .catch(() => {
          // Ignore errors - product details are optional
        })
    }
  }, [value, selectedProduct])

  // Handle selection
  const handleSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId) || null
    setSelectedProduct(product)
    onChange(productId, product)
    setOpen(false)
    setSearch('')
  }

  // Handle clear
  const handleClear = () => {
    setSelectedProduct(null)
    onChange(null, null)
  }

  // Locked state - display only
  if (locked && lockedProduct) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2',
          className
        )}
        aria-label={ariaLabel}
      >
        <span className="font-mono text-sm font-medium">{lockedProduct.code}</span>
        <span className="text-sm text-muted-foreground">{lockedProduct.name}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {lockedProduct.type}
        </Badge>
      </div>
    )
  }

  // Display value
  const displayValue = selectedProduct
    ? `${selectedProduct.code} - ${selectedProduct.name}`
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selectedProduct && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search products by code or name..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {/* Loading State */}
            {loading && (
              <div className="p-4 space-y-2" role="status" aria-busy="true">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching products...</span>
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="p-4" role="alert">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 p-0 h-auto"
                  onClick={() => fetchProducts(debouncedSearch)}
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && products.length === 0 && (
              <CommandEmpty>
                {search ? 'No products found.' : 'Type to search products...'}
              </CommandEmpty>
            )}

            {/* Success State - Product List */}
            {!loading && !error && products.length > 0 && (
              <CommandGroup heading="Products (FG/WIP)">
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={handleSelect}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === product.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-1 items-center gap-2">
                      <span className="font-mono text-sm font-medium">
                        {product.code}
                      </span>
                      <span className="text-sm text-muted-foreground truncate">
                        {product.name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {product.type}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default ProductSelector
