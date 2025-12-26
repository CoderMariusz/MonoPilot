/**
 * Permission Matrix Table Component
 * Story: TD-003 - Roles & Permissions Page
 *
 * Displays 10 roles × 12 modules permission matrix
 * - Sticky first column (role names)
 * - Responsive horizontal scroll
 * - Tooltips showing CRUD breakdown
 * - Category grouping (Core vs Premium)
 */

'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { RoleService, type Role, type Module } from '@/lib/services/role-service'
import { Check, X } from 'lucide-react'

interface PermissionMatrixTableProps {
  roles: Role[]
}

export function PermissionMatrixTable({ roles }: PermissionMatrixTableProps) {
  const modules = RoleService.getModules()

  // Group modules by category
  const coreModules = modules.filter((m) => m.category === 'Core')
  const premiumModules = modules.filter((m) => m.category === 'Premium')

  const renderPermissionCell = (role: Role, module: Module) => {
    const permissions = (role.permissions ?? {}) as Record<string, string>
    const level = permissions[module.code] ?? '-'
    const parsed = RoleService.parsePermissionLevel(level)
    const label = RoleService.getPermissionLabel(level)

    // Cell styling based on access level
    const cellClass = level === '-' ? 'text-muted-foreground' : 'text-foreground'
    const icon = level === '-' ? (
      <X className="h-4 w-4 text-muted-foreground" />
    ) : (
      <Check className="h-4 w-4 text-green-600" />
    )

    return (
      <TableCell key={module.code} className={`text-center ${cellClass}`}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center gap-1 cursor-help">
                {icon}
                <span className="text-xs font-mono">{level}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-2">
                <div className="font-semibold">{label}</div>
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    {parsed.view ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span>Read (View)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {parsed.create ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span>Create</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {parsed.update ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span>Update</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {parsed.delete ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span>Delete</span>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Sticky first column */}
              <TableHead className="sticky left-0 z-10 bg-background border-r min-w-[180px]">
                Role
              </TableHead>

              {/* Core Modules */}
              {coreModules.map((module) => (
                <TableHead key={module.code} className="text-center min-w-[100px]">
                  <div className="flex flex-col items-center gap-1">
                    <span>{module.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      Core
                    </Badge>
                  </div>
                </TableHead>
              ))}

              {/* Premium Modules */}
              {premiumModules.map((module) => (
                <TableHead key={module.code} className="text-center min-w-[100px]">
                  <div className="flex flex-col items-center gap-1">
                    <span>{module.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Premium
                    </Badge>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                {/* Sticky first column - Role name */}
                <TableCell className="sticky left-0 z-10 bg-background border-r font-medium">
                  <div className="flex flex-col gap-1">
                    <span>{role.name}</span>
                    <span className="text-xs text-muted-foreground">{role.description}</span>
                  </div>
                </TableCell>

                {/* Core modules permissions */}
                {coreModules.map((module) => renderPermissionCell(role, module))}

                {/* Premium modules permissions */}
                {premiumModules.map((module) => renderPermissionCell(role, module))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
