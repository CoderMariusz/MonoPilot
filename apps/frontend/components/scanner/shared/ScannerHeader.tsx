/**
 * Scanner Header Component (Story 05.19)
 * Purpose: Header for scanner pages with back button
 * Features: 56dp height, back button, optional help
 */

'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ArrowLeft, HelpCircle } from 'lucide-react'

interface ScannerHeaderProps {
  title: string
  onBack?: () => void
  showHelp?: boolean
  onHelp?: () => void
  className?: string
}

export function ScannerHeader({
  title,
  onBack,
  showHelp = false,
  onHelp,
  className,
}: ScannerHeaderProps) {
  return (
    <header
      className={cn(
        'h-14 min-h-[56px] px-4 flex items-center justify-between',
        'bg-white border-b border-gray-200',
        'safe-area-top',
        className
      )}
    >
      {/* Left: Back button */}
      <div className="w-12">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-12 w-12 min-h-[48px] min-w-[48px]"
            aria-label="back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Center: Title */}
      <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center">{title}</h1>

      {/* Right: Help button */}
      <div className="w-12">
        {showHelp && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onHelp}
            className="h-12 w-12 min-h-[48px] min-w-[48px]"
            aria-label="help"
          >
            <HelpCircle className="h-6 w-6" />
          </Button>
        )}
      </div>
    </header>
  )
}

export default ScannerHeader
