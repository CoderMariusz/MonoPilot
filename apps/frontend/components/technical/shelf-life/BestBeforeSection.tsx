/**
 * Best Before Section Component
 * Story: 02.11 - Shelf Life Calculation + Expiry Management
 *
 * Best before calculation settings:
 * - Shelf life mode: Fixed vs Rolling
 * - Label format: Best Before Day, Month, or Use By
 * - Example calculation preview
 */

'use client'

import { Calendar, Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { ShelfLifeMode, LabelFormat } from '@/lib/types/shelf-life'

interface BestBeforeSectionProps {
  shelfLifeMode: ShelfLifeMode
  labelFormat: LabelFormat
  finalDays: number | null
  onChange: (field: string, value: string) => void
}

export function BestBeforeSection({
  shelfLifeMode,
  labelFormat,
  finalDays,
  onChange,
}: BestBeforeSectionProps) {
  // Calculate example dates
  const today = new Date()
  const exampleProductionDate = today.toISOString().split('T')[0]
  const exampleBestBefore =
    finalDays != null
      ? new Date(today.getTime() + finalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : null

  // Format date based on label format
  const formatDate = (dateStr: string | null, format: LabelFormat): string => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    switch (format) {
      case 'best_before_day':
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      case 'best_before_month':
        return date.toLocaleDateString('en-GB', {
          month: '2-digit',
          year: 'numeric',
        })
      case 'use_by':
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      default:
        return dateStr
    }
  }

  // Get label prefix based on format
  const getLabelPrefix = (format: LabelFormat): string => {
    switch (format) {
      case 'best_before_day':
      case 'best_before_month':
        return 'Best Before:'
      case 'use_by':
        return 'Use By:'
      default:
        return 'Best Before:'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Best Before Calculation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Shelf Life Mode */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label>
              Shelf Life Mode <span className="text-red-500">*</span>
            </Label>
          </div>
          <RadioGroup
            value={shelfLifeMode}
            onValueChange={(value) => onChange('shelf_life_mode', value)}
            className="space-y-2"
          >
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="fixed" id="mode-fixed" className="mt-1" />
              <div>
                <Label htmlFor="mode-fixed" className="cursor-pointer font-normal">
                  Fixed Days (from production date)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Best before = production date + shelf life days
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="rolling" id="mode-rolling" className="mt-1" />
              <div>
                <Label htmlFor="mode-rolling" className="cursor-pointer font-normal">
                  Rolling (from ingredient receipt)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Best before = earliest ingredient expiry - processing buffer
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Label Format */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <Label>
              Label Format <span className="text-red-500">*</span>
            </Label>
          </div>
          <RadioGroup
            value={labelFormat}
            onValueChange={(value) => onChange('label_format', value)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="best_before_day" id="format-day" />
              <Label htmlFor="format-day" className="cursor-pointer font-normal">
                Best Before: DD/MM/YYYY
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="best_before_month" id="format-month" />
              <Label htmlFor="format-month" className="cursor-pointer font-normal">
                Best Before End: MM/YYYY
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="use_by" id="format-useby" />
              <Label htmlFor="format-useby" className="cursor-pointer font-normal">
                Use By: DD/MM/YYYY (for high-risk foods)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Example Calculation */}
        {finalDays != null && (
          <div className="rounded-md bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Example Calculation</p>
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">
                Production Date: <span className="font-mono">{exampleProductionDate}</span>
              </p>
              <p className="text-foreground">
                {getLabelPrefix(labelFormat)}{' '}
                <span className="font-mono font-medium">
                  {formatDate(exampleBestBefore, labelFormat)}
                </span>{' '}
                ({finalDays} days)
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
