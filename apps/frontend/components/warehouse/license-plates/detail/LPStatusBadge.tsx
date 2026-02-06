/**
 * LP Status Badge Component
 * Story 05.6: LP Detail Page
 * Bug Fix: Expired LPs now show "Expired" status instead of "Available"
 *
 * Status badge with color coding and icon
 */

import React from 'react'
import { CheckCircle, Lock, Archive, Ban, AlertCircle } from 'lucide-react'
import type { LPStatus, QAStatus } from '@/lib/types/license-plate'

interface LPStatusBadgeProps {
  status: LPStatus | QAStatus
  type?: 'lp' | 'qa'
  expiryDate?: string | null
}

export function LPStatusBadge({ status, type = 'lp', expiryDate }: LPStatusBadgeProps) {
  // Check if LP is expired (only for LP status, not QA status)
  let effectiveStatus = status
  
  if (type === 'lp' && expiryDate && status !== 'blocked' && status !== 'consumed') {
    const expiry = new Date(expiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
    
    if (expiry < today) {
      effectiveStatus = 'expired' as LPStatus
    }
  }

  const config = getStatusConfig(effectiveStatus, type)

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

function getStatusConfig(status: LPStatus | QAStatus | 'expired', type: 'lp' | 'qa') {
  if (type === 'lp') {
    const lpStatus = status as LPStatus | 'expired'
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
      case 'expired':
        return {
          label: 'Expired',
          background: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-300',
          icon: AlertCircle,
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
