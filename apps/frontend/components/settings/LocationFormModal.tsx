/**
 * Location Form Modal Component
 * Story: 1.6 Location Management
 *
 * Placeholder component for inline location creation from warehouse form
 * This will be fully implemented when location UI components are built
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LocationFormModalProps {
  warehouseId: string
  onClose: () => void
  onSuccess: (locationId: string, locationCode: string, locationName: string) => void
}

export function LocationFormModal({ warehouseId, onClose, onSuccess }: LocationFormModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'storage' as const,
  })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code || !formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Code and name are required',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/settings/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouse_id: warehouseId,
          code: formData.code.toUpperCase(),
          name: formData.name,
          type: formData.type,
          zone_enabled: false,
          capacity_enabled: false,
          is_active: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create location')
      }

      const result = await response.json()

      toast({
        title: 'Success',
        description: 'Location created successfully',
      })

      // API returns { location: {...}, message: '...' }
      const location = result.location || result
      onSuccess(location.id, location.code, location.name)
    } catch (error) {
      console.error('Error creating location:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create location',
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
          <h2 className="text-xl font-semibold">Create Location</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Code Field */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="e.g., LOC-A01"
            />
            <p className="text-sm text-gray-500">
              Uppercase, numbers, and hyphens only
            </p>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Receiving Area"
            />
          </div>

          {/* Type Field */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receiving">Receiving</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
                <SelectItem value="transit">Transit</SelectItem>
                <SelectItem value="quarantine">Quarantine</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  )
}
