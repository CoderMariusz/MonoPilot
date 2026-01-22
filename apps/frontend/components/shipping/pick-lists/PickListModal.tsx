/**
 * Pick List Modal Component
 * Story 07.8: Pick List Generation
 *
 * Modal for creating pick lists:
 * - SO selection table with checkboxes
 * - Priority selection (low, normal, high, urgent)
 * - Immediate picker assignment (optional)
 * - Preview section with pick type and line count
 * - Validation for SO allocations
 */

'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Package,
  ClipboardList,
  Layers,
} from 'lucide-react'
import type { PickListPriority } from '@/lib/hooks/use-pick-lists'

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
  has_allocations?: boolean
}

export interface Picker {
  id: string
  name: string
}

export interface CreatePickListData {
  sales_order_ids: string[]
  priority: PickListPriority
  assigned_to?: string
}

export interface PickListModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreatePickListData) => Promise<void>
  salesOrders: SalesOrder[]
  pickers: Picker[]
  isLoading?: boolean
  testId?: string
}

// =============================================================================
// Component
// =============================================================================

export function PickListModal({
  isOpen,
  onClose,
  onSubmit,
  salesOrders,
  pickers,
  isLoading = false,
  testId = 'pick-list-modal',
}: PickListModalProps) {
  const [selectedSOs, setSelectedSOs] = useState<Set<string>>(new Set())
  const [priority, setPriority] = useState<PickListPriority>('normal')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedSOs(new Set())
      setPriority('normal')
      setAssignedTo('')
      setSearchTerm('')
      setError(null)
    }
  }, [isOpen])

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

  const pickType = selectedSOs.size === 1 ? 'single_order' : 'wave'
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
    setError(null)
  }, [])

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedSOs(new Set(filteredSOs.map((so) => so.id)))
      } else {
        setSelectedSOs(new Set())
      }
      setError(null)
    },
    [filteredSOs]
  )

  const isAllSelected = filteredSOs.length > 0 && filteredSOs.every((so) => selectedSOs.has(so.id))

  // Validate SOs have allocations
  const validateSelection = (): boolean => {
    const sosWithoutAllocations = Array.from(selectedSOs).filter((soId) => {
      const so = salesOrders.find((s) => s.id === soId)
      return so && so.has_allocations === false
    })

    if (sosWithoutAllocations.length > 0) {
      setError('Some selected orders do not have inventory allocations. Please allocate inventory first.')
      return false
    }

    return true
  }

  // Submit handler
  const handleSubmit = async () => {
    if (selectedSOs.size === 0) return
    if (!validateSelection()) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        sales_order_ids: Array.from(selectedSOs),
        priority,
        assigned_to: assignedTo || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pick list')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = selectedSOs.size > 0 && !isSubmitting

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        aria-modal="true"
        data-testid={testId}
      >
        <DialogHeader>
          <DialogTitle>Create Pick List</DialogTitle>
          <DialogDescription>
            Select sales orders to create a pick list. Multiple orders will create a wave pick list.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sales Order Selection Table */}
          <div className="space-y-2">
            <Label>Select Sales Orders</Label>
            <div className="border rounded-lg max-h-64 overflow-y-auto">
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
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredSOs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSOs.map((so) => (
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {selectedSOs.size > 0 && (
              <p className="text-sm text-gray-600">
                {selectedSOs.size} orders selected
              </p>
            )}
          </div>

          {/* Priority and Assignment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as PickListPriority)}>
                <SelectTrigger id="priority" aria-label="Priority">
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

            <div className="space-y-2">
              <Label htmlFor="assign-to">Assign to (optional)</Label>
              <Select value={assignedTo || 'unassigned'} onValueChange={(val) => setAssignedTo(val === 'unassigned' ? '' : val)}>
                <SelectTrigger id="assign-to" aria-label="Assign to">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {pickers.map((picker) => (
                    <SelectItem key={picker.id} value={picker.id}>
                      {picker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview Section */}
          {selectedSOs.size > 0 && (
            <div className="space-y-3">
              <Label>Preview</Label>
              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <div className="flex items-center gap-3">
                  {pickType === 'single_order' ? (
                    <>
                      <Package className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Single Order Pick List</span>
                    </>
                  ) : (
                    <>
                      <Layers className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Wave Pick List</span>
                    </>
                  )}
                  <Badge variant={priority === 'urgent' ? 'destructive' : priority === 'high' ? 'default' : 'secondary'}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ClipboardList className="h-4 w-4" />
                  <span>{totalLineCount} lines</span>
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

        <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Pick List'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PickListModal
