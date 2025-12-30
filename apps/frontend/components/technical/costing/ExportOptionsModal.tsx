'use client'

/**
 * ExportOptionsModal Component (Story 02.15)
 * Modal for configuring export options (simplified - CSV only for now)
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, FileText } from 'lucide-react'

export interface ExportOptionsModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Handler to close the modal */
  onClose: () => void
  /** Product ID for filename */
  productId: string
  /** Date range for export */
  dateRange: { from: Date | null; to: Date | null }
  /** Handler for export action */
  onExport?: (options: ExportConfig) => void
}

export interface ExportConfig {
  format: 'csv'
  dataInclusions: {
    historyTable: boolean
    componentBreakdown: boolean
    costDrivers: boolean
    varianceAnalysis: boolean
  }
  delimiter: ',' | ';' | '\t'
  encoding: 'utf-8' | 'ascii'
  filename: string
}

export function ExportOptionsModal({
  open,
  onClose,
  productId,
  dateRange,
  onExport,
}: ExportOptionsModalProps) {
  const defaultFilename = `cost-history-${productId}-${new Date().toISOString().split('T')[0]}.csv`

  const [config, setConfig] = useState<ExportConfig>({
    format: 'csv',
    dataInclusions: {
      historyTable: true,
      componentBreakdown: true,
      costDrivers: true,
      varianceAnalysis: true,
    },
    delimiter: ',',
    encoding: 'utf-8',
    filename: defaultFilename,
  })

  const handleInclusionChange = (
    key: keyof ExportConfig['dataInclusions'],
    checked: boolean
  ) => {
    setConfig((prev) => ({
      ...prev,
      dataInclusions: {
        ...prev.dataInclusions,
        [key]: checked,
      },
    }))
  }

  const handleExport = () => {
    onExport?.(config)
    onClose()
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Cost History
          </DialogTitle>
          <DialogDescription>
            Configure export options and download your cost history data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Data inclusions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Data to Include</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-history"
                  checked={config.dataInclusions.historyTable}
                  onCheckedChange={(checked) =>
                    handleInclusionChange('historyTable', checked === true)
                  }
                />
                <Label htmlFor="include-history" className="text-sm cursor-pointer">
                  Cost History Table (all records in date range)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-breakdown"
                  checked={config.dataInclusions.componentBreakdown}
                  onCheckedChange={(checked) =>
                    handleInclusionChange('componentBreakdown', checked === true)
                  }
                />
                <Label htmlFor="include-breakdown" className="text-sm cursor-pointer">
                  Cost Component Breakdown
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-drivers"
                  checked={config.dataInclusions.costDrivers}
                  onCheckedChange={(checked) =>
                    handleInclusionChange('costDrivers', checked === true)
                  }
                />
                <Label htmlFor="include-drivers" className="text-sm cursor-pointer">
                  Top Cost Drivers (material breakdown)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-variance"
                  checked={config.dataInclusions.varianceAnalysis}
                  onCheckedChange={(checked) =>
                    handleInclusionChange('varianceAnalysis', checked === true)
                  }
                />
                <Label htmlFor="include-variance" className="text-sm cursor-pointer">
                  Variance Analysis (if available)
                </Label>
              </div>
            </div>
          </div>

          {/* Date range display */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
              From: {formatDate(dateRange.from)} &mdash; To: {formatDate(dateRange.to)}
            </div>
          </div>

          {/* CSV Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delimiter">Delimiter</Label>
              <Select
                value={config.delimiter}
                onValueChange={(value) =>
                  setConfig((prev) => ({
                    ...prev,
                    delimiter: value as ExportConfig['delimiter'],
                  }))
                }
              >
                <SelectTrigger id="delimiter">
                  <SelectValue placeholder="Comma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Comma (,)</SelectItem>
                  <SelectItem value=";">Semicolon (;)</SelectItem>
                  <SelectItem value="\t">Tab</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="encoding">Encoding</Label>
              <Select
                value={config.encoding}
                onValueChange={(value) =>
                  setConfig((prev) => ({
                    ...prev,
                    encoding: value as ExportConfig['encoding'],
                  }))
                }
              >
                <SelectTrigger id="encoding">
                  <SelectValue placeholder="UTF-8" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utf-8">UTF-8</SelectItem>
                  <SelectItem value="ascii">ASCII</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={config.filename}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, filename: e.target.value }))
              }
              placeholder="cost-history.csv"
            />
          </div>

          {/* Estimated size */}
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Estimated file size: ~12 KB
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Download Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
