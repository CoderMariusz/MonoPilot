/**
 * PrintSettingsPanel Component (Story 07.13)
 * Purpose: Printer selection and print settings configuration
 *
 * Features:
 * - Printer dropdown with available printers
 * - Format selection (4x6 / 4x8)
 * - Output format (ZPL / PDF)
 * - Copies input with +/- buttons
 * - Print Now / Cancel buttons
 *
 * AC Coverage:
 * - AC: Printer selection dropdown
 * - AC: Label format selector
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Printer, Plus, Minus, Settings } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export interface PrintSettings {
  printer: string
  format: '4x6' | '4x8'
  output: 'zpl' | 'pdf'
  copies: number
}

export interface PrintSettingsPanelProps {
  /** Available printers list */
  printers?: string[]
  /** Selected printer */
  selectedPrinter?: string
  /** Default format */
  defaultFormat?: '4x6' | '4x8'
  /** Default output */
  defaultOutput?: 'zpl' | 'pdf'
  /** Default copies */
  defaultCopies?: number
  /** Print callback with settings */
  onPrint: (settings: PrintSettings) => void
  /** Cancel callback */
  onCancel: () => void
  /** Loading state */
  loading?: boolean
  /** Additional className */
  className?: string
}

// =============================================================================
// Component
// =============================================================================

export function PrintSettingsPanel({
  printers = [],
  selectedPrinter,
  defaultFormat = '4x6',
  defaultOutput = 'zpl',
  defaultCopies = 1,
  onPrint,
  onCancel,
  loading = false,
  className,
}: PrintSettingsPanelProps) {
  const [printer, setPrinter] = useState(selectedPrinter || printers[0] || '')
  const [format, setFormat] = useState<'4x6' | '4x8'>(defaultFormat)
  const [output, setOutput] = useState<'zpl' | 'pdf'>(defaultOutput)
  const [copies, setCopies] = useState(defaultCopies)

  // Handle copies change
  const incrementCopies = () => setCopies((prev) => Math.min(prev + 1, 99))
  const decrementCopies = () => setCopies((prev) => Math.max(prev - 1, 1))

  // Handle print
  const handlePrint = () => {
    onPrint({
      printer,
      format,
      output,
      copies,
    })
  }

  return (
    <div className={cn('space-y-6 p-4 border rounded-lg bg-white', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Printer className="h-5 w-5" />
        <h3 className="font-semibold">Print Settings</h3>
      </div>

      {/* Printer Selection */}
      <div className="space-y-2">
        <Label htmlFor="printer-select">Printer</Label>
        <select
          id="printer-select"
          aria-label="Printer"
          value={printer}
          onChange={(e) => setPrinter(e.target.value)}
          className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">Select printer...</option>
          {printers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <a
          href="/settings/printers"
          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
        >
          <Settings className="h-3 w-3" />
          Printer Setup
        </a>
      </div>

      {/* Format Selection */}
      <div className="space-y-2">
        <Label>Label Format</Label>
        <RadioGroup
          value={format}
          onValueChange={(val) => setFormat(val as '4x6' | '4x8')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="4x6" id="format-4x6" aria-label="4x6 inch" />
            <Label htmlFor="format-4x6" className="font-normal cursor-pointer">
              4x6"
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="4x8" id="format-4x8" aria-label="4x8 inch" />
            <Label htmlFor="format-4x8" className="font-normal cursor-pointer">
              4x8"
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Output Format */}
      <div className="space-y-2">
        <Label>Output Format</Label>
        <RadioGroup
          value={output}
          onValueChange={(val) => setOutput(val as 'zpl' | 'pdf')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="zpl" id="output-zpl" aria-label="ZPL (Zebra)" />
            <Label htmlFor="output-zpl" className="font-normal cursor-pointer">
              ZPL (Zebra)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pdf" id="output-pdf" aria-label="PDF (Universal)" />
            <Label htmlFor="output-pdf" className="font-normal cursor-pointer">
              PDF (Universal)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Copies */}
      <div className="space-y-2">
        <Label htmlFor="copies-input">Copies</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={decrementCopies}
            disabled={copies <= 1}
            aria-label="Decrease copies"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            id="copies-input"
            type="number"
            min={1}
            max={99}
            value={copies}
            onChange={(e) => setCopies(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
            className="w-20 text-center"
            aria-label="Copies"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={incrementCopies}
            disabled={copies >= 99}
            aria-label="Increase copies"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} aria-label="Cancel">
          Cancel
        </Button>
        <Button onClick={handlePrint} disabled={loading} aria-label="Print Now">
          {loading ? 'Printing...' : 'Print Now'}
        </Button>
      </div>
    </div>
  )
}

export default PrintSettingsPanel
