/**
 * Shipping Allocation Components
 * Story 07.7: Inventory Allocation
 *
 * Exports all allocation-related components:
 * - AllocationPanel - Main allocation modal
 * - AllocationStatusBadge - Status display badge
 * - ManualAllocationModal - Manual quantity edit modal
 */

export { AllocationPanel } from './AllocationPanel'
export type { AllocationPanelProps } from './AllocationPanel'

export { AllocationStatusBadge } from './AllocationStatusBadge'
export type {
  AllocationStatus,
  AllocationStatusBadgeProps,
} from './AllocationStatusBadge'

export { ManualAllocationModal } from './ManualAllocationModal'
export type { ManualAllocationModalProps } from './ManualAllocationModal'
