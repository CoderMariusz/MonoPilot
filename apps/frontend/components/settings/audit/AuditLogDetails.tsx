/**
 * AuditLogDetails Component
 * Story: 01.17 - Audit Trail
 *
 * Expanded panel showing before/after changes (JSON diff)
 */

'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import type { AuditLog } from '@/lib/types/audit-log'

interface AuditLogDetailsProps {
  log: AuditLog
  isExpanded: boolean
  onToggle: () => void
}

function formatJsonValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value, null, 2)
}

function DiffView({
  oldValue,
  newValue,
}: {
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
}) {
  const allKeys = new Set([
    ...(oldValue ? Object.keys(oldValue) : []),
    ...(newValue ? Object.keys(newValue) : []),
  ])

  return (
    <div className="space-y-2">
      {Array.from(allKeys).map((key) => {
        const oldVal = oldValue?.[key]
        const newVal = newValue?.[key]
        const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal)

        return (
          <div key={key} className="grid grid-cols-3 gap-4 text-sm">
            <div className="font-medium text-muted-foreground">{key}</div>
            <div
              className={`${isChanged && oldVal !== undefined ? 'bg-red-50 text-red-700 line-through' : ''} ${
                oldVal === undefined ? 'text-muted-foreground italic' : ''
              }`}
            >
              {oldVal !== undefined ? formatJsonValue(oldVal) : '(not set)'}
            </div>
            <div
              className={`${isChanged && newVal !== undefined ? 'bg-green-50 text-green-700' : ''} ${
                newVal === undefined ? 'text-muted-foreground italic' : ''
              }`}
            >
              {newVal !== undefined ? formatJsonValue(newVal) : '(not set)'}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function AuditLogDetails({ log, isExpanded, onToggle }: AuditLogDetailsProps) {
  return (
    <div data-testid={`audit-log-details-${log.id}`}>
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid={`audit-log-expand-${log.id}`}
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Hide details
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            Show details
          </>
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-xs font-medium text-muted-foreground mb-3 border-b pb-2">
            <div>Field</div>
            <div>Before</div>
            <div>After</div>
          </div>
          <DiffView oldValue={log.old_value} newValue={log.new_value} />
        </div>
      )}
    </div>
  )
}
