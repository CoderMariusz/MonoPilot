/**
 * Quality Specifications Components (Story 06.3 + 06.4)
 * Purpose: Reusable UI components for Quality Specifications module
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.3.product-specifications.md}
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.4.test-parameters.md}
 */

export { SpecificationsDataTable } from './SpecificationsDataTable'
export { SpecificationForm } from './SpecificationForm'
export { SpecificationDetail } from './SpecificationDetail'
export { SpecificationStatusBadge } from './SpecificationStatusBadge'
export { ReviewStatusBadge } from './ReviewStatusBadge'
export { VersionHistory } from './VersionHistory'
export { ApproveModal } from './ApproveModal'
export { CloneVersionDialog } from './CloneVersionDialog'
export { CompleteReviewDialog } from './CompleteReviewDialog'

// Parameter components (Story 06.4)
export {
  ParameterEditor,
  ParameterTable,
  ParameterRow,
  ParameterForm,
  CriticalBadge,
  ParameterTypeBadge,
  TestMethodAutocomplete,
  UnitSelector,
  DeleteParameterDialog,
} from './parameters'

// Re-export types
export type { SpecificationStatusBadgeProps } from './SpecificationStatusBadge'
export type { ReviewStatusBadgeProps } from './ReviewStatusBadge'
export type { VersionHistoryProps } from './VersionHistory'
export type { ApproveModalProps } from './ApproveModal'
export type { CloneVersionDialogProps } from './CloneVersionDialog'
export type { CompleteReviewDialogProps } from './CompleteReviewDialog'
export type { SpecificationFormProps } from './SpecificationForm'
export type { SpecificationDetailProps } from './SpecificationDetail'

// Parameter types (Story 06.4)
export type {
  ParameterEditorProps,
  ParameterTableProps,
  ParameterRowProps,
  ParameterFormProps,
  CriticalBadgeProps,
  ParameterTypeBadgeProps,
  TestMethodAutocompleteProps,
  UnitSelectorProps,
  DeleteParameterDialogProps,
} from './parameters'
