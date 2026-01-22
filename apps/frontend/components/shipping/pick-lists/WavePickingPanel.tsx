/**
 * Wave Picking Panel Component
 * Story 07.8: Pick List Generation
 *
 * Multi-step wizard for creating wave pick lists:
 * - Step 1: Sales Order selection (multi-select)
 * - Step 2: Strategy selection (zone, route, FIFO)
 * - Step 3: Review and create
 * - Consolidation preview
 * - Keyboard navigation
 */

'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  Search,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Route,
  Clock,
} from 'lucide-react'
import type { PickListPriority, PickStrategy } from '@/lib/hooks/use-pick-lists'

// =============================================================================
// Types
// =============================================================================

export interface SalesOrder {
  id: string
  order_number: string
  customer_name: string
  order_date: string
  line_count: number
  status: string
}

export interface ConsolidatedLine {
  location_id: string
  location_path: string
  product_id: string
  product_code: string
  product_name: string
  quantity_to_pick: number
  pick_sequence: number
  source_so_count: number
}

export interface WavePickingData {
  sales_order_ids: string[]
  priority: PickListPriority
  strategy: PickStrategy
  assigned_to?: string
}

export interface WavePickingPanelProps {
  salesOrders: SalesOrder[]
  onSubmit: (data: WavePickingData) => Promise<void>
  onCancel: () => void
  consolidatedLines?: ConsolidatedLine[]
  testId?: string
}

// =============================================================================
// Step Components
// =============================================================================

const STEPS = [
  { number: 1, title: 'Select Orders', short: 'Orders' },
  { number: 2, title: 'Strategy', short: 'Strategy' },
  { number: 3, title: 'Review', short: 'Review' },
]

const STRATEGIES: { value: PickStrategy; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'zone',
    label: 'Zone-Based Picking',
    description: 'Group picks by warehouse zone for minimal travel time',
    icon: <MapPin className="h-5 w-5" />,
  },
  {
    value: 'route',
    label: 'Route-Based Picking',
    description: 'Optimize walking path through the warehouse',
    icon: <Route className="h-5 w-5" />,
  },
  {
    value: 'fifo',
    label: 'FIFO Picking',
    description: 'Pick oldest stock first to minimize waste',
    icon: <Clock className="h-5 w-5" />,
  },
]

// =============================================================================
// Component
// =============================================================================

export function WavePickingPanel({
  salesOrders,
  onSubmit,
  onCancel,
  consolidatedLines = [],
  testId = 'wave-picking-panel',
}: WavePickingPanelProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedSOs, setSelectedSOs] = useState<Set<string>>(new Set())
  const [strategy, setStrategy] = useState<PickStrategy>('zone')
  const [priority, setPriority] = useState<PickListPriority>('normal')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const stepContentRef = useRef<HTMLDivElement>(null)

  // Focus management when step changes
  useEffect(() => {
    if (stepContentRef.current) {
      stepContentRef.current.focus()
    }
  }, [currentStep])

  // Filter SOs by search term
  const filteredSOs = useMemo(() => {
    if (!searchTerm) return salesOrders
    const term = searchTerm.toLowerCase()
    return salesOrders.filter(
      (so) =>
        so.order_number.toLowerCase().includes(term) ||
        so.customer_name.toLowerCase().includes(term)
    )
  }, [salesOrders, searchTerm])

  // Calculate totals
  const totalLineCount = useMemo(() => {
    return Array.from(selectedSOs).reduce((sum, soId) => {
      const so = salesOrders.find((s) => s.id === soId)
      return sum + (so?.line_count || 0)
    }, 0)
  }, [selectedSOs, salesOrders])

  const showLargeWaveWarning = selectedSOs.size > 10

  // Selection handlers
  const handleSelectSO = useCallback((soId: string, checked: boolean) => {
    setSelectedSOs((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(soId)
      } else {
        next.delete(soId)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedSOs(new Set(filteredSOs.map((so) => so.id)))
      } else {
        setSelectedSOs(new Set())
      }
    },
    [filteredSOs]
  )

  const isAllSelected = filteredSOs.length > 0 && filteredSOs.every((so) => selectedSOs.has(so.id))

  // Navigation
  const canProceedStep1 = selectedSOs.size >= 2
  const canProceedStep2 = strategy !== null

  const handleNext = () => {
    if (currentStep === 1 && canProceedStep1) {
      setCurrentStep(2)
    } else if (currentStep === 2 && canProceedStep2) {
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Cancel handler
  const handleCancel = () => {
    if (selectedSOs.size > 0) {
      setShowCancelDialog(true)
    } else {
      onCancel()
    }
  }

  // Submit handler
  const handleSubmit = async () => {
    if (selectedSOs.size < 2) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        sales_order_ids: Array.from(selectedSOs),
        strategy,
        priority,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wave pick list')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get strategy label
  const selectedStrategyInfo = STRATEGIES.find((s) => s.value === strategy)

  return (
    <div className="flex flex-col h-full" data-testid={testId}>
      {/* Header with Step Indicator */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold mb-4">Wave Picking Wizard</h2>

        <nav aria-label="Progress steps" className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <button
                type="button"
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors',
                  currentStep === step.number
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : step.number < currentStep
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                )}
                onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                disabled={step.number > currentStep}
                aria-current={currentStep === step.number ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                    currentStep === step.number
                      ? 'bg-blue-600 text-white'
                      : step.number < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  )}
                >
                  {step.number < currentStep ? <Check className="h-3 w-3" /> : step.number}
                </span>
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">{step.short}</span>
              </button>

              {index < STEPS.length - 1 && (
                <div className={cn(
                  'w-12 h-0.5 mx-2',
                  step.number < currentStep ? 'bg-green-400' : 'bg-gray-200'
                )} />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Step Content */}
      <div
        ref={stepContentRef}
        className="flex-1 overflow-y-auto p-6"
        tabIndex={-1}
        role="region"
        aria-live="polite"
        aria-label={`Step ${currentStep}: ${STEPS[currentStep - 1]?.title}`}
      >
        {/* Step 1: Select Orders */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select Sales Orders</h3>
            <p className="text-sm text-gray-600">
              Select at least 2 orders to create a wave pick list.
            </p>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by order number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* SO Table */}
            <div className="border rounded-lg max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Lines</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSOs.map((so) => (
                    <TableRow
                      key={so.id}
                      className={cn(
                        'cursor-pointer',
                        selectedSOs.has(so.id) && 'bg-blue-50'
                      )}
                      onClick={() => handleSelectSO(so.id, !selectedSOs.has(so.id))}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedSOs.has(so.id)}
                          onCheckedChange={(checked) => handleSelectSO(so.id, !!checked)}
                          aria-label={so.order_number}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{so.order_number}</TableCell>
                      <TableCell>{so.customer_name}</TableCell>
                      <TableCell>{new Date(so.order_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{so.line_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Selection Summary */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {selectedSOs.size} orders selected ({totalLineCount} lines total)
              </span>
              {selectedSOs.size === 1 && (
                <span className="text-amber-600">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Select at least 2 orders for wave picking
                </span>
              )}
            </div>

            {showLargeWaveWarning && (
              <Alert variant="default" className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  Consider splitting into smaller waves for better efficiency.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step 2: Strategy Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Choose Optimization Strategy</h3>
              <p className="text-sm text-gray-600">
                Select how pick lines should be organized and sequenced.
              </p>
            </div>

            <RadioGroup value={strategy} onValueChange={(v) => setStrategy(v as PickStrategy)}>
              <div className="space-y-3">
                {STRATEGIES.map((s) => (
                  <label
                    key={s.value}
                    className={cn(
                      'flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors',
                      strategy === s.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <RadioGroupItem value={s.value} id={s.value} aria-label={s.label} />
                    <div className={cn(
                      'p-2 rounded-lg',
                      strategy === s.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    )}>
                      {s.icon}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{s.label}</span>
                      <p className="text-sm text-gray-600 mt-1">{s.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="wave-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as PickListPriority)}>
                <SelectTrigger id="wave-priority" aria-label="Priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Review Wave Pick List</h3>
              <p className="text-sm text-gray-600">
                Confirm the wave pick list details before creating.
              </p>
            </div>

            {/* Summary */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Orders</span>
                  <p className="font-medium">{selectedSOs.size} orders selected</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Strategy</span>
                  <p className="font-medium">{selectedStrategyInfo?.label || 'Zone-Based'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Priority</span>
                  <Badge variant={priority === 'urgent' ? 'destructive' : priority === 'high' ? 'default' : 'secondary'}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Total Lines</span>
                  <p className="font-medium">{totalLineCount} lines</p>
                </div>
              </div>
            </div>

            {/* Consolidated Lines Preview */}
            {consolidatedLines.length > 0 && (
              <div className="space-y-2">
                <Label>Consolidated Pick Lines</Label>
                <p className="text-sm text-gray-500">
                  {totalLineCount} SO lines consolidated into {consolidatedLines.length} pick lines
                </p>
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consolidatedLines.map((line) => (
                        <TableRow key={`${line.location_id}-${line.product_id}`}>
                          <TableCell>{line.pick_sequence}</TableCell>
                          <TableCell className="text-sm">{line.location_path}</TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium">{line.product_code}</span>
                              <p className="text-xs text-gray-500">{line.product_name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{line.quantity_to_pick}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-gray-500">from {line.source_so_count} orders</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isSubmitting}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={currentStep === 1 ? !canProceedStep1 : !canProceedStep2}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || selectedSOs.size < 2}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Wave Pick List'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have selected orders for the wave pick list. Are you sure you want to discard your selections?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={onCancel}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default WavePickingPanel
