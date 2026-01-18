/**
 * Inventory Overview Table Component
 * Wireframe: WH-INV-001 - Overview Tab
 * PRD: FR-WH Inventory Visibility
 *
 * Dynamic table that changes columns based on groupBy mode:
 * - product: Product, Available/Reserved/Blocked qty, LP Count, Avg Age, Value
 * - location: Location Code, Warehouse, LPs, Products, Qty, Occupancy, Value
 * - warehouse: Warehouse Name, LPs, Products, Locations, Value, Expiring, Expired
 */

'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type {
  InventoryGroupBy,
  InventoryByProduct,
  InventoryByLocation,
  InventoryByWarehouse,
  InventoryPagination,
} from '@/lib/types/inventory-overview'
import { MoreVertical, Eye, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatNumber } from '@/lib/utils/format'

// =============================================================================
// Types
// =============================================================================

interface InventoryOverviewTableProps {
  data: (InventoryByProduct | InventoryByLocation | InventoryByWarehouse)[]
  groupBy: InventoryGroupBy
  pagination: InventoryPagination
  onPageChange: (page: number) => void
  onSort?: (column: string) => void
  sortColumn?: string | null
  sortDirection?: 'asc' | 'desc'
  isLoading?: boolean
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border rounded-lg" data-testid="table-skeleton">
      <Table>
        <TableHeader>
          <TableRow>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// =============================================================================
// Sort Header Component
// =============================================================================

function SortableHeader({
  column,
  label,
  sortColumn,
  sortDirection,
  onSort,
  align = 'left',
}: {
  column: string
  label: string
  sortColumn?: string | null
  sortDirection?: 'asc' | 'desc'
  onSort?: (column: string) => void
  align?: 'left' | 'center' | 'right'
}) {
  const isActive = sortColumn === column
  const Icon = isActive
    ? sortDirection === 'asc'
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`
        -ml-3 h-8 data-[state=open]:bg-accent
        ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}
      `}
      onClick={() => onSort?.(column)}
    >
      {label}
      <Icon className={`ml-2 h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
    </Button>
  )
}

// =============================================================================
// Product Table
// =============================================================================

function ProductTable({
  data,
  pagination,
  onPageChange,
  onSort,
  sortColumn,
  sortDirection,
}: Omit<InventoryOverviewTableProps, 'groupBy' | 'data' | 'isLoading'> & { data: InventoryByProduct[] }) {
  const router = useRouter()

  const handleViewLPs = (productId: string, status: string) => {
    router.push(`/warehouse/license-plates?product_id=${productId}&status=${status}`)
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-x-auto" data-testid="inventory-table-product">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortableHeader
                  column="product_name"
                  label="Product"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="available_qty"
                  label="Available"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="reserved_qty"
                  label="Reserved"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="blocked_qty"
                  label="Blocked"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="total_qty"
                  label="Total Qty"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="lp_count"
                  label="LP Count"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="avg_age_days"
                  label="Avg Age"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="total_value"
                  label="Value"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => {
              const availablePct = item.total_qty > 0 ? Math.round((item.available_qty / item.total_qty) * 100) : 0
              const reservedPct = item.total_qty > 0 ? Math.round((item.reserved_qty / item.total_qty) * 100) : 0
              const blockedPct = item.total_qty > 0 ? Math.round((item.blocked_qty / item.total_qty) * 100) : 0

              return (
                <TableRow key={item.product_id} data-testid="inventory-table-row">
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-xs text-muted-foreground">{item.product_sku}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <div className="font-medium text-green-600">{formatNumber(item.available_qty)} {item.uom}</div>
                      <div className="text-xs text-muted-foreground">{availablePct}%</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <div className="font-medium text-yellow-600">{formatNumber(item.reserved_qty)} {item.uom}</div>
                      <div className="text-xs text-muted-foreground">{reservedPct}%</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <div className="font-medium text-red-600">{formatNumber(item.blocked_qty)} {item.uom}</div>
                      <div className="text-xs text-muted-foreground">{blockedPct}%</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(item.total_qty)} {item.uom}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{item.lp_count}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.avg_age_days} days
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total_value)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid="row-actions">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open actions menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {item.available_qty > 0 && (
                          <DropdownMenuItem onClick={() => handleViewLPs(item.product_id, 'available')}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Available LPs
                          </DropdownMenuItem>
                        )}
                        {item.reserved_qty > 0 && (
                          <DropdownMenuItem onClick={() => handleViewLPs(item.product_id, 'reserved')}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Reserved LPs
                          </DropdownMenuItem>
                        )}
                        {item.blocked_qty > 0 && (
                          <DropdownMenuItem onClick={() => handleViewLPs(item.product_id, 'blocked')}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Blocked LPs
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  )
}

// =============================================================================
// Location Table
// =============================================================================

function LocationTable({
  data,
  pagination,
  onPageChange,
  onSort,
  sortColumn,
  sortDirection,
}: Omit<InventoryOverviewTableProps, 'groupBy' | 'data' | 'isLoading'> & { data: InventoryByLocation[] }) {
  const router = useRouter()

  const handleViewLocation = (locationId: string) => {
    router.push(`/warehouse/license-plates?location_id=${locationId}`)
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-x-auto" data-testid="inventory-table-location">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortableHeader
                  column="location_code"
                  label="Location"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  column="warehouse_name"
                  label="Warehouse"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="total_lps"
                  label="Total LPs"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="products_count"
                  label="Products"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="total_qty"
                  label="Total Qty"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="w-[150px]">
                <SortableHeader
                  column="occupancy_pct"
                  label="Occupancy"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="total_value"
                  label="Value"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={item.location_id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleViewLocation(item.location_id)}
                data-testid="inventory-table-row"
              >
                <TableCell className="font-medium">{item.location_code}</TableCell>
                <TableCell>{item.warehouse_name}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{item.total_lps}</Badge>
                </TableCell>
                <TableCell className="text-right">{item.products_count}</TableCell>
                <TableCell className="text-right">{formatNumber(item.total_qty)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={item.occupancy_pct} className="h-2 flex-1" />
                    <span className="text-sm text-muted-foreground w-10 text-right">{item.occupancy_pct}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(item.total_value)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  )
}

// =============================================================================
// Warehouse Table
// =============================================================================

function WarehouseTable({
  data,
  pagination,
  onPageChange,
  onSort,
  sortColumn,
  sortDirection,
}: Omit<InventoryOverviewTableProps, 'groupBy' | 'data' | 'isLoading'> & { data: InventoryByWarehouse[] }) {
  const router = useRouter()

  const handleViewWarehouse = (warehouseId: string) => {
    router.push(`/warehouse/license-plates?warehouse_id=${warehouseId}`)
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-x-auto" data-testid="inventory-table-warehouse">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortableHeader
                  column="warehouse_name"
                  label="Warehouse"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="total_lps"
                  label="Total LPs"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="products_count"
                  label="Products"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="locations_count"
                  label="Locations"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="total_value"
                  label="Value"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="expiring_soon"
                  label="Expiring Soon"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="expired"
                  label="Expired"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={onSort}
                  align="right"
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={item.warehouse_id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleViewWarehouse(item.warehouse_id)}
                data-testid="inventory-table-row"
              >
                <TableCell className="font-medium">{item.warehouse_name}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{item.total_lps}</Badge>
                </TableCell>
                <TableCell className="text-right">{item.products_count}</TableCell>
                <TableCell className="text-right">{item.locations_count}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(item.total_value)}</TableCell>
                <TableCell className="text-right">
                  {item.expiring_soon > 0 ? (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {item.expiring_soon}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {item.expired > 0 ? (
                    <Badge variant="destructive">{item.expired}</Badge>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  )
}

// =============================================================================
// Pagination Component
// =============================================================================

function Pagination({
  pagination,
  onPageChange,
}: {
  pagination: InventoryPagination
  onPageChange: (page: number) => void
}) {
  const { page, pages, total, limit } = pagination
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  if (total === 0) return null

  return (
    <div className="flex items-center justify-between px-2" data-testid="pagination">
      <div className="text-sm text-muted-foreground">
        Showing {start}-{end} of {total} items
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, pages) }, (_, i) => {
            let pageNum: number
            if (pages <= 5) {
              pageNum = i + 1
            } else if (page <= 3) {
              pageNum = i + 1
            } else if (page >= pages - 2) {
              pageNum = pages - 4 + i
            } else {
              pageNum = page - 2 + i
            }
            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="w-8"
                aria-label={`Page ${pageNum}`}
                aria-current={page === pageNum ? 'page' : undefined}
              >
                {pageNum}
              </Button>
            )
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function InventoryOverviewTable({
  data,
  groupBy,
  pagination,
  onPageChange,
  onSort,
  sortColumn,
  sortDirection,
  isLoading = false,
}: InventoryOverviewTableProps) {
  if (isLoading) {
    return <TableSkeleton />
  }

  const commonProps = {
    pagination,
    onPageChange,
    onSort,
    sortColumn,
    sortDirection,
  }

  switch (groupBy) {
    case 'product':
      return <ProductTable data={data as InventoryByProduct[]} {...commonProps} />
    case 'location':
      return <LocationTable data={data as InventoryByLocation[]} {...commonProps} />
    case 'warehouse':
      return <WarehouseTable data={data as InventoryByWarehouse[]} {...commonProps} />
    default:
      return <ProductTable data={data as InventoryByProduct[]} {...commonProps} />
  }
}
