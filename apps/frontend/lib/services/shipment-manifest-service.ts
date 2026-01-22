/**
 * Shipment Manifest Service (Story 07.14)
 * Purpose: Business logic for shipment manifest, ship, deliver, and tracking operations
 *
 * Handles:
 * - manifestShipment: Validate SSCC completeness, update to manifested status
 * - shipShipment: Consume LPs, update SO cascade, wrapped in transaction
 * - markDelivered: Update to delivered status (Manager+ only)
 * - getTrackingInfo: Return timeline and carrier URL
 * - getCarrierTrackingUrl: Generate carrier-specific tracking URLs
 *
 * IMPORTANT: Ship operation is IRREVERSIBLE - consumes inventory
 */

import { createClient } from '@/lib/supabase/client'
import type {
  ShipmentStatus,
  TrackingInfo,
  TrackingTimeline,
} from '@/lib/validation/manifest-schemas'

// ============================================================================
// Types
// ============================================================================

export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    current_status?: string
    allowed_statuses?: string[]
    missing_boxes?: Array<{ box_number: number; id: string }>
    required_roles?: string[]
    user_role?: string
  }
}

export interface ManifestResult {
  id: string
  shipment_number: string
  status: 'manifested'
  manifested_at: string
  packed_at: string | null
  box_count: number
  boxes: Array<{
    id: string
    box_number: number
    sscc: string
    validated: boolean
  }>
}

export interface ShipResult {
  id: string
  shipment_number: string
  status: 'shipped'
  shipped_at: string
  shipped_by: {
    id: string
    name: string
  }
  sales_order: {
    id: string
    order_number: string
    status: string
    shipped_at: string
  }
  license_plates_consumed: number
  sales_order_lines_updated: number
}

export interface DeliveredResult {
  id: string
  shipment_number: string
  status: 'delivered'
  delivered_at: string
  delivered_by: {
    id: string
    name: string
  }
  sales_order: {
    id: string
    order_number: string
    status: string
  }
}

export interface User {
  id: string
  org_id: string
  role: string
  name: string
}

// ============================================================================
// Carrier Tracking URL Patterns
// ============================================================================

const CARRIER_TRACKING_URLS: Record<string, string> = {
  DHL: 'https://www.dhl.com/en/express/tracking.html?AWB=',
  UPS: 'https://www.ups.com/track?tracknum=',
  DPD: 'https://tracking.dpd.de/status/en_US/parcel/',
  FEDEX: 'https://www.fedex.com/fedextrack/?tracknumbers=',
}

// ============================================================================
// Roles allowed for different operations
// ============================================================================

const MANIFEST_SHIP_ROLES = ['Warehouse', 'Manager', 'Admin', 'warehouse', 'manager', 'admin', 'owner', 'super_admin']
const MARK_DELIVERED_ROLES = ['Manager', 'Admin', 'manager', 'admin', 'owner', 'super_admin']

// ============================================================================
// ShipmentManifestService Class
// ============================================================================

export class ShipmentManifestService {
  // ==========================================================================
  // Manifest Shipment
  // ==========================================================================

  /**
   * Manifest a shipment - validate SSCC completeness and update status
   *
   * @param shipmentId Shipment ID to manifest
   * @returns ServiceResult with manifest result or error
   *
   * Business Rules:
   * - Shipment status must be 'packed'
   * - All boxes must have SSCC assigned
   * - On success: status -> 'manifested', manifested_at -> NOW()
   */
  static async manifestShipment(shipmentId: string): Promise<ServiceResult<ManifestResult>> {
    const supabase = createClient()

    // Get shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id, shipment_number, status, packed_at, org_id, sales_order_id')
      .eq('id', shipmentId)
      .single()

    if (shipmentError || !shipment) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Shipment not found',
        },
      }
    }

    // Validate status
    if (shipment.status !== 'packed') {
      return {
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: "Shipment must be in 'packed' status to manifest",
          current_status: shipment.status,
          allowed_statuses: ['packed'],
        },
      }
    }

    // Get boxes and validate SSCC
    const { data: boxes, error: boxesError } = await supabase
      .from('shipment_boxes')
      .select('id, box_number, sscc, weight')
      .eq('shipment_id', shipmentId)
      .order('box_number')

    if (boxesError || !boxes) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch shipment boxes',
        },
      }
    }

    // Check for missing SSCC
    const missingSSCC = boxes.filter((box) => !box.sscc)
    if (missingSSCC.length > 0) {
      return {
        success: false,
        error: {
          code: 'SSCC_VALIDATION_FAILED',
          message: `Cannot manifest: ${missingSSCC.length} boxes missing SSCC`,
          missing_boxes: missingSSCC.map((box) => ({
            box_number: box.box_number,
            id: box.id,
          })),
        },
      }
    }

    // Update shipment to manifested
    const manifestedAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('shipments')
      .update({
        status: 'manifested',
        manifested_at: manifestedAt,
      })
      .eq('id', shipmentId)

    if (updateError) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update shipment status',
        },
      }
    }

    return {
      success: true,
      data: {
        id: shipment.id,
        shipment_number: shipment.shipment_number,
        status: 'manifested',
        manifested_at: manifestedAt,
        packed_at: shipment.packed_at,
        box_count: boxes.length,
        boxes: boxes.map((box) => ({
          id: box.id,
          box_number: box.box_number,
          sscc: box.sscc!,
          validated: true,
        })),
      },
    }
  }

  // ==========================================================================
  // Ship Shipment
  // ==========================================================================

  /**
   * Ship a shipment - IRREVERSIBLE: consume LPs, update SO cascade
   *
   * @param shipmentId Shipment ID to ship
   * @param confirm Must be true to confirm ship action
   * @param user Current user for shipped_by tracking
   * @returns ServiceResult with ship result or error
   *
   * Business Rules:
   * - Shipment status must be 'manifested' or 'packed' (MVP skip manifest)
   * - confirm parameter must be true
   * - Within transaction: update shipment, LPs, SO, SO lines
   * - On failure: rollback entire transaction
   */
  static async shipShipment(
    shipmentId: string,
    confirm: boolean | undefined,
    user: User
  ): Promise<ServiceResult<ShipResult>> {
    const supabase = createClient()

    // Validate confirmation
    if (confirm !== true) {
      return {
        success: false,
        error: {
          code: 'CONFIRMATION_REQUIRED',
          message: 'Ship action requires explicit confirmation (confirm=true)',
        },
      }
    }

    // Get shipment with sales order
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select(`
        id,
        shipment_number,
        status,
        sales_order_id,
        sales_orders!shipments_sales_order_id_fkey(
          id,
          order_number,
          status
        )
      `)
      .eq('id', shipmentId)
      .single()

    if (shipmentError || !shipment) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Shipment not found',
        },
      }
    }

    // Validate status - allow manifested or packed (MVP)
    if (shipment.status !== 'manifested' && shipment.status !== 'packed') {
      return {
        success: false,
        error: {
          code: 'NOT_MANIFESTED',
          message: 'Shipment must be manifested or packed before shipping',
          current_status: shipment.status,
          allowed_statuses: ['manifested', 'packed'],
        },
      }
    }

    const shippedAt = new Date().toISOString()

    // Try to use RPC for transaction, fallback to sequential updates
    const { data: rpcResult, error: rpcError } = await supabase.rpc('ship_shipment', {
      p_shipment_id: shipmentId,
      p_shipped_at: shippedAt,
      p_shipped_by: user.id,
    })

    // If RPC exists and succeeds, use that result
    if (!rpcError && rpcResult) {
      // Get updated data for response
      const salesOrder = shipment.sales_orders as any

      // Count LPs consumed
      const { count: lpCount } = await supabase
        .from('shipment_box_contents')
        .select('license_plate_id', { count: 'exact' })
        .eq('shipment_box_id', (await supabase
          .from('shipment_boxes')
          .select('id')
          .eq('shipment_id', shipmentId)).data?.map((b: any) => b.id) as unknown as string)

      // Count SO lines updated
      const { count: lineCount } = await supabase
        .from('sales_order_lines')
        .select('id', { count: 'exact' })
        .eq('sales_order_id', shipment.sales_order_id)

      return {
        success: true,
        data: {
          id: shipmentId,
          shipment_number: shipment.shipment_number,
          status: 'shipped',
          shipped_at: shippedAt,
          shipped_by: {
            id: user.id,
            name: user.name,
          },
          sales_order: {
            id: salesOrder?.id || shipment.sales_order_id,
            order_number: salesOrder?.order_number || '',
            status: 'shipped',
            shipped_at: shippedAt,
          },
          license_plates_consumed: lpCount || 0,
          sales_order_lines_updated: lineCount || 0,
        },
      }
    }

    // Fallback: Sequential updates (simulating transaction)
    try {
      // 1. Update shipment status
      const { error: shipmentUpdateError } = await supabase
        .from('shipments')
        .update({
          status: 'shipped',
          shipped_at: shippedAt,
          shipped_by: user.id,
        })
        .eq('id', shipmentId)

      if (shipmentUpdateError) {
        throw new Error('Failed to update shipment')
      }

      // 2. Get box IDs for this shipment
      const { data: boxes } = await supabase
        .from('shipment_boxes')
        .select('id')
        .eq('shipment_id', shipmentId)

      const boxIds = boxes?.map((b) => b.id) || []

      // 3. Get LP IDs from box contents
      const { data: boxContents } = await supabase
        .from('shipment_box_contents')
        .select('license_plate_id')
        .in('shipment_box_id', boxIds)

      const lpIds = boxContents?.map((bc) => bc.license_plate_id) || []
      const lpCount = lpIds.length

      // 4. Update license plates to shipped
      if (lpIds.length > 0) {
        const { error: lpError } = await supabase
          .from('license_plates')
          .update({ status: 'shipped' })
          .in('id', lpIds)

        if (lpError) {
          // Rollback shipment status
          await supabase
            .from('shipments')
            .update({ status: shipment.status, shipped_at: null, shipped_by: null })
            .eq('id', shipmentId)
          throw new Error('Failed to consume license plates')
        }
      }

      // 5. Update sales order
      const salesOrderId = shipment.sales_order_id
      if (salesOrderId) {
        const { error: soError } = await supabase
          .from('sales_orders')
          .update({
            status: 'shipped',
            shipped_at: shippedAt,
          })
          .eq('id', salesOrderId)

        if (soError) {
          // Rollback LP status
          if (lpIds.length > 0) {
            await supabase.from('license_plates').update({ status: 'reserved' }).in('id', lpIds)
          }
          // Rollback shipment status
          await supabase
            .from('shipments')
            .update({ status: shipment.status, shipped_at: null, shipped_by: null })
            .eq('id', shipmentId)
          throw new Error('Failed to update sales order')
        }

        // 6. Update sales order lines
        const { data: soLines, error: linesError } = await supabase
          .from('sales_order_lines')
          .select('id, quantity_packed')
          .eq('sales_order_id', salesOrderId)

        if (!linesError && soLines) {
          for (const line of soLines) {
            await supabase
              .from('sales_order_lines')
              .update({ quantity_shipped: line.quantity_packed || 0 })
              .eq('id', line.id)
          }
        }
      }

      const salesOrder = shipment.sales_orders as any

      return {
        success: true,
        data: {
          id: shipmentId,
          shipment_number: shipment.shipment_number,
          status: 'shipped',
          shipped_at: shippedAt,
          shipped_by: {
            id: user.id,
            name: user.name,
          },
          sales_order: {
            id: salesOrder?.id || salesOrderId || '',
            order_number: salesOrder?.order_number || '',
            status: 'shipped',
            shipped_at: shippedAt,
          },
          license_plates_consumed: lpCount,
          sales_order_lines_updated: (await supabase
            .from('sales_order_lines')
            .select('id', { count: 'exact' })
            .eq('sales_order_id', salesOrderId)).count || 0,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRANSACTION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update shipment inventory',
        },
      }
    }
  }

  // ==========================================================================
  // Mark Delivered
  // ==========================================================================

  /**
   * Mark shipment as delivered (Manager+ only)
   *
   * @param shipmentId Shipment ID to mark delivered
   * @param user Current user (must be Manager or Admin)
   * @returns ServiceResult with delivered result or error
   *
   * Business Rules:
   * - Shipment status must be 'shipped'
   * - User role must be Manager or Admin
   * - Updates shipment and SO status to 'delivered'
   */
  static async markDelivered(shipmentId: string, user: User): Promise<ServiceResult<DeliveredResult>> {
    const supabase = createClient()

    // Check user permission
    const hasPermission = MARK_DELIVERED_ROLES.some(
      (role) => role.toLowerCase() === user.role.toLowerCase()
    )

    if (!hasPermission) {
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Manager role required to mark shipment as delivered',
          user_role: user.role,
          required_roles: ['Manager', 'Admin'],
        },
      }
    }

    // Get shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select(`
        id,
        shipment_number,
        status,
        sales_order_id,
        sales_orders!shipments_sales_order_id_fkey(
          id,
          order_number
        )
      `)
      .eq('id', shipmentId)
      .single()

    if (shipmentError || !shipment) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Shipment not found',
        },
      }
    }

    // Validate status
    if (shipment.status !== 'shipped') {
      return {
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: "Shipment must be in 'shipped' status to mark as delivered",
          current_status: shipment.status,
          allowed_statuses: ['shipped'],
        },
      }
    }

    const deliveredAt = new Date().toISOString()

    // Update shipment
    const { error: updateError } = await supabase
      .from('shipments')
      .update({
        status: 'delivered',
        delivered_at: deliveredAt,
        delivered_by: user.id,
      })
      .eq('id', shipmentId)

    if (updateError) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update shipment status',
        },
      }
    }

    // Update sales order
    if (shipment.sales_order_id) {
      await supabase
        .from('sales_orders')
        .update({ status: 'delivered' })
        .eq('id', shipment.sales_order_id)
    }

    const salesOrder = shipment.sales_orders as any

    return {
      success: true,
      data: {
        id: shipmentId,
        shipment_number: shipment.shipment_number,
        status: 'delivered',
        delivered_at: deliveredAt,
        delivered_by: {
          id: user.id,
          name: user.name,
        },
        sales_order: {
          id: salesOrder?.id || shipment.sales_order_id || '',
          order_number: salesOrder?.order_number || '',
          status: 'delivered',
        },
      },
    }
  }

  // ==========================================================================
  // Get Tracking Info
  // ==========================================================================

  /**
   * Get tracking information for a shipment
   *
   * @param shipmentId Shipment ID
   * @returns ServiceResult with tracking info or error
   */
  static async getTrackingInfo(shipmentId: string): Promise<ServiceResult<TrackingInfo>> {
    const supabase = createClient()

    // Get shipment with user names
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select(`
        id,
        shipment_number,
        status,
        carrier_name,
        tracking_number,
        packed_at,
        packed_by,
        manifested_at,
        shipped_at,
        shipped_by,
        delivered_at,
        delivered_by,
        sales_order_id,
        sales_orders!shipments_sales_order_id_fkey(
          order_number
        )
      `)
      .eq('id', shipmentId)
      .single()

    if (shipmentError || !shipment) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Shipment not found',
        },
      }
    }

    // Get user names for the timeline
    const userIds = [
      shipment.packed_by,
      shipment.shipped_by,
      shipment.delivered_by,
    ].filter(Boolean)

    let userNames: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds)

      userNames = (users || []).reduce(
        (acc: Record<string, string>, u: any) => {
          acc[u.id] = u.name
          return acc
        },
        {} as Record<string, string>
      )
    }

    const salesOrder = shipment.sales_orders as any

    const timeline: TrackingTimeline = {
      packed_at: shipment.packed_at,
      packed_by: shipment.packed_by ? userNames[shipment.packed_by] || null : null,
      manifested_at: shipment.manifested_at,
      manifested_by: null, // manifested_by not tracked in current schema
      shipped_at: shipment.shipped_at,
      shipped_by: shipment.shipped_by ? userNames[shipment.shipped_by] || null : null,
      delivered_at: shipment.delivered_at,
      delivered_by: shipment.delivered_by ? userNames[shipment.delivered_by] || null : null,
    }

    const externalUrl = this.getCarrierTrackingUrl(
      shipment.carrier_name,
      shipment.tracking_number
    )

    return {
      success: true,
      data: {
        shipment_id: shipment.id,
        shipment_number: shipment.shipment_number,
        sales_order_number: salesOrder?.order_number || null,
        carrier: shipment.carrier_name,
        tracking_number: shipment.tracking_number,
        status: shipment.status as ShipmentStatus,
        timeline,
        external_url: externalUrl,
      },
    }
  }

  // ==========================================================================
  // Get Carrier Tracking URL
  // ==========================================================================

  /**
   * Generate carrier-specific tracking URL
   *
   * @param carrier Carrier name (DHL, UPS, DPD, FedEx)
   * @param trackingNumber Tracking number
   * @returns Tracking URL or null if carrier/tracking not provided
   *
   * Supported carriers:
   * - DHL: https://www.dhl.com/en/express/tracking.html?AWB={tracking}
   * - UPS: https://www.ups.com/track?tracknum={tracking}
   * - DPD: https://tracking.dpd.de/status/en_US/parcel/{tracking}
   * - FedEx: https://www.fedex.com/fedextrack/?tracknumbers={tracking}
   */
  static getCarrierTrackingUrl(
    carrier: string | null | undefined,
    trackingNumber: string | null | undefined
  ): string | null {
    if (!carrier || !trackingNumber) {
      return null
    }

    const carrierKey = carrier.toUpperCase()
    const baseUrl = CARRIER_TRACKING_URLS[carrierKey]

    if (!baseUrl) {
      return null
    }

    return `${baseUrl}${trackingNumber}`
  }

  // ==========================================================================
  // Permission Helpers
  // ==========================================================================

  /**
   * Check if user has permission to manifest/ship
   */
  static canManifestOrShip(userRole: string): boolean {
    return MANIFEST_SHIP_ROLES.some((role) => role.toLowerCase() === userRole.toLowerCase())
  }

  /**
   * Check if user has permission to mark delivered
   */
  static canMarkDelivered(userRole: string): boolean {
    return MARK_DELIVERED_ROLES.some((role) => role.toLowerCase() === userRole.toLowerCase())
  }
}
