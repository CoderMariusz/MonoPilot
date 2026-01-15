/**
 * Warehouse Locations Page
 * Story: 01.9 - Warehouse Locations Management
 *
 * Hierarchical location management for a specific warehouse
 */

'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Plus, RefreshCw, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { LocationTree } from '@/components/settings/locations/LocationTree'
import { LocationModal } from '@/components/settings/locations/LocationModal'
import type { Location, LocationNode } from '@/lib/types/location'

interface PageProps {
  params: Promise<{ id: string }>
}

interface Warehouse {
  id: string
  code: string
  name: string
}

export default function WarehouseLocationsPage(props: PageProps) {
  const params = use(props.params)
  const warehouseId = params.id
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [locations, setLocations] = useState<LocationNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editLocation, setEditLocation] = useState<Location | null>(null)
  const [parentLocation, setParentLocation] = useState<Location | null>(null)

  // Fetch warehouse info
  useEffect(() => {
    const fetchWarehouse = async () => {
      try {
        const res = await fetch(`/api/v1/settings/warehouses/${warehouseId}`)
        if (res.ok) {
          const data = await res.json()
          setWarehouse(data.warehouse || data)
        }
      } catch (err) {
        console.error('Error fetching warehouse:', err)
      }
    }
    fetchWarehouse()
  }, [warehouseId])

  // Fetch locations
  const fetchLocations = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/settings/warehouses/${warehouseId}/locations?view=tree`)
      if (res.ok) {
        const data = await res.json()
        setLocations(data.locations || [])
      } else {
        setError('Failed to fetch locations')
      }
    } catch (err) {
      setError('Network error')
      console.error('Error fetching locations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [warehouseId])

  // Handlers
  const handleCreateRoot = () => {
    setEditLocation(null)
    setParentLocation(null)
    setShowModal(true)
  }

  const handleAddChild = (location: LocationNode) => {
    setEditLocation(null)
    setParentLocation(location as Location)
    setShowModal(true)
  }

  const handleEdit = (location: LocationNode) => {
    setEditLocation(location as Location)
    setParentLocation(null)
    setShowModal(true)
  }

  const handleDelete = async (location: LocationNode) => {
    if (!confirm(`Delete location "${location.name}"? This cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/v1/settings/warehouses/${warehouseId}/locations/${location.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast({ title: 'Location deleted' })
        fetchLocations()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to delete', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    }
  }

  const handleModalSuccess = () => {
    setShowModal(false)
    fetchLocations()
    toast({ title: editLocation ? 'Location updated' : 'Location created' })
  }

  // Loading state
  if (loading && !warehouse) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/settings/warehouses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Warehouses
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Locations</h1>
            {warehouse && (
              <p className="text-muted-foreground">
                {warehouse.name} ({warehouse.code})
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLocations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateRoot}>
            <Plus className="h-4 w-4 mr-2" />
            Add Zone
          </Button>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Location Hierarchy</CardTitle>
          <CardDescription>
            Manage zones, aisles, racks, and bins. Click on a location to select it, use the menu to add children or edit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold">Failed to Load Locations</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchLocations}>Retry</Button>
            </div>
          ) : loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-lg font-semibold">No Locations Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating a zone for this warehouse.
              </p>
              <Button onClick={handleCreateRoot}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Zone
              </Button>
            </div>
          ) : (
            <LocationTree
              warehouseId={warehouseId}
              locations={locations}
              onSelect={() => {}}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddChild={handleAddChild}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <LocationModal
          mode={editLocation ? 'edit' : 'create'}
          warehouseId={warehouseId}
          location={editLocation}
          parentLocation={parentLocation}
          open={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
