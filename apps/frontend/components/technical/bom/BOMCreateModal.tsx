/**
 * BOMCreateModal - Single-step BOM creation modal
 *
 * Creates BOM + items in a single request to avoid 500 errors
 * with the 2-step save process.
 *
 * Features:
 * - All fields from the BOM create page
 * - Items stored in local state
 * - Validation: minimum 1 item required
 * - Single POST to /api/technical/boms/with-items
 */

'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { bomKeys } from '@/lib/hooks/use-boms'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Package,
  Settings,
  ChevronDown,
  ChevronUp,
  Save,
  FileText,
  Check,
  ChevronsUpDown,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

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
  type?: string
  product_type?: ProductType
  uom: string
}

interface BOMItemLocal {
  id: string // local temp ID
  component_id: string
  component?: Product
  quantity: number
  uom: string
  scrap_percent: number
  consume_whole_lp: boolean
  sequence: number
  operation_seq: number
  is_output: boolean
  notes: string
}

interface BOMData {
  id: string
  product_id: string
  product?: Product
  version: number
  status: string
  effective_from: string
  effective_to: string | null
  output_qty: number
  output_uom: string
  yield_percent?: number
  notes: string | null
  routing_id: string | null
  units_per_box: number | null
  boxes_per_pallet: number | null
  items?: Array<{
    id: string
    product_id: string
    component?: Product
    quantity: number
    uom: string
    scrap_percent: number
    sequence: number
    operation_seq: number
    is_output: boolean
    consume_whole_lp: boolean
    notes: string | null
  }>
}

interface BOMCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  editBomId?: string | null
  initialData?: BOMData | null
}

export function BOMCreateModal({ open, onOpenChange, onSuccess, editBomId, initialData }: BOMCreateModalProps) {
  const isEditMode = !!editBomId
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Debug: log when modal open state changes
  useEffect(() => {
    console.log('BOMCreateModal open state changed:', open)
  }, [open])

  // ==================== BOM HEADER STATE ====================
  const [productId, setProductId] = useState('')
  const [status, setStatus] = useState('draft')
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0])
  const [effectiveTo, setEffectiveTo] = useState('')
  const [outputQty, setOutputQty] = useState('1')
  const [outputUom, setOutputUom] = useState('kg')
  const [yieldPercent, setYieldPercent] = useState('100')
  const [notes, setNotes] = useState('')
  const [routingId, setRoutingId] = useState('')
  const [unitsPerBox, setUnitsPerBox] = useState('')
  const [boxesPerPallet, setBoxesPerPallet] = useState('')

  // ==================== DATA STATE ====================
  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [routings, setRoutings] = useState<{ id: string; code: string; name: string }[]>([])
  const [items, setItems] = useState<BOMItemLocal[]>([])
  const [version, setVersion] = useState(1)

  // ==================== UI STATE ====================
  const [saving, setSaving] = useState(false)
  const [advancedExpanded, setAdvancedExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('header')

  // ==================== ITEM FORM STATE ====================
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [componentComboboxOpen, setComponentComboboxOpen] = useState(false)
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

  // ==================== LOAD PRODUCTS & ROUTINGS ====================
  useEffect(() => {
    if (open) {
      const fetchProducts = async () => {
        try {
          const response = await fetch('/api/technical/products?limit=1000&status=active')
          if (response.ok) {
            const data = await response.json()
            const rawProducts = data.data || data.products || []
            const productList = rawProducts.map((p: any) => ({
              ...p,
              type: p.product_type?.code || p.type || 'unknown',
              uom: p.base_uom || p.uom || 'kg' // Map base_uom to uom for consistency
            }))
            setAllProducts(productList)
            // FG and WIP only for main product selector
            const fgWipProducts = productList.filter((p: Product) => p.type === 'FG' || p.type === 'WIP')
            setProducts(fgWipProducts)
          }
        } catch (error) {
          console.error('Error fetching products:', error)
        }
      }

      const fetchRoutings = async () => {
        try {
          const response = await fetch('/api/technical/routings?is_active=true')
          if (response.ok) {
            const data = await response.json()
            setRoutings(data.routings || [])
          }
        } catch (error) {
          console.error('Error fetching routings:', error)
        }
      }

      fetchProducts()
      fetchRoutings()
    }
  }, [open])

  // ==================== GET NEXT VERSION ====================
  // Skip in edit mode - version is already set from initialData
  useEffect(() => {
    if (productId && !isEditMode) {
      const fetchNextVersion = async () => {
        try {
          const response = await fetch(`/api/technical/boms?product_id=${productId}&limit=1&sortBy=version&sortOrder=desc`)
          if (response.ok) {
            const data = await response.json()
            if (data.boms && data.boms.length > 0) {
              setVersion((data.boms[0].version || 0) + 1)
            } else {
              setVersion(1)
            }
          }
        } catch {
          setVersion(1)
        }
      }
      fetchNextVersion()
    }
  }, [productId, isEditMode])

  // Reset form when modal closes OR populate when opening in edit mode
  useEffect(() => {
    if (!open) {
      // Reset form when closing
      setProductId('')
      setStatus('draft')
      setEffectiveFrom(new Date().toISOString().split('T')[0])
      setEffectiveTo('')
      setOutputQty('1')
      setOutputUom('kg')
      setYieldPercent('100')
      setNotes('')
      setRoutingId('')
      setUnitsPerBox('')
      setBoxesPerPallet('')
      setItems([])
      setVersion(1)
      setActiveTab('header')
      setShowItemForm(false)
      setEditingItemId(null)
    } else if (isEditMode && initialData) {
      // Populate form with existing BOM data
      setProductId(initialData.product_id)
      setStatus(initialData.status)
      setEffectiveFrom(initialData.effective_from?.split('T')[0] || '')
      setEffectiveTo(initialData.effective_to?.split('T')[0] || '')
      setOutputQty(initialData.output_qty?.toString() || '1')
      setOutputUom(initialData.output_uom || 'kg')
      setYieldPercent(initialData.yield_percent?.toString() || '100')
      setNotes(initialData.notes || '')
      setRoutingId(initialData.routing_id || '')
      setUnitsPerBox(initialData.units_per_box?.toString() || '')
      setBoxesPerPallet(initialData.boxes_per_pallet?.toString() || '')
      setVersion(initialData.version)

      // Populate items
      if (initialData.items && initialData.items.length > 0) {
        const mappedItems: BOMItemLocal[] = initialData.items.map(item => ({
          id: item.id || crypto.randomUUID(),
          component_id: item.product_id || '',
          component: item.component,
          quantity: item.quantity ?? 0,
          uom: item.uom || '',
          scrap_percent: item.scrap_percent ?? 0,
          sequence: item.sequence ?? 0,
          operation_seq: item.operation_seq ?? 1,
          is_output: item.is_output ?? false,
          consume_whole_lp: item.consume_whole_lp ?? false,
          notes: item.notes || '',
        }))
        setItems(mappedItems)
      }
    }
  }, [open, isEditMode, initialData])

  // ==================== ITEM HANDLERS ====================
  // Show all products as components - user can search/filter by typing
  const componentProducts = allProducts

  // Auto-fill UoM when component selected
  useEffect(() => {
    if (itemForm.component_id && !editingItemId) {
      const comp = allProducts.find(p => p.id === itemForm.component_id)
      if (comp) {
        // Always set a defined value - use empty string as fallback
        setItemForm(prev => ({ ...prev, uom: comp.uom || '' }))
      }
    }
  }, [itemForm.component_id, allProducts, editingItemId])

  const resetItemForm = (isOutput = false) => {
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
    setEditingItemId(null)
  }

  const openItemForm = (item?: BOMItemLocal | null, isOutput = false) => {
    if (item) {
      setEditingItemId(item.id)
      setItemForm({
        component_id: item.component_id || '',
        quantity: (item.quantity ?? '').toString(),
        uom: item.uom || '',
        scrap_percent: (item.scrap_percent ?? 0).toString(),
        sequence: (item.sequence ?? '').toString(),
        consume_whole_lp: item.consume_whole_lp ?? false,
        operation_seq: (item.operation_seq ?? 1).toString(),
        is_output: item.is_output ?? false,
        notes: item.notes || '',
      })
    } else {
      resetItemForm(isOutput)
    }
    setShowItemForm(true)
  }

  const handleSaveItem = (addMore = false) => {
    if (!itemForm.component_id || !itemForm.quantity || !itemForm.uom) {
      toast({ title: 'Error', description: 'Fill required fields', variant: 'destructive' })
      return
    }

    const component = allProducts.find(p => p.id === itemForm.component_id)
    const nextSequence = items.length > 0
      ? Math.max(...items.map(i => i.sequence)) + 1
      : 1

    const newItem: BOMItemLocal = {
      id: editingItemId || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      component_id: itemForm.component_id,
      component: component,
      quantity: parseFloat(itemForm.quantity),
      uom: itemForm.uom,
      scrap_percent: parseFloat(itemForm.scrap_percent) || 0,
      sequence: itemForm.sequence ? parseInt(itemForm.sequence) : nextSequence,
      consume_whole_lp: itemForm.consume_whole_lp,
      operation_seq: parseInt(itemForm.operation_seq) || 1,
      is_output: itemForm.is_output,
      notes: itemForm.notes,
    }

    if (editingItemId) {
      setItems(prev => prev.map(i => i.id === editingItemId ? newItem : i))
      toast({ title: 'Item updated' })
    } else {
      setItems(prev => [...prev, newItem])
      toast({ title: 'Item added' })
    }

    if (addMore) {
      resetItemForm(itemForm.is_output)
    } else {
      setShowItemForm(false)
      resetItemForm()
    }
  }

  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId))
    toast({ title: 'Item removed' })
  }

  // ==================== SAVE BOM ====================
  const handleSave = async (asDraft = false) => {
    // Validation
    if (!productId) {
      toast({ title: 'Error', description: 'Select a product', variant: 'destructive' })
      return
    }

    const inputItemsForValidation = items.filter(i => !i.is_output)
    if (inputItemsForValidation.length === 0) {
      toast({ title: 'Error', description: 'Add at least one component', variant: 'destructive' })
      setActiveTab('items')
      return
    }

    setSaving(true)
    try {
      const payload = {
        // BOM header
        product_id: productId,
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
        // Items
        items: items.map(item => ({
          component_id: item.component_id,
          quantity: item.quantity,
          uom: item.uom,
          scrap_percent: item.scrap_percent,
          sequence: item.sequence,
          consume_whole_lp: item.consume_whole_lp,
          operation_seq: item.operation_seq,
          is_output: item.is_output,
          notes: item.notes || null,
        })),
      }

      let response: Response
      if (isEditMode && editBomId) {
        // Update existing BOM
        response = await fetch(`/api/technical/boms/${editBomId}/with-items`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        // Create new BOM
        response = await fetch('/api/technical/boms/with-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || `Failed to ${isEditMode ? 'update' : 'create'} BOM`)
      }

      const data = await response.json()
      toast({
        title: 'Success',
        description: isEditMode
          ? `BOM v${data.bom.version} updated`
          : `BOM v${data.bom.version} created with ${items.length} items`,
      })

      // Invalidate React Query cache to refresh timeline and lists
      queryClient.invalidateQueries({ queryKey: bomKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bomKeys.timeline(productId) })
      queryClient.invalidateQueries({ queryKey: bomKeys.nextVersion(productId) })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} BOM`,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const selectedProduct = products.find(p => p.id === productId)
  const inputItems = items.filter(i => !i.is_output)
  const outputItems = items.filter(i => i.is_output)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditMode ? `Edit BOM v${version}` : 'Create New BOM'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modify the BOM recipe. All changes are saved together.'
              : 'Define the recipe for your product. All fields are saved together.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="header">
              Header
            </TabsTrigger>
            <TabsTrigger value="items" className="relative">
              Components
              {inputItems.length > 0 && (
                <Badge variant="secondary" className="ml-2">{inputItems.length}</Badge>
              )}
              {inputItems.length === 0 && (
                <AlertCircle className="ml-2 h-4 w-4 text-orange-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4">
            {/* ==================== HEADER TAB ==================== */}
            <TabsContent value="header" className="mt-0 space-y-4">
              {/* Product & Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Product *</Label>
                  <Select value={productId} onValueChange={setProductId} disabled={isEditMode}>
                    <SelectTrigger className={cn(!productId ? 'text-gray-400' : '', isEditMode && 'bg-gray-50')}>
                      <SelectValue placeholder="Select finished product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
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
                  {isEditMode && (
                    <p className="text-xs text-muted-foreground">Product cannot be changed in edit mode</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Version</Label>
                  <Input value={isEditMode ? `v${version}` : `v${version} (auto)`} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select value={status} onValueChange={setStatus}>
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

              {/* Dates & Output */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Effective From *</Label>
                  <Input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Effective To</Label>
                  <Input
                    type="date"
                    value={effectiveTo}
                    onChange={(e) => setEffectiveTo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Output Quantity *</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={outputQty}
                    onChange={(e) => setOutputQty(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>UoM</Label>
                  <Select value={outputUom} onValueChange={setOutputUom}>
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

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Production notes, special instructions..."
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* ==================== ITEMS TAB ==================== */}
            <TabsContent value="items" className="mt-0 space-y-4">
              {/* Item Form */}
              {showItemForm ? (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      {editingItemId ? 'Edit' : 'Add'} {itemForm.is_output ? 'Byproduct' : 'Component'}
                    </h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setShowItemForm(false); resetItemForm(); }}>
                      Cancel
                    </Button>
                  </div>

                  {/* Component Selector - Searchable Combobox */}
                  {!editingItemId && (
                    <div className="space-y-2">
                      <Label>Component *</Label>
                      <Popover open={componentComboboxOpen} onOpenChange={setComponentComboboxOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={componentComboboxOpen}
                            className="w-full justify-between font-normal"
                          >
                            {itemForm.component_id ? (
                              <span className="flex items-center gap-2 truncate">
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {componentProducts.find(p => p.id === itemForm.component_id)?.type}
                                </Badge>
                                <span className="truncate">
                                  {componentProducts.find(p => p.id === itemForm.component_id)?.code} - {componentProducts.find(p => p.id === itemForm.component_id)?.name}
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Select material...</span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[500px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search by code or name..." />
                            <CommandList>
                              <CommandEmpty>No product found.</CommandEmpty>
                              <CommandGroup>
                                {componentProducts.map(p => (
                                  <CommandItem
                                    key={p.id}
                                    value={`${p.code} ${p.name}`}
                                    onSelect={() => {
                                      setItemForm(prev => ({ ...prev, component_id: p.id }))
                                      setComponentComboboxOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        itemForm.component_id === p.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <Badge variant="outline" className="text-xs mr-2">{p.type}</Badge>
                                    <span className="font-medium">{p.code}</span>
                                    <span className="text-gray-500 ml-2 truncate">- {p.name}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {itemForm.component_id && (
                    <div className="p-2 bg-white rounded border text-sm">
                      <span className="font-medium">
                        {allProducts.find(p => p.id === itemForm.component_id)?.code}
                      </span>
                      {' - '}
                      {allProducts.find(p => p.id === itemForm.component_id)?.name}
                    </div>
                  )}

                  {/* Qty & UoM */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={itemForm.quantity ?? ''}
                        onChange={(e) => setItemForm(prev => ({ ...prev, quantity: e.target.value ?? '' }))}
                        placeholder="50.000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>UoM *</Label>
                      <Input
                        value={itemForm.uom ?? ''}
                        onChange={(e) => setItemForm(prev => ({ ...prev, uom: e.target.value ?? '' }))}
                        placeholder="kg"
                      />
                    </div>
                  </div>

                  {/* Scrap & Sequence */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Scrap %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={itemForm.scrap_percent ?? ''}
                        onChange={(e) => setItemForm(prev => ({ ...prev, scrap_percent: e.target.value ?? '' }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sequence</Label>
                      <Input
                        type="number"
                        value={itemForm.sequence ?? ''}
                        onChange={(e) => setItemForm(prev => ({ ...prev, sequence: e.target.value ?? '' }))}
                        placeholder="Auto"
                      />
                    </div>
                  </div>

                  {/* LP Mode */}
                  {!itemForm.is_output && (
                    <div className="space-y-2">
                      <Label>LP Consumption</Label>
                      <RadioGroup
                        value={itemForm.consume_whole_lp ? 'whole' : 'partial'}
                        onValueChange={(v) => setItemForm(prev => ({ ...prev, consume_whole_lp: v === 'whole' }))}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="partial" id="m-partial" />
                          <Label htmlFor="m-partial" className="font-normal">Partial</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="whole" id="m-whole" />
                          <Label htmlFor="m-whole" className="font-normal">Whole LP</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input
                      value={itemForm.notes ?? ''}
                      onChange={(e) => setItemForm(prev => ({ ...prev, notes: e.target.value ?? '' }))}
                      placeholder="Special instructions..."
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => handleSaveItem(false)}>
                      Save Item
                    </Button>
                    {!editingItemId && (
                      <Button type="button" onClick={() => handleSaveItem(true)}>
                        Save & Add More
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button type="button" onClick={() => openItemForm(null, false)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Component
                  </Button>
                  <Button type="button" variant="outline" onClick={() => openItemForm(null, true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Byproduct
                  </Button>
                </div>
              )}

              {/* Items Table */}
              {inputItems.length === 0 && !showItemForm ? (
                <div className="py-8 text-center border-2 border-dashed rounded-lg border-orange-200 bg-orange-50">
                  <Package className="mx-auto h-12 w-12 text-orange-300" />
                  <h3 className="mt-4 text-lg font-medium text-orange-800">No components added</h3>
                  <p className="mt-2 text-sm text-orange-600">
                    A BOM requires at least one component to save.
                  </p>
                </div>
              ) : inputItems.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Component</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>UoM</TableHead>
                        <TableHead className="text-right">Scrap%</TableHead>
                        <TableHead>LP Mode</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
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
                            <Badge variant={item.consume_whole_lp ? 'default' : 'outline'} className="text-xs">
                              {item.consume_whole_lp ? 'Whole' : 'Partial'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => openItemForm(item)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Byproducts */}
              {outputItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-600">Byproducts</h4>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Byproduct</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead>UoM</TableHead>
                          <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outputItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="font-medium">{item.component?.code || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{item.component?.name}</div>
                            </TableCell>
                            <TableCell className="text-right font-mono">{item.quantity.toFixed(3)}</TableCell>
                            <TableCell>{item.uom}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button type="button" variant="ghost" size="sm" onClick={() => openItemForm(item)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Summary */}
              {inputItems.length > 0 && (
                <div className="flex justify-between text-sm text-gray-600 px-2 pt-2 border-t">
                  <span>Total Input: {inputItems.reduce((sum, i) => sum + i.quantity, 0).toFixed(3)} (mixed units)</span>
                  <span>Expected Output: {outputQty} {outputUom}</span>
                </div>
              )}
            </TabsContent>

            {/* ==================== ADVANCED TAB ==================== */}
            <TabsContent value="advanced" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Routing</Label>
                  <Select
                    value={routingId || 'none'}
                    onValueChange={(v) => setRoutingId(v === 'none' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select routing..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No routing</SelectItem>
                      {routings.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.code} - {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {routings.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No routings available. Create a routing first in Technical → Routings.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Yield %</Label>
                  <Input
                    type="number"
                    value={yieldPercent}
                    onChange={(e) => setYieldPercent(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Units per Box</Label>
                  <Input
                    type="number"
                    value={unitsPerBox}
                    onChange={(e) => setUnitsPerBox(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Boxes per Pallet</Label>
                  <Input
                    type="number"
                    value={boxesPerPallet}
                    onChange={(e) => setBoxesPerPallet(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
              {inputItems.length === 0 ? (
                <span className="text-orange-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Add at least one component
                </span>
              ) : (
                <span>{inputItems.length} component(s) added</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSave(true)}
                disabled={saving || !productId || inputItems.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving || !productId || inputItems.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : isEditMode ? 'Update BOM' : 'Save BOM'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
