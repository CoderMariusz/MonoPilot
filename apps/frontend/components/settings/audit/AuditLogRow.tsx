/**
 * AuditLogRow Component
 * Story: 01.17 - Audit Trail
 *
 * Expandable row with action icon, user, entity, timestamp
 */

'use client'

import { useState } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { AuditLogActionBadge } from './AuditLogActionBadge'
import { AuditLogDetails } from './AuditLogDetails'
import type { AuditLog } from '@/lib/types/audit-log'
import { format } from 'date-fns'
import {
  Plus,
  Pencil,
  Trash2,
  LogIn,
} from 'lucide-react'

interface AuditLogRowProps {
  log: AuditLog
}

const ACTION_ICONS = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  LOGIN: LogIn,
}

function getUserDisplayName(user?: AuditLog['user']): string {
  if (!user) return 'Unknown User'
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim()
  }
  return user.email
}

function formatEntityType(entityType: string): string {
  return entityType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

export function AuditLogRow({ log }: AuditLogRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const ActionIcon = ACTION_ICONS[log.action]

  return (
    <>
      <TableRow
        data-testid={`audit-log-row-${log.id}`}
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell>
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-md ${
                log.action === 'CREATE'
                  ? 'bg-green-100 text-green-700'
                  : log.action === 'UPDATE'
                  ? 'bg-blue-100 text-blue-700'
                  : log.action === 'DELETE'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <ActionIcon className="h-4 w-4" />
            </div>
            <AuditLogActionBadge action={log.action} />
          </div>
        </TableCell>
        <TableCell>
          <div className="font-medium">{getUserDisplayName(log.user)}</div>
          {log.user?.email && (
            <div className="text-sm text-muted-foreground">{log.user.email}</div>
          )}
        </TableCell>
        <TableCell>
          <div className="font-medium">{formatEntityType(log.entity_type)}</div>
          <div className="text-sm text-muted-foreground font-mono">
            {log.entity_id.slice(0, 8)}...
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            {format(new Date(log.created_at), 'MMM d, yyyy')}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(log.created_at), 'h:mm a')}
          </div>
        </TableCell>
        <TableCell>
          <AuditLogDetails
            log={log}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
          />
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={5} className="p-0">
            <div className="p-4 bg-muted/30">
              <AuditLogDetails
                log={log}
                isExpanded={true}
                onToggle={() => setIsExpanded(false)}
              />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
