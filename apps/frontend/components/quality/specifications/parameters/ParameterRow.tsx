'use client'

/**
 * ParameterRow Component
 * Story: 06.4 - Test Parameters
 *
 * Individual parameter row for the parameter table.
 * Supports drag-and-drop via @dnd-kit/sortable.
 */

import * as React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Edit, Trash2, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CriticalBadge } from './CriticalBadge'
import { ParameterTypeBadge } from './ParameterTypeBadge'
import type { QualitySpecParameter } from '@/lib/types/quality'

export interface ParameterRowProps {
  /** Parameter data */
  parameter: QualitySpecParameter
  /** Whether the row is draggable (draft spec only) */
  draggable?: boolean
  /** Whether actions are enabled (draft spec only) */
  editable?: boolean
  /** Callback for edit action */
  onEdit?: (parameter: QualitySpecParameter) => void
  /** Callback for delete action */
  onDelete?: (parameter: QualitySpecParameter) => void
}

/**
 * Format value display based on parameter type
 */
function formatValueDisplay(parameter: QualitySpecParameter): string {
  const { parameter_type, min_value, max_value, target_value, unit } = parameter
  const unitSuffix = unit ? ` ${unit}` : ''

  switch (parameter_type) {
    case 'numeric':
      if (min_value !== null && max_value !== null) {
        return `Min: ${min_value}${unitSuffix}, Max: ${max_value}${unitSuffix}`
      } else if (min_value !== null) {
        return `Min: ${min_value}${unitSuffix}`
      } else if (max_value !== null) {
        return `Max: ${max_value}${unitSuffix}`
      } else if (target_value) {
        return `Target: ${target_value}${unitSuffix}`
      }
      return '-'

    case 'range':
      if (min_value !== null && max_value !== null) {
        return `${min_value} - ${max_value}${unitSuffix}`
      }
      return '-'

    case 'boolean':
      return target_value ? `Target: ${target_value}` : 'Yes/No'

    case 'text':
      if (target_value) {
        return target_value.length > 30
          ? `${target_value.substring(0, 30)}...`
          : target_value
      }
      return 'See criteria'

    default:
      return '-'
  }
}

export function ParameterRow({
  parameter,
  draggable = false,
  editable = false,
  onEdit,
  onDelete,
}: ParameterRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: parameter.id,
    disabled: !draggable,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-3 border rounded-lg bg-background
        ${isDragging ? 'shadow-lg z-50' : ''}
        ${parameter.is_critical ? 'border-red-200 bg-red-50/30' : ''}
      `}
    >
      {/* Drag Handle */}
      {draggable && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* Sequence Number */}
      <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 min-w-[2rem] text-center">
        {parameter.sequence}
      </Badge>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Name */}
          <span className={`font-medium ${parameter.is_critical ? 'text-red-900' : ''}`}>
            {parameter.parameter_name}
          </span>
          {/* Type Badge */}
          <ParameterTypeBadge type={parameter.parameter_type} size="sm" />
          {/* Critical Badge */}
          <CriticalBadge isCritical={parameter.is_critical} size="sm" />
          {/* Equipment Badge */}
          {parameter.instrument_required && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 gap-1">
                    <Wrench className="h-3 w-3" />
                    Equipment
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {parameter.instrument_name
                    ? `Requires: ${parameter.instrument_name}`
                    : 'Requires specific equipment'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Value Display */}
        <div className="text-sm text-muted-foreground mt-1">
          {formatValueDisplay(parameter)}
        </div>

        {/* Test Method (if set) */}
        {parameter.test_method && (
          <div className="text-xs text-muted-foreground mt-0.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    Method: {parameter.test_method.length > 40
                      ? `${parameter.test_method.substring(0, 40)}...`
                      : parameter.test_method}
                  </span>
                </TooltipTrigger>
                {parameter.test_method.length > 40 && (
                  <TooltipContent className="max-w-xs">
                    {parameter.test_method}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Actions */}
      {editable && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit?.(parameter)}
            aria-label={`Edit ${parameter.parameter_name}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete?.(parameter)}
            aria-label={`Delete ${parameter.parameter_name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default ParameterRow
