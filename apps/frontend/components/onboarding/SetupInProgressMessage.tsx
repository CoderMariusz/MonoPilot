'use client'

import { CheckCircle2 } from 'lucide-react'
import type { OrgContext } from '@/lib/hooks/useOrgContext'

/**
 * SetupInProgressMessage Component
 * Story: 01.12 - Settings > Onboarding Wizard
 * Wireframe: SET-001
 *
 * Shows progress status card with completed setup items.
 */
interface SetupInProgressMessageProps {
  context: OrgContext | null
}

export function SetupInProgressMessage({
  context,
}: SetupInProgressMessageProps) {
  if (!context) return null

  const { organizations, user } = context
  const setupItems = [
    {
      label: 'Organization profile created',
      completed: !!organizations.id,
    },
    {
      label: `First admin user configured (${user?.email || 'you'})`,
      completed: !!user?.id,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {setupItems.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            {item.completed && (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
            )}
            <span className="text-sm text-green-900">{item.label}</span>
          </div>
        ))}
      </div>

      <p className="pt-2 text-sm font-medium text-green-900">
        Next: Set up your first warehouse and locations
      </p>
    </div>
  )
}
