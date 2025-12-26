/**
 * LanguageSelector Component
 * Story: TD-208 - Language Selector for Allergen Names
 *
 * Features:
 * - Dropdown with 4 languages (EN, PL, DE, FR)
 * - Shows current selection with language code badge
 * - onChange callback for parent state management
 * - Keyboard navigation (native select behavior)
 * - ARIA attributes for accessibility
 * - Loading and disabled states
 */

'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Globe } from 'lucide-react'
import type { LanguageCode } from '@/lib/services/user-preference-service'
import {
  VALID_LANGUAGE_CODES,
  LANGUAGE_DISPLAY_NAMES,
} from '@/lib/services/user-preference-service'

interface LanguageSelectorProps {
  /**
   * Currently selected language code
   */
  value: LanguageCode
  /**
   * Callback when language selection changes
   */
  onChange: (language: LanguageCode) => void
  /**
   * Whether the selector is disabled
   */
  disabled?: boolean
  /**
   * Whether the selector is in loading state
   */
  isLoading?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Accessible label for screen readers
   */
  'aria-label'?: string
}

/**
 * Language option item with flag emoji and name
 */
interface LanguageOption {
  code: LanguageCode
  name: string
  flag: string
}

/**
 * Language options with flag emojis for visual identification
 */
const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English', flag: 'GB' },
  { code: 'pl', name: 'Polski', flag: 'PL' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'fr', name: 'Francais', flag: 'FR' },
]

export function LanguageSelector({
  value,
  onChange,
  disabled = false,
  isLoading = false,
  className,
  'aria-label': ariaLabel = 'Select language for allergen names',
}: LanguageSelectorProps) {
  const handleValueChange = (newValue: string) => {
    // Validate the new value is a valid language code
    if (VALID_LANGUAGE_CODES.includes(newValue as LanguageCode)) {
      onChange(newValue as LanguageCode)
    }
  }

  const selectedOption = LANGUAGE_OPTIONS.find(opt => opt.code === value)

  return (
    <div className={className}>
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger
          className="w-[180px]"
          aria-label={ariaLabel}
          data-testid="language-selector"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {isLoading ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : (
              <SelectValue>
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs px-1.5">
                    {value.toUpperCase()}
                  </Badge>
                  <span>{selectedOption?.name || LANGUAGE_DISPLAY_NAMES[value]}</span>
                </span>
              </SelectValue>
            )}
          </div>
        </SelectTrigger>
        <SelectContent>
          {LANGUAGE_OPTIONS.map((option) => (
            <SelectItem
              key={option.code}
              value={option.code}
              data-testid={`language-option-${option.code}`}
            >
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs px-1.5">
                  {option.code.toUpperCase()}
                </Badge>
                <span>{option.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * Compact version for use in table headers or tight spaces
 */
export function LanguageSelectorCompact({
  value,
  onChange,
  disabled = false,
  isLoading = false,
}: Pick<LanguageSelectorProps, 'value' | 'onChange' | 'disabled' | 'isLoading'>) {
  const handleValueChange = (newValue: string) => {
    if (VALID_LANGUAGE_CODES.includes(newValue as LanguageCode)) {
      onChange(newValue as LanguageCode)
    }
  }

  return (
    <Select
      value={value}
      onValueChange={handleValueChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger
        className="w-[100px] h-8"
        aria-label="Select language"
        data-testid="language-selector-compact"
      >
        <SelectValue>
          {isLoading ? '...' : value.toUpperCase()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LANGUAGE_OPTIONS.map((option) => (
          <SelectItem
            key={option.code}
            value={option.code}
            data-testid={`language-option-compact-${option.code}`}
          >
            {option.code.toUpperCase()} - {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
