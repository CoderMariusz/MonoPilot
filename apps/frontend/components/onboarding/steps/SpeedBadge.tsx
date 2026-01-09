'use client'

/**
 * SpeedBadge Component
 * Story: 01.14 - Wizard Steps Complete
 *
 * "Speed Setup Champion" badge for users who complete wizard in under 15 minutes.
 * Features animated glow effect and trophy icon.
 */

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Trophy, Zap } from 'lucide-react'

interface SpeedBadgeProps {
  durationSeconds: number
  threshold?: number // default 900 (15 min)
}

/**
 * Format duration for tooltip display
 */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function SpeedBadge({
  durationSeconds,
  threshold = 900,
}: SpeedBadgeProps) {
  // Only render if duration is under threshold
  if (durationSeconds >= threshold) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                       bg-gradient-to-r from-yellow-400 to-amber-500
                       text-white font-semibold shadow-lg
                       animate-pulse cursor-default
                       border-2 border-yellow-300"
            role="img"
            aria-label="Speed Setup Champion badge"
          >
            <Trophy className="h-5 w-5" />
            <span>Speed Setup Champion!</span>
            <Zap className="h-4 w-4" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            You completed setup in {formatDuration(durationSeconds)} - under 15 minutes!
          </p>
        </TooltipContent>
      </Tooltip>

      {/* Glow animation style */}
      <style jsx>{`
        @keyframes badge-glow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(251, 191, 36, 0.5),
                        0 0 20px rgba(251, 191, 36, 0.3),
                        0 0 30px rgba(251, 191, 36, 0.1);
          }
          50% {
            box-shadow: 0 0 15px rgba(251, 191, 36, 0.7),
                        0 0 30px rgba(251, 191, 36, 0.5),
                        0 0 45px rgba(251, 191, 36, 0.3);
          }
        }

        div {
          animation: badge-glow 2s ease-in-out infinite, pulse 2s ease-in-out infinite;
        }
      `}</style>
    </TooltipProvider>
  )
}
