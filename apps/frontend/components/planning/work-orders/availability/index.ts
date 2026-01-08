/**
 * Availability Components Index - Story 03.13
 *
 * Material availability components for Work Orders:
 * - WOAvailabilityPanel: Main container panel
 * - AvailabilitySummaryCard: Summary header with counts
 * - AvailabilityMaterialRow: Individual material row
 * - AvailabilityTrafficLight: Status indicator
 * - AvailabilityWarningModal: Shortage warning dialog
 *
 * @module components/planning/work-orders/availability
 */

export { WOAvailabilityPanel } from './WOAvailabilityPanel'
export { AvailabilitySummaryCard } from './AvailabilitySummaryCard'
export {
  AvailabilityMaterialRow,
  AvailabilityMaterialCard,
} from './AvailabilityMaterialRow'
export { AvailabilityTrafficLight } from './AvailabilityTrafficLight'
export { AvailabilityWarningModal } from './AvailabilityWarningModal'

// Re-export types
export type { WOAvailabilityPanelProps } from './WOAvailabilityPanel'
export type { AvailabilitySummaryCardProps } from './AvailabilitySummaryCard'
export type { AvailabilityMaterialRowProps } from './AvailabilityMaterialRow'
export type { AvailabilityTrafficLightProps } from './AvailabilityTrafficLight'
export type { AvailabilityWarningModalProps } from './AvailabilityWarningModal'
