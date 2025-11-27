/**
 * Production Line Management Page
 * Story: 1.8 Production Line Configuration
 * Task: BATCH 2 - List Page
 * AC-007.4: Lines list view with search, filters, sort
 * AC-007.2: Delete production line with FK validation
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
import { Search, Edit, Trash2, Plus, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { ProductionLine } from '@/lib/validation/production-line-schemas'
import { ProductionLineFormModal } from '@/components/settings/ProductionLineFormModal'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
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

export default function ProductionLinesPage() {
  const [lines, setLines] = useState<ProductionLine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingLine, setEditingLine] = useState<ProductionLine | null>(null)
  const [deletingLine, setDeletingLine] = useState<ProductionLine | null>(null)

  // AC-007.4: Dynamic sorting
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'warehouse' | 'created_at'>('code')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Warehouses for filter dropdown
  const [warehouses, setWarehouses] = useState<Array<{ id: string; code: string; name: string }>>([])

  const { toast } = useToast()

  // Fetch warehouses for filter
  useEffect(() => {
    fetchWarehouses()
  }, [])

  // Fetch production lines (AC-007.4 with filters and sorting)
  const fetchLines = async () => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (warehouseFilter !== 'all') params.append('warehouse_id', warehouseFilter)
      params.append('sort_by', sortBy)
      params.append('sort_direction', sortDirection)

      const response = await fetch(`/api/settings/production-lines?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch production lines')
      }

      const data = await response.json()
      setLines(data.lines || [])
    } catch (error) {
      console.error('Error fetching production lines:', error)
      toast({
        title: 'Error',
        description: 'Failed to load production lines',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/settings/warehouses')
      if (!response.ok) throw new Error('Failed to fetch warehouses')
      const data = await response.json()
      setWarehouses(data.warehouses || [])
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    }
  }

  useEffect(() => {
    fetchLines()
  }, [warehouseFilter, sortBy, sortDirection])

  // Debounced search (AC-007.4)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLines()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Delete handler (AC-007.2)
  const handleDelete = async (line: ProductionLine) => {
    try {
      const response = await fetch(`/api/settings/production-lines/${line.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        // AC-007.2: Cannot delete if used in WOs or machines
        if (response.status === 409) {
          toast({
            title: 'Cannot delete production line',
            description: data.message || 'This line is currently assigned to work orders or machines',
            variant: 'destructive',
          })
          return
        }

        throw new Error(data.error || 'Failed to delete production line')
      }

      toast({
        title: 'Success',
        description: `Production line "${line.code}" deleted successfully`,
      })

      // Refresh list
      fetchLines()
      setDeletingLine(null)
    } catch (error) {
      console.error('Error deleting production line:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete production line',
        variant: 'destructive',
      })
    }
  }

  // Handle toggle sort
  const handleSort = (column: 'code' | 'name' | 'warehouse' | 'created_at') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  return (
    <div>
      <SettingsHeader currentPage="lines" />
      <div className="px-4 md:px-6 py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Production Line Management</span>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Production Line
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AC-007.4: Search and filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} - {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AC-007.4: Production lines table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('code')}
                  >
                    Code {sortBy === 'code' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('name')}
                  >
                    Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('warehouse')}
                  >
                    Warehouse {sortBy === 'warehouse' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Output Location</TableHead>
                  <TableHead className="text-right">Machines</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading production lines...
                    </TableCell>
                  </TableRow>
                ) : lines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No production lines found. Click &ldquo;Add Production Line&rdquo; to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono font-medium">{line.code}</TableCell>
                      <TableCell>{line.name}</TableCell>
                      <TableCell>
                        {line.warehouse ? (
                          <Badge variant="secondary">
                            {line.warehouse.code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {line.default_output_location ? (
                          <span className="text-sm">
                            {line.default_output_location.code}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not set</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* AC-007.4: Machine count (Epic 4 JOIN) */}
                        {line.assigned_machines?.length || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingLine(line)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingLine(line)}
                            title="Delete production line"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* AC-007.4: Info banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">Production Line Configuration</p>
              <p className="text-blue-700 dark:text-blue-300">
                Production lines define where manufacturing happens. Assign machines to lines in Machine Configuration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingLine) && (
        <ProductionLineFormModal
          line={editingLine}
          onClose={() => {
            setShowCreateModal(false)
            setEditingLine(null)
          }}
          onSuccess={() => {
            fetchLines()
            setShowCreateModal(false)
            setEditingLine(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingLine && (
        <AlertDialog open={!!deletingLine} onOpenChange={() => setDeletingLine(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete production line?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{deletingLine.code}&rdquo;? This action cannot be undone.
                {deletingLine.assigned_machines && deletingLine.assigned_machines.length > 0 && (
                  <span className="block mt-2 text-destructive font-semibold">
                    Warning: This line is assigned to {deletingLine.assigned_machines.length} machine(s).
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(deletingLine)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      </div>
    </div>
  )
}
