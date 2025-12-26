/**
 * Product Version History Types (Story 02.2)
 * TypeScript interfaces for product version tracking and history
 */

export interface VersionSummary {
  version: number
  changed_at: string
  changed_by: string
}

export interface VersionHistoryItem {
  id: string
  version: number
  changed_fields: ChangedFields
  changed_by: {
    id: string
    name: string
    email: string
  }
  changed_at: string
  is_initial: boolean
}

export type ChangedFields = Record<string, {
  old: unknown
  new: unknown
}>

export interface VersionsListResponse {
  versions: VersionSummary[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface HistoryResponse {
  history: VersionHistoryItem[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface HistoryFilters {
  from_date?: string
  to_date?: string
}
