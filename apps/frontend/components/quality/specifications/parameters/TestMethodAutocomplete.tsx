'use client'

/**
 * TestMethodAutocomplete Component
 * Story: 06.4 - Test Parameters
 *
 * Combobox with common test methods and custom entry support.
 * Groups methods by category (AOAC, ISO, Visual, Equipment).
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

export interface TestMethodAutocompleteProps {
  /** Current value */
  value?: string | null
  /** Callback when value changes */
  onChange: (value: string | null) => void
  /** Whether the field is disabled */
  disabled?: boolean
  /** Placeholder text */
  placeholder?: string
}

interface TestMethodOption {
  value: string
  label: string
}

interface TestMethodGroup {
  label: string
  options: TestMethodOption[]
}

const testMethodGroups: TestMethodGroup[] = [
  {
    label: 'AOAC Methods',
    options: [
      { value: 'AOAC 942.15 (Ash)', label: 'AOAC 942.15 (Ash)' },
      { value: 'AOAC 990.03 (Protein)', label: 'AOAC 990.03 (Protein)' },
      { value: 'AOAC 991.36 (Fat)', label: 'AOAC 991.36 (Fat)' },
      { value: 'AOAC 985.29 (Total Dietary Fiber)', label: 'AOAC 985.29 (Total Dietary Fiber)' },
      { value: 'AOAC 934.01 (Moisture)', label: 'AOAC 934.01 (Moisture)' },
    ],
  },
  {
    label: 'ISO Methods',
    options: [
      { value: 'ISO 5509 (Fatty Acids)', label: 'ISO 5509 (Fatty Acids)' },
      { value: 'ISO 6579 (Salmonella)', label: 'ISO 6579 (Salmonella)' },
      { value: 'ISO 4833 (Total Plate Count)', label: 'ISO 4833 (Total Plate Count)' },
      { value: 'ISO 21527 (Yeast & Mold)', label: 'ISO 21527 (Yeast & Mold)' },
      { value: 'ISO 11290 (Listeria)', label: 'ISO 11290 (Listeria)' },
    ],
  },
  {
    label: 'Visual Inspection',
    options: [
      { value: 'Visual Inspection', label: 'Visual Inspection' },
      { value: 'Visual - Color Check', label: 'Visual - Color Check' },
      { value: 'Visual - Defect Check', label: 'Visual - Defect Check' },
      { value: 'Visual - Packaging Check', label: 'Visual - Packaging Check' },
      { value: 'Organoleptic', label: 'Organoleptic (Sensory)' },
    ],
  },
  {
    label: 'Equipment',
    options: [
      { value: 'pH Meter', label: 'pH Meter' },
      { value: 'Thermometer', label: 'Thermometer' },
      { value: 'Weighing', label: 'Weighing (Scale)' },
      { value: 'Calipers', label: 'Calipers' },
      { value: 'Refractometer', label: 'Refractometer (Brix)' },
      { value: 'Water Activity Meter', label: 'Water Activity Meter' },
      { value: 'Texture Analyzer', label: 'Texture Analyzer' },
    ],
  },
]

// Flatten all options for searching
const allOptions = testMethodGroups.flatMap((group) => group.options)

export function TestMethodAutocomplete({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select test method...',
}: TestMethodAutocompleteProps) {
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
      opt.label.toLowerCase() === inputValue.toLowerCase()
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
          aria-label="Select test method"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!value && 'text-muted-foreground')}>
            {selectedLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or enter custom method..."
            value={inputValue}
            onValueChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue ? (
                <div className="py-2 px-4 text-sm">
                  <p className="text-muted-foreground">No matching method found.</p>
                  <p className="text-muted-foreground mt-1">
                    Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to use &quot;{inputValue}&quot;
                  </p>
                </div>
              ) : (
                'No test method found.'
              )}
            </CommandEmpty>
            {testMethodGroups.map((group) => (
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

export default TestMethodAutocomplete
