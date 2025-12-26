/**
 * Session Badge Component
 * Story: 01.15 - Session & Password Management
 *
 * Displays a badge indicating device type and session status
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Laptop, Smartphone, Tablet, Monitor } from 'lucide-react'

interface SessionBadgeProps {
  deviceType: string | null
  isCurrent?: boolean
}

export function SessionBadge({ deviceType, isCurrent }: SessionBadgeProps) {
  const getDeviceIcon = () => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-3 w-3 mr-1" aria-hidden="true" />
      case 'tablet':
        return <Tablet className="h-3 w-3 mr-1" aria-hidden="true" />
      case 'desktop':
        return <Laptop className="h-3 w-3 mr-1" aria-hidden="true" />
      default:
        return <Monitor className="h-3 w-3 mr-1" aria-hidden="true" />
    }
  }

  const getDeviceLabel = () => {
    if (!deviceType) return 'Unknown'
    return deviceType.charAt(0).toUpperCase() + deviceType.slice(1).toLowerCase()
  }

  if (isCurrent) {
    return (
      <Badge
        variant="default"
        className="bg-green-100 text-green-800 hover:bg-green-100"
        aria-label="Current session"
      >
        {getDeviceIcon()}
        Current Session
      </Badge>
    )
  }

  return (
    <Badge
      variant="secondary"
      aria-label={`Device type: ${getDeviceLabel()}`}
    >
      {getDeviceIcon()}
      {getDeviceLabel()}
    </Badge>
  )
}
