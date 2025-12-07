/**
 * Scanner Input Component
 * Story 5.24: Barcode Scanner Integration
 * Large, touch-optimized input with auto-focus and submit on Enter
 */

'use client'

import { forwardRef, useState, useEffect, InputHTMLAttributes } from 'react'
import { Input } from '@/components/ui/input'
import { Scan, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScannerInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onSubmit'> {
  onSubmit: (value: string) => void | Promise<void>
  loading?: boolean
  icon?: 'scan' | 'search'
  variant?: 'default' | 'large'
}

export const ScannerInput = forwardRef<HTMLInputElement, ScannerInputProps>(
  (
    {
      onSubmit,
      loading = false,
      icon = 'scan',
      variant = 'large',
      className,
      placeholder = 'Scan barcode...',
      autoFocus = true,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = useState('')

    // Auto-clear after submit
    useEffect(() => {
      if (loading) {
        setValue('')
      }
    }, [loading])

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && value.trim()) {
        e.preventDefault()
        await onSubmit(value.trim())
      }
    }

    const Icon = icon === 'scan' ? Scan : Search

    return (
      <div className="relative">
        <Icon
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400',
            variant === 'large' ? 'h-6 w-6' : 'h-5 w-5'
          )}
        />
        <Input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
          autoFocus={autoFocus}
          className={cn(
            'pl-12 font-mono',
            variant === 'large' && 'h-16 text-xl',
            variant === 'default' && 'h-12 text-lg',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

ScannerInput.displayName = 'ScannerInput'
