/**
 * Print Label Button Component (Story 05.14)
 * Purpose: Button that opens print label modal
 *
 * AC Coverage:
 * - AC-5: Print button on LP detail page
 */

'use client'

import { useState } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PrintLabelModal } from './PrintLabelModal'

interface PrintLabelButtonProps {
  lpId: string
  lpNumber: string
  variant?: 'default' | 'icon'
  disabled?: boolean
  onPrintComplete?: () => void
  defaultCopies?: number
  printerConfigured?: boolean
  className?: string
}

export function PrintLabelButton({
  lpId,
  lpNumber,
  variant = 'default',
  disabled = false,
  onPrintComplete,
  defaultCopies = 1,
  printerConfigured = false,
  className,
}: PrintLabelButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handlePrintComplete = () => {
    onPrintComplete?.()
    // Optionally close modal after successful print
    // setIsModalOpen(false)
  }

  return (
    <>
      {variant === 'icon' ? (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsModalOpen(true)}
          disabled={disabled}
          className={className}
          aria-label="Print Label"
        >
          <Printer className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          disabled={disabled}
          className={className}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Label
        </Button>
      )}

      <PrintLabelModal
        lpId={lpId}
        lpNumber={lpNumber}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPrintComplete={handlePrintComplete}
        defaultCopies={defaultCopies}
        printerConfigured={printerConfigured}
      />
    </>
  )
}
