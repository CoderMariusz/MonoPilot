'use client'

/**
 * OperationLogTable Component
 * Story: 04.3 - Operation Start/Complete
 *
 * Audit trail table showing all status changes for an operation.
 * Includes loading, empty, and success states.
 */

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { History, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface OperationLog {
  id: string
  event_type: 'started' | 'completed' | 'skipped' | 'reset'
  old_status: string | null
  new_status: string
  changed_by_user: {
    first_name: string | null
    last_name: string | null
  } | null
  metadata: {
    yield_percent?: number
    duration_minutes?: number
    notes?: string
  }
  created_at: string
}

export interface OperationLogTableProps {
  /** Array of log entries */
  logs: OperationLog[]
  /** Loading state */
  isLoading?: boolean
}

const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  started: { label: 'Started', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  skipped: { label: 'Skipped', color: 'bg-orange-100 text-orange-800' },
  reset: { label: 'Reset', color: 'bg-gray-100 text-gray-800' },
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getUserName(user: OperationLog['changed_by_user']): string {
  if (!user) return 'Unknown'
  const first = user.first_name || ''
  const last = user.last_name || ''
  if (first && last) return `${first} ${last.charAt(0)}.`
  return first || last || 'Unknown'
}

function getDetails(log: OperationLog): string {
  const details: string[] = []

  if (log.metadata?.yield_percent !== undefined) {
    details.push(`${log.metadata.yield_percent}% yield`)
  }
  if (log.metadata?.duration_minutes !== undefined) {
    details.push(`${log.metadata.duration_minutes}m`)
  }

  return details.length > 0 ? details.join(', ') : '-'
}

/**
 * Loading skeleton for the table
 */
function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5" />
          Operation Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Empty state when no logs exist
 */
function EmptyState() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5" />
          Operation Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No activity recorded</p>
          <p className="text-xs text-muted-foreground mt-1">
            Operation logs will appear here when status changes occur.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Mobile card view for a single log entry
 */
function MobileLogCard({ log }: { log: OperationLog }) {
  const eventConfig = EVENT_TYPE_CONFIG[log.event_type] || EVENT_TYPE_CONFIG.reset

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <Badge className={cn('text-xs', eventConfig.color)}>
          {eventConfig.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatDate(log.created_at)} {formatTime(log.created_at)}
        </span>
      </div>
      <div className="text-sm">
        <span className="text-muted-foreground">
          {log.old_status || 'N/A'}
        </span>
        <span className="mx-2">-&gt;</span>
        <span className="font-medium">{log.new_status}</span>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>By: {getUserName(log.changed_by_user)}</span>
        <span>{getDetails(log)}</span>
      </div>
    </div>
  )
}

export function OperationLogTable({ logs, isLoading = false }: OperationLogTableProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (logs.length === 0) {
    return <EmptyState />
  }

  // Mobile view: Card stack
  if (isMobile) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Operation Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs.map((log) => (
            <MobileLogCard key={log.id} log={log} />
          ))}
        </CardContent>
      </Card>
    )
  }

  // Desktop view: Table
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5" />
          Operation Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table aria-label="Operation status change history">
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Event</TableHead>
              <TableHead className="w-40">Status Change</TableHead>
              <TableHead className="w-28">By</TableHead>
              <TableHead className="w-32">Details</TableHead>
              <TableHead className="w-24 text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const eventConfig =
                EVENT_TYPE_CONFIG[log.event_type] || EVENT_TYPE_CONFIG.reset

              return (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge className={cn('text-xs', eventConfig.color)}>
                      {eventConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="text-muted-foreground">
                      {log.old_status || 'N/A'}
                    </span>
                    <span className="mx-2">-&gt;</span>
                    <span className="font-medium">{log.new_status}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {getUserName(log.changed_by_user)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getDetails(log)}
                  </TableCell>
                  <TableCell className="text-sm text-right text-muted-foreground">
                    {formatTime(log.created_at)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default OperationLogTable
