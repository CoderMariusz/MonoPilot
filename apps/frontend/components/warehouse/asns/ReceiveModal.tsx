/**
 * ReceiveModal Component (Story 05.9)
 * Purpose: Main receive workflow modal - master dialog for ASN receiving
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { useASNReceivePreview, useASNReceive } from '@/lib/hooks/use-asn-receive'
import { ReceiveItemRow } from './ReceiveItemRow'
import { ReceiveSummary } from './ReceiveSummary'
import type { ASNReceiveItem, ASNReceiveResult } from '@/lib/types/asn-receive'

interface ReceiveModalProps {
  asnId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: (result: ASNReceiveResult) => void
}

export function ReceiveModal({ asnId, isOpen, onClose, onSuccess }: ReceiveModalProps) {
  // Fetch preview
  const { data: preview, isLoading, error: previewError } = useASNReceivePreview(asnId)

  // Mutation
  const { mutate: executeReceive, isPending, error: submitError } = useASNReceive()

  // Form state
  const [warehouseId, setWarehouseId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [items, setItems] = useState<Map<string, ASNReceiveItem>>(new Map())
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ASNReceiveResult | null>(null)

  // Initialize items when preview loads
  useEffect(() => {
    if (preview?.items) {
      const initialItems = new Map<string, ASNReceiveItem>()
      preview.items.forEach((item) => {
        initialItems.set(item.id, {
          asn_item_id: item.id,
          received_qty: item.remaining_qty, // Pre-fill with remaining qty
          supplier_batch_number: item.supplier_batch_number || undefined,
          expiry_date: item.expiry_date || undefined,
        })
      })
      setItems(initialItems)
    }
  }, [preview])

  // Handle item change
  const handleItemChange = (itemId: string, value: ASNReceiveItem) => {
    setItems((prev) => {
      const newItems = new Map(prev)
      newItems.set(itemId, value)
      return newItems
    })
  }

  // Validate form
  const validate = () => {
    const errors: Record<string, string> = {}

    if (!warehouseId) {
      errors.warehouse = 'Warehouse is required'
    }

    if (!locationId) {
      errors.location = 'Location is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle submit
  const handleSubmit = () => {
    if (!validate()) return

    const itemsArray = Array.from(items.values())

    executeReceive(
      {
        asnId,
        data: {
          warehouse_id: warehouseId,
          location_id: locationId,
          items: itemsArray,
        },
      },
      {
        onSuccess: (data) => {
          setResult(data)
          onSuccess?.(data)
        },
      }
    )
  }

  // Handle close
  const handleClose = () => {
    setResult(null)
    setWarehouseId('')
    setLocationId('')
    setItems(new Map())
    setValidationErrors({})
    onClose()
  }

  // Handle receive more
  const handleReceiveMore = () => {
    setResult(null)
    // Re-fetch preview for updated remaining quantities
  }

  // Don't render if not open
  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive ASN</DialogTitle>
          <DialogDescription>
            {preview?.asn.asn_number && (
              <>
                ASN: <span>{preview.asn.asn_number}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {isLoading && (
          <div className="py-12" data-testid="receive-modal-skeleton">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading ASN details...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {previewError && (
          <Alert variant="destructive" data-testid="error-alert">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{previewError.message}</AlertDescription>
          </Alert>
        )}

        {/* Success Summary */}
        {result && (
          <ReceiveSummary result={result} onClose={handleClose} onReceiveMore={handleReceiveMore} />
        )}

        {/* Form */}
        {!isLoading && !previewError && preview && !result && (
          <div className="space-y-6">
            {/* ASN Header Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-md">
              <div>
                <div className="text-sm text-muted-foreground">Supplier</div>
                <div className="font-medium">{preview.asn.supplier_name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">PO Number</div>
                <div className="font-medium">{preview.asn.po_number}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Expected Date</div>
                <div className="font-medium">{preview.asn.expected_date}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-medium capitalize">{preview.asn.status}</div>
              </div>
            </div>

            {/* Submit Error */}
            {submitError && (
              <Alert variant="destructive" data-testid="error-alert">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError.message}</AlertDescription>
              </Alert>
            )}

            {/* Warehouse and Location Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="warehouse" className="text-sm font-medium mb-1.5 block">
                  Warehouse *
                </label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger id="warehouse" aria-label="warehouse">
                    <SelectValue placeholder="Select warehouse..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wh-001">Warehouse 1</SelectItem>
                    <SelectItem value="wh-002">Warehouse 2</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.warehouse && (
                  <div className="text-xs text-red-600 mt-1">{validationErrors.warehouse}</div>
                )}
              </div>

              <div>
                <label htmlFor="location" className="text-sm font-medium mb-1.5 block">
                  Location *
                </label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger id="location" aria-label="location">
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loc-001">Receiving Dock A</SelectItem>
                    <SelectItem value="loc-002">Receiving Dock B</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.location && (
                  <div className="text-xs text-red-600 mt-1">{validationErrors.location}</div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Already Received</TableHead>
                    <TableHead>Receive Now</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Reason / Notes</TableHead>
                    <TableHead>Supplier Batch / GTIN</TableHead>
                    <TableHead>Internal Batch</TableHead>
                    <TableHead>Expiry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.items.map((item) => {
                    const itemValue = items.get(item.id) || {
                      asn_item_id: item.id,
                      received_qty: item.remaining_qty,
                    }
                    return (
                      <ReceiveItemRow
                        key={item.id}
                        item={item}
                        value={itemValue}
                        onChange={(value) => handleItemChange(item.id, value)}
                      />
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="submit-spinner" />
                    Processing...
                  </>
                )}
                {!isPending && 'Confirm Receive'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
