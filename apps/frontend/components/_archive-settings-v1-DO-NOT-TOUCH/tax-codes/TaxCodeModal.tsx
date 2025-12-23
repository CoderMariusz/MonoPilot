/**
 * TaxCodeModal Component
 * Story: 01.13 - Tax Codes CRUD
 *
 * Create/Edit tax code modal with form validation
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { COUNTRY_OPTIONS } from '@/lib/types/tax-code'
import type { TaxCode, CreateTaxCodeInput, UpdateTaxCodeInput } from '@/lib/types/tax-code'

interface TaxCodeModalProps {
  mode: 'create' | 'edit'
  taxCode?: TaxCode
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateTaxCodeInput | UpdateTaxCodeInput) => void
  isSubmitting?: boolean
}

export function TaxCodeModal({
  mode,
  taxCode,
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
}: TaxCodeModalProps) {
  const isEdit = mode === 'edit'

  const [formData, setFormData] = useState({
    code: taxCode?.code || '',
    name: taxCode?.name || '',
    rate: taxCode?.rate?.toString() || '',
    country_code: taxCode?.country_code || 'PL',
    valid_from: taxCode?.valid_from || new Date().toISOString().split('T')[0],
    valid_to: taxCode?.valid_to || '',
    is_default: taxCode?.is_default || false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes or taxCode changes
  useEffect(() => {
    if (open) {
      setFormData({
        code: taxCode?.code || '',
        name: taxCode?.name || '',
        rate: taxCode?.rate?.toString() || '',
        country_code: taxCode?.country_code || 'PL',
        valid_from: taxCode?.valid_from || new Date().toISOString().split('T')[0],
        valid_to: taxCode?.valid_to || '',
        is_default: taxCode?.is_default || false,
      })
      setErrors({})
    }
  }, [open, taxCode])

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Code validation
    if (!formData.code.trim()) {
      newErrors.code = 'Code is required'
    } else if (!/^[A-Z0-9-]{2,20}$/.test(formData.code.toUpperCase())) {
      newErrors.code = 'Code must be 2-20 uppercase alphanumeric characters'
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      newErrors.name = 'Name must be 2-100 characters'
    }

    // Rate validation
    const rate = parseFloat(formData.rate)
    if (isNaN(rate)) {
      newErrors.rate = 'Rate is required'
    } else if (rate < 0 || rate > 100) {
      newErrors.rate = 'Rate must be between 0 and 100'
    }

    // Country validation
    if (!formData.country_code) {
      newErrors.country_code = 'Country is required'
    }

    // Date validation
    if (!formData.valid_from) {
      newErrors.valid_from = 'Valid from date is required'
    }

    if (formData.valid_to && formData.valid_from && formData.valid_to <= formData.valid_from) {
      newErrors.valid_to = 'Valid to must be after valid from'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const submitData: CreateTaxCodeInput = {
      code: formData.code.toUpperCase(),
      name: formData.name,
      rate: parseFloat(formData.rate),
      country_code: formData.country_code.toUpperCase(),
      valid_from: formData.valid_from,
      valid_to: formData.valid_to || null,
      is_default: formData.is_default,
    }

    onSubmit(submitData)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Tax Code' : 'Create Tax Code'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update tax code details. Code and country cannot be changed if referenced.'
              : 'Add a new tax code with validity period.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="VAT23"
                  disabled={isEdit} // Read-only in edit mode
                  className={errors.code ? 'border-destructive' : ''}
                  maxLength={20}
                />
                {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country_code">
                  Jurisdiction <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.country_code}
                  onValueChange={(value) => setFormData({ ...formData, country_code: value })}
                  disabled={isEdit} // Read-only in edit mode
                >
                  <SelectTrigger id="country_code" className={errors.country_code ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.code} - {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country_code && <p className="text-xs text-destructive">{errors.country_code}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VAT 23%"
                className={errors.name ? 'border-destructive' : ''}
                maxLength={100}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
          </div>

          {/* Rate Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Tax Rate</h3>

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
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="23.00"
                className={errors.rate ? 'border-destructive' : ''}
              />
              {errors.rate && <p className="text-xs text-destructive">{errors.rate}</p>}
              <p className="text-xs text-muted-foreground">Enter percentage value (0-100). Example: 23.00</p>
            </div>
          </div>

          {/* Validity Period Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Validity Period</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">
                  Valid From <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className={errors.valid_from ? 'border-destructive' : ''}
                />
                {errors.valid_from && <p className="text-xs text-destructive">{errors.valid_from}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_to">Valid To</Label>
                <Input
                  id="valid_to"
                  type="date"
                  value={formData.valid_to}
                  onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                  className={errors.valid_to ? 'border-destructive' : ''}
                />
                {errors.valid_to && <p className="text-xs text-destructive">{errors.valid_to}</p>}
                <p className="text-xs text-muted-foreground">Leave empty for no expiry</p>
              </div>
            </div>
          </div>

          {/* Options Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Options</h3>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked as boolean })}
              />
              <Label htmlFor="is_default" className="cursor-pointer">
                Set as default tax code
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
