/**
 * LP Data Table Component
 * Story 05.1: License Plates UI
 */

'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LPStatusBadge } from './LPStatusBadge'
import { LPQAStatusBadge } from './LPQAStatusBadge'
import { LPExpiryIndicator } from './LPExpiryIndicator'
import type { LPListItem } from '@/lib/types/license-plate'
import { MoreVertical, Eye } from 'lucide-react'

interface LPDataTableProps {
  data: LPListItem[]
  isLoading: boolean
  onRowClick: (lp: LPListItem) => void
  onBlock?: (lp: LPListItem) => void
  onUnblock?: (lp: LPListItem) => void
  onUpdateQA?: (lp: LPListItem) => void
}

export function LPDataTable({ data, isLoading, onRowClick, onBlock, onUnblock, onUpdateQA }: LPDataTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg" data-testid="lp-loading">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>LP Number</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Qty / UoM</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>QA Status</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="border rounded-lg" data-testid="lp-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>LP Number</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Qty / UoM</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>QA Status</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((lp) => (
            <TableRow
              key={lp.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onRowClick(lp)}
              data-testid="lp-table-row"
            >
              <TableCell>
                <div>
                  <div className="font-medium" data-testid="lp-number">{lp.lp_number}</div>
                  {lp.batch_number && (
                    <div className="text-xs text-muted-foreground">Batch: {lp.batch_number}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{lp.product?.name || '—'}</div>
                  {lp.product?.code && (
                    <div className="text-xs text-muted-foreground">SKU: {lp.product.code}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{lp.quantity.toLocaleString()} {lp.uom}</div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{lp.location?.full_path || '—'}</div>
                  {lp.location?.code && (
                    <div className="text-xs text-muted-foreground">Code: {lp.location.code}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <LPStatusBadge status={lp.status} size="sm" expiryDate={lp.expiry_date} />
              </TableCell>
              <TableCell>
                <LPQAStatusBadge qaStatus={lp.qa_status} size="sm" />
              </TableCell>
              <TableCell>
                <LPExpiryIndicator expiryDate={lp.expiry_date} format="short" />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="row-actions">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onRowClick(lp)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {lp.status === 'available' && onBlock && (
                      <DropdownMenuItem onClick={() => onBlock(lp)}>
                        Block LP
                      </DropdownMenuItem>
                    )}
                    {lp.status === 'blocked' && onUnblock && (
                      <DropdownMenuItem onClick={() => onUnblock(lp)}>
                        Unblock LP
                      </DropdownMenuItem>
                    )}
                    {onUpdateQA && (
                      <DropdownMenuItem onClick={() => onUpdateQA(lp)}>
                        Update QA Status
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
