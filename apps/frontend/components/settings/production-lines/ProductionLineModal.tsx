/**
 * Production Line Modal Component
 * Story: 01.11 - Production Lines CRUD
 * Purpose: Create/Edit modal with machine assignment and product compatibility
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { MachineSequenceEditor } from './MachineSequenceEditor'
import { ProductCompatibilityEditor } from './ProductCompatibilityEditor'
import { ProductionLineStatusBadge } from './ProductionLineStatusBadge'
import type {
  ProductionLine,
  ProductionLineStatus,
  LineMachine,
  Product,
} from '@/lib/types/production-line'
import type { MachineStatus } from '@/lib/types/machine'
import { productionLineCreateSchema } from '@/lib/validation/production-line-schemas'
import { PRODUCTION_LINE_STATUS_LABELS } from '@/lib/types/production-line'

interface ProductionLineModalProps {
  mode: 'create' | 'edit'
  productionLine: ProductionLine | null
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  availableMachines: Array<{
    id: string
    code: string
    name: string
    status: MachineStatus
    units_per_hour: number | null
  }>
  availableProducts: Product[]
}

interface FormData {
  code: string
  name: string
  description: string
  status: ProductionLineStatus
}

const PRODUCTION_LINE_STATUSES: ProductionLineStatus[] = ['active', 'maintenance', 'inactive', 'setup']

export function ProductionLineModal({
  mode,
  productionLine,
  open,
  onClose,
  onSubmit,
  availableMachines,
  availableProducts,
}: ProductionLineModalProps) {
  const [formData, setFormData] = useState<FormData>({
    code: productionLine?.code || '',
    name: productionLine?.name || '',
    description: productionLine?.description || '',
    status: productionLine?.status || 'active',
  })
  const [machines, setMachines] = useState<LineMachine[]>(productionLine?.machines || [])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    productionLine?.compatible_products?.map((p) => p.id) || []
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [codeValidating, setCodeValidating] = useState(false)
  const [codeAvailable, setCodeAvailable] = useState<boolean | null>(null)
  const [codeCheckTimer, setCodeCheckTimer] = useState<NodeJS.Timeout | null>(null)

  const isEditMode = mode === 'edit'

  // Reset form when production line changes
  useEffect(() => {
    if (productionLine) {
      setFormData({
        code: productionLine.code || '',
        name: productionLine.name || '',
        description: productionLine.description || '',
        status: productionLine.status || 'active',
      })
      setMachines(productionLine.machines || [])
      setSelectedProductIds(productionLine.compatible_products?.map((p) => p.id) || [])
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        status: 'active',
      })
      setMachines([])
      setSelectedProductIds([])
    }
    console.log('[ProductionLineModal] Props data:', {
      machinesCount: availableMachines?.length,
      mode,
      hasProductionLine: !!productionLine
    })
    setErrors({})
    setCodeAvailable(null)
    setCodeValidating(false)
  }, [productionLine, open])

  // Handle input change
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Real-time code validation (debounced 300ms)
    if (field === 'code' && !isEditMode) {
      setCodeAvailable(null)

      // Clear previous timer
      if (codeCheckTimer) {
        clearTimeout(codeCheckTimer)
      }

      // Don't validate empty or short codes
      if (value.length < 2) {
        return
      }

      // Set new timer
      const timer = setTimeout(async () => {
        setCodeValidating(true)
        try {
          const response = await fetch(
            `/api/v1/settings/production-lines/validate-code?code=${encodeURIComponent(value.toUpperCase())}`
          )
          const data = await response.json()

          if (response.ok) {
            setCodeAvailable(data.valid)
          }
        } catch (error) {
          console.error('Code validation error:', error)
        } finally {
          setCodeValidating(false)
        }
      }, 300)

      setCodeCheckTimer(timer)
    }
  }

  // Auto-uppercase code on blur
  const handleCodeBlur = () => {
    if (formData.code) {
      setFormData((prev) => ({ ...prev, code: prev.code.toUpperCase() }))
    }
  }

  // Validate form
  const validateForm = () => {
    try {
      productionLineCreateSchema.parse({
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
        machine_ids: machines.map((m) => m.id),
        product_ids: selectedProductIds,
      })
      setErrors({})
      return true
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          const field = err.path[0] as string
          if (!fieldErrors[field]) {
            fieldErrors[field] = err.message
          }
        })
        setErrors(fieldErrors)
      }
      return false
    }
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      return
    }

    // Check code availability for create mode
    if (!isEditMode && codeAvailable === false) {
      setErrors({ code: 'Code already exists' })
      return
    }

    try {
      setSubmitting(true)

      // Prepare payload
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
        machine_ids: machines.map((m) => m.id),
        product_ids: selectedProductIds,
      }

      await onSubmit(payload)
      onClose()
    } catch (error: any) {
      // Handle duplicate code error (409)
      if (error.message?.includes('already exists')) {
        setErrors({ code: 'Code already exists' })
      } else {
        console.error('Error saving production line:', error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" aria-modal="true">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Production Line' : 'Create Production Line'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the production line details below.'
              : 'Add a new production line to your organization.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="machines">Machine Sequence</TabsTrigger>
              <TabsTrigger value="products">Product Compatibility</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Code field */}
              <div className="space-y-2">
                <Label htmlFor="code">
                  Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  onBlur={handleCodeBlur}
                  placeholder="LINE-A"
                  disabled={isEditMode}
                  className={errors.code ? 'border-destructive' : ''}
                  maxLength={50}
                />
                {isEditMode && (
                  <p className="text-sm text-muted-foreground">
                    Code cannot be changed in edit mode
                  </p>
                )}
                {!isEditMode && codeValidating && (
                  <p className="text-sm text-muted-foreground">Checking availability...</p>
                )}
                {!isEditMode && codeAvailable === true && (
                  <p className="text-sm text-green-600">Code available</p>
                )}
                {!isEditMode && codeAvailable === false && (
                  <p className="text-sm text-destructive">Code already exists</p>
                )}
                {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
              </div>

              {/* Name field */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Bread Production Line A"
                  className={errors.name ? 'border-destructive' : ''}
                  maxLength={100}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              {/* Description field */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Primary line for bread production..."
                  className={errors.description ? 'border-destructive' : ''}
                  rows={3}
                  maxLength={500}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>

              {/* Status field */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value as ProductionLineStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTION_LINE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <ProductionLineStatusBadge status={status} />
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Machine Sequence Tab */}
            <TabsContent value="machines" className="mt-4">
              <MachineSequenceEditor
                machines={machines}
                availableMachines={availableMachines}
                onChange={setMachines}
              />
            </TabsContent>

            {/* Product Compatibility Tab */}
            <TabsContent value="products" className="mt-4">
              <ProductCompatibilityEditor
                availableProducts={availableProducts}
                selectedProductIds={selectedProductIds}
                onChange={setSelectedProductIds}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Line'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
