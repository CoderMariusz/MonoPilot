/**
 * VersionBadge Component (Story 02.2)
 * Displays product version number in "v{N}" format
 *
 * Features:
 * - Size variants: sm, md, lg
 * - Accessible with ARIA label
 * - Uses ShadCN Badge component
 */

import { cn } from '@/lib/utils'

interface VersionBadgeProps {
  version: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
}

export function VersionBadge({ version, size = 'md', className }: VersionBadgeProps) {
  // Don't render negative versions (validation)
  if (version < 0) {
    return null
  }

  const versionText = `v${version}`

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 font-semibold transition-colors',
        'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        sizeClasses[size],
        className
      )}
      aria-label={`Version ${version}`}
      data-testid="version-badge"
    >
      {versionText}
    </span>
  )
}
