/**
 * Quality Holds API Routes
 * Story: 06.2 - Quality Holds CRUD
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/holds - List holds with filters
 * - POST /api/quality/holds - Create hold with items
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.2.quality-holds-crud.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHoldSchema, holdListFiltersSchema } from '@/lib/validation/quality-hold-validation'
import { ZodError } from 'zod'
import * as QualityHoldService from '@/lib/services/quality-hold-service'
import { getAuthenticatedOrgId, getAuthenticatedUser, handleError } from '@/lib/utils/api-helpers'

/**
 * GET /api/quality/holds
 * Get paginated list of quality holds with advanced filtering, sorting, and pagination.
 * 
 * This endpoint retrieves a list of quality holds with support for multiple filters,
 * date range filtering, full-text search, and customizable sorting. Results are
 * paginated and include hold aging information.
 *
 * @route GET /api/quality/holds
 * @access Requires authentication. All roles (VIEWER, OPERATOR, QA_INSPECTOR, QA_MANAGER, ADMIN) can read.
 * 
 * @param {NextRequest} request - The Next.js request object
 * 
 * @queryParam {string} [status] - Comma-separated hold statuses to filter by.
 *   Valid values: 'active', 'released', 'disposed'
 *   Example: ?status=active,released
 * @queryParam {string} [priority] - Comma-separated priorities to filter by.
 *   Valid values: 'low', 'medium', 'high', 'critical'
 *   Example: ?priority=high,critical
 * @queryParam {string} [hold_type] - Comma-separated hold types to filter by.
 *   Valid values: 'qa_pending', 'investigation', 'recall', 'quarantine'
 *   Example: ?hold_type=investigation,recall
 * @queryParam {string} [from] - ISO 8601 date string for start of held_at range (inclusive).
 *   Example: ?from=2025-01-01
 * @queryParam {string} [to] - ISO 8601 date string for end of held_at range (inclusive).
 *   Example: ?to=2025-01-31
 * @queryParam {string} [search] - Free-text search in hold_number or reason fields (case-insensitive).
 *   Example: ?search=metal%20detection
 * @queryParam {number} [limit=20] - Maximum number of holds to return per page (max 100).
 *   Valid range: 1-100
 *   Example: ?limit=50
 * @queryParam {number} [offset=0] - Number of records to skip for pagination (zero-indexed).
 *   Example: ?offset=100 (skip first 100 records)
 * @queryParam {string} [sort] - Sort field and direction. Format: "field ASC|DESC"
 *   Valid fields: 'hold_number', 'held_at', 'priority', 'aging_hours', 'status'
 *   Default: 'held_at DESC' (newest first)
 *   Example: ?sort=priority DESC
 *
 * @response {200} Success
 *   @content {object}
 *   - holds {QualityHoldSummary[]} Array of hold summary objects:
 *     - id {string} UUID of the hold
 *     - hold_number {string} Auto-generated hold number (QH-YYYYMMDD-NNNN)
 *     - status {string} Hold status: 'active', 'released', or 'disposed'
 *     - priority {string} Priority level: 'low', 'medium', 'high', or 'critical'
 *     - hold_type {string} Type: 'qa_pending', 'investigation', 'recall', or 'quarantine'
 *     - reason {string} Reason text (truncated to 100 chars in list view)
 *     - items_count {number} Number of items in hold
 *     - held_by {object} User who created the hold { id, name, email }
 *     - held_at {string} ISO 8601 timestamp when hold was created
 *     - aging_hours {number} Hours since hold was created
 *     - aging_status {string} Aging indicator: 'normal', 'warning', or 'critical'
 *   - pagination {object} Pagination metadata:
 *     - total {number} Total number of holds matching filters
 *     - limit {number} Records per page
 *     - offset {number} Current offset
 *     - total_pages {number} Total pages available
 *     - has_next {boolean} Whether more records exist
 *     - has_prev {boolean} Whether previous records exist
 *   - filters_applied {object} Summary of applied filters:
 *     - status {string[]} Applied status filters
 *     - priority {string[]} Applied priority filters
 *     - hold_type {string[]} Applied hold type filters
 *     - date_range {object} Applied date range { from, to }
 *
 * @response {400} Bad Request - Invalid query parameters
 *   @content {object}
 *   - error {string} "Invalid request parameters"
 *   - details {any[]} Zod validation errors
 *
 * @response {401} Unauthorized - Missing or invalid authentication
 *   @content {object}
 *   - error {string} "Unauthorized"
 *
 * @response {500} Internal Server Error
 *   @content {object}
 *   - error {string} Error description
 *
 * @example
 * // Get active holds sorted by priority
 * GET /api/quality/holds?status=active&sort=priority DESC
 * 
 * @example
 * // Get high/critical priority holds from last 30 days with pagination
 * GET /api/quality/holds?priority=high,critical&from=2025-01-09&to=2025-02-09&limit=25&offset=0
 * 
 * @example
 * // Search for holds related to "metal detection"
 * GET /api/quality/holds?search=metal%20detection&limit=10
 * 
 * @performance Response time should be < 1 second for typical queries with 100+ holds
 * @rls Restricted to holds in authenticated user's organization (org_id)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedOrgId()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const filters = {
      status: searchParams.get('status')?.split(',').filter(Boolean) || undefined,
      priority: searchParams.get('priority')?.split(',').filter(Boolean) || undefined,
      hold_type: searchParams.get('hold_type')?.split(',').filter(Boolean) || undefined,
      reason: searchParams.get('reason') || undefined,
      product: searchParams.get('product') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '20', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
      sort: searchParams.get('sort') || undefined,
    }

    // Validate filters
    const validatedFilters = holdListFiltersSchema.parse(filters)

    // Get holds list
    const result = await QualityHoldService.getHoldsList(auth.orgId, validatedFilters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/quality/holds:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    return handleError(error)
  }
}

/**
 * POST /api/quality/holds
 * Create a new quality hold with associated items.
 * 
 * This endpoint creates a quality hold (production stop) and links it to one or more
 * items (license plates, work orders, or batches). The hold creates a record in the
 * quality holds table and updates the qa_status of affected license plates to 'hold'.
 * 
 * Auto-generates a hold_number in format QH-YYYYMMDD-NNNN.
 *
 * @route POST /api/quality/holds
 * @access Requires authentication with write permission.
 *   Allowed roles: QA_INSPECTOR, QA_MANAGER, ADMIN
 *   Denied roles: VIEWER, OPERATOR
 *
 * @param {NextRequest} request - The Next.js request object
 *
 * @body {CreateHoldInput} Request body containing hold and item details
 *
 * @bodyParam {string} reason - Required. Detailed reason for the hold.
 *   Constraints:
 *   - Minimum 10 characters
 *   - Maximum 500 characters
 *   - Cannot be empty or whitespace-only
 *   Example: "Failed metal detection test during production batch A-001"
 *
 * @bodyParam {string} hold_type - Required. Type of quality hold.
 *   Valid values:
 *   - 'qa_pending' - Hold pending QA review/decision
 *   - 'investigation' - Hold during investigation process
 *   - 'recall' - Hold due to recall requirement
 *   - 'quarantine' - Quarantine of affected material
 *   Example: "investigation"
 *
 * @bodyParam {string} [priority='medium'] - Optional. Priority level for the hold.
 *   Valid values: 'low', 'medium', 'high', 'critical'
 *   Default: 'medium' if not specified
 *   Example: "high"
 *
 * @bodyParam {QualityHoldItem[]} items - Required. Array of items to place on hold.
 *   Minimum: 1 item
 *   Maximum: 100 items per request
 *   Duplicate items not allowed (same reference_type and reference_id)
 *   
 *   Item object structure:
 *   - reference_type {string} Required. Type of reference being held.
 *     Valid values: 'lp' (license plate), 'wo' (work order), 'batch'
 *     Example: "lp"
 *   
 *   - reference_id {string} Required. UUID of the referenced entity.
 *     Must be a valid UUID v4.
 *     For 'lp': Must be a valid license_plate.id
 *     For 'wo': Must be a valid work_order.id
 *     For 'batch': Must be a valid batch.id
 *     Example: "550e8400-e29b-41d4-a716-446655440000"
 *   
 *   - quantity_held {number} [Optional] Quantity being held.
 *     Must be a positive number (> 0) if provided.
 *     Example: 100
 *   
 *   - uom {string} [Optional] Unit of measure for quantity_held.
 *     Maximum 20 characters.
 *     Common values: 'kg', 'units', 'liters', 'pieces'
 *     Example: "kg"
 *   
 *   - notes {string} [Optional] Hold item-specific notes.
 *     Maximum 500 characters.
 *     Example: "Specific batch lot affected by test failure"
 *
 * @bodyExample
 * {
 *   "reason": "Failed metal detection test during production run. Material contains ferrous contamination.",
 *   "hold_type": "investigation",
 *   "priority": "high",
 *   "items": [
 *     {
 *       "reference_type": "lp",
 *       "reference_id": "550e8400-e29b-41d4-a716-446655440000",
 *       "quantity_held": 100,
 *       "uom": "kg",
 *       "notes": "Full batch affected - requires re-inspection"
 *     },
 *     {
 *       "reference_type": "wo",
 *       "reference_id": "550e8400-e29b-41d4-a716-446655440001",
 *       "notes": "Work order on hold pending metal contamination investigation"
 *     }
 *   ]
 * }
 *
 * @response {201} Created - Hold successfully created
 *   @content {object}
 *   - hold {object} The created quality hold:
 *     - id {string} UUID of the hold
 *     - hold_number {string} Auto-generated hold number (QH-YYYYMMDD-NNNN)
 *     - org_id {string} Organization ID
 *     - status {string} Always 'active' for newly created holds
 *     - priority {string} Priority level: 'low', 'medium', 'high', 'critical'
 *     - hold_type {string} Type: 'qa_pending', 'investigation', 'recall', 'quarantine'
 *     - reason {string} Full reason text
 *     - items_count {number} Number of items in the hold
 *     - held_by {object} User information { id, name, email }
 *     - held_at {string} ISO 8601 timestamp of creation
 *     - released_by {null} Always null (not released yet)
 *     - released_at {null} Always null (not released yet)
 *     - disposition {null} Always null (not released yet)
 *     - ncr_id {null} Null unless linked to NCR
 *     - created_by {string} User ID who created the hold
 *     - created_at {string} ISO 8601 creation timestamp
 *     - updated_by {string} User ID of last updater
 *     - updated_at {string} ISO 8601 last update timestamp
 *   
 *   - items {QualityHoldItem[]} Array of created hold items:
 *     - id {string} UUID of hold item
 *     - hold_id {string} UUID of parent hold
 *     - reference_type {string} Type: 'lp', 'wo', 'batch'
 *     - reference_id {string} UUID of referenced entity
 *     - reference_display {string} Display-friendly identifier (e.g., "LP-00001", "WO-00123")
 *     - quantity_held {number|null} Quantity if provided
 *     - uom {string|null} Unit of measure if provided
 *     - location_id {string|null} Location of item (for LP items)
 *     - location_name {string|null} Location name (for LP items)
 *     - notes {string|null} Notes if provided
 *   
 *   - lp_updates {object[]} [Optional] Summary of license plate updates (only if LP items were affected):
 *     - lp_id {string} UUID of license plate
 *     - lp_number {string} License plate number (e.g., "LP-00001")
 *     - previous_status {string} Previous qa_status (before hold)
 *     - new_status {string} New qa_status: 'hold'
 *
 * @response {400} Bad Request - Validation failed
 *   @content {object}
 *   Error scenarios:
 *   - Missing required fields (reason, hold_type, items)
 *   - Invalid enum values
 *   - Reason length validation (10-500 chars)
 *   - Invalid UUID format for reference_id
 *   - Quantity_held not positive
 *   - UOM or notes exceed max length
 *   - Empty items array
 *   - Duplicate items in array
 *   - Malformed JSON
 *   
 *   Response format:
 *   - error {string} "Invalid request data"
 *   - details {any[]} Zod validation errors
 *
 * @response {401} Unauthorized - Missing or invalid authentication
 *   @content {object}
 *   - error {string} "Unauthorized"
 *
 * @response {403} Forbidden - Insufficient permissions
 *   @content {object}
 *   Scenarios:
 *   - User role is VIEWER or OPERATOR (no write permission)
 *   - error {string} "Insufficient permissions to create quality holds"
 *
 * @response {404} Not Found - Referenced entity not found
 *   @content {object}
 *   Scenarios:
 *   - Referenced LP does not exist
 *   - Referenced WO does not exist
 *   - Referenced batch does not exist
 *   - Referenced entity belongs to different organization
 *   
 *   Response format:
 *   - error {string} Descriptive message ("License plate not found", "Work order not found", etc.)
 *
 * @response {500} Internal Server Error
 *   @content {object}
 *   - error {string} Error description
 *
 * @example
 * // Create hold for single LP item
 * POST /api/quality/holds
 * Content-Type: application/json
 * 
 * {
 *   "reason": "Failed metal detection test",
 *   "hold_type": "investigation",
 *   "priority": "critical",
 *   "items": [
 *     {
 *       "reference_type": "lp",
 *       "reference_id": "550e8400-e29b-41d4-a716-446655440000",
 *       "quantity_held": 500,
 *       "uom": "kg"
 *     }
 *   ]
 * }
 *
 * @effects
 * - Creates new record in quality_holds table
 * - Creates new record(s) in quality_hold_items table
 * - Updates license_plates.qa_status = 'hold' for affected LP items
 * - Creates audit trail with created_by and updated_by user IDs
 * - Does NOT update work_order qa_status (WOs don't track qa_status)
 *
 * @validation
 * - Request body validated against createHoldSchema (Zod)
 * - RLS check: Hold created in authenticated user's org only
 * - Referenced items must exist in same organization
 * - Hold number auto-generated via database trigger
 *
 * @rls Restricted to authenticated user's organization
 * @performance Should complete within 1 second for typical holds with < 10 items
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission - VIEWER cannot create holds
    if (auth.roleCode === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create quality holds' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createHoldSchema.parse(body)

    // Create hold
    const result = await QualityHoldService.createHold(validatedData, auth.orgId, auth.userId)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/quality/holds:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return handleError(error)
  }
}
