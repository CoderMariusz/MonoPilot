/**
 * Work Order Detail Components
 * Stories: 04.2b (Pause/Resume), 04.4 (Yield Tracking)
 *
 * Export all work order detail components for use in WO detail page.
 */

// Shared types from validation
export type { WOStatus } from '@/lib/validation/production-schemas'

// Yield Tracking (Story 04.4)
export { YieldSection, type YieldSectionProps } from './YieldSection'
export {
  YieldGauge,
  YieldGaugeSkeleton,
  getYieldStatus,
  type YieldStatus,
  type YieldGaugeProps,
} from './YieldGauge'
export { YieldWarningBanner, type YieldWarningBannerProps } from './YieldWarningBanner'
export {
  YieldEntryForm,
  YieldEntryFormSkeleton,
  type YieldEntryFormProps,
  type YieldUpdateResult,
} from './YieldEntryForm'
export {
  YieldHistoryTable,
  YieldHistoryTableSkeleton,
  type YieldHistoryTableProps,
  type YieldLogEntry,
} from './YieldHistoryTable'

// Pause/Resume (Story 04.2b)
export {
  PauseReasonSelect,
  PAUSE_REASONS,
  getPauseReasonOption,
  getPauseReasonLabel,
  getPauseReasonIcon,
  type PauseReasonSelectProps,
} from './PauseReasonSelect'
export { WOPauseModal, type WOPauseModalProps, type WOPauseRecord } from './WOPauseModal'
export { WOResumeModal, type WOResumeModalProps, type PauseInfo } from './WOResumeModal'
export { WOPauseButton, type WOPauseButtonProps } from './WOPauseButton'
export {
  WOResumeButton,
  type WOResumeButtonProps,
  type WOPauseRecord as ResumeButtonPauseRecord,
} from './WOResumeButton'
export {
  WOPauseHistory,
  WOPauseHistorySkeleton,
  type WOPauseHistoryProps,
  type WOPauseHistoryRecord,
  type PauseSummary,
} from './WOPauseHistory'
