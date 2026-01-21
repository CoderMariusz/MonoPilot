/**
 * Material Consumption Components (Story 04.6a, 04.6b, 04.6c)
 *
 * @module components/production/consumption
 */

export { WOSummaryCard } from './WOSummaryCard'
export { MaterialsTable } from './MaterialsTable'
export { LPSearchInput } from './LPSearchInput'
export { AddConsumptionModal } from './AddConsumptionModal'
export { ReverseConsumptionModal } from './ReverseConsumptionModal'
export { ConsumptionHistoryTableEnhanced } from './ConsumptionHistoryTableEnhanced'

// Story 04.6c - 1:1 Consumption Enforcement
export { FullLPRequiredBadge } from './FullLPRequiredBadge'
export type { FullLPRequiredBadgeProps } from './FullLPRequiredBadge'
export { ConsumptionQtyInput } from './ConsumptionQtyInput'
export type { ConsumptionQtyInputProps } from './ConsumptionQtyInput'

// Story 04.6e - Over-Consumption Control
export { VarianceIndicator } from './VarianceIndicator'
export type { VarianceIndicatorProps } from './VarianceIndicator'
export { OverConsumptionApprovalModal } from './OverConsumptionApprovalModal'
export type {
  OverConsumptionApprovalModalProps,
  OverConsumptionData,
  PendingRequest,
  ApprovalData,
  RejectionData,
} from './OverConsumptionApprovalModal'
