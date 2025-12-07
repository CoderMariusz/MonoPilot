/**
 * Receive Item Modal Component
 * Epic 5 Batch 5A-3 - Story 5.11: GRN with LP Creation
 * AC-5.11.5: Receive item with quantity and optional batch/expiry data
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Package } from 'lucide-react'

interface ReceiveItemModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  grnId: string
  grnItemId: string
  productCode: string
  productName: string
  expectedQty: number
  uom: string
  asnItemData?: {
    supplier_batch_number: string | null
    manufacture_date: string | null
    expiry_date: string | null
  } | null
}

export function ReceiveItemModal({
  open,
  onClose,
  onSuccess,
  grnId,
  grnItemId,
  productCode,
  productName,
  expectedQty,
  uom,
  asnItemData,
}: ReceiveItemModalProps) {
  const [formData, setFormData] = useState({
    received_qty: expectedQty.toString(),
    supplier_batch_number: '',
    manufacture_date: '',
    expiry_date: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [createdLP, setCreatedLP] = useState<string | null>(null)
  const { toast } = useToast()

  // Reset form when modal opens and pre-fill with ASN data
  useEffect(() => {
    if (open) {
      setFormData({
        received_qty: expectedQty.toString(),
        supplier_batch_number: asnItemData?.supplier_batch_number || '',
        manufacture_date: asnItemData?.manufacture_date || '',
        expiry_date: asnItemData?.expiry_date || '',
      })
      setErrors({})
      setCreatedLP(null)
    }
  }, [open, expectedQty, asnItemData])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    const receivedQty = parseFloat(formData.received_qty)
    if (!formData.received_qty || isNaN(receivedQty) || receivedQty <= 0) {
      newErrors.received_qty = 'Received quantity must be greater than 0'
    } else if (receivedQty > expectedQty) {
      newErrors.received_qty = `Cannot exceed expected quantity (${expectedQty})`
    }

    // Validate date formats if provided
    if (formData.manufacture_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.manufacture_date)) {
      newErrors.manufacture_date = 'Invalid date format (YYYY-MM-DD)'
    }

    if (formData.expiry_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.expiry_date)) {
      newErrors.expiry_date = 'Invalid date format (YYYY-MM-DD)'
    }

    // Validate expiry > manufacture
    if (formData.manufacture_date && formData.expiry_date) {
      if (new Date(formData.expiry_date) <= new Date(formData.manufacture_date)) {
        newErrors.expiry_date = 'Expiry date must be after manufacture date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        grn_item_id: grnItemId,
        received_qty: parseFloat(formData.received_qty),
        supplier_batch_number: formData.supplier_batch_number || null,
        manufacture_date: formData.manufacture_date || null,
        expiry_date: formData.expiry_date || null,
      }

      const response = await fetch(`/api/warehouse/grns/${grnId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to receive item')
      }

      setCreatedLP(data.lp_number)

      toast({
        title: 'Success',
        description: `Item received successfully. LP ${data.lp_number} created.`,
      })

      // Show success message for 2 seconds then close
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (error) {
      console.error('Error receiving item:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to receive item',
        variant: 'destructive',
      })
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        received_qty: '',
        supplier_batch_number: '',
        manufacture_date: '',
        expiry_date: '',
      })
      setErrors({})
      setCreatedLP(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receive Item</DialogTitle>
          <DialogDescription>
            Register received quantity and create license plate
          </DialogDescription>
        </DialogHeader>

        {createdLP ? (
          // Success view
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Item Received Successfully!</h3>
              <p className="text-muted-foreground mt-2">
                License Plate <span className="font-mono font-bold">{createdLP}</span> has been created
              </p>
            </div>
          </div>
        ) : (
          // Form view
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Product Code:</div>
                  <div className="font-medium">{productCode}</div>

                  <div className="text-muted-foreground">Product Name:</div>
                  <div>{productName}</div>

                  <div className="text-muted-foreground">Expected Quantity:</div>
                  <div className="font-medium">
                    {expectedQty.toFixed(3)} {uom}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Received Quantity */}
            <div className="space-y-2">
              <Label htmlFor="received_qty">
                Received Quantity * <span className="text-muted-foreground">({uom})</span>
              </Label>
              <Input
                id="received_qty"
                type="number"
                step="0.001"
                value={formData.received_qty}
                onChange={(e) => setFormData({ ...formData, received_qty: e.target.value })}
                placeholder={`Max: ${expectedQty}`}
                className={errors.received_qty ? 'border-red-500' : ''}
              />
              {errors.received_qty && (
                <p className="text-sm text-red-500">{errors.received_qty}</p>
              )}
            </div>

            {/* Optional Fields Section */}
            <div className="pt-2">
              <h4 className="text-sm font-medium mb-3">
                Batch & Expiry Information (Optional)
              </h4>

              {/* Supplier Batch Number */}
              <div className="space-y-2 mb-3">
                <Label htmlFor="supplier_batch_number">Supplier Batch Number</Label>
                <Input
                  id="supplier_batch_number"
                  value={formData.supplier_batch_number}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier_batch_number: e.target.value })
                  }
                  placeholder="Enter batch number..."
                />
              </div>

              {/* Manufacture Date */}
              <div className="space-y-2 mb-3">
                <Label htmlFor="manufacture_date">Manufacture Date</Label>
                <Input
                  id="manufacture_date"
                  type="date"
                  value={formData.manufacture_date}
                  onChange={(e) => setFormData({ ...formData, manufacture_date: e.target.value })}
                  className={errors.manufacture_date ? 'border-red-500' : ''}
                />
                {errors.manufacture_date && (
                  <p className="text-sm text-red-500">{errors.manufacture_date}</p>
                )}
              </div>

              {/* Expiry Date */}
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className={errors.expiry_date ? 'border-red-500' : ''}
                />
                {errors.expiry_date && (
                  <p className="text-sm text-red-500">{errors.expiry_date}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Receiving...' : 'Receive Item'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
