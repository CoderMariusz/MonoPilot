/**
 * TopOldestStockWidget Component
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * Widget showing top 10 oldest stock items (FIFO) or soonest expiry items (FEFO).
 * Click item navigates to LP detail page.
 */

'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Clock,
  Calendar,
  Package,
  MapPin,
  Warehouse,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OldestStockItem } from '@/lib/services/aging-report-service'

interface TopOldestStockWidgetProps {
  items: OldestStockItem[]
  mode: 'fifo' | 'fefo'
  isLoading?: boolean
  className?: string
}

/**
 * Get urgency level and color based on age/expiry
 */
function getUrgencyLevel(
  mode: 'fifo' | 'fefo',
  ageDays: number | null,
  expiryDays: number | null
): {
  level: 'critical' | 'warning' | 'normal'
  color: string
  bgColor: string
} {
  if (mode === 'fifo') {
    const days = ageDays ?? 0
    if (days > 90) {
      return { level: 'critical', color: 'text-red-600', bgColor: 'bg-red-50' }
    }
    if (days > 30) {
      return { level: 'warning', color: 'text-orange-600', bgColor: 'bg-orange-50' }
    }
    return { level: 'normal', color: 'text-muted-foreground', bgColor: '' }
  } else {
    const days = expiryDays ?? Infinity
    if (days < 0) {
      return { level: 'critical', color: 'text-red-600', bgColor: 'bg-red-50' }
    }
    if (days <= 7) {
      return { level: 'critical', color: 'text-orange-600', bgColor: 'bg-orange-50' }
    }
    if (days <= 30) {
      return { level: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    }
    return { level: 'normal', color: 'text-muted-foreground', bgColor: '' }
  }
}

/**
 * Single stock item row
 */
function StockItemRow({
  item,
  mode,
  onClick,
}: {
  item: OldestStockItem
  mode: 'fifo' | 'fefo'
  onClick: () => void
}) {
  const urgency = getUrgencyLevel(mode, item.age_days, item.expiry_days)

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg transition-colors',
        'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring',
        urgency.bgColor
      )}
      aria-label={`View details for ${item.lp_number}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* LP Number and Product */}
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <span className="font-medium text-sm truncate">{item.lp_number}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {item.product_name}
          </p>

          {/* Location and Warehouse */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {item.location_code}
            </span>
            <span className="flex items-center gap-1">
              <Warehouse className="h-3 w-3" aria-hidden="true" />
              {item.warehouse_name}
            </span>
          </div>

          {/* Quantity */}
          <p className="text-xs mt-1">
            <span className="font-medium">
              {item.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>{' '}
            <span className="text-muted-foreground">{item.uom}</span>
          </p>
        </div>

        {/* Age/Expiry indicator */}
        <div className={cn('flex flex-col items-end shrink-0', urgency.color)}>
          {mode === 'fifo' ? (
            <>
              <Clock className="h-4 w-4 mb-1" aria-hidden="true" />
              <span className="text-sm font-semibold">
                {item.age_days ?? 0}d
              </span>
              <span className="text-xs">old</span>
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mb-1" aria-hidden="true" />
              {(item.expiry_days ?? 0) < 0 ? (
                <>
                  <span className="text-sm font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                    Expired
                  </span>
                  <span className="text-xs">{Math.abs(item.expiry_days ?? 0)}d ago</span>
                </>
              ) : (
                <>
                  <span className="text-sm font-semibold">
                    {item.expiry_days ?? 0}d
                  </span>
                  <span className="text-xs">left</span>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </button>
  )
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-3 rounded-lg border">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-48 mb-2" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Empty state
 */
function EmptyState({ mode }: { mode: 'fifo' | 'fefo' }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {mode === 'fifo' ? (
        <Clock className="h-8 w-8 text-muted-foreground mb-2" aria-hidden="true" />
      ) : (
        <Calendar className="h-8 w-8 text-muted-foreground mb-2" aria-hidden="true" />
      )}
      <p className="text-sm text-muted-foreground">
        {mode === 'fifo'
          ? 'No stock items to display'
          : 'No items with expiry dates to display'
        }
      </p>
    </div>
  )
}

export function TopOldestStockWidget({
  items,
  mode,
  isLoading = false,
  className,
}: TopOldestStockWidgetProps) {
  const router = useRouter()

  const handleItemClick = (lpNumber: string) => {
    // Navigate to LP detail page
    router.push(`/warehouse/license-plates?lp=${encodeURIComponent(lpNumber)}`)
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          {mode === 'fifo' ? (
            <>
              <Clock className="h-4 w-4" aria-hidden="true" />
              Top 10 Oldest Stock
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Soonest Expiring
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <LoadingSkeleton />
        ) : items.length === 0 ? (
          <EmptyState mode={mode} />
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2" role="list" aria-label={mode === 'fifo' ? 'Oldest stock items' : 'Soonest expiring items'}>
              {items.map((item, index) => (
                <div key={`${item.lp_number}-${index}`} role="listitem">
                  <StockItemRow
                    item={item}
                    mode={mode}
                    onClick={() => handleItemClick(item.lp_number)}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* View all button */}
        {!isLoading && items.length > 0 && (
          <Button
            variant="ghost"
            className="w-full mt-3"
            onClick={() => router.push('/warehouse/license-plates')}
          >
            View All License Plates
            <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
