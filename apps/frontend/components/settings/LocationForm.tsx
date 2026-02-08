/**
 * Location Form Component
 * Story: 01.9 - Warehouse Locations Management (Hierarchical)
 * Updated for hierarchical schema: zone > aisle > rack > bin
 *
 * Modal form for creating and editing hierarchical locations
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

// Hierarchical location levels
const LOCATION_LEVELS = ['zone', 'aisle', 'rack', 'bin'] as const
type LocationLevel = typeof LOCATION_LEVELS[number]

// Location storage types
const LOCATION_TYPES = ['bulk', 'pallet', 'shelf', 'floor', 'staging'] as const
type LocationType = typeof LOCATION_TYPES[number]

// Form values interface for hierarchical locations
interface LocationFormValues {
  warehouse_id: string
  code: string
  name: string
  description: string
  level: LocationLevel
  location_type: LocationType
  parent_id: string | null
  max_pallets: number | null
  max_weight_kg: number | null
  is_active: boolean
}

interface Warehouse {
  id: string
  code: string
  name: string
}

interface ParentLocation {
  id: string
  code: string
  name: string
  level: LocationLevel
  full_path: string | null
}

// Hierarchical Location interface matching database schema
interface Location {
  id: string
  warehouse_id: string
  code: string
  name: string
  description?: string | null
  level: string
  location_type: string
  full_path: string | null
  depth: number
  parent_id: string | null
  max_pallets: number | null
  max_weight_kg: number | null
  current_pallets: number
  is_active: boolean
  warehouse?: {
    id: string
    code: string
    name: string
  }
}

interface LocationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  location?: Location // If provided, edit mode
}

// Get allowed parent levels based on child level
function getAllowedParentLevel(level: LocationLevel): LocationLevel | null {
  switch (level) {
    case 'zone': return null // zones have no parent
    case 'aisle': return 'zone'
    case 'rack': return 'aisle'
    case 'bin': return 'rack'
    default: return null
  }
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
  const [parentLocations, setParentLocations] = useState<ParentLocation[]>([])
  const [loadingParents, setLoadingParents] = useState(false)
  const { toast } = useToast()

  const isEditMode = !!location

  const form = useForm<LocationFormValues>({
    defaultValues: {
      warehouse_id: location?.warehouse_id || '',
      code: location?.code || '',
      name: location?.name || '',
      description: location?.description || '',
      level: (location?.level as LocationLevel) || 'zone',
      location_type: (location?.location_type as LocationType) || 'shelf',
      parent_id: location?.parent_id || null,
      max_pallets: location?.max_pallets || null,
      max_weight_kg: location?.max_weight_kg || null,
      is_active: location?.is_active ?? true,
    },
  })

  // Watch fields for conditional rendering
  const selectedLevel = form.watch('level')
  const selectedWarehouseId = form.watch('warehouse_id')

  // Fetch warehouses for dropdown
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setLoadingWarehouses(true)
        const response = await fetch('/api/v1/settings/warehouses?status=active&limit=100')

        if (!response.ok) {
          throw new Error('Failed to fetch warehouses')
        }

        const result = await response.json()
        setWarehouses(result.data || [])
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

  // Fetch parent locations when warehouse or level changes
  useEffect(() => {
    const fetchParentLocations = async () => {
      const parentLevel = getAllowedParentLevel(selectedLevel)
      
      // Zones have no parent
      if (!parentLevel || !selectedWarehouseId) {
        setParentLocations([])
        return
      }

      try {
        setLoadingParents(true)
        const response = await fetch(
          `/api/v1/settings/warehouses/${selectedWarehouseId}/locations?level=${parentLevel}`
        )

        if (!response.ok) {
          // Try alternative endpoint
          const altResponse = await fetch(
            `/api/settings/locations?warehouse_id=${selectedWarehouseId}&level=${parentLevel}&view=flat`
          )
          if (!altResponse.ok) {
            throw new Error('Failed to fetch parent locations')
          }
          const result = await altResponse.json()
          setParentLocations(result.locations || [])
          return
        }

        const result = await response.json()
        setParentLocations(result.locations || result.data || [])
      } catch (error) {
        console.error('Error fetching parent locations:', error)
        setParentLocations([])
      } finally {
        setLoadingParents(false)
      }
    }

    if (open && selectedWarehouseId && selectedLevel !== 'zone') {
      fetchParentLocations()
    } else {
      setParentLocations([])
    }
  }, [open, selectedWarehouseId, selectedLevel])

  // Reset form when location changes or dialog opens
  useEffect(() => {
    if (location) {
      form.reset({
        warehouse_id: location.warehouse_id,
        code: location.code,
        name: location.name,
        description: location.description || '',
        level: location.level as LocationLevel,
        location_type: location.location_type as LocationType,
        parent_id: location.parent_id,
        max_pallets: location.max_pallets,
        max_weight_kg: location.max_weight_kg,
        is_active: location.is_active,
      })
    } else {
      form.reset({
        warehouse_id: '',
        code: '',
        name: '',
        description: '',
        level: 'zone',
        location_type: 'shelf',
        parent_id: null,
        max_pallets: null,
        max_weight_kg: null,
        is_active: true,
      })
    }
  }, [location, form])

  // Clear parent when level changes to zone
  useEffect(() => {
    if (selectedLevel === 'zone') {
      form.setValue('parent_id', null)
    }
  }, [selectedLevel, form])

  const onSubmit = async (data: LocationFormValues) => {
    try {
      setLoading(true)

      // Validate hierarchy
      const parentLevel = getAllowedParentLevel(data.level)
      if (parentLevel && !data.parent_id) {
        toast({
          title: 'Validation Error',
          description: `${data.level.charAt(0).toUpperCase() + data.level.slice(1)}s require a parent ${parentLevel}`,
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const url = isEditMode
        ? `/api/settings/locations/${location.id}`
        : '/api/settings/locations'
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          // Clean up null values
          max_pallets: data.max_pallets || null,
          max_weight_kg: data.max_weight_kg || null,
          parent_id: data.parent_id || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'create'} location`)
      }

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
              ? 'Update location details. Code and level cannot be changed.'
              : 'Create a new hierarchical location. Locations follow: Zone → Aisle → Rack → Bin'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Warehouse Selection */}
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

            {/* Level Selection - determines hierarchy position */}
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loading || isEditMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hierarchy level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LOCATION_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <FormDescription className="text-xs">
                    Hierarchy: Zone → Aisle → Rack → Bin
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Parent Location - shown for non-zone levels */}
            {selectedLevel !== 'zone' && (
              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Parent {getAllowedParentLevel(selectedLevel)?.charAt(0).toUpperCase()}
                      {getAllowedParentLevel(selectedLevel)?.slice(1)} *
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                      disabled={loading || loadingParents || !selectedWarehouseId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            loadingParents 
                              ? 'Loading...' 
                              : `Select parent ${getAllowedParentLevel(selectedLevel)}`
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parentLocations.map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.code} - {parent.name}
                            {parent.full_path && (
                              <span className="text-muted-foreground ml-2">
                                ({parent.full_path})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                        {parentLocations.length === 0 && !loadingParents && (
                          <SelectItem value="" disabled>
                            No {getAllowedParentLevel(selectedLevel)}s found. Create one first.
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Code and Name */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={selectedLevel === 'zone' ? 'ZONE-A' : 'A01'}
                        {...field}
                        disabled={loading || isEditMode}
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
                        placeholder="Zone A"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description..."
                      {...field}
                      disabled={loading}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Type (storage classification) */}
            <FormField
              control={form.control}
              name="location_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select storage type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LOCATION_TYPES.map((type) => (
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

            {/* Capacity fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="max_pallets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Pallets</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g., 10"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value, 10) : null
                          )
                        }
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                    <FormDescription className="text-xs">
                      Leave empty for no limit
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="e.g., 5000"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                    <FormDescription className="text-xs">
                      Leave empty for no limit
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            {/* Active Status (edit mode only) */}
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
