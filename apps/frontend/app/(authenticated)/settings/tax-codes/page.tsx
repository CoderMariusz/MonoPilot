/**
 * Tax Code Management Page
 * Story: 1.10 Tax Code Configuration
 * Task: BATCH 2 - List Page
 * AC-009.3: Tax codes list view with search, sort
 * AC-009.4: Delete tax code with FK validation
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { TaxCode } from '@/lib/validation/tax-code-schemas'
import { TaxCodeFormModal } from '@/components/settings/TaxCodeFormModal'
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

export default function TaxCodesPage() {
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTaxCode, setEditingTaxCode] = useState<TaxCode | null>(null)
  const [deletingTaxCode, setDeletingTaxCode] = useState<TaxCode | null>(null)

  // AC-009.3: Dynamic sorting
  const [sortBy, setSortBy] = useState<'code' | 'description' | 'rate'>('code')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const { toast } = useToast()

  // Fetch tax codes (AC-009.3 with filters and sorting)
  const fetchTaxCodes = async () => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      params.append('sort_by', sortBy)
      params.append('sort_direction', sortDirection)

      const response = await fetch(`/api/settings/tax-codes?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch tax codes')
      }

      const data = await response.json()
      setTaxCodes(data.taxCodes || [])
    } catch (error) {
      console.error('Error fetching tax codes:', error)
      toast({
        title: 'Error',
        description: 'Failed to load tax codes',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTaxCodes()
  }, [sortBy, sortDirection])

  // Debounced search (AC-009.3)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTaxCodes()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Delete handler (AC-009.4)
  const handleDelete = async (taxCode: TaxCode) => {
    try {
      const response = await fetch(`/api/settings/tax-codes/${taxCode.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        // AC-009.4: Cannot delete if used in PO lines
        if (response.status === 409) {
          toast({
            title: 'Cannot delete tax code',
            description: data.message || 'This tax code is currently used by purchase orders',
            variant: 'destructive',
          })
          return
        }

        throw new Error(data.error || 'Failed to delete tax code')
      }

      toast({
        title: 'Success',
        description: `Tax code "${taxCode.code}" deleted successfully`,
      })

      // Refresh list
      fetchTaxCodes()
      setDeletingTaxCode(null)
    } catch (error) {
      console.error('Error deleting tax code:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete tax code',
        variant: 'destructive',
      })
    }
  }

  // Handle toggle sort
  const handleSort = (column: 'code' | 'description' | 'rate') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  // Format rate for display (AC-009.3)
  const formatRate = (rate: number) => {
    return `${rate.toFixed(2)}%`
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tax Code Management</span>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tax Code
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AC-009.3: Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* AC-009.3: Tax codes table */}
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
                    onClick={() => handleSort('description')}
                  >
                    Description {sortBy === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('rate')}
                  >
                    Rate {sortBy === 'rate' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-right">PO Lines</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading tax codes...
                    </TableCell>
                  </TableRow>
                ) : taxCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No tax codes found. Click &ldquo;Add Tax Code&rdquo; to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  taxCodes.map((taxCode) => (
                    <TableRow key={taxCode.id}>
                      <TableCell className="font-mono font-medium">{taxCode.code}</TableCell>
                      <TableCell>{taxCode.description}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatRate(taxCode.rate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* AC-009.3: PO line count (Epic 3 JOIN) */}
                        {taxCode.po_line_count || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTaxCode(taxCode)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingTaxCode(taxCode)}
                            title="Delete tax code"
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

          {/* AC-009.3: Info banner for seeded tax codes */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">Tax Code Configuration</p>
              <p className="text-blue-700 dark:text-blue-300">
                Common tax codes (PL VAT, UK VAT) are preloaded. Add custom codes as needed for your organization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTaxCode) && (
        <TaxCodeFormModal
          taxCode={editingTaxCode}
          onClose={() => {
            setShowCreateModal(false)
            setEditingTaxCode(null)
          }}
          onSuccess={() => {
            fetchTaxCodes()
            setShowCreateModal(false)
            setEditingTaxCode(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingTaxCode && (
        <AlertDialog open={!!deletingTaxCode} onOpenChange={() => setDeletingTaxCode(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete tax code?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{deletingTaxCode.code}&rdquo;? This action cannot be undone.
                {deletingTaxCode.po_line_count && deletingTaxCode.po_line_count > 0 && (
                  <span className="block mt-2 text-destructive font-semibold">
                    Warning: This tax code is used by {deletingTaxCode.po_line_count} purchase order line(s).
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(deletingTaxCode)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
