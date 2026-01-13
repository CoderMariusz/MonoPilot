/**
 * LP Search Input Component
 * Story 05.5: LP Search & Filters
 *
 * Features:
 * - Debounced search (300ms)
 * - Enter key bypasses debounce
 * - Clear button when text entered
 * - Loading spinner during search
 * - Min 2 characters validation
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export interface LPSearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch: (value: string) => void
  loading?: boolean
  placeholder?: string
  debounceMs?: number
}

export function LPSearchInput({
  value,
  onChange,
  onSearch,
  loading = false,
  placeholder = 'Search LP number or batch...',
  debounceMs = 300,
}: LPSearchInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const debounceTimer = useRef<NodeJS.Timeout>(undefined)

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const executeSearch = useCallback(
    (searchValue: string) => {
      if (searchValue.length >= 2 || searchValue === '') {
        onChange(searchValue)
        onSearch(searchValue)
      }
    },
    [onChange, onSearch]
  )

  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue)

      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      // If empty, execute immediately
      if (newValue === '') {
        executeSearch(newValue)
        return
      }

      // Debounce non-empty values
      debounceTimer.current = setTimeout(() => {
        executeSearch(newValue)
      }, debounceMs)
    },
    [debounceMs, executeSearch]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        // Clear debounce timer
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current)
        }
        // Execute search immediately
        executeSearch(localValue)
      }
    },
    [localValue, executeSearch]
  )

  const handleClear = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    setLocalValue('')
    executeSearch('')
  }, [executeSearch])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  const showClear = localValue.length > 0
  const isSearching = loading && localValue.length >= 2

  return (
    <div className="relative flex-1" data-testid="lp-search-input">
      <Search
        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pl-10 pr-20"
        aria-label="Search license plates by LP number or batch"
        aria-describedby="search-help"
        role="searchbox"
        data-testid="search-input"
      />
      <span id="search-help" className="sr-only">
        Enter at least 2 characters to search. Press Enter to search immediately.
      </span>

      {/* Loading/Clear buttons */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
        {isSearching && (
          <Loader2
            className="h-4 w-4 animate-spin text-muted-foreground"
            aria-label="Searching..."
            data-testid="search-loading"
          />
        )}
        {showClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 w-7 p-0"
            aria-label="Clear search"
            data-testid="search-clear"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Validation hint */}
      {localValue.length === 1 && (
        <p className="text-xs text-muted-foreground mt-1" role="alert">
          Enter at least 2 characters to search
        </p>
      )}
    </div>
  )
}
