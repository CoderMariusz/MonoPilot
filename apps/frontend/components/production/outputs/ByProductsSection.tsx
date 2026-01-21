'use client'

/**
 * ByProductsSection Component (Story 04.7a / 04.7c)
 *
 * Displays by-products status with:
 * - Auto-create info banner
 * - By-product list with expected/actual quantities
 * - Progress bars
 * - Register Now / Add More / View LPs actions
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Loader2, Info, Package, Eye, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
export interface ByProduct {
  product_id: string
  product_name: string
  product_code: string
  material_id: string
  yield_percent: number
  expected_qty: number
  actual_qty: number
  uom: string
  lp_count: number
  status: 'registered' | 'not_registered'
  last_registered_at: string | null
}

export interface ByProductsSectionProps {
  /** Work order ID */
  woId: string
  /** Whether auto-create by-products is enabled */
  autoCreateEnabled: boolean
  /** List of by-products */
  byProducts: ByProduct[]
  /** Callback when Register Now/Add More clicked */
  onRegister: (byProduct: ByProduct) => void
  /** Callback when Register All clicked */
  onRegisterAll: () => void
  /** Callback to view by-product LPs */
  onViewLPs?: (byProductId: string) => void
  /** Loading state */
  isLoading: boolean
}

/**
 * Format number for display
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/**
 * Calculate progress percentage
 */
function calculateProgress(actual: number, expected: number): number {
  if (expected <= 0) return 0
  return Math.min(100, Math.round((actual / expected) * 100))
}

export function ByProductsSection({
  woId,
  autoCreateEnabled,
  byProducts,
  onRegister,
  onRegisterAll,
  onViewLPs,
  isLoading,
}: ByProductsSectionProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6" role="status" aria-label="Loading by-products">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  // Empty state
  if (byProducts.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-semibold">By-Products</h3>
        </div>
        <p className="text-muted-foreground text-center py-4">
          No by-products defined for this WO
        </p>
      </div>
    )
  }

  // Count unregistered by-products
  const unregisteredCount = byProducts.filter((bp) => bp.status === 'not_registered').length

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-semibold">By-Products</h3>
        </div>
        {unregisteredCount > 0 && (
          <Button size="sm" onClick={onRegisterAll}>
            <Plus className="h-4 w-4 mr-1" />
            Register All By-Products
          </Button>
        )}
      </div>

      {/* Auto-create banner */}
      {autoCreateEnabled && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border-b text-sm text-blue-700">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium">Auto-Create: ON</span>
            <span className="ml-2">
              By-products will be automatically created when main output is registered.
            </span>
          </div>
        </div>
      )}

      {/* By-products list */}
      <div className="divide-y">
        {byProducts.map((bp) => {
          const progress = calculateProgress(bp.actual_qty, bp.expected_qty)
          const isRegistered = bp.status === 'registered'

          return (
            <div key={bp.material_id} className="p-4 space-y-3">
              {/* Product info row */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{bp.product_name}</div>
                  <div className="text-sm text-muted-foreground font-mono">{bp.product_code}</div>
                </div>
                <Badge variant={isRegistered ? 'default' : 'secondary'}>
                  {isRegistered ? 'Registered' : 'Not Registered'}
                </Badge>
              </div>

              {/* Quantities row */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Expected ({bp.yield_percent}%):</span>
                  <div className="font-mono font-medium">
                    {formatNumber(bp.expected_qty)} {bp.uom}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Actual:</span>
                  <div className="font-mono font-medium">
                    {formatNumber(bp.actual_qty)} {bp.uom}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">LPs:</span>
                  <div className="font-medium">
                    {bp.lp_count} {bp.lp_count === 1 ? 'LP' : 'LPs'}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatNumber(bp.actual_qty)}/{formatNumber(bp.expected_qty)}</span>
                  <span>{progress}%</span>
                </div>
                <Progress
                  value={progress}
                  className={cn(
                    'h-2',
                    progress >= 100 && 'bg-green-100 [&>div]:bg-green-500',
                    progress >= 50 && progress < 100 && 'bg-yellow-100 [&>div]:bg-yellow-500',
                    progress < 50 && 'bg-red-100 [&>div]:bg-red-500'
                  )}
                />
              </div>

              {/* Actions row */}
              <div className="flex items-center gap-2">
                {isRegistered ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewLPs?.(bp.material_id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View LPs
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRegister(bp)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add More
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onRegister(bp)}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    Register Now
                  </Button>
                )}
              </div>

              {/* Warning for missing by-product */}
              {!isRegistered && bp.expected_qty > 0 && (
                <div className="text-xs text-amber-600 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Missing expected by-product
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer info */}
      <div className="p-3 bg-muted/50 border-t text-xs text-muted-foreground">
        <Info className="h-3 w-3 inline mr-1" />
        By-products share the same genealogy as main output (same parent materials)
      </div>
    </div>
  )
}

export default ByProductsSection
