/**
 * Receive Transfer Order Modal
 * Story 03.9a: TO Partial Shipments (Basic)
 * Refactored to use BaseTransferActionModal (eliminates 95% duplication)
 */

'use client'

import { PackageCheck } from 'lucide-react'
import type { TransferOrderWithLines } from '@/lib/types/transfer-order'
import { BaseTransferActionModal, type ActionConfig, type LineInput } from './BaseTransferActionModal'

interface ReceiveTOModalProps {
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

// Receive modal configuration
const receiveConfig: ActionConfig = {
  title: 'Receive Transfer Order',
  description: 'Enter quantities to receive for each line. Leave at 0 to skip a line.',
  dateLabel: 'Receipt Date',
  actionButtonText: 'Receive All',
  icon: PackageCheck,
  apiEndpoint: '', // Will be set dynamically
  partialDisabledMessage: 'Partial receipts are disabled. All quantities must be received in full.',
  minQtyErrorMessage: 'At least one line must have a receive quantity > 0',
  maxQtyErrorMessage: (line: LineInput) =>
    `Cannot receive ${line.action_qty} ${line.uom} of ${line.product_name}, only ${line.max_qty} ${line.uom} shipped`,
  calculateRemaining: (line: any) => (line.shipped_qty || 0) - (line.received_qty || 0),
  requestBodyMapper: (lines: LineInput[], date: string, notes: string) => ({
    lines: lines.map(line => ({
      line_id: line.line_id,
      receive_qty: line.action_qty,
    })),
    receipt_date: date,
    notes: notes || undefined,
  }),
  tableColumns: {
    col1Label: 'Shipped',
    col2Label: 'Received',
    col3Label: 'Remaining',
    col4Label: 'Receive Now',
  },
  renderCol1: (line: LineInput) => {
    return `${formatNumber(line.shipped_qty || 0)} ${line.uom}`
  },
  renderCol2: (line: LineInput, transferOrder: TransferOrderWithLines) => {
    const toLine = transferOrder.lines?.find((l) => l.id === line.line_id)
    return `${formatNumber(toLine?.received_qty || 0)} ${line.uom}`
  },
  renderCol3: (line: LineInput) => {
    return `${formatNumber(line.remaining_qty)} ${line.uom}`
  },
}

/**
 * Receive Transfer Order Modal
 * - Uses BaseTransferActionModal with receive-specific configuration
 * - Validates qty <= shipped - received
 * - Supports partial receipts (unless disabled by settings)
 */
export function ReceiveTOModal({
  open,
  onClose,
  transferOrder,
  onSuccess,
  allowPartial = true,
}: ReceiveTOModalProps) {
  // Set API endpoint dynamically
  const config = {
    ...receiveConfig,
    apiEndpoint: `/api/planning/transfer-orders/${transferOrder.id}/receive`,
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

export default ReceiveTOModal
