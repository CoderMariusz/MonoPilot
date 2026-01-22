/**
 * Auto-Refresh Hook
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Hook for auto-refresh functionality
 */

import { useState, useEffect, useCallback } from 'react'

export interface UseAutoRefreshOptions {
  intervalSeconds?: number
  enabled?: boolean
  onRefresh: () => void
}

export function useAutoRefresh({
  intervalSeconds = 30,
  enabled: initialEnabled = true,
  onRefresh,
}: UseAutoRefreshOptions) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled)
  const [nextRefreshIn, setNextRefreshIn] = useState(intervalSeconds)

  useEffect(() => {
    if (!isEnabled) {
      setNextRefreshIn(0)
      return
    }

    setNextRefreshIn(intervalSeconds)

    const countdownInterval = setInterval(() => {
      setNextRefreshIn((prev) => {
        if (prev <= 1) {
          onRefresh()
          return intervalSeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [isEnabled, intervalSeconds, onRefresh])

  const toggle = useCallback((newValue?: boolean) => {
    setIsEnabled((prev) => (newValue !== undefined ? newValue : !prev))
  }, [])

  const refetch = useCallback(() => {
    onRefresh()
    setNextRefreshIn(intervalSeconds)
  }, [onRefresh, intervalSeconds])

  return {
    isEnabled,
    toggle,
    nextRefreshIn,
    refetch,
  }
}
