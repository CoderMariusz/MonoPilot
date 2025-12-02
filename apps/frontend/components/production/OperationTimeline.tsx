'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Clock, User, TrendingUp } from 'lucide-react'

interface Operation {
  id: string
  sequence: number
  operation_name: string
  status: string
  started_at: string | null
  completed_at: string | null
  expected_duration_minutes: number
  actual_duration_minutes: number | null
  actual_yield_percent: number | null
  started_by_user?: {
    first_name: string | null
    last_name: string | null
  } | null
}

interface OperationTimelineProps {
  operations: Operation[]
}

const STATUS_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  pending: { bg: 'bg-gray-200', border: 'border-gray-300', label: 'Not Started' },
  in_progress: { bg: 'bg-blue-500', border: 'border-blue-600', label: 'In Progress' },
  completed: { bg: 'bg-green-500', border: 'border-green-600', label: 'Completed' },
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '-'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function OperationTimeline({ operations }: OperationTimelineProps) {
  const [selectedOp, setSelectedOp] = useState<string | null>(null)

  if (operations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Operation Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No operations defined for this work order
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculate total expected duration for scaling
  const totalExpectedDuration = operations.reduce(
    (sum, op) => sum + (op.expected_duration_minutes || 30),
    0
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Operation Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          {Object.entries(STATUS_COLORS).map(([status, config]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${config.bg}`} />
              <span className="text-muted-foreground">{config.label}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative overflow-x-auto pb-4">
          <div className="flex gap-1 min-w-max">
            {operations.map((op) => {
              const config = STATUS_COLORS[op.status] || STATUS_COLORS.pending
              const duration = op.actual_duration_minutes || op.expected_duration_minutes || 30
              const expectedDuration = op.expected_duration_minutes || 30
              const widthPercent = Math.max(10, (duration / totalExpectedDuration) * 100)
              const operatorName = op.started_by_user
                ? `${op.started_by_user.first_name || ''} ${op.started_by_user.last_name || ''}`.trim() || 'Unknown'
                : '-'

              return (
                <Popover key={op.id} open={selectedOp === op.id} onOpenChange={(open) => setSelectedOp(open ? op.id : null)}>
                  <PopoverTrigger asChild>
                    <button
                      className={`relative h-16 rounded-lg ${config.bg} ${config.border} border-2 transition-all hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      style={{ minWidth: `${Math.max(80, widthPercent * 3)}px` }}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                        <span className={`text-xs font-medium truncate max-w-full ${op.status === 'pending' ? 'text-gray-600' : 'text-white'}`}>
                          {op.sequence}. {op.operation_name}
                        </span>
                        <span className={`text-xs ${op.status === 'pending' ? 'text-gray-500' : 'text-white/80'}`}>
                          {formatDuration(duration)}
                        </span>
                      </div>
                      {/* Progress indicator for in_progress */}
                      {op.status === 'in_progress' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-300 animate-pulse rounded-b" />
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72" align="start">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold">{op.operation_name}</h4>
                        <Badge
                          variant={op.status === 'completed' ? 'default' : 'secondary'}
                          className={
                            op.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700'
                              : op.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : ''
                          }
                        >
                          {config.label}
                        </Badge>
                      </div>

                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">Started:</span>{' '}
                            <span className="font-medium">{formatDateTime(op.started_at)}</span>
                          </div>
                        </div>
                        {op.completed_at && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-muted-foreground">Completed:</span>{' '}
                              <span className="font-medium">{formatDateTime(op.completed_at)}</span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">Duration:</span>{' '}
                            <span className="font-medium">
                              {formatDuration(op.actual_duration_minutes)} / {formatDuration(expectedDuration)} expected
                            </span>
                          </div>
                        </div>
                        {op.started_by_user && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-muted-foreground">Operator:</span>{' '}
                              <span className="font-medium">{operatorName}</span>
                            </div>
                          </div>
                        )}
                        {op.actual_yield_percent !== null && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-muted-foreground">Yield:</span>{' '}
                              <span className="font-medium">{op.actual_yield_percent.toFixed(1)}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )
            })}
          </div>
        </div>

        {/* Sequence indicator */}
        <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
          <span>Start</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Total: {formatDuration(totalExpectedDuration)}
          </span>
          <span>End</span>
        </div>
      </CardContent>
    </Card>
  )
}
