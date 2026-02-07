'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface SearchResult {
  id: string
  type: string
  code: string
  description: string
  link: string
}

export function QuickActions() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(
          `/api/dashboard/search?q=${encodeURIComponent(searchQuery)}`
        )
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.results || [])
          setShowResults(true)
        }
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-gray-50 p-3">
      {/* Create Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm">
            <span>+</span>
            <span className="ml-1">Create</span>
            <span className="ml-1">▼</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href="/planning/purchase-orders/new">
              Create Purchase Order
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/planning/work-orders/new">Create Work Order</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/quality/ncr/new">Create NCR</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/planning/transfer-orders/new">
              Create Transfer Order
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Global Search */}
      <div className="relative flex-1" ref={searchRef}>
        <Input
          type="search"
          placeholder="Search WO, PO, LP, Product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border bg-white shadow-lg z-10 max-h-80 overflow-y-auto">
            {searchLoading ? (
              <div className="p-4 text-sm text-muted-foreground">
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No results found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="p-2">
                {searchResults.map((result) => (
                  <Link
                    key={result.id}
                    href={result.link}
                    className="block rounded px-3 py-2 hover:bg-gray-100 transition-colors"
                    onClick={() => setShowResults(false)}
                  >
                    <div className="font-medium text-sm">{result.code}</div>
                    <div className="text-xs text-muted-foreground">
                      {result.description}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
