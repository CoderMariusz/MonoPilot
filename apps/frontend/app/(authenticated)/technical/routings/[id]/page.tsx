/**
 * Routing Detail Page
 * Story: 2.15, 2.16, 2.17
 * AC-015.5: Routing detail view
 * AC-016.2: Operations list
 * AC-017.4: Assigned products
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Routing } from '@/lib/services/routing-service'
import { EditRoutingDrawer } from '@/components/technical/routings/edit-routing-drawer'
import { OperationsTable } from '@/components/technical/routings/operations-table'
import { AssignedProductsTable } from '@/components/technical/routings/assigned-products-table'

export default function RoutingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const routingId = params.id as string

  const [routing, setRouting] = useState<Routing | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditDrawer, setShowEditDrawer] = useState(false)

  // AC-015.5: Fetch routing details
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

  useEffect(() => {
    fetchRouting()
  }, [routingId])

  // AC-015.7: Delete routing
  const handleDelete = async () => {
    if (!routing) return

    if (!confirm(`Delete routing "${routing.code}"? This will also delete all operations and product assignments. This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/technical/routings/${routingId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete routing')
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
        description: 'Failed to delete routing',
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

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default" className="bg-green-600">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push('/technical/routings')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Routings
      </Button>

      {/* Header Section (AC-015.5) */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold font-mono">{routing.code}</h1>
          <p className="text-xl text-muted-foreground mt-1">{routing.name}</p>
          <div className="flex gap-2 mt-3">
            {getStatusBadge(routing.status)}
            {routing.is_reusable ? (
              <Badge variant="outline">Reusable</Badge>
            ) : (
              <Badge variant="secondary">Non-Reusable</Badge>
            )}
          </div>
        </div>
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

      {/* Operations Section (AC-016.2) */}
      <OperationsTable routingId={routingId} />

      {/* Assigned Products Section (AC-017.4) */}
      <AssignedProductsTable
        routingId={routingId}
        routingCode={routing.code}
        routingName={routing.name}
        isReusable={routing.is_reusable}
      />

      {/* Edit Drawer (AC-015.6) */}
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
