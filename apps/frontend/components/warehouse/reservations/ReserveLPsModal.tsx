/**
 * Reserve LPs Modal Component
 * Story: 05.3 - LP Reservations + FIFO/FEFO Picking
 * Wireframe: WH-RES-002
 *
 * Confirmation modal before creating LP reservations for a Work Order material.
 * Shows summary of selected LPs and allocation details.
 *
 * States:
 * - Success: Confirmation view with summary
 * - Loading: Creating reservations (after confirm clicked)
 * - Success: Reservation created successfully
 * - Error: Reservation failed
 */

'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Package } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { LPSelection } from '@/lib/hooks/use-lp-reservations'

// ============================================================================
// TYPES
// ============================================================================

interface ReserveLPsModalProps {
  open: boolean
  woId: string
  woNumber: string
  woName: string
  materialId: string
  materialName: string
  requiredQty: number
  uom: string
  selections: LPSelection[]
  strategy: 'fifo' | 'fefo' | 'none'
  totalReserved: number
  shortfall: number
  warnings?: string[]
  onConfirm: () => Promise<void>
  onCancel: () => void
  onViewReservations?: () => void
}

type ModalState = 'confirm' | 'loading' | 'success' | 'error'

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ConfirmationView({
  woNumber,
  woName,
  materialName,
  requiredQty,
  uom,
  selections,
  strategy,
  totalReserved,
  shortfall,
  warnings,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  woNumber: string
  woName: string
  materialName: string
  requiredQty: number
  uom: string
  selections: LPSelection[]
  strategy: 'fifo' | 'fefo' | 'none'
  totalReserved: number
  shortfall: number
  warnings?: string[]
  onConfirm: () => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const hasShortfall = shortfall > 0

  return (
    <div className="space-y-4">
      {/* WO Context */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Reserve license plates for {woNumber}?</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Work Order:</span>{' '}
            <span className="font-medium">{woNumber}</span>
            {woName && <span className="ml-1 text-muted-foreground">- {woName}</span>}
          </div>
          <div>
            <span className="text-muted-foreground">Material:</span>{' '}
            <span className="font-medium">{materialName}</span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Required:</span>{' '}
            <span className="font-medium">
              {requiredQty} {uom}
            </span>
          </div>
        </div>
      </div>

      {/* Selected LPs */}
      <div className="space-y-3 rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
        <h3 className="text-sm font-medium">Selected License Plates ({selections.length}):</h3>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-white dark:bg-gray-950">
              <tr className="text-left">
                <th className="p-2">LP #</th>
                <th className="p-2">Batch</th>
                <th className="p-2">Location</th>
                <th className="p-2 text-right">Qty</th>
                <th className="p-2">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {selections.map((sel) => (
                <tr key={sel.lpId} className="border-b last:border-0">
                  <td className="p-2 font-mono">{sel.lpNumber}</td>
                  <td className="p-2 text-muted-foreground">{sel.batch || '-'}</td>
                  <td className="p-2 text-muted-foreground">{sel.location}</td>
                  <td className="p-2 text-right tabular-nums">
                    {sel.reservedQty} {uom}
                  </td>
                  <td className="p-2 text-muted-foreground">{formatDate(sel.expiryDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-1 pt-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Reserved:</span>
            <span className="font-semibold">
              {totalReserved} {uom} {!hasShortfall && <CheckCircle2 className="ml-1 inline h-4 w-4 text-green-600" />}
            </span>
          </div>
          {hasShortfall && (
            <div className="flex justify-between text-orange-600">
              <span>Shortfall:</span>
              <span className="font-semibold">
                {shortfall} {uom}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Strategy Badge */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span className="text-sm">
          Picking Strategy: <span className="font-medium">{strategy.toUpperCase()}</span>{' '}
          {strategy === 'fifo' && '(oldest first)'}
          {strategy === 'fefo' && '(earliest expiry first)'}
        </span>
      </div>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="space-y-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-center gap-2 text-sm font-medium text-yellow-800 dark:text-yellow-300">
            <AlertCircle className="h-4 w-4" />
            <span>Warnings:</span>
          </div>
          <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
            {warnings.map((warning, idx) => (
              <li key={idx}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Partial Allocation Warning */}
      {hasShortfall && (
        <div className="space-y-2 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="flex items-center gap-2 text-sm font-medium text-orange-800 dark:text-orange-300">
            <AlertCircle className="h-4 w-4" />
            <span>Partial Allocation</span>
          </div>
          <p className="text-sm text-orange-700 dark:text-orange-400">
            Only {totalReserved} {uom} of {requiredQty} {uom} required can be reserved.
          </p>
          <div className="mt-2 text-sm text-orange-700 dark:text-orange-400">
            <p className="font-medium">You will need to:</p>
            <ul className="mt-1 space-y-1">
              <li>• Reserve additional {shortfall} {uom} when inventory arrives</li>
              <li>• Adjust WO material requirement</li>
              <li>• Split WO into multiple batches</li>
            </ul>
          </div>
          <p className="mt-2 text-sm font-medium text-orange-800 dark:text-orange-300">
            Continue with partial reservation?
          </p>
        </div>
      )}

      {/* Info Note */}
      <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
        <p>
          ℹ️ Once reserved, these LPs will not be available for other work orders until released or consumed.
        </p>
      </div>

      {/* Actions */}
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={isSubmitting}>
          {isSubmitting
            ? 'Confirming...'
            : hasShortfall
              ? `Reserve Partial (${totalReserved} ${uom})`
              : 'Confirm Reservation'}
        </Button>
      </DialogFooter>
    </div>
  )
}

function LoadingView({ selections, uom }: { selections: LPSelection[]; uom: string }) {
  const [progress] = useState(80) // Mock progress

  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <h3 className="text-lg font-semibold">Creating Reservations...</h3>
      <p className="text-sm text-muted-foreground">Reserving {selections.length} license plates</p>

      {/* Progress Bar */}
      <div className="w-full max-w-md space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Per-LP Status */}
        <div className="space-y-1 text-xs">
          {selections.slice(0, 3).map((sel, idx) => (
            <div key={sel.lpId} className="flex items-center gap-2">
              {idx < 2 ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
              <span className="text-muted-foreground">
                {idx < 2 ? '✓' : '⏳'} {sel.lpNumber} {idx < 2 ? 'reserved' : 'reserving'} ({sel.reservedQty} {uom})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SuccessView({
  woNumber,
  selections,
  totalReserved,
  uom,
  onViewReservations,
  onClose,
}: {
  woNumber: string
  selections: LPSelection[]
  totalReserved: number
  uom: string
  onViewReservations?: () => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold">Reservations Created Successfully</h3>
      <div className="text-center text-sm text-muted-foreground">
        <p>
          {selections.length} license plates reserved for {woNumber}
        </p>
        <p className="mt-1 font-medium">
          Total: {totalReserved} {uom}
        </p>
      </div>

      {/* LP List */}
      <div className="w-full max-w-md space-y-1 text-sm">
        {selections.map((sel) => (
          <div key={sel.lpId} className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="font-mono">{sel.lpNumber}</span>
            <span className="text-muted-foreground">
              ({sel.reservedQty} {uom})
            </span>
            {sel.batch && <span className="text-muted-foreground">- Batch {sel.batch}</span>}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-3">
        {onViewReservations && (
          <Button variant="outline" onClick={onViewReservations}>
            View Reservations
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

function ErrorView({
  error,
  onRetry,
  onSelectDifferent,
  onClose,
}: {
  error: string
  onRetry: () => void
  onSelectDifferent: () => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
        <XCircle className="h-10 w-10 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-destructive">Failed to Create Reservations</h3>
      <div className="max-w-md space-y-2 text-center text-sm">
        <p className="text-destructive">{error}</p>
        <p className="text-muted-foreground">
          Another work order may have reserved this LP while you were selecting. Please try again.
        </p>
        <p className="text-xs text-muted-foreground">Error Code: WH-RES-002-INSUFFICIENT-QTY</p>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-3">
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
        <Button variant="secondary" onClick={onSelectDifferent}>
          Select Different LPs
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ReserveLPsModal({
  open,
  woId,
  woNumber,
  woName,
  materialId,
  materialName,
  requiredQty,
  uom,
  selections,
  strategy,
  totalReserved,
  shortfall,
  warnings,
  onConfirm,
  onCancel,
  onViewReservations,
}: ReserveLPsModalProps) {
  const [state, setState] = useState<ModalState>('confirm')
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setState('loading')
    setError(null)

    try {
      await onConfirm()
      setState('success')

      // Auto-close after 3 seconds
      setTimeout(() => {
        onCancel()
        setState('confirm')
      }, 3000)
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Failed to create reservations')
    }
  }

  const handleRetry = async () => {
    await handleConfirm()
  }

  const handleSelectDifferent = () => {
    setState('confirm')
    setError(null)
    onCancel()
  }

  const handleClose = () => {
    setState('confirm')
    setError(null)
    onCancel()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>
            {state === 'confirm' && 'Confirm Reservation'}
            {state === 'loading' && 'Confirm Reservation'}
            {state === 'success' && 'Reservation Successful'}
            {state === 'error' && 'Reservation Failed'}
          </DialogTitle>
        </DialogHeader>

        {state === 'confirm' && (
          <ConfirmationView
            woNumber={woNumber}
            woName={woName}
            materialName={materialName}
            requiredQty={requiredQty}
            uom={uom}
            selections={selections}
            strategy={strategy}
            totalReserved={totalReserved}
            shortfall={shortfall}
            warnings={warnings}
            onConfirm={handleConfirm}
            onCancel={handleClose}
            isSubmitting={false}
          />
        )}

        {state === 'loading' && <LoadingView selections={selections} uom={uom} />}

        {state === 'success' && (
          <SuccessView
            woNumber={woNumber}
            selections={selections}
            totalReserved={totalReserved}
            uom={uom}
            onViewReservations={onViewReservations}
            onClose={handleClose}
          />
        )}

        {state === 'error' && error && (
          <ErrorView
            error={error}
            onRetry={handleRetry}
            onSelectDifferent={handleSelectDifferent}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
