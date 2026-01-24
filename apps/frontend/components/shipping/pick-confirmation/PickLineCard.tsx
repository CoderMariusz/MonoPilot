/**
 * PickLineCard Component
 * Story: 07.9 - Pick Confirmation Desktop
 * Phase: GREEN - Full implementation
 *
 * Current pick line with product, location, LP, allergen info.
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AllergenWarningBanner } from './AllergenWarningBanner'
import { LPBarcodeDisplay } from './LPBarcodeDisplay'
import { PickConfirmationService } from '@/lib/services/pick-confirmation-service'
import { MapPin, Package, Calendar, Hash, Plus, Minus, Check, AlertTriangle } from 'lucide-react'

export interface PickLineCardProps {
  line: {
    id: string
    product_id: string
    product_name: string
    product_sku: string
    product_allergens: string[]
    location: { zone: string; aisle: string; bin: string }
    lp_number: string
    quantity_to_pick: number
    quantity_picked: number
    lot_number: string
    best_before_date: string
  }
  customerAllergens: string[]
  onPickConfirm: (quantity: number) => Promise<void>
  onShortPick: (quantity: number) => void
}

export function PickLineCard({
  line,
  customerAllergens,
  onPickConfirm,
  onShortPick,
}: PickLineCardProps): React.JSX.Element {
  const [quantity, setQuantity] = useState(line.quantity_to_pick)
  const [allergenAcknowledged, setAllergenAcknowledged] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const hasConflict = PickConfirmationService.checkAllergenConflict(line.product_allergens, customerAllergens)
  const isConfirmDisabled = (hasConflict && !allergenAcknowledged) || isLoading

  // Format location string
  const locationString = `${line.location.zone}-${line.location.aisle}-${line.location.bin}`

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0) {
      setQuantity(num)
    }
  }

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1)
  }

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(0, prev - 1))
  }

  const handleConfirmPick = async () => {
    setIsLoading(true)
    try {
      await onPickConfirm(quantity)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShortPick = () => {
    onShortPick(quantity)
  }

  const handleAllergenAcknowledge = () => {
    setAllergenAcknowledged(true)
  }

  return (
    <Card data-testid="pick-line-card" className="w-full max-w-2xl">
      <CardHeader className="pb-2">
        {/* Location - Prominent Display */}
        <div className="flex items-center gap-2 text-2xl font-bold">
          <MapPin className="h-6 w-6 text-blue-600" />
          <span>{locationString}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Product Info */}
        <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
          <Package className="h-10 w-10 text-muted-foreground mt-1" />
          <div className="flex-1">
            <p className="font-semibold text-lg">{line.product_name}</p>
            <p className="text-sm text-muted-foreground">SKU: {line.product_sku}</p>
            {line.product_allergens && line.product_allergens.length > 0 && (
              <div className="flex gap-1 mt-1">
                {line.product_allergens.map((allergen) => (
                  <Badge key={allergen} variant="secondary" className="text-xs">
                    {allergen}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lot and Expiry */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Lot: {line.lot_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Best Before: {line.best_before_date}</span>
          </div>
        </div>

        {/* LP Barcode Display */}
        <LPBarcodeDisplay lp_number={line.lp_number} />

        {/* Allergen Warning */}
        {hasConflict && (
          <AllergenWarningBanner
            product={{
              name: line.product_name,
              allergens: line.product_allergens,
            }}
            customerRestrictions={customerAllergens}
            onAcknowledge={handleAllergenAcknowledge}
          />
        )}

        {/* Quantity Input */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity to Pick</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="w-24 text-center"
              min={0}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              of {line.quantity_to_pick} required
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleConfirmPick}
            disabled={isConfirmDisabled}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirm Pick
          </Button>
          <Button
            variant="outline"
            onClick={handleShortPick}
            className="flex-1"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Short Pick
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
