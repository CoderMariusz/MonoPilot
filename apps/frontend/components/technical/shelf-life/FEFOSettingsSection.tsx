/**
 * FEFO Settings Section Component
 * Story: 02.11 - Shelf Life Calculation + Expiry Management
 *
 * FIFO/FEFO picking and shipment settings:
 * - Picking strategy: FIFO vs FEFO
 * - Minimum remaining shelf life for shipment
 * - Enforcement level: suggest/warn/block
 * - Warning/critical threshold inputs
 */

'use client'

import { Truck, AlertTriangle, Clock, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { PickingStrategy, EnforcementLevel } from '@/lib/types/shelf-life'

interface FEFOSettingsSectionProps {
  pickingStrategy: PickingStrategy
  minRemainingForShipment: string
  enforcementLevel: EnforcementLevel
  expiryWarningDays: string
  expiryCriticalDays: string
  finalDays: number | null
  onChange: (field: string, value: string) => void
  errors: {
    min_remaining_for_shipment?: string
    expiry_warning_days?: string
    expiry_critical_days?: string
  }
}

export function FEFOSettingsSection({
  pickingStrategy,
  minRemainingForShipment,
  enforcementLevel,
  expiryWarningDays,
  expiryCriticalDays,
  finalDays,
  onChange,
  errors,
}: FEFOSettingsSectionProps) {
  // Calculate percentage of shelf life
  const minRemainingNum = minRemainingForShipment ? parseInt(minRemainingForShipment, 10) : null
  const percentageOfShelfLife =
    finalDays != null && minRemainingNum != null
      ? Math.round((minRemainingNum / finalDays) * 100)
      : null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">FIFO/FEFO Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Picking Strategy */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <Label>
              Picking Strategy <span className="text-red-500">*</span>
            </Label>
          </div>
          <RadioGroup
            value={pickingStrategy}
            onValueChange={(value) => onChange('picking_strategy', value)}
            className="space-y-2"
          >
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="FIFO" id="strategy-fifo" className="mt-1" />
              <div>
                <Label htmlFor="strategy-fifo" className="cursor-pointer font-normal">
                  FIFO (First In, First Out)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Pick by receipt date - best for long shelf life products
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="FEFO" id="strategy-fefo" className="mt-1" />
              <div>
                <Label htmlFor="strategy-fefo" className="cursor-pointer font-normal">
                  FEFO (First Expired, First Out)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Pick by expiry date - recommended for perishable products
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Minimum Remaining Shelf Life */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="min_remaining">Minimum Remaining Shelf Life for Shipment</Label>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="min_remaining"
              type="number"
              min="0"
              max="365"
              value={minRemainingForShipment}
              onChange={(e) => onChange('min_remaining_for_shipment', e.target.value)}
              className={cn('w-32', errors.min_remaining_for_shipment && 'border-red-500')}
              placeholder="e.g., 5"
              aria-invalid={!!errors.min_remaining_for_shipment}
            />
            <span className="text-sm text-muted-foreground">days</span>
            {percentageOfShelfLife != null && (
              <span className="text-sm text-muted-foreground ml-2">
                ({percentageOfShelfLife}% of total shelf life)
              </span>
            )}
          </div>
          {errors.min_remaining_for_shipment && (
            <p className="text-sm text-red-500">{errors.min_remaining_for_shipment}</p>
          )}

          {/* Shipment restriction warning */}
          {minRemainingNum != null && minRemainingNum > 0 && (
            <Alert variant="default" className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Products with less than {minRemainingNum} days remaining cannot be shipped
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Enforcement Level */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            <Label>
              Enforcement Level <span className="text-red-500">*</span>
            </Label>
          </div>
          <RadioGroup
            value={enforcementLevel}
            onValueChange={(value) => onChange('enforcement_level', value)}
            className="space-y-2"
          >
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="suggest" id="enforce-suggest" className="mt-1" />
              <div>
                <Label htmlFor="enforce-suggest" className="cursor-pointer font-normal">
                  Suggest
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show warning but allow override
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="warn" id="enforce-warn" className="mt-1" />
              <div>
                <Label htmlFor="enforce-warn" className="cursor-pointer font-normal">
                  Warn
                </Label>
                <p className="text-xs text-muted-foreground">
                  Require confirmation to proceed
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="block" id="enforce-block" className="mt-1" />
              <div>
                <Label htmlFor="enforce-block" className="cursor-pointer font-normal">
                  Block
                </Label>
                <p className="text-xs text-muted-foreground">
                  Prevent shipment entirely
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Expiry Warning/Critical Thresholds */}
        <div className="space-y-3">
          <Label>Expiry Alert Thresholds</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry_warning" className="text-sm text-muted-foreground">
                Warning (days before expiry)
              </Label>
              <Input
                id="expiry_warning"
                type="number"
                min="1"
                max="90"
                value={expiryWarningDays}
                onChange={(e) => onChange('expiry_warning_days', e.target.value)}
                className={cn('w-full', errors.expiry_warning_days && 'border-red-500')}
                placeholder="e.g., 7"
                aria-invalid={!!errors.expiry_warning_days}
              />
              {errors.expiry_warning_days && (
                <p className="text-sm text-red-500">{errors.expiry_warning_days}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry_critical" className="text-sm text-muted-foreground">
                Critical (days before expiry)
              </Label>
              <Input
                id="expiry_critical"
                type="number"
                min="1"
                max="30"
                value={expiryCriticalDays}
                onChange={(e) => onChange('expiry_critical_days', e.target.value)}
                className={cn('w-full', errors.expiry_critical_days && 'border-red-500')}
                placeholder="e.g., 3"
                aria-invalid={!!errors.expiry_critical_days}
              />
              {errors.expiry_critical_days && (
                <p className="text-sm text-red-500">{errors.expiry_critical_days}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Critical threshold must be less than or equal to warning threshold
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
