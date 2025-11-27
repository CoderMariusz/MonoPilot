/**
 * Routings List Page
 * Story: 2.15 Routing CRUD
 * AC-015.1: Routing list view with search, filters, and actions
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
import { Search, Edit, Trash2, Eye, Plus } from 'lucide-react'
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
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'status' | 'created_at'>('code')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const { toast } = useToast()

  // AC-015.2: Fetch routings with filters
  const fetchRoutings = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('sort_by', sortBy)
      params.append('sort_direction', sortDirection)

      const response = await fetch(`/api/technical/routings?${params.toString()}`)

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
  }, [statusFilter, sortBy, sortDirection])

  // AC-015.3: Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRoutings()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // AC-015.7: Delete routing
  const handleDelete = async (routing: Routing) => {
    if (!confirm(`Delete routing "${routing.code}"? This will also delete all operations and product assignments. This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/technical/routings/${routing.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete routing')
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
        description: 'Failed to delete routing',
        variant: 'destructive',
      })
    }
  }

  // Handle create success
  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    fetchRoutings()
  }

  // Status badge (AC-015.2)
  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default" className="bg-green-600">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    )
  }

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

      {/* Filters Card (AC-015.3) */}
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

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="code">Code</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="created_at">Created Date</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Direction */}
            <Select value={sortDirection} onValueChange={(val) => setSortDirection(val as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Routings Table (AC-015.2) */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">Loading routings...</div>
          ) : routings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No routings found. Create your first routing to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reusable</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Operations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routings.map((routing) => (
                  <TableRow key={routing.id}>
                    <TableCell className="font-mono font-semibold">{routing.code}</TableCell>
                    <TableCell>{routing.name}</TableCell>
                    <TableCell>{getStatusBadge(routing.status)}</TableCell>
                    <TableCell>
                      {routing.is_reusable ? (
                        <Badge variant="outline">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{routing.products_count || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{routing.operations?.length || 0}</Badge>
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

      {/* Create Routing Modal (AC-015.3) */}
      <CreateRoutingModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
      </div>
    </div>
  )
}
