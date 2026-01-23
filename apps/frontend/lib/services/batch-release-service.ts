/**
 * Batch Release Service (Story 06.11)
 * Purpose: Business logic for batch release approval workflow
 *
 * Handles:
 * - checkReleaseReadiness(batchNumber) - Validates release criteria
 * - getEvidenceSummary(inspectionId) - Aggregates quality evidence
 * - approveBatchRelease(batchNumber, input, userId) - Approves release
 * - submitForApproval(batchNumber, checklist, userId) - Inspector submit
 * - updateLPReleaseStatus(lpId, status, userId) - Updates LP status
 * - getOutputLPs(batchNumber) - Retrieves batch LPs
 * - list(params) - Lists release records with pagination
 * - getBatchStatus(batchNumber) - Returns batch QA status
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.11.final-inspection-batch-release.md}
 */

import { createClient } from '@/lib/supabase/client'
import type {
  ReleaseCheckResult,
  EvidenceSummary,
  BatchReleaseRecord,
  BatchReleaseResponse,
  BatchReleaseListResponse,
  ReleaseChecklist,
} from '@/lib/validation/batch-release-schemas'

// Re-export types for consumers
export type {
  ReleaseCheckResult,
  EvidenceSummary,
  BatchReleaseRecord,
  BatchReleaseResponse,
  BatchReleaseListResponse,
  ReleaseChecklist,
}

// ============================================================================
// Types
// ============================================================================

export interface BatchReleaseInput {
  release_decision: 'approved' | 'rejected' | 'conditional'
  checklist: {
    test_results: boolean
    ccp_records: boolean
    checkpoints: boolean
    label_verify: boolean
    spec_review: boolean
    ncr_review: boolean
  }
  conditional_reason?: string
  conditional_restrictions?: string
  conditional_expires_at?: string
  rejection_reason?: string
  approval_notes?: string
  lp_ids?: string[]
  lp_decisions?: Array<{
    lp_id: string
    status: 'released' | 'hold' | 'rejected'
    notes?: string
  }>
}

export interface BatchReleaseListParams {
  release_decision?: 'pending' | 'approved' | 'rejected' | 'conditional'
  product_id?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

export interface LicensePlateWithRelease {
  id: string
  lp_number: string
  product_id: string
  quantity: number
  release_status: string
  released_by: string | null
  released_at: string | null
}

export interface BatchStatus {
  batch_number: string
  wo_id: string
  product: {
    id: string
    name: string
    sku: string
  }
  qa_status: {
    final_inspection_status: string | null
    final_inspection_result: string | null
    release_status: 'pending' | 'approved' | 'rejected' | 'conditional'
    released_at: string | null
    released_by: string | null
  }
  lp_summary: {
    total: number
    released: number
    pending: number
    rejected: number
    hold: number
  }
  can_ship: boolean
  restrictions?: string
}

// ============================================================================
// Approval Roles Constant
// ============================================================================

const APPROVAL_ROLES = ['QA_MANAGER', 'QUALITY_DIRECTOR', 'ADMIN'] as const

// ============================================================================
// Private Helper Methods
// ============================================================================

/**
 * Query WO with product details by batch number
 */
async function getWorkOrderByBatchNumber(batchNumber: string) {
  const supabase = createClient()
  const { data: wo, error } = await supabase
    .from('work_orders')
    .select(`
      id,
      batch_number,
      product_id,
      produced_quantity,
      products:product_id (
        id,
        name,
        sku
      )
    `)
    .eq('batch_number', batchNumber)
    .single()

  if (error || !wo) {
    throw new Error('404: Batch not found')
  }
  return wo
}

/**
 * Query WO with basic fields by batch number
 */
async function getWorkOrderByBatchNumberBasic(batchNumber: string) {
  const supabase = createClient()
  const { data: wo, error } = await supabase
    .from('work_orders')
    .select('id, product_id, produced_quantity')
    .eq('batch_number', batchNumber)
    .single()

  if (error || !wo) {
    throw new Error('404: Batch not found')
  }
  return wo
}

/**
 * Get final inspection for WO
 */
async function getFinalInspectionForWO(woId: string) {
  const supabase = createClient()
  const { data: inspection } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('reference_type', 'wo')
    .eq('reference_id', woId)
    .eq('inspection_type', 'final')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return inspection || null
}

/**
 * Get user organization context
 */
async function getUserOrgContext(userId: string) {
  const supabase = createClient()
  const { data: userData } = await supabase.from('users').select('org_id').eq('id', userId).single()

  if (!userData?.org_id) {
    throw new Error('403: User organization not found')
  }
  return userData.org_id
}

/**
 * Get output LPs for WO
 */
async function getOutputLpsForWO(woId: string) {
  const supabase = createClient()
  const { data: lps } = await supabase
    .from('license_plates')
    .select('id, quantity')
    .eq('wo_id', woId)
    .eq('source', 'production')

  return lps || []
}

/**
 * Count LP status distribution
 */
function countLpStatusDistribution(lps: Array<{ release_status: string }>) {
  return {
    total: lps.length,
    released: lps.filter((lp) => lp.release_status === 'released').length,
    pending: lps.filter((lp) => lp.release_status === 'pending').length,
    rejected: lps.filter((lp) => lp.release_status === 'rejected').length,
    hold: lps.filter((lp) => lp.release_status === 'hold').length,
  }
}

// ============================================================================
// BatchReleaseService Class
// ============================================================================

export class BatchReleaseService {
  // ==========================================================================
  // Release Check
  // ==========================================================================

  /**
   * Check if batch can be released
   * Returns checklist status and blockers
   */
  static async checkReleaseReadiness(batchNumber: string): Promise<ReleaseCheckResult> {
    // 1. Get WO by batch number
    const wo = await getWorkOrderByBatchNumber(batchNumber)

    // 2. Get final inspection for WO
    const inspection = await getFinalInspectionForWO(wo.id)

    // 3. Get output LPs for the batch
    const lps = await getOutputLpsForWO(wo.id)

    const outputLps = lps.length
    const totalQuantity = lps.reduce((sum, lp) => sum + (lp.quantity || 0), 0)

    // 4. Build checklist
    const finalInspectionExists = !!inspection
    const finalInspectionPassed = inspection?.result === 'pass' || inspection?.result === 'conditional'
    const allTestsPassed = inspection?.result === 'pass'

    // For now, assume CCP records and checkpoints pass (placeholder)
    // In full implementation, these would query respective tables
    const ccpRecordsComplete = true
    const ccpRecordsWithinLimits = true
    const checkpointsPassed = true

    // Check for open NCRs (placeholder - assumes none for now)
    const noOpenNcrs = true

    // 5. Determine blockers and warnings
    const blockers: string[] = []
    const warnings: string[] = []

    if (!finalInspectionExists) {
      blockers.push('Final inspection does not exist')
    } else if (inspection?.result === 'fail') {
      blockers.push('Final inspection failed - cannot release')
    } else if (inspection?.result === 'conditional') {
      warnings.push('Final inspection conditional - restrictions apply')
    }

    if (!noOpenNcrs) {
      blockers.push('Open NCRs exist for this batch - must be resolved before release')
    }

    const canRelease = blockers.length === 0

    // Type assertion for product data
    const productData = wo.products as unknown as { id: string; name: string; sku: string }

    return {
      batch_number: batchNumber,
      wo_id: wo.id,
      product_id: wo.product_id,
      product_name: productData?.name || 'Unknown',
      total_quantity: totalQuantity,
      output_lps: outputLps,
      can_release: canRelease,
      checklist: {
        final_inspection_exists: finalInspectionExists,
        final_inspection_passed: finalInspectionPassed,
        all_tests_passed: allTestsPassed,
        ccp_records_complete: ccpRecordsComplete,
        ccp_records_within_limits: ccpRecordsWithinLimits,
        checkpoints_passed: checkpointsPassed,
        no_open_ncrs: noOpenNcrs,
      },
      final_inspection: inspection
        ? {
            id: inspection.id,
            inspection_number: inspection.inspection_number,
            status: inspection.status,
            result: inspection.result,
          }
        : null,
      blockers,
      warnings,
      suggested_action:
        blockers.length > 0
          ? 'Create NCR and resolve before release'
          : warnings.length > 0
            ? 'Review conditional restrictions before shipping'
            : undefined,
    }
  }

  /**
   * Get evidence summary for final inspection
   */
  static async getEvidenceSummary(inspectionId: string): Promise<EvidenceSummary> {
    const supabase = createClient()

    // 1. Get inspection with WO reference
    const { data: inspection, error: inspError } = await supabase
      .from('quality_inspections')
      .select('*')
      .eq('id', inspectionId)
      .single()

    if (inspError || !inspection) {
      throw new Error('404: Inspection not found')
    }

    // 2. Query in-process inspections for WO
    const { data: ipInspections } = await supabase
      .from('quality_inspections')
      .select('id, inspection_number, result')
      .eq('reference_id', inspection.reference_id)
      .eq('inspection_type', 'in_process')

    const inProcessInspections = ipInspections || []
    const ipPassed = inProcessInspections.filter((i) => i.result === 'pass').length
    const ipFailed = inProcessInspections.filter((i) => i.result === 'fail').length
    const ipConditional = inProcessInspections.filter((i) => i.result === 'conditional').length
    const ipInProgress = inProcessInspections.filter((i) => !i.result).length

    // 3. Query CCP monitoring records (placeholder - no table yet)
    const ccpRecords: unknown[] = []
    const ccpWithinLimits = 0
    const ccpDeviations = 0
    const ccpDeviationsResolved = 0

    // 4. Query operation checkpoints (placeholder - no table yet)
    const checkpoints: unknown[] = []
    const cpPassed = 0
    const cpFailed = 0

    // 5. Query NCRs linked to WO/batch (placeholder - no table yet)
    const ncrs: unknown[] = []
    const ncrsOpen = 0
    const ncrsClosed = 0

    // 6. Calculate overall status
    let overallStatus: 'ready' | 'review_required' | 'blocked' = 'ready'
    const blockers: string[] = []
    const warnings: string[] = []

    if (ncrsOpen > 0) {
      overallStatus = 'blocked'
      blockers.push(`${ncrsOpen} open NCRs exist`)
    }

    if (ipConditional > 0) {
      if (overallStatus !== 'blocked') overallStatus = 'review_required'
      warnings.push(`${ipConditional} in-process inspection with conditional result`)
    }

    if (ccpDeviations > 0 && ccpDeviationsResolved === ccpDeviations) {
      if (overallStatus !== 'blocked') overallStatus = 'review_required'
      warnings.push(`${ccpDeviations} CCP deviation (corrective action recorded)`)
    }

    return {
      inspection_id: inspectionId,
      wo_id: inspection.reference_id,
      batch_number: inspection.batch_number || '',
      in_process_inspections: {
        total: inProcessInspections.length,
        passed: ipPassed,
        failed: ipFailed,
        conditional: ipConditional,
        in_progress: ipInProgress,
        items: inProcessInspections.map((i) => ({
          id: i.id,
          inspection_number: i.inspection_number,
          result: i.result || 'pending',
        })),
      },
      ccp_monitoring: {
        total_records: ccpRecords.length,
        within_limits: ccpWithinLimits,
        deviations: ccpDeviations,
        deviations_resolved: ccpDeviationsResolved,
        items: [],
      },
      operation_checkpoints: {
        total: checkpoints.length,
        passed: cpPassed,
        failed: cpFailed,
        items: [],
      },
      ncrs: {
        open: ncrsOpen,
        closed: ncrsClosed,
        items: [],
      },
      overall_status: overallStatus,
      blockers,
      warnings,
    }
  }

  // ==========================================================================
  // Release Approval
  // ==========================================================================

  /**
   * Create and approve batch release
   */
  static async approveBatchRelease(
    batchNumber: string,
    input: BatchReleaseInput,
    userId: string
  ): Promise<BatchReleaseResponse> {
    const supabase = createClient()

    // 1. Validate user has QA_MANAGER role
    const hasApprovalRole = await this.checkUserHasApprovalRole(userId)
    if (!hasApprovalRole) {
      throw new Error('403: Insufficient permissions')
    }

    // 2. Validate checklist minimum for approval
    if (input.release_decision === 'approved') {
      const checklistValues = Object.values(input.checklist)
      const trueCount = checklistValues.filter(Boolean).length
      if (trueCount < 4) {
        throw new Error('400: At least 4 checklist items must be confirmed')
      }
    }

    // 3. Validate conditional fields
    if (input.release_decision === 'conditional') {
      if (!input.conditional_reason || !input.conditional_restrictions) {
        throw new Error('400: Conditional reason and restrictions required')
      }
    }

    // 4. Validate rejection reason
    if (input.release_decision === 'rejected') {
      if (!input.rejection_reason) {
        throw new Error('400: Rejection reason required')
      }
    }

    // 5. Get WO and validate batch exists
    const wo = await getWorkOrderByBatchNumberBasic(batchNumber)

    // 6. Get final inspection
    const inspection = await getFinalInspectionForWO(wo.id)

    // 7. Get user's org_id
    const orgId = await getUserOrgContext(userId)

    // 8. Create batch release record
    const supabase = createClient()
    const { data: release, error: releaseError } = await supabase
      .from('batch_release_records')
      .insert({
        org_id: orgId,
        batch_number: batchNumber,
        wo_id: wo.id,
        product_id: wo.product_id,
        final_inspection_id: inspection?.id || null,
        checklist_test_results: input.checklist.test_results,
        checklist_ccp_records: input.checklist.ccp_records,
        checklist_checkpoints: input.checklist.checkpoints,
        checklist_label_verify: input.checklist.label_verify,
        checklist_spec_review: input.checklist.spec_review,
        checklist_ncr_review: input.checklist.ncr_review,
        release_decision: input.release_decision,
        release_reason:
          input.release_decision === 'rejected' ? input.rejection_reason : null,
        conditional_reason: input.conditional_reason || null,
        conditional_restrictions: input.conditional_restrictions || null,
        conditional_expires_at: input.conditional_expires_at || null,
        total_quantity: wo.produced_quantity,
        approved_by: userId,
        approved_at: new Date().toISOString(),
        approval_notes: input.approval_notes || null,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single()

    if (releaseError) {
      throw new Error('Database connection failed')
    }

    // 9. Get output LPs and link to release
    const lps = await getOutputLpsForWO(wo.id)

    let lpsReleased = 0
    let lpsRejected = 0

    if (lps.length > 0) {
      // Insert LP release records
      const lpRecords = lps.map((lp) => ({
        release_id: release.id,
        lp_id: lp.id,
        quantity: lp.quantity,
        release_status:
          input.release_decision === 'rejected' ? 'rejected' : 'released',
      }))

      await supabase.from('batch_release_lps').insert(lpRecords)

      // Count based on decision
      if (input.release_decision === 'rejected') {
        lpsRejected = lps.length
      } else {
        lpsReleased = lps.length
      }
    }

    // Update release quantities
    await supabase
      .from('batch_release_records')
      .update({
        released_quantity:
          input.release_decision === 'rejected' ? 0 : wo.produced_quantity,
        rejected_quantity:
          input.release_decision === 'rejected' ? wo.produced_quantity : 0,
      })
      .eq('id', release.id)

    const message =
      input.release_decision === 'rejected'
        ? `Batch ${batchNumber} rejected - LPs blocked from shipping`
        : `Batch ${batchNumber} released for shipping`

    return {
      release: {
        id: release.id,
        org_id: release.org_id,
        release_number: release.release_number,
        batch_number: release.batch_number,
        wo_id: release.wo_id,
        product_id: release.product_id,
        final_inspection_id: release.final_inspection_id,
        checklist_test_results: release.checklist_test_results,
        checklist_ccp_records: release.checklist_ccp_records,
        checklist_checkpoints: release.checklist_checkpoints,
        checklist_label_verify: release.checklist_label_verify,
        checklist_spec_review: release.checklist_spec_review,
        checklist_ncr_review: release.checklist_ncr_review,
        release_decision: release.release_decision,
        release_reason: release.release_reason,
        conditional_reason: release.conditional_reason,
        conditional_restrictions: release.conditional_restrictions,
        conditional_expires_at: release.conditional_expires_at,
        total_quantity: release.total_quantity,
        released_quantity: release.released_quantity,
        rejected_quantity: release.rejected_quantity,
        submitted_by: release.submitted_by,
        submitted_at: release.submitted_at,
        approved_by: release.approved_by,
        approved_at: release.approved_at,
        approval_notes: release.approval_notes,
        created_at: release.created_at,
        created_by: release.created_by,
        updated_at: release.updated_at,
        updated_by: release.updated_by,
      },
      lps_updated: lps.length,
      lps_released: lpsReleased,
      lps_rejected: lpsRejected,
      message,
    }
  }

  /**
   * Submit release for approval (by inspector)
   */
  static async submitForApproval(
    batchNumber: string,
    checklist: ReleaseChecklist,
    userId: string
  ): Promise<Partial<BatchReleaseRecord>> {
    const supabase = createClient()

    // Get WO
    const wo = await getWorkOrderByBatchNumberBasic(batchNumber)

    // Get user's org_id
    const orgId = await getUserOrgContext(userId)

    // Create pending release record
    const { data: release, error: releaseError } = await supabase
      .from('batch_release_records')
      .insert({
        org_id: orgId,
        batch_number: batchNumber,
        wo_id: wo.id,
        product_id: wo.product_id,
        checklist_test_results: checklist.test_results,
        checklist_ccp_records: checklist.ccp_records,
        checklist_checkpoints: checklist.checkpoints,
        checklist_label_verify: checklist.label_verify,
        checklist_spec_review: checklist.spec_review,
        checklist_ncr_review: checklist.ncr_review,
        release_decision: 'pending',
        total_quantity: wo.produced_quantity,
        submitted_by: userId,
        submitted_at: new Date().toISOString(),
        created_by: userId,
      })
      .select()
      .single()

    if (releaseError) {
      throw new Error('Failed to create release record')
    }

    return {
      id: release.id,
      release_decision: release.release_decision,
      submitted_by: release.submitted_by,
      submitted_at: release.submitted_at,
      approved_by: null,
      approved_at: null,
    }
  }

  // ==========================================================================
  // LP Release Status
  // ==========================================================================

  /**
   * Update LP release status
   */
  static async updateLPReleaseStatus(
    lpId: string,
    status: 'released' | 'hold' | 'rejected',
    userId: string,
    notes?: string
  ): Promise<void> {
    const supabase = createClient()

    const updateData: Record<string, unknown> = {
      release_status: status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'released') {
      updateData.released_by = userId
      updateData.released_at = new Date().toISOString()
    }

    if (notes) {
      updateData.release_notes = notes
    }

    const { error } = await supabase.from('license_plates').update(updateData).eq('id', lpId)

    if (error) {
      throw new Error('Failed to update LP release status')
    }
  }

  /**
   * Get output LPs for batch
   */
  static async getOutputLPs(batchNumber: string): Promise<LicensePlateWithRelease[]> {
    const supabase = createClient()

    // Get WO
    const { data: wo } = await supabase
      .from('work_orders')
      .select('id')
      .eq('batch_number', batchNumber)
      .single()

    if (!wo) {
      return []
    }

    const { data: lps } = await supabase
      .from('license_plates')
      .select('id, lp_number, product_id, quantity, release_status, released_by, released_at')
      .eq('wo_id', wo.id)
      .eq('source', 'production')

    return (lps || []).map((lp) => ({
      id: lp.id,
      lp_number: lp.lp_number,
      product_id: lp.product_id,
      quantity: lp.quantity,
      release_status: lp.release_status || 'pending',
      released_by: lp.released_by,
      released_at: lp.released_at,
    }))
  }

  // ==========================================================================
  // Queries
  // ==========================================================================

  /**
   * List batch release records
   */
  static async list(params: BatchReleaseListParams): Promise<BatchReleaseListResponse> {
    const supabase = createClient()
    const { release_decision, product_id, date_from, date_to, page = 1, limit = 20 } = params

    let query = supabase.from('batch_release_records').select('*', { count: 'exact' })

    if (release_decision) {
      query = query.eq('release_decision', release_decision)
    }

    if (product_id) {
      query = query.eq('product_id', product_id)
    }

    if (date_from) {
      query = query.gte('created_at', date_from)
    }

    if (date_to) {
      query = query.lte('created_at', date_to)
    }

    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data, count, error } = await query

    if (error) {
      throw new Error('Failed to fetch release records')
    }

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    }
  }

  /**
   * Get batch QA status
   */
  static async getBatchStatus(batchNumber: string): Promise<BatchStatus> {
    const supabase = createClient()

    // Get WO
    const wo = await getWorkOrderByBatchNumber(batchNumber)

    // Get final inspection
    const inspection = await getFinalInspectionForWO(wo.id)

    // Get release record
    const { data: release } = await supabase
      .from('batch_release_records')
      .select('release_decision, approved_at, approved_by, conditional_restrictions')
      .eq('batch_number', batchNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get LP summary
    const { data: allLps } = await supabase
      .from('license_plates')
      .select('release_status')
      .eq('wo_id', wo.id)
      .eq('source', 'production')

    const lpSummary = allLps ? countLpStatusDistribution(allLps) : {
      total: 0,
      released: 0,
      pending: 0,
      rejected: 0,
      hold: 0,
    }

    // Type assertion for product data
    const productData = wo.products as unknown as { id: string; name: string; sku: string }

    const releaseStatus = release?.release_decision || 'pending'
    const canShip = releaseStatus === 'approved' || releaseStatus === 'conditional'

    return {
      batch_number: batchNumber,
      wo_id: wo.id,
      product: {
        id: productData?.id || wo.product_id,
        name: productData?.name || 'Unknown',
        sku: productData?.sku || '',
      },
      qa_status: {
        final_inspection_status: inspection?.status || null,
        final_inspection_result: inspection?.result || null,
        release_status: releaseStatus as 'pending' | 'approved' | 'rejected' | 'conditional',
        released_at: release?.approved_at || null,
        released_by: release?.approved_by || null,
      },
      lp_summary: lpSummary,
      can_ship: canShip,
      restrictions: release?.conditional_restrictions || undefined,
    }
  }

  // ==========================================================================
  // Utility
  // ==========================================================================

  /**
   * Generate next release number
   */
  static async generateReleaseNumber(): Promise<string> {
    const supabase = createClient()

    // This is handled by database trigger, but we can call the function directly
    const { data } = await supabase.rpc('generate_release_number', {
      p_org_id: (await this.getCurrentOrgId()) || '',
    })

    return data || ''
  }

  /**
   * Check if batch has active release record
   */
  static async hasActiveRelease(batchNumber: string): Promise<boolean> {
    const supabase = createClient()

    const { data } = await supabase
      .from('batch_release_records')
      .select('id')
      .eq('batch_number', batchNumber)
      .neq('release_decision', 'pending')
      .limit(1)
      .single()

    return !!data
  }

  /**
   * Check if user has approval role (QA Manager, Quality Director, Admin)
   */
  private static async checkUserHasApprovalRole(userId: string): Promise<boolean> {
    const supabase = createClient()

    const { data: userData } = await supabase.from('users').select('role_id').eq('id', userId).single()

    if (!userData?.role_id) return false

    // Get role code
    const { data: role } = await supabase.from('roles').select('code').eq('id', userData.role_id).single()

    return APPROVAL_ROLES.includes((role?.code || '').toUpperCase() as (typeof APPROVAL_ROLES)[number])
  }

  /**
   * Get current user's org_id
   */
  private static async getCurrentOrgId(): Promise<string | null> {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: userData } = await supabase.from('users').select('org_id').eq('id', user.id).single()

    return userData?.org_id || null
  }
}
