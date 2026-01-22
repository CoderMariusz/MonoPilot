'use client'

/**
 * ParameterTable Component
 * Story: 06.4 - Test Parameters
 *
 * Sortable list of parameters using @dnd-kit.
 * Supports drag-to-reorder for draft specifications.
 */

import * as React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ParameterRow } from './ParameterRow'
import type { QualitySpecParameter } from '@/lib/types/quality'

export interface ParameterTableProps {
  /** List of parameters */
  parameters: QualitySpecParameter[]
  /** Whether the table supports drag-to-reorder (draft spec only) */
  draggable?: boolean
  /** Whether edit/delete actions are enabled (draft spec only) */
  editable?: boolean
  /** Callback when parameters are reordered */
  onReorder?: (parameterIds: string[]) => void
  /** Callback for edit action */
  onEdit?: (parameter: QualitySpecParameter) => void
  /** Callback for delete action */
  onDelete?: (parameter: QualitySpecParameter) => void
}

export function ParameterTable({
  parameters,
  draggable = false,
  editable = false,
  onReorder,
  onEdit,
  onDelete,
}: ParameterTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = parameters.findIndex((p) => p.id === active.id)
      const newIndex = parameters.findIndex((p) => p.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(parameters, oldIndex, newIndex)
        onReorder?.(reordered.map((p) => p.id))
      }
    }
  }

  // Sort by sequence
  const sortedParameters = [...parameters].sort((a, b) => a.sequence - b.sequence)
  const parameterIds = sortedParameters.map((p) => p.id)

  if (!draggable) {
    // Non-draggable list (read-only mode)
    return (
      <div className="space-y-2">
        {sortedParameters.map((param) => (
          <ParameterRow
            key={param.id}
            parameter={param}
            draggable={false}
            editable={editable}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    )
  }

  // Draggable list
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={parameterIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2" role="list" aria-label="Parameters list">
          {sortedParameters.map((param) => (
            <ParameterRow
              key={param.id}
              parameter={param}
              draggable={draggable}
              editable={editable}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default ParameterTable
