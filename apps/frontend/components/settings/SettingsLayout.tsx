/**
 * SettingsLayout Component
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Settings shell layout component with consistent styling.
 *
 * Provides page header with title and description.
 */

interface SettingsLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

/**
 * Layout wrapper for settings pages
 *
 * @example
 * ```typescript
 * <SettingsLayout
 *   title="Organization"
 *   description="Manage your organization settings"
 * >
 *   <OrganizationForm />
 * </SettingsLayout>
 * ```
 */
export function SettingsLayout({
  children,
  title,
  description,
}: SettingsLayoutProps) {
  return (
    <div className="flex flex-col space-y-6 p-6">
      {title && (
        <>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground max-w-prose">
                {description}
              </p>
            )}
          </div>
          <div className="border-b mb-4" />
        </>
      )}
      <div>{children}</div>
    </div>
  )
}
