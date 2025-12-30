/**
 * BOMVersionSelector Component (Story 02.14)
 * Dropdown to select BOM version for comparison
 * FR-2.25: Version selector dropdowns
 *
 * Features:
 * - Fetches available versions for product
 * - Shows version number, status, effective date
 * - Excludes specified BOM from options
 * - All 4 UI states (loading, error, empty, success)
 * - Keyboard accessible
 */

'use client'

import React from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useBOMVersions } from '@/lib/hooks/use-bom-comparison'
import type { BomVersionOption } from '@/lib/types/bom-advanced'

// ========================================
// Props Interface
// ========================================

export interface BOMVersionSelectorProps {
  /** Product ID to filter versions */
  productId: string
  /** Currently selected BOM ID */
  selectedBomId: string
  /** Callback when selection changes */
  onChange: (bomId: string) => void
  /** BOM ID to exclude from options (can't compare to self) */
  excludeBomId?: string | null
  /** Placeholder text */
  placeholder?: string
  /** Label for the dropdown */
  label?: string
  /** Whether the selector is disabled */
  disabled?: boolean
  /** Additional className */
  className?: string
}

// ========================================
// Status Badge Styles
// ========================================

const statusStyles: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  'Active': { variant: 'default', className: 'bg-green-500' },
  'active': { variant: 'default', className: 'bg-green-500' },
  'Draft': { variant: 'secondary', className: 'bg-gray-400' },
  'draft': { variant: 'secondary', className: 'bg-gray-400' },
  'Phased Out': { variant: 'secondary', className: 'bg-yellow-500 text-white' },
  'phased_out': { variant: 'secondary', className: 'bg-yellow-500 text-white' },
  'Inactive': { variant: 'outline', className: '' },
  'inactive': { variant: 'outline', className: '' },
}

// ========================================
// BOMVersionSelector Component
// ========================================

export function BOMVersionSelector({
  productId,
  selectedBomId,
  onChange,
  excludeBomId = null,
  placeholder = 'Select version...',
  label,
  disabled = false,
  className,
}: BOMVersionSelectorProps) {
  const {
    data: versions,
    isLoading,
    error,
    refetch,
  } = useBOMVersions(productId)

  // Filter out excluded BOM
  const availableVersions = versions?.filter(
    (v) => v.id !== excludeBomId
  ) || []

  // Format date for display
  const formatDate = (date: string | null): string => {
    if (!date) return 'No end'
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const style = statusStyles[status] || statusStyles['Draft']
    return (
      <Badge variant={style.variant} className={`text-xs ${style.className}`}>
        {status}
      </Badge>
    )
  }

  // Loading State
  if (isLoading) {
    return (
      <div className={className}>
        {label && (
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            {label}
          </label>
        )}
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className={className}>
        {label && (
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            {label}
          </label>
        )}
        <div className="flex items-center gap-2 text-destructive text-sm p-2 border border-destructive/30 rounded-md bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <span>Failed to load versions</span>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-destructive"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Empty State
  if (availableVersions.length === 0) {
    return (
      <div className={className}>
        {label && (
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            {label}
          </label>
        )}
        <div className="text-sm text-muted-foreground p-2 border border-dashed rounded-md text-center">
          No other versions available
        </div>
      </div>
    )
  }

  // Success State
  return (
    <div className={className}>
      {label && (
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          {label}
        </label>
      )}
      <Select
        value={selectedBomId}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger
          aria-label={label || 'Select BOM version'}
          className="w-full"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {availableVersions.map((version) => (
            <SelectItem
              key={version.id}
              value={version.id}
              className="py-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">v{version.version}</span>
                {getStatusBadge(version.status)}
                <span className="text-xs text-muted-foreground">
                  {formatDate(version.effective_from)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ========================================
// BOMVersionSelectorInline (for side-by-side comparison)
// ========================================

export interface BOMVersionSelectorInlineProps extends Omit<BOMVersionSelectorProps, 'label'> {
  /** Side indicator */
  side: 'left' | 'right'
}

export function BOMVersionSelectorInline({
  side,
  ...props
}: BOMVersionSelectorInlineProps) {
  const sideLabel = side === 'left' ? 'Version 1 (Base)' : 'Version 2 (Compare)'

  return (
    <BOMVersionSelector
      {...props}
      label={sideLabel}
    />
  )
}

export default BOMVersionSelector
