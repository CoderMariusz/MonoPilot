/**
 * LP Status Badge Component
 * Story 05.6: LP Detail Page
 *
 * Status badge with color coding and icon
 */

import React from 'react'
import { CheckCircle, Lock, Archive, Ban } from 'lucide-react'
import type { LPStatus, QAStatus } from '@/lib/types/license-plate'

interface LPStatusBadgeProps {
  status: LPStatus | QAStatus
  type?: 'lp' | 'qa'
}

export function LPStatusBadge({ status, type = 'lp' }: LPStatusBadgeProps) {
  const config = getStatusConfig(status, type)

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.background} ${config.text} ${config.border}`}
      data-testid={type === 'qa' ? 'qa-status-badge' : 'status-badge'}
    >
      {config.icon && <config.icon className="h-3.5 w-3.5" />}
      {config.label}
    </span>
  )
}

function getStatusConfig(status: LPStatus | QAStatus, type: 'lp' | 'qa') {
  if (type === 'lp') {
    const lpStatus = status as LPStatus
    switch (lpStatus) {
      case 'available':
        return {
          label: 'Available',
          background: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300',
          icon: CheckCircle,
        }
      case 'reserved':
        return {
          label: 'Reserved',
          background: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-300',
          icon: Lock,
        }
      case 'consumed':
        return {
          label: 'Consumed',
          background: 'bg-gray-100',
          text: 'text-gray-500',
          border: 'border-gray-300',
          icon: Archive,
        }
      case 'blocked':
        return {
          label: 'Blocked',
          background: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-300',
          icon: Ban,
        }
      default:
        return {
          label: status,
          background: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-300',
          icon: null,
        }
    }
  } else {
    const qaStatus = status as QAStatus
    switch (qaStatus) {
      case 'pending':
        return {
          label: 'Pending',
          background: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-300',
          icon: null,
        }
      case 'passed':
        return {
          label: 'Passed',
          background: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300',
          icon: CheckCircle,
        }
      case 'failed':
        return {
          label: 'Failed',
          background: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-300',
          icon: null,
        }
      case 'quarantine':
        return {
          label: 'Quarantine',
          background: 'bg-orange-100',
          text: 'text-orange-800',
          border: 'border-orange-300',
          icon: null,
        }
      default:
        return {
          label: status,
          background: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-300',
          icon: null,
        }
    }
  }
}
