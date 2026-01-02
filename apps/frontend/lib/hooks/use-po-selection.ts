/**
 * PO Selection Hook
 * Story: 03.6 - PO Bulk Operations
 * Manages row selection state for bulk operations
 */

import { useState, useCallback, useMemo } from 'react'
import type { POStatus } from '@/lib/types/purchase-order'
import type { POListItem } from '@/lib/types/purchase-order'

interface UsePOSelectionReturn {
  /** Set of selected PO IDs */
  selectedIds: string[]
  /** Map of selected PO statuses */
  selectedStatuses: POStatus[]
  /** Whether all visible POs are selected */
  isAllSelected: boolean
  /** Whether some but not all visible POs are selected */
  isPartiallySelected: boolean
  /** Number of selected POs */
  selectedCount: number
  /** Toggle selection of a single PO */
  toggleSelection: (id: string, status: POStatus) => void
  /** Toggle selection of all visible POs */
  toggleAll: (items: POListItem[]) => void
  /** Clear all selections */
  clearSelection: () => void
  /** Select specific POs */
  selectItems: (items: POListItem[]) => void
  /** Check if a specific PO is selected */
  isSelected: (id: string) => boolean
}

/**
 * Hook for managing PO selection state
 */
export function usePOSelection(visibleItems: POListItem[] = []): UsePOSelectionReturn {
  const [selectedMap, setSelectedMap] = useState<Map<string, POStatus>>(new Map())

  const selectedIds = useMemo(() => Array.from(selectedMap.keys()), [selectedMap])
  const selectedStatuses = useMemo(() => Array.from(selectedMap.values()), [selectedMap])
  const selectedCount = selectedIds.length

  const isAllSelected = useMemo(() => {
    if (visibleItems.length === 0) return false
    return visibleItems.every((item) => selectedMap.has(item.id))
  }, [visibleItems, selectedMap])

  const isPartiallySelected = useMemo(() => {
    if (visibleItems.length === 0) return false
    const selectedFromVisible = visibleItems.filter((item) => selectedMap.has(item.id))
    return selectedFromVisible.length > 0 && selectedFromVisible.length < visibleItems.length
  }, [visibleItems, selectedMap])

  const toggleSelection = useCallback((id: string, status: POStatus) => {
    setSelectedMap((prev) => {
      const next = new Map(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.set(id, status)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback((items: POListItem[]) => {
    setSelectedMap((prev) => {
      // Check if all items are already selected
      const allSelected = items.every((item) => prev.has(item.id))

      if (allSelected) {
        // Deselect all visible items
        const next = new Map(prev)
        items.forEach((item) => next.delete(item.id))
        return next
      } else {
        // Select all visible items
        const next = new Map(prev)
        items.forEach((item) => next.set(item.id, item.status))
        return next
      }
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedMap(new Map())
  }, [])

  const selectItems = useCallback((items: POListItem[]) => {
    setSelectedMap((prev) => {
      const next = new Map(prev)
      items.forEach((item) => next.set(item.id, item.status))
      return next
    })
  }, [])

  const isSelected = useCallback(
    (id: string) => selectedMap.has(id),
    [selectedMap]
  )

  return {
    selectedIds,
    selectedStatuses,
    isAllSelected,
    isPartiallySelected,
    selectedCount,
    toggleSelection,
    toggleAll,
    clearSelection,
    selectItems,
    isSelected,
  }
}

export default usePOSelection
