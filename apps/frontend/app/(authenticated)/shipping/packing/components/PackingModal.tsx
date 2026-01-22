/**
 * PackingModal Component (Story 07.11)
 * Packing workbench modal with 3-column layout
 * - Left: Available LPs
 * - Center: BoxBuilder with tabs
 * - Right: Packing Summary
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { cn } from '@/lib/utils'
import {
  Package,
  Plus,
  Search,
  Box,
  AlertTriangle,
  Check,
  Loader2,
  Trash2,
  X,
} from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export interface AvailableLP {
  id: string
  lp_number: string
  product_id: string
  product_name: string
  lot_number: string
  quantity_available: number
  location_name: string
  allergens?: string[]
}

export interface ShipmentBox {
  id: string
  box_number: number
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
  sscc: string | null
  tracking_number: string | null
}

export interface BoxContent {
  id: string
  shipment_box_id: string
  product_id: string
  product_name: string
  lp_number: string
  lot_number: string
  quantity: number
}

export interface ShipmentData {
  shipment: {
    id: string
    shipment_number: string
    status: string
    sales_order_id: string
    customer_id: string
    customer: { name: string }
    total_boxes: number
    total_weight: number | null
  }
  boxes: ShipmentBox[]
  contents: BoxContent[]
  available_lps: AvailableLP[]
  pack_progress: {
    total_count: number
    packed_count: number
    remaining_count: number
    percentage: number
  }
}

export interface PackingModalProps {
  shipmentId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * LP Selector Panel - Left column
 */
interface LPSelectorPanelProps {
  availableLPs: AvailableLP[]
  selectedLP: AvailableLP | null
  onSelectLP: (lp: AvailableLP) => void
  onAddToBox: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  disabled: boolean
}

function LPSelectorPanel({
  availableLPs,
  selectedLP,
  onSelectLP,
  onAddToBox,
  searchQuery,
  onSearchChange,
  disabled,
}: LPSelectorPanelProps) {
  const filteredLPs = useMemo(() => {
    if (!searchQuery) return availableLPs
    const query = searchQuery.toLowerCase()
    return availableLPs.filter(
      (lp) =>
        lp.lp_number.toLowerCase().includes(query) ||
        lp.product_name.toLowerCase().includes(query) ||
        lp.lot_number.toLowerCase().includes(query)
    )
  }, [availableLPs, searchQuery])

  return (
    <div data-testid="lp-selector-panel" className="flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="font-medium mb-2">Available LPs</h3>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search LP, product, lot..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredLPs.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No LPs available
            </p>
          ) : (
            filteredLPs.map((lp) => (
              <button
                key={lp.id}
                type="button"
                onClick={() => onSelectLP(lp)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors',
                  selectedLP?.id === lp.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{lp.lp_number}</span>
                  <Badge variant="secondary">{lp.quantity_available}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {lp.product_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Lot: {lp.lot_number}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lp.location_name}
                </p>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-3 border-t">
        <Button
          onClick={onAddToBox}
          disabled={!selectedLP || disabled}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add to Box
        </Button>
      </div>
    </div>
  )
}

/**
 * Box Builder Panel - Center column
 */
interface BoxBuilderPanelProps {
  boxes: ShipmentBox[]
  contents: BoxContent[]
  activeBoxId: string | null
  onChangeActiveBox: (boxId: string) => void
  onAddBox: () => void
  onUpdateBox: (boxId: string, data: Partial<ShipmentBox>) => void
  isAddingBox: boolean
  errors: Record<string, string>
}

function BoxBuilderPanel({
  boxes,
  contents,
  activeBoxId,
  onChangeActiveBox,
  onAddBox,
  onUpdateBox,
  isAddingBox,
  errors,
}: BoxBuilderPanelProps) {
  const activeBox = boxes.find((b) => b.id === activeBoxId)
  const activeBoxContents = contents.filter(
    (c) => c.shipment_box_id === activeBoxId
  )

  const handleWeightChange = (value: string) => {
    if (!activeBoxId) return
    const weight = value ? parseFloat(value) : null
    onUpdateBox(activeBoxId, { weight })
  }

  const handleDimensionChange = (
    dimension: 'length' | 'width' | 'height',
    value: string
  ) => {
    if (!activeBoxId) return
    const numValue = value ? parseFloat(value) : null
    onUpdateBox(activeBoxId, { [dimension]: numValue })
  }

  return (
    <div data-testid="box-builder-panel" className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-medium">Box Builder</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddBox}
          disabled={isAddingBox}
        >
          {isAddingBox ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Add Box
            </>
          )}
        </Button>
      </div>

      {boxes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Box className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No boxes yet</p>
            <p className="text-sm">Click "Add Box" to start packing</p>
          </div>
        </div>
      ) : (
        <>
          <Tabs
            value={activeBoxId || undefined}
            onValueChange={onChangeActiveBox}
            className="flex-1 flex flex-col"
          >
            <div className="px-3 pt-2 border-b">
              <TabsList className="w-full justify-start">
                {boxes.map((box) => (
                  <TabsTrigger key={box.id} value={box.id} className="flex-1">
                    Box {box.box_number}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              {boxes.map((box) => (
                <TabsContent
                  key={box.id}
                  value={box.id}
                  className="p-4 space-y-4 m-0"
                >
                  {/* Weight Input */}
                  <div>
                    <Label htmlFor={`weight-${box.id}`}>Weight (kg)</Label>
                    <Input
                      id={`weight-${box.id}`}
                      type="number"
                      step="0.1"
                      min="0"
                      max="25"
                      value={box.weight ?? ''}
                      onChange={(e) => handleWeightChange(e.target.value)}
                      placeholder="Enter weight"
                    />
                    {errors[`weight-${box.id}`] && (
                      <p className="text-sm text-destructive mt-1">
                        {errors[`weight-${box.id}`]}
                      </p>
                    )}
                  </div>

                  {/* Dimensions */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor={`length-${box.id}`}>Length (cm)</Label>
                      <Input
                        id={`length-${box.id}`}
                        type="number"
                        min="10"
                        max="200"
                        value={box.length ?? ''}
                        onChange={(e) =>
                          handleDimensionChange('length', e.target.value)
                        }
                        placeholder="L"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`width-${box.id}`}>Width (cm)</Label>
                      <Input
                        id={`width-${box.id}`}
                        type="number"
                        min="10"
                        max="200"
                        value={box.width ?? ''}
                        onChange={(e) =>
                          handleDimensionChange('width', e.target.value)
                        }
                        placeholder="W"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`height-${box.id}`}>Height (cm)</Label>
                      <Input
                        id={`height-${box.id}`}
                        type="number"
                        min="10"
                        max="200"
                        value={box.height ?? ''}
                        onChange={(e) =>
                          handleDimensionChange('height', e.target.value)
                        }
                        placeholder="H"
                      />
                    </div>
                  </div>
                  {errors[`dimensions-${box.id}`] && (
                    <p className="text-sm text-destructive">
                      {errors[`dimensions-${box.id}`]}
                    </p>
                  )}

                  {/* Contents List */}
                  <div data-testid="box-contents">
                    <Label>Contents ({activeBoxContents.length} items)</Label>
                    {activeBoxContents.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        No items in this box yet
                      </p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {activeBoxContents.map((content) => (
                          <div
                            key={content.id}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {content.lp_number}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {content.product_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Lot: {content.lot_number} | Qty:{' '}
                                {content.quantity}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>
        </>
      )}
    </div>
  )
}

/**
 * Packing Summary Panel - Right column
 */
interface PackingSummaryPanelProps {
  shipment: ShipmentData['shipment']
  boxes: ShipmentBox[]
  packProgress: ShipmentData['pack_progress']
  onCompletePacking: () => void
  isCompleting: boolean
  canComplete: boolean
}

function PackingSummaryPanel({
  shipment,
  boxes,
  packProgress,
  onCompletePacking,
  isCompleting,
  canComplete,
}: PackingSummaryPanelProps) {
  const totalWeight = boxes.reduce((sum, box) => sum + (box.weight || 0), 0)
  const allBoxesHaveWeight = boxes.every((box) => box.weight && box.weight > 0)
  const allLPsPacked = packProgress.remaining_count === 0

  return (
    <div data-testid="packing-summary-panel" className="flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="font-medium">Packing Summary</h3>
      </div>

      <div className="flex-1 p-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Shipment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Shipment #</span>
              <span className="font-medium">{shipment.shipment_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Customer</span>
              <span className="font-medium">{shipment.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge
                variant={
                  shipment.status === 'packed'
                    ? 'default'
                    : shipment.status === 'packing'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {shipment.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pack Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">{packProgress.percentage}%</span>
              <span className="text-sm text-muted-foreground">
                {packProgress.packed_count} / {packProgress.total_count} LPs
              </span>
            </div>
            <Progress value={packProgress.percentage} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Boxes</span>
              <span className="font-medium">{boxes.length} boxes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Weight</span>
              <span className="font-medium">{totalWeight.toFixed(1)} kg</span>
            </div>
          </CardContent>
        </Card>

        {!allBoxesHaveWeight && boxes.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Missing Weight</AlertTitle>
            <AlertDescription>
              All boxes must have weight before completing packing.
            </AlertDescription>
          </Alert>
        )}

        {!allLPsPacked && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Remaining Items</AlertTitle>
            <AlertDescription>
              {packProgress.remaining_count} LP(s) still need to be packed.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="p-3 border-t space-y-2">
        <Button
          onClick={onCompletePacking}
          disabled={!canComplete || isCompleting}
          className="w-full"
        >
          {isCompleting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Completing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Complete Packing
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Allergen Warning Dialog
// =============================================================================

export interface AllergenWarningDialogProps {
  isOpen: boolean
  productName: string
  productAllergens: string[]
  customerRestrictions: string[]
  conflictingAllergens: string[]
  onConfirm: () => void
  onCancel: () => void
}

export function AllergenWarningDialog({
  isOpen,
  productName,
  productAllergens,
  customerRestrictions,
  conflictingAllergens,
  onConfirm,
  onCancel,
}: AllergenWarningDialogProps) {
  if (!isOpen) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Allergen Warning
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                The product <strong>{productName}</strong> contains allergens that
                conflict with customer restrictions.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded p-3 space-y-2">
                <p className="text-sm font-medium text-amber-800">
                  Conflicting Allergens:
                </p>
                <div className="flex flex-wrap gap-1">
                  {conflictingAllergens.map((allergen) => (
                    <Badge key={allergen} variant="destructive">
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-sm">
                Do you want to continue adding this item to the box?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function PackingModal({
  shipmentId,
  isOpen,
  onClose,
  onSuccess,
}: PackingModalProps) {
  // State
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ShipmentData | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLP, setSelectedLP] = useState<AvailableLP | null>(null)
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null)

  const [isAddingBox, setIsAddingBox] = useState(false)
  const [isAddingContent, setIsAddingContent] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})

  const [allergenWarning, setAllergenWarning] = useState<{
    isOpen: boolean
    productName: string
    productAllergens: string[]
    customerRestrictions: string[]
    conflictingAllergens: string[]
  } | null>(null)

  // Fetch shipment data
  const fetchData = useCallback(async () => {
    if (!shipmentId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/shipping/shipments/${shipmentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch shipment data')
      }
      const shipmentData = await response.json()
      setData(shipmentData)

      // Set first box as active if exists (use functional update to avoid dependency)
      if (shipmentData.boxes.length > 0) {
        setActiveBoxId((prevId) => prevId || shipmentData.boxes[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [shipmentId])

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen, fetchData])

  // Handlers
  const handleAddBox = async () => {
    if (!data) return

    setIsAddingBox(true)
    try {
      const response = await fetch(
        `/api/shipping/shipments/${shipmentId}/boxes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to add box')
      }

      const result = await response.json()
      const newBox: ShipmentBox = {
        id: result.box_id,
        box_number: result.box_number,
        weight: null,
        length: null,
        width: null,
        height: null,
        sscc: null,
        tracking_number: null,
      }

      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          boxes: [...prev.boxes, newBox],
        }
      })
      setActiveBoxId(result.box_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add box')
    } finally {
      setIsAddingBox(false)
    }
  }

  const handleUpdateBox = async (
    boxId: string,
    updates: Partial<ShipmentBox>
  ) => {
    if (!data) return

    // Validate weight
    if (updates.weight !== undefined && updates.weight !== null) {
      if (updates.weight <= 0) {
        setValidationErrors((prev) => ({
          ...prev,
          [`weight-${boxId}`]: 'Weight must be greater than 0',
        }))
        return
      }
      if (updates.weight > 25) {
        setValidationErrors((prev) => ({
          ...prev,
          [`weight-${boxId}`]: 'Weight exceeds 25kg',
        }))
        return
      }
      setValidationErrors((prev) => {
        const { [`weight-${boxId}`]: _, ...rest } = prev
        return rest
      })
    }

    // Validate dimensions
    const dimensions = ['length', 'width', 'height'] as const
    for (const dim of dimensions) {
      if (updates[dim] !== undefined && updates[dim] !== null) {
        const value = updates[dim] as number
        if (value < 10 || value > 200) {
          setValidationErrors((prev) => ({
            ...prev,
            [`dimensions-${boxId}`]: 'Dimensions must be between 10 and 200 cm',
          }))
          return
        }
      }
    }
    setValidationErrors((prev) => {
      const { [`dimensions-${boxId}`]: _, ...rest } = prev
      return rest
    })

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        boxes: prev.boxes.map((box) =>
          box.id === boxId ? { ...box, ...updates } : box
        ),
      }
    })

    // API call
    try {
      const response = await fetch(
        `/api/shipping/shipments/${shipmentId}/boxes/${boxId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update box')
      }
    } catch (err) {
      // Revert on error
      fetchData()
    }
  }

  const handleAddLPToBox = async () => {
    if (!data || !selectedLP || !activeBoxId) return

    // Check for allergen conflicts
    if (selectedLP.allergens && selectedLP.allergens.length > 0) {
      // Mock customer restrictions check - in real impl, this comes from API
      const customerRestrictions: string[] = [] // Would come from customer data
      const conflicts = selectedLP.allergens.filter((a) =>
        customerRestrictions.includes(a)
      )

      if (conflicts.length > 0) {
        setAllergenWarning({
          isOpen: true,
          productName: selectedLP.product_name,
          productAllergens: selectedLP.allergens,
          customerRestrictions,
          conflictingAllergens: conflicts,
        })
        return
      }
    }

    await performAddLPToBox()
  }

  const performAddLPToBox = async () => {
    if (!data || !selectedLP || !activeBoxId) return

    setIsAddingContent(true)
    try {
      const response = await fetch(
        `/api/shipping/shipments/${shipmentId}/boxes/${activeBoxId}/contents`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            license_plate_id: selectedLP.id,
            sales_order_line_id: data.shipment.sales_order_id, // Simplified
            quantity: selectedLP.quantity_available,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to add LP to box')
      }

      const result = await response.json()

      // Update local state
      const newContent: BoxContent = {
        id: result.content_id,
        shipment_box_id: activeBoxId,
        product_id: selectedLP.product_id,
        product_name: selectedLP.product_name,
        lp_number: selectedLP.lp_number,
        lot_number: result.lot_number || selectedLP.lot_number,
        quantity: selectedLP.quantity_available,
      }

      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          contents: [...prev.contents, newContent],
          available_lps: prev.available_lps.filter(
            (lp) => lp.id !== selectedLP.id
          ),
          pack_progress: {
            ...prev.pack_progress,
            packed_count: prev.pack_progress.packed_count + 1,
            remaining_count: prev.pack_progress.remaining_count - 1,
            percentage: Math.round(
              ((prev.pack_progress.packed_count + 1) /
                prev.pack_progress.total_count) *
                100
            ),
          },
        }
      })

      setSelectedLP(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add LP')
    } finally {
      setIsAddingContent(false)
    }
  }

  const handleCompletePacking = async () => {
    if (!data) return

    setIsCompleting(true)
    try {
      const response = await fetch(
        `/api/shipping/shipments/${shipmentId}/complete-packing`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error === 'MISSING_WEIGHT') {
          setError('All boxes must have weight before completing packing')
          return
        }
        throw new Error(errorData.message || 'Failed to complete packing')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete packing')
    } finally {
      setIsCompleting(false)
    }
  }

  // Computed values
  const canComplete = useMemo(() => {
    if (!data || !data.boxes || !data.pack_progress) return false
    const allBoxesHaveWeight = data.boxes.every(
      (box) => box.weight && box.weight > 0
    )
    const allLPsPacked = data.pack_progress.remaining_count === 0
    return allBoxesHaveWeight && allLPsPacked && data.boxes.length > 0
  }, [data])

  // Render
  if (!isOpen) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-6xl h-[80vh] flex flex-col p-0"
          aria-modal="true"
        >
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Packing Workbench</DialogTitle>
            <DialogDescription>
              Pack items into boxes for shipment
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div data-testid="packing-modal-skeleton" className="flex-1 p-4">
              <div className="grid grid-cols-3 gap-4 h-full">
                <Skeleton className="h-full" />
                <Skeleton className="h-full" />
                <Skeleton className="h-full" />
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <Alert variant="destructive" className="max-w-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  className="mt-2"
                >
                  Retry
                </Button>
              </Alert>
            </div>
          ) : data ? (
            <div
              data-testid="packing-workbench"
              className="flex-1 grid grid-cols-3 divide-x overflow-hidden"
            >
              {/* Left: LP Selector */}
              <LPSelectorPanel
                availableLPs={data.available_lps}
                selectedLP={selectedLP}
                onSelectLP={setSelectedLP}
                onAddToBox={handleAddLPToBox}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                disabled={!activeBoxId || isAddingContent}
              />

              {/* Center: Box Builder */}
              <BoxBuilderPanel
                boxes={data.boxes}
                contents={data.contents}
                activeBoxId={activeBoxId}
                onChangeActiveBox={setActiveBoxId}
                onAddBox={handleAddBox}
                onUpdateBox={handleUpdateBox}
                isAddingBox={isAddingBox}
                errors={validationErrors}
              />

              {/* Right: Summary */}
              <PackingSummaryPanel
                shipment={data.shipment}
                boxes={data.boxes}
                packProgress={data.pack_progress}
                onCompletePacking={handleCompletePacking}
                isCompleting={isCompleting}
                canComplete={canComplete}
              />
            </div>
          ) : null}

          <DialogFooter className="p-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allergen Warning Dialog */}
      {allergenWarning && (
        <AllergenWarningDialog
          {...allergenWarning}
          onConfirm={() => {
            setAllergenWarning(null)
            performAddLPToBox()
          }}
          onCancel={() => setAllergenWarning(null)}
        />
      )}
    </>
  )
}

export default PackingModal
