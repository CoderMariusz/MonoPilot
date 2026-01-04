/**
 * LP Genealogy Types
 * Story 05.2: LP Genealogy Tracking
 */

export type OperationType = 'consume' | 'output' | 'split' | 'merge'
export type GenealogyDirection = 'forward' | 'backward' | 'both'

export interface GenealogyNode {
  lpId: string
  lpNumber: string
  productName: string
  operationType: OperationType
  quantity: number
  operationDate: string
  depth: number
  status: string
  location: string
  batchNumber: string | null
  woId?: string | null
  woNumber?: string | null
  outputLps?: GenealogyOutputLP[]
  reservedFor?: {
    type: string
    id: string
    number: string
  } | null
}

export interface GenealogyOutputLP {
  lpId: string
  lpNumber: string
  productName: string
  quantity: number
  status: string
  location: string
}

export interface GenealogyTree {
  lpId: string
  lpNumber: string
  hasGenealogy: boolean
  ancestors: GenealogyNode[]
  descendants: GenealogyNode[]
  summary: {
    originalQuantity: number
    splitOutTotal: number
    currentQuantity: number
    childCount: number
    parentCount: number
    depth: {
      forward: number
      backward: number
    }
    totalOperations: number
    operationBreakdown: {
      split: number
      consume: number
      output: number
      merge: number
    }
  }
  hasMoreLevels: {
    ancestors: boolean
    descendants: boolean
  }
}

export interface GenealogyQueryParams {
  direction?: GenealogyDirection
  maxDepth?: number
  includeReversed?: boolean
}

export interface TreeNodeState {
  [nodeId: string]: boolean // expanded state
}
