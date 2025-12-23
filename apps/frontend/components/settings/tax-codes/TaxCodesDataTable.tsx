/**
 * TaxCodesDataTable Component
 * Story: 01.13 - Tax Codes CRUD
 *
 * Features:
 * - Search with 200ms debounce
 * - Filter by country, status
 * - Pagination (20 per page)
 * - Row actions (Edit, Set Default, Delete)
 * - Permission-based UI
 * - Loading, empty, error states
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TaxCodeStatusBadge } from './TaxCodeStatusBadge'
import { TaxCodeRateBadge } from './TaxCodeRateBadge'
import { TaxCodeCountryBadge } from './TaxCodeCountryBadge'
import { DefaultBadge } from './DefaultBadge'
import { TaxCodeActions } from './TaxCodeActions'
import { CountryFilter } from './CountryFilter'
import { StatusFilter } from './StatusFilter'
import { formatDate } from '@/lib/utils/tax-code-helpers'
import type { TaxCode, TaxCodeStatus } from '@/lib/types/tax-code'

interface TaxCodesDataTableProps {
  taxCodes: TaxCode[]
  total: number
  page: number
  limit: number
  onPageChange: (page: number) => void
  onSearch: (search: string) => void
  onCountryFilter: (country: string) => void
  onStatusFilter: (status: TaxCodeStatus | 'all') => void
  onEdit: (taxCode: TaxCode) => void
  onSetDefault: (taxCode: TaxCode) => void
  onDelete: (taxCode: TaxCode) => void
  isLoading?: boolean
  error?: string
  readOnly?: boolean
}

export function TaxCodesDataTable({
  taxCodes,
  total,
  page,
  limit,
  onPageChange,
  onSearch,
  onCountryFilter,
  onStatusFilter,
  onEdit,
  onSetDefault,
  onDelete,
  isLoading = false,
  error,
  readOnly = false,
}: TaxCodesDataTableProps) {
  const [searchValue, setSearchValue] = useState('')
  const [countryFilter, setCountryFilterValue] = useState('')
  const [statusFilter, setStatusFilterValue] = useState<TaxCodeStatus | 'all'>('all')
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search (200ms)
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }

    searchTimerRef.current = setTimeout(() => {
      onSearch(searchValue)
    }, 200)

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [searchValue, onSearch])

  // Handle filter changes
  const handleCountryChange = (value: string) => {
    setCountryFilterValue(value)
    onCountryFilter(value)
  }

  const handleStatusChange = (value: TaxCodeStatus | 'all') => {
    setStatusFilterValue(value)
    onStatusFilter(value)
  }

  // Calculate pagination
  const totalPages = Math.ceil(total / limit)
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0
  const endItem = Math.min(page * limit, total)

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="border rounded-md">
          <div data-testid="skeleton-loader">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[40px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Failed to load tax codes</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  // Empty state
  if (!taxCodes || taxCodes.length === 0) {
    return (
      <div className="space-y-4">
        {/* Search and Filters still visible */}
        <div className="flex gap-4">
          <Input
            placeholder="Search by code or name..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="flex-1"
            aria-label="Search tax codes"
          />
          <CountryFilter value={countryFilter} onChange={handleCountryChange} />
          <StatusFilter value={statusFilter} onChange={handleStatusChange} />
        </div>

        <div className="flex flex-col items-center justify-center py-12 space-y-4 border rounded-md">
          <div className="text-center">
            <p className="text-lg font-semibold">No tax codes found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchValue || countryFilter || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first tax code to start managing tax rates'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by code or name..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="flex-1"
          aria-label="Search tax codes"
        />
        <CountryFilter value={countryFilter} onChange={handleCountryChange} />
        <StatusFilter value={statusFilter} onChange={handleStatusChange} />
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Jurisdiction</TableHead>
              <TableHead>Valid From</TableHead>
              <TableHead>Valid To</TableHead>
              <TableHead className="text-center">Default</TableHead>
              <TableHead>Status</TableHead>
              {!readOnly && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxCodes.map((taxCode) => (
              <TableRow key={taxCode.id}>
                <TableCell className="font-mono font-semibold">{taxCode.code}</TableCell>
                <TableCell className="font-medium">{taxCode.name}</TableCell>
                <TableCell>
                  <TaxCodeRateBadge rate={taxCode.rate} />
                </TableCell>
                <TableCell>
                  <TaxCodeCountryBadge countryCode={taxCode.country_code} />
                </TableCell>
                <TableCell className="text-sm">{formatDate(taxCode.valid_from)}</TableCell>
                <TableCell className="text-sm">{formatDate(taxCode.valid_to)}</TableCell>
                <TableCell className="text-center">
                  <DefaultBadge isDefault={taxCode.is_default} />
                </TableCell>
                <TableCell>
                  <TaxCodeStatusBadge taxCode={taxCode} />
                </TableCell>
                {!readOnly && (
                  <TableCell className="text-right">
                    <TaxCodeActions
                      taxCode={taxCode}
                      onEdit={() => onEdit(taxCode)}
                      onSetDefault={() => onSetDefault(taxCode)}
                      onDelete={() => onDelete(taxCode)}
                      canEdit={true}
                      canDelete={true}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {total} tax codes
        </p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages || 1}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
