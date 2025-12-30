/**
 * WarehouseContactSection Component
 * Story: 01.8 - Warehouses CRUD
 *
 * Email and phone inputs with validation
 */

'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface WarehouseContactSectionProps {
  email: string
  phone: string
  onEmailChange: (value: string) => void
  onPhoneChange: (value: string) => void
  errors?: { email?: string; phone?: string }
  disabled?: boolean
}

const MAX_PHONE_LENGTH = 20

export function WarehouseContactSection({
  email,
  phone,
  onEmailChange,
  onPhoneChange,
  errors = {},
  disabled = false,
}: WarehouseContactSectionProps) {
  return (
    <div className="space-y-4">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="contact_email">
          Contact Email
          <span className="text-muted-foreground ml-1 text-xs">(optional)</span>
        </Label>
        <Input
          id="contact_email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="warehouse@example.com"
          className={errors.email ? 'border-destructive' : ''}
          disabled={disabled}
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Phone Field */}
      <div className="space-y-2">
        <Label htmlFor="contact_phone">
          Contact Phone
          <span className="text-muted-foreground ml-1 text-xs">(optional)</span>
        </Label>
        <Input
          id="contact_phone"
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="+1-555-123-4567"
          className={errors.phone ? 'border-destructive' : ''}
          maxLength={MAX_PHONE_LENGTH}
          disabled={disabled}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
          aria-invalid={!!errors.phone}
        />
        {errors.phone && (
          <p id="phone-error" className="text-sm text-destructive" role="alert">
            {errors.phone}
          </p>
        )}
      </div>
    </div>
  )
}
