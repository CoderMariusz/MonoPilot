/**
 * Settings Module Layout
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Layout with navigation sidebar for settings module.
 */

import { SettingsNav } from '@/components/settings/SettingsNav'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full">
      <SettingsNav />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
