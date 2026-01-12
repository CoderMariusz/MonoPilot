/**
 * LP Merge Selected List Component (Story 05.18)
 * Displays table of selected LPs for merge operation
 *
 * Columns:
 * - LP Number
 * - Product
 * - Quantity
 * - Batch
 * - Expiry
 *
 * Per AC-15
 */

'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface SelectedLP {
  id: string
  lp_number: string
  product_id: string
  product?: { name: string; code: string }
  quantity: number
  uom: string
  batch_number: string | null
  expiry_date: string | null
  qa_status: string
  status: string
  location_id: string
  warehouse_id: string
}

interface LPMergeSelectedListProps {
  selectedLPs: SelectedLP[]
}

export function LPMergeSelectedList({ selectedLPs }: LPMergeSelectedListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>LP Number</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Expiry</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedLPs.map((lp) => (
            <TableRow key={lp.id}>
              <TableCell className="font-medium">{lp.lp_number}</TableCell>
              <TableCell>
                {lp.product?.name || 'Unknown'}
                {lp.product?.code && (
                  <span className="ml-1 text-xs text-gray-500">
                    ({lp.product.code})
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {lp.quantity} {lp.uom}
              </TableCell>
              <TableCell>{lp.batch_number || '-'}</TableCell>
              <TableCell>{lp.expiry_date || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
