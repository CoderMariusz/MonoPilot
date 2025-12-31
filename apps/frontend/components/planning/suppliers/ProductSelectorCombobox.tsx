/**
 * ProductSelectorCombobox Component
 * Story: 03.2 - Supplier-Product Assignment
 *
 * Searchable product dropdown with type-ahead for selecting products
 */

'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2, Package } from 'lucide-react'
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

// Debounce delay for search input (in milliseconds)
const DEBOUNCE_DELAY_MS = 300

interface Product {
  id: string
  code: string
  name: string
  uom: string
}

interface ProductSelectorComboboxProps {
  value: string | null
  onChange: (productId: string) => void
  excludeIds?: string[]
  disabled?: boolean
  placeholder?: string
  className?: string
}

/**
 * ProductSelectorCombobox - Searchable product dropdown
 *
 * Features:
 * - Search products by code or name
 * - Shows product code, name, and UoM
 * - Excludes already-assigned products
 * - Empty state if no products available
 * - Loading state during search
 */
export function ProductSelectorCombobox({
  value,
  onChange,
  excludeIds = [],
  disabled = false,
  placeholder = 'Select product...',
  className,
}: ProductSelectorComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)

  // Fetch products when search changes
  React.useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const queryParams = new URLSearchParams()
        if (search) {
          queryParams.append('search', search)
        }
        queryParams.append('limit', '50')
        queryParams.append('status', 'active')

        const response = await fetch(`/api/technical/products?${queryParams.toString()}`)
        if (response.ok) {
          const data = await response.json()
          const productList = data.data || data.products || []
          // Filter out excluded products
          const filtered = productList.filter(
            (p: Product) => !excludeIds.includes(p.id)
          )
          setProducts(filtered)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchProducts, DEBOUNCE_DELAY_MS)
    return () => clearTimeout(debounce)
  }, [search, excludeIds])

  // Fetch selected product details if value is set but product not loaded
  React.useEffect(() => {
    if (value && !selectedProduct) {
      const fetchSelectedProduct = async () => {
        try {
          const response = await fetch(`/api/technical/products/${value}`)
          if (response.ok) {
            const data = await response.json()
            setSelectedProduct(data)
          }
        } catch (error) {
          console.error('Error fetching selected product:', error)
        }
      }
      fetchSelectedProduct()
    }
  }, [value, selectedProduct])

  const handleSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      setSelectedProduct(product)
      onChange(productId)
    }
    setOpen(false)
  }

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
          aria-label="Select a product"
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
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
            placeholder="Search by code or name..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading products...
                </span>
              </div>
            )}
            {!loading && products.length === 0 && (
              <CommandEmpty>
                <div className="flex flex-col items-center py-6">
                  <Package className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {search
                      ? 'No products found matching your search.'
                      : 'No products available.'}
                  </p>
                </div>
              </CommandEmpty>
            )}
            {!loading && products.length > 0 && (
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={handleSelect}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {product.code}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {product.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {product.uom}
                        </span>
                        {value === product.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
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

export default ProductSelectorCombobox
