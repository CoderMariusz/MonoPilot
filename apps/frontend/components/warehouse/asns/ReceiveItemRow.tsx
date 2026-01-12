/**
 * ReceiveItemRow Component (Story 05.9)
 * Purpose: Individual item row within receive workflow with variance display
 */

import { TableRow, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VarianceBadge } from './VarianceBadge'
import type { ASNReceiveItemPreview, ASNReceiveItem, VarianceReason } from '@/lib/types/asn-receive'
import { VARIANCE_REASON_LABELS } from '@/lib/types/asn-receive'

interface ReceiveItemRowProps {
  item: ASNReceiveItemPreview
  value: ASNReceiveItem
  onChange: (value: ASNReceiveItem) => void
  errors?: Record<string, string>
}

export function ReceiveItemRow({ item, value, onChange, errors }: ReceiveItemRowProps) {
  const variance = value.received_qty - item.remaining_qty
  const hasVariance = variance !== 0

  return (
    <TableRow>
      {/* Product Info */}
      <TableCell>
        <div>
          <div className="font-medium">{item.product_name}</div>
          <div className="text-sm text-muted-foreground">{item.product_sku}</div>
        </div>
      </TableCell>

      {/* Expected Qty */}
      <TableCell className="text-right">
        {item.expected_qty} {item.uom}
      </TableCell>

      {/* Already Received */}
      <TableCell className="text-right">
        {item.received_qty} {item.uom}
      </TableCell>

      {/* Received Qty Input */}
      <TableCell>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={value.received_qty}
          onChange={(e) =>
            onChange({
              ...value,
              received_qty: parseFloat(e.target.value) || 0,
            })
          }
          className="w-24"
          aria-label="received quantity"
        />
        {errors?.received_qty && (
          <div className="text-xs text-red-600 mt-1">{errors.received_qty}</div>
        )}
      </TableCell>

      {/* Variance Badge */}
      <TableCell>
        <VarianceBadge variance={variance} expectedQty={item.remaining_qty} />
      </TableCell>

      {/* Variance Reason (conditional) */}
      <TableCell>
        {hasVariance && (
          <div className="space-y-2">
            <Select
              value={value.variance_reason || ''}
              onValueChange={(val) =>
                onChange({
                  ...value,
                  variance_reason: val as VarianceReason,
                })
              }
            >
              <SelectTrigger className="w-40" aria-label="variance reason">
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VARIANCE_REASON_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="text"
              placeholder="Notes..."
              value={value.variance_notes || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  variance_notes: e.target.value,
                })
              }
              className="w-full"
              aria-label="variance notes"
            />
          </div>
        )}
      </TableCell>

      {/* Supplier Batch / GTIN (pre-filled from ASN) */}
      <TableCell>
        <div className="space-y-1">
          <Input
            type="text"
            value={value.supplier_batch_number || item.supplier_batch_number || ''}
            onChange={(e) =>
              onChange({
                ...value,
                supplier_batch_number: e.target.value,
              })
            }
            placeholder="Supplier batch..."
            className="w-32"
          />
          {item.gtin && (
            <Input
              type="text"
              value={item.gtin}
              readOnly
              className="w-32 text-xs bg-muted"
              placeholder="GTIN"
            />
          )}
        </div>
      </TableCell>

      {/* Internal Batch Number */}
      <TableCell>
        <Input
          type="text"
          value={value.batch_number || ''}
          onChange={(e) =>
            onChange({
              ...value,
              batch_number: e.target.value,
            })
          }
          placeholder="Internal batch..."
          className="w-32"
        />
        {errors?.batch_number && (
          <div className="text-xs text-red-600 mt-1">{errors.batch_number}</div>
        )}
      </TableCell>

      {/* Expiry Date */}
      <TableCell>
        <Input
          type="date"
          value={value.expiry_date || item.expiry_date || ''}
          onChange={(e) =>
            onChange({
              ...value,
              expiry_date: e.target.value,
            })
          }
          className="w-40"
        />
        {errors?.expiry_date && (
          <div className="text-xs text-red-600 mt-1">{errors.expiry_date}</div>
        )}
      </TableCell>
    </TableRow>
  )
}
