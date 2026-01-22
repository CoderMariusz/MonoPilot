/**
 * Quality Components (Story 06.1)
 * Purpose: Reusable UI components for Quality module
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.1.quality-status-types.md}
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
