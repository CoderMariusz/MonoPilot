/**
 * LP Field Label Component
 * Story 05.6: LP Detail Page
 *
 * Consistent field label/value display component
 */

import React from 'react'

interface LPFieldLabelProps {
  label: string
  value: string | React.ReactNode
  emptyText?: string
}

export function LPFieldLabel({ label, value, emptyText = '-' }: LPFieldLabelProps) {
  const isEmpty = !value || (typeof value === 'string' && value.trim() === '')

  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">
        {isEmpty ? <span className="text-gray-400">{emptyText}</span> : value}
      </dd>
    </div>
  )
}
