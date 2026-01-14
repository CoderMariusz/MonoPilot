/**
 * BOM Edit Page (TEC-006)
 * Full page for editing existing BOMs - same layout as create page
 *
 * Sections per wireframe:
 * 1. Page Header - Back, Save Draft, Save buttons
 * 2. BOM Header - Product (locked), Version, Status, Dates, Output Qty/UoM
 * 3. BOM Items Table - Components with alternatives, actions menu
 * 4. Byproducts Section - Output items
 * 5. Cost Summary Panel - Material + Routing costs (collapsible)
 * 6. Advanced Settings - Routing, Packaging, Notes (collapsible)
 * 7. Footer - Unsaved changes warning, Cancel, Save Draft, Save BOM
 */

'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, FileText, Plus, MoreVertical, Trash2, Edit2,
  Copy, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Package,
  DollarSign, Settings, AlertTriangle, RefreshCw, Loader2, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import { TechnicalHeader } from '@/components/technical/TechnicalHeader'
import { useToast } from '@/hooks/use-toast'

// Types
interface ProductType {
  id: string
  code: string
  name: string
}

interface Product {
  id: string
  code: string
  name: string
  type?: string // mapped from product_type.code
  product_type?: ProductType
  uom: string
}

interface BOMItem {
  id: string
  component_id: string
  component?: Product
  quantity: number
  uom: string
  scrap_percent: number
  consume_whole_lp: boolean
  sequence: number
  operation_seq: number
  is_output: boolean
  notes?: string | null
  line_ids?: string[] | null
}

interface BOM {
  id: string
  product_id: string
  product?: Product
  version: number
  status: string
  effective_from: string
  effective_to: string | null
  output_qty: number
  output_uom: string
  yield_percent: number
  notes: string | null
  routing_id: string | null
  units_per_box: number | null
  boxes_per_pallet: number | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditBOMPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  // ==================== LOADING STATE ====================
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // ==================== BOM HEADER STATE ====================
  const [bom, setBom] = useState<BOM | null>(null)
  const [status, setStatus] = useState('draft')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [effectiveTo, setEffectiveTo] = useState('')
  const [outputQty, setOutputQty] = useState('1')
  const [outputUom, setOutputUom] = useState('kg')
  const [yieldPercent, setYieldPercent] = useState('100')
  const [notes, setNotes] = useState('')
  const [routingId, setRoutingId] = useState('')
  const [unitsPerBox, setUnitsPerBox] = useState('')
  const [boxesPerPallet, setBoxesPerPallet] = useState('')

  // ==================== DATA STATE ====================
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [items, setItems] = useState<BOMItem[]>([])

  // ==================== UI STATE ====================
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [costExpanded, setCostExpanded] = useState(false)
  const [advancedExpanded, setAdvancedExpanded] = useState(false)

  // ==================== ITEM MODAL STATE ====================
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BOMItem | null>(null)
  const [itemForm, setItemForm] = useState({
    component_id: '',
    quantity: '',
    uom: '',
    scrap_percent: '0',
    sequence: '',
    consume_whole_lp: false,
    operation_seq: '1',
    is_output: false,
    notes: '',
  })
  const [itemSaving, setItemSaving] = useState(false)

  // Delete confirmation
  const [deletingItem, setDeletingItem] = useState<BOMItem | null>(null)

  // ==================== LOAD BOM ====================
  useEffect(() => {
    const fetchBOM = async () => {
      try {
        const response = await fetch(`/api/technical/boms/${id}`)
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to load BOM')
        }
        const data = await response.json()
        const bomData = data.bom

        setBom(bomData)
        setStatus(bomData.status || 'draft')
        setEffectiveFrom(bomData.effective_from?.split('T')[0] || '')
        setEffectiveTo(bomData.effective_to?.split('T')[0] || '')
        setOutputQty(bomData.output_qty?.toString() || '1')
        setOutputUom(bomData.output_uom || 'kg')
        setYieldPercent(bomData.yield_percent?.toString() || '100')
        setNotes(bomData.notes || '')
        setRoutingId(bomData.routing_id || '')
        setUnitsPerBox(bomData.units_per_box?.toString() || '')
        setBoxesPerPallet(bomData.boxes_per_pallet?.toString() || '')
        setLoading(false)
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Failed to load BOM')
        setLoading(false)
      }
    }
    fetchBOM()
  }, [id])

  // ==================== LOAD PRODUCTS ====================
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/technical/products?limit=1000&status=active')
        if (response.ok) {
          const data = await response.json()
          const rawProducts = data.data || data.products || []
          // Map product_type.code to type for easier access
          const productList = rawProducts.map((p: Product) => ({
            ...p,
            type: p.product_type?.code || p.type || 'unknown'
          }))
          setAllProducts(productList)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }
    fetchProducts()
  }, [])

  // ==================== FETCH ITEMS ====================
  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch(`/api/technical/boms/${id}/items`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }, [id])

  useEffect(() => {
    if (!loading && bom) {
      fetchItems()
    }
  }, [loading, bom, fetchItems])

  // ==================== SAVE BOM HEADER ====================
  const handleSave = async (asDraft = false) => {
    setSaving(true)
    try {
      const payload = {
        status: asDraft ? 'draft' : status,
        effective_from: effectiveFrom,
        effective_to: effectiveTo || null,
        output_qty: parseFloat(outputQty) || 1,
        output_uom: outputUom,
        yield_percent: parseFloat(yieldPercent) || 100,
        notes: notes || null,
        routing_id: routingId || null,
        units_per_box: unitsPerBox ? parseInt(unitsPerBox) : null,
        boxes_per_pallet: boxesPerPallet ? parseInt(boxesPerPallet) : null,
      }

      const response = await fetch(`/api/technical/boms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to save BOM')
      }

      setHasUnsavedChanges(false)
      toast({
        title: 'Success',
        description: 'BOM updated successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save BOM',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // ==================== ITEM MODAL HANDLERS ====================
  const openItemModal = (item?: BOMItem | null, isOutput = false) => {
    if (item) {
      setEditingItem(item)
      setItemForm({
        component_id: item.component_id || '',
        quantity: item.quantity?.toString() || '',
        uom: item.uom || '',
        scrap_percent: item.scrap_percent?.toString() || '0',
        sequence: item.sequence?.toString() || '',
        consume_whole_lp: item.consume_whole_lp || false,
        operation_seq: item.operation_seq?.toString() || '1',
        is_output: item.is_output || false,
        notes: item.notes || '',
      })
    } else {
      setEditingItem(null)
      setItemForm({
        component_id: '',
        quantity: '',
        uom: '',
        scrap_percent: '0',
        sequence: '',
        consume_whole_lp: false,
        operation_seq: '1',
        is_output: isOutput,
        notes: '',
      })
    }
    setItemModalOpen(true)
  }

  const handleItemSave = async (addMore = false) => {
    if (!itemForm.component_id || !itemForm.quantity || !itemForm.uom) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' })
      return
    }

    setItemSaving(true)
    try {
      const payload = {
        component_id: itemForm.component_id,
        quantity: parseFloat(itemForm.quantity),
        uom: itemForm.uom,
        scrap_percent: parseFloat(itemForm.scrap_percent) || 0,
        sequence: itemForm.sequence ? parseInt(itemForm.sequence) : undefined,
        consume_whole_lp: itemForm.consume_whole_lp,
        operation_seq: parseInt(itemForm.operation_seq) || 1,
        is_output: itemForm.is_output,
        notes: itemForm.notes || null,
      }

      const url = editingItem
        ? `/api/technical/boms/${id}/items/${editingItem.id}`
        : `/api/technical/boms/${id}/items`

      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save item')
      }

      toast({ title: 'Success', description: editingItem ? 'Item updated' : 'Item added' })
      fetchItems()

      if (addMore) {
        setItemForm({
          component_id: '',
          quantity: '',
          uom: '',
          scrap_percent: '0',
          sequence: '',
          consume_whole_lp: false,
          operation_seq: '1',
          is_output: itemForm.is_output,
          notes: '',
        })
        setEditingItem(null)
      } else {
        setItemModalOpen(false)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save item',
        variant: 'destructive',
      })
    } finally {
      setItemSaving(false)
    }
  }

  // ==================== DELETE ITEM ====================
  const handleDeleteItem = async () => {
    if (!deletingItem) return

    try {
      const response = await fetch(`/api/technical/boms/${id}/items/${deletingItem.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete item')

      toast({ title: 'Success', description: 'Item removed' })
      setDeletingItem(null)
      fetchItems()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' })
    }
  }

  // ==================== HELPERS ====================
  const inputItems = items.filter(i => !i.is_output)
  const outputItems = items.filter(i => i.is_output)

  // Get component products (RM, ING, PKG for items)
  const componentProducts = allProducts.filter(p =>
    p.type && ['RM', 'ING', 'PKG', 'WIP'].includes(p.type)
  )

  // Auto-fill UoM when component selected
  useEffect(() => {
    if (itemForm.component_id && !editingItem) {
      const comp = allProducts.find(p => p.id === itemForm.component_id)
      if (comp && !itemForm.uom) {
        setItemForm(prev => ({ ...prev, uom: comp.uom }))
      }
    }
  }, [itemForm.component_id, allProducts, editingItem, itemForm.uom])

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TechnicalHeader currentPage="boms" />
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <Button variant="ghost" className="mb-4" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to BOM
          </Button>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Loading BOM...</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ==================== ERROR STATE ====================
  if (loadError || !bom) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TechnicalHeader currentPage="boms" />
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/technical/boms')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to BOMs
          </Button>
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  {loadError ? 'Failed to Load BOM' : 'BOM Not Found'}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {loadError || 'The requested BOM could not be found.'}
                </p>
                <Button onClick={() => router.push('/technical/boms')}>
                  View All BOMs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TechnicalHeader currentPage="boms" />

      {/* ==================== PAGE HEADER ==================== */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push(`/technical/boms/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to BOM
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
              <FileText className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={() => handleSave(false)} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6 pb-24">

        {/* ==================== BOM HEADER SECTION ==================== */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              BOM Header
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Row 1: Product (locked), Version, Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{bom.product?.type}</Badge>
                    <span className="font-medium">{bom.product?.code}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{bom.product?.name}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Version</Label>
                <Input value={`v${bom.version}`} disabled className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={status} onValueChange={(v) => { setStatus(v); setHasUnsavedChanges(true); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="phased_out">Phased Out</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Dates, Output Qty */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Effective From *</Label>
                <Input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => { setEffectiveFrom(e.target.value); setHasUnsavedChanges(true); }}
                />
              </div>
              <div className="space-y-2">
                <Label>Effective To</Label>
                <Input
                  type="date"
                  value={effectiveTo}
                  onChange={(e) => { setEffectiveTo(e.target.value); setHasUnsavedChanges(true); }}
                />
              </div>
              <div className="space-y-2">
                <Label>Output Quantity *</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={outputQty}
                  onChange={(e) => { setOutputQty(e.target.value); setHasUnsavedChanges(true); }}
                />
              </div>
              <div className="space-y-2">
                <Label>UoM</Label>
                <Select value={outputUom} onValueChange={(v) => { setOutputUom(v); setHasUnsavedChanges(true); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="mL">mL</SelectItem>
                    <SelectItem value="pcs">pcs</SelectItem>
                    <SelectItem value="EA">EA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm text-gray-500">Batch size: How much output does this BOM produce?</p>
          </CardContent>
        </Card>

        {/* ==================== BOM ITEMS TABLE ==================== */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                BOM Items (Components)
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={() => openItemModal(null, false)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
                <Button variant="outline" disabled>Import</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {inputItems.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed rounded-lg">
                <Package className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium">No components added yet</h3>
                <p className="mt-2 text-sm text-gray-500">A BOM needs at least one component to define the recipe.</p>
                <Button className="mt-4" onClick={() => openItemModal(null, false)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Component
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>UoM</TableHead>
                      <TableHead className="text-right">Scrap%</TableHead>
                      <TableHead>LP Mode</TableHead>
                      <TableHead className="text-center">Seq</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inputItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-gray-500">{index + 1}</TableCell>
                        <TableCell>
                          <div className="font-medium">{item.component?.code || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{item.component?.name}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{item.quantity.toFixed(3)}</TableCell>
                        <TableCell>{item.uom}</TableCell>
                        <TableCell className="text-right">{item.scrap_percent}%</TableCell>
                        <TableCell>
                          <Badge variant={item.consume_whole_lp ? 'default' : 'outline'}>
                            {item.consume_whole_lp ? 'Whole LP' : 'Partial'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{item.sequence}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openItemModal(item)}>
                                <Edit2 className="h-4 w-4 mr-2" />Edit Item
                              </DropdownMenuItem>
                              <DropdownMenuItem><Plus className="h-4 w-4 mr-2" />Add Alternative</DropdownMenuItem>
                              <DropdownMenuItem><Copy className="h-4 w-4 mr-2" />Duplicate</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem><ArrowUp className="h-4 w-4 mr-2" />Move Up</DropdownMenuItem>
                              <DropdownMenuItem><ArrowDown className="h-4 w-4 mr-2" />Move Down</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => setDeletingItem(item)}>
                                <Trash2 className="h-4 w-4 mr-2" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex justify-between text-sm text-gray-600 px-2">
                  <span>Total Input: {inputItems.reduce((sum, i) => sum + i.quantity, 0).toFixed(3)} (mixed units)</span>
                  <span>Expected Output: {outputQty} {outputUom} (100%)</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ==================== BYPRODUCTS SECTION ==================== */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Byproducts (Optional Outputs)
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => openItemModal(null, true)}>
                <Plus className="h-4 w-4 mr-2" />Add Output
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {outputItems.length === 0 ? (
              <p className="py-4 text-center text-gray-500">No byproducts defined.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Byproduct</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>UoM</TableHead>
                    <TableHead className="text-right">Yield%</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-12">Act</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outputItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-gray-500">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{item.component?.code || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{item.component?.name}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{item.quantity.toFixed(3)}</TableCell>
                      <TableCell>{item.uom}</TableCell>
                      <TableCell className="text-right">
                        {((item.quantity / parseFloat(outputQty || '1')) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{item.notes || '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openItemModal(item)}>
                              <Edit2 className="h-4 w-4 mr-2" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => setDeletingItem(item)}>
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <p className="text-sm text-gray-500 mt-4">Byproducts are tracked separately and can be used in other BOMs</p>
          </CardContent>
        </Card>

        {/* ==================== COST SUMMARY PANEL ==================== */}
        <Collapsible open={costExpanded} onOpenChange={setCostExpanded}>
          <Card>
            <CardHeader className="pb-4">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Cost Summary
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    {costExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    View Breakdown
                  </Button>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <DollarSign className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4">Add materials to see cost breakdown</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold">-- PLN</p>
                      <p className="text-sm text-gray-500">Cost per Unit: -- PLN/{outputUom}</p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <RefreshCw className="h-4 w-4 mr-2" />Recalculate
                    </Button>
                  </div>
                  <CollapsibleContent>
                    <div className="border-t pt-4 mt-4 space-y-1 text-sm">
                      <p className="font-semibold">Material Costs:</p>
                      {inputItems.map(item => (
                        <div key={item.id} className="flex justify-between pl-4 text-gray-600">
                          <span>├─ {item.component?.code}: {item.quantity} {item.uom}</span>
                          <span>-- PLN</span>
                        </div>
                      ))}
                      <div className="border-t mt-4 pt-4 flex justify-between font-semibold">
                        <span>Total BOM Cost:</span>
                        <span>-- PLN</span>
                      </div>
                    </div>
                  </CollapsibleContent>
                  {!routingId && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">Routing not assigned</p>
                        <p className="text-yellow-700">Labor costs not included.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Collapsible>

        {/* ==================== ADVANCED SETTINGS ==================== */}
        <Collapsible open={advancedExpanded} onOpenChange={setAdvancedExpanded}>
          <Card>
            <CardHeader className="pb-4">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Advanced Settings
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    {advancedExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Routing</Label>
                    <Select value={routingId} onValueChange={(v) => { setRoutingId(v); setHasUnsavedChanges(true); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select routing..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No routing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Yield %</Label>
                    <Input
                      type="number"
                      value={yieldPercent}
                      onChange={(e) => { setYieldPercent(e.target.value); setHasUnsavedChanges(true); }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Units per Box</Label>
                    <Input
                      type="number"
                      value={unitsPerBox}
                      onChange={(e) => { setUnitsPerBox(e.target.value); setHasUnsavedChanges(true); }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Boxes per Pallet</Label>
                    <Input
                      type="number"
                      value={boxesPerPallet}
                      onChange={(e) => { setBoxesPerPallet(e.target.value); setHasUnsavedChanges(true); }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value); setHasUnsavedChanges(true); }}
                    rows={3}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* ==================== UNSAVED CHANGES FOOTER ==================== */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-50 border-t border-yellow-200 py-3 px-4 z-20">
          <div className="container mx-auto max-w-6xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span>You have unsaved changes</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/technical/boms/${id}`)}>Cancel</Button>
              <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>Save as Draft</Button>
              <Button onClick={() => handleSave(false)} disabled={saving}>Save BOM</Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD/EDIT ITEM MODAL ==================== */}
      <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit' : 'Add'} {itemForm.is_output ? 'Byproduct' : 'Component'} to BOM
            </DialogTitle>
            <DialogDescription>
              {itemForm.is_output
                ? 'Define a byproduct generated during production'
                : 'Select raw material (RM), ingredient (ING), or packaging (PKG)'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Component Selector */}
            {!editingItem && (
              <div className="space-y-2">
                <Label>Component *</Label>
                <Select
                  value={itemForm.component_id}
                  onValueChange={(v) => setItemForm(prev => ({ ...prev, component_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Search materials, ingredients, packaging..." />
                  </SelectTrigger>
                  <SelectContent>
                    {componentProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{p.type}</Badge>
                          <span>{p.code}</span>
                          <span className="text-gray-500">- {p.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Selected component info */}
            {itemForm.component_id && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">
                  Selected: {allProducts.find(p => p.id === itemForm.component_id)?.code} -{' '}
                  {allProducts.find(p => p.id === itemForm.component_id)?.name}
                </p>
                <p className="text-xs text-gray-500">
                  Type: {allProducts.find(p => p.id === itemForm.component_id)?.type} |{' '}
                  UoM: {allProducts.find(p => p.id === itemForm.component_id)?.uom}
                </p>
              </div>
            )}

            <hr />

            {/* Quantity and UoM */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="e.g., 50.000"
                />
                <p className="text-xs text-gray-500">How much per batch output ({outputQty} {outputUom})</p>
              </div>
              <div className="space-y-2">
                <Label>Unit of Measure</Label>
                <Input
                  value={itemForm.uom}
                  onChange={(e) => setItemForm(prev => ({ ...prev, uom: e.target.value }))}
                  placeholder="kg, pcs, L..."
                />
              </div>
            </div>

            {/* Scrap and Sequence */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scrap Allowance %</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={itemForm.scrap_percent}
                  onChange={(e) => setItemForm(prev => ({ ...prev, scrap_percent: e.target.value }))}
                />
                <p className="text-xs text-gray-500">Expected material loss</p>
              </div>
              <div className="space-y-2">
                <Label>Sequence</Label>
                <Input
                  type="number"
                  value={itemForm.sequence}
                  onChange={(e) => setItemForm(prev => ({ ...prev, sequence: e.target.value }))}
                  placeholder="10, 20, 30..."
                />
                <p className="text-xs text-gray-500">Order in production</p>
              </div>
            </div>

            <hr />

            {/* LP Consumption Mode */}
            {!itemForm.is_output && (
              <div className="space-y-2">
                <Label>License Plate Consumption Mode *</Label>
                <RadioGroup
                  value={itemForm.consume_whole_lp ? 'whole' : 'partial'}
                  onValueChange={(v) => setItemForm(prev => ({ ...prev, consume_whole_lp: v === 'whole' }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id="partial" />
                    <Label htmlFor="partial" className="font-normal">Partial - Consume only required quantity from LP</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="whole" id="whole" />
                    <Label htmlFor="whole" className="font-normal">Whole LP - Consume entire License Plate (1:1)</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-gray-500">Whole LP: System picks LPs that match required qty exactly</p>
              </div>
            )}

            <hr />

            {/* Operation Assignment */}
            <div className="space-y-2">
              <Label>Operation Assignment (Optional)</Label>
              <Select
                value={itemForm.operation_seq}
                onValueChange={(v) => setItemForm(prev => ({ ...prev, operation_seq: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select operation from routing..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Operation 1</SelectItem>
                  <SelectItem value="2">Operation 2</SelectItem>
                  <SelectItem value="3">Operation 3</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Links this item to specific production step</p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={itemForm.notes}
                onChange={(e) => setItemForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Special handling instructions..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setItemModalOpen(false)}>Cancel</Button>
            <Button onClick={() => handleItemSave(false)} disabled={itemSaving}>
              {itemSaving ? 'Saving...' : 'Save Item'}
            </Button>
            {!editingItem && (
              <Button variant="secondary" onClick={() => handleItemSave(true)} disabled={itemSaving}>
                Save & Add More
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== DELETE CONFIRMATION ==================== */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deletingItem?.is_output ? 'Byproduct' : 'Component'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingItem?.component?.code || 'this item'} from the BOM?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-500 hover:bg-red-600">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
