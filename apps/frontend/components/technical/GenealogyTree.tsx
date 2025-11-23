// Genealogy Tree Visualization Component (Story 2.21)
'use client'

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow'
import 'reactflow/dist/style.css'

import { LPNode, type LPNodeData } from './LPNode'
import type { TraceNode } from '@/lib/types/traceability'

interface GenealogyTreeProps {
  traceTree: TraceNode[]
  direction: 'forward' | 'backward'
  onNodeClick?: (nodeId: string) => void
}

const nodeTypes = {
  lpNode: LPNode
}

function GenealogyTreeInner({ traceTree, direction, onNodeClick }: GenealogyTreeProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [matchingNodes, setMatchingNodes] = useState<string[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const reactFlowInstance = useReactFlow()
  const treeRef = useRef<HTMLDivElement>(null)

  // Transform trace tree data to react-flow format
  useEffect(() => {
    const { nodes: flowNodes, edges: flowEdges } = transformToReactFlow(
      traceTree,
      direction
    )
    setNodes(flowNodes)
    setEdges(flowEdges)
  }, [traceTree, direction, setNodes, setEdges])

  // Search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setMatchingNodes([])
      setCurrentMatchIndex(0)
      // Reset all nodes to normal opacity
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          style: { ...node.style, opacity: 1 }
        }))
      )
      return
    }

    const term = searchTerm.toLowerCase()
    const matches: string[] = []

    nodes.forEach((node) => {
      const data = node.data as LPNodeData
      const lpNumber = data.lp.lp_number?.toLowerCase() || ''
      const productCode = data.product_code?.toLowerCase() || ''
      const batchNumber = data.lp.batch_number?.toLowerCase() || ''

      if (lpNumber.includes(term) || productCode.includes(term) || batchNumber.includes(term)) {
        matches.push(node.id)
      }
    })

    setMatchingNodes(matches)
    setCurrentMatchIndex(0)

    // Update node styles: highlight matches, dim non-matches
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        style: {
          ...node.style,
          opacity: matches.includes(node.id) ? 1 : 0.3,
          boxShadow: matches.includes(node.id) ? '0 0 10px 3px rgba(250, 204, 21, 0.8)' : undefined
        }
      }))
    )

    // Pan to first match
    if (matches.length > 0 && reactFlowInstance) {
      const firstMatch = nodes.find((n) => n.id === matches[0])
      if (firstMatch) {
        reactFlowInstance.setCenter(firstMatch.position.x, firstMatch.position.y, {
          zoom: 1.2,
          duration: 800
        })
      }
    }
  }, [searchTerm, nodes, setNodes, reactFlowInstance])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id)
    },
    [onNodeClick]
  )

  // Navigate to next/previous match
  const navigateMatch = useCallback(
    (direction: 'next' | 'prev') => {
      if (matchingNodes.length === 0) return

      const newIndex =
        direction === 'next'
          ? (currentMatchIndex + 1) % matchingNodes.length
          : (currentMatchIndex - 1 + matchingNodes.length) % matchingNodes.length

      setCurrentMatchIndex(newIndex)

      const targetNode = nodes.find((n) => n.id === matchingNodes[newIndex])
      if (targetNode && reactFlowInstance) {
        reactFlowInstance.setCenter(targetNode.position.x, targetNode.position.y, {
          zoom: 1.2,
          duration: 800
        })
      }
    },
    [matchingNodes, currentMatchIndex, nodes, reactFlowInstance]
  )

  // PNG Export
  const handleExportPNG = useCallback(() => {
    if (!treeRef.current) return

    // Use react-flow's built-in screenshot functionality
    const viewportElement = treeRef.current.querySelector('.react-flow__viewport')
    if (!viewportElement) return

    import('html-to-image').then(({ toPng }) => {
      toPng(viewportElement as HTMLElement, {
        backgroundColor: '#ffffff',
        quality: 1,
        pixelRatio: 2
      })
        .then((dataUrl) => {
          const link = document.createElement('a')
          link.download = `genealogy-tree-${direction}-${new Date().toISOString().split('T')[0]}.png`
          link.href = dataUrl
          link.click()
        })
        .catch((err) => {
          console.error('Export failed:', err)
        })
    })
  }, [direction])

  return (
    <div className="w-full h-[600px] border rounded-lg bg-gray-50" ref={treeRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          style: { strokeWidth: 2, stroke: '#666' }
        }}
      >
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as LPNodeData
            const colorMap = {
              available: '#22c55e',
              consumed: '#3b82f6',
              shipped: '#6b7280',
              quarantine: '#f97316',
              recalled: '#ef4444'
            }
            return colorMap[data.lp.status] || '#d1d5db'
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <Background gap={20} size={1} />

        {/* Info Panel */}
        <Panel position="top-left" className="bg-white p-3 rounded shadow-md text-sm">
          <div className="font-semibold mb-1">
            {direction === 'forward' ? 'Forward Trace' : 'Backward Trace'}
          </div>
          <div className="text-gray-600 text-xs">
            {nodes.length} License Plate{nodes.length !== 1 ? 's' : ''}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Pan: Click & Drag | Zoom: Mouse Wheel
          </div>
        </Panel>

        {/* Search Panel */}
        <Panel position="top-right" className="bg-white p-3 rounded shadow-md">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search LP, Product, Batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-2 py-1 text-sm border rounded w-48"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-gray-500 hover:text-gray-700 text-xs"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {matchingNodes.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-600">
                  {currentMatchIndex + 1} of {matchingNodes.length}
                </span>
                <button
                  onClick={() => navigateMatch('prev')}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  title="Previous match"
                >
                  ←
                </button>
                <button
                  onClick={() => navigateMatch('next')}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  title="Next match"
                >
                  →
                </button>
              </div>
            )}

            <button
              onClick={handleExportPNG}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              title="Export as PNG"
            >
              📷 Export PNG
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

// ========== Transformation Logic ==========

function transformToReactFlow(
  traceTree: TraceNode[],
  direction: 'forward' | 'backward'
): { nodes: Node<LPNodeData>[]; edges: Edge[] } {
  const nodes: Node<LPNodeData>[] = []
  const edges: Edge[] = []
  const nodeMap = new Map<string, { x: number; y: number; depth: number }>()

  // Layout configuration
  const HORIZONTAL_SPACING = 300
  const VERTICAL_SPACING = 150

  // Recursive traversal to build nodes and edges
  function traverse(
    traceNodes: TraceNode[],
    parentId: string | null,
    depth: number,
    xOffset: number
  ): number {
    let currentX = xOffset

    for (const traceNode of traceNodes) {
      const nodeId = traceNode.lp.id

      // Calculate position
      const x = currentX
      const y = direction === 'forward' ? depth * VERTICAL_SPACING : -depth * VERTICAL_SPACING

      // Add node
      nodes.push({
        id: nodeId,
        type: 'lpNode',
        position: { x, y },
        data: {
          lp: traceNode.lp,
          product_code: traceNode.product_code,
          product_name: traceNode.product_name,
          relationship_type: traceNode.relationship_type
        }
      })

      nodeMap.set(nodeId, { x, y, depth })

      // Add edge from parent
      if (parentId) {
        edges.push({
          id: `${parentId}-${nodeId}`,
          source: direction === 'forward' ? parentId : nodeId,
          target: direction === 'forward' ? nodeId : parentId,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20
          },
          label: traceNode.relationship_type || undefined,
          labelStyle: { fontSize: 10, fill: '#666' },
          labelBgStyle: { fill: '#fff', fillOpacity: 0.8 }
        })
      }

      // Traverse children
      if (traceNode.children && traceNode.children.length > 0) {
        const childrenWidth = traverse(
          traceNode.children,
          nodeId,
          depth + 1,
          currentX
        )
        currentX = childrenWidth
      } else {
        currentX += HORIZONTAL_SPACING
      }
    }

    return currentX
  }

  // Start traversal
  traverse(traceTree, null, 0, 0)

  // Center the tree horizontally
  if (nodes.length > 0) {
    const minX = Math.min(...nodes.map((n) => n.position.x))
    const maxX = Math.max(...nodes.map((n) => n.position.x))
    const centerOffset = -(minX + maxX) / 2

    nodes.forEach((node) => {
      node.position.x += centerOffset
    })
  }

  return { nodes, edges }
}

// Wrapper component with ReactFlowProvider
export function GenealogyTree(props: GenealogyTreeProps) {
  return (
    <ReactFlowProvider>
      <GenealogyTreeInner {...props} />
    </ReactFlowProvider>
  )
}
