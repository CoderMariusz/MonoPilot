'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search, Download, ArrowRight, Package, Factory, Truck, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { getForwardTrace, getBackwardTrace } from '@/lib/api/traceability';

interface TraceNode {
  id: string;
  type: 'GRN' | 'LP' | 'WO' | 'PO' | 'PALLET';
  data: {
    lp_number?: string;
    wo_number?: string;
    po_number?: string;
    product_description?: string;
    description?: string;
    quantity?: number;
    uom?: string;
    qa_status?: string;
    stage_suffix?: string;
    location?: string;
    parent_lp_number?: string;
  };
  children: TraceNode[];
  parent?: TraceNode;
  relationships: any[];
}

interface TraceTree {
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

export function TraceTab() {
  const [lpNumber, setLpNumber] = useState('');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [traceData, setTraceData] = useState<TraceTree | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!lpNumber.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const result = direction === 'forward' 
        ? await getForwardTrace(lpNumber)
        : await getBackwardTrace(lpNumber);

      if (result.success && result.data) {
        setTraceData(result.data.tree);
        setExpandedNodes(new Set([result.data.tree.root.id]));
      } else {
        setError(result.error || 'No traceability data found');
        setTraceData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load traceability data');
      setTraceData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!traceData) return;

    try {
      const params = new URLSearchParams({
        lp: lpNumber,
        direction
      });

      const response = await fetch(`/api/exports/trace.xlsx?${params}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Traceability_${direction}_${lpNumber}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'LP':
        return <Package className="w-4 h-4" />;
      case 'WO':
        return <Factory className="w-4 h-4" />;
      case 'GRN':
      case 'PO':
        return <Truck className="w-4 h-4" />;
      case 'PALLET':
        return <Package className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getQAStatusIcon = (qaStatus: string) => {
    switch (qaStatus) {
      case 'Passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Pending':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getQAStatusColor = (qaStatus: string) => {
    switch (qaStatus) {
      case 'Passed':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderNode = (node: TraceNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const indent = depth * 24;

    return (
      <div key={node.id} className="border-l-2 border-slate-200 ml-4">
        <div 
          className="flex items-center py-2 px-3 hover:bg-slate-50 cursor-pointer"
          style={{ marginLeft: `${indent}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          <div className="flex items-center gap-3 flex-1">
            {hasChildren && (
              <button className="p-1 hover:bg-slate-200 rounded">
                <ArrowRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
            )}
            {!hasChildren && <div className="w-5" />}
            
            <div className="flex items-center gap-2">
              {getNodeIcon(node.type)}
              <span className="font-medium text-slate-900">
                {node.data.lp_number || node.data.wo_number || node.data.po_number || 'Unknown'}
              </span>
            </div>

            <div className="flex-1">
              <div className="text-sm text-slate-600">
                {node.data.product_description || node.data.description || 'No description'}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{node.data.quantity?.toFixed(2)} {node.data.uom}</span>
                {node.data.stage_suffix && (
                  <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                    {node.data.stage_suffix}
                  </span>
                )}
                {node.data.location && (
                  <span>📍 {node.data.location}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {node.data.qa_status && (
                <div className="flex items-center gap-1">
                  {getQAStatusIcon(node.data.qa_status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQAStatusColor(node.data.qa_status)}`}>
                    {node.data.qa_status}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-4">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">License Plate Number</label>
            <input
              type="text"
              value={lpNumber}
              onChange={(e) => setLpNumber(e.target.value)}
              placeholder="Enter LP number to trace"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'forward' | 'backward')}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="forward">Forward (What was created)</option>
              <option value="backward">Backward (What was used)</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              disabled={loading || !lpNumber.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
            {traceData && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Trace Results */}
      {traceData && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Trace Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-slate-600">Total Nodes</div>
                <div className="text-2xl font-bold text-slate-900">{traceData.depth + 1}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Total Quantity</div>
                <div className="text-2xl font-bold text-slate-900">{traceData.metadata.total_quantity.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">QA Status</div>
                <div className="text-2xl font-bold text-slate-900">{traceData.metadata.qa_status}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Completeness</div>
                <div className="text-2xl font-bold text-slate-900">{traceData.metadata.trace_completeness}%</div>
              </div>
            </div>
          </div>

          {/* Trace Tree */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {direction === 'forward' ? 'Forward' : 'Backward'} Traceability Tree
              </h3>
            </div>
            <div className="p-4">
              {renderNode(traceData.root)}
            </div>
          </div>
        </div>
      )}

      {!traceData && !loading && !error && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Traceability Data</h3>
          <p className="text-slate-600">Enter a license plate number to start tracing.</p>
        </div>
      )}
    </div>
  );
}

