/**
 * Routing Operation Types - Story 02.8
 *
 * Types for routing operations (production steps) with:
 * - Parallel operations support (duplicate sequences)
 * - Time tracking (setup + duration + cleanup)
 * - Machine assignment (optional)
 * - Attachments support
 */

export interface RoutingOperation {
  id: string
  routing_id: string
  sequence: number
  name: string
  description: string | null
  machine_id: string | null
  machine_name: string | null
  machine_code: string | null
  setup_time: number       // minutes, default 0
  duration: number         // minutes, required
  cleanup_time: number     // minutes, default 0
  labor_cost_per_hour: number
  instructions: string | null  // max 2000 chars
  attachments?: OperationAttachment[]
  attachment_count: number
  created_at: string
  updated_at: string
}

export interface OperationAttachment {
  id: string
  operation_id: string
  file_name: string
  file_type: 'pdf' | 'png' | 'jpg' | 'jpeg' | 'docx'
  file_size: number         // bytes
  storage_path: string
  uploaded_by: string
  uploaded_at: string
}

export interface OperationsSummary {
  total_operations: number
  total_duration: number    // minutes (MAX per sequence for parallel)
  total_setup_time: number
  total_cleanup_time: number
  total_labor_cost: number  // SUM all ops including parallel
  average_yield: number     // weighted by duration
}

export interface CreateOperationRequest {
  sequence: number               // Required, positive, can duplicate for parallel
  name: string                   // Required, 3-100 chars
  description?: string | null
  machine_id?: string | null     // Optional, NULLABLE FK
  setup_time?: number            // Default 0
  duration: number               // Required, positive
  cleanup_time?: number          // Default 0
  labor_cost_per_hour?: number   // Default 0
  instructions?: string | null   // Max 2000 chars
}

export interface UpdateOperationRequest extends Partial<CreateOperationRequest> {
  id: string
}

export interface ReorderRequest {
  direction: 'up' | 'down'
}

export interface ReorderResponse {
  success: true
  updated_operations: Array<{ id: string; sequence: number }>
}

export interface RelatedBOM {
  id: string
  product_code: string
  product_name: string
  version: string
}

export interface OperationsListResponse {
  operations: RoutingOperation[]
  summary: OperationsSummary
}

export interface RoutingDetailResponse {
  id: string
  org_id: string
  code: string
  name: string
  description: string | null
  status: string
  version: number
  is_reusable: boolean
  created_at: string
  updated_at: string
  operations: RoutingOperation[]
  summary: OperationsSummary
  related_boms: RelatedBOM[]
}

export interface Machine {
  id: string
  code: string
  name: string
}
