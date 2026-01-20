/**
 * LP Search Input Component (Story 04.6a)
 * Barcode search/scan input for LP selection
 *
 * Wireframe: PROD-003 - LP Barcode Search section in Add Consumption Modal
 *
 * Features:
 * - Search as you type
 * - Barcode scan button (placeholder)
 * - Auto-complete dropdown
 * - Keyboard navigation
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ScanBarcode, Loader2 } from 'lucide-react'
import type { AvailableLP } from '@/lib/services/consumption-service'

interface LPSearchInputProps {
  onSelect: (lp: AvailableLP) => void
  availableLPs: AvailableLP[]
  isLoading?: boolean
  placeholder?: string
  disabled?: boolean
  initialValue?: string
}

export function LPSearchInput({
  onSelect,
  availableLPs,
  isLoading,
  placeholder = 'Scan or type LP number...',
  disabled,
  initialValue = '',
}: LPSearchInputProps) {
  const [searchValue, setSearchValue] = useState(initialValue)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter LPs based on search
  const filteredLPs = searchValue
    ? availableLPs.filter((lp) =>
        lp.lp_number.toLowerCase().includes(searchValue.toLowerCase())
      )
    : availableLPs

  // Handle search input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    setShowDropdown(true)
    setSelectedIndex(-1)
  }

  // Handle LP selection
  const handleSelect = useCallback((lp: AvailableLP) => {
    setSearchValue(lp.lp_number)
    setShowDropdown(false)
    setSelectedIndex(-1)
    onSelect(lp)
  }, [onSelect])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredLPs.length === 0) {
      if (e.key === 'Enter' && searchValue) {
        // Try to find exact match
        const exactMatch = availableLPs.find(
          (lp) => lp.lp_number.toLowerCase() === searchValue.toLowerCase()
        )
        if (exactMatch) {
          handleSelect(exactMatch)
        }
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredLPs.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && filteredLPs[selectedIndex]) {
          handleSelect(filteredLPs[selectedIndex])
        } else if (filteredLPs.length === 1) {
          handleSelect(filteredLPs[0])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedEl = dropdownRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      )
      selectedEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // Format expiry date
  const formatExpiry = (date: string | null) => {
    if (!date) return 'No expiry'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowDropdown(true)}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="pl-9"
            data-testid="lp-barcode-input"
            autoComplete="off"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          title="Scan barcode"
          onClick={() => {
            // Placeholder for barcode scanner integration
            inputRef.current?.focus()
          }}
        >
          <ScanBarcode className="h-4 w-4" />
        </Button>
      </div>

      {/* Dropdown */}
      {showDropdown && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {isLoading ? (
            <div className="p-3 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredLPs.length === 0 ? (
            <div className="p-3 text-center text-muted-foreground text-sm">
              {searchValue ? 'No matching LPs found' : 'No available LPs'}
            </div>
          ) : (
            filteredLPs.map((lp, index) => (
              <div
                key={lp.id}
                data-index={index}
                onClick={() => handleSelect(lp)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelect(lp)
                  }
                }}
                role="option"
                tabIndex={0}
                aria-selected={index === selectedIndex}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                  index === selectedIndex
                    ? 'bg-accent'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div>
                  <div className="font-mono font-medium">{lp.lp_number}</div>
                  <div className="text-xs text-muted-foreground flex gap-3">
                    <span>
                      {lp.batch_number || 'No batch'}
                    </span>
                    <span>{formatExpiry(lp.expiry_date)}</span>
                    {lp.location_name && <span>{lp.location_name}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">
                    {lp.current_qty.toLocaleString()} {lp.uom}
                  </div>
                  <div className="text-xs text-green-600">Available</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Hint text */}
      {searchValue && !showDropdown && (
        <p className="text-xs text-muted-foreground mt-1">
          Press Enter to search: {searchValue}
        </p>
      )}
    </div>
  )
}
