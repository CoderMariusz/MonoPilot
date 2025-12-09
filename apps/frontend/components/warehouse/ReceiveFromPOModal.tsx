/**
 * Receive from PO Modal Component
 * Story 5.32: Receive from PO (Desktop)
 *
 * Modal for receiving goods from a PO line item
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle, CheckCircle2, Printer } from 'lucide-react'
import type { SourceDocument, SourceDocumentLine } from '@/lib/types/receiving'

interface ReceiveFromPOModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  po: SourceDocument
  line: SourceDocumentLine
}

interface Location {
  id: string
  code: string
  name: string
  warehouse_id: string
  type: string
}

interface ReceiveResult {
  grn_id: string
  grn_number: string
  lp_ids: string[]
  lp_numbers: string[]
  po_status_changed: boolean
  po_new_status?: string
  items_received: number
  total_qty_received: number
}

export function ReceiveFromPOModal({
  open,
  onClose,
  onSuccess,
  po,
  line,
}: ReceiveFromPOModalProps) {
  const { toast } = useToast()

  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])

  const [qtyReceived, setQtyReceived] = useState(line.remaining_qty.toString())
  const [batchNumber, setBatchNumber] = useState('')
  const [manufactureDate, setManufactureDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [locationId, setLocationId] = useState('')

  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [result, setResult] = useState<ReceiveResult | null>(null)

  // Fetch locations
  useEffect(() => {
    if (open) {
      fetchLocations()
      // Reset form
      setQtyReceived(line.remaining_qty.toString())
      setBatchNumber('')
      setManufactureDate('')
      setExpiryDate('')
      setLocationId('')
      setShowSuccess(false)
      setResult(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, line.remaining_qty])

  // Filter locations by warehouse and type
  useEffect(() => {
    const filtered = locations.filter(
      (loc) =>
        loc.warehouse_id === po.warehouse_id &&
        (loc.type === 'receiving' || loc.type === 'storage')
    )
    setFilteredLocations(filtered)
  }, [locations, po.warehouse_id])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/settings/locations?limit=500')
      if (!response.ok) throw new Error('Failed to fetch locations')
      const data = await response.json()
      setLocations(data.locations || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load locations',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const qty = parseFloat(qtyReceived)
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Quantity must be greater than 0',
        variant: 'destructive',
      })
      return
    }

    if (!batchNumber.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Batch number is required (FDA compliance)',
        variant: 'destructive',
      })
      return
    }

    if (!locationId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a location',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/warehouse/receiving/from-po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_id: po.id,
          items: [
            {
              po_line_id: line.id,
              qty_received: qty,
              batch_number: batchNumber.trim(),
              manufacture_date: manufactureDate || undefined,
              expiry_date: expiryDate || undefined,
              location_id: locationId,
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to receive goods')
      }

      const data = await response.json()

      setResult({
        grn_id: data.grn_id,
        grn_number: data.grn_number,
        lp_ids: data.lp_ids,
        lp_numbers: data.lp_numbers,
        po_status_changed: data.po_status_changed,
        po_new_status: data.po_new_status,
        items_received: data.items_received,
        total_qty_received: data.total_qty_received,
      })

      setShowSuccess(true)

      toast({
        title: 'Success',
        description: `Received ${qty} ${line.uom} - GRN ${data.grn_number} created`,
      })
    } catch (error) {
      console.error('Error receiving goods:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to receive goods',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrintLabels = () => {
    toast({
      title: 'Print Labels',
      description: 'Label printing feature coming soon',
    })
  }

  const handleClose = () => {
    if (showSuccess) {
      onSuccess()
    } else {
      onClose()
    }
  }

  // Check for over-receipt warning
  const qty = parseFloat(qtyReceived)
  const isOverReceipt = !isNaN(qty) && qty > line.remaining_qty
  const overReceiptAmount = isOverReceipt ? qty - line.remaining_qty : 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Receive from PO {po.doc_number}</DialogTitle>
          <DialogDescription>
            {line.product_name} ({line.product_code})
          </DialogDescription>
        </DialogHeader>

        {showSuccess && result ? (
          /* Success Confirmation */
          <div className="space-y-4 py-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="font-semibold mb-2">Goods received successfully!</div>
                <div className="space-y-1 text-sm">
                  <div>GRN Number: <strong>{result.grn_number}</strong></div>
                  <div>License Plates created:</div>
                  <ul className="list-disc list-inside ml-2">
                    {result.lp_numbers.map((lpNum) => (
                      <li key={lpNum}><strong>{lpNum}</strong></li>
                    ))}
                  </ul>
                  {result.po_status_changed && (
                    <div className="mt-2">
                      PO status updated to: <strong>{result.po_new_status}</strong>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handlePrintLabels}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Labels
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          /* Receive Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Info */}
            <div className="bg-gray-50 p-3 rounded-md text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ordered:</span>
                <span className="font-medium">
                  {line.expected_qty} {line.uom}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already Received:</span>
                <span className="font-medium">
                  {line.received_qty} {line.uom}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium text-blue-600">
                  {line.remaining_qty} {line.uom}
                </span>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="qty">
                Quantity to Receive <span className="text-red-500">*</span>
              </Label>
              <Input
                id="qty"
                type="number"
                step="0.01"
                min="0"
                value={qtyReceived}
                onChange={(e) => setQtyReceived(e.target.value)}
                required
              />
            </div>

            {/* Over-receipt Warning */}
            {isOverReceipt && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Over-receipt detected: receiving {overReceiptAmount.toFixed(2)} {line.uom} more
                  than remaining quantity. Check warehouse settings if this is not allowed.
                </AlertDescription>
              </Alert>
            )}

            {/* Batch Number */}
            <div className="space-y-2">
              <Label htmlFor="batch">
                Batch Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="batch"
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g., BATCH-2024-001"
                required
              />
            </div>

            {/* Manufacture Date */}
            <div className="space-y-2">
              <Label htmlFor="mfg-date">Manufacture Date</Label>
              <Input
                id="mfg-date"
                type="date"
                value={manufactureDate}
                onChange={(e) => setManufactureDate(e.target.value)}
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="exp-date">Expiry Date</Label>
              <Input
                id="exp-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-red-500">*</span>
              </Label>
              <Select value={locationId} onValueChange={setLocationId} required>
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {filteredLocations.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No receiving/storage locations available
                    </div>
                  ) : (
                    filteredLocations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.code} - {loc.name} ({loc.type})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Receiving...' : 'Receive'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
