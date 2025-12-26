/**
 * Wizard Service
 * Story: 01.14 - Wizard Steps Complete
 * Purpose: Business logic for wizard steps 2-6
 *
 * Handles:
 * - Step 2: Warehouse creation (with demo option)
 * - Step 3: Location creation from templates
 * - Step 4: Product creation (with SKU validation)
 * - Step 5: Work order creation (optional)
 * - Step 6: Wizard completion with badge awarding
 * - Progress tracking in wizard_progress JSONB
 */

import { createServerSupabase } from '@/lib/supabase/server'
import type {
  WizardStep2Input,
  WizardStep3Input,
  WizardStep4Input,
  WizardStep5Input,
} from '@/lib/validation/wizard-steps'
import { LOCATION_TEMPLATES } from '@/lib/constants/wizard-templates'

/**
 * Response types for each wizard step
 */
export interface Step2Response {
  success: true
  next_step: 3
  warehouse: {
    id: string
    code: string
    name: string
    type: string
    is_default: boolean
    is_active: boolean
  }
}

export interface Step3Response {
  success: true
  next_step: 4
  locations: Array<{
    id: string
    code: string
    name: string
  }>
  count: number
}

export interface Step4Response {
  success: true
  next_step: 5
  product?: {
    id: string
    sku: string
    name: string
  }
  skipped?: boolean
}

export interface Step5Response {
  success: true
  next_step: 6
  work_order?: {
    id: string
    code: string
    status: string
  }
  skipped?: boolean
}

export interface Step6Response {
  success: true
  completed: true
  summary: {
    organization: { name: string }
    warehouse: { code: string; name: string } | null
    locations: { count: number; template: string } | null
    product: { sku: string; name: string } | null
    work_order: { code: string; status: string } | null
    duration_seconds: number
    badge?: 'speed_champion'
  }
}

export interface WizardProgress {
  step_1?: Record<string, unknown>
  step_2?: Record<string, unknown>
  step_3?: Record<string, unknown>
  step_4?: Record<string, unknown>
  step_5?: Record<string, unknown>
  step_6?: Record<string, unknown>
}

export interface WizardSummary {
  organization: { name: string }
  warehouse: { code: string; name: string } | null
  locations: { count: number; template: string } | null
  product: { sku: string; name: string } | null
  work_order: { code: string; status: string } | null
  duration_seconds: number
  badge?: 'speed_champion'
}

export class WizardService {
  /**
   * Step 2: Create Warehouse
   * AC-W2-02: Create warehouse with is_default=true
   * AC-W2-04: Skip creates DEMO-WH warehouse
   */
  static async saveStep2Warehouse(data: WizardStep2Input): Promise<Step2Response> {
    const supabase = await createServerSupabase()

    // Get current user and org
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()
    if (!userData) throw new Error('User organization not found')

    const orgId = userData.org_id

    // Determine warehouse data (demo or user-provided)
    const warehouseData = data.skip
      ? {
        code: 'DEMO-WH',
        name: 'Demo Warehouse',
        type: 'GENERAL',
        is_default: true,
        is_active: true,
        org_id: orgId,
      }
      : {
        code: data.code || 'WH-MAIN',
        name: data.name || '',
        type: data.type || 'GENERAL',
        is_default: true,
        is_active: true,
        org_id: orgId,
      }

    // Validate name is provided if not skipping
    if (!data.skip && !warehouseData.name) {
      throw new Error('Warehouse name is required')
    }

    // Create warehouse
    const { data: warehouse, error } = await supabase
      .from('warehouses')
      .insert(warehouseData)
      .select()
      .single()

    if (error || !warehouse) {
      throw new Error(error?.message || 'Failed to create warehouse')
    }

    // Update wizard_progress.step_2
    await this.updateProgress(orgId, 2, {
      warehouse_id: warehouse.id,
      skipped: data.skip || false,
      completed_at: new Date().toISOString(),
    })

    return {
      success: true,
      next_step: 3,
      warehouse: {
        id: warehouse.id,
        code: warehouse.code,
        name: warehouse.name,
        type: warehouse.type,
        is_default: warehouse.is_default,
        is_active: warehouse.is_active,
      },
    }
  }

  /**
   * Step 3: Create Locations
   * AC-W3-02: Simple template creates 1 location
   * AC-W3-03: Basic template creates 3 locations
   * AC-W3-04: Full template creates 9 locations
   * AC-W3-05: Custom template creates user-defined locations
   */
  static async saveStep3Locations(data: WizardStep3Input): Promise<Step3Response> {
    const supabase = await createServerSupabase()

    // Get current user and org
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()
    if (!userData) throw new Error('User organization not found')

    const orgId = userData.org_id

    // Get warehouse from step_2 progress
    const { data: org } = await supabase
      .from('organizations')
      .select('wizard_progress')
      .eq('id', orgId)
      .single()

    const warehouseId = org?.wizard_progress?.step_2?.warehouse_id
    if (!warehouseId) {
      throw new Error('Warehouse not found in wizard progress')
    }

    // Determine locations to create
    let locationsToCreate: Array<{
      code: string
      name: string
      type: string
      zone_enabled: boolean
      capacity_enabled: boolean
      is_active: boolean
    }> = []

    if (data.skip) {
      // Create default location
      locationsToCreate = [
        {
          code: 'DEFAULT',
          name: 'Default Location',
          type: 'bulk',
          zone_enabled: false,
          capacity_enabled: false,
          is_active: true,
        },
      ]
    } else if (data.template === 'custom') {
      // Use custom locations
      if (!data.custom_locations || data.custom_locations.length === 0) {
        throw new Error('Custom template requires at least one location')
      }
      locationsToCreate = data.custom_locations.map((loc) => ({
        code: loc.code,
        name: loc.name,
        type: loc.location_type,
        zone_enabled: false,
        capacity_enabled: false,
        is_active: true,
      }))
    } else {
      // Use predefined template
      const template = LOCATION_TEMPLATES.find((t) => t.id === data.template)
      if (!template) {
        throw new Error(`Template ${data.template} not found`)
      }

      // For now, create flat locations (no hierarchy)
      // TODO: Implement parent_code mapping for hierarchical locations
      locationsToCreate = template.locations.map((loc) => ({
        code: loc.code,
        name: loc.name,
        type: loc.location_type,
        zone_enabled: false,
        capacity_enabled: false,
        is_active: true,
      }))
    }

    // Batch insert locations
    const locationsData = locationsToCreate.map((loc) => ({
      ...loc,
      org_id: orgId,
      warehouse_id: warehouseId,
    }))

    const { data: locations, error } = await supabase
      .from('locations')
      .insert(locationsData)
      .select('id, code, name')

    if (error || !locations) {
      throw new Error(error?.message || 'Failed to create locations')
    }

    // Update wizard_progress.step_3
    await this.updateProgress(orgId, 3, {
      location_ids: locations.map((l) => l.id),
      template: data.template || 'default',
      skipped: data.skip || false,
      completed_at: new Date().toISOString(),
    })

    return {
      success: true,
      next_step: 4,
      locations: locations.map((l) => ({
        id: l.id,
        code: l.code,
        name: l.name,
      })),
      count: locations.length,
    }
  }

  /**
   * Step 4: Create Product
   * AC-W4-04: Create product with validation
   * AC-W4-05: Reject duplicate SKU
   * AC-W4-06: Allow skip without creating product
   */
  static async saveStep4Product(data: WizardStep4Input): Promise<Step4Response> {
    const supabase = await createServerSupabase()

    // Get current user and org
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()
    if (!userData) throw new Error('User organization not found')

    const orgId = userData.org_id

    // Handle skip
    if (data.skip) {
      await this.updateProgress(orgId, 4, {
        skipped: true,
        completed_at: new Date().toISOString(),
      })

      return {
        success: true,
        next_step: 5,
        skipped: true,
      }
    }

    // Validate required fields
    if (!data.sku || !data.name) {
      throw new Error('SKU and product name are required')
    }

    // Validate SKU format
    if (!/^[A-Z0-9-]+$/.test(data.sku)) {
      throw new Error('SKU must be uppercase alphanumeric with hyphens')
    }

    // Check SKU uniqueness
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('org_id', orgId)
      .eq('sku', data.sku)
      .limit(1)

    if (existing && existing.length > 0) {
      throw new Error('SKU already exists')
    }

    // Create product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        org_id: orgId,
        sku: data.sku,
        name: data.name,
        product_type: data.product_type || 'finished_good',
        uom: data.uom || 'EA',
        shelf_life_days: data.shelf_life_days || null,
        storage_temp: data.storage_temp || 'ambient',
        is_active: true,
      })
      .select('id, sku, name')
      .single()

    if (error || !product) {
      // Check for duplicate key error
      if (error?.code === '23505') {
        throw new Error('SKU already exists')
      }
      throw new Error(error?.message || 'Failed to create product')
    }

    // Update wizard_progress.step_4
    await this.updateProgress(orgId, 4, {
      product_id: product.id,
      skipped: false,
      completed_at: new Date().toISOString(),
    })

    return {
      success: true,
      next_step: 5,
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
      },
    }
  }

  /**
   * Step 5: Create Work Order
   * AC-W5-03: Create draft work order
   * Requires product_id if not skipping
   */
  static async saveStep5WorkOrder(data: WizardStep5Input): Promise<Step5Response> {
    const supabase = await createServerSupabase()

    // Get current user and org
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()
    if (!userData) throw new Error('User organization not found')

    const orgId = userData.org_id

    // Handle skip
    if (data.skip) {
      await this.updateProgress(orgId, 5, {
        skipped: true,
        completed_at: new Date().toISOString(),
      })

      return {
        success: true,
        next_step: 6,
        skipped: true,
      }
    }

    // Validate product_id is provided
    if (!data.product_id) {
      throw new Error('product_id required when not skipping')
    }

    // Calculate due date (tomorrow if not provided)
    const dueDate =
      data.due_date ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Generate work order code
    const { data: lastWO } = await supabase
      .from('work_orders')
      .select('code')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)

    const nextNumber = lastWO && lastWO.length > 0 ? parseInt(lastWO[0].code.split('-')[1]) + 1 : 1
    const code = `WO-${String(nextNumber).padStart(4, '0')}`

    // Create work order
    const { data: workOrder, error } = await supabase
      .from('work_orders')
      .insert({
        org_id: orgId,
        code,
        product_id: data.product_id,
        quantity: data.quantity || 100,
        due_date: dueDate,
        status: 'Draft',
        priority: 'Normal',
      })
      .select('id, code, status')
      .single()

    if (error || !workOrder) {
      throw new Error(error?.message || 'Failed to create work order')
    }

    // Update wizard_progress.step_5
    await this.updateProgress(orgId, 5, {
      work_order_id: workOrder.id,
      skipped: false,
      completed_at: new Date().toISOString(),
    })

    return {
      success: true,
      next_step: 6,
      work_order: {
        id: workOrder.id,
        code: workOrder.code,
        status: workOrder.status,
      },
    }
  }

  /**
   * Step 6: Complete Wizard
   * AC-W6-05: Set onboarding_completed_at and wizard_completed
   * AC-W6-03: Award speed badge if < 900 seconds (15 min)
   */
  static async completeWizard(): Promise<Step6Response> {
    const supabase = await createServerSupabase()

    // Get current user and org
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()
    if (!userData) throw new Error('User organization not found')

    const orgId = userData.org_id

    // Get current organization state
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (!org) throw new Error('Organization not found')

    // Calculate duration
    const duration = await this.calculateDuration(
      org.onboarding_started_at || new Date().toISOString(),
      new Date().toISOString()
    )

    // Check for speed champion badge
    const isSpeedChampion = await this.checkSpeedChampion(duration)

    // Award badge if qualified
    let badge: 'speed_champion' | undefined
    if (isSpeedChampion) {
      await this.awardBadge(orgId, 'speed_champion')
      badge = 'speed_champion'
    }

    // Update organization completion fields
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        onboarding_completed_at: new Date().toISOString(),
        // wizard_completed: true, // Column missing in some environments, relying on onboarding_completed_at
        wizard_progress: {
          ...org.wizard_progress,
          step_6: {
            completed_at: new Date().toISOString(),
            duration_seconds: duration,
            badge,
          },
        },
      })
      .eq('id', orgId)

    if (updateError) {
      throw new Error(updateError.message || 'Failed to complete wizard')
    }

    // Generate summary
    const summary = await this.getSummary(orgId)

    return {
      success: true,
      completed: true,
      summary: {
        ...summary,
        duration_seconds: duration,
        badge,
      },
    }
  }

  /**
   * Get wizard progress
   */
  static async getProgress(orgId: string): Promise<WizardProgress> {
    const supabase = await createServerSupabase()

    const { data: org } = await supabase
      .from('organizations')
      .select('wizard_progress')
      .eq('id', orgId)
      .single()

    return org?.wizard_progress || {}
  }

  /**
   * Update wizard progress for a specific step
   */
  static async updateProgress(
    orgId: string,
    step: number,
    data: Record<string, unknown>
  ): Promise<void> {
    const supabase = await createServerSupabase()

    // Get current progress
    const { data: org } = await supabase
      .from('organizations')
      .select('wizard_progress')
      .eq('id', orgId)
      .single()

    const currentProgress = org?.wizard_progress || {}

    // Update specific step
    const updatedProgress = {
      ...currentProgress,
      [`step_${step}`]: data,
    }

    // Save back to database
    const { error } = await supabase
      .from('organizations')
      .update({ wizard_progress: updatedProgress })
      .eq('id', orgId)

    if (error) {
      throw new Error(error.message || 'Failed to update wizard progress')
    }
  }

  /**
   * Get wizard summary
   */
  static async getSummary(orgId: string): Promise<WizardSummary> {
    const supabase = await createServerSupabase()

    // Get organization and progress
    const { data: org } = await supabase
      .from('organizations')
      .select('name, wizard_progress')
      .eq('id', orgId)
      .single()

    if (!org) throw new Error('Organization not found')

    const progress = org.wizard_progress || {}

    // Get warehouse
    let warehouse = null
    if (progress.step_2?.warehouse_id) {
      const { data: wh } = await supabase
        .from('warehouses')
        .select('code, name')
        .eq('id', progress.step_2.warehouse_id)
        .single()
      warehouse = wh
    }

    // Get locations count
    let locations = null
    if (progress.step_3?.location_ids) {
      locations = {
        count: progress.step_3.location_ids.length,
        template: progress.step_3.template || 'unknown',
      }
    }

    // Get product
    let product = null
    if (progress.step_4?.product_id && !progress.step_4?.skipped) {
      const { data: prod } = await supabase
        .from('products')
        .select('sku, name')
        .eq('id', progress.step_4.product_id)
        .single()
      product = prod
    }

    // Get work order
    let workOrder = null
    if (progress.step_5?.work_order_id && !progress.step_5?.skipped) {
      const { data: wo } = await supabase
        .from('work_orders')
        .select('code, status')
        .eq('id', progress.step_5.work_order_id)
        .single()
      workOrder = wo
    }

    return {
      organization: { name: org.name },
      warehouse,
      locations,
      product,
      work_order: workOrder,
      duration_seconds: 0, // Will be calculated in completeWizard
    }
  }

  /**
   * Calculate duration in seconds between two timestamps
   */
  static async calculateDuration(startedAt: string, completedAt: string): Promise<number> {
    if (!startedAt || !completedAt) return 0
    const start = new Date(startedAt).getTime()
    const end = new Date(completedAt).getTime()
    if (isNaN(start) || isNaN(end)) return 0
    return Math.floor((end - start) / 1000)
  }

  /**
   * Check if user qualifies for speed champion badge
   * Threshold: 900 seconds (15 minutes)
   */
  static async checkSpeedChampion(durationSeconds: number): Promise<boolean> {
    return durationSeconds < 900
  }

  /**
   * Award badge to organization
   */
  static async awardBadge(orgId: string, badgeCode: string): Promise<void> {
    const supabase = await createServerSupabase()

    // Get current badges
    const { data: org } = await supabase
      .from('organizations')
      .select('badges')
      .eq('id', orgId)
      .single()

    const currentBadges = org?.badges || []

    // Check if badge already exists
    if (currentBadges.some((b: { code: string }) => b.code === badgeCode)) {
      return // Already awarded
    }

    // Add new badge
    const newBadge = {
      code: badgeCode,
      name: badgeCode === 'speed_champion' ? 'Speed Setup Champion' : badgeCode,
      earned_at: new Date().toISOString(),
    }

    const updatedBadges = [...currentBadges, newBadge]

    // Save badges
    const { error } = await supabase
      .from('organizations')
      .update({ badges: updatedBadges })
      .eq('id', orgId)

    if (error) {
      throw new Error(error.message || 'Failed to award badge')
    }
  }
}
