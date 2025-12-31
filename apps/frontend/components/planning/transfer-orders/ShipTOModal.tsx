/**
 * Ship Transfer Order Modal
 * Story 03.9a: TO Partial Shipments (Basic)
 * Refactored to use BaseTransferActionModal (eliminates 95% duplication)
 */

'use client'

import { Truck } from 'lucide-react'
import type { TransferOrderWithLines } from '@/lib/types/transfer-order'
import { BaseTransferActionModal, type ActionConfig, type LineInput } from './BaseTransferActionModal'

interface ShipTOModalProps {
  open: boolean
  onClose: () => void
  transferOrder: TransferOrderWithLines
  onSuccess?: () => void
  allowPartial?: boolean
}

// Format number helper
const formatNumber = (num: number) => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

// Ship modal configuration
const shipConfig: ActionConfig = {
  title: 'Ship Transfer Order',
  description: 'Enter quantities to ship for each line. Leave at 0 to skip a line.',
  dateLabel: 'Shipment Date',
  actionButtonText: 'Ship All',
  icon: Truck,
  apiEndpoint: '', // Will be set dynamically
  partialDisabledMessage: 'Partial shipments are disabled. All quantities must be shipped in full.',
  minQtyErrorMessage: 'At least one line must have a ship quantity > 0',
  maxQtyErrorMessage: (line: LineInput) =>
    `Cannot ship ${line.action_qty} ${line.uom} of ${line.product_name}, only ${line.max_qty} ${line.uom} remaining`,
  calculateRemaining: (line: any) => line.quantity - (line.shipped_qty || 0),
  requestBodyMapper: (lines: LineInput[], date: string, notes: string) => ({
    line_items: lines.map(line => ({
      to_line_id: line.line_id,
      ship_qty: line.action_qty,
    })),
    actual_ship_date: date,
    notes: notes || undefined,
  }),
  tableColumns: {
    col1Label: 'Ordered',
    col2Label: 'Shipped',
    col3Label: 'Remaining',
    col4Label: 'Ship Now',
  },
  renderCol1: (line: LineInput, transferOrder: TransferOrderWithLines) => {
    const toLine = transferOrder.lines?.find((l) => l.id === line.line_id)
    return `${formatNumber(toLine?.quantity || 0)} ${line.uom}`
  },
  renderCol2: (line: LineInput, transferOrder: TransferOrderWithLines) => {
    const toLine = transferOrder.lines?.find((l) => l.id === line.line_id)
    return `${formatNumber(toLine?.shipped_qty || 0)} ${line.uom}`
  },
  renderCol3: (line: LineInput) => {
    return `${formatNumber(line.remaining_qty)} ${line.uom}`
  },
}

/**
 * Ship Transfer Order Modal
 * - Uses BaseTransferActionModal with ship-specific configuration
 * - Validates qty <= remaining
 * - Supports partial shipments (unless disabled by settings)
 */
export function ShipTOModal({
  open,
  onClose,
  transferOrder,
  onSuccess,
  allowPartial = true,
}: ShipTOModalProps) {
  // Set API endpoint dynamically
  const config = {
    ...shipConfig,
    apiEndpoint: `/api/planning/transfer-orders/${transferOrder.id}/ship`,
  }

  return (
    <BaseTransferActionModal
      open={open}
      onClose={onClose}
      transferOrder={transferOrder}
      onSuccess={onSuccess}
      allowPartial={allowPartial}
      config={config}
    />
  )
}

export default ShipTOModal
