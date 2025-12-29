/**
 * Routing Detail Page
 * Story: 2.24 Routing Restructure, Story 02.8 Routing Operations
 * Routings are now independent templates (no product binding)
 * AC-32: Permission enforcement for operations CRUD
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Routing } from '@/lib/services/routing-service'
import { EditRoutingDrawer } from '@/components/technical/routings/edit-routing-drawer'
import { OperationsTable } from '@/components/technical/routings/operations-table'

export default function RoutingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const routingId = params.id as string

  const [routing, setRouting] = useState<Routing | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [canEdit, setCanEdit] = useState(true) // Default true, updated from permissions

  // Fetch routing details with operations
  const fetchRouting = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/technical/routings/${routingId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch routing')
      }

      const data = await response.json()
      setRouting(data.routing)
    } catch (error) {
      console.error('Error fetching routing:', error)
      toast({
        title: 'Error',
        description: 'Failed to load routing details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch user permissions (AC-32)
  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/v1/settings/users/me/permissions')
      if (response.ok) {
        const data = await response.json()
        // Check for technical module update permission
        const technicalPerm = data.permissions?.technical || ''
        const hasEditPerm = technicalPerm.includes('U') || technicalPerm.includes('C')
        setCanEdit(hasEditPerm)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      // Default to true if permission check fails
    }
  }

  useEffect(() => {
    fetchRouting()
    fetchPermissions()
  }, [routingId])

  // Delete routing
  const handleDelete = async () => {
    if (!routing) return

    if (!confirm(`Delete routing "${routing.name}"? This will also delete all operations. This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/technical/routings/${routingId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete routing')
      }

      toast({
        title: 'Success',
        description: 'Routing deleted successfully',
      })

      router.push('/technical/routings')
    } catch (error) {
      console.error('Error deleting routing:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete routing',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading routing...</div>
      </div>
    )
  }

  if (!routing) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Routing not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push('/technical/routings')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Routings
      </Button>

      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold">{routing.name}</h1>
          <div className="flex gap-2 mt-3">
            {routing.is_active ? (
              <Badge variant="default" className="bg-green-600">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditDrawer(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {routing.description && (
            <div>
              <h3 className="font-semibold mb-1">Description</h3>
              <p className="text-muted-foreground">{routing.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-1">Created At</h3>
              <p className="text-muted-foreground">
                {new Date(routing.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Updated At</h3>
              <p className="text-muted-foreground">
                {new Date(routing.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations Section (AC-32: canEdit prop for permission enforcement) */}
      <OperationsTable routingId={routingId} canEdit={canEdit} />

      {/* Edit Drawer */}
      <EditRoutingDrawer
        routing={routing}
        open={showEditDrawer}
        onClose={() => setShowEditDrawer(false)}
        onSuccess={() => {
          setShowEditDrawer(false)
          fetchRouting()
        }}
      />
    </div>
  )
}
