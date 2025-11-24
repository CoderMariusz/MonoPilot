/**
 * Supplier Form Modal Component
 * Story 3.17: Supplier Management
 * AC-3.17.2: Create/Edit Supplier with validation
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useToast } from '@/hooks/use-toast'

interface TaxCode {
  id: string
  code: string
  description: string
  rate: number
}

interface Supplier {
  id: string
  code: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  currency: string
  tax_code_id: string
  payment_terms: string
  lead_time_days: number
  moq: number | null
  is_active: boolean
}

interface SupplierFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  supplier?: Supplier | null
}

export function SupplierFormModal({
  open,
  onClose,
  onSuccess,
  supplier,
}: SupplierFormModalProps) {
  const [formData, setFormData] = useState({
    code: supplier?.code || '',
    name: supplier?.name || '',
    contact_person: supplier?.contact_person || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    city: supplier?.city || '',
    postal_code: supplier?.postal_code || '',
    country: supplier?.country || '',
    currency: supplier?.currency || 'PLN',
    tax_code_id: supplier?.tax_code_id || '',
    payment_terms: supplier?.payment_terms || '',
    lead_time_days: supplier?.lead_time_days?.toString() || '7',
    moq: supplier?.moq?.toString() || '',
    is_active: supplier?.is_active ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([])
  const [loadingTaxCodes, setLoadingTaxCodes] = useState(true)
  const { toast } = useToast()

  const isEditMode = !!supplier

  // Fetch tax codes
  useEffect(() => {
    const fetchTaxCodes = async () => {
      try {
        setLoadingTaxCodes(true)
        const response = await fetch('/api/settings/tax-codes')

        if (!response.ok) {
          throw new Error('Failed to fetch tax codes')
        }

        const data = await response.json()
        setTaxCodes(data.tax_codes || [])
      } catch (error) {
        console.error('Error fetching tax codes:', error)
        toast({
          title: 'Warning',
          description: 'Failed to load tax codes.',
          variant: 'destructive',
        })
        setTaxCodes([])
      } finally {
        setLoadingTaxCodes(false)
      }
    }

    if (open) {
      fetchTaxCodes()
    }
  }, [open])

  // Handle input change
  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
    const newErrors: Record<string, string> = {}

    // Code validation
    if (!formData.code) {
      newErrors.code = 'Code is required'
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Code must be uppercase letters, numbers, and hyphens only'
    }

    // Name validation
    if (!formData.name) {
      newErrors.name = 'Name is required'
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    // Country validation
    if (formData.country && formData.country.length !== 2) {
      newErrors.country = 'Country must be 2-letter ISO code (e.g., PL, US)'
    }

    // Currency validation
    if (!formData.currency) {
      newErrors.currency = 'Currency is required'
    }

    // Tax code validation
    if (!formData.tax_code_id) {
      newErrors.tax_code_id = 'Tax code is required'
    }

    // Payment terms validation
    if (!formData.payment_terms) {
      newErrors.payment_terms = 'Payment terms are required'
    }

    // Lead time validation
    const leadTime = parseInt(formData.lead_time_days, 10)
    if (isNaN(leadTime) || leadTime < 0) {
      newErrors.lead_time_days = 'Lead time must be 0 or greater'
    }

    // MOQ validation
    if (formData.moq) {
      const moq = parseFloat(formData.moq)
      if (isNaN(moq) || moq <= 0) {
        newErrors.moq = 'MOQ must be greater than 0'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const url = isEditMode
        ? `/api/planning/suppliers/${supplier.id}`
        : '/api/planning/suppliers'

      const method = isEditMode ? 'PUT' : 'POST'

      const payload: any = {
        name: formData.name,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        postal_code: formData.postal_code || null,
        country: formData.country || null,
        currency: formData.currency,
        tax_code_id: formData.tax_code_id,
        payment_terms: formData.payment_terms,
        lead_time_days: parseInt(formData.lead_time_days, 10),
        moq: formData.moq ? parseFloat(formData.moq) : null,
        is_active: formData.is_active,
      }

      // Only include code when creating
      if (!isEditMode) {
        payload.code = formData.code
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'create'} supplier`)
      }

      toast({
        title: 'Success',
        description: `Supplier ${isEditMode ? 'updated' : 'created'} successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error('Error submitting supplier:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit supplier',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update supplier details' : 'Create a new supplier'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Code */}
              <div className="space-y-2">
                <Label htmlFor="code">
                  Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  placeholder="SUP-001"
                  disabled={isEditMode}
                />
                {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Supplier Name"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Contact Information</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Contact Person */}
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => handleChange('contact_person', e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contact@supplier.com"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+48 123 456 789"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Address Information</h3>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Street address..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Warsaw"
                />
              </div>

              {/* Postal Code */}
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  placeholder="00-001"
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">Country (ISO 2)</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value.toUpperCase())}
                  placeholder="PL"
                  maxLength={2}
                />
                {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Financial Information</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency">
                  Currency <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.currency} onValueChange={(value) => handleChange('currency', value)}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLN">PLN</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currency && <p className="text-sm text-red-500">{errors.currency}</p>}
              </div>

              {/* Tax Code */}
              <div className="space-y-2">
                <Label htmlFor="tax_code_id">
                  Tax Code <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.tax_code_id}
                  onValueChange={(value) => handleChange('tax_code_id', value)}
                  disabled={loadingTaxCodes}
                >
                  <SelectTrigger id="tax_code_id">
                    <SelectValue placeholder={loadingTaxCodes ? 'Loading...' : 'Select tax code'} />
                  </SelectTrigger>
                  <SelectContent>
                    {taxCodes.map((taxCode) => (
                      <SelectItem key={taxCode.id} value={taxCode.id}>
                        {taxCode.code} - {taxCode.description} ({taxCode.rate}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tax_code_id && <p className="text-sm text-red-500">{errors.tax_code_id}</p>}
              </div>

              {/* Payment Terms */}
              <div className="space-y-2">
                <Label htmlFor="payment_terms">
                  Payment Terms <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="payment_terms"
                  value={formData.payment_terms}
                  onChange={(e) => handleChange('payment_terms', e.target.value)}
                  placeholder="Net 30"
                />
                {errors.payment_terms && (
                  <p className="text-sm text-red-500">{errors.payment_terms}</p>
                )}
              </div>
            </div>
          </div>

          {/* Operational Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Operational Information</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Lead Time Days */}
              <div className="space-y-2">
                <Label htmlFor="lead_time_days">
                  Lead Time (days) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lead_time_days"
                  type="number"
                  min="0"
                  value={formData.lead_time_days}
                  onChange={(e) => handleChange('lead_time_days', e.target.value)}
                />
                {errors.lead_time_days && (
                  <p className="text-sm text-red-500">{errors.lead_time_days}</p>
                )}
              </div>

              {/* MOQ */}
              <div className="space-y-2">
                <Label htmlFor="moq">Minimum Order Quantity (MOQ)</Label>
                <Input
                  id="moq"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.moq}
                  onChange={(e) => handleChange('moq', e.target.value)}
                  placeholder="Optional"
                />
                {errors.moq && <p className="text-sm text-red-500">{errors.moq}</p>}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked as boolean)}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Active
            </Label>
          </div>

          {/* Footer Actions */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
