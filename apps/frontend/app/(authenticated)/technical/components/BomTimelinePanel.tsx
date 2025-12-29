'use client'

/**
 * BomTimelinePanel Component (Story 02.12)
 * AC-12.13 to AC-12.16: Horizontal BOM version timeline with dots
 *
 * Features:
 * - Horizontal timeline (last 6 months)
 * - Dots represent BOM version changes
 * - Hover tooltip: product name, version, date, changed_by
 * - Click dot to navigate to BOM detail
 * - Product filter dropdown
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { BomTimelineResponse } from '@/lib/types/dashboard'

interface BomTimelinePanelProps {
  data?: BomTimelineResponse
  onDotClick?: (bomId: string) => void
  onProductFilterChange?: (productId: string | null) => void
  loading?: boolean
  error?: string
  onRetry?: () => void
}

// Skeleton for loading state
function BomTimelineSkeleton() {
  return (
    <Card className="h-full" data-testid="bom-timeline-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[200px]">
          <div className="absolute bottom-8 left-0 right-0 h-1 bg-gray-200" />
          <div className="flex justify-between absolute bottom-0 left-0 right-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="w-3 h-3 rounded-full mb-2" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Empty state
function BomTimelineEmpty() {
  return (
    <div className="text-center py-12">
      <Calendar className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">No BOM versions</h3>
      <p className="mt-1 text-sm text-gray-500">
        No BOM versions created in the last 6 months.
      </p>
    </div>
  )
}

// Error state
function BomTimelineError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-12">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">Failed to load BOM timeline</h3>
      <p className="mt-1 text-sm text-gray-500">{error}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  )
}

export function BomTimelinePanel({
  data,
  onDotClick,
  onProductFilterChange,
  loading,
  error,
  onRetry
}: BomTimelinePanelProps) {
  const router = useRouter()
  const [productFilter, setProductFilter] = useState<string>('all')

  // Generate month labels for x-axis
  const monthLabels = useMemo(() => {
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      months.push(d.toLocaleDateString('en-US', { month: 'short' }))
    }
    return months
  }, [])

  // Get unique products for filter
  const uniqueProducts = useMemo(() => {
    if (!data?.timeline) return []
    const seen = new Map<string, { id: string; code: string; name: string }>()
    data.timeline.forEach(item => {
      if (!seen.has(item.product_id)) {
        seen.set(item.product_id, {
          id: item.product_id,
          code: item.product_code,
          name: item.product_name
        })
      }
    })
    return Array.from(seen.values())
  }, [data?.timeline])

  // Position dots on timeline
  const positionedDots = useMemo(() => {
    if (!data?.timeline) return []

    const now = new Date()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const timeRange = now.getTime() - sixMonthsAgo.getTime()

    return data.timeline.map(item => {
      const itemDate = new Date(item.changed_at)
      const position = ((itemDate.getTime() - sixMonthsAgo.getTime()) / timeRange) * 100

      return {
        ...item,
        position: Math.max(0, Math.min(100, position))
      }
    })
  }, [data?.timeline])

  if (loading) {
    return <BomTimelineSkeleton />
  }

  if (error) {
    return (
      <Card className="h-full" data-testid="bom-timeline-panel">
        <CardContent className="p-6">
          <BomTimelineError error={error} onRetry={onRetry} />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.timeline.length === 0) {
    return (
      <Card className="h-full" data-testid="bom-timeline-panel">
        <CardContent className="p-6">
          <BomTimelineEmpty />
        </CardContent>
      </Card>
    )
  }

  const handleProductFilterChange = (value: string) => {
    setProductFilter(value)
    onProductFilterChange?.(value === 'all' ? null : value)
  }

  const handleDotClick = (bomId: string) => {
    if (onDotClick) {
      onDotClick(bomId)
    } else {
      router.push(`/technical/boms/${bomId}`)
    }
  }

  // Filter dots by selected product
  const filteredDots = productFilter === 'all'
    ? positionedDots
    : positionedDots.filter(d => d.product_id === productFilter)

  return (
    <Card className="h-full" data-testid="bom-timeline-panel">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg">BOM Version Timeline</CardTitle>
          <Select value={productFilter} onValueChange={handleProductFilterChange}>
            <SelectTrigger className="w-[160px]" data-testid="bom-product-filter">
              <SelectValue placeholder="All Products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {uniqueProducts.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeline visualization */}
        <div
          className="relative h-[200px] pt-8"
          data-testid="bom-timeline"
          role="list"
          aria-label="BOM version timeline, last 6 months"
        >
          {/* Timeline line */}
          <div className="absolute bottom-10 left-0 right-0 h-1 bg-gray-200 rounded" />

          {/* Dots */}
          <TooltipProvider>
            {filteredDots.map((item, index) => (
              <Tooltip key={item.bom_id}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      'absolute bottom-8 transform -translate-x-1/2 z-10',
                      'w-3 h-3 rounded-full bg-blue-500 hover:bg-blue-600',
                      'hover:w-4 hover:h-4 transition-all cursor-pointer',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    )}
                    style={{ left: `${item.position}%` }}
                    onClick={() => handleDotClick(item.bom_id)}
                    data-testid="timeline-dot"
                    role="listitem"
                    aria-label={`${item.product_name} version ${item.version}, ${new Date(item.changed_at).toLocaleDateString()}`}
                  />
                </TooltipTrigger>
                <TooltipContent role="tooltip">
                  <div className="text-sm">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-xs text-gray-500">
                      v{item.version} | {new Date(item.changed_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      by {item.changed_by_name}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>

          {/* Month labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between">
            {monthLabels.map((month, index) => (
              <span
                key={index}
                className="text-xs text-gray-500"
                style={{ width: '16.66%', textAlign: index === 0 ? 'left' : index === 5 ? 'right' : 'center' }}
              >
                {month}
              </span>
            ))}
          </div>
        </div>

        {/* Limit reached indicator */}
        {data.limit_reached && (
          <p className="mt-2 text-xs text-gray-500 text-center">
            Showing first 50 entries. Filter by product to see more.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default BomTimelinePanel
