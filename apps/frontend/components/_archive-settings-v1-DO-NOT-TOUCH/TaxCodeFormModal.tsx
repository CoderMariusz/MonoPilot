/**
 * Tax Code Form Modal Component
 * Story: 1.10 Tax Code Configuration
 * Task: BATCH 2 - Form Modal
 * AC-009.2: Add custom tax codes with validation
 * AC-009.5: Edit tax codes
 */

'use client'

import { useState } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import type { TaxCode } from '@/lib/validation/tax-code-schemas'
import { createTaxCodeSchema, updateTaxCodeSchema } from '@/lib/validation/tax-code-schemas'
import { ZodError } from 'zod'

interface TaxCodeFormModalProps {
  taxCode?: TaxCode | null // undefined = create, TaxCode = edit
  onClose: () => void
  onSuccess: () => void
}

export function TaxCodeFormModal({ taxCode, onClose, onSuccess }: TaxCodeFormModalProps) {
  const [formData, setFormData] = useState({
    code: taxCode?.code || '',
    description: taxCode?.description || '',
    rate: taxCode?.rate?.toString() || '', // AC-009.2: rate as string for input
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const isEditMode = !!taxCode

  // Handle input change
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = () => {
    try {
      const schema = isEditMode ? updateTaxCodeSchema : createTaxCodeSchema

      // Prepare data for validation
      const dataToValidate: any = {
        code: formData.code,
        description: formData.description,
        rate: parseFloat(formData.rate), // AC-009.2: Convert to number
      }

      schema.parse(dataToValidate)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const field = err.path[0] as string
          fieldErrors[field] = err.message
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
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    try {
      // Prepare payload (AC-009.2, AC-009.5)
      const payload: any = {
        code: formData.code.toUpperCase(), // AC-009.2: Uppercase
        description: formData.description,
        rate: parseFloat(formData.rate),
      }

      // Call API
      const url = isEditMode
        ? `/api/settings/tax-codes/${taxCode.id}`
        : '/api/settings/tax-codes'

      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          // AC-009.2: Duplicate code error
          toast({
            title: 'Duplicate Code',
            description: data.error || `Tax code "${formData.code}" already exists`,
            variant: 'destructive',
          })
          setErrors({ code: 'This code is already in use' })
          return
        }

        throw new Error(data.error || 'Failed to save tax code')
      }

      toast({
        title: 'Success',
        description: `Tax code "${formData.code}" ${isEditMode ? 'updated' : 'created'} successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error('Error saving tax code:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save tax code',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Tax Code' : 'Add Tax Code'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the tax code details below.'
              : 'Add a custom tax code to your organization.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* AC-009.2: Code field */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Tax Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="e.g., VAT-23, GST-5"
              className={errors.code ? 'border-destructive' : ''}
              maxLength={50}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Uppercase letters, numbers, and hyphens only. Will be auto-converted to uppercase.
            </p>
          </div>

          {/* AC-009.2: Description field */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="e.g., Standard VAT 23%, GST 5%"
              className={errors.description ? 'border-destructive' : ''}
              maxLength={200}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum 200 characters
            </p>
          </div>

          {/* AC-009.2: Rate field */}
          <div className="space-y-2">
            <Label htmlFor="rate">
              Rate (%) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.rate}
              onChange={(e) => handleChange('rate', e.target.value)}
              placeholder="e.g., 23.00, 5.00, 0.00"
              className={errors.rate ? 'border-destructive' : ''}
            />
            {errors.rate && (
              <p className="text-sm text-destructive">{errors.rate}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter tax rate as a percentage (0-100). Example: 23.00 for 23% VAT
            </p>
          </div>

          {/* Info banner for seeded tax codes */}
          {!isEditMode && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> Common tax codes (PL VAT, UK VAT) are preloaded.
                Add custom codes as needed for your organization.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Tax Code'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
