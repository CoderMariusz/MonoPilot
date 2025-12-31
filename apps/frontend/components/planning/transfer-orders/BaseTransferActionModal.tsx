/**
 * Base Transfer Action Modal
 * Story 03.9a: TO Partial Shipments (Basic)
 * Refactor: Extracted common logic from ShipTOModal and ReceiveTOModal
 *
 * This component eliminates 95% code duplication between ship and receive modals
 */

'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, LucideIcon } from 'lucide-react'
import type { TransferOrderWithLines } from '@/lib/types/transfer-order'
import { useToast } from '@/hooks/use-toast'

// ============================================================================
// TYPES
// ============================================================================

export interface LineInput {
  line_id: string
  action_qty: number  // Generic: ship_qty or receive_qty
  remaining_qty: number
  max_qty: number
  product_name: string
  product_code: string
  uom: string
  // Additional data for rendering
  ordered_qty?: number
  shipped_qty?: number
  received_qty?: number
}

export interface ActionConfig {
  // UI Labels
  title: string
  description: string
  dateLabel: string
  actionButtonText: string
  icon: LucideIcon

  // API
  apiEndpoint: string
  requestBodyMapper: (lines: LineInput[], date: string, notes: string) => Record<string, unknown>

  // Validation
  partialDisabledMessage: string
  minQtyErrorMessage: string
  maxQtyErrorMessage: (line: LineInput) => string

  // Line initialization
  calculateRemaining: (line: any) => number

  // Table columns
  tableColumns: {
    col1Label: string
    col2Label: string
    col3Label: string
    col4Label: string
  }

  // Cell renderers
  renderCol1: (line: LineInput, transferOrder: TransferOrderWithLines) => ReactNode
  renderCol2: (line: LineInput, transferOrder: TransferOrderWithLines) => ReactNode
  renderCol3: (line: LineInput, transferOrder: TransferOrderWithLines) => ReactNode
}

interface BaseTransferActionModalProps {
  open: boolean
  onClose: () => void
  transferOrder: TransferOrderWithLines
  onSuccess?: () => void
  allowPartial?: boolean
  config: ActionConfig
}

// ============================================================================
// BASE MODAL COMPONENT
// ============================================================================

/**
 * Base Transfer Action Modal
 * - Handles all common logic for ship/receive operations
 * - Configuration-driven UI and behavior
 * - Eliminates code duplication
 */
export function BaseTransferActionModal({
  open,
  onClose,
  transferOrder,
  onSuccess,
  allowPartial = true,
  config,
}: BaseTransferActionModalProps) {
  const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [lineInputs, setLineInputs] = useState<LineInput[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Initialize line inputs when modal opens
  useEffect(() => {
    if (open && transferOrder.lines) {
      const inputs: LineInput[] = transferOrder.lines.map((line) => {
        const remaining = config.calculateRemaining(line)
        return {
          line_id: line.id,
          action_qty: remaining, // Default to remaining qty
          remaining_qty: remaining,
          max_qty: remaining,
          product_name: line.product?.name || 'Unknown',
          product_code: line.product?.code || '',
          uom: line.uom,
          ordered_qty: line.quantity,
          shipped_qty: line.shipped_qty || 0,
          received_qty: line.received_qty || 0,
        }
      })
      setLineInputs(inputs)
      setError(null)
      setNotes('')
    }
  }, [open, transferOrder.lines, config])

  // Handle quantity change for a line
  const handleQtyChange = useCallback((lineId: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setLineInputs((prev) =>
      prev.map((line) =>
        line.line_id === lineId
          ? { ...line, action_qty: Math.max(0, numValue) }
          : line
      )
    )
    setError(null)
  }, [])

  // Fill all remaining
  const handleFillAll = useCallback(() => {
    setLineInputs((prev) =>
      prev.map((line) => ({ ...line, action_qty: line.remaining_qty }))
    )
  }, [])

  // Clear all quantities
  const handleClearAll = useCallback(() => {
    setLineInputs((prev) =>
      prev.map((line) => ({ ...line, action_qty: 0 }))
    )
  }, [])

  // Validate before submit
  const validate = useCallback((): boolean => {
    // Check if at least one line has qty > 0
    const hasQty = lineInputs.some((line) => line.action_qty > 0)
    if (!hasQty) {
      setError(config.minQtyErrorMessage)
      return false
    }

    // Check if any qty exceeds max
    for (const line of lineInputs) {
      if (line.action_qty > line.max_qty) {
        setError(config.maxQtyErrorMessage(line))
        return false
      }
    }

    // If partial not allowed, check all lines are at full qty
    if (!allowPartial) {
      for (const line of lineInputs) {
        if (line.action_qty !== line.remaining_qty && line.remaining_qty > 0) {
          setError(config.partialDisabledMessage)
          return false
        }
      }
    }

    return true
  }, [lineInputs, allowPartial, config])

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const requestBody = config.requestBodyMapper(
        lineInputs.filter((line) => line.action_qty > 0),
        actionDate,
        notes
      )

      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${config.title.toLowerCase()}`)
      }

      toast({
        title: 'Success',
        description: `${transferOrder.to_number} ${config.actionButtonText.toLowerCase()} successfully`,
      })

      onSuccess?.()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to ${config.title.toLowerCase()}`
      setError(message)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format number
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  // Calculate totals
  const totalToAction = lineInputs.reduce((sum, line) => sum + line.action_qty, 0)
  const totalRemaining = lineInputs.reduce((sum, line) => sum + line.remaining_qty, 0)

  const Icon = config.icon

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {config.title} {transferOrder.to_number}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        {!allowPartial && (
          <Alert variant="default" className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {config.partialDisabledMessage}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Date */}
        <div className="space-y-2">
          <Label htmlFor="actionDate">{config.dateLabel}</Label>
          <Input
            id="actionDate"
            type="date"
            value={actionDate}
            onChange={(e) => setActionDate(e.target.value)}
            placeholder={config.dateLabel}
            max={new Date().toISOString().split('T')[0]}
            aria-label={config.dateLabel}
          />
        </div>

        {/* Lines Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right w-28">{config.tableColumns.col1Label}</TableHead>
                <TableHead className="text-right w-28">{config.tableColumns.col2Label}</TableHead>
                <TableHead className="text-right w-28">{config.tableColumns.col3Label}</TableHead>
                <TableHead className="text-right w-32">{config.tableColumns.col4Label}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineInputs.map((line) => (
                <TableRow key={line.line_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{line.product_name}</p>
                      <p className="text-sm text-gray-500">{line.product_code}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {config.renderCol1(line, transferOrder)}
                  </TableCell>
                  <TableCell className="text-right">
                    {config.renderCol2(line, transferOrder)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {config.renderCol3(line, transferOrder)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min="0"
                      max={line.max_qty}
                      step="0.01"
                      value={line.action_qty}
                      onChange={(e) => handleQtyChange(line.line_id, e.target.value)}
                      placeholder={config.actionButtonText}
                      className="w-24 text-right"
                      disabled={line.remaining_qty === 0 || (!allowPartial && line.remaining_qty > 0)}
                      aria-label={`${config.actionButtonText} quantity for ${line.product_name}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="flex justify-between text-sm text-gray-600 px-1">
          <span>
            Total to {config.actionButtonText.toLowerCase()}: <strong>{formatNumber(totalToAction)}</strong>
          </span>
          <span>
            Remaining after: <strong>{formatNumber(totalRemaining - totalToAction)}</strong>
          </span>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleFillAll} disabled={isSubmitting}>
            {config.actionButtonText} All Remaining
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll} disabled={isSubmitting}>
            Clear All
          </Button>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`Optional ${config.actionButtonText.toLowerCase()} notes...`}
            rows={2}
            maxLength={500}
            aria-label={`${config.actionButtonText} notes`}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || totalToAction === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {config.actionButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BaseTransferActionModal
