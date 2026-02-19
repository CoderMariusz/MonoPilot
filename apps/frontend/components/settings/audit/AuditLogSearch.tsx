/**
 * AuditLogSearch Component
 * Story: 01.17 - Audit Trail
 *
 * Full-text search input with 300ms debounce
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface AuditLogSearchProps {
  value: string
  onSearch: (search: string) => void
  placeholder?: string
}

const DEBOUNCE_MS = 300

export function AuditLogSearch({
  value,
  onSearch,
  placeholder = 'Search audit logs...',
}: AuditLogSearchProps) {
  const [inputValue, setInputValue] = useState(value)
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Sync with external value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }

    searchTimerRef.current = setTimeout(() => {
      onSearch(inputValue)
    }, DEBOUNCE_MS)

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [inputValue, onSearch])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="pl-10 w-full md:w-[300px]"
        data-testid="audit-search-input"
      />
    </div>
  )
}
