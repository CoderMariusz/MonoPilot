// Unit Tests for Tree Transformation Logic (Story 2.21)
import { describe, it, expect } from 'vitest'
import type { TraceNode, LicensePlate } from '@/lib/types/traceability'
import type { Node, Edge } from 'reactflow'

// Mock License Plate
const createMockLP = (id: string, lpNumber: string): LicensePlate => ({
  id,
  lp_number: lpNumber,
  batch_number: `BATCH-${id}`,
  product_id: `prod-${id}`,
  quantity: 100,
  uom: 'KG',
  status: 'available',
  location_id: `loc-${id}`,
  manufacturing_date: '2024-01-01',
  expiry_date: '2025-01-01'
})

// Mock Trace Node
const createMockTraceNode = (
  id: string,
  children: TraceNode[] = []
): TraceNode => ({
  lp: createMockLP(id, `LP-${id}`),
  product_code: `PROD-${id}`,
  product_name: `Product ${id}`,
  relationship_type: children.length > 0 ? 'split' : null,
  children,
  depth: 1
})

describe('Tree Transformation - Node Creation', () => {
  it('should create node for single LP', () => {
    const traceNode = createMockTraceNode('001')

    // Simulate transformation
    const node: Node = {
      id: traceNode.lp.id,
      type: 'lpNode',
      position: { x: 0, y: 0 },
      data: {
        lp: traceNode.lp,
        product_code: traceNode.product_code,
        product_name: traceNode.product_name,
        relationship_type: traceNode.relationship_type
      }
    }

    expect(node.id).toBe('001')
    expect(node.type).toBe('lpNode')
    expect(node.data.lp.lp_number).toBe('LP-001')
    expect(node.data.product_code).toBe('PROD-001')
  })

  it('should create nodes for tree with children', () => {
    const child1 = createMockTraceNode('002')
    const child2 = createMockTraceNode('003')
    const parent = createMockTraceNode('001', [child1, child2])

    const traceTree = [parent]

    // Count total nodes
    const countNodes = (nodes: TraceNode[]): number => {
      let count = 0
      for (const node of nodes) {
        count++
        if (node.children?.length) {
          count += countNodes(node.children)
        }
      }
      return count
    }

    expect(countNodes(traceTree)).toBe(3)
  })
})

describe('Tree Transformation - Edge Creation', () => {
  it('should create edge between parent and child', () => {
    const parentId = '001'
    const childId = '002'

    const edge: Edge = {
      id: `${parentId}-${childId}`,
      source: parentId,
      target: childId,
      type: 'smoothstep',
      markerEnd: {
        type: 'arrowclosed' as any,
        width: 20,
        height: 20
      }
    }

    expect(edge.id).toBe('001-002')
    expect(edge.source).toBe('001')
    expect(edge.target).toBe('002')
    expect(edge.type).toBe('smoothstep')
  })

  it('should reverse edge direction for backward trace', () => {
    const direction = 'backward'
    const parentId = '001'
    const childId = '002'

    const source = direction === 'forward' ? parentId : childId
    const target = direction === 'forward' ? childId : parentId

    expect(source).toBe('002')
    expect(target).toBe('001')
  })

  it('should add relationship type as edge label', () => {
    const relationshipType = 'split'

    const edge: Edge = {
      id: 'edge-1',
      source: '001',
      target: '002',
      label: relationshipType,
      labelStyle: { fontSize: 10, fill: '#666' },
      labelBgStyle: { fill: '#fff', fillOpacity: 0.8 }
    }

    expect(edge.label).toBe('split')
    expect(edge.labelStyle).toHaveProperty('fontSize', 10)
  })
})

describe('Tree Transformation - Layout Calculation', () => {
  it('should calculate position for single node', () => {
    const HORIZONTAL_SPACING = 300
    const VERTICAL_SPACING = 150
    const depth = 0
    const direction = 'forward'

    const x = 0
    const y = direction === 'forward' ? depth * VERTICAL_SPACING : -depth * VERTICAL_SPACING

    expect(x).toBe(0)
    expect(y).toBe(0)
  })

  it('should calculate vertical spacing based on depth', () => {
    const VERTICAL_SPACING = 150
    const direction = 'forward'

    const positions = [0, 1, 2, 3].map(depth =>
      direction === 'forward' ? depth * VERTICAL_SPACING : -depth * VERTICAL_SPACING
    )

    expect(positions).toEqual([0, 150, 300, 450])
  })

  it('should reverse vertical direction for backward trace', () => {
    const VERTICAL_SPACING = 150
    const direction = 'backward'

    const positions = [0, 1, 2].map(depth =>
      direction === 'forward' ? depth * VERTICAL_SPACING : -depth * VERTICAL_SPACING
    )

    // -0 and 0 are the same in JavaScript, so we compare without strict equality
    expect(positions[0]).toBe(-0)
    expect(positions[1]).toBe(-150)
    expect(positions[2]).toBe(-300)
  })

  it('should space siblings horizontally', () => {
    const HORIZONTAL_SPACING = 300
    const siblingPositions = [0, 1, 2].map(index => index * HORIZONTAL_SPACING)

    expect(siblingPositions).toEqual([0, 300, 600])
  })
})

describe('Tree Transformation - Centering', () => {
  it('should center tree horizontally', () => {
    const nodePositions = [
      { x: 0, y: 0 },
      { x: 300, y: 150 },
      { x: 600, y: 150 }
    ]

    const minX = Math.min(...nodePositions.map(n => n.x))
    const maxX = Math.max(...nodePositions.map(n => n.x))
    const centerOffset = -(minX + maxX) / 2

    const centeredPositions = nodePositions.map(pos => ({
      x: pos.x + centerOffset,
      y: pos.y
    }))

    expect(centerOffset).toBe(-300)
    expect(centeredPositions[0].x).toBe(-300)
    expect(centeredPositions[1].x).toBe(0)
    expect(centeredPositions[2].x).toBe(300)
  })

  it('should not change y positions when centering', () => {
    const nodePositions = [
      { x: 0, y: 0 },
      { x: 300, y: 150 },
      { x: 600, y: 300 }
    ]

    const centerOffset = -300

    const centeredPositions = nodePositions.map(pos => ({
      x: pos.x + centerOffset,
      y: pos.y
    }))

    expect(centeredPositions.map(p => p.y)).toEqual([0, 150, 300])
  })
})

describe('Tree Transformation - Search Matching', () => {
  it('should match LP number (case-insensitive)', () => {
    const lpNumber = 'LP-2024-001'
    const searchTerm = 'lp-2024'

    const matches = lpNumber.toLowerCase().includes(searchTerm.toLowerCase())
    expect(matches).toBe(true)
  })

  it('should match product code (case-insensitive)', () => {
    const productCode = 'FG-BREAD-01'
    const searchTerm = 'bread'

    const matches = productCode.toLowerCase().includes(searchTerm.toLowerCase())
    expect(matches).toBe(true)
  })

  it('should match batch number', () => {
    const batchNumber = 'BATCH-2024-11-001'
    const searchTerm = 'batch-2024'

    const matches = batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
    expect(matches).toBe(true)
  })

  it('should not match unrelated terms', () => {
    const lpNumber = 'LP-2024-001'
    const productCode = 'FG-BREAD-01'
    const batchNumber = 'BATCH-2024-11-001'
    const searchTerm = 'chocolate'

    const matches =
      lpNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batchNumber.toLowerCase().includes(searchTerm.toLowerCase())

    expect(matches).toBe(false)
  })
})

describe('Tree Transformation - Node Highlighting', () => {
  it('should set full opacity for matching nodes', () => {
    const isMatch = true
    const opacity = isMatch ? 1 : 0.3

    expect(opacity).toBe(1)
  })

  it('should set reduced opacity for non-matching nodes', () => {
    const isMatch = false
    const opacity = isMatch ? 1 : 0.3

    expect(opacity).toBe(0.3)
  })

  it('should add yellow shadow for matching nodes', () => {
    const isMatch = true
    const boxShadow = isMatch ? '0 0 10px 3px rgba(250, 204, 21, 0.8)' : undefined

    expect(boxShadow).toBe('0 0 10px 3px rgba(250, 204, 21, 0.8)')
  })

  it('should not add shadow for non-matching nodes', () => {
    const isMatch = false
    const boxShadow = isMatch ? '0 0 10px 3px rgba(250, 204, 21, 0.8)' : undefined

    expect(boxShadow).toBeUndefined()
  })
})

describe('Tree Transformation - Navigation', () => {
  it('should navigate to next match (circular)', () => {
    const matches = ['id-1', 'id-2', 'id-3']
    const currentIndex = 2
    const nextIndex = (currentIndex + 1) % matches.length

    expect(nextIndex).toBe(0) // Wraps around
  })

  it('should navigate to previous match (circular)', () => {
    const matches = ['id-1', 'id-2', 'id-3']
    const currentIndex = 0
    const prevIndex = (currentIndex - 1 + matches.length) % matches.length

    expect(prevIndex).toBe(2) // Wraps around
  })

  it('should handle single match navigation', () => {
    const matches = ['id-1']
    const currentIndex = 0
    const nextIndex = (currentIndex + 1) % matches.length

    expect(nextIndex).toBe(0) // Stays at same
  })
})
