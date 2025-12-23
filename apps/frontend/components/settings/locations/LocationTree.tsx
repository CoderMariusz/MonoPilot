/**
 * Location Tree Component
 * Story: 01.9 - Location Hierarchy Management
 *
 * Hierarchical tree view with expand/collapse
 */

'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Package, Warehouse, Map, Grid } from 'lucide-react'
import type { LocationNode } from '@/lib/types/location'
import { CapacityIndicator } from './CapacityIndicator'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'

interface LocationTreeProps {
  warehouseId: string
  locations: LocationNode[]
  selectedId?: string
  onSelect: (location: LocationNode) => void
  onEdit?: (location: LocationNode) => void
  onDelete?: (location: LocationNode) => void
  onAddChild?: (location: LocationNode) => void
}

function LocationTreeNode({
  location,
  level = 0,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddChild,
}: {
  location: LocationNode
  level?: number
  selectedId?: string
  expandedIds: Set<string>
  onSelect: (location: LocationNode) => void
  onToggleExpand: (locationId: string) => void
  onEdit?: (location: LocationNode) => void
  onDelete?: (location: LocationNode) => void
  onAddChild?: (location: LocationNode) => void
}) {
  const isExpanded = expandedIds.has(location.id)
  const isSelected = location.id === selectedId
  const hasChildren = location.children.length > 0
  const canHaveChildren = location.level !== 'bin'

  // Icon based on level
  const getLevelIcon = () => {
    switch (location.level) {
      case 'zone':
        return <Map className="h-4 w-4 text-blue-600" />
      case 'aisle':
        return <Warehouse className="h-4 w-4 text-green-600" />
      case 'rack':
        return <Grid className="h-4 w-4 text-yellow-600" />
      case 'bin':
        return <Package className="h-4 w-4 text-purple-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div>
      {/* Location Row */}
      <div
        className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-muted transition-colors ${
          isSelected ? 'bg-muted ring-1 ring-primary' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(location)}
        onDoubleClick={() => onEdit?.(location)}
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-selected={isSelected}
        aria-level={level + 1}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(location)
          }
          if (e.key === 'ArrowRight' && hasChildren) {
            onToggleExpand(location.id)
          }
          if (e.key === 'ArrowLeft' && hasChildren && isExpanded) {
            onToggleExpand(location.id)
          }
        }}
      >
        {/* Expand/Collapse Icon */}
        <div className="w-4 h-4 flex-shrink-0">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand(location.id)
              }}
              className="p-0"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>

        {/* Level Icon */}
        {getLevelIcon()}

        {/* Code and Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{location.code}</span>
            <span className="text-xs text-muted-foreground truncate">{location.name}</span>
          </div>
        </div>

        {/* Capacity Indicator */}
        {(location.max_pallets !== null || location.max_weight_kg !== null) && (
          <div className="w-48 flex-shrink-0">
            {location.max_pallets !== null ? (
              <CapacityIndicator
                current={location.current_pallets}
                max={location.max_pallets}
                unit="pallets"
                size="sm"
              />
            ) : location.max_weight_kg !== null ? (
              <CapacityIndicator
                current={location.current_weight_kg}
                max={location.max_weight_kg}
                unit="kg"
                size="sm"
              />
            ) : null}
          </div>
        )}

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
              aria-label="Location actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onEdit(location)
              }}>
                Edit Location
              </DropdownMenuItem>
            )}
            {onAddChild && canHaveChildren && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onAddChild(location)
              }}>
                Add Child Location
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(location)
                }}
                className="text-destructive"
              >
                Delete Location
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div role="group">
          {location.children.map((child) => (
            <LocationTreeNode
              key={child.id}
              location={child}
              level={level + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function LocationTree({
  warehouseId,
  locations,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
}: LocationTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const handleToggleExpand = (locationId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(locationId)) {
        next.delete(locationId)
      } else {
        next.add(locationId)
      }
      return next
    })
  }

  const handleExpandAll = () => {
    const allIds = new Set<string>()
    const collectIds = (nodes: LocationNode[]) => {
      nodes.forEach((node) => {
        if (node.children.length > 0) {
          allIds.add(node.id)
          collectIds(node.children)
        }
      })
    }
    collectIds(locations)
    setExpandedIds(allIds)
  }

  const handleCollapseAll = () => {
    setExpandedIds(new Set())
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No locations found. Create your first zone to get started.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Tree Controls */}
      <div className="flex justify-end gap-2 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExpandAll}
          aria-label="Expand all locations"
        >
          Expand All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCollapseAll}
          aria-label="Collapse all locations"
        >
          Collapse All
        </Button>
      </div>

      {/* Tree View */}
      <div role="tree" aria-label="Location hierarchy" className="border rounded-md p-2">
        {locations.map((location) => (
          <LocationTreeNode
            key={location.id}
            location={location}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onSelect={onSelect}
            onToggleExpand={handleToggleExpand}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
          />
        ))}
      </div>
    </div>
  )
}
