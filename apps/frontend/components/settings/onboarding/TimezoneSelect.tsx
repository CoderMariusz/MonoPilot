'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TimezoneSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

/**
 * TimezoneSelect Component
 *
 * Searchable combobox for selecting from 300+ IANA timezones.
 *
 * Features:
 * - Full IANA timezone list via Intl.supportedValuesOf('timeZone')
 * - Fallback for older browsers (UTC, Europe/Warsaw, Europe/London, America/New_York)
 * - Grouped by region (Europe, America, Asia, etc.)
 * - Search/filter functionality (e.g., typing "war" shows "Europe/Warsaw")
 * - Visual checkmark for selected timezone
 * - Keyboard navigation support
 *
 * @param value - Currently selected timezone (e.g., "Europe/Warsaw")
 * @param onValueChange - Callback when timezone is selected
 */
export function TimezoneSelect({ value, onValueChange }: TimezoneSelectProps) {
  const [open, setOpen] = useState(false);

  // Get full IANA timezone list with fallback for older browsers
  const timezones = useMemo(() => {
    try {
      // Modern browsers support Intl.supportedValuesOf
      return Intl.supportedValuesOf('timeZone');
    } catch {
      // Fallback for older browsers
      return ['UTC', 'Europe/Warsaw', 'Europe/London', 'America/New_York'];
    }
  }, []);

  // Group timezones by region (Europe, America, Asia, etc.)
  const groupedTimezones = useMemo(() => {
    const groups: Record<string, string[]> = {};
    timezones.forEach((tz) => {
      const region = tz.split('/')[0];
      if (!groups[region]) {
        groups[region] = [];
      }
      groups[region].push(tz);
    });
    return groups;
  }, [timezones]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select timezone"
          className="w-full justify-between"
        >
          {value || 'Select timezone...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search timezone..." />
          <CommandEmpty>No timezone found.</CommandEmpty>
          <div className="max-h-[300px] overflow-y-auto">
            {Object.entries(groupedTimezones).map(([region, tzList]) => (
              <CommandGroup key={region} heading={region}>
                {tzList.map((tz) => (
                  <CommandItem
                    key={tz}
                    value={tz}
                    role="option"
                    data-testid={`timezone-option-${tz}`}
                    onSelect={() => {
                      onValueChange(tz);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === tz ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {tz}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
