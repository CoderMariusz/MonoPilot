/**
 * Routings List Page
 * Story: 02.7 Routings CRUD
 * Wireframe: TEC-007 (Routings List)
 *
 * Features:
 * - List routings with code, name, description, status, operations count
 * - Search by code and name
 * - Filter by active/inactive status
 * - Create, view, delete actions
 */

'use client'

import { useState, useEffect } from 'react'
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
import { Search, Trash2, Eye, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import type { Routing } from '@/lib/services/routing-service'
import { CreateRoutingModal } from '@/components/technical/routings/create-routing-modal'
import { TechnicalHeader } from '@/components/technical/TechnicalHeader'

export default function RoutingsPage() {
  const router = useRouter()
  const [routings, setRoutings] = useState<Routing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { toast } = useToast()

  // Fetch routings with filters - using V1 API
  const fetchRoutings = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (activeFilter !== 'all') params.append('is_active', activeFilter)
      if (searchTerm) params.append('search', searchTerm)

      // Use V1 API endpoint
      const response = await fetch(`/api/v1/technical/routings?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch routings')
      }

      const data = await response.json()
      setRoutings(data.routings || [])
    } catch (error) {
      console.error('Error fetching routings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load routings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoutings()
  }, [activeFilter])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRoutings()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Delete routing - using V1 API
  const handleDelete = async (routing: Routing) => {
    if (!confirm(`Delete routing "${routing.code || routing.name}"? This will also delete all operations. This action cannot be undone.`)) {
      return
    }

    try {
      // Use V1 API endpoint
      const response = await fetch(`/api/v1/technical/routings/${routing.id}`, {
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

      fetchRoutings()
    } catch (error) {
      console.error('Error deleting routing:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete routing',
        variant: 'destructive',
      })
    }
  }

  // Handle create success
  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    fetchRoutings()
  }

  // Filter by search term (client-side fallback, server already filters)
  const filteredRoutings = routings.filter((routing) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (routing.code && routing.code.toLowerCase().includes(term)) ||
      routing.name.toLowerCase().includes(term) ||
      (routing.description && routing.description.toLowerCase().includes(term))
    )
  })

  return (
    <div>
      <TechnicalHeader currentPage="routings" />
      <div className="px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Routings</h1>
            <p className="text-muted-foreground">Manage production routings and operations</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Routing
          </Button>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by code or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Active Filter */}
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Routings Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8">Loading routings...</div>
            ) : filteredRoutings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No routings found. Create your first routing to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Operations</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoutings.map((routing) => (
                    <TableRow key={routing.id}>
                      <TableCell className="font-mono text-sm">{routing.code || '-'}</TableCell>
                      <TableCell className="font-semibold">{routing.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {routing.description || '-'}
                      </TableCell>
                      <TableCell>
                        {routing.is_active ? (
                          <Badge variant="default" className="bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{routing.operations_count || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/technical/routings/${routing.id}`)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(routing)}
                            title="Delete routing"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Create Routing Modal */}
        <CreateRoutingModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </div>
  )
}
