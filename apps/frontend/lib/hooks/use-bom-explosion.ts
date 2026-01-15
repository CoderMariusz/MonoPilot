/**
 * useBOMExplosion Hook (Story 02.14)
 * React Query hook for multi-level BOM explosion
 * FR-2.29: Multi-Level BOM Explosion
 */

import { useQuery } from '@tanstack/react-query'
import type { BomExplosionResponse, ExplosionTreeNode, ExplosionItem } from '@/lib/types/bom-advanced'

// Query keys for cache management
export const bomExplosionKeys = {
  all: ['bom-explosion'] as const,
  detail: (bomId: string, maxDepth: number) => [...bomExplosionKeys.all, bomId, maxDepth] as const,
}

/**
 * Fetch BOM explosion from API
 */
async function fetchBOMExplosion(
  bomId: string,
  maxDepth: number = 10
): Promise<BomExplosionResponse> {
  const params = new URLSearchParams()
  if (maxDepth !== 10) {
    params.append('maxDepth', maxDepth.toString())
  }

  const url = `/api/technical/boms/${bomId}/explosion${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))

    if (response.status === 400 && error.message?.includes('circular')) {
      throw new Error('Circular reference detected in BOM structure')
    }
    if (response.status === 404) {
      throw new Error('BOM not found')
    }

    throw new Error(error.message || error.error || 'Failed to fetch BOM explosion')
  }

  const data = await response.json()
  return data.explosion || data
}

/**
 * Transform flat explosion levels to tree structure
 */
export function buildExplosionTree(response: BomExplosionResponse): ExplosionTreeNode[] {
  const nodes: ExplosionTreeNode[] = []
  const nodeMap = new Map<string, ExplosionTreeNode>() // item_id -> node
  const componentToNodeMap = new Map<string, ExplosionTreeNode>() // component_id -> node (for parent lookup)

  // Process each level
  for (const level of response.levels) {
    for (const item of level.items) {
      const node: ExplosionTreeNode = {
        ...item,
        level: level.level,
        children: [],
        isExpanded: level.level <= 2, // Auto-expand first 2 levels
      }

      nodeMap.set(item.item_id, node)
      // Also map by component_id for parent lookup (path contains component_ids)
      componentToNodeMap.set(item.component_id, node)

      // Find parent based on path
      // Path contains component_ids (product_ids), so we need to find parent by component_id
      if (item.path.length > 1) {
        const parentPath = item.path.slice(0, -1)
        const parentComponentId = parentPath[parentPath.length - 1]
        // Look up parent by component_id, not item_id
        const parent = componentToNodeMap.get(parentComponentId)
        if (parent) {
          node.parent_id = parent.item_id
          parent.children.push(node)
        } else {
          // No parent found, add to root
          nodes.push(node)
        }
      } else {
        // Root level item
        nodes.push(node)
      }
    }
  }

  return nodes
}

/**
 * Flatten tree back to array for iteration
 */
export function flattenTree(nodes: ExplosionTreeNode[]): ExplosionTreeNode[] {
  const result: ExplosionTreeNode[] = []

  function traverse(node: ExplosionTreeNode) {
    result.push(node)
    if (node.isExpanded && node.children) {
      for (const child of node.children) {
        traverse(child)
      }
    }
  }

  for (const node of nodes) {
    traverse(node)
  }

  return result
}

/**
 * Hook to fetch BOM explosion
 * @param bomId - BOM ID to explode
 * @param maxDepth - Maximum depth to traverse (default 10)
 * @returns React Query result with BomExplosionResponse
 */
export function useBOMExplosion(bomId: string, maxDepth: number = 10) {
  return useQuery<BomExplosionResponse, Error>({
    queryKey: bomExplosionKeys.detail(bomId, maxDepth),
    queryFn: () => fetchBOMExplosion(bomId, maxDepth),
    enabled: !!bomId,
    staleTime: 5 * 60 * 1000, // 5 minutes - explosion data doesn't change often
    retry: (failureCount, error) => {
      // Don't retry on circular reference or not found
      if (error.message.includes('circular') || error.message.includes('not found')) {
        return false
      }
      return failureCount < 2
    },
  })
}
