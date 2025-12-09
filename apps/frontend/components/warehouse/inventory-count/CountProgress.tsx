'use client'

import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, Package } from 'lucide-react'

interface CountProgressProps {
  expectedLps: number
  scannedLps: number
  foundLps: number
  missingLps: number
  extraLps: number
  status: string
}

export function CountProgress({
  expectedLps,
  scannedLps,
  foundLps,
  missingLps,
  extraLps,
  status,
}: CountProgressProps) {
  const progress = expectedLps > 0 ? Math.round((scannedLps / expectedLps) * 100) : 0

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Scan Progress</span>
              <span className="text-muted-foreground">
                {scannedLps} / {expectedLps} LPs
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{expectedLps}</div>
                <div className="text-xs text-muted-foreground">Expected</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{foundLps}</div>
                <div className="text-xs text-muted-foreground">Found</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{missingLps}</div>
                <div className="text-xs text-muted-foreground">Missing</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{extraLps}</div>
                <div className="text-xs text-muted-foreground">Extra</div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-end pt-2">
            <Badge
              variant={
                status === 'completed' || status === 'adjusted'
                  ? 'default'
                  : status === 'in_progress'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {status === 'pending' && 'Not Started'}
              {status === 'in_progress' && 'In Progress'}
              {status === 'completed' && 'Completed'}
              {status === 'adjusted' && 'Adjusted'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
