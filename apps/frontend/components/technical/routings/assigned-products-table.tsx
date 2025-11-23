/**
 * Assigned Products Table
 * Story: 2.17 Product-Routing Assignment
 * AC-017.4: Routing detail shows assigned products
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AssignedProductsTableProps {
  routingId: string
  isReusable: boolean
}

interface ProductAssignment {
  id: string
  product_id: string
  is_default: boolean
  product?: {
    id: string
    code: string
    name: string
    type: string
  }
}

export function AssignedProductsTable({ routingId, isReusable }: AssignedProductsTableProps) {
  const [assignments, setAssignments] = useState<ProductAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // AC-017.4: Fetch assigned products
  const fetchAssignments = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/technical/routings/${routingId}/products`)

      if (!response.ok) {
        throw new Error('Failed to fetch assigned products')
      }

      const data = await response.json()
      setAssignments(data.products || [])
    } catch (error) {
      console.error('Error fetching assigned products:', error)
      // Don't show error toast if products table doesn't exist yet (batch 2a pending)
      if (error instanceof Error && !error.message.includes('relation')) {
        toast({
          title: 'Error',
          description: 'Failed to load assigned products',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [routingId])

  // AC-017.7: Unassign product
  const handleUnassign = async (assignment: ProductAssignment) => {
    if (!confirm(`Unassign product from this routing?`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/technical/routings/${routingId}/products/${assignment.product_id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Failed to unassign product')
      }

      toast({
        title: 'Success',
        description: 'Product unassigned successfully',
      })

      fetchAssignments()
    } catch (error) {
      console.error('Error unassigning product:', error)
      toast({
        title: 'Error',
        description: 'Failed to unassign product',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Assigned Products ({assignments.length})</CardTitle>
          <Button disabled={true}>
            <Plus className="mr-2 h-4 w-4" />
            Assign Products
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Warning if non-reusable (AC-017.2) */}
        {!isReusable && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> This routing is non-reusable and can only be assigned to one product.
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading assigned products...</div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No products assigned. Assign products to use this routing in work orders.
            <br />
            <small className="text-xs">(Products functionality coming in Batch 2A)</small>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Code</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-mono font-semibold">
                    {assignment.product?.code || assignment.product_id}
                  </TableCell>
                  <TableCell>{assignment.product?.name || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{assignment.product?.type || '—'}</Badge>
                  </TableCell>
                  <TableCell>
                    {assignment.is_default ? (
                      <Badge variant="default" className="bg-green-600">Default</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnassign(assignment)}
                      title="Unassign product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
