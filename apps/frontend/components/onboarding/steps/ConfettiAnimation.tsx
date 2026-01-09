'use client'

/**
 * ConfettiAnimation Component
 * Story: 01.14 - Wizard Steps Complete
 *
 * CSS-based confetti animation for wizard completion celebration.
 * Falls from top of viewport for specified duration.
 * Performance optimized with CSS transforms.
 */

import { useEffect, useState } from 'react'

interface ConfettiAnimationProps {
  active: boolean
  duration?: number // ms, default 3000
  particleCount?: number // default 50
}

/**
 * Generate confetti particle styles
 */
function generateParticleStyle(index: number, totalParticles: number): React.CSSProperties {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
  ]

  const color = colors[index % colors.length]
  const left = Math.random() * 100
  const animationDelay = Math.random() * 2
  const animationDuration = 2 + Math.random() * 2
  const size = 8 + Math.random() * 8
  const rotation = Math.random() * 360

  return {
    position: 'absolute' as const,
    left: `${left}%`,
    top: '-20px',
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: color,
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    transform: `rotate(${rotation}deg)`,
    animation: `confetti-fall ${animationDuration}s ease-out ${animationDelay}s forwards`,
    opacity: 0,
  }
}

export function ConfettiAnimation({
  active,
  duration = 3000,
  particleCount = 50,
}: ConfettiAnimationProps) {
  const [particles, setParticles] = useState<number[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (active && mounted) {
      // Generate particle indices
      setParticles(Array.from({ length: particleCount }, (_, i) => i))

      // Clear particles after duration
      const timer = setTimeout(() => {
        setParticles([])
      }, duration + 2000) // Extra 2s for animation to complete

      return () => clearTimeout(timer)
    } else {
      setParticles([])
    }
  }, [active, mounted, duration, particleCount])

  if (!active || !mounted || particles.length === 0) {
    return null
  }

  return (
    <>
      {/* CSS keyframes */}
      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg);
          }
        }
      `}</style>

      {/* Confetti container */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden z-50"
        aria-hidden="true"
        role="presentation"
      >
        {particles.map((index) => (
          <div
            key={index}
            style={generateParticleStyle(index, particleCount)}
          />
        ))}
      </div>
    </>
  )
}
