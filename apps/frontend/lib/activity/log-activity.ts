/**
 * Activity Logging Utility
 * Story: 1.13 Main Dashboard
 * Task 4: Activity Logging Utility
 *
 * Centralized utility for logging user activities to the activity_logs table.
 * Call from other modules when key events occur (PO approval, WO start, etc.)
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// Types
// ============================================================================

export type ActivityType =
  // Work Orders
  | 'wo_status_change'
  | 'wo_started'
  | 'wo_paused'
  | 'wo_resumed'
  | 'wo_completed'
  // Purchase Orders
  | 'po_created'
  | 'po_approved'
  | 'po_rejected'
  | 'po_received'
  // License Plates
  | 'lp_created'
  | 'lp_received'
  | 'lp_moved'
  | 'lp_split'
  | 'lp_merged'
  // NCRs
  | 'ncr_created'
  | 'ncr_resolved'
  | 'ncr_closed'
  // Transfer Orders
  | 'to_created'
  | 'to_shipped'
  | 'to_received'
  // Quality Holds
  | 'qa_hold_created'
  | 'qa_hold_released'
  // Shipments
  | 'shipment_created'
  | 'shipment_shipped'
  // Users
  | 'user_invited'
  | 'user_activated'
  | 'user_deactivated'
  // Modules
  | 'module_enabled'
  | 'module_disabled'

export type EntityType =
  | 'work_order'
  | 'purchase_order'
  | 'transfer_order'
  | 'license_plate'
  | 'ncr'
  | 'shipment'
  | 'user'
  | 'organization'
  | 'module'

export interface LogActivityParams {
  orgId: string
  userId: string
  activityType: ActivityType
  entityType: EntityType
  entityId: string
  entityCode: string
  description: string
  metadata?: Record<string, any>
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Log an activity to the activity_logs table.
 *
 * @param params - Activity parameters
 * @returns Success/failure result
 *
 * @example
 * ```ts
 * await logActivity({
 *   orgId: user.org_id,
 *   userId: session.user.id,
 *   activityType: 'wo_started',
 *   entityType: 'work_order',
 *   entityId: workOrder.id,
 *   entityCode: 'WO-2024-001',
 *   description: 'Work Order WO-2024-001 started',
 *   metadata: { line_id: 'LINE-01', product_code: 'PROD-001' }
 * })
 * ```
 */
export async function logActivity(
  params: LogActivityParams
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create Supabase client with service role key for server-side logging
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
      )
      return {
        success: false,
        error: 'Missing Supabase configuration',
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Insert activity log
    const { error } = await supabase.from('activity_logs').insert({
      org_id: params.orgId,
      user_id: params.userId,
      activity_type: params.activityType,
      entity_type: params.entityType,
      entity_id: params.entityId,
      entity_code: params.entityCode,
      description: params.description,
      metadata: params.metadata || null,
    })

    if (error) {
      console.error('Failed to log activity:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in logActivity:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Convenience Functions (Optional)
// ============================================================================

/**
 * Log a Work Order activity.
 */
export async function logWorkOrderActivity(
  orgId: string,
  userId: string,
  activityType: Extract<ActivityType, `wo_${string}`>,
  workOrderId: string,
  workOrderCode: string,
  metadata?: Record<string, any>
) {
  const descriptions: Record<
    Extract<ActivityType, `wo_${string}`>,
    string
  > = {
    wo_status_change: `Work Order ${workOrderCode} status changed`,
    wo_started: `Work Order ${workOrderCode} started`,
    wo_paused: `Work Order ${workOrderCode} paused`,
    wo_resumed: `Work Order ${workOrderCode} resumed`,
    wo_completed: `Work Order ${workOrderCode} completed`,
  }

  return logActivity({
    orgId,
    userId,
    activityType,
    entityType: 'work_order',
    entityId: workOrderId,
    entityCode: workOrderCode,
    description: descriptions[activityType],
    metadata,
  })
}

/**
 * Log a Purchase Order activity.
 */
export async function logPurchaseOrderActivity(
  orgId: string,
  userId: string,
  activityType: Extract<ActivityType, `po_${string}`>,
  purchaseOrderId: string,
  purchaseOrderCode: string,
  metadata?: Record<string, any>
) {
  const descriptions: Record<
    Extract<ActivityType, `po_${string}`>,
    string
  > = {
    po_created: `Purchase Order ${purchaseOrderCode} created`,
    po_approved: `Purchase Order ${purchaseOrderCode} approved`,
    po_rejected: `Purchase Order ${purchaseOrderCode} rejected`,
    po_received: `Purchase Order ${purchaseOrderCode} received`,
  }

  return logActivity({
    orgId,
    userId,
    activityType,
    entityType: 'purchase_order',
    entityId: purchaseOrderId,
    entityCode: purchaseOrderCode,
    description: descriptions[activityType],
    metadata,
  })
}

/**
 * Log a License Plate activity.
 */
export async function logLicensePlateActivity(
  orgId: string,
  userId: string,
  activityType: Extract<ActivityType, `lp_${string}`>,
  licensePlateId: string,
  licensePlateCode: string,
  metadata?: Record<string, any>
) {
  const descriptions: Record<Extract<ActivityType, `lp_${string}`>, string> = {
    lp_created: `License Plate ${licensePlateCode} created`,
    lp_received: `License Plate ${licensePlateCode} received`,
    lp_moved: `License Plate ${licensePlateCode} moved`,
    lp_split: `License Plate ${licensePlateCode} split`,
    lp_merged: `License Plate ${licensePlateCode} merged`,
  }

  return logActivity({
    orgId,
    userId,
    activityType,
    entityType: 'license_plate',
    entityId: licensePlateId,
    entityCode: licensePlateCode,
    description: descriptions[activityType],
    metadata,
  })
}

/**
 * Log a User activity.
 */
export async function logUserActivity(
  orgId: string,
  userId: string,
  activityType: Extract<ActivityType, `user_${string}`>,
  targetUserId: string,
  targetUserEmail: string,
  metadata?: Record<string, any>
) {
  const descriptions: Record<Extract<ActivityType, `user_${string}`>, string> =
    {
      user_invited: `User ${targetUserEmail} invited`,
      user_activated: `User ${targetUserEmail} activated`,
      user_deactivated: `User ${targetUserEmail} deactivated`,
    }

  return logActivity({
    orgId,
    userId,
    activityType,
    entityType: 'user',
    entityId: targetUserId,
    entityCode: targetUserEmail,
    description: descriptions[activityType],
    metadata,
  })
}

// ============================================================================
// Usage Examples (for documentation)
// ============================================================================

/*
// Example 1: Log WO start from production module
await logActivity({
  orgId: currentUser.org_id,
  userId: session.user.id,
  activityType: 'wo_started',
  entityType: 'work_order',
  entityId: workOrder.id,
  entityCode: workOrder.wo_code,
  description: `Work Order ${workOrder.wo_code} started`,
  metadata: {
    line_id: workOrder.line_id,
    product_code: workOrder.product_code,
  },
})

// Example 2: Log PO approval from planning module
await logPurchaseOrderActivity(
  currentUser.org_id,
  session.user.id,
  'po_approved',
  purchaseOrder.id,
  purchaseOrder.po_code,
  {
    supplier: purchaseOrder.supplier_name,
    total: purchaseOrder.total_amount,
  }
)

// Example 3: Log LP received from warehouse module
await logLicensePlateActivity(
  currentUser.org_id,
  session.user.id,
  'lp_received',
  licensePlate.id,
  licensePlate.lp_code,
  {
    warehouse: 'WH-01',
    location: 'RCV-01',
  }
)

// Example 4: Log user invitation from settings module
await logUserActivity(
  currentUser.org_id,
  session.user.id,
  'user_invited',
  newUser.id,
  newUser.email,
  {
    role: newUser.role,
  }
)
*/
