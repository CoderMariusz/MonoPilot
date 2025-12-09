/**
 * Line Selector Component for Scanner
 * Allows operator to select production line, persisted in localStorage
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Factory, ChevronDown } from 'lucide-react'

const STORAGE_KEY = 'scanner_selected_line'

export interface ProductionLine {
  id: string
  code: string
  name: string
  warehouse?: {
    id: string
    code: string
    name: string
  }
}

interface LineSelectorProps {
  onLineChange?: (line: ProductionLine | null) => void
  compact?: boolean
  className?: string
}

export function LineSelector({ onLineChange, compact = false, className = '' }: LineSelectorProps) {
  const [lines, setLines] = useState<ProductionLine[]>([])
  const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load lines from API
  useEffect(() => {
    async function fetchLines() {
      try {
        const response = await fetch('/api/settings/production-lines')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setLines(result.data)

            // Restore saved selection from localStorage
            const savedLineId = localStorage.getItem(STORAGE_KEY)
            if (savedLineId) {
              const savedLine = result.data.find((l: ProductionLine) => l.id === savedLineId)
              if (savedLine) {
                setSelectedLine(savedLine)
                onLineChange?.(savedLine)
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch production lines:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLines()
  }, [])

  const handleLineChange = (lineId: string) => {
    const line = lines.find(l => l.id === lineId) || null
    setSelectedLine(line)

    if (line) {
      localStorage.setItem(STORAGE_KEY, line.id)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }

    onLineChange?.(line)
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Factory className="h-4 w-4 text-muted-foreground" />
        <Select
          value={selectedLine?.id || ''}
          onValueChange={handleLineChange}
          disabled={isLoading}
        >
          <SelectTrigger className="h-8 w-[140px] text-sm">
            <SelectValue placeholder={isLoading ? 'Loading...' : 'Select line'} />
          </SelectTrigger>
          <SelectContent>
            {lines.map((line) => (
              <SelectItem key={line.id} value={line.id}>
                {line.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Factory className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium">Production Line</h3>
          <p className="text-sm text-muted-foreground">
            {selectedLine ? selectedLine.name : 'No line selected'}
          </p>
        </div>
      </div>

      <Select
        value={selectedLine?.id || ''}
        onValueChange={handleLineChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoading ? 'Loading lines...' : 'Select production line'} />
        </SelectTrigger>
        <SelectContent>
          {lines.map((line) => (
            <SelectItem key={line.id} value={line.id}>
              <div className="flex flex-col">
                <span className="font-medium">{line.code}</span>
                <span className="text-xs text-muted-foreground">{line.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Hook to use selected line in other components
export function useSelectedLine() {
  const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSelectedLine() {
      const savedLineId = localStorage.getItem(STORAGE_KEY)
      if (!savedLineId) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/settings/production-lines')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            const line = result.data.find((l: ProductionLine) => l.id === savedLineId)
            if (line) {
              setSelectedLine(line)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load selected line:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSelectedLine()

    // Listen for storage changes (in case another tab changes it)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadSelectedLine()
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const clearSelection = () => {
    localStorage.removeItem(STORAGE_KEY)
    setSelectedLine(null)
  }

  return { selectedLine, isLoading, clearSelection }
}
