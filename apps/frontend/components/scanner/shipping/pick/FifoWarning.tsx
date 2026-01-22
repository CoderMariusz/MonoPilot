/**
 * FIFO Warning Component (Story 07.10)
 * Amber warning banner for FIFO/FEFO violations
 */

'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FifoWarningProps {
  suggested_lp: string
  scanned_lp: string
  suggested_mfg_date: string
  scanned_mfg_date: string
  onUseSuggested: () => void
  onContinueAnyway: () => void
  className?: string
}

export function FifoWarning({
  suggested_lp,
  scanned_lp,
  suggested_mfg_date,
  scanned_mfg_date,
  onUseSuggested,
  onContinueAnyway,
  className,
}: FifoWarningProps) {
  return (
    <div
      data-testid="fifo-warning"
      className={cn(
        'p-4 rounded-lg',
        'flex flex-col gap-3',
        className
      )}
      style={{ backgroundColor: 'rgb(245, 158, 11)' }} // F59E0B amber
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-white flex-shrink-0" />
        <div>
          <span className="text-white font-bold text-lg">
            Older lot available - {suggested_lp}
          </span>
          <p className="text-white text-sm">
            Suggested: {suggested_mfg_date} | Scanned: {scanned_mfg_date}
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button
          onClick={onUseSuggested}
          className="flex-1 bg-white text-amber-700 hover:bg-gray-100 font-semibold min-h-[48px]"
          aria-label="Use Suggested LP"
        >
          Use Suggested LP
        </Button>
        <Button
          onClick={onContinueAnyway}
          variant="outline"
          className="flex-1 border-white text-white hover:bg-amber-600 font-semibold min-h-[48px]"
          aria-label="Continue Anyway"
        >
          Continue Anyway
        </Button>
      </div>
    </div>
  )
}

export default FifoWarning
