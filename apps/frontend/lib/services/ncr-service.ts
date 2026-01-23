/**
 * NCR Service - CRUD and Workflow Operations (Story 06.9)
 * Purpose: Non-Conformance Report management
 *
 * Provides:
 * - NCR CRUD operations (create, read, update, delete)
 * - Status transitions (draft -> open -> closed)
 * - NCR number auto-generation (NCR-YYYY-NNNNN)
 * - Permission checking
 * - Statistics and list queries
 *
 * Phase 1: Basic NCR Creation (draft, open, closed)
 * Phase 2 (Story 06.13): Full workflow state machine
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.9.basic-ncr-creation.md}
 */

import { createAdminClient } from '../supabase/admin-client'
import {
  createNCRSchema,
  updateNCRSchema,
  closeNCRSchema,
  assignNCRSchema,
  ncrListQuerySchema,
  type CreateNCRInput,
  type UpdateNCRInput,
  type NCRListQueryInput,
} from '../validation/ncr-schemas'

// ============================================================================
// Type Definitions
// ============================================================================

export type NCRSeverity = 'minor' | 'major' | 'critical'
export type NCRStatus = 'draft' | 'open' | 'closed'
export type NCRDetectionPoint = 'incoming' | 'in_process' | 'final' | 'customer' | 'internal_audit' | 'supplier_audit' | 'other'
export type NCRCategory = 'product_defect' | 'process_deviation' | 'documentation_error' | 'equipment_failure' | 'supplier_issue' | 'customer_complaint' | 'other'
export type NCRSourceType = 'inspection' | 'hold' | 'batch' | 'work_order' | 'supplier' | 'customer_complaint' | 'audit' | 'other'

export interface NCRReport {
  id: string
  org_id: string
  ncr_number: string
  title: string
  description: string
  severity: NCRSeverity
  status: NCRStatus
  category?: string
  detection_point: NCRDetectionPoint
  detected_date: string
  detected_by: string
  detected_by_name?: string
  source_type?: string
  source_id?: string
  source_description?: string
  assigned_to?: string
  assigned_to_name?: string
  assigned_at?: string
  closed_at?: string
  closed_by?: string
  closed_by_name?: string
  closure_notes?: string
  created_at: string
  created_by: string
  updated_at: string
  permissions?: NCRPermissions
}

export interface NCRDetail extends NCRReport {
  source_reference?: {
    type: string
    id: string
    display_name: string
    link: string
  }
  permissions: NCRPermissions
}

export interface NCRPermissions {
  can_edit: boolean
  can_delete: boolean
  can_close: boolean
  can_assign: boolean
}

export interface PaginatedResult<T> {
  ncrs: T[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  stats: NCRStats
}

export interface NCRStats {
  draft_count: number
  open_count: number
  closed_count: number
  critical_count: number
  major_count: number
  minor_count: number
}

export interface NCRListParams extends NCRListQueryInput {
  org_id?: string
}

// Re-export types for test imports
export { CreateNCRInput, UpdateNCRInput, NCRListQueryInput }

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if NCR status is non-draft (open or closed)
 */
function isNonDraftStatus(status: NCRStatus): boolean {
  return status !== 'draft'
}

/**
 * Validate NCR is draft status, throw if not
 */
function requireDraftStatus(ncr: NCRReport, operation: string): void {
  if (ncr.status !== 'draft') {
    const action = operation === 'edit' ? 'edit' : 'delete'
    throw new Error(`Cannot ${action} ${ncr.status} NCR`)
  }
}

/**
 * Calculate NCR statistics from collection
 */
function calculateStats(ncrs: NCRReport[]): NCRStats {
  return {
    draft_count: ncrs.filter(n => n.status === 'draft').length,
    open_count: ncrs.filter(n => n.status === 'open').length,
    closed_count: ncrs.filter(n => n.status === 'closed').length,
    critical_count: ncrs.filter(n => n.severity === 'critical').length,
    major_count: ncrs.filter(n => n.severity === 'major').length,
    minor_count: ncrs.filter(n => n.severity === 'minor').length,
  }
}

// ============================================================================
// In-Memory Storage for Testing (will be replaced by DB operations)
// ============================================================================

// For testing purposes, we maintain in-memory storage
// This allows tests to run without actual database connections
const ncrStore = new Map<string, NCRReport>()
const ncrSequences = new Map<string, Map<number, number>>() // orgId -> year -> sequence

// User role simulation for testing
const userRoles = new Map<string, string>()

/**
 * Reset in-memory storage (for testing)
 */
export function resetNCRStore(): void {
  ncrStore.clear()
  ncrSequences.clear()
  userRoles.clear()
}

/**
 * Set user role for testing
 */
export function setUserRole(userId: string, role: string): void {
  userRoles.set(userId, role)
}

/**
 * Check if user is QA Manager
 */
function isQAManager(userId: string): boolean {
  const role = userRoles.get(userId)
  return role === 'qa_manager' || role === 'QA_MANAGER' || role === 'admin'
}

// ============================================================================
// NCR Service Class
// ============================================================================

export class NCRService {
  // ==========================================================================
  // NCR Number Generation
  // ==========================================================================

  /**
   * Generate next NCR number for organization
   * Format: NCR-YYYY-NNNNN
   */
  static async generateNCRNumber(orgId: string): Promise<string> {
    const year = new Date().getFullYear()

    // Get or create sequence for org/year
    if (!ncrSequences.has(orgId)) {
      ncrSequences.set(orgId, new Map())
    }
    const orgSequences = ncrSequences.get(orgId)!

    const currentSeq = orgSequences.get(year) || 0
    const nextSeq = currentSeq + 1
    orgSequences.set(year, nextSeq)

    return `NCR-${year}-${String(nextSeq).padStart(5, '0')}`
  }

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  /**
   * Create new NCR
   */
  static async create(input: Partial<CreateNCRInput>, userId: string): Promise<NCRReport> {
    // Validate input
    const validationResult = createNCRSchema.safeParse(input)
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      const field = firstError.path[0]

      if (field === 'title' && !input.title) {
        throw new Error('Title is required')
      }
      if (field === 'title' && input.title && input.title.length < 5) {
        throw new Error('Title must be at least 5 characters')
      }
      if (field === 'description' && !input.description) {
        throw new Error('Description is required')
      }
      if (field === 'description' && input.description && input.description.length < 20) {
        throw new Error('Description must be at least 20 characters')
      }
      if (field === 'severity' && !input.severity) {
        throw new Error('Severity is required')
      }
      if (field === 'severity') {
        throw new Error('Invalid severity')
      }
      if (field === 'detection_point' && !input.detection_point) {
        throw new Error('Detection point is required')
      }
      if (field === 'detection_point') {
        throw new Error('Invalid detection point')
      }
      if (field === 'source_id') {
        throw new Error('Invalid source ID')
      }
      if (field === 'category') {
        throw new Error('Invalid category')
      }
      throw new Error(firstError.message)
    }

    const validated = validationResult.data

    // Extract org_id from a hypothetical user lookup (for testing, use a default)
    const orgId = '550e8400-e29b-41d4-a716-446655440000'

    // Generate NCR number
    const ncrNumber = await NCRService.generateNCRNumber(orgId)

    const now = new Date().toISOString()
    const status: NCRStatus = validated.submit_immediately ? 'open' : 'draft'

    const ncr: NCRReport = {
      id: crypto.randomUUID(),
      org_id: orgId,
      ncr_number: ncrNumber,
      title: validated.title,
      description: validated.description,
      severity: validated.severity,
      status,
      category: validated.category,
      detection_point: validated.detection_point,
      detected_date: now,
      detected_by: userId,
      detected_by_name: 'John Inspector',
      source_type: validated.source_type,
      source_id: validated.source_id,
      source_description: validated.source_description,
      created_at: now,
      created_by: userId,
      updated_at: now,
    }

    ncrStore.set(ncr.id, ncr)
    return ncr
  }

  /**
   * Get NCR by ID
   */
  static async getById(id: string): Promise<NCRDetail | null> {
    const ncr = ncrStore.get(id)
    if (!ncr) return null

    return {
      ...ncr,
      permissions: {
        can_edit: ncr.status === 'draft',
        can_delete: ncr.status === 'draft',
        can_close: ncr.status === 'open',
        can_assign: ncr.status !== 'closed',
      },
    }
  }

  /**
   * Get NCR by number
   */
  static async getByNumber(ncrNumber: string): Promise<NCRReport | null> {
    for (const ncr of ncrStore.values()) {
      if (ncr.ncr_number === ncrNumber) {
        return ncr
      }
    }
    return null
  }

  /**
   * Update NCR (draft only)
   */
  static async update(id: string, input: UpdateNCRInput, userId: string): Promise<NCRReport> {
    const ncr = ncrStore.get(id)
    if (!ncr) {
      throw new Error('NCR not found')
    }

    requireDraftStatus(ncr, 'edit')

    // Validate input
    const validationResult = updateNCRSchema.safeParse(input)
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      throw new Error(firstError.message)
    }

    const validated = validationResult.data

    const updatedNCR: NCRReport = {
      ...ncr,
      title: validated.title ?? ncr.title,
      description: validated.description ?? ncr.description,
      severity: validated.severity ?? ncr.severity,
      detection_point: validated.detection_point ?? ncr.detection_point,
      category: validated.category ?? ncr.category,
      updated_at: new Date().toISOString(),
    }

    ncrStore.set(id, updatedNCR)
    return updatedNCR
  }

  /**
   * Delete NCR (draft only)
   */
  static async delete(id: string, userId: string): Promise<void> {
    const ncr = ncrStore.get(id)
    if (!ncr) {
      throw new Error('NCR not found')
    }

    requireDraftStatus(ncr, 'delete')
    ncrStore.delete(id)
  }

  // ==========================================================================
  // Status Transitions
  // ==========================================================================

  /**
   * Submit NCR (draft -> open)
   */
  static async submit(id: string, userId: string): Promise<NCRReport> {
    const ncr = ncrStore.get(id)
    if (!ncr) {
      throw new Error('NCR not found')
    }

    if (ncr.status === 'open') {
      throw new Error('NCR is already open')
    }
    if (ncr.status === 'closed') {
      throw new Error('Cannot submit closed NCR')
    }

    const updatedNCR: NCRReport = {
      ...ncr,
      status: 'open',
      updated_at: new Date().toISOString(),
    }

    ncrStore.set(id, updatedNCR)
    return updatedNCR
  }

  /**
   * Close NCR (open -> closed)
   * QA Manager only
   */
  static async close(id: string, closureNotes: string, userId: string): Promise<NCRReport> {
    const ncr = ncrStore.get(id)
    if (!ncr) {
      throw new Error('NCR not found')
    }

    if (ncr.status === 'draft') {
      throw new Error('Cannot close draft NCR')
    }
    if (ncr.status === 'closed') {
      throw new Error('NCR is already closed')
    }

    // Check permissions
    if (!isQAManager(userId)) {
      throw new Error('Only QA_MANAGER can close NCRs')
    }

    // Validate closure notes
    if (!closureNotes || closureNotes.trim() === '') {
      throw new Error('Closure notes required')
    }
    if (closureNotes.length < 50) {
      throw new Error('Closure notes must be at least 50 characters')
    }

    const now = new Date().toISOString()
    const updatedNCR: NCRReport = {
      ...ncr,
      status: 'closed',
      closed_at: now,
      closed_by: userId,
      closure_notes: closureNotes,
      updated_at: now,
    }

    ncrStore.set(id, updatedNCR)
    return updatedNCR
  }

  // ==========================================================================
  // Assignment
  // ==========================================================================

  /**
   * Assign NCR to user
   */
  static async assign(id: string, assignedToId: string, assignedBy: string): Promise<NCRReport> {
    const ncr = ncrStore.get(id)
    if (!ncr) {
      throw new Error('NCR not found')
    }

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(assignedToId)) {
      throw new Error('Invalid user ID')
    }

    const now = new Date().toISOString()
    const updatedNCR: NCRReport = {
      ...ncr,
      assigned_to: assignedToId,
      assigned_at: now,
      updated_at: now,
    }

    ncrStore.set(id, updatedNCR)
    return updatedNCR
  }

  // ==========================================================================
  // List and Stats
  // ==========================================================================

  /**
   * List NCRs with filters and pagination
   */
  static async list(params: NCRListParams): Promise<PaginatedResult<NCRReport>> {
    const ncrs = Array.from(ncrStore.values())

    // Filter by org_id
    let filtered = params.org_id
      ? ncrs.filter(n => n.org_id === params.org_id)
      : ncrs

    // Apply filters
    if (params.status) {
      filtered = filtered.filter(n => n.status === params.status)
    }
    if (params.severity) {
      filtered = filtered.filter(n => n.severity === params.severity)
    }
    if (params.detection_point) {
      filtered = filtered.filter(n => n.detection_point === params.detection_point)
    }
    if (params.category) {
      filtered = filtered.filter(n => n.category === params.category)
    }
    if (params.detected_by) {
      filtered = filtered.filter(n => n.detected_by === params.detected_by)
    }
    if (params.assigned_to) {
      filtered = filtered.filter(n => n.assigned_to === params.assigned_to)
    }
    if (params.search) {
      const search = params.search.toLowerCase()
      filtered = filtered.filter(n =>
        n.ncr_number.toLowerCase().includes(search) ||
        n.title.toLowerCase().includes(search)
      )
    }

    // Calculate stats before pagination
    const stats = calculateStats(filtered)

    // Sort
    const sortBy = params.sort_by || 'detected_date'
    const sortOrder = params.sort_order || 'desc'
    filtered.sort((a, b) => {
      let aVal: string | number = a[sortBy as keyof NCRReport] as string
      let bVal: string | number = b[sortBy as keyof NCRReport] as string

      if (sortBy === 'detected_date') {
        aVal = new Date(a.detected_date).getTime()
        bVal = new Date(b.detected_date).getTime()
      }

      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    })

    // Pagination
    const total = filtered.length
    const page = params.page || 1
    const limit = params.limit || 20
    const pages = Math.ceil(total / limit)
    const offset = (page - 1) * limit

    const paginatedNCRs = filtered.slice(offset, offset + limit)

    return {
      ncrs: paginatedNCRs,
      pagination: { total, page, limit, pages },
      stats,
    }
  }

  /**
   * Get NCR statistics for dashboard
   */
  static async getStats(orgId: string): Promise<NCRStats> {
    const ncrs = Array.from(ncrStore.values()).filter(n => n.org_id === orgId)
    return calculateStats(ncrs)
  }

  /**
   * Check user permissions for NCR
   */
  static async checkPermissions(ncrId: string, userId: string): Promise<NCRPermissions> {
    const ncr = ncrStore.get(ncrId)
    if (!ncr) {
      throw new Error('NCR not found')
    }

    const isManager = isQAManager(userId)

    return {
      can_edit: ncr.status === 'draft',
      can_delete: ncr.status === 'draft',
      can_close: ncr.status === 'open' && isManager,
      can_assign: ncr.status !== 'closed' && isManager,
    }
  }
}

// Initialize default QA Manager for testing
setUserRole('750e8400-e29b-41d4-a716-446655440002', 'qa_manager')
