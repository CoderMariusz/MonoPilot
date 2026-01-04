/**
 * Available LPs Picker Component
 * Story: 05.3 - LP Reservations + FIFO/FEFO Picking
 * Wireframe: WH-RES-001
 *
 * Modal/panel to select License Plates for WO material reservation,
 * with FIFO/FEFO algorithm suggesting optimal picks.
 *
 * States:
 * - Loading: Fetching available LPs
 * - Empty: No LPs available
 * - Error: Failed to load LPs
 * - Success: LPs loaded with FIFO/FEFO suggestions
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { AlertCircle, XCircle, Package, Search, Star } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useAvailableLPs, type LPSelection, type AvailableLP } from '@/lib/hooks/use-lp-reservations'

// ============================================================================
// TYPES
// ============================================================================

interface AvailableLPsPickerProps {
  materialId: string
  productId: string
  productName: string
  requiredQty: number
  uom: string
  woId: string
  warehouseId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onReserve: (selections: LPSelection[]) => Promise<void>
}

interface LPSelectionState {
  lpId: string
  qty: number
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No Expiry'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-4 py-12" aria-label="Loading available LPs">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Loading available LPs...</p>
      <p className="text-xs text-muted-foreground">Applying FIFO sorting strategy</p>
      <div className="h-2 w-64 overflow-hidden rounded-full bg-gray-200">
        <div className="h-full w-3/5 animate-pulse bg-primary" />
      </div>
    </div>
  )
}

function EmptyState({
  onClose,
}: {
  onClose: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-12" role="status">
      <Package className="h-16 w-16 text-muted-foreground" />
      <h3 className="text-lg font-semibold">No Available License Plates</h3>
      <div className="max-w-md space-y-2 text-center text-sm text-muted-foreground">
        <p>No LPs found for this material with QA status &apos;passed&apos; and available quantity.</p>
        <div className="mt-4">
          <p className="font-medium">Possible reasons:</p>
          <ul className="mt-2 space-y-1 text-left">
            <li>• All LPs are fully reserved</li>
            <li>• LPs are expired or blocked</li>
            <li>• No inventory received for this product</li>
          </ul>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
  onClose,
}: {
  message: string
  onRetry: () => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-12" role="alert">
      <XCircle className="h-16 w-16 text-destructive" />
      <h3 className="text-lg font-semibold text-destructive">Failed to Load License Plates</h3>
      <p className="max-w-md text-center text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground">
        Please try again. If the problem persists, contact support with error code: WH-RES-001-LOAD-ERR
      </p>
      <div className="mt-4 flex gap-3">
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

function SuggestionBadge({ reason }: { reason?: string }) {
  if (!reason) return null

  return (
    <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800">
      <Star className="h-3 w-3 fill-yellow-800" />
      {reason}
    </Badge>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AvailableLPsPicker({
  materialId,
  productId,
  productName,
  requiredQty,
  uom,
  woId,
  warehouseId,
  open,
  onOpenChange,
  onReserve,
}: AvailableLPsPickerProps) {
  const [strategy, setStrategy] = useState<'fifo' | 'fefo' | 'none'>('fifo')
  const [autoSelect, setAutoSelect] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [selections, setSelections] = useState<Map<string, LPSelectionState>>(new Map())
  const [isReserving, setIsReserving] = useState(false)

  // Fetch available LPs
  const { data: availableLPs = [], isLoading, error, refetch } = useAvailableLPs({
    productId,
    warehouseId,
    strategy,
  })

  // Calculate totals
  const totalSelected = useMemo(() => {
    return Array.from(selections.values()).reduce((sum, sel) => sum + sel.qty, 0)
  }, [selections])

  const remaining = requiredQty - totalSelected

  // Filter LPs by search
  const filteredLPs = useMemo(() => {
    if (!searchFilter) return availableLPs

    const search = searchFilter.toLowerCase()
    return availableLPs.filter(
      (lp) =>
        lp.lp_number.toLowerCase().includes(search) ||
        lp.batch_number?.toLowerCase().includes(search) ||
        lp.location_path.toLowerCase().includes(search)
    )
  }, [availableLPs, searchFilter])

  // Auto-select logic
  useEffect(() => {
    if (autoSelect && filteredLPs.length > 0) {
      const newSelections = new Map<string, LPSelectionState>()
      let accumulated = 0

      for (const lp of filteredLPs) {
        if (accumulated >= requiredQty) break

        const needed = requiredQty - accumulated
        const qtyToTake = Math.min(lp.available_qty, needed)

        newSelections.set(lp.id, {
          lpId: lp.id,
          qty: qtyToTake,
        })

        accumulated += qtyToTake
      }

      setSelections(newSelections)
    }
  }, [autoSelect, filteredLPs, requiredQty])

  // Handle checkbox toggle
  const handleToggle = (lp: AvailableLP, checked: boolean) => {
    const newSelections = new Map(selections)

    if (checked) {
      // Auto-fill with full available qty by default
      const needed = Math.max(0, requiredQty - totalSelected)
      const qtyToTake = Math.min(lp.available_qty, needed || lp.available_qty)

      newSelections.set(lp.id, {
        lpId: lp.id,
        qty: qtyToTake,
      })
    } else {
      newSelections.delete(lp.id)
    }

    setSelections(newSelections)
  }

  // Handle quantity change
  const handleQtyChange = (lpId: string, qty: number, maxQty: number) => {
    const newSelections = new Map(selections)
    const selection = newSelections.get(lpId)

    if (selection) {
      const clampedQty = Math.max(0, Math.min(qty, maxQty))
      if (clampedQty > 0) {
        newSelections.set(lpId, { ...selection, qty: clampedQty })
      } else {
        newSelections.delete(lpId)
      }
      setSelections(newSelections)
    }
  }

  // Handle reserve
  const handleReserve = async () => {
    setIsReserving(true)
    try {
      const lpSelections: LPSelection[] = Array.from(selections.entries()).map(([lpId, sel]) => {
        const lp = availableLPs.find((l) => l.id === lpId)!
        return {
          lpId,
          lpNumber: lp.lp_number,
          reservedQty: sel.qty,
          batch: lp.batch_number,
          expiryDate: lp.expiry_date,
          location: lp.location_path,
        }
      })

      await onReserve(lpSelections)
      onOpenChange(false)
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsReserving(false)
    }
  }

  // Check for FIFO violations
  const fifoViolation = useMemo(() => {
    if (strategy !== 'fifo' || selections.size === 0) return null

    const selected = Array.from(selections.keys())
    const selectedIndices = selected
      .map((id) => filteredLPs.findIndex((lp) => lp.id === id))
      .filter((idx) => idx !== -1)
      .sort((a, b) => a - b)

    // Check for gaps in selection (skipped LPs that are older)
    for (let i = 0; i < selectedIndices.length - 1; i++) {
      if (selectedIndices[i + 1] - selectedIndices[i] > 1) {
        const skippedLP = filteredLPs[selectedIndices[i] + 1]
        return `LP-${skippedLP.lp_number} is older but not selected. This violates FIFO. Continue anyway?`
      }
    }

    return null
  }, [strategy, selections, filteredLPs])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-4xl overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Select License Plates for Material</DialogTitle>
        </DialogHeader>

        {/* Material Header */}
        <div className="space-y-2 rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
          <h3 className="font-medium">{productName}</h3>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Required:</span>{' '}
              <span className="font-semibold">
                {requiredQty} {uom}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Selected:</span>{' '}
              <span className="font-semibold">
                {totalSelected} {uom}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Remaining:</span>{' '}
              <span className={cn('font-semibold', remaining > 0 && 'text-orange-600')}>
                {remaining} {uom}
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error.message || 'Unable to fetch available LPs'}
            onRetry={() => refetch()}
            onClose={() => onOpenChange(false)}
          />
        ) : filteredLPs.length === 0 ? (
          <EmptyState onClose={() => onOpenChange(false)} />
        ) : (
          <>
            {/* Controls */}
            <div className="space-y-4">
              {/* Strategy & Auto-select */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="strategy">Picking Strategy:</Label>
                  <Select value={strategy} onValueChange={(v: any) => setStrategy(v)}>
                    <SelectTrigger id="strategy" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fifo">FIFO</SelectItem>
                      <SelectItem value="fefo">FEFO</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="auto-select"
                    checked={autoSelect}
                    onCheckedChange={(checked) => setAutoSelect(!!checked)}
                  />
                  <Label htmlFor="auto-select" className="cursor-pointer">
                    Auto-select suggested LPs ({strategy.toUpperCase()})
                  </Label>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by LP number, batch, or location..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* LP Table */}
            <div className="rounded-lg border">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 border-b bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="w-12 p-3"></th>
                      <th className="p-3 text-left">LP #</th>
                      <th className="p-3 text-left">Batch</th>
                      <th className="p-3 text-right">Available</th>
                      <th className="p-3 text-left">Location</th>
                      <th className="p-3 text-left">Expiry</th>
                      <th className="p-3 text-left">Suggestion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLPs.map((lp) => {
                      const isSelected = selections.has(lp.id)
                      const selection = selections.get(lp.id)

                      return (
                        <tr
                          key={lp.id}
                          className={cn(
                            'border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900',
                            isSelected && 'bg-blue-50/50 dark:bg-blue-900/10'
                          )}
                        >
                          <td className="p-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleToggle(lp, !!checked)}
                              aria-label={`Select ${lp.lp_number}`}
                            />
                          </td>
                          <td className="p-3 font-mono">{lp.lp_number}</td>
                          <td className="p-3 text-muted-foreground">{lp.batch_number || '-'}</td>
                          <td className="p-3 text-right tabular-nums">
                            {lp.available_qty} {lp.uom}
                          </td>
                          <td className="p-3 text-muted-foreground">{lp.location_path}</td>
                          <td className="p-3 text-muted-foreground">{formatDate(lp.expiry_date)}</td>
                          <td className="p-3">
                            <SuggestionBadge reason={lp.suggestion_reason} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected LPs Summary */}
            {selections.size > 0 && (
              <div className="space-y-3 rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
                <h4 className="text-sm font-medium">Selected LPs ({selections.size}):</h4>
                <div className="space-y-2">
                  {Array.from(selections.entries()).map(([lpId, sel]) => {
                    const lp = availableLPs.find((l) => l.id === lpId)
                    if (!lp) return null

                    return (
                      <div key={lpId} className="flex items-center justify-between gap-4 text-sm">
                        <div className="flex-1">
                          <span className="font-mono">{lp.lp_number}</span>
                          {lp.batch_number && (
                            <span className="ml-2 text-muted-foreground">- Batch {lp.batch_number}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={sel.qty}
                            onChange={(e) => handleQtyChange(lpId, parseFloat(e.target.value), lp.available_qty)}
                            min={0}
                            max={lp.available_qty}
                            step={0.01}
                            className="w-24 text-right"
                            aria-label={`Quantity for ${lp.lp_number}`}
                          />
                          <span className="text-muted-foreground">
                            {lp.uom} (Max: {lp.available_qty})
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newSelections = new Map(selections)
                              newSelections.delete(lpId)
                              setSelections(newSelections)
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* FIFO Violation Warning */}
            {fifoViolation && (
              <div
                className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{fifoViolation}</span>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isReserving}>
            Cancel
          </Button>
          {!isLoading && !error && filteredLPs.length > 0 && (
            <Button onClick={handleReserve} disabled={selections.size === 0 || isReserving}>
              {isReserving ? (
                'Reserving...'
              ) : (
                <>
                  Reserve Selected ({totalSelected} {uom})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
