/**
 * Password Requirements Component
 * Story: 01.15 - Session & Password Management
 *
 * Displays real-time password strength indicator and requirement checklist
 */

'use client'

import { Check, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  calculatePasswordStrength,
  meetsMinLength,
  hasUppercase,
  hasLowercase,
  hasNumber,
  hasSpecialChar,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
} from '@/lib/utils/password-helpers'

interface PasswordRequirementsProps {
  password: string
  showStrength?: boolean
}

interface Requirement {
  id: string
  label: string
  met: boolean
}

export function PasswordRequirements({
  password,
  showStrength = true,
}: PasswordRequirementsProps) {
  const requirements: Requirement[] = [
    { id: 'minLength', label: 'At least 8 characters', met: meetsMinLength(password, 8) },
    { id: 'uppercase', label: 'One uppercase letter (A-Z)', met: hasUppercase(password) },
    { id: 'lowercase', label: 'One lowercase letter (a-z)', met: hasLowercase(password) },
    { id: 'number', label: 'One number (0-9)', met: hasNumber(password) },
    { id: 'special', label: 'One special character (!@#$%^&*)', met: hasSpecialChar(password) },
  ]

  const strength = calculatePasswordStrength(password)
  const strengthLabel = getPasswordStrengthLabel(strength)
  const strengthColor = getPasswordStrengthColor(strength)

  const allMet = requirements.every((req) => req.met)

  return (
    <div className="space-y-3" role="region" aria-label="Password requirements">
      {/* Strength Indicator */}
      {showStrength && password.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Password Strength</span>
            <span
              className={cn(
                'font-medium',
                strengthColor === 'red' && 'text-red-600',
                strengthColor === 'yellow' && 'text-yellow-600',
                strengthColor === 'green' && 'text-green-600'
              )}
              aria-live="polite"
            >
              {strengthLabel}
            </span>
          </div>
          <div className="flex gap-1" role="progressbar" aria-valuenow={strength} aria-valuemin={0} aria-valuemax={4}>
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  strength >= level
                    ? strengthColor === 'red'
                      ? 'bg-red-500'
                      : strengthColor === 'yellow'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                    : 'bg-gray-200'
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Requirements List */}
      <div className="space-y-1.5">
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          {allMet ? (
            <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          Password Requirements
        </p>
        <ul className="space-y-1" aria-label="Password requirements checklist">
          {requirements.map((req) => (
            <li
              key={req.id}
              className={cn(
                'flex items-center gap-2 text-sm transition-colors',
                req.met ? 'text-green-600' : 'text-muted-foreground'
              )}
            >
              {req.met ? (
                <Check className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              ) : (
                <X className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              )}
              <span>
                {req.label}
                <span className="sr-only">{req.met ? ' - met' : ' - not met'}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
