/**
 * Large Touch Button Component (Story 05.19)
 * Purpose: Touch-friendly button with 48dp+ height
 * Features: Multiple sizes, variants, full-width option
 */

'use client'

import { cn } from '@/lib/utils'
import { Button, ButtonProps } from '@/components/ui/button'
import { forwardRef } from 'react'

type TouchButtonSize = 'default' | 'lg' | 'full'
type TouchButtonVariant = 'primary' | 'secondary' | 'destructive' | 'success'

interface LargeTouchButtonProps extends Omit<ButtonProps, 'size' | 'variant'> {
  size?: TouchButtonSize
  variant?: TouchButtonVariant
}

const sizeClasses: Record<TouchButtonSize, string> = {
  default: 'h-12 min-h-[48px] px-6',
  lg: 'h-14 min-h-[56px] px-8 text-lg',
  full: 'h-14 min-h-[56px] w-full text-lg',
}

const variantClasses: Record<TouchButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300',
  destructive: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
}

export const LargeTouchButton = forwardRef<HTMLButtonElement, LargeTouchButtonProps>(
  ({ size = 'default', variant = 'primary', className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          'font-semibold rounded-lg transition-colors',
          'active:scale-[0.98]',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </Button>
    )
  }
)

LargeTouchButton.displayName = 'LargeTouchButton'

export default LargeTouchButton
