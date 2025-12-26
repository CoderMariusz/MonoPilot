/**
 * Permission Legend Component
 * Story: TD-003 - Roles & Permissions Page
 *
 * Explains permission level notation
 * - CRUD notation breakdown
 * - Human-readable labels
 * - Responsive grid layout
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function PermissionLegend() {
  const permissionLevels = [
    {
      code: 'CRUD',
      label: 'Full Access',
      description: 'Create, Read, Update, Delete',
    },
    {
      code: 'CRU',
      label: 'No Delete',
      description: 'Create, Read, Update only',
    },
    {
      code: 'RU',
      label: 'Read & Update',
      description: 'View and modify existing records',
    },
    {
      code: 'R',
      label: 'Read Only',
      description: 'View only, no modifications',
    },
    {
      code: '-',
      label: 'No Access',
      description: 'Module not available',
    },
  ]

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Permission Levels</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {permissionLevels.map((level) => (
            <div key={level.code} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {level.code}
                </Badge>
                <span className="font-medium text-sm">{level.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{level.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2">Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">C</span>
              <span className="text-muted-foreground">Create</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">R</span>
              <span className="text-muted-foreground">Read (View)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">U</span>
              <span className="text-muted-foreground">Update</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">D</span>
              <span className="text-muted-foreground">Delete</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
