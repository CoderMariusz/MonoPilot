/**
 * Role Export Actions Component
 * Story: TD-003 - Roles & Permissions Page
 *
 * Export/Print buttons for permission matrix
 * - CSV export with filename timestamp
 * - Print functionality using browser print
 */

'use client'

import { Button } from '@/components/ui/button'
import { Download, Printer } from 'lucide-react'
import { RoleService, type Role } from '@/lib/services/role-service'
import { useToast } from '@/hooks/use-toast'

interface RoleExportActionsProps {
  roles: Role[]
}

export function RoleExportActions({ roles }: RoleExportActionsProps) {
  const { toast } = useToast()

  const handleExportCSV = () => {
    try {
      const csv = RoleService.generatePermissionCSV(roles)

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `roles-permissions-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Export successful',
        description: 'Permission matrix has been exported to CSV',
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export CSV',
        variant: 'destructive',
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={handleExportCSV}>
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>
    </div>
  )
}
