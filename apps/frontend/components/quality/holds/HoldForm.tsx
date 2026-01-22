/**
 * Hold Form Component
 * Story: 06.2 - Quality Holds CRUD
 * AC-2.1 to AC-2.7: Create hold form with validation
 *
 * Form for creating quality holds with item selection
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, Package, Factory, Barcode, Search, Loader2 } from 'lucide-react'
import {
  HOLD_TYPES,
  PRIORITIES,
  REFERENCE_TYPES,
  type HoldType,
  type Priority,
  type ReferenceType,
  type HoldItemInput,
} from '@/lib/validation/quality-hold-validation'

interface HoldFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (holdId: string) => void
}

interface SelectedItem {
  reference_type: ReferenceType
  reference_id: string
  reference_display: string
  quantity_held?: number
  uom?: string
  location_name?: string
  notes?: string
}

interface LicensePlate {
  id: string
  lp_number: string
  quantity_on_hand: number
  uom: string
  product_name?: string
  location_name?: string
  qa_status?: string
}

interface WorkOrder {
  id: string
  wo_number: string
  product_name?: string
  status: string
  planned_quantity: number
  uom: string
}

const HOLD_TYPE_LABELS: Record<HoldType, string> = {
  qa_pending: 'QA Pending (Awaiting Inspection)',
  investigation: 'Investigation (Under Review)',
  recall: 'Recall (Safety Recall)',
  quarantine: 'Quarantine (Isolated)',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export function HoldForm({ open, onClose, onSuccess }: HoldFormProps) {
  // Form state
  const [reason, setReason] = useState('')
  const [holdType, setHoldType] = useState<HoldType>('qa_pending')
  const [priority, setPriority] = useState<Priority>('medium')
  const [items, setItems] = useState<SelectedItem[]>([])

  // Item selection modal state
  const [itemSelectorOpen, setItemSelectorOpen] = useState(false)
  const [itemType, setItemType] = useState<ReferenceType>('lp')
  const [searchQuery, setSearchQuery] = useState('')

  // Available items state
  const [availableLPs, setAvailableLPs] = useState<LicensePlate[]>([])
  const [availableWOs, setAvailableWOs] = useState<WorkOrder[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const { toast } = useToast()

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setReason('')
      setHoldType('qa_pending')
      setPriority('medium')
      setItems([])
      setErrors({})
    }
  }, [open])

  // Fetch LPs when item selector opens
  const fetchLPs = useCallback(async () => {
    setLoadingItems(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      params.append('limit', '50')
      // Exclude LPs already on hold
      params.append('exclude_qa_status', 'hold')

      const response = await fetch(`/api/warehouse/license-plates?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch license plates')

      const data = await response.json()
      setAvailableLPs(data.license_plates || data.data || [])
    } catch (error) {
      console.error('Error fetching LPs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load license plates',
        variant: 'destructive',
      })
    } finally {
      setLoadingItems(false)
    }
  }, [searchQuery, toast])

  // Fetch WOs when item selector opens
  const fetchWOs = useCallback(async () => {
    setLoadingItems(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      params.append('limit', '50')
      // Only show active WOs
      params.append('status', 'in_progress')

      const response = await fetch(`/api/planning/work-orders?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch work orders')

      const data = await response.json()
      setAvailableWOs(data.work_orders || data.data || [])
    } catch (error) {
      console.error('Error fetching WOs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load work orders',
        variant: 'destructive',
      })
    } finally {
      setLoadingItems(false)
    }
  }, [searchQuery, toast])

  // Load items when selector opens
  useEffect(() => {
    if (itemSelectorOpen) {
      if (itemType === 'lp') {
        fetchLPs()
      } else if (itemType === 'wo') {
        fetchWOs()
      }
    }
  }, [itemSelectorOpen, itemType, searchQuery, fetchLPs, fetchWOs])

  // Debounced search
  useEffect(() => {
    if (!itemSelectorOpen) return
    const timer = setTimeout(() => {
      if (itemType === 'lp') fetchLPs()
      else if (itemType === 'wo') fetchWOs()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, itemSelectorOpen, itemType, fetchLPs, fetchWOs])

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!reason.trim()) {
      newErrors.reason = 'Reason is required'
    } else if (reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters'
    } else if (reason.length > 500) {
      newErrors.reason = 'Reason must not exceed 500 characters'
    }

    if (items.length === 0) {
      newErrors.items = 'At least one item must be added to the hold'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle adding selected items
  const handleAddItems = () => {
    const newItems: SelectedItem[] = []

    if (itemType === 'lp') {
      availableLPs.forEach((lp) => {
        if (selectedIds.has(lp.id) && !items.find((i) => i.reference_id === lp.id)) {
          newItems.push({
            reference_type: 'lp',
            reference_id: lp.id,
            reference_display: lp.lp_number,
            quantity_held: lp.quantity_on_hand,
            uom: lp.uom,
            location_name: lp.location_name,
          })
        }
      })
    } else if (itemType === 'wo') {
      availableWOs.forEach((wo) => {
        if (selectedIds.has(wo.id) && !items.find((i) => i.reference_id === wo.id)) {
          newItems.push({
            reference_type: 'wo',
            reference_id: wo.id,
            reference_display: wo.wo_number,
            quantity_held: wo.planned_quantity,
            uom: wo.uom,
          })
        }
      })
    }

    setItems([...items, ...newItems])
    setSelectedIds(new Set())
    setItemSelectorOpen(false)
    setSearchQuery('')

    // Clear items error if items were added
    if (newItems.length > 0 && errors.items) {
      setErrors((prev) => {
        const { items: _, ...rest } = prev
        return rest
      })
    }
  }

  // Handle removing an item
  const handleRemoveItem = (referenceId: string) => {
    setItems(items.filter((i) => i.reference_id !== referenceId))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)

    try {
      const payload = {
        reason: reason.trim(),
        hold_type: holdType,
        priority,
        items: items.map((item) => ({
          reference_type: item.reference_type,
          reference_id: item.reference_id,
          quantity_held: item.quantity_held,
          uom: item.uom,
          notes: item.notes,
        })),
      }

      const response = await fetch('/api/quality/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create hold')
      }

      const data = await response.json()

      toast({
        title: 'Success',
        description: `Hold ${data.hold?.hold_number || ''} created successfully`,
      })

      onSuccess(data.hold?.id)
    } catch (error) {
      console.error('Error creating hold:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create hold',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle item selection
  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Quality Hold</DialogTitle>
            <DialogDescription>
              Create a new quality hold to block inventory from consumption pending investigation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  if (errors.reason) {
                    setErrors((prev) => {
                      const { reason: _, ...rest } = prev
                      return rest
                    })
                  }
                }}
                placeholder="Describe the reason for placing items on hold (min 10 characters)"
                rows={3}
                maxLength={500}
                className={errors.reason ? 'border-red-500' : ''}
              />
              {errors.reason && <p className="text-sm text-red-500">{errors.reason}</p>}
              <p className="text-xs text-gray-500">{reason.length}/500 characters</p>
            </div>

            {/* Hold Type */}
            <div className="space-y-2">
              <Label htmlFor="hold_type">
                Hold Type <span className="text-red-500">*</span>
              </Label>
              <Select value={holdType} onValueChange={(v) => setHoldType(v as HoldType)}>
                <SelectTrigger id="hold_type">
                  <SelectValue placeholder="Select hold type" />
                </SelectTrigger>
                <SelectContent>
                  {HOLD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {HOLD_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>
                  Items <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setItemSelectorOpen(true)
                    setSelectedIds(new Set())
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Items
                </Button>
              </div>

              {errors.items && <p className="text-sm text-red-500">{errors.items}</p>}

              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <Package className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">
                    No items added yet. Click &quot;Add Items&quot; to select items for this hold.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.reference_id}>
                          <TableCell>
                            <Badge variant="outline" className="flex w-fit items-center gap-1">
                              {item.reference_type === 'lp' && <Package className="h-3 w-3" />}
                              {item.reference_type === 'wo' && <Factory className="h-3 w-3" />}
                              {item.reference_type === 'batch' && <Barcode className="h-3 w-3" />}
                              {item.reference_type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">{item.reference_display}</TableCell>
                          <TableCell className="text-right font-mono">
                            {item.quantity_held
                              ? `${item.quantity_held} ${item.uom || ''}`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.reference_id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Hold'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Item Selector Modal */}
      <Dialog open={itemSelectorOpen} onOpenChange={setItemSelectorOpen}>
        <DialogContent className="max-w-xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Items to Hold</DialogTitle>
            <DialogDescription>Select items to place on quality hold.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Item type selector */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={itemType === 'lp' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setItemType('lp')
                  setSelectedIds(new Set())
                  setSearchQuery('')
                }}
              >
                <Package className="mr-2 h-4 w-4" />
                License Plates
              </Button>
              <Button
                type="button"
                variant={itemType === 'wo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setItemType('wo')
                  setSelectedIds(new Set())
                  setSearchQuery('')
                }}
              >
                <Factory className="mr-2 h-4 w-4" />
                Work Orders
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={`Search ${itemType === 'lp' ? 'license plates' : 'work orders'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Items list */}
            <div className="max-h-[300px] overflow-y-auto rounded-lg border">
              {loadingItems ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : itemType === 'lp' ? (
                availableLPs.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">No license plates found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead>LP Number</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableLPs.map((lp) => {
                        const isAlreadyAdded = items.some((i) => i.reference_id === lp.id)
                        return (
                          <TableRow
                            key={lp.id}
                            className={isAlreadyAdded ? 'opacity-50' : 'cursor-pointer'}
                            onClick={() => !isAlreadyAdded && toggleItemSelection(lp.id)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(lp.id)}
                                disabled={isAlreadyAdded}
                                onCheckedChange={() => toggleItemSelection(lp.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell className="font-mono">{lp.lp_number}</TableCell>
                            <TableCell className="text-right font-mono">
                              {lp.quantity_on_hand} {lp.uom}
                            </TableCell>
                            <TableCell className="text-gray-500">
                              {lp.location_name || '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )
              ) : availableWOs.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No work orders found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>WO Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableWOs.map((wo) => {
                      const isAlreadyAdded = items.some((i) => i.reference_id === wo.id)
                      return (
                        <TableRow
                          key={wo.id}
                          className={isAlreadyAdded ? 'opacity-50' : 'cursor-pointer'}
                          onClick={() => !isAlreadyAdded && toggleItemSelection(wo.id)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(wo.id)}
                              disabled={isAlreadyAdded}
                              onCheckedChange={() => toggleItemSelection(wo.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell className="font-mono">{wo.wo_number}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{wo.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {wo.planned_quantity} {wo.uom}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setItemSelectorOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddItems}
              disabled={selectedIds.size === 0}
            >
              Add {selectedIds.size} Item{selectedIds.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
