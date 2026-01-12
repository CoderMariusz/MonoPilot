/**
 * ReceiveSummary Component (Story 05.9)
 * Purpose: Completion summary showing GRN created and variance report
 */

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'
import type { ASNReceiveResult } from '@/lib/types/asn-receive'
import { VarianceBadge } from './VarianceBadge'

interface ReceiveSummaryProps {
  result: ASNReceiveResult
  onClose: () => void
  onReceiveMore?: () => void
}

export function ReceiveSummary({ result, onClose, onReceiveMore }: ReceiveSummaryProps) {
  const hasVariances = result.variances.length > 0
  const varianceCount = result.variances.filter((v) => v.variance !== 0).length

  return (
    <div className="space-y-6" data-testid="receive-success-summary">
      {/* Success Alert */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Receive Completed Successfully</AlertTitle>
        <AlertDescription className="text-green-700">
          <div className="space-y-1 mt-2">
            <div className="font-semibold">GRN: {result.grn_number}</div>
            <div>{result.lps_created} license plates created</div>
            <div>
              ASN Status:{' '}
              <Badge
                className={
                  result.asn_status === 'received'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }
              >
                {result.asn_status}
              </Badge>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Variance Summary */}
      {hasVariances && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Variance Summary ({varianceCount} item{varianceCount !== 1 ? 's' : ''})
          </h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.variances.map((variance) => (
                  <TableRow key={variance.asn_item_id}>
                    <TableCell className="font-medium">{variance.product_name}</TableCell>
                    <TableCell className="text-right">{variance.expected_qty}</TableCell>
                    <TableCell className="text-right">{variance.received_qty}</TableCell>
                    <TableCell>
                      <VarianceBadge
                        variance={variance.variance}
                        expectedQty={variance.expected_qty}
                      />
                    </TableCell>
                    <TableCell>{variance.variance_reason || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {variance.variance_notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onReceiveMore && result.asn_status === 'partial' && (
          <Button variant="outline" onClick={onReceiveMore}>
            Receive More Items
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
