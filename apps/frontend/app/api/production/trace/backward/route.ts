import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lp = searchParams.get('lp');

    if (!lp) {
      return NextResponse.json(
        { success: false, error: 'License plate number is required' },
        { status: 400 }
      );
    }

    // Call the backward trace function
    const { data: traceData, error } = await supabase
      .rpc('vw_trace_backward', { input_lp_number: lp });

    if (error) {
      throw error;
    }

    if (!traceData || traceData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No traceability data found for the specified license plate'
      });
    }

    // Build trace tree structure
    const nodes = new Map();
    const rootNodes = [];

    traceData.forEach((row, index) => {
      const node = {
        id: row.node_id,
        type: row.node_type,
        number: row.node_number,
        product_description: row.product_description,
        quantity: parseFloat(row.quantity),
        uom: row.uom,
        qa_status: row.qa_status,
        stage_suffix: row.stage_suffix,
        location: row.location,
        parent_node: row.parent_node,
        depth: row.depth,
        path: row.path
      };

      nodes.set(row.node_id, node);

      if (row.depth === 0) {
        rootNodes.push(node);
      }
    });

    // Build relationships
    traceData.forEach(row => {
      const node = nodes.get(row.node_id);
      if (node && row.parent_node) {
        const parentNode = nodes.get(row.parent_node);
        if (parentNode) {
          node.parent = parentNode;
          parentNode.children = parentNode.children || [];
          parentNode.children.push(node);
        }
      }
    });

    // Calculate summary metrics
    const totalQuantity = traceData.reduce((sum, row) => sum + parseFloat(row.quantity || 0), 0);
    const qaStatuses = traceData.map(row => row.qa_status);
    const overallQAStatus = qaStatuses.includes('Failed') ? 'Failed' :
                           qaStatuses.includes('Quarantine') ? 'Quarantine' :
                           qaStatuses.includes('Pending') ? 'Pending' :
                           qaStatuses.every(status => status === 'Passed') ? 'Passed' : 'Mixed';

    const traceCompleteness = traceData.filter(row => 
      row.qa_status === 'Passed' && parseFloat(row.quantity) > 0
    ).length / traceData.length * 100;

    return NextResponse.json({
      success: true,
      data: {
        root: rootNodes[0] || nodes.values().next().value,
        tree: {
          root: rootNodes[0] || nodes.values().next().value,
          children: rootNodes,
          depth: Math.max(...traceData.map(row => row.depth)),
          path: traceData.map(row => row.node_number),
          metadata: {
            total_quantity: totalQuantity,
            qa_status: overallQAStatus,
            trace_completeness: Math.round(traceCompleteness)
          }
        },
        summary: {
          total_nodes: traceData.length,
          trace_completeness: Math.round(traceCompleteness),
          qa_status: overallQAStatus,
          total_quantity: totalQuantity
        }
      }
    });

  } catch (error) {
    console.error('Error fetching backward trace:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch backward trace' 
      },
      { status: 500 }
    );
  }
}
