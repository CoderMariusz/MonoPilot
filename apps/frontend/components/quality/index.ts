/**
 * Quality Components (Story 06.1, 06.3)
 * Purpose: Reusable UI components for Quality module
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.1.quality-status-types.md}
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.3.product-specifications.md}
 */

export {
  QualityStatusBadge,
  getStatusConfig,
  getAllStatusConfigs,
  isShipmentAllowed,
  isConsumptionAllowed,
  type QualityStatus,
  type QualityStatusBadgeProps,
} from './QualityStatusBadge'

export {
  StatusTransitionModal,
  type EntityType,
  type StatusTransitionModalProps,
} from './StatusTransitionModal'

export {
  StatusHistoryTimeline,
  type StatusHistoryEntry,
  type StatusHistoryTimelineProps,
  type TimelineUser,
} from './StatusHistoryTimeline'

// Specifications Components (Story 06.3)
export {
  SpecificationsDataTable,
  SpecificationForm,
  SpecificationDetail,
  SpecificationStatusBadge,
  ReviewStatusBadge,
  VersionHistory,
  ApproveModal,
  CloneVersionDialog,
  CompleteReviewDialog,
} from './specifications'
