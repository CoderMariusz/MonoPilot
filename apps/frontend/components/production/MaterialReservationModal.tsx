/**
 * Material Reservation Modal Component
 * Story 4.7: Material Reservation (Desktop)
 * Modal for reserving LP for a material (AC-4.7.2)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Search, Package, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Material {
  id: string
  product_id: string
  material_name: string
  required_qty: number
  reserved_qty: number
  uom: string
  consume_whole_lp: boolean
  reservations: Array<{
    id: string
    sequence_number: number
  }>
}

interface AvailableLP {
  id: string
  lp_number: string
  quantity: number
  current_qty: number
  uom: string
  expiry_date: string | null
  location_name: string | null
}

interface MaterialReservationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  woId: string
  material: Material
  onSuccess: () => void
}

export function MaterialReservationModal({
  open,
  onOpenChange,
  woId,
  material,
  onSuccess,
}: MaterialReservationModalProps) {
  const [search, setSearch] = useState('')
  const [availableLPs, setAvailableLPs] = useState<AvailableLP[]>([])
  const [loadingLPs, setLoadingLPs] = useState(false)
  const [selectedLP, setSelectedLP] = useState<AvailableLP | null>(null)
  const [reservedQty, setReservedQty] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const remaining = Math.max(0, material.required_qty - material.reserved_qty)
  const nextSequence = (material.reservations?.length || 0) + 1

  // Fetch available LPs
  const fetchAvailableLPs = useCallback(async (searchTerm?: string) => {
    try {
      setLoadingLPs(true)
      const params = new URLSearchParams({
        product_id: material.product_id,
        uom: material.uom,
      })
      if (searchTerm) {
        params.set('search', searchTerm)
      }

      const response = await fetch(
        `/api/production/work-orders/${woId}/materials/available-lps?${params}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch available LPs')
      }

      const result = await response.json()
      setAvailableLPs(result.data || [])
    } catch (error) {
      console.error('Error fetching LPs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load available license plates',
        variant: 'destructive',
      })
    } finally {
      setLoadingLPs(false)
    }
  }, [woId, material.product_id, material.uom, toast])

  // Load LPs when modal opens
  useEffect(() => {
    if (open) {
      fetchAvailableLPs()
      setSelectedLP(null)
      setReservedQty('')
      setNotes('')
      setError(null)
      setSearch('')
    }
  }, [open, fetchAvailableLPs])

  // Search debounce
  useEffect(() => {
    if (!open) return

    const timer = setTimeout(() => {
      fetchAvailableLPs(search || undefined)
    }, 300)

    return () => clearTimeout(timer)
  }, [search, open, fetchAvailableLPs])

  // Handle LP selection
  const handleSelectLP = (lp: AvailableLP) => {
    setSelectedLP(lp)
    setError(null)

    // Set default qty
    if (material.consume_whole_lp) {
      setReservedQty(lp.current_qty.toString())
    } else {
      // Default to remaining or LP qty, whichever is smaller
      const defaultQty = Math.min(remaining, lp.current_qty)
      setReservedQty(defaultQty.toString())
    }
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedLP) {
      setError('Please select a license plate')
      return
    }

    const qty = parseFloat(reservedQty)
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    if (qty > selectedLP.current_qty) {
      setError(`Quantity exceeds available (${selectedLP.current_qty} ${material.uom})`)
      return
    }

    if (material.consume_whole_lp && qty !== selectedLP.current_qty) {
      setError(`This material requires whole LP consumption (${selectedLP.current_qty} ${material.uom})`)
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/production/work-orders/${woId}/materials/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: material.id,
          lp_id: selectedLP.id,
          reserved_qty: qty,
          notes: notes || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Failed to reserve material')
        return
      }

      toast({
        title: 'Success',
        description: `Reserved ${qty} ${material.uom} from ${selectedLP.lp_number}`,
      })

      onSuccess()
    } catch (error) {
      console.error('Error reserving material:', error)
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Reserve Material</DialogTitle>
          <DialogDescription>
            Select a license plate to reserve for <strong>{material.material_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Material Info */}
          <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-500">Required</div>
              <div className="font-mono font-medium">
                {material.required_qty.toLocaleString()} {material.uom}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Reserved</div>
              <div className="font-mono font-medium">
                {material.reserved_qty.toLocaleString()} {material.uom}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Remaining</div>
              <div className="font-mono font-medium text-orange-600">
                {remaining.toLocaleString()} {material.uom}
              </div>
            </div>
          </div>

          {/* Whole LP Warning */}
          {material.consume_whole_lp && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-800">
              <AlertCircle className="h-5 w-5" />
              <span>
                This material requires <strong>whole LP consumption</strong>. The entire LP quantity will be reserved.
              </span>
            </div>
          )}

          {/* LP Search */}
          <div className="space-y-2">
            <Label>Search License Plates</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by LP number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Available LPs */}
          <div className="border rounded-lg max-h-[250px] overflow-auto">
            {loadingLPs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Loading...</span>
              </div>
            ) : availableLPs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No available license plates found</p>
                <p className="text-sm">
                  Make sure LP has matching product, UoM, and is in &quot;available&quot; status
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>LP Number</TableHead>
                    <TableHead className="text-right">Available Qty</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableLPs.map((lp) => (
                    <TableRow
                      key={lp.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedLP?.id === lp.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleSelectLP(lp)}
                    >
                      <TableCell className="font-mono">{lp.lp_number}</TableCell>
                      <TableCell className="text-right font-mono">
                        {lp.current_qty.toLocaleString()} {lp.uom}
                      </TableCell>
                      <TableCell>
                        {lp.expiry_date ? (
                          <span
                            className={
                              new Date(lp.expiry_date) < new Date()
                                ? 'text-red-600'
                                : ''
                            }
                          >
                            {formatDate(lp.expiry_date)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{lp.location_name || '-'}</TableCell>
                      <TableCell>
                        {selectedLP?.id === lp.id && (
                          <Badge className="bg-blue-100 text-blue-800">Selected</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Selected LP Info */}
          {selectedLP && (
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Selected LP</div>
                  <div className="font-mono font-medium">{selectedLP.lp_number}</div>
                </div>
                <Badge variant="outline">#{nextSequence} in sequence</Badge>
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <Label>Reservation Quantity</Label>
                {material.consume_whole_lp ? (
                  <div className="p-3 bg-white rounded border">
                    <span className="text-gray-600">Entire LP: </span>
                    <span className="font-mono font-medium">
                      {selectedLP.current_qty} {material.uom}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={reservedQty}
                      onChange={(e) => setReservedQty(e.target.value)}
                      min={0}
                      max={selectedLP.current_qty}
                      step="0.0001"
                      className="font-mono"
                    />
                    <span className="text-gray-500">{material.uom}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this reservation..."
                  maxLength={500}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedLP || submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {material.consume_whole_lp ? 'Reserve Full LP' : 'Reserve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
