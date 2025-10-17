import { supabase } from '@/lib/supabase/client';

// Traceability API utilities for forward and backward traceability

export interface TraceNode {
  id: string;
  type: 'GRN' | 'LP' | 'WO' | 'PO';
  data: GRNNode | LPNode | WONode | PONode;
  children: TraceNode[];
  parent?: TraceNode;
  relationships: TraceRelationship[];
}

export interface GRNNode {
  type: 'GRN';
  id: number;
  grn_number: string;
  po_id: number;
  po_number: string;
  supplier: string;
  received_date: string;
  status: string;
  items: GRNItemNode[];
}

export interface LPNode {
  type: 'LP';
  id: number;
  lp_number: string;
  product_id: number;
  product_description: string;
  quantity: number;
  uom: string;
  location: string;
  qa_status: 'Pending' | 'Passed' | 'Failed' | 'Quarantine';
  stage_suffix: string;
  parent_lp_id?: number;
  parent_lp_number?: string;
  origin_type: 'GRN' | 'WO_OUTPUT' | 'SPLIT';
  origin_ref: any;
  created_at: string;
}

export interface WONode {
  type: 'WO';
  id: number;
  wo_number: string;
  product_id: number;
  product_description: string;
  quantity: number;
  status: string;
  kpi_scope: 'PR' | 'FG';
  actual_start: string;
  actual_end: string;
  line_number: string;
  operations: WOOperationNode[];
}

export interface PONode {
  type: 'PO';
  id: number;
  po_number: string;
  supplier: string;
  status: string;
  due_date: string;
  items: POItemNode[];
}

export interface GRNItemNode {
  id: number;
  product_id: number;
  product_description: string;
  quantity_ordered: number;
  quantity_received: number;
  location: string;
  lp_number: string;
}

export interface WOOperationNode {
  id: number;
  seq_no: number;
  name: string;
  status: string;
  started_at: string;
  finished_at: string;
  operator: string;
}

export interface POItemNode {
  id: number;
  product_id: number;
  product_description: string;
  quantity: number;
  unit_price: number;
  confirmed: boolean;
}

export interface TraceRelationship {
  type: string;
  source_id: string;
  target_id: string;
  metadata: any;
}

export interface TraceTree {
  root: TraceNode;
  children: TraceNode[];
  depth: number;
  path: string[];
  metadata: {
    total_quantity: number;
    qa_status: string;
    trace_completeness: number;
  };
}

export interface ForwardTraceResponse {
  success: boolean;
  data: {
    root: TraceNode;
    tree: TraceTree;
    summary: {
      total_nodes: number;
      trace_completeness: number;
      qa_status: string;
      total_quantity: number;
    };
  };
  error?: string;
}

export interface BackwardTraceResponse {
  success: boolean;
  data: {
    root: TraceNode;
    tree: TraceTree;
    summary: {
      total_nodes: number;
      trace_completeness: number;
      qa_status: string;
      total_quantity: number;
    };
  };
  error?: string;
}

/**
 * Get forward traceability from a license plate number
 * @param lpNumber License plate number to trace from
 * @returns Forward traceability tree
 */
export async function getForwardTrace(lpNumber: string): Promise<ForwardTraceResponse> {
  try {
    const { data, error } = await supabase
      .rpc('vw_trace_forward', { input_lp_number: lpNumber });
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'No traceability data found for the specified license plate'
      };
    }
    
    // Build trace tree from database results
    const tree = buildTraceTree(data, 'forward');
    
    return {
      success: true,
      data: {
        root: tree.root,
        tree: tree,
        summary: {
          total_nodes: data.length,
          trace_completeness: calculateTraceCompleteness(data),
          qa_status: getOverallQAStatus(data),
          total_quantity: calculateTotalQuantity(data)
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get backward traceability from a license plate number
 * @param lpNumber License plate number to trace from
 * @returns Backward traceability tree
 */
export async function getBackwardTrace(lpNumber: string): Promise<BackwardTraceResponse> {
  try {
    const { data, error } = await supabase
      .rpc('vw_trace_backward', { input_lp_number: lpNumber });
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'No traceability data found for the specified license plate'
      };
    }
    
    // Build trace tree from database results
    const tree = buildTraceTree(data, 'backward');
    
    return {
      success: true,
      data: {
        root: tree.root,
        tree: tree,
        summary: {
          total_nodes: data.length,
          trace_completeness: calculateTraceCompleteness(data),
          qa_status: getOverallQAStatus(data),
          total_quantity: calculateTotalQuantity(data)
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get traceability for a work order
 * @param woNumber Work order number to trace
 * @returns Combined forward and backward traceability
 */
export async function getWOTrace(woNumber: string): Promise<{
  success: boolean;
  data?: {
    forward: TraceTree;
    backward: TraceTree;
    combined: TraceTree;
  };
  error?: string;
}> {
  try {
    // Get work order details
    const { data: woData, error: woError } = await supabase
      .from('work_orders')
      .select('*')
      .eq('wo_number', woNumber)
      .single();
    
    if (woError || !woData) {
      throw new Error('Work order not found');
    }
    
    // Get input LPs (WO_ISSUE moves)
    const { data: inputLPs, error: inputError } = await supabase
      .from('stock_moves')
      .select(`
        lp_id,
        license_plates!inner(lp_number)
      `)
      .eq('wo_id', woData.id)
      .eq('move_type', 'WO_ISSUE');
    
    if (inputError) {
      throw inputError;
    }
    
    // Get output LPs (WO_OUTPUT moves)
    const { data: outputLPs, error: outputError } = await supabase
      .from('stock_moves')
      .select(`
        lp_id,
        license_plates!inner(lp_number)
      `)
      .eq('wo_id', woData.id)
      .eq('move_type', 'WO_OUTPUT');
    
    if (outputError) {
      throw outputError;
    }
    
    // Get forward traces for all input LPs
    const forwardTraces = await Promise.all(
      inputLPs.map(lp => getForwardTrace(lp.license_plates.lp_number))
    );
    
    // Get backward traces for all output LPs
    const backwardTraces = await Promise.all(
      outputLPs.map(lp => getBackwardTrace(lp.license_plates.lp_number))
    );
    
    // Combine traces
    const combined = combineTraces(forwardTraces, backwardTraces);
    
    return {
      success: true,
      data: {
        forward: forwardTraces[0]?.data?.tree,
        backward: backwardTraces[0]?.data?.tree,
        combined: combined
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Build trace tree from database results
 */
function buildTraceTree(data: any[], direction: 'forward' | 'backward'): TraceTree {
  const nodes = new Map<string, TraceNode>();
  const rootNodes: TraceNode[] = [];
  
  // Create nodes from data
  data.forEach((row, index) => {
    const node: TraceNode = {
      id: row.node_id,
      type: row.node_type as 'GRN' | 'LP' | 'WO' | 'PO',
      data: {
        type: row.node_type,
        id: parseInt(row.node_id),
        lp_number: row.node_number,
        product_description: row.product_description,
        quantity: parseFloat(row.quantity),
        uom: row.uom,
        qa_status: row.qa_status,
        stage_suffix: row.stage_suffix,
        location: row.location,
        parent_lp_number: row.parent_node,
        created_at: new Date().toISOString()
      } as LPNode,
      children: [],
      relationships: []
    };
    
    nodes.set(row.node_id, node);
    
    // Add to root nodes if depth is 0
    if (row.depth === 0) {
      rootNodes.push(node);
    }
  });
  
  // Build relationships
  data.forEach(row => {
    const node = nodes.get(row.node_id);
    if (node && row.parent_node) {
      const parentNode = nodes.get(row.parent_node);
      if (parentNode) {
        node.parent = parentNode;
        parentNode.children.push(node);
      }
    }
  });
  
  return {
    root: rootNodes[0] || nodes.values().next().value,
    children: rootNodes,
    depth: Math.max(...data.map(row => row.depth)),
    path: data.map(row => row.node_number),
    metadata: {
      total_quantity: data.reduce((sum, row) => sum + parseFloat(row.quantity), 0),
      qa_status: getOverallQAStatus(data),
      trace_completeness: calculateTraceCompleteness(data)
    }
  };
}

/**
 * Calculate trace completeness percentage
 */
function calculateTraceCompleteness(data: any[]): number {
  const totalNodes = data.length;
  const completeNodes = data.filter(row => 
    row.qa_status === 'Passed' && 
    row.quantity > 0
  ).length;
  
  return totalNodes > 0 ? Math.round((completeNodes / totalNodes) * 100) : 0;
}

/**
 * Get overall QA status from trace data
 */
function getOverallQAStatus(data: any[]): string {
  const statuses = data.map(row => row.qa_status);
  
  if (statuses.includes('Failed')) return 'Failed';
  if (statuses.includes('Quarantine')) return 'Quarantine';
  if (statuses.includes('Pending')) return 'Pending';
  if (statuses.every(status => status === 'Passed')) return 'Passed';
  
  return 'Mixed';
}

/**
 * Calculate total quantity in trace
 */
function calculateTotalQuantity(data: any[]): number {
  return data.reduce((sum, row) => sum + parseFloat(row.quantity || 0), 0);
}

/**
 * Combine forward and backward traces
 */
function combineTraces(forwardTraces: ForwardTraceResponse[], backwardTraces: BackwardTraceResponse[]): TraceTree {
  // Implementation for combining traces
  // This would merge the forward and backward trace trees
  return {
    root: forwardTraces[0]?.data?.tree?.root || backwardTraces[0]?.data?.tree?.root,
    children: [],
    depth: 0,
    path: [],
    metadata: {
      total_quantity: 0,
      qa_status: 'Unknown',
      trace_completeness: 0
    }
  };
}

/**
 * Export traceability data to various formats
 */
export async function exportTraceData(
  traceData: TraceTree,
  format: 'json' | 'csv' | 'xlsx' = 'json'
): Promise<Blob> {
  switch (format) {
    case 'json':
      return new Blob([JSON.stringify(traceData, null, 2)], { type: 'application/json' });
    case 'csv':
      return new Blob([convertToCSV(traceData)], { type: 'text/csv' });
    case 'xlsx':
      // Would need xlsx library for Excel export
      throw new Error('Excel export not implemented yet');
    default:
      throw new Error('Unsupported export format');
  }
}

/**
 * Convert trace data to CSV format
 */
function convertToCSV(traceData: TraceTree): string {
  const headers = [
    'Node ID',
    'Node Type',
    'Node Number',
    'Product Description',
    'Quantity',
    'UOM',
    'QA Status',
    'Stage Suffix',
    'Location',
    'Parent Node'
  ];
  
  const rows = [headers.join(',')];
  
  // Flatten tree structure for CSV
  function flattenNode(node: TraceNode, depth: number = 0): void {
    const row = [
      node.id,
      node.type,
      (node.data as LPNode).lp_number || '',
      (node.data as LPNode).product_description || '',
      (node.data as LPNode).quantity || 0,
      (node.data as LPNode).uom || '',
      (node.data as LPNode).qa_status || '',
      (node.data as LPNode).stage_suffix || '',
      (node.data as LPNode).location || '',
      (node.data as LPNode).parent_lp_number || ''
    ];
    
    rows.push(row.join(','));
    
    node.children.forEach(child => flattenNode(child, depth + 1));
  }
  
  flattenNode(traceData.root);
  
  return rows.join('\n');
}
