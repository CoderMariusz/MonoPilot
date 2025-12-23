/**
 * Warehouse Locations Page
 * Story: 01.9 - Location Hierarchy Management
 *
 * Hierarchical tree view of warehouse locations with CRUD operations
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, AlertCircle } from 'lucide-react'
import { LocationTree } from '@/components/settings/locations/LocationTree'
import { LocationModal } from '@/components/settings/locations/LocationModal'
import { LocationBreadcrumb } from '@/components/settings/locations/LocationBreadcrumb'
import { useLocationTree } from '@/lib/hooks/use-location-tree'
import { useDeleteLocation } from '@/lib/hooks/use-delete-location'
import { useToast } from '@/hooks/use-toast'
import type { Location, LocationNode } from '@/lib/types/location'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function WarehouseLocationsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const warehouseId = params.warehouseId as string

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<LocationNode | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [parentForCreate, setParentForCreate] = useState<Location | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [locationToDelete, setLocationToDelete] = useState<LocationNode | null>(null)

  const { data, isLoading, isError, error, refetch } = useLocationTree(warehouseId, {
    view: 'tree',
    search: searchQuery || undefined,
    include_capacity: true,
  })

  const deleteMutation = useDeleteLocation(warehouseId)

  // Handle create new location
  const handleCreate = () => {
    setModalMode('create')
    setParentForCreate(null)
    setModalOpen(true)
  }

  // Handle create child location
  const handleAddChild = (parent: LocationNode) => {
    setModalMode('create')
    setParentForCreate(parent)
    setModalOpen(true)
  }

  // Handle edit location
  const handleEdit = (location: LocationNode) => {
    setSelectedLocation(location)
    setModalMode('edit')
    setModalOpen(true)
  }

  // Handle delete location
  const handleDelete = (location: LocationNode) => {
    setLocationToDelete(location)
    setDeleteDialogOpen(true)
  }

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!locationToDelete) return

    try {
      await deleteMutation.mutateAsync(locationToDelete.id)
      toast({
        title: 'Success',
        description: 'Location deleted successfully',
      })
      setDeleteDialogOpen(false)
      setLocationToDelete(null)
      refetch()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete location',
        variant: 'destructive',
      })
    }
  }

  // Handle modal success
  const handleModalSuccess = () => {
    setModalOpen(false)
    setSelectedLocation(null)
    setParentForCreate(null)
    refetch()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-semibold">Failed to Load Locations</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {error?.message || 'Unable to retrieve location hierarchy. Check your connection.'}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => refetch()}>Retry</Button>
            <Button variant="outline" onClick={() => router.push('/settings/warehouses')}>
              Back to Warehouses
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  const isEmpty = !data?.locations || data.locations.length === 0

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Warehouse Locations</h1>
          <p className="text-muted-foreground">
            Manage location hierarchy and storage capacity
          </p>
        </div>
        <Button onClick={handleCreate} aria-label="Add new location">
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search locations"
          />
        </div>
      </div>

      {/* Empty State */}
      {isEmpty && !searchQuery && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 border rounded-lg">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No Locations Found</h3>
            <p className="text-muted-foreground max-w-md">
              This warehouse doesn&apos;t have any locations yet. Start by adding zones, aisles, or bulk storage areas.
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Location
          </Button>
        </div>
      )}

      {/* Empty Search Results */}
      {isEmpty && searchQuery && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 border rounded-lg">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No Results Found</h3>
            <p className="text-muted-foreground max-w-md">
              No locations match your search query &quot;{searchQuery}&quot;
            </p>
          </div>
          <Button variant="outline" onClick={() => setSearchQuery('')}>
            Clear Search
          </Button>
        </div>
      )}

      {/* Location Tree */}
      {!isEmpty && (
        <>
          {/* Selected Location Breadcrumb */}
          {selectedLocation && (
            <div className="border-l-4 border-primary pl-4 py-2">
              <p className="text-sm text-muted-foreground mb-1">Selected Location:</p>
              <LocationBreadcrumb fullPath={selectedLocation.full_path} />
            </div>
          )}

          {/* Tree View */}
          <LocationTree
            warehouseId={warehouseId}
            locations={data.locations}
            selectedId={selectedLocation?.id}
            onSelect={setSelectedLocation}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
          />

          {/* Summary Stats */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground border-t pt-4">
            <span>Total: {data.total_count} locations</span>
            {/* Add more stats as needed */}
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      <LocationModal
        mode={modalMode}
        warehouseId={warehouseId}
        location={modalMode === 'edit' ? selectedLocation : null}
        parentLocation={modalMode === 'create' ? parentForCreate : null}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedLocation(null)
          setParentForCreate(null)
        }}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{locationToDelete?.code}&quot;? This action cannot be undone.
              {locationToDelete?.children_count > 0 && (
                <span className="block mt-2 text-destructive font-semibold">
                  Warning: This location has {locationToDelete.children_count} child location(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
