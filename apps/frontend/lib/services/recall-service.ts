// Recall Simulation Service (Story 2.20)
import { createAdminClient } from '../supabase/admin-client'
import { traceForward, traceBackward } from './genealogy-service'
import type {
  RecallSimulationResult,
  RecallSummary,
  LocationAnalysis,
  CustomerImpact,
  FinancialImpact,
  RegulatoryInfo,
  TraceNode,
  LicensePlate
} from '../types/traceability'

interface RecallSimulationInput {
  lp_id?: string
  batch_number?: string
  include_shipped?: boolean
  include_notifications?: boolean
  max_depth?: number
}

/**
 * Execute recall simulation by combining forward and backward traces
 * Returns comprehensive impact analysis
 */
export async function simulateRecall(
  orgId: string,
  input: RecallSimulationInput
): Promise<RecallSimulationResult> {
  const startTime = Date.now()
  const supabase = createAdminClient()

  // Step 1: Find the root LP
  let rootLp: LicensePlate | null = null

  if (input.lp_id) {
    // Determine if lp_id is a UUID or LP number
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isUuid = uuidRegex.test(input.lp_id)

    let query = supabase
      .from('license_plates')
      .select('*')
      .eq('org_id', orgId)
    
    if (isUuid) {
      query = query.eq('id', input.lp_id)
    } else {
      query = query.eq('lp_number', input.lp_id)
    }

    const { data, error } = await query.single()

    if (error || !data) throw new Error('License Plate not found')
    rootLp = data as LicensePlate
  } else if (input.batch_number) {
    const { data, error } = await supabase
      .from('license_plates')
      .select('*')
      .eq('batch_number', input.batch_number)
      .eq('org_id', orgId)
      .limit(1)
      .single()

    if (error || !data) throw new Error('Batch not found')
    rootLp = data as LicensePlate
  }

  if (!rootLp) throw new Error('Root LP not found')

  // Step 2: Run forward and backward traces in parallel
  const maxDepth = input.max_depth || 20
  const [forwardResult, backwardResult] = await Promise.all([
    traceForward(rootLp.id, maxDepth),
    traceBackward(rootLp.id, maxDepth)
  ])

  // Step 3: Collect all affected LPs
  const affectedLps = collectAllLps([
    ...forwardResult.trace_tree,
    ...backwardResult.trace_tree
  ])

  // Add root LP
  affectedLps.push(rootLp)

  // Step 4: Calculate recall summary
  const summary = calculateRecallSummary(affectedLps)

  // Step 5: Analyze locations
  const locations = await analyzeLocations(affectedLps, orgId)

  // Step 6: Calculate customer impact (if include_shipped)
  const customers = input.include_shipped
    ? await calculateCustomerImpact(affectedLps, orgId)
    : []

  // Step 7: Calculate financial impact
  const financial = calculateFinancialImpact(affectedLps, customers.length)

  // Step 8: Determine regulatory requirements
  const regulatory = await determineRegulatoryInfo(rootLp, orgId)

  // Step 9: Save simulation to database
  const simulationId = await saveSimulation(supabase, {
    org_id: orgId,
    lp_id: input.lp_id || null,
    batch_number: input.batch_number || null,
    include_shipped: input.include_shipped ?? true,
    include_notifications: input.include_notifications ?? true,
    summary,
    forward_trace: forwardResult.trace_tree,
    backward_trace: backwardResult.trace_tree,
    regulatory,
    execution_time_ms: Date.now() - startTime
  })

  return {
    simulation_id: simulationId,
    root_lp: rootLp,
    forward_trace: forwardResult.trace_tree,
    backward_trace: backwardResult.trace_tree,
    summary,
    locations,
    customers,
    financial,
    regulatory,
    execution_time_ms: Date.now() - startTime,
    created_at: new Date().toISOString()
  }
}

/**
 * Get simulation by ID
 */
export async function getSimulation(
  simulationId: string,
  orgId: string
): Promise<RecallSimulationResult | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('recall_simulations')
    .select('*')
    .eq('id', simulationId)
    .eq('org_id', orgId)
    .single()

  if (error || !data) return null

  // Reconstruct the result from stored data
  const rootLp = await supabase
    .from('license_plates')
    .select('*')
    .eq('id', data.lp_id)
    .single()

  return {
    simulation_id: data.id,
    root_lp: rootLp.data as LicensePlate,
    forward_trace: data.forward_trace,
    backward_trace: data.backward_trace,
    summary: data.summary,
    locations: [],
    customers: [],
    financial: data.summary.financial || {},
    regulatory: data.regulatory_info,
    execution_time_ms: data.execution_time_ms,
    created_at: data.created_at
  }
}

/**
 * Get simulation history for an organization
 */
export async function getSimulationHistory(
  orgId: string,
  limit: number = 10,
  offset: number = 0
) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('recall_simulations')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(`Failed to fetch history: ${error.message}`)

  return data || []
}

// ========== Helper Functions ==========

function collectAllLps(traceTree: TraceNode[]): LicensePlate[] {
  const lps: LicensePlate[] = []

  function traverse(nodes: TraceNode[]) {
    for (const node of nodes) {
      lps.push(node.lp)
      if (node.children?.length) {
        traverse(node.children)
      }
    }
  }

  traverse(traceTree)
  return lps
}

function calculateRecallSummary(affectedLps: LicensePlate[]): RecallSummary {
  const statusBreakdown = {
    available: 0,
    in_production: 0,
    shipped: 0,
    consumed: 0,
    quarantine: 0
  }

  let totalQuantity = 0
  const warehouses = new Set<string>()

  for (const lp of affectedLps) {
    totalQuantity += lp.quantity

    if (lp.status === 'available') statusBreakdown.available++
    else if (lp.status === 'consumed') statusBreakdown.consumed++
    else if (lp.status === 'shipped') statusBreakdown.shipped++
    else if (lp.status === 'quarantine') statusBreakdown.quarantine++

    if (lp.location_id) warehouses.add(lp.location_id)
  }

  return {
    total_affected_lps: affectedLps.length,
    total_quantity: totalQuantity,
    total_estimated_value: totalQuantity * 10, // Placeholder: $10/unit
    status_breakdown: statusBreakdown,
    affected_warehouses: warehouses.size,
    affected_customers: statusBreakdown.shipped
  }
}

async function analyzeLocations(
  affectedLps: LicensePlate[],
  orgId: string
): Promise<LocationAnalysis[]> {
  const supabase = createAdminClient()

  // Group by location
  const byLocation = affectedLps.reduce((acc, lp) => {
    if (!lp.location_id) return acc
    if (!acc[lp.location_id]) {
      acc[lp.location_id] = {
        lps: [],
        totalQty: 0
      }
    }
    acc[lp.location_id].lps.push(lp)
    acc[lp.location_id].totalQty += lp.quantity
    return acc
  }, {} as Record<string, { lps: LicensePlate[]; totalQty: number }>)

  // Fetch location names
  const locationIds = Object.keys(byLocation)
  if (locationIds.length === 0) return []

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, warehouse_id')
    .in('id', locationIds)
    .eq('org_id', orgId)

  const locMap = new Map((locations || []).map((loc: any) => [loc.id, loc]))

  return locationIds.map(locId => {
    const loc = locMap.get(locId)
    const data = byLocation[locId]
    return {
      warehouse_id: loc?.warehouse_id || locId,
      warehouse_name: loc?.name || 'Unknown',
      affected_lps: data.lps.length,
      total_quantity: data.totalQty,
      zones: []
    }
  })
}

async function calculateCustomerImpact(
  affectedLps: LicensePlate[],
  orgId: string
): Promise<CustomerImpact[]> {
  // Placeholder: In real implementation, join with shipments/customers
  const shippedLps = affectedLps.filter(lp => lp.status === 'shipped')

  return shippedLps.map((lp, idx) => ({
    customer_id: `customer-${idx}`,
    customer_name: `Customer ${idx + 1}`,
    contact_email: `customer${idx + 1}@example.com`,
    shipped_quantity: lp.quantity,
    ship_date: new Date().toISOString(), // Placeholder - in real implementation, get from shipment table
    notification_status: 'draft' as const
  }))
}

function calculateFinancialImpact(
  affectedLps: LicensePlate[],
  customerCount: number
): FinancialImpact {
  // Simplified cost calculations (placeholder values)
  const totalQty = affectedLps.reduce((sum, lp) => sum + lp.quantity, 0)

  const productValue = totalQty * 10 // $10 per unit
  const retrievalCost = customerCount * 50 // $50 per customer
  const disposalCost = totalQty * 2 // $2 per unit disposal
  const lostRevenue = productValue * 0.3 // 30% of product value

  return {
    product_value: productValue,
    retrieval_cost: retrievalCost,
    disposal_cost: disposalCost,
    lost_revenue: lostRevenue,
    total_estimated_cost: productValue + retrievalCost + disposalCost + lostRevenue,
    confidence_interval: '± 20%'
  }
}

async function determineRegulatoryInfo(
  rootLp: LicensePlate,
  orgId: string
): Promise<RegulatoryInfo> {
  const supabase = createAdminClient()

  // Get product info
  const { data: product } = await supabase
    .from('products')
    .select('type, code, name')
    .eq('id', rootLp.product_id)
    .single()

  const productType = product?.type || 'FG'
  const reportableToFda = productType === 'FG' // Only finished goods

  // FDA requires report within 24 hours of discovery
  const reportDueDate = reportableToFda
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : null

  return {
    reportable_to_fda: reportableToFda,
    report_due_date: reportDueDate,
    report_status: 'draft',
    affected_product_types: [productType]
  }
}

async function saveSimulation(supabase: any, data: any): Promise<string> {
  const { data: result, error } = await supabase
    .from('recall_simulations')
    .insert({
      org_id: data.org_id,
      lp_id: data.lp_id,
      batch_number: data.batch_number,
      include_shipped: data.include_shipped,
      include_notifications: data.include_notifications,
      summary: data.summary,
      forward_trace: data.forward_trace,
      backward_trace: data.backward_trace,
      regulatory_info: data.regulatory,
      execution_time_ms: data.execution_time_ms
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to save simulation: ${error.message}`)

  return result.id
}
