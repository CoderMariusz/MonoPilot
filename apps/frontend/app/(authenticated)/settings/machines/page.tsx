/**
 * Machine Configuration Page
 * Story: 1.7 Machine Configuration
 * Task 5: Frontend Machines List Page (AC-006.4)
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
import { Settings, Search, Edit, Trash2, ArrowUpDown, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import type { Machine } from '@/lib/validation/machine-schemas'
import { MachineFormModal } from '@/components/settings/MachineFormModal'

export default function MachinesPage() {
  const router = useRouter()
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null)

  // AC-006.4: Dynamic sorting
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'status' | 'created_at'>('code')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const { toast } = useToast()

  // Fetch machines (AC-006.4 with filters and sorting)
  const fetchMachines = async () => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('sort_by', sortBy)
      params.append('sort_direction', sortDirection)

      const response = await fetch(`/api/settings/machines?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch machines')
      }

      const data = await response.json()
      setMachines(data.machines || [])
    } catch (error) {
      console.error('Error fetching machines:', error)
      toast({
        title: 'Error',
        description: 'Failed to load machines',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMachines()
  }, [statusFilter, sortBy, sortDirection])

  // Debounced search (AC-006.4)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMachines()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Delete handler (AC-006.5)
  const handleDelete = async (machine: Machine) => {
    if (!confirm(`Delete machine "${machine.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/settings/machines/${machine.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()

        // AC-006.5: Show friendly error for FK constraints
        if (error.code === 'HAS_DEPENDENCIES') {
          toast({
            title: 'Cannot Delete',
            description: error.error || 'This machine has active work orders. Set status to "Maintenance" instead.',
            variant: 'destructive',
          })
          return
        }

        throw new Error(error.error || 'Failed to delete machine')
      }

      toast({
        title: 'Success',
        description: 'Machine deleted successfully',
      })

      fetchMachines() // Refresh list
    } catch (error) {
      console.error('Error deleting machine:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete machine',
        variant: 'destructive',
      })
    }
  }

  // Edit handler (AC-006.6)
  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingMachine(null)
  }

  const handleSaveSuccess = () => {
    fetchMachines()
    handleCloseModal()
  }

  // AC-006.2: Status badge with color coding
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline', className: string }> = {
      active: { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
      down: { variant: 'destructive', className: '' },
      maintenance: { variant: 'secondary', className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
    }

    const config = variants[status] || variants.active

    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // AC-006.4: Lines column - show comma-separated codes or "No lines"
  const getLinesBadge = (machine: Machine) => {
    if (!machine.assigned_lines || machine.assigned_lines.length === 0) {
      return <span className="text-gray-400 text-sm">No lines assigned</span>
    }

    // TODO Story 1.8: After production_lines table exists, show actual line codes
    return (
      <span className="text-sm text-gray-600">
        {machine.assigned_lines.length} line(s)
      </span>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Machine Configuration</CardTitle>
            <Button onClick={() => setShowCreateModal(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Add Machine
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters and Controls (AC-006.4) */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              {/* Search by code or name */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by code or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status filter (AC-006.4) */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Machines</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="down">Down</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By (AC-006.4) */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'code' | 'name' | 'status' | 'created_at')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="code">Sort by Code</SelectItem>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="status">Sort by Status</SelectItem>
                  <SelectItem value="created_at">Sort by Date</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Direction (AC-006.4) */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              >
                <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Machines Table (AC-006.4) */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading machines...</div>
          ) : machines.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No machines found. Create your first machine to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lines</TableHead>
                  <TableHead>Capacity (per hour)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machines.map((machine) => (
                  <TableRow key={machine.id}>
                    <TableCell className="font-medium">{machine.code}</TableCell>
                    <TableCell>{machine.name}</TableCell>
                    <TableCell>{getStatusBadge(machine.status)}</TableCell>
                    <TableCell>{getLinesBadge(machine)}</TableCell>
                    <TableCell className="text-gray-600">
                      {machine.capacity_per_hour ? machine.capacity_per_hour.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/settings/machines/${machine.id}`)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(machine)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(machine)}
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

      {/* Create/Edit Modal (AC-006.1, AC-006.6) */}
      {(showCreateModal || editingMachine) && (
        <MachineFormModal
          machine={editingMachine}
          onClose={handleCloseModal}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  )
}
