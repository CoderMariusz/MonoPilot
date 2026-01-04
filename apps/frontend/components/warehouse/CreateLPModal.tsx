/**
 * Create LP Modal Component
 * Story 05.1: License Plates UI
 */

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-new'
import { useCreateLP, useGenerateLPNumber } from '@/lib/hooks/use-license-plates'
import type { CreateLPInput } from '@/lib/types/license-plate'
import type { Warehouse } from '@/lib/types/warehouse'
import type { Product } from '@/lib/types/product'
import { useToast } from '@/hooks/use-toast'

interface CreateLPModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouses: Warehouse[]
  products: Product[]
  onSuccess?: () => void
}

export function CreateLPModal({ open, onOpenChange, warehouses, products, onSuccess }: CreateLPModalProps) {
  const { toast } = useToast()
  const createLP = useCreateLP()
  const generateNumber = useGenerateLPNumber()

  const [formData, setFormData] = useState<Partial<CreateLPInput>>({
    source: 'manual',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product_id || !formData.quantity || !formData.uom || !formData.warehouse_id || !formData.location_id) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      await createLP.mutateAsync(formData as CreateLPInput)
      toast({
        title: 'Success',
        description: 'License Plate created successfully',
      })
      onOpenChange(false)
      setFormData({ source: 'manual' })
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create license plate',
        variant: 'destructive',
      })
    }
  }

  const handleGenerateNumber = async () => {
    try {
      const result = await generateNumber.mutateAsync()
      setFormData((prev) => ({ ...prev, lp_number: result.lp_number }))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate LP number',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="create-lp-modal">
        <DialogHeader>
          <DialogTitle>Create License Plate</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* LP Number */}
          <div>
            <Label>LP Number (Optional - auto-generated if blank)</Label>
            <div className="flex gap-2">
              <Input
                value={formData.lp_number || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, lp_number: e.target.value }))}
                placeholder="LP00000001"
              />
              <Button type="button" variant="outline" onClick={handleGenerateNumber}>
                Generate
              </Button>
            </div>
          </div>

          {/* Product */}
          <div>
            <Label>Product *</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, product_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity & UoM */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantity *</Label>
              <Input
                type="number"
                value={formData.quantity || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                placeholder="100"
                step="0.0001"
              />
            </div>
            <div>
              <Label>UoM *</Label>
              <Input
                value={formData.uom || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, uom: e.target.value }))}
                placeholder="KG"
              />
            </div>
          </div>

          {/* Warehouse */}
          <div>
            <Label>Warehouse *</Label>
            <Select
              value={formData.warehouse_id}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, warehouse_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse..." />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location (simplified - would need location picker in real implementation) */}
          <div>
            <Label>Location *</Label>
            <Input
              value={formData.location_id || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, location_id: e.target.value }))}
              placeholder="Location ID"
            />
          </div>

          {/* Batch & Expiry */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Batch Number</Label>
              <Input
                value={formData.batch_number || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, batch_number: e.target.value }))}
                placeholder="BATCH-001"
              />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiry_date || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLP.isPending}>
              {createLP.isPending ? 'Creating...' : 'Create License Plate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
