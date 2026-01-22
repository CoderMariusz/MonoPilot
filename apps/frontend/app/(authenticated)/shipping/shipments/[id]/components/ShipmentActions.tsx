/**
 * ShipmentActions Component
 * Story 07.14: Shipment Manifest & Ship + Tracking
 *
 * Action buttons for shipment workflow (Manifest, Ship, Mark Delivered, View Tracking)
 * - Status-based enabling/disabling
 * - Permission-based visibility
 * - Loading states with spinner
 * - Keyboard navigation support
 */

'use client'

import { Button } from '@/components/ui/button'
import { Loader2, FileText, Truck, CheckCircle, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

export type ShipmentStatus =
  | 'pending'
  | 'packing'
  | 'packed'
  | 'manifested'
  | 'shipped'
  | 'delivered'
  | 'exception'

export type UserRole = 'Admin' | 'Manager' | 'Warehouse' | 'Picker' | 'Viewer'

export interface Shipment {
  id: string
  shipment_number: string
  status: ShipmentStatus
  customer_name: string
  packed_at: string | null
  manifested_at: string | null
  shipped_at: string | null
  delivered_at: string | null
}

export interface ShipmentActionsProps {
  shipment: Shipment
  onManifest: (shipmentId: string) => Promise<void> | void
  onShip: (shipmentId: string) => Promise<void> | void
  onMarkDelivered: (shipmentId: string) => Promise<void> | void
  onViewTracking: (shipmentId: string) => void
  userRole: UserRole
  isLoading?: boolean
}

// =============================================================================
// Helper Functions
// =============================================================================

const canManifest = (status: ShipmentStatus): boolean => {
  return status === 'packed'
}

const canShip = (status: ShipmentStatus): boolean => {
  return status === 'manifested' || status === 'packed'
}

const canMarkDelivered = (status: ShipmentStatus, role: UserRole): boolean => {
  if (status !== 'shipped') return false
  return role === 'Manager' || role === 'Admin'
}

const canViewTracking = (status: ShipmentStatus): boolean => {
  return status === 'shipped' || status === 'delivered'
}

const canSeeDeliveredButton = (role: UserRole): boolean => {
  return role === 'Manager' || role === 'Admin'
}

// =============================================================================
// Component
// =============================================================================

export function ShipmentActions({
  shipment,
  onManifest,
  onShip,
  onMarkDelivered,
  onViewTracking,
  userRole,
  isLoading = false,
}: ShipmentActionsProps) {
  const manifestEnabled = canManifest(shipment.status) && !isLoading
  const shipEnabled = canShip(shipment.status) && shipment.status !== 'packed' && !isLoading
  const deliveredEnabled = canMarkDelivered(shipment.status, userRole) && !isLoading
  const trackingEnabled = canViewTracking(shipment.status) && !isLoading

  const showDeliveredButton = canSeeDeliveredButton(userRole)

  const handleManifest = () => {
    if (manifestEnabled) {
      onManifest(shipment.id)
    }
  }

  const handleShip = () => {
    if (shipEnabled) {
      onShip(shipment.id)
    }
  }

  const handleMarkDelivered = () => {
    if (deliveredEnabled) {
      onMarkDelivered(shipment.id)
    }
  }

  const handleViewTracking = () => {
    if (trackingEnabled) {
      onViewTracking(shipment.id)
    }
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      data-testid="shipment-actions"
      role="group"
      aria-label="Shipment actions"
    >
      {/* Manifest Button */}
      <Button
        variant="outline"
        onClick={handleManifest}
        disabled={!manifestEnabled}
        aria-disabled={!manifestEnabled}
        aria-label={
          manifestEnabled
            ? 'Manifest Shipment'
            : `Manifest Shipment - Disabled: ${
                shipment.status === 'packed' ? 'Loading' : `Status is ${shipment.status}`
              }`
        }
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" data-testid="loading-spinner" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        Manifest
      </Button>

      {/* Ship Button */}
      <Button
        variant="destructive"
        onClick={handleShip}
        disabled={!shipEnabled}
        aria-disabled={!shipEnabled}
        aria-label={
          shipEnabled
            ? 'Ship Shipment'
            : `Ship Shipment - Disabled: ${
                shipment.status === 'manifested' || shipment.status === 'packed'
                  ? 'Loading'
                  : `Status is ${shipment.status}`
              }`
        }
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" data-testid="loading-spinner" />
        ) : (
          <Truck className="h-4 w-4 mr-2" />
        )}
        Ship
      </Button>

      {/* Mark Delivered Button - Only visible for Manager/Admin */}
      {showDeliveredButton && (
        <Button
          variant="outline"
          onClick={handleMarkDelivered}
          disabled={!deliveredEnabled}
          aria-disabled={!deliveredEnabled}
          aria-label={
            deliveredEnabled
              ? 'Mark Delivered'
              : `Mark Delivered - Disabled: ${
                  shipment.status === 'shipped' ? 'Loading' : `Status is ${shipment.status}`
                }`
          }
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" data-testid="loading-spinner" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          Mark Delivered
        </Button>
      )}

      {/* View Tracking Button */}
      <Button
        variant="outline"
        onClick={handleViewTracking}
        disabled={!trackingEnabled}
        aria-disabled={!trackingEnabled}
        aria-label={
          trackingEnabled
            ? 'View Tracking'
            : `View Tracking - Disabled: ${
                shipment.status === 'shipped' || shipment.status === 'delivered'
                  ? 'Loading'
                  : `Status is ${shipment.status}`
              }`
        }
      >
        <MapPin className="h-4 w-4 mr-2" />
        View Tracking
      </Button>
    </div>
  )
}

export default ShipmentActions
