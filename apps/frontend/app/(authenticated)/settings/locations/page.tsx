/**
 * Location Management Page
 * Story: 1.6 Location Management
 * Task 6: Frontend Locations List Page (AC-005.4, AC-005.5, AC-005.6)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { MapPin, Search, Edit, Trash2, Archive, QrCode } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { LocationForm } from '@/components/settings/LocationForm'
import { LocationDetailModal } from '@/components/settings/LocationDetailModal'

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
  warehouse?: {
    code: string
    name: string
  }
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<string>('active')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [viewingLocationId, setViewingLocationId] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch locations
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (activeFilter !== 'all') params.append('is_active', activeFilter)

      const response = await fetch(`/api/settings/locations?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch locations')
      }

      const data = await response.json()
      setLocations(data.locations || [])
    } catch (error) {
      console.error('Error fetching locations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load locations',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, typeFilter, activeFilter, toast])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLocations()
    }, 300)

    return () => clearTimeout(timer)
  }, [fetchLocations])

  // Delete/Archive location handler (AC-005.5)
  const handleDelete = async (location: Location, softDelete = false) => {
    const action = softDelete ? 'archive' : 'delete'
    if (
      !confirm(
        `${softDelete ? 'Archive' : 'Delete'} location ${location.name}? ${softDelete ? 'It will be hidden from lists.' : 'This action cannot be undone.'}`
      )
    ) {
      return
    }

    try {
      const url = softDelete
        ? `/api/settings/locations/${location.id}?soft=true`
        : `/api/settings/locations/${location.id}`

      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()

        // AC-005.5: Cannot delete if used as warehouse default
        if (error.suggestion) {
          toast({
            title: 'Cannot delete location',
            description: error.error,
            variant: 'destructive',
          })

          // Suggest soft delete if not already trying
          if (!softDelete) {
            if (confirm(`${error.suggestion}\n\nWould you like to archive instead?`)) {
              await handleDelete(location, true)
            }
          }
          return
        }

        throw new Error(error.error || `Failed to ${action} location`)
      }

      toast({
        title: 'Success',
        description: `Location ${softDelete ? 'archived' : 'deleted'} successfully`,
      })

      fetchLocations() // Refresh list
    } catch (error) {
      console.error(`Error ${action}ing location:`, error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${action} location`,
        variant: 'destructive',
      })
    }
  }

  // Location type badge with color coding
  const getTypeBadge = (type: string) => {
    const colors: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      receiving: 'default',
      production: 'secondary',
      storage: 'outline',
      shipping: 'default',
      transit: 'secondary',
      quarantine: 'destructive',
    }

    const labels: Record<string, string> = {
      receiving: 'Receiving',
      production: 'Production',
      storage: 'Storage',
      shipping: 'Shipping',
      transit: 'Transit',
      quarantine: 'Quarantine',
    }

    return (
      <Badge variant={colors[type] || 'default'}>
        {labels[type] || type}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Location Management</h1>
          <p className="text-muted-foreground">
            Manage warehouse locations for inventory storage and tracking
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <MapPin className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="receiving">Receiving</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
                <SelectItem value="transit">Transit</SelectItem>
                <SelectItem value="quarantine">Quarantine</SelectItem>
              </SelectContent>
            </Select>

            {/* Active/Archived Filter */}
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="false">Archived</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Locations Table (AC-005.4) */}
          {loading ? (
            <div className="text-center py-8">Loading locations...</div>
          ) : locations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No locations found. Create your first location to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.code}</TableCell>
                    <TableCell>{location.name}</TableCell>
                    <TableCell>
                      {location.warehouse
                        ? `${location.warehouse.name} (${location.warehouse.code})`
                        : '-'}
                    </TableCell>
                    <TableCell>{getTypeBadge(location.type)}</TableCell>
                    <TableCell>
                      {location.zone_enabled ? location.zone || '-' : '-'}
                    </TableCell>
                    <TableCell>
                      {location.capacity_enabled
                        ? location.capacity?.toFixed(2) || '-'
                        : '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {location.barcode}
                    </TableCell>
                    <TableCell>
                      <Badge variant={location.is_active ? 'default' : 'secondary'}>
                        {location.is_active ? 'Active' : 'Archived'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* QR Code Button (AC-005.6) */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingLocationId(location.id)}
                          title="View QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>

                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingLocation(location)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* Archive Button (AC-005.5) */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(location, true)}
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>

                        {/* Delete Button (AC-005.5) */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(location, false)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Location Form Modal (Create) */}
      <LocationForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={fetchLocations}
      />

      {/* Location Form Modal (Edit) */}
      {editingLocation && (
        <LocationForm
          open={!!editingLocation}
          onOpenChange={(open) => !open && setEditingLocation(null)}
          onSuccess={fetchLocations}
          location={editingLocation}
        />
      )}

      {/* Location Detail/QR Code Modal */}
      <LocationDetailModal
        open={!!viewingLocationId}
        onOpenChange={(open) => !open && setViewingLocationId(null)}
        locationId={viewingLocationId}
      />
    </div>
  )
}
