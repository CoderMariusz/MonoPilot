/**
 * Allergen Management Page
 * Story: 1.9 Allergen Management
 * Task 6: Frontend Allergens List Page (AC-008.5)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
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
import type { Allergen } from '@/lib/validation/allergen-schemas'
import { AllergenFormModal } from '@/components/settings/AllergenFormModal'
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

export default function AllergensPage() {
  const [allergens, setAllergens] = useState<Allergen[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isMajorFilter, setIsMajorFilter] = useState<string>('all')
  const [isCustomFilter, setIsCustomFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAllergen, setEditingAllergen] = useState<Allergen | null>(null)
  const [deletingAllergen, setDeletingAllergen] = useState<Allergen | null>(null)

  // AC-008.5: Dynamic sorting
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'is_major'>('code')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const { toast } = useToast()

  // Fetch allergens (AC-008.5 with filters and sorting)
  const fetchAllergens = useCallback(async () => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (isMajorFilter !== 'all') params.append('is_major', isMajorFilter)
      if (isCustomFilter !== 'all') params.append('is_custom', isCustomFilter)
      params.append('sort_by', sortBy)
      params.append('sort_direction', sortDirection)

      const response = await fetch(`/api/settings/allergens?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch allergens')
      }

      const data = await response.json()
      setAllergens(data.allergens || [])
    } catch (error) {
      console.error('Error fetching allergens:', error)
      toast({
        title: 'Error',
        description: 'Failed to load allergens',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, isMajorFilter, isCustomFilter, sortBy, sortDirection, toast])

  useEffect(() => {
    fetchAllergens()
  }, [fetchAllergens])

  // Debounced search (AC-008.5)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllergens()
    }, 300)

    return () => clearTimeout(timer)
  }, [fetchAllergens])

  // Delete handler (AC-008.2, AC-008.4)
  const handleDelete = async (allergen: Allergen) => {
    try {
      const response = await fetch(`/api/settings/allergens/${allergen.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        // AC-008.2: Preloaded allergens cannot be deleted
        if (response.status === 403) {
          toast({
            title: 'Cannot delete EU major allergen',
            description: 'Only custom allergens can be deleted',
            variant: 'destructive',
          })
          return
        }

        // AC-008.4: Cannot delete if used in products
        if (response.status === 409) {
          toast({
            title: 'Cannot delete allergen',
            description: data.message || 'This allergen is currently used by products',
            variant: 'destructive',
          })
          return
        }

        throw new Error(data.error || 'Failed to delete allergen')
      }

      toast({
        title: 'Success',
        description: `Allergen "${allergen.name}" deleted successfully`,
      })

      // Refresh list
      fetchAllergens()
      setDeletingAllergen(null)
    } catch (error) {
      console.error('Error deleting allergen:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete allergen',
        variant: 'destructive',
      })
    }
  }

  // Handle toggle sort
  const handleSort = (column: 'code' | 'name' | 'is_major') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  // Check if delete is allowed (AC-008.2)
  const canDelete = (allergen: Allergen) => {
    return allergen.is_custom
  }

  return (
    <div>
      <SettingsHeader currentPage="allergens" />
      <div className="px-4 md:px-6 py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Allergen Management</span>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Allergen
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AC-008.5: Search and filters */}
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

            <Select value={isMajorFilter} onValueChange={setIsMajorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Allergens</SelectItem>
                <SelectItem value="true">Major Only</SelectItem>
                <SelectItem value="false">Non-Major</SelectItem>
              </SelectContent>
            </Select>

            <Select value={isCustomFilter} onValueChange={setIsCustomFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="false">Standard (EU)</SelectItem>
                <SelectItem value="true">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AC-008.5: Allergens table */}
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
                    onClick={() => handleSort('is_major')}
                  >
                    Is Major {sortBy === 'is_major' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading allergens...
                    </TableCell>
                  </TableRow>
                ) : allergens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No allergens found. Click &ldquo;Add Allergen&rdquo; to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  allergens.map((allergen) => (
                    <TableRow key={allergen.id}>
                      <TableCell className="font-mono font-medium">{allergen.code}</TableCell>
                      <TableCell>{allergen.name}</TableCell>
                      <TableCell>
                        {/* AC-008.5: Is Major badge (orange/gray) */}
                        {allergen.is_major ? (
                          <Badge variant="default" className="bg-orange-500">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {/* AC-008.5: Is Custom badge (blue/gray) */}
                        {allergen.is_custom ? (
                          <Badge variant="default" className="bg-blue-500">Custom</Badge>
                        ) : (
                          <Badge variant="secondary">Standard</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* AC-008.5: Product count (Epic 2 JOIN) */}
                        {allergen.product_count || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingAllergen(allergen)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {/* AC-008.2: Delete button disabled for preloaded allergens */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingAllergen(allergen)}
                            disabled={!canDelete(allergen)}
                            title={!canDelete(allergen) ? 'Cannot delete EU major allergen' : 'Delete allergen'}
                          >
                            <Trash2 className={`h-4 w-4 ${!canDelete(allergen) ? 'text-muted-foreground' : 'text-destructive'}`} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* AC-008.5: Info banner for EU allergens */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">EU Major Allergens (Regulation EU 1169/2011)</p>
              <p className="text-blue-700 dark:text-blue-300">
                14 EU major allergens are preloaded and cannot be deleted. You can add custom allergens as needed for your organization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAllergen) && (
        <AllergenFormModal
          allergen={editingAllergen}
          onClose={() => {
            setShowCreateModal(false)
            setEditingAllergen(null)
          }}
          onSuccess={() => {
            fetchAllergens()
            setShowCreateModal(false)
            setEditingAllergen(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingAllergen && (
        <AlertDialog open={!!deletingAllergen} onOpenChange={() => setDeletingAllergen(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete custom allergen?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{deletingAllergen.name}&rdquo;? This action cannot be undone.
                {deletingAllergen.product_count && deletingAllergen.product_count > 0 && (
                  <span className="block mt-2 text-destructive font-semibold">
                    Warning: This allergen is used by {deletingAllergen.product_count} product(s).
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(deletingAllergen)}
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
