/**
 * Location Form Component
 * Story: 1.6 Location Management
 * Task 7: Frontend Location Form Modal (AC-005.1, AC-005.2, AC-005.3)
 *
 * Modal form for creating and editing locations with zone/capacity toggles
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import {
  createLocationSchema,
  updateLocationSchema,
  LocationTypeEnum,
  type CreateLocationInput,
  type UpdateLocationInput,
} from '@/lib/validation/location-schemas'

interface Warehouse {
  id: string
  code: string
  name: string
}

interface Location {
  id: string
  warehouse_id: string
  code: string
  name: string
  type: string
  zone: string | null
  zone_enabled: boolean
  capacity: number | null
  capacity_enabled: boolean
  barcode: string
  is_active: boolean
}

interface LocationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  location?: Location // If provided, edit mode
}

export function LocationForm({
  open,
  onOpenChange,
  onSuccess,
  location,
}: LocationFormProps) {
  const [loading, setLoading] = useState(false)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loadingWarehouses, setLoadingWarehouses] = useState(false)
  const { toast } = useToast()

  const isEditMode = !!location

  const form = useForm<CreateLocationInput>({
    resolver: zodResolver(isEditMode ? updateLocationSchema : createLocationSchema),
    defaultValues: {
      warehouse_id: location?.warehouse_id || '',
      code: location?.code || '',
      name: location?.name || '',
      type: (location?.type as any) || 'storage',
      zone: location?.zone || '',
      zone_enabled: location?.zone_enabled || false,
      capacity: location?.capacity || undefined,
      capacity_enabled: location?.capacity_enabled || false,
      barcode: location?.barcode || '',
      is_active: location?.is_active ?? true,
    },
  })

  // Watch zone/capacity toggles to show/hide fields
  const zoneEnabled = form.watch('zone_enabled')
  const capacityEnabled = form.watch('capacity_enabled')

  // Fetch warehouses for dropdown
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setLoadingWarehouses(true)
        const response = await fetch('/api/settings/warehouses')

        if (!response.ok) {
          throw new Error('Failed to fetch warehouses')
        }

        const data = await response.json()
        setWarehouses(data.warehouses || [])
      } catch (error) {
        console.error('Error fetching warehouses:', error)
        toast({
          title: 'Error',
          description: 'Failed to load warehouses',
          variant: 'destructive',
        })
      } finally {
        setLoadingWarehouses(false)
      }
    }

    if (open) {
      fetchWarehouses()
    }
  }, [open, toast])

  // Reset form when location changes or dialog opens
  useEffect(() => {
    if (location) {
      form.reset({
        warehouse_id: location.warehouse_id,
        code: location.code,
        name: location.name,
        type: location.type as any,
        zone: location.zone || '',
        zone_enabled: location.zone_enabled,
        capacity: location.capacity || undefined,
        capacity_enabled: location.capacity_enabled,
        barcode: location.barcode,
        is_active: location.is_active,
      })
    } else {
      form.reset({
        warehouse_id: '',
        code: '',
        name: '',
        type: 'storage',
        zone: '',
        zone_enabled: false,
        capacity: undefined,
        capacity_enabled: false,
        barcode: '',
        is_active: true,
      })
    }
  }, [location, form])

  const onSubmit = async (data: CreateLocationInput | UpdateLocationInput) => {
    try {
      setLoading(true)

      const url = isEditMode
        ? `/api/settings/locations/${location.id}`
        : '/api/settings/locations'
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'create'} location`)
      }

      const result = await response.json()

      toast({
        title: 'Success',
        description: isEditMode
          ? `Location ${data.name} updated successfully`
          : `Location ${data.name} created successfully`,
      })

      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error submitting location:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : `Failed to ${isEditMode ? 'update' : 'create'} location`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Location' : 'Add New Location'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update location details. Barcode will be regenerated if changed.'
              : 'Create a new location. Barcode will be auto-generated if not provided.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Warehouse Selection (AC-005.1) */}
            <FormField
              control={form.control}
              name="warehouse_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loading || loadingWarehouses || isEditMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a warehouse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {isEditMode && (
                    <FormDescription className="text-xs">
                      Cannot change warehouse after creation
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />

            {/* Code and Name (AC-005.1) */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="LOC-A01"
                        {...field}
                        disabled={loading}
                        className="uppercase"
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                    <FormDescription className="text-xs">
                      Uppercase, numbers, hyphens
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Receiving Area 1"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location Type (AC-005.1) */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LocationTypeEnum.options.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Zone Toggle and Field (AC-005.2) */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="zone_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Zone Tracking</FormLabel>
                      <FormDescription>
                        Track specific zone/area within this location
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {zoneEnabled && (
                <FormField
                  control={form.control}
                  name="zone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Zone A, Freezer-1, etc."
                          {...field}
                          value={field.value || ''}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Capacity Toggle and Field (AC-005.2) */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="capacity_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Capacity Tracking</FormLabel>
                      <FormDescription>
                        Set maximum storage capacity for this location
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {capacityEnabled && (
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="100.00"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription className="text-xs">
                        Maximum storage capacity (units/pallets/m³)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Barcode (optional override) (AC-005.3) */}
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barcode (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Auto-generated if empty"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription className="text-xs">
                    Leave empty for auto-generation (LOC-{'{warehouse}'}-{'{seq}'}). Must be globally unique if provided.
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Active Status (AC-005.5) */}
            {isEditMode && (
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Inactive locations are hidden from lists
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || loadingWarehouses}>
                {loading
                  ? isEditMode
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditMode
                    ? 'Update Location'
                    : 'Create Location'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
