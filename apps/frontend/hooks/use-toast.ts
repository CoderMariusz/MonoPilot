/**
 * Toast Hook (Story 01.15)
 *
 * Simple toast notification hook with Context Provider
 * Provides a minimal implementation for toast notifications
 */

'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  action?: ReactNode
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (props: Omit<Toast, 'id'>) => { id: string }
  dismiss: (toastId: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
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

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  
  return context
}
