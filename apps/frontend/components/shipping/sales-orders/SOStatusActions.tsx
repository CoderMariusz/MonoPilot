/**
 * SO Status Actions Component
 * Story 07.3: SO Status Workflow
 *
 * Renders action buttons based on current order status
 * - Hold button: shown for draft/confirmed orders
 * - Cancel button: shown for draft/confirmed/on_hold/allocated orders
 * - Confirm/Release Hold button: shown for draft/on_hold orders
 * - Buttons are disabled when action not allowed for current status
 * - Tooltips explain why buttons are disabled
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  CheckCircle,
  PauseCircle,
  XCircle,
  MoreVertical,
} from 'lucide-react'
import type { SOStatus } from '@/lib/services/sales-order-service'
import { SOStatusService } from '@/lib/services/so-status-service'
import type { SalesOrderStatus } from '@/lib/validation/so-status-schemas'
import { HoldOrderDialog } from './HoldOrderDialog'
import { CancelOrderDialog } from './CancelOrderDialog'
import { ConfirmOrderDialog } from './ConfirmOrderDialog'

// =============================================================================
// Types
// =============================================================================

interface SOStatusActionsProps {
  orderId: string
  orderNumber: string
  currentStatus: SOStatus
  onStatusChange?: () => void
  variant?: 'buttons' | 'dropdown'
  showConfirm?: boolean
  showHold?: boolean
  showCancel?: boolean
}

// =============================================================================
// Component
// =============================================================================

export function SOStatusActions({
  orderId,
  orderNumber,
  currentStatus,
  onStatusChange,
  variant = 'buttons',
  showConfirm = true,
  showHold = true,
  showCancel = true,
}: SOStatusActionsProps) {
  const [holdDialogOpen, setHoldDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  // Check permissions using service (single source of truth)
  const holdEnabled = SOStatusService.canHold(currentStatus as SalesOrderStatus)
  const cancelEnabled = SOStatusService.canCancel(currentStatus as SalesOrderStatus)
  const confirmEnabled = SOStatusService.canConfirm(currentStatus as SalesOrderStatus)

  // Is this a release from hold action?
  const isReleaseFromHold = currentStatus === 'on_hold'

  // Handle status change callback
  const handleStatusChange = () => {
    onStatusChange?.()
  }

  // Render dropdown variant
  if (variant === 'dropdown') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Order actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {showConfirm && confirmEnabled && (
              <DropdownMenuItem onClick={() => setConfirmDialogOpen(true)}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" aria-hidden="true" />
                {isReleaseFromHold ? 'Release from Hold' : 'Confirm Order'}
              </DropdownMenuItem>
            )}

            {showHold && holdEnabled && (
              <DropdownMenuItem onClick={() => setHoldDialogOpen(true)}>
                <PauseCircle className="h-4 w-4 mr-2 text-yellow-600" aria-hidden="true" />
                Hold Order
              </DropdownMenuItem>
            )}

            {(showConfirm || showHold) && showCancel && cancelEnabled && (
              <DropdownMenuSeparator />
            )}

            {showCancel && cancelEnabled && (
              <DropdownMenuItem
                onClick={() => setCancelDialogOpen(true)}
                className="text-red-600 focus:text-red-600"
              >
                <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                Cancel Order
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dialogs */}
        <HoldOrderDialog
          orderId={orderId}
          orderNumber={orderNumber}
          currentStatus={currentStatus}
          open={holdDialogOpen}
          onOpenChange={setHoldDialogOpen}
          onSuccess={handleStatusChange}
        />
        <CancelOrderDialog
          orderId={orderId}
          orderNumber={orderNumber}
          currentStatus={currentStatus}
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          onSuccess={handleStatusChange}
        />
        <ConfirmOrderDialog
          orderId={orderId}
          orderNumber={orderNumber}
          currentStatus={currentStatus}
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          onSuccess={handleStatusChange}
        />
      </>
    )
  }

  // Render buttons variant
  return (
    <>
      <TooltipProvider>
        <div className="flex items-center gap-2">
          {/* Confirm / Release Hold Button */}
          {showConfirm && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!confirmEnabled}
                    onClick={() => setConfirmDialogOpen(true)}
                    className={confirmEnabled ? 'text-green-600 hover:text-green-700' : ''}
                    aria-label={isReleaseFromHold ? 'Release from hold' : 'Confirm order'}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                    {isReleaseFromHold ? 'Release' : 'Confirm'}
                  </Button>
                </span>
              </TooltipTrigger>
              {!confirmEnabled && (
                <TooltipContent>
                  <p>
                    {currentStatus === 'confirmed'
                      ? 'Order is already confirmed'
                      : currentStatus === 'cancelled'
                      ? 'Cannot confirm cancelled order'
                      : 'Order has progressed beyond confirmation'}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Hold Button */}
          {showHold && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!holdEnabled}
                    onClick={() => setHoldDialogOpen(true)}
                    className={holdEnabled ? 'text-yellow-600 hover:text-yellow-700' : ''}
                    aria-label="Hold order"
                  >
                    <PauseCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                    Hold
                  </Button>
                </span>
              </TooltipTrigger>
              {!holdEnabled && (
                <TooltipContent>
                  <p>
                    {currentStatus === 'on_hold'
                      ? 'Order is already on hold'
                      : currentStatus === 'cancelled'
                      ? 'Cannot hold cancelled order'
                      : 'Cannot hold order after allocation'}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Cancel Button */}
          {showCancel && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!cancelEnabled}
                    onClick={() => setCancelDialogOpen(true)}
                    className={cancelEnabled ? 'text-red-600 hover:text-red-700' : ''}
                    aria-label="Cancel order"
                  >
                    <XCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                    Cancel
                  </Button>
                </span>
              </TooltipTrigger>
              {!cancelEnabled && (
                <TooltipContent>
                  <p>
                    {currentStatus === 'cancelled'
                      ? 'Order is already cancelled'
                      : 'Cannot cancel order after picking'}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

      {/* Dialogs */}
      <HoldOrderDialog
        orderId={orderId}
        orderNumber={orderNumber}
        currentStatus={currentStatus}
        open={holdDialogOpen}
        onOpenChange={setHoldDialogOpen}
        onSuccess={handleStatusChange}
      />
      <CancelOrderDialog
        orderId={orderId}
        orderNumber={orderNumber}
        currentStatus={currentStatus}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onSuccess={handleStatusChange}
      />
      <ConfirmOrderDialog
        orderId={orderId}
        orderNumber={orderNumber}
        currentStatus={currentStatus}
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onSuccess={handleStatusChange}
      />
    </>
  )
}

export default SOStatusActions
