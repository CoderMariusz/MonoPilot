/**
 * Supplier Filters Component
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * Filter bar with Status, Currency, Payment Terms, Search
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { SupplierFilters as SupplierFiltersType, SupplierStatusFilter } from '@/lib/types/supplier'

interface SupplierFiltersProps {
  filters: SupplierFiltersType
  onFilterChange: (filters: SupplierFiltersType) => void
  onClearFilters: () => void
  isMobile?: boolean
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Suppliers' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const CURRENCY_OPTIONS = [
  { value: 'PLN', label: 'PLN' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
]

const PAYMENT_TERMS_OPTIONS = [
  { value: 'all', label: 'All Payment Terms' },
  { value: 'Net 7', label: 'Net 7' },
  { value: 'Net 30', label: 'Net 30' },
  { value: 'Net 45', label: 'Net 45' },
  { value: 'Net 60', label: 'Net 60' },
  { value: '2/10 Net 30', label: '2/10 Net 30' },
  { value: 'COD', label: 'COD' },
  { value: 'Prepaid', label: 'Prepaid' },
]

export function SupplierFilters({
  filters,
  onFilterChange,
  onClearFilters,
  isMobile = false,
}: SupplierFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '')
  const [sheetOpen, setSheetOpen] = useState(false)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFilterChange({ ...filters, search: searchValue })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue])

  // Sync search value with filters
  useEffect(() => {
    setSearchValue(filters.search || '')
  }, [filters.search])

  const handleStatusChange = useCallback(
    (value: string) => {
      onFilterChange({ ...filters, status: value as SupplierStatusFilter })
    },
    [filters, onFilterChange]
  )

  const handlePaymentTermsChange = useCallback(
    (value: string) => {
      onFilterChange({ ...filters, payment_terms: value === 'all' ? null : value })
    },
    [filters, onFilterChange]
  )

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.search ||
    filters.payment_terms ||
    (filters.currency && filters.currency.length > 0)

  const FilterContent = () => (
    <div className="flex flex-col gap-4">
      {/* Status Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="filter-status-select">
          Status
        </label>
        <Select
          value={filters.status}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger data-testid="filter-status" id="filter-status-select">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Payment Terms Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="filter-payment-terms">
          Payment Terms
        </label>
        <Select
          value={filters.payment_terms || 'all'}
          onValueChange={handlePaymentTermsChange}
        >
          <SelectTrigger data-testid="filter-payment-terms" id="filter-payment-terms">
            <SelectValue placeholder="All Payment Terms" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_TERMS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Currency Filter - Multi-select simplified as single for now */}
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="filter-currency">
          Currency
        </label>
        <Select
          value={filters.currency?.[0] || 'all'}
          onValueChange={(value) =>
            onFilterChange({
              ...filters,
              currency: value === 'all' ? [] : [value],
            })
          }
        >
          <SelectTrigger data-testid="filter-currency" id="filter-currency">
            <SelectValue placeholder="All Currencies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Currencies</SelectItem>
            {CURRENCY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={() => {
            onClearFilters()
            setSheetOpen(false)
          }}
          className="w-full"
        >
          <X className="mr-2 h-4 w-4" />
          Clear All Filters
        </Button>
      )}
    </div>
  )

  // Mobile view: Bottom sheet
  if (isMobile) {
    return (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
            data-testid="input-search-suppliers"
            aria-label="Search suppliers"
          />
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" data-testid="button-filters" aria-label="Filters">
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" data-testid="sheet-filters" className="h-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  // Desktop view: Inline filters
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by code, name, contact..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10"
          data-testid="input-search-suppliers"
          aria-label="Search suppliers"
        />
      </div>

      {/* Status Filter */}
      <Select value={filters.status} onValueChange={handleStatusChange}>
        <SelectTrigger data-testid="filter-status" className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Currency Filter */}
      <Select
        value={filters.currency?.[0] || 'all'}
        onValueChange={(value) =>
          onFilterChange({
            ...filters,
            currency: value === 'all' ? [] : [value],
          })
        }
      >
        <SelectTrigger data-testid="filter-currency" className="w-[130px]">
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Currencies</SelectItem>
          {CURRENCY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Payment Terms Filter */}
      <Select
        value={filters.payment_terms || 'all'}
        onValueChange={handlePaymentTermsChange}
      >
        <SelectTrigger data-testid="filter-payment-terms" className="w-[160px]">
          <SelectValue placeholder="Payment Terms" />
        </SelectTrigger>
        <SelectContent>
          {PAYMENT_TERMS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}
