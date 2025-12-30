/**
 * DiffHighlighter Component (Story 02.14)
 * Visual diff highlighting for BOM comparison
 * FR-2.25: Diff highlighting (green=added, red=removed, yellow=modified)
 *
 * Features:
 * - Color-coded backgrounds based on diff type
 * - Strike-through for old values
 * - Percentage change indicator
 * - ARIA labels for accessibility
 * - Icons for non-color differentiation
 */

'use client'

import React from 'react'
import { Plus, Minus, RefreshCw, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DiffType } from '@/lib/types/bom-advanced'

// ========================================
// Props Interface
// ========================================

export interface DiffHighlighterProps {
  /** Type of diff: added, removed, modified, unchanged */
  type: DiffType
  /** Content to display */
  value: React.ReactNode
  /** Old value for modified items */
  oldValue?: string | number | null
  /** Percentage change (for quantity changes) */
  changePercent?: number | null
  /** Additional className */
  className?: string
  /** Show icon indicator (for accessibility - not color alone) */
  showIcon?: boolean
}

// ========================================
// Style Configuration
// ========================================

const diffStyles: Record<DiffType, {
  row: string
  cell: string
  text: string
  icon: React.ElementType
  iconColor: string
  label: string
}> = {
  added: {
    row: 'bg-green-50 border-l-4 border-green-500',
    cell: 'bg-green-50',
    text: 'text-green-800',
    icon: Plus,
    iconColor: 'text-green-600',
    label: 'Added',
  },
  removed: {
    row: 'bg-red-50 border-l-4 border-red-500',
    cell: 'bg-red-50',
    text: 'text-red-800 line-through opacity-70',
    icon: Minus,
    iconColor: 'text-red-600',
    label: 'Removed',
  },
  modified: {
    row: 'bg-yellow-50 border-l-4 border-yellow-500',
    cell: 'bg-yellow-50',
    text: 'text-yellow-800',
    icon: RefreshCw,
    iconColor: 'text-yellow-600',
    label: 'Modified',
  },
  unchanged: {
    row: '',
    cell: '',
    text: '',
    icon: Check,
    iconColor: 'text-gray-400',
    label: 'Unchanged',
  },
}

// ========================================
// DiffHighlighter Component
// ========================================

export function DiffHighlighter({
  type,
  value,
  oldValue,
  changePercent,
  className,
  showIcon = true,
}: DiffHighlighterProps) {
  const style = diffStyles[type]
  const Icon = style.icon

  return (
    <span
      className={cn('inline-flex items-center gap-1', style.text, className)}
      aria-label={`${style.label}: ${value}${oldValue !== undefined ? ` (was ${oldValue})` : ''}`}
    >
      {showIcon && (
        <Icon
          className={cn('h-3.5 w-3.5 flex-shrink-0', style.iconColor)}
          aria-hidden="true"
        />
      )}
      <span>{value}</span>
      {type === 'modified' && oldValue !== undefined && oldValue !== null && (
        <span className="text-xs text-gray-500 line-through ml-1">
          ({oldValue})
        </span>
      )}
      {changePercent !== null && changePercent !== undefined && (
        <span
          className={cn(
            'text-xs ml-1',
            changePercent > 0 ? 'text-green-600' : changePercent < 0 ? 'text-red-600' : 'text-gray-500'
          )}
        >
          {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
        </span>
      )}
    </span>
  )
}

// ========================================
// DiffRow Component (for table rows)
// ========================================

export interface DiffRowProps {
  type: DiffType
  children: React.ReactNode
  className?: string
}

export function DiffRow({ type, children, className }: DiffRowProps) {
  const style = diffStyles[type]

  return (
    <tr
      className={cn(style.row, className)}
      data-diff-type={type}
      aria-label={`${style.label} row`}
    >
      {children}
    </tr>
  )
}

// ========================================
// DiffCell Component (for table cells)
// ========================================

export interface DiffCellProps {
  type: DiffType
  children: React.ReactNode
  className?: string
  highlight?: boolean
}

export function DiffCell({ type, children, className, highlight = false }: DiffCellProps) {
  const style = diffStyles[type]

  return (
    <td
      className={cn(
        'px-4 py-3',
        highlight && style.cell,
        className
      )}
    >
      {children}
    </td>
  )
}

// ========================================
// DiffBadge Component (for status indicators)
// ========================================

export interface DiffBadgeProps {
  type: DiffType
  className?: string
}

export function DiffBadge({ type, className }: DiffBadgeProps) {
  const style = diffStyles[type]
  const Icon = style.icon

  const badgeStyles: Record<DiffType, string> = {
    added: 'bg-green-100 text-green-800 border-green-200',
    removed: 'bg-red-100 text-red-800 border-red-200',
    modified: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    unchanged: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        badgeStyles[type],
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {style.label}
    </span>
  )
}

// ========================================
// Utility Functions
// ========================================

/**
 * Get the CSS class for a diff row
 */
export function getDiffRowClass(type: DiffType): string {
  return diffStyles[type].row
}

/**
 * Get the CSS class for a diff cell
 */
export function getDiffCellClass(type: DiffType): string {
  return diffStyles[type].cell
}

/**
 * Get the CSS class for diff text
 */
export function getDiffTextClass(type: DiffType): string {
  return diffStyles[type].text
}

export default DiffHighlighter
