/**
 * RecalculateButton Component (Story 02.9)
 * Button to trigger cost recalculation with loading state
 */

'use client'

import { useState } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface RecalculateButtonProps {
  onClick: () => Promise<void>
  disabled?: boolean
}

export function RecalculateButton({ onClick, disabled = false }: RecalculateButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleClick = async () => {
    setIsLoading(true)
    try {
      await onClick()
      toast({
        title: 'Success',
        description: 'Costing updated successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to recalculate costs',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-label={isLoading ? 'Calculating costs' : 'Recalculate costs'}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Calculating...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Recalculate
        </>
      )}
    </Button>
  )
}
