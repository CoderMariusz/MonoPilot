/**
 * Allocation Panel Component (Modal)
 * Story 07.7: Inventory Allocation
 *
 * Main allocation modal for Sales Orders featuring:
 * - FIFO/FEFO strategy selection
 * - LP table with selection checkboxes
 * - Partial quantity editing
 * - Allocation summary display
 * - Freshness indicator
 * - FEFO expiry warnings
 * - Keyboard focus trap
 * - Responsive layout (mobile/tablet/desktop)
 * - Loading, empty, error states
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  Package,
  Clock,
  Zap,
  Loader2,
  PackageX,
  Pause,
  FileWarning,
} from 'lucide-react'
import {
  useAllocationData,
  useAllocateSalesOrder,
  useAllocationFreshness,
  useAllocationModal,
  type AllocationStrategy,
  type AllocationLine,
  type AvailableLicensePlate,
} from '@/lib/hooks/use-inventory-allocation'
import { AllocationStatusBadge } from './AllocationStatusBadge'

// =============================================================================
// Types
// =============================================================================

export interface AllocationPanelProps {
  soId: string
  onClose: () => void
  onSuccess: () => void
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Freshness Indicator
 */
interface FreshnessIndicatorProps {
  lastUpdated: string | null
  isLoading: boolean
  onRefresh: () => void
}

function FreshnessIndicator({
  lastUpdated,
  isLoading,
  onRefresh,
}: FreshnessIndicatorProps) {
  const { secondsAgo, isStale, formattedTime } =
    useAllocationFreshness(lastUpdated)

  return (
    <div
      className="flex items-center gap-2 text-sm"
      data-testid="freshness-indicator"
      aria-label={`Last updated ${formattedTime}`}
    >
      <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
      <span className={cn('text-gray-500', isStale && 'text-amber-600')}>
        Last updated: {formattedTime}
      </span>
      {isStale && (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">
          Data may be outdated
        </Badge>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        aria-label="Refresh allocation data"
      >
        <RefreshCw
          className={cn('h-4 w-4', isLoading && 'animate-spin')}
          aria-hidden="true"
        />
        <span className="ml-1">Refresh</span>
      </Button>
    </div>
  )
}

/**
 * Strategy Selector
 */
interface StrategySelectorProps {
  strategy: AllocationStrategy
  onStrategyChange: (strategy: AllocationStrategy) => void
  fefoThresholdDays: number
  disabled?: boolean
}

function StrategySelector({
  strategy,
  onStrategyChange,
  fefoThresholdDays,
  disabled,
}: StrategySelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Allocation Strategy</Label>
      <RadioGroup
        value={strategy}
        onValueChange={(value) => onStrategyChange(value as AllocationStrategy)}
        className="flex gap-6"
        aria-label="Allocation Strategy: FIFO or FEFO"
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="FIFO" id="fifo" />
          <Label htmlFor="fifo" className="font-normal cursor-pointer">
            FIFO
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="FEFO" id="fefo" />
          <Label htmlFor="fefo" className="font-normal cursor-pointer">
            FEFO
          </Label>
        </div>
      </RadioGroup>
      <p className="text-xs text-gray-500">
        {strategy === 'FIFO'
          ? 'First In, First Out - allocates oldest inventory first by receipt date'
          : `First Expiry, First Out - allocates items expiring soonest first (${fefoThresholdDays} day warning threshold)`}
      </p>
    </div>
  )
}

/**
 * LP Table Row
 */
interface LPTableRowProps {
  lp: AvailableLicensePlate
  lineId: string
  isChecked: boolean
  quantity: number
  fefoThresholdDays: number
  onCheckChange: (checked: boolean) => void
  onQuantityChange: (qty: number) => void
}

function LPTableRow({
  lp,
  lineId,
  isChecked,
  quantity,
  fefoThresholdDays,
  onCheckChange,
  onQuantityChange,
}: LPTableRowProps) {
  const isFefoWarning =
    lp.expiry_days_remaining !== null &&
    lp.expiry_days_remaining <= fefoThresholdDays &&
    lp.expiry_days_remaining > 0

  const isExpired =
    lp.expiry_days_remaining !== null && lp.expiry_days_remaining <= 0

  const [localQty, setLocalQty] = useState(quantity.toString())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLocalQty(quantity.toString())
  }, [quantity])

  const handleQtyChange = (value: string) => {
    setLocalQty(value)
    const numValue = parseInt(value, 10)

    if (isNaN(numValue) || numValue < 0) {
      setError('Must be greater than 0')
      return
    }

    if (numValue > lp.available_quantity) {
      setError('Exceeds available')
      return
    }

    setError(null)
    onQuantityChange(numValue)
  }

  return (
    <TableRow
      data-testid={`lp-row-${lp.license_plate_id}`}
      className={cn(
        isFefoWarning && 'bg-yellow-50',
        isExpired && 'bg-red-50 opacity-60'
      )}
    >
      <TableCell>
        <Checkbox
          checked={isChecked}
          onCheckedChange={(checked) => onCheckChange(checked === true)}
          disabled={isExpired}
          aria-label={`Select ${lp.lp_number} for allocation`}
        />
      </TableCell>
      <TableCell className="font-mono text-sm">{lp.lp_number}</TableCell>
      <TableCell>{lp.location_code}</TableCell>
      <TableCell className="text-right tabular-nums">
        {lp.available_quantity}
      </TableCell>
      <TableCell>
        {lp.best_before_date ? (
          <div className="flex items-center gap-1">
            <span>{new Date(lp.best_before_date).toLocaleDateString()}</span>
            {isFefoWarning && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Expires in {lp.expiry_days_remaining} days
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="w-20">
          <Input
            type="number"
            min={0}
            max={lp.available_quantity}
            value={localQty}
            onChange={(e) => handleQtyChange(e.target.value)}
            disabled={!isChecked || isExpired}
            className={cn('text-right', error && 'border-red-500')}
            data-testid={`lp-qty-${lp.license_plate_id}`}
            aria-label={`Quantity to allocate from ${lp.lp_number}`}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      </TableCell>
    </TableRow>
  )
}

/**
 * Allocation Line Section
 */
interface AllocationLineSectionProps {
  line: AllocationLine
  selectedAllocations: Map<
    string,
    { lpId: string; quantity: number; checked: boolean }
  >
  fefoThresholdDays: number
  onToggleLp: (lpId: string) => void
  onSetQuantity: (lpId: string, qty: number) => void
}

function AllocationLineSection({
  line,
  selectedAllocations,
  fefoThresholdDays,
  onToggleLp,
  onSetQuantity,
}: AllocationLineSectionProps) {
  // Calculate current allocation for this line
  let lineAllocated = line.quantity_currently_allocated
  selectedAllocations.forEach((sel) => {
    if (sel.checked && sel.quantity > 0) {
      lineAllocated += sel.quantity
    }
  })

  const progressPct = Math.min(
    100,
    (lineAllocated / line.quantity_ordered) * 100
  )

  const getStatus = () => {
    if (lineAllocated >= line.quantity_ordered) return 'full'
    if (lineAllocated > 0) return 'partial'
    return 'none'
  }

  return (
    <AccordionItem value={line.line_id}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">#{line.line_number}</span>
            <span className="font-medium">{line.product_name}</span>
            <span className="text-gray-500 text-sm">{line.product_size}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-32">
              <Progress value={progressPct} className="h-2" />
            </div>
            <span className="text-sm tabular-nums">
              {lineAllocated} / {line.quantity_ordered}
            </span>
            <AllocationStatusBadge
              status={getStatus()}
              percentage={progressPct}
              size="sm"
              compact
            />
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {line.available_license_plates.length === 0 ? (
          <div className="py-8 text-center">
            <PackageX className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No available inventory for this product</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" role="columnheader">
                  Select
                </TableHead>
                <TableHead role="columnheader">LP #</TableHead>
                <TableHead role="columnheader">Location</TableHead>
                <TableHead className="text-right" role="columnheader">
                  Qty Available
                </TableHead>
                <TableHead role="columnheader">Expiry Date</TableHead>
                <TableHead className="w-24" role="columnheader">
                  Selected Qty
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {line.available_license_plates.map((lp) => {
                const sel = selectedAllocations.get(lp.license_plate_id)
                return (
                  <LPTableRow
                    key={lp.license_plate_id}
                    lp={lp}
                    lineId={line.line_id}
                    isChecked={sel?.checked ?? false}
                    quantity={sel?.quantity ?? 0}
                    fefoThresholdDays={fefoThresholdDays}
                    onCheckChange={() => onToggleLp(lp.license_plate_id)}
                    onQuantityChange={(qty) =>
                      onSetQuantity(lp.license_plate_id, qty)
                    }
                  />
                )
              })}
            </TableBody>
          </Table>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

/**
 * Allocation Summary
 */
interface AllocationSummaryDisplayProps {
  summary: {
    total_lines: number
    fully_allocated_lines: number
    partially_allocated_lines: number
    not_allocated_lines: number
    total_qty_required: number
    total_qty_allocated: number
    total_lps_selected: number
    coverage_percentage: number
    total_shortfall: number
  }
}

function AllocationSummaryDisplay({ summary }: AllocationSummaryDisplayProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="text-xs text-gray-500">Total Lines</p>
        <p className="text-lg font-medium">{summary.total_lines}</p>
        <div className="flex gap-2 mt-1 text-xs">
          <span className="text-green-600">
            {summary.fully_allocated_lines} full
          </span>
          <span className="text-amber-600">
            {summary.partially_allocated_lines} partial
          </span>
          <span className="text-gray-500">
            {summary.not_allocated_lines} none
          </span>
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-500">Total Quantity</p>
        <p className="text-lg font-medium tabular-nums">
          {summary.total_qty_allocated} / {summary.total_qty_required}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Coverage</p>
        <p className="text-lg font-medium tabular-nums">
          {summary.coverage_percentage.toFixed(1)}%
        </p>
        <Progress
          value={Math.min(100, summary.coverage_percentage)}
          className="h-1.5 mt-2"
        />
      </div>
      <div>
        <p className="text-xs text-gray-500">LPs Selected</p>
        <p className="text-lg font-medium">{summary.total_lps_selected}</p>
        {summary.total_shortfall > 0 && (
          <p className="text-xs text-amber-600 mt-1">
            Shortfall: {summary.total_shortfall}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Backorder Decision Section
 */
interface BackorderDecisionProps {
  shortfallQty: number
  onHold: () => void
  onBackorder: () => void
}

function BackorderDecision({
  shortfallQty,
  onHold,
  onBackorder,
}: BackorderDecisionProps) {
  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Insufficient Inventory</AlertTitle>
      <AlertDescription className="text-amber-700">
        <p className="mb-3">
          Unable to fully allocate this order. {shortfallQty} units short.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onHold}
            className="border-amber-300 hover:bg-amber-100"
          >
            <Pause className="h-4 w-4 mr-1" />
            Hold Order
          </Button>
          <Button
            size="sm"
            onClick={onBackorder}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <FileWarning className="h-4 w-4 mr-1" />
            Create Backorder
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Loading Skeleton
 */
function AllocationSkeleton() {
  return (
    <div className="space-y-4" data-testid="allocation-skeleton">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex gap-6">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-2 w-full" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    </div>
  )
}

/**
 * Empty State
 */
interface EmptyStateProps {
  onHoldOrder: () => void
  onCheckSchedule: () => void
}

function EmptyState({ onHoldOrder, onCheckSchedule }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <PackageX className="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900">
        No Available Inventory
      </h3>
      <p className="text-gray-500 mt-2 mb-6">
        This product is currently out of stock
      </p>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onHoldOrder}>
          <Pause className="h-4 w-4 mr-1" />
          Hold Order
        </Button>
        <Button variant="outline" onClick={onCheckSchedule}>
          <Clock className="h-4 w-4 mr-1" />
          Check Schedule
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function AllocationPanel({ soId, onClose, onSuccess }: AllocationPanelProps) {
  const queryClient = useRef<ReturnType<typeof useAllocationData> | null>(null)

  // Fetch allocation data
  const {
    data: allocationData,
    isLoading,
    error,
    refetch,
  } = useAllocationData(soId)

  // Mutation hook
  const allocateMutation = useAllocateSalesOrder()

  // Modal state
  const {
    strategy,
    selectedAllocations,
    calculatedSummary,
    hasSelections,
    setStrategy,
    toggleLpCheckbox,
    setLpQuantity,
    autoAllocate,
    clearSelections,
    buildAllocateRequest,
  } = useAllocationModal(allocationData ?? null)

  // Handle allocate
  const handleAllocate = async () => {
    if (!allocationData) return

    try {
      const request = buildAllocateRequest()
      await allocateMutation.mutateAsync({
        soId,
        request,
      })
      onSuccess()
    } catch (err) {
      // Error handled by mutation
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'a':
            e.preventDefault()
            autoAllocate()
            break
          case 'c':
            e.preventDefault()
            onClose()
            break
          case 'r':
            e.preventDefault()
            refetch()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [autoAllocate, onClose, refetch])

  // Check if any line has no available LPs
  const hasEmptyLines = allocationData?.lines.some(
    (line) => line.available_license_plates.length === 0
  )

  const hasShortfall = (calculatedSummary?.total_shortfall ?? 0) > 0

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent
        className="sm:max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-modal="true"
        aria-labelledby="allocation-title"
      >
        <DialogHeader>
          <DialogTitle id="allocation-title">
            Allocate Inventory
            {allocationData && (
              <span className="ml-2 text-gray-500 font-normal">
                {allocationData.order_number}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Select license plates to allocate inventory to this sales order
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {isLoading && <AllocationSkeleton />}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <span>{error.message}</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Success State */}
        {allocationData && !isLoading && !error && (
          <div className="space-y-6">
            {/* Freshness Indicator */}
            <FreshnessIndicator
              lastUpdated={allocationData.last_updated}
              isLoading={isLoading}
              onRefresh={() => refetch()}
            />

            {/* Strategy Selector */}
            <StrategySelector
              strategy={strategy}
              onStrategyChange={setStrategy}
              fefoThresholdDays={allocationData.fefo_warning_threshold_days}
              disabled={allocateMutation.isPending}
            />

            {/* Backorder Decision */}
            {hasShortfall && (
              <BackorderDecision
                shortfallQty={calculatedSummary?.total_shortfall ?? 0}
                onHold={() => {
                  // TODO: Implement hold logic
                }}
                onBackorder={() => {
                  // TODO: Implement backorder logic
                }}
              />
            )}

            {/* Lines */}
            {allocationData.lines.length === 0 ||
            allocationData.lines.every(
              (l) => l.available_license_plates.length === 0
            ) ? (
              <EmptyState
                onHoldOrder={() => {}}
                onCheckSchedule={() => {}}
              />
            ) : (
              <Accordion
                type="multiple"
                defaultValue={allocationData.lines.map((l) => l.line_id)}
                className="space-y-2"
              >
                {allocationData.lines.map((line) => (
                  <AllocationLineSection
                    key={line.line_id}
                    line={line}
                    selectedAllocations={
                      selectedAllocations.get(line.line_id) ?? new Map()
                    }
                    fefoThresholdDays={allocationData.fefo_warning_threshold_days}
                    onToggleLp={(lpId) => toggleLpCheckbox(line.line_id, lpId)}
                    onSetQuantity={(lpId, qty) =>
                      setLpQuantity(line.line_id, lpId, qty)
                    }
                  />
                ))}
              </Accordion>
            )}

            {/* Summary */}
            {calculatedSummary && (
              <AllocationSummaryDisplay summary={calculatedSummary} />
            )}
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {allocationData && (
              <Button
                variant="outline"
                onClick={autoAllocate}
                disabled={allocateMutation.isPending}
              >
                <Zap className="h-4 w-4 mr-1" />
                Auto-Allocate
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {hasSelections && (
              <Button
                variant="ghost"
                onClick={clearSelections}
                disabled={allocateMutation.isPending}
              >
                Clear
              </Button>
            )}
            <Button
              onClick={handleAllocate}
              disabled={
                !hasSelections ||
                allocateMutation.isPending ||
                isLoading
              }
            >
              {allocateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Allocating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Allocate Selected
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AllocationPanel
