/**
 * Toast Hook (Story 01.15)
 *
 * Simple toast notification hook
 * Provides a minimal implementation for toast notifications
 */

'use client'

import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  action?: ReactNode
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(
    ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(7)
      const newToast: Toast = { id, title, description, variant }

      setToasts((prev) => [...prev, newToast])

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)

      return { id }
    },
    []
  )

  const dismiss = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId))
  }, [])

  return {
    toast,
    dismiss,
    toasts,
  }
}
