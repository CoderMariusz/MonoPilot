/**
 * BOMDetailModal Component
 * Modal for displaying BOM details instead of navigating to a separate page
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  Package,
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCw,
  Edit,
  X,
  Settings,
  DollarSign,
  Route,
  Percent,
} from 'lucide-react'
import type { BOMWithProduct } from '@/lib/validation/bom-schemas'
import { BOMCreateModal } from './BOMCreateModal'

interface BOMDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bomId: string | null
  onEdit?: (bomId: string) => void
}

interface BOMItem {
  id: string
  product_id: string
  quantity: number
  uom: string
  sequence: number
  operation_seq: number
  scrap_percent: number
  is_output: boolean
  consume_whole_lp: boolean
  notes: string | null
  component?: {
    id: string
    code: string
    name: string
    base_uom: string
    product_type?: {
      code: string
      name: string
    }
  }
}

interface BOMProductionLine {
  id: string
  line_id: string
  labor_cost_per_hour: number | null
  line?: {
    id: string
    name: string
  }
}

interface BOMDetail extends BOMWithProduct {
  items?: BOMItem[]
  production_lines?: BOMProductionLine[]
  routing?: {
    id: string
    name: string
    code: string
  } | null
}

export function BOMDetailModal({
  open,
  onOpenChange,
  bomId,
  onEdit,
}: BOMDetailModalProps) {
  const [bom, setBom] = useState<BOMDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('details')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [costData, setCostData] = useState<{
    total_cost: number | null
    cost_per_unit: number | null
    material_cost: number | null
    labor_cost: number | null
    breakdown: Array<{
      component_code: string
      component_name: string
      quantity: number
      unit_cost: number
      total_cost: number
    }>
  } | null>(null)
  const [costLoading, setCostLoading] = useState(false)

  // Fetch BOM data when modal opens
  useEffect(() => {
    if (open && bomId) {
      fetchBOM()
    } else {
      setBom(null)
      setError(null)
      setActiveTab('details')
    }
  }, [open, bomId])

  const fetchBOM = async () => {
    if (!bomId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/technical/boms/${bomId}?include_items=true`)

      if (!response.ok) {
        throw new Error('Failed to fetch BOM')
      }

      const data = await response.json()
      setBom(data.bom)
    } catch (err) {
      console.error('Error fetching BOM:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const calculateCost = async () => {
    if (!bomId) return

    setCostLoading(true)
    try {
      const response = await fetch(`/api/technical/boms/${bomId}/cost`)
      if (response.ok) {
        const data = await response.json()
        // API returns snake_case format
        setCostData({
          total_cost: data.total_cost ?? null,
          cost_per_unit: data.cost_per_unit ?? null,
          material_cost: data.material_cost ?? null,
          labor_cost: data.labor_cost ?? null,
          breakdown: data.breakdown?.materials?.map((m: {
            ingredient_code: string
            ingredient_name: string
            quantity: number
            unit_cost: number
            total_cost: number
          }) => ({
            component_code: m.ingredient_code,
            component_name: m.ingredient_name,
            quantity: m.quantity,
            unit_cost: m.unit_cost,
            total_cost: m.total_cost
          })) ?? []
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Cost API error:', errorData)
        setCostData({
          total_cost: null,
          cost_per_unit: null,
          material_cost: null,
          labor_cost: null,
          breakdown: []
        })
      }
    } catch (err) {
      console.error('Error calculating cost:', err)
      setCostData({
        total_cost: null,
        cost_per_unit: null,
        material_cost: null,
        labor_cost: null,
        breakdown: []
      })
    } finally {
      setCostLoading(false)
    }
  }

  const handleEdit = () => {
    if (bomId && bom) {
      setEditModalOpen(true)
    }
  }

  const handleEditSuccess = () => {
    setEditModalOpen(false)
    fetchBOM() // Refresh BOM data after edit
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      active: 'default',
      obsolete: 'destructive',
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const inputItems = bom?.items?.filter(i => !i.is_output) || []
  const outputItems = bom?.items?.filter(i => i.is_output) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <DialogTitle>BOM Details</DialogTitle>
            </div>
            {bom && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          <DialogDescription className="sr-only">
            View and manage Bill of Materials details
          </DialogDescription>
          {bom && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="font-mono font-medium">{bom.product?.code}</span>
              <span>-</span>
              <span>{bom.product?.name}</span>
              <Badge variant="outline" className="ml-2">v{bom.version}</Badge>
              {getStatusBadge(bom.status)}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Loading BOM details...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <Button variant="outline" onClick={fetchBOM}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          {/* Success State */}
          {bom && !loading && !error && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="components">
                  Components ({inputItems.length})
                </TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="costing">Costing</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Header Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Product</label>
                      <p className="font-medium">{bom.product?.code} - {bom.product?.name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Version</label>
                      <p className="font-medium">{bom.version}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Status</label>
                      <p>{getStatusBadge(bom.status)}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Output Quantity</label>
                      <p className="font-medium">{bom.output_qty} {bom.output_uom}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Effective From</label>
                      <p className="font-medium">{typeof bom.effective_from === 'string' ? bom.effective_from : bom.effective_from.toISOString().split('T')[0]}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Effective To</label>
                      <p className="font-medium">{bom.effective_to ? (typeof bom.effective_to === 'string' ? bom.effective_to : bom.effective_to.toISOString().split('T')[0]) : 'No end date'}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {bom.notes && (
                  <div>
                    <label className="text-xs text-muted-foreground">Notes</label>
                    <p className="text-sm mt-1">{bom.notes}</p>
                  </div>
                )}

                {/* Packaging */}
                {(bom.units_per_box || bom.boxes_per_pallet) && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Packaging</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {bom.units_per_box && (
                        <div>
                          <label className="text-xs text-muted-foreground">Units per Box</label>
                          <p className="font-medium">{bom.units_per_box}</p>
                        </div>
                      )}
                      {bom.boxes_per_pallet && (
                        <div>
                          <label className="text-xs text-muted-foreground">Boxes per Pallet</label>
                          <p className="font-medium">{bom.boxes_per_pallet}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="components" className="mt-4">
                {inputItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No components defined</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seq</TableHead>
                        <TableHead>Component</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>UoM</TableHead>
                        <TableHead className="text-right">Scrap %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inputItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.sequence}</TableCell>
                          <TableCell>
                            <div>
                              <span className="font-mono text-sm">{item.component?.code}</span>
                              <span className="text-muted-foreground ml-2">{item.component?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.component?.product_type?.code || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {item.quantity}
                          </TableCell>
                          <TableCell>{item.uom}</TableCell>
                          <TableCell className="text-right">
                            {item.scrap_percent > 0 ? `${item.scrap_percent}%` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* By-products */}
                {outputItems.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">By-products ({outputItems.length})</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Component</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead>UoM</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outputItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <span className="font-mono text-sm">{item.component?.code}</span>
                              <span className="text-muted-foreground ml-2">{item.component?.name}</span>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {item.quantity}
                            </TableCell>
                            <TableCell>{item.uom}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-4 mt-4">
                {/* Yield Settings */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Yield Configuration</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Expected Yield</label>
                      <p className="font-medium">{bom.yield_percent ?? 100}%</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Output Quantity</label>
                      <p className="font-medium">{bom.output_qty} {bom.output_uom}</p>
                    </div>
                  </div>
                </div>

                {/* Routing */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Route className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Routing</h4>
                  </div>
                  {bom.routing_id ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground">Routing ID</label>
                        <p className="font-mono text-sm">{bom.routing_id}</p>
                      </div>
                      {bom.routing && (
                        <div>
                          <label className="text-xs text-muted-foreground">Routing Name</label>
                          <p className="font-medium">{bom.routing.name}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No routing assigned</p>
                  )}
                </div>

                {/* Production Lines */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Production Lines</h4>
                  </div>
                  {bom.production_lines && bom.production_lines.length > 0 ? (
                    <div className="space-y-2">
                      {bom.production_lines.map((pl) => (
                        <div key={pl.id} className="flex items-center justify-between text-sm">
                          <span>{pl.line?.name || pl.line_id}</span>
                          {pl.labor_cost_per_hour && (
                            <Badge variant="outline">
                              {pl.labor_cost_per_hour} PLN/hr
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No production lines assigned</p>
                  )}
                </div>

                {/* Packaging (if not shown in Details) */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Packaging Configuration</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Units per Box</label>
                      <p className="font-medium">{bom.units_per_box ?? '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Boxes per Pallet</label>
                      <p className="font-medium">{bom.boxes_per_pallet ?? '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Units per Pallet</label>
                      <p className="font-medium">
                        {bom.units_per_box && bom.boxes_per_pallet
                          ? bom.units_per_box * bom.boxes_per_pallet
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Costing Tab */}
              <TabsContent value="costing" className="space-y-4 mt-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <h4 className="text-sm font-medium">Cost Summary</h4>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={calculateCost}
                      disabled={costLoading}
                    >
                      {costLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Recalculate
                    </Button>
                  </div>

                  {/* Cost Summary Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <label className="text-xs text-muted-foreground">Total Cost</label>
                      <p className="text-xl font-bold">
                        {costData?.total_cost != null
                          ? `${costData.total_cost.toFixed(2)} PLN`
                          : '-- PLN'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <label className="text-xs text-muted-foreground">Cost per Unit</label>
                      <p className="text-xl font-bold">
                        {costData?.cost_per_unit != null
                          ? `${costData.cost_per_unit.toFixed(2)} PLN/${bom.output_uom}`
                          : `-- PLN/${bom.output_uom}`}
                      </p>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Material Cost</span>
                      <span className="font-medium">
                        {costData?.material_cost != null
                          ? `${costData.material_cost.toFixed(2)} PLN`
                          : '-- PLN'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Labor Cost</span>
                      <span className="font-medium">
                        {costData?.labor_cost != null
                          ? `${costData.labor_cost.toFixed(2)} PLN`
                          : '-- PLN'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* View Breakdown */}
                {costData?.breakdown && costData.breakdown.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium mb-3">Cost Breakdown</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Component</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costData.breakdown.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <span className="font-mono text-sm">{item.component_code}</span>
                              <span className="text-muted-foreground ml-2">{item.component_name}</span>
                            </TableCell>
                            <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                            <TableCell className="text-right font-mono">{item.unit_cost.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono font-medium">{item.total_cost.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Routing Warning */}
                {!bom.routing_id && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Routing not assigned</span>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      Labor costs not included. Assign a routing to calculate full production costs.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>

      {/* Edit BOM Modal */}
      {bom && (
        <BOMCreateModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={handleEditSuccess}
          editBomId={bomId}
          initialData={{
            id: bom.id,
            product_id: bom.product_id,
            product: bom.product ? {
              id: bom.product.id,
              code: bom.product.code,
              name: bom.product.name,
              uom: bom.product.uom || 'kg',
            } : undefined,
            version: bom.version,
            status: bom.status,
            effective_from: typeof bom.effective_from === 'string' ? bom.effective_from : bom.effective_from?.toISOString() || '',
            effective_to: bom.effective_to ? (typeof bom.effective_to === 'string' ? bom.effective_to : bom.effective_to?.toISOString()) : null,
            output_qty: bom.output_qty,
            output_uom: bom.output_uom,
            yield_percent: bom.yield_percent,
            notes: bom.notes,
            routing_id: bom.routing_id || null,
            units_per_box: bom.units_per_box,
            boxes_per_pallet: bom.boxes_per_pallet,
            items: bom.items?.map(item => ({
              id: item.id,
              product_id: item.product_id,
              component: item.component ? {
                id: item.component.id,
                code: item.component.code,
                name: item.component.name,
                uom: item.component.base_uom || 'kg',
              } : undefined,
              quantity: item.quantity,
              uom: item.uom,
              scrap_percent: item.scrap_percent,
              sequence: item.sequence,
              operation_seq: item.operation_seq,
              is_output: item.is_output,
              consume_whole_lp: item.consume_whole_lp,
              notes: item.notes,
            }))
          }}
        />
      )}
    </Dialog>
  )
}
