/**
 * LP Identity Card Component
 * Story 05.6: LP Detail Page
 *
 * Identity section - LP number, status, dates
 */

import React from 'react'
import { format, parseISO } from 'date-fns'
import { LPStatusBadge } from './LPStatusBadge'
import { LPFieldLabel } from './LPFieldLabel'
import type { LPStatus, QAStatus, LPSource } from '@/lib/types/license-plate'

interface LPIdentityCardProps {
  lpNumber: string
  status: LPStatus
  qaStatus: QAStatus
  source: LPSource
  createdAt: string
  updatedAt: string
}

export function LPIdentityCard({
  lpNumber,
  status,
  qaStatus,
  source,
  createdAt,
  updatedAt,
}: LPIdentityCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="identity-card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Identity</h3>

      <div className="space-y-4">
        <div>
          <div className="text-2xl font-bold text-gray-900 mb-2">{lpNumber}</div>
          <div className="flex gap-2">
            <LPStatusBadge status={status} type="lp" />
            <LPStatusBadge status={qaStatus} type="qa" />
          </div>
        </div>

        <LPFieldLabel
          label="Source"
          value={<span className="capitalize">{source}</span>}
        />

        <LPFieldLabel
          label="Created"
          value={format(parseISO(createdAt), 'MMM dd, yyyy \'at\' h:mm a')}
        />

        <LPFieldLabel
          label="Updated"
          value={format(parseISO(updatedAt), 'MMM dd, yyyy \'at\' h:mm a')}
        />
      </div>
    </div>
  )
}
