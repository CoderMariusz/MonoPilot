/**
 * BOM List Page
 * Story: 2.6 BOM CRUD
 * AC-2.6.1: List BOMs with filters
 * AC-2.6.4: Update BOM (via modal)
 * AC-2.6.6: Delete BOM (with confirmation)
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
import { Badge } from '@/components/ui/badge'
import { Search, Edit, Trash2, Eye, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import type { BOMWithProduct } from '@/lib/validation/bom-schemas'
import { BOMFormModal } from '@/components/technical/BOMFormModal'

export default function BOMsPage() {
  const router = useRouter()
  const [boms, setBOMs] = useState<BOMWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBOM, setEditingBOM] = useState<BOMWithProduct | null>(null)
  const [deletingBOM, setDeletingBOM] = useState<BOMWithProduct | null>(null)

  const { toast } = useToast()

  // Fetch BOMs with filters (AC-2.6.1)
  const fetchBOMs = async () => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('limit', '100') // Get more BOMs for now

      const response = await fetch(`/api/technical/boms?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch BOMs')
      }

      const data = await response.json()
      setBOMs(data.boms || [])
    } catch (error) {
      console.error('Error fetching BOMs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load BOMs',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBOMs()
  }, [statusFilter])

  // Debounced search (AC-2.6.1)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBOMs()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Delete handler (AC-2.6.6)
  const handleDeleteClick = (bom: BOMWithProduct) => {
    setDeletingBOM(bom)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingBOM) return

    try {
      const response = await fetch(`/api/technical/boms/${deletingBOM.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete BOM')
      }

      toast({
        title: 'Success',
        description: `BOM v${deletingBOM.version} deleted successfully`,
      })

      setDeletingBOM(null)
      fetchBOMs() // Refresh list
    } catch (error) {
      console.error('Error deleting BOM:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete BOM',
        variant: 'destructive',
      })
    }
  }

  // Edit handler (AC-2.6.4)
  const handleEdit = (bom: BOMWithProduct) => {
    setEditingBOM(bom)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingBOM(null)
  }

  const handleSaveSuccess = () => {
    fetchBOMs()
    handleCloseModal()
  }

  // Status badge with color coding (AC-2.6.1)
  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: 'default' | 'destructive' | 'secondary' | 'outline'; className: string }
    > = {
      'Draft': { variant: 'secondary', className: 'bg-gray-400 hover:bg-gray-500' },
      'Active': { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
      'Phased Out': {
        variant: 'secondary',
        className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      },
      'Inactive': { variant: 'outline', className: 'text-gray-500' },
    }

    const config = variants[status] || variants['Draft']

    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    )
  }

  // Format date for display
  const formatDate = (date: string | Date | null) => {
    if (!date) return 'No end date'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('pl-PL', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Bills of Materials (BOMs)</CardTitle>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create BOM
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters and Controls (AC-2.6.1) */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              {/* Search by product name/code */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by product code or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status filter (AC-2.6.1) */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All BOMs</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Phased Out">Phased Out</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* BOMs Table (AC-2.6.1) */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading BOMs...</div>
          ) : boms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No BOMs found. Create your first BOM to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Effective From</TableHead>
                  <TableHead>Effective To</TableHead>
                  <TableHead>Output</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boms.map((bom) => (
                  <TableRow key={bom.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{bom.product.code}</p>
                        <p className="text-sm text-gray-500">{bom.product.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-medium">v{bom.version}</TableCell>
                    <TableCell>{getStatusBadge(bom.status)}</TableCell>
                    <TableCell className="text-sm">{formatDate(bom.effective_from)}</TableCell>
                    <TableCell className="text-sm">{formatDate(bom.effective_to)}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {bom.output_qty} {bom.output_uom}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/technical/boms/${bom.id}`)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(bom)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(bom)}
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

      {/* Create/Edit Modal (AC-2.6.2, AC-2.6.4) */}
      {(showCreateModal || editingBOM) && (
        <BOMFormModal bom={editingBOM} onClose={handleCloseModal} onSuccess={handleSaveSuccess} />
      )}

      {/* Delete Confirmation Dialog (AC-2.6.6) */}
      <AlertDialog open={!!deletingBOM} onOpenChange={(open) => !open && setDeletingBOM(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete BOM?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingBOM && (
                <>
                  Are you sure you want to delete BOM v{deletingBOM.version} for{' '}
                  <span className="font-semibold">{deletingBOM.product.name}</span>?
                  <br /><br />
                  This will also delete all BOM items. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Delete BOM
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
