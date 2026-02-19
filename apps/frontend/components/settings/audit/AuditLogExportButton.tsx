/**
 * AuditLogExportButton Component
 * Story: 01.17 - Audit Trail
 *
 * "Export CSV" button with progress, warning for >10k
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Download, AlertTriangle, Loader2 } from 'lucide-react'
import type { AuditLogFilters } from '@/lib/types/audit-log'
import { useAuditLogsCount } from '@/lib/hooks/use-audit-logs'

interface AuditLogExportButtonProps {
  filters: AuditLogFilters
}

const WARNING_THRESHOLD = 10000

export function AuditLogExportButton({ filters }: AuditLogExportButtonProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const { count, isLoading: isCountLoading } = useAuditLogsCount(filters)

  const handleExport = async () => {
    setIsExporting(true)
    setProgress(0)

    try {
      // Build query string with filters
      const queryParams = new URLSearchParams()
      if (filters.search) queryParams.append('search', filters.search)
      if (filters.user_id?.length) queryParams.append('user_id', filters.user_id.join(','))
      if (filters.action?.length) queryParams.append('action', filters.action.join(','))
      if (filters.entity_type?.length) queryParams.append('entity_type', filters.entity_type.join(','))
      if (filters.date_from) queryParams.append('date_from', filters.date_from)
      if (filters.date_to) queryParams.append('date_to', filters.date_to)

      // Simulate progress for large exports
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev
          return prev + Math.random() * 15
        })
      }, 500)

      const response = await fetch(`/api/settings/audit-logs/export?${queryParams.toString()}`)

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      setProgress(100)

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setTimeout(() => {
        setShowDialog(false)
        setIsExporting(false)
        setProgress(0)
      }, 500)
    } catch (error) {
      setIsExporting(false)
      setProgress(0)
      // Error handling - could add toast here
      console.error('Export failed:', error)
    }
  }

  const showWarning = count > WARNING_THRESHOLD

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowDialog(true)}
        data-testid="audit-export-button"
      >
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Audit Logs</DialogTitle>
            <DialogDescription>
              Download audit logs as a CSV file.
            </DialogDescription>
          </DialogHeader>

          {isCountLoading ? (
            <div className="py-4 text-center text-muted-foreground">
              Checking record count...
            </div>
          ) : (
            <div className="py-4 space-y-4">
              {showWarning && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 text-yellow-800 rounded-md">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Large Export Warning</p>
                    <p className="text-sm">
                      This export contains {count.toLocaleString()} records. Large exports may take
                      several minutes to complete.
                    </p>
                  </div>
                </div>
              )}

              {!showWarning && (
                <p className="text-sm text-muted-foreground">
                  This export will include {count.toLocaleString()} records.
                </p>
              )}

              {isExporting && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">
                    Exporting... {Math.round(progress)}%
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || isCountLoading || count === 0}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
