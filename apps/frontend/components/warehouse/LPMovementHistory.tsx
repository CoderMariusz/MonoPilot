/**
 * LP Movement History - Story 5.15
 * Display movement history for a license plate
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import {
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  PackagePlus,
  Package,
  PackageMinus,
  GitBranch,
  Undo2,
  Settings,
  MoveRight,
} from 'lucide-react'

interface LPMovementHistoryProps {
  lpId: string
}

interface Movement {
  id: string
  movement_type: string
  qty_change: number
  qty_before: number
  qty_after: number
  from_location?: {
    code: string
    name: string
  }
  to_location?: {
    code: string
    name: string
  }
  notes?: string
  created_at: string
  created_by?: {
    email: string
  }
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  creation: 'Created',
  receipt: 'Received',
  consumption: 'Consumed',
  reversal: 'Consumption Reversed',
  adjustment: 'Adjusted',
  transfer: 'Transferred',
  split: 'Split',
  merge: 'Merged',
  partial_move: 'Partial Move',
  full_move: 'Moved',
}

const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  creation: 'bg-blue-100 text-blue-800 border-blue-200',
  receipt: 'bg-green-100 text-green-800 border-green-200',
  consumption: 'bg-red-100 text-red-800 border-red-200',
  reversal: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  adjustment: 'bg-purple-100 text-purple-800 border-purple-200',
  transfer: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  split: 'bg-orange-100 text-orange-800 border-orange-200',
  merge: 'bg-pink-100 text-pink-800 border-pink-200',
  partial_move: 'bg-teal-100 text-teal-800 border-teal-200',
  full_move: 'bg-cyan-100 text-cyan-800 border-cyan-200',
}

const MOVEMENT_TYPE_ICONS: Record<string, any> = {
  creation: PackagePlus,
  receipt: Package,
  consumption: PackageMinus,
  reversal: Undo2,
  adjustment: Settings,
  transfer: MoveRight,
  split: GitBranch,
  merge: GitBranch,
  partial_move: MoveRight,
  full_move: MoveRight,
}

export function LPMovementHistory({ lpId }: LPMovementHistoryProps) {
  const { toast } = useToast()

  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchMovements()
  }, [lpId, page])

  const fetchMovements = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/warehouse/license-plates/${lpId}/movements?page=${page}&limit=${pageSize}`
      )

      if (!response.ok) throw new Error('Failed to fetch movements')

      const data = await response.json()
      setMovements(data.movements || [])
      setTotalPages(Math.ceil((data.total || 0) / pageSize))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load movement history',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getMovementIcon = (type: string) => {
    const Icon = MOVEMENT_TYPE_ICONS[type] || Package
    return <Icon className="h-4 w-4" />
  }

  const getMovementColor = (type: string) => {
    return MOVEMENT_TYPE_COLORS[type] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const formatQtyChange = (change: number) => {
    if (change > 0) return `+${change}`
    return change.toString()
  }

  if (loading && movements.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6 text-muted-foreground">
          Loading movement history...
        </CardContent>
      </Card>
    )
  }

  if (movements.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6 text-muted-foreground">
          No movement history available
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Movement History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Movements List */}
        <div className="space-y-3">
          {movements.map((movement, index) => (
            <div
              key={movement.id}
              className={`border rounded-lg p-3 space-y-2 ${
                index === 0 ? 'border-primary bg-primary/5' : ''
              }`}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Badge
                    variant="outline"
                    className={`${getMovementColor(movement.movement_type)} flex items-center gap-1`}
                  >
                    {getMovementIcon(movement.movement_type)}
                    {MOVEMENT_TYPE_LABELS[movement.movement_type] || movement.movement_type}
                  </Badge>
                  {index === 0 && (
                    <Badge variant="outline" className="text-xs">
                      Latest
                    </Badge>
                  )}
                </div>

                <div className="text-right text-xs text-muted-foreground">
                  <div>{format(new Date(movement.created_at), 'MMM d, yyyy')}</div>
                  <div>{format(new Date(movement.created_at), 'HH:mm:ss')}</div>
                </div>
              </div>

              {/* Quantity Change */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Before:</span>
                  <span className="font-medium">{movement.qty_before}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Change:</span>
                  <span
                    className={`font-medium ${
                      movement.qty_change > 0
                        ? 'text-green-600'
                        : movement.qty_change < 0
                        ? 'text-red-600'
                        : ''
                    }`}
                  >
                    {formatQtyChange(movement.qty_change)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">After:</span>
                  <span className="font-medium">{movement.qty_after}</span>
                </div>
              </div>

              {/* Location Info */}
              {(movement.from_location || movement.to_location) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {movement.from_location && (
                    <div>
                      From: <span className="font-medium">{movement.from_location.code}</span>
                    </div>
                  )}
                  {movement.from_location && movement.to_location && (
                    <span>→</span>
                  )}
                  {movement.to_location && (
                    <div>
                      To: <span className="font-medium">{movement.to_location.code}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {movement.notes && (
                <div className="text-xs text-muted-foreground bg-muted rounded-md px-2 py-1">
                  <span className="font-medium">Notes:</span> {movement.notes}
                </div>
              )}

              {/* User */}
              {movement.created_by && (
                <div className="text-xs text-muted-foreground">
                  By: {movement.created_by.email}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
