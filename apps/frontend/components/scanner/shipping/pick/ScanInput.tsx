/**
 * Scan Input Component (Story 07.10)
 * Barcode scan input field with auto-focus
 */

'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ScanInputProps {
  onScan: (barcode: string) => void
  placeholder?: string
  autoFocus?: boolean
  disabled?: boolean
  className?: string
}

const DEBOUNCE_MS = 2000

export function ScanInput({
  onScan,
  placeholder = 'Scan LP Barcode',
  autoFocus = true,
  disabled = false,
  className,
}: ScanInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const lastScanRef = useRef<{ barcode: string; timestamp: number } | null>(null)

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus()
    }
  }, [autoFocus, disabled])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const barcode = value.trim()

        if (!barcode) return

        // Check for duplicate scan within debounce window
        const now = Date.now()
        if (
          lastScanRef.current &&
          lastScanRef.current.barcode === barcode &&
          now - lastScanRef.current.timestamp < DEBOUNCE_MS
        ) {
          // Ignore duplicate scan
          return
        }

        lastScanRef.current = { barcode, timestamp: now }
        onScan(barcode)
        setValue('')

        // Maintain focus
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }
    },
    [value, onScan]
  )

  return (
    <input
      ref={inputRef}
      type="text"
      role="textbox"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      className={cn(
        'w-full h-14 min-h-[56px] px-4 text-lg',
        'border-2 border-gray-300 rounded-lg',
        'focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none',
        'placeholder:text-gray-400',
        disabled && 'bg-gray-100 cursor-not-allowed opacity-50',
        className
      )}
      aria-label={placeholder}
    />
  )
}

export default ScanInput
