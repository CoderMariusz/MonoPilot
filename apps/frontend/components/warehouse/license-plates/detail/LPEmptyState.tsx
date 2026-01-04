/**
 * LP Empty State Component
 * Story 05.6: LP Detail Page
 *
 * Empty state message component
 */

import React from 'react'

interface LPEmptyStateProps {
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
}

export function LPEmptyState({ title, description, icon: Icon }: LPEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="mb-4 text-gray-400">
          <Icon className="h-16 w-16" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md">{description}</p>
    </div>
  )
}
