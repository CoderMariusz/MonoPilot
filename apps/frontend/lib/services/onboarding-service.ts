/**
 * Onboarding Service
 * Story: 01.3 - Onboarding Wizard Launcher
 *
 * Manages onboarding wizard state and demo data creation for new organizations.
 * Provides methods for checking status, updating progress, and skipping wizard
 * with automatic demo data generation.
 *
 * **Architecture:** Service layer accepts Supabase client as parameter to support
 * both server-side (API routes) and client-side usage. API routes should pass
 * server-side client via createServerSupabase().
 *
 * **Security:** All methods require org_id validation and proper session authentication.
 * Follows ADR-013 multi-tenant isolation pattern.
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/01-settings/01.3.onboarding-wizard-launcher.md}
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { isValidUUID } from '@/lib/utils/validation'

/**
 * Total number of wizard steps.
 */
const TOTAL_STEPS = 6

/**
 * Validates org_id and throws if invalid.
 * @param orgId - Organization UUID to validate
 * @throws {Error} If org_id is missing or not a valid UUID
 */
function validateOrgId(orgId: string): void {
  if (!orgId || !isValidUUID(orgId)) {
    throw new Error('Invalid organization ID')
  }
}

/**
 * Fields that can be updated on the organizations table for onboarding.
 */
interface OnboardingUpdateData {
  onboarding_step?: number
  onboarding_started_at?: string
  onboarding_completed_at?: string
  onboarding_skipped?: boolean
}

/**
 * Onboarding status for an organization
 */
export interface OnboardingStatus {
  /** Current step (0=not started, 1-6=wizard steps) */
  step: number
  /** When wizard was first shown */
  started_at: string | null
  /** When wizard was completed or skipped */
  completed_at: string | null
  /** True if user chose to skip wizard */
  skipped: boolean
  /** True if onboarding is complete (completed_at is set) */
  is_complete: boolean
}

/**
 * Demo data creation result
 */
export interface DemoDataResult {
  success: boolean
  warehouse_id: string
  location_id: string
  product_id: string
}

/**
 * Service class for managing onboarding wizard operations.
 *
 * Provides CRUD operations for onboarding status and demo data creation.
 * All methods accept Supabase client as first parameter for server-side usage.
 */
export class OnboardingService {
  /**
   * Get onboarding status for an organization
   *
   * Retrieves current wizard state including step number, timestamps,
   * and completion status.
   *
   * **Security:** Validates org_id format to prevent SQL injection.
   * Uses RLS policies for tenant isolation.
   *
   * @param supabase - Supabase client (server-side or client-side)
   * @param orgId - Organization UUID
   * @returns {Promise<OnboardingStatus>} Current onboarding status
   * @throws {Error} If org_id is invalid or organization not found
   *
   * @example
   * ```typescript
   * const supabase = createServerSupabase();
   * const status = await OnboardingService.getStatus(supabase, orgId);
   * if (status.is_complete) {
   *   // Skip wizard
   * } else {
   *   // Show wizard at status.step
   * }
   * ```
   */
  static async getStatus(supabase: SupabaseClient, orgId: string): Promise<OnboardingStatus> {
    validateOrgId(orgId)

    // Fetch onboarding fields from organizations table
    const { data, error } = await supabase
      .from('organizations')
      .select('onboarding_step, onboarding_started_at, onboarding_completed_at, onboarding_skipped')
      .eq('id', orgId)
      .single()

    if (error || !data) {
      throw new Error(`Failed to fetch onboarding status: ${error?.message || 'Organization not found'}`)
    }

    return {
      step: data.onboarding_step ?? 0,
      started_at: data.onboarding_started_at,
      completed_at: data.onboarding_completed_at,
      skipped: data.onboarding_skipped ?? false,
      is_complete: !!data.onboarding_completed_at,
    }
  }

  /**
   * Skip wizard and create demo data
   *
   * Creates demo warehouse, location, and product via transactional RPC function,
   * then marks onboarding as complete and skipped.
   *
   * **Transactional:** Uses database RPC function create_onboarding_demo_data()
   * to ensure atomic operation - all changes rollback on error.
   *
   * **Security:** Validates org_id. Should be called only after admin role check.
   * Creates data with proper org_id association for RLS isolation.
   *
   * **Demo Data Created**:
   * - Warehouse: code='DEMO-WH', name='Main Warehouse', type='general', is_default=true
   * - Location: code='DEFAULT', name='Default Location', type='zone'
   * - Product: code='SAMPLE-001', name='Sample Product', uom='EA', status='active'
   * - Module toggles: technical=true, all others=false
   *
   * @param supabase - Supabase client (server-side or client-side)
   * @param orgId - Organization UUID
   * @returns {Promise<DemoDataResult>} IDs of created demo data
   * @throws {Error} If org_id is invalid or demo data creation fails
   *
   * @example
   * ```typescript
   * const supabase = createServerSupabase();
   * const result = await OnboardingService.skipWizard(supabase, orgId);
   * console.log('Demo warehouse:', result.warehouse_id);
   * // Redirect to dashboard
   * ```
   */
  static async skipWizard(supabase: SupabaseClient, orgId: string): Promise<DemoDataResult> {
    validateOrgId(orgId)

    try {
      // Call database RPC function for transactional demo data creation
      const { data: demoData, error: rpcError } = await supabase
        .rpc('create_onboarding_demo_data', { p_org_id: orgId })

      if (rpcError || !demoData) {
        throw new Error(`Failed to create demo data: ${rpcError?.message || 'Unknown error'}`)
      }

      // Mark onboarding as complete and skipped
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          onboarding_completed_at: new Date().toISOString(),
          onboarding_skipped: true,
          onboarding_step: TOTAL_STEPS, // Set to final step
        })
        .eq('id', orgId)

      if (updateError) {
        throw new Error(`Failed to update onboarding status: ${updateError.message}`)
      }

      return {
        success: true,
        warehouse_id: demoData.warehouse_id,
        location_id: demoData.location_id,
        product_id: demoData.product_id,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to skip wizard: ${message}`)
    }
  }

  /**
   * Update wizard progress step
   *
   * Updates the current step number as user progresses through wizard.
   * Also sets onboarding_started_at on first progress update.
   *
   * **Security:** Validates org_id and step range (1-6).
   * Should be called only after admin role check.
   *
   * @param supabase - Supabase client (server-side or client-side)
   * @param orgId - Organization UUID
   * @param step - Step number (1-6)
   * @returns {Promise<void>}
   * @throws {Error} If org_id is invalid, step out of range, or update fails
   *
   * @example
   * ```typescript
   * const supabase = createServerSupabase();
   * await OnboardingService.updateProgress(supabase, orgId, 3);
   * // Wizard now shows step 3
   * ```
   */
  static async updateProgress(supabase: SupabaseClient, orgId: string, step: number): Promise<void> {
    validateOrgId(orgId)

    if (step < 1 || step > TOTAL_STEPS || !Number.isInteger(step)) {
      throw new Error(`Invalid step number (must be 1-${TOTAL_STEPS})`)
    }

    // Check if this is first progress update
    const { data: currentData } = await supabase
      .from('organizations')
      .select('onboarding_started_at')
      .eq('id', orgId)
      .single()

    const updateData: OnboardingUpdateData = {
      onboarding_step: step,
    }

    // Set started_at if not already set
    if (!currentData?.onboarding_started_at) {
      updateData.onboarding_started_at = new Date().toISOString()
    }

    // If reaching final step, mark as complete
    if (step === TOTAL_STEPS) {
      updateData.onboarding_completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', orgId)

    if (error) {
      throw new Error(`Failed to update progress: ${error.message}`)
    }
  }
}
