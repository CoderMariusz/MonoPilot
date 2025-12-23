/**
 * AllergensDataTable Component
 * Story: 01.12 - Allergens Management
 *
 * Features:
 * - Displays 14 EU allergens (read-only)
 * - Search across all language fields (debounced 100ms)
 * - Multi-language columns and tooltips
 * - Icon display with fallback
 * - No pagination (only 14 items)
 * - No Add/Edit/Delete actions
 * - Loading, error, empty states
 */

'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AllergenIcon } from './AllergenIcon'
import type { Allergen } from '@/lib/types/allergen'
import { getAllergenName } from '@/lib/types/allergen'

interface AllergensDataTableProps {
  allergens: Allergen[]
  isLoading?: boolean
  error?: string
  onRetry?: () => void
  userLanguage?: 'en' | 'pl' | 'de' | 'fr'
}

export function AllergensDataTable({
  allergens,
  isLoading = false,
  error,
  onRetry,
  userLanguage = 'en',
}: AllergensDataTableProps) {
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search (100ms)
  useEffect(() => {
    // Clear previous timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }

    // Set new timer
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchValue)
    }, 100)

    // Cleanup
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [searchValue])

  // Filter allergens by search across all language fields
  const filteredAllergens = useMemo(() => {
    if (!debouncedSearch) {
      return allergens
    }

    const searchLower = debouncedSearch.toLowerCase()

    return allergens.filter((allergen) => {
      return (
        allergen.code.toLowerCase().includes(searchLower) ||
        allergen.name_en.toLowerCase().includes(searchLower) ||
        allergen.name_pl.toLowerCase().includes(searchLower) ||
        allergen.name_de?.toLowerCase().includes(searchLower) ||
        allergen.name_fr?.toLowerCase().includes(searchLower)
      )
    })
  }, [allergens, debouncedSearch])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="border rounded-md">
          <div data-testid="skeleton-loader">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-[150px]" />
                <Skeleton className="h-6 w-[120px]" />
                <Skeleton className="h-6 w-[120px]" />
                <Skeleton className="h-6 w-[80px]" />
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
          <p className="text-lg font-semibold text-destructive">Failed to load allergens</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  // Empty state (should never happen - 14 allergens always seeded)
  if (!allergens || allergens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center">
          <p className="text-lg font-semibold">No allergens found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Contact support if allergens are not loading.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        placeholder="Search allergens by code or name..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="max-w-md"
        aria-label="Search allergens"
      />

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Name ({userLanguage.toUpperCase()})</TableHead>
              <TableHead>Name EN</TableHead>
              <TableHead>Name PL</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAllergens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No allergens match your search. Try different keywords.
                </TableCell>
              </TableRow>
            ) : (
              filteredAllergens.map((allergen) => {
                const localizedName = getAllergenName(allergen, userLanguage)

                return (
                  <TooltipProvider key={allergen.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableRow className="cursor-help">
                          <TableCell className="font-mono font-semibold">{allergen.code}</TableCell>
                          <TableCell>
                            <AllergenIcon
                              icon_url={allergen.icon_url}
                              name={localizedName}
                              size={24}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{localizedName}</TableCell>
                          <TableCell>{allergen.name_en}</TableCell>
                          <TableCell>{allergen.name_pl}</TableCell>
                          <TableCell>
                            <Badge
                              variant={allergen.is_active ? 'default' : 'secondary'}
                              className={
                                allergen.is_active
                                  ? 'bg-green-100 text-green-800 border-none'
                                  : 'bg-gray-100 text-gray-800 border-none'
                              }
                            >
                              {allergen.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold">{allergen.code}</p>
                          <p className="text-sm">
                            <span className="font-medium">EN:</span> {allergen.name_en}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">PL:</span> {allergen.name_pl}
                          </p>
                          {allergen.name_de && (
                            <p className="text-sm">
                              <span className="font-medium">DE:</span> {allergen.name_de}
                            </p>
                          )}
                          {allergen.name_fr && (
                            <p className="text-sm">
                              <span className="font-medium">FR:</span> {allergen.name_fr}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer info */}
      {filteredAllergens.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredAllergens.length} of {allergens.length} allergens
        </p>
      )}
    </div>
  )
}
