'use client'

/**
 * UnitSelector Component
 * Story: 06.4 - Test Parameters
 *
 * Dropdown with common units of measure and custom entry support.
 * Groups units by category (Temperature, Weight, Volume, etc.).
 */

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface UnitSelectorProps {
  /** Current value */
  value?: string | null
  /** Callback when value changes */
  onChange: (value: string | null) => void
  /** Whether the field is disabled */
  disabled?: boolean
  /** Placeholder text */
  placeholder?: string
}

interface UnitOption {
  value: string
  label: string
}

interface UnitGroup {
  label: string
  options: UnitOption[]
}

const unitGroups: UnitGroup[] = [
  {
    label: 'Temperature',
    options: [
      { value: '\u00B0C', label: '\u00B0C (Celsius)' },
      { value: '\u00B0F', label: '\u00B0F (Fahrenheit)' },
      { value: 'K', label: 'K (Kelvin)' },
    ],
  },
  {
    label: 'Weight',
    options: [
      { value: 'g', label: 'g (grams)' },
      { value: 'kg', label: 'kg (kilograms)' },
      { value: 'mg', label: 'mg (milligrams)' },
      { value: 'lb', label: 'lb (pounds)' },
      { value: 'oz', label: 'oz (ounces)' },
    ],
  },
  {
    label: 'Volume',
    options: [
      { value: 'mL', label: 'mL (milliliters)' },
      { value: 'L', label: 'L (liters)' },
      { value: 'gal', label: 'gal (gallons)' },
      { value: 'fl oz', label: 'fl oz (fluid ounces)' },
    ],
  },
  {
    label: 'Dimension',
    options: [
      { value: 'mm', label: 'mm (millimeters)' },
      { value: 'cm', label: 'cm (centimeters)' },
      { value: 'm', label: 'm (meters)' },
      { value: 'in', label: 'in (inches)' },
      { value: 'ft', label: 'ft (feet)' },
    ],
  },
  {
    label: 'Concentration',
    options: [
      { value: 'pH', label: 'pH' },
      { value: '%', label: '% (percentage)' },
      { value: 'ppm', label: 'ppm (parts per million)' },
      { value: 'ppb', label: 'ppb (parts per billion)' },
      { value: 'mg/L', label: 'mg/L' },
      { value: 'mg/kg', label: 'mg/kg' },
      { value: '\u00B0Brix', label: '\u00B0Brix' },
      { value: 'aw', label: 'aw (water activity)' },
    ],
  },
  {
    label: 'Time',
    options: [
      { value: 's', label: 's (seconds)' },
      { value: 'min', label: 'min (minutes)' },
      { value: 'h', label: 'h (hours)' },
      { value: 'days', label: 'days' },
    ],
  },
  {
    label: 'Other',
    options: [
      { value: 'CFU/g', label: 'CFU/g (colony forming units)' },
      { value: 'CFU/mL', label: 'CFU/mL' },
      { value: 'N', label: 'N (Newton)' },
      { value: 'Pa', label: 'Pa (Pascal)' },
      { value: 'bar', label: 'bar' },
      { value: 'psi', label: 'psi' },
    ],
  },
]

// Flatten all options for searching
const allOptions = unitGroups.flatMap((group) => group.options)

export function UnitSelector({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select unit...',
}: UnitSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')

  const selectedLabel = value
    ? allOptions.find((opt) => opt.value === value)?.label || value
    : ''

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === value) {
      onChange(null)
    } else {
      onChange(selectedValue)
    }
    setOpen(false)
    setInputValue('')
  }

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow custom entry on Enter if no match found
    if (e.key === 'Enter' && inputValue && !allOptions.some((opt) =>
      opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      opt.value.toLowerCase() === inputValue.toLowerCase()
    )) {
      onChange(inputValue)
      setOpen(false)
      setInputValue('')
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select unit"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!value && 'text-muted-foreground')}>
            {selectedLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or enter custom..."
            value={inputValue}
            onValueChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue ? (
                <div className="py-2 px-4 text-sm">
                  <p className="text-muted-foreground">No matching unit found.</p>
                  <p className="text-muted-foreground mt-1">
                    Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to use &quot;{inputValue}&quot;
                  </p>
                </div>
              ) : (
                'No unit found.'
              )}
            </CommandEmpty>
            {unitGroups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default UnitSelector
