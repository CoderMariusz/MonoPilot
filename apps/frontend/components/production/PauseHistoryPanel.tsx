'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, PauseCircle, PlayCircle } from 'lucide-react'

interface PauseHistoryItem {
  id: string
  pause_reason: string | null
  notes: string | null
  paused_at: string
  resumed_at: string | null
  duration_minutes: number | null
}

interface PauseHistoryPanelProps {
  woId: string
  className?: string
}

/**
 * Format duration in minutes to human-readable string
 */
function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === 0) return '-'

  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}

/**
 * Format timestamp to localized date/time
 */
function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return '-'

  const date = new Date(timestamp)
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PauseHistoryPanel({ woId, className }: PauseHistoryPanelProps) {
  const [history, setHistory] = useState<PauseHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [byReason, setByReason] = useState<{ reason: string; minutes: number }[]>([])

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/production/work-orders/${woId}/pause-history`)
        if (response.ok) {
          const { data, summary } = await response.json()
          setHistory(data || [])
          setTotalMinutes(summary?.total_minutes || 0)
          setByReason(summary?.by_reason || [])
        }
      } catch (error) {
        console.error('Failed to fetch pause history:', error)
      } finally {
        setLoading(false)
      }
    }

    if (woId) {
      fetchHistory()
    }
  }, [woId])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pause History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pause History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No pause events recorded</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Pause History
        </CardTitle>
        <CardDescription>Downtime tracking for this work order</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Downtime Summary */}
        {totalMinutes > 0 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-800">Total Downtime</span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {formatDuration(totalMinutes)}
              </Badge>
            </div>
            {byReason.length > 0 && (
              <div className="mt-2 space-y-1">
                {byReason.map((item) => (
                  <div key={item.reason} className="flex items-center justify-between text-xs">
                    <span className="text-orange-700">{item.reason}</span>
                    <span className="text-orange-600">{formatDuration(item.minutes)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pause History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Reason</th>
                <th className="text-left py-2 font-medium">Paused At</th>
                <th className="text-left py-2 font-medium">Duration</th>
                <th className="text-left py-2 font-medium">Resumed At</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">
                    <div className="flex items-center gap-1">
                      {item.resumed_at ? (
                        <PlayCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <PauseCircle className="w-3 h-3 text-orange-500" />
                      )}
                      <span>{item.pause_reason || 'Unspecified'}</span>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[150px]">
                        {item.notes}
                      </p>
                    )}
                  </td>
                  <td className="py-2 text-gray-600">{formatTimestamp(item.paused_at)}</td>
                  <td className="py-2">
                    <Badge
                      variant="outline"
                      className={item.resumed_at ? '' : 'bg-orange-50 border-orange-200'}
                    >
                      {item.resumed_at ? formatDuration(item.duration_minutes) : 'Ongoing'}
                    </Badge>
                  </td>
                  <td className="py-2 text-gray-600">
                    {item.resumed_at ? formatTimestamp(item.resumed_at) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
