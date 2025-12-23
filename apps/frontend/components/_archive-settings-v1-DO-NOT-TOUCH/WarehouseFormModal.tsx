/**
 * Warehouse Form Modal Component
 * Story: 1.5 Warehouse Configuration
 * Task 6: Warehouse Form Modal (AC-004.1, AC-004.5, AC-004.6)
 */

'use client'

import { useState, useEffect } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import type { Warehouse } from '@/lib/validation/warehouse-schemas'
import { createWarehouseSchema, updateWarehouseSchema } from '@/lib/validation/warehouse-schemas'
import { ZodError } from 'zod'
import { LocationFormModal } from './LocationFormModal'
import type { Location } from '@/lib/services/location-service'

interface WarehouseFormModalProps {
  warehouse?: Warehouse | null // undefined = create, Warehouse = edit
  onClose: () => void
  onSuccess: () => void
}

export function WarehouseFormModal({ warehouse, onClose, onSuccess }: WarehouseFormModalProps) {
  const [formData, setFormData] = useState({
    code: warehouse?.code || '',
    name: warehouse?.name || '',
    address: warehouse?.address || '',
    is_active: warehouse?.is_active ?? true,
    default_receiving_location_id: warehouse?.default_receiving_location_id || null,
    default_shipping_location_id: warehouse?.default_shipping_location_id || null,
    transit_location_id: warehouse?.transit_location_id || null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const { toast } = useToast()

  const isEditMode = !!warehouse

  // Fetch locations when in edit mode (AC-004.5)
  useEffect(() => {
    if (isEditMode && warehouse?.id) {
      fetchLocations()
    }
  }, [isEditMode, warehouse?.id])

  const fetchLocations = async () => {
    if (!warehouse?.id) return

    setLoadingLocations(true)
    try {
      const response = await fetch(`/api/settings/locations?warehouse_id=${warehouse.id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch locations')
      }

      const data = await response.json()
      setLocations(data.locations || [])
    } catch (error) {
      console.error('Error fetching locations:', error)
      toast({
        title: 'Warning',
        description: 'Failed to load locations',
        variant: 'destructive',
      })
    } finally {
      setLoadingLocations(false)
    }
  }

  // Handle input change
  const handleChange = (field: string, value: string | boolean | null) => {
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

  // Handle location creation success (AC-004.6)
  const handleLocationCreated = (locationId: string, locationCode: string, locationName: string) => {
    // Add new location to the list
    const newLocation: Location = {
      id: locationId,
      code: locationCode,
      name: locationName,
      org_id: '',
      warehouse_id: warehouse?.id || '',
      type: 'storage',
      zone: null,
      zone_enabled: false,
      capacity: null,
      capacity_enabled: false,
      barcode: '',
      is_active: true,
      created_by: null,
      updated_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setLocations((prev) => [...prev, newLocation])
    setShowLocationModal(false)

    // Note: User can manually select the location from the dropdown
    // We don't auto-select to avoid confusion about which field to populate
    toast({
      title: 'Location Created',
      description: `Location ${locationCode} has been created. You can now select it from the dropdown.`,
    })
  }

  // Validate form
  const validateForm = () => {
    try {
      const schema = isEditMode ? updateWarehouseSchema : createWarehouseSchema
      schema.parse(formData)
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
      // Prepare payload
      const payload: any = {
        code: formData.code.toUpperCase(), // AC-004.1: Uppercase
        name: formData.name,
        address: formData.address || undefined,
        is_active: formData.is_active,
      }

      // Include location IDs in edit mode (AC-004.5)
      if (isEditMode) {
        payload.default_receiving_location_id = formData.default_receiving_location_id || null
        payload.default_shipping_location_id = formData.default_shipping_location_id || null
        payload.transit_location_id = formData.transit_location_id || null
      }

      // Call API
      const url = isEditMode
        ? `/api/settings/warehouses/${warehouse.id}`
        : '/api/settings/warehouses'

      const method = isEditMode ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()

        // AC-004.1: Handle duplicate code error
        if (response.status === 409) {
          setErrors({ code: error.error || 'Warehouse code already exists' })
          return
        }

        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'create'} warehouse`)
      }

      toast({
        title: 'Success',
        description: `Warehouse ${isEditMode ? 'updated' : 'created'} successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} warehouse:`, error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} warehouse`,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">
            {isEditMode ? 'Edit Warehouse' : 'Create Warehouse'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Code Field (AC-004.1) */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="e.g., WH-01"
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && (
              <p className="text-sm text-red-500">{errors.code}</p>
            )}
            <p className="text-sm text-gray-500">
              Uppercase, numbers, and hyphens only
            </p>
          </div>

          {/* Name Field (AC-004.1) */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Main Warehouse"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Address Field (AC-004.1) */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Optional physical address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Active Status (AC-004.1, AC-004.5) */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked === true)}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Active
            </Label>
          </div>

          {/* Location Selects - Only in Edit Mode (AC-004.5, AC-004.6) */}
          {isEditMode && warehouse?.id && (
            <>
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Default Locations</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Configure default locations for warehouse operations
                </p>
              </div>

              {/* Default Receiving Location */}
              <div className="space-y-2">
                <Label htmlFor="default_receiving_location_id">
                  Default Receiving Location
                </Label>
                <Select
                  value={formData.default_receiving_location_id || 'none'}
                  onValueChange={(value) => {
                    if (value === 'create') {
                      setShowLocationModal(true)
                    } else {
                      handleChange('default_receiving_location_id', value === 'none' ? null : value)
                    }
                  }}
                  disabled={loadingLocations}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingLocations ? 'Loading...' : 'Select location'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-gray-500">None</span>
                    </SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.code} - {loc.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="create" className="text-blue-600 font-medium">
                      + Create Location
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Default Shipping Location */}
              <div className="space-y-2">
                <Label htmlFor="default_shipping_location_id">
                  Default Shipping Location
                </Label>
                <Select
                  value={formData.default_shipping_location_id || 'none'}
                  onValueChange={(value) => {
                    if (value === 'create') {
                      setShowLocationModal(true)
                    } else {
                      handleChange('default_shipping_location_id', value === 'none' ? null : value)
                    }
                  }}
                  disabled={loadingLocations}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingLocations ? 'Loading...' : 'Select location'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-gray-500">None</span>
                    </SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.code} - {loc.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="create" className="text-blue-600 font-medium">
                      + Create Location
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transit Location */}
              <div className="space-y-2">
                <Label htmlFor="transit_location_id">
                  Transit Location
                </Label>
                <Select
                  value={formData.transit_location_id || 'none'}
                  onValueChange={(value) => {
                    if (value === 'create') {
                      setShowLocationModal(true)
                    } else {
                      handleChange('transit_location_id', value === 'none' ? null : value)
                    }
                  }}
                  disabled={loadingLocations}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingLocations ? 'Loading...' : 'Select location'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-gray-500">None</span>
                    </SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.code} - {loc.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="create" className="text-blue-600 font-medium">
                      + Create Location
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Note about default locations (AC-004.2) */}
          {!isEditMode && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <strong>Note:</strong> Default locations (receiving, shipping, transit) can be set after creating locations for this warehouse.
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>

      {/* Location Creation Modal (AC-004.6) */}
      {showLocationModal && warehouse?.id && (
        <LocationFormModal
          warehouseId={warehouse.id}
          onClose={() => setShowLocationModal(false)}
          onSuccess={handleLocationCreated}
        />
      )}
    </div>
  )
}
