/**
 * ASN List Page
 * Story 05.8: ASN Management
 * AC-2: ASN List Page with filters, search, pagination
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useASNs, useDeleteASN } from '@/lib/hooks/use-asns'
import { AsnStatusBadge } from '@/components/warehouse/asns/AsnStatusBadge'
import type { ASNFilters, ASNListItem } from '@/lib/types/asn'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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

export default function ASNsPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Filters state
  const [filters, setFilters] = useState<ASNFilters>({
    search: '',
    status: undefined,
    page: 1,
    limit: 20,
    sort: 'expected_date',
    order: 'desc',
  })

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Fetch data
  const { data: asnsData, isLoading, error, refetch } = useASNs(filters)
  const deleteASN = useDeleteASN()

  const asns = asnsData?.data || []
  const totalPages = asnsData?.meta?.pages || 1

  // Handlers
  const handleSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }))
  }, [])

  const handleStatusFilter = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === 'all' ? undefined : (value as any),
      page: 1,
    }))
  }, [])

  const handleRowClick = useCallback(
    (asn: ASNListItem) => {
      router.push(`/warehouse/asns/${asn.id}`)
    },
    [router]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteASN.mutateAsync(id)
        toast({
          title: 'Success',
          description: 'ASN deleted successfully',
        })
        setDeleteId(null)
        refetch()
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to delete ASN',
          variant: 'destructive',
        })
      }
    },
    [deleteASN, toast, refetch]
  )

  const handleSort = useCallback((column: string) => {
    setFilters((prev) => ({
      ...prev,
      sort: column as any,
      order: prev.sort === column && prev.order === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  // Render page structure immediately (show loading state inline)
  const isEmpty = !isLoading && asns.length === 0 && !filters.search && !filters.status

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ASNs</h1>
          <p className="text-muted-foreground text-sm">Advance Shipping Notices</p>
        </div>
        <Button onClick={() => router.push('/warehouse/asns/new')} disabled={isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          New ASN
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3">
        <Input
          name="search"
          placeholder="Search by ASN number, PO number, or supplier..."
          value={filters.search || ''}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-md"
          disabled={isLoading}
        />
        <Select value={filters.status || 'all'} onValueChange={handleStatusFilter} disabled={isLoading}>
          <SelectTrigger name="status_filter" className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="border rounded-lg p-8">
          <Skeleton className="h-[400px] w-full" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading ASNs</h3>
          <p className="text-muted-foreground max-w-md mb-6">{error.message}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && isEmpty && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <h3 className="text-lg font-semibold mb-2">No Advance Shipping Notices</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Get started by creating your first ASN to track incoming shipments.
          </p>
          <Button onClick={() => router.push('/warehouse/asns/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first ASN
          </Button>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !error && !isEmpty && (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('asn_number')}
                  >
                    ASN Number
                  </TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    data-expected-date
                    onClick={() => handleSort('expected_date')}
                  >
                    Expected Date
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asns.map((asn) => (
                  <TableRow
                    key={asn.id}
                    className="cursor-pointer hover:bg-muted/50"
                    data-status={asn.status}
                  >
                    <TableCell
                      onClick={() => handleRowClick(asn)}
                      className="font-medium"
                    >
                      {asn.asn_number}
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(asn)}>
                      {asn.po_number}
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(asn)}>
                      {asn.supplier_name}
                    </TableCell>
                    <TableCell
                      onClick={() => handleRowClick(asn)}
                      data-expected-date
                    >
                      {new Date(asn.expected_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(asn)}>
                      <AsnStatusBadge status={asn.status} />
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(asn)}>
                      {asn.items_count}
                    </TableCell>
                    <TableCell className="text-right">
                      {asn.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Delete"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteId(asn.id)
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between px-4 py-3 border-t"
              aria-label="pagination"
            >
              <div className="text-sm text-muted-foreground">
                Page {filters.page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))
                  }
                  disabled={filters.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
                  }
                  disabled={filters.page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ASN</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete this ASN? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
