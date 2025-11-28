/**
 * useResponsiveView Hook
 * Story 3.29: Mobile Responsive Design
 *
 * Detects screen size and returns responsive breakpoint info
 * Breakpoints follow Tailwind CSS defaults:
 * - sm: 640px (mobile)
 * - md: 768px (tablet)
 * - lg: 1024px (desktop)
 * - xl: 1280px (large desktop)
 */

'use client'

import { useState, useEffect } from 'react'

interface ResponsiveViewState {
  isMobile: boolean      // < 768px
  isTablet: boolean      // >= 768px && < 1024px
  isDesktop: boolean     // >= 1024px
  screenWidth: number
  breakpoint: 'sm' | 'md' | 'lg' | 'xl'
}

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
}

export function useResponsiveView(): ResponsiveViewState {
  const [state, setState] = useState<ResponsiveViewState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    breakpoint: 'lg',
  })

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth

      let breakpoint: 'sm' | 'md' | 'lg' | 'xl' = 'sm'
      if (width >= BREAKPOINTS.xl) {
        breakpoint = 'xl'
      } else if (width >= BREAKPOINTS.lg) {
        breakpoint = 'lg'
      } else if (width >= BREAKPOINTS.md) {
        breakpoint = 'md'
      }

      setState({
        isMobile: width < BREAKPOINTS.md,
        isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isDesktop: width >= BREAKPOINTS.lg,
        screenWidth: width,
        breakpoint,
      })
    }

    // Initial check
    handleResize()

    // Listen for resize
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return state
}

/**
 * Helper hook for conditional rendering based on screen size
 */
export function useIsMobile(): boolean {
  const { isMobile } = useResponsiveView()
  return isMobile
}

export function useIsDesktop(): boolean {
  const { isDesktop } = useResponsiveView()
  return isDesktop
}
