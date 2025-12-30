/**
 * BOM Components - Story 02.4, 02.5a, 02.14
 * Index file for BOM-related components
 */

// Story 02.4 - BOM Header CRUD
export { BOMsDataTable } from './BOMsDataTable'
export { BOMHeaderForm } from './BOMHeaderForm'
export { BOMStatusBadge } from './BOMStatusBadge'
export { BOMVersionTimeline } from './BOMVersionTimeline'
export { BOMTimelineModal } from './BOMTimelineModal'
export { DeleteBOMDialog } from './DeleteBOMDialog'
export { ProductSelector } from './ProductSelector'

// Story 02.5a - BOM Items Core (MVP)
export { BOMItemsTable } from './BOMItemsTable'
export type { BOMItemsTableProps } from './BOMItemsTable'
export { BOMItemModal } from './BOMItemModal'
export type { BOMItemModalProps } from './BOMItemModal'

// Story 02.14 - BOM Advanced Features
export { BOMComparisonModal } from './BOMComparisonModal'
export type { BOMComparisonModalProps } from './BOMComparisonModal'
export { BOMVersionSelector, BOMVersionSelectorInline } from './BOMVersionSelector'
export type { BOMVersionSelectorProps } from './BOMVersionSelector'
export { DiffHighlighter, DiffRow, DiffCell, DiffBadge, getDiffRowClass, getDiffCellClass, getDiffTextClass } from './DiffHighlighter'
export type { DiffHighlighterProps, DiffRowProps, DiffCellProps, DiffBadgeProps } from './DiffHighlighter'
export { MultiLevelExplosion } from './MultiLevelExplosion'
export type { MultiLevelExplosionProps } from './MultiLevelExplosion'
export { BOMScaleModal } from './BOMScaleModal'
export type { BOMScaleModalProps } from './BOMScaleModal'
export { ScalePreviewTable, ScalePreviewLoading } from './ScalePreviewTable'
export type { ScalePreviewTableProps } from './ScalePreviewTable'
export { YieldAnalysisPanel } from './YieldAnalysisPanel'
export type { YieldAnalysisPanelProps } from './YieldAnalysisPanel'
export { YieldConfigModal } from './YieldConfigModal'
export type { YieldConfigModalProps } from './YieldConfigModal'
