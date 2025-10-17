'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Package, Users, Calendar, Search } from 'lucide-react';

interface TraceLPModalProps {
  isOpen: boolean;
  onClose: () => void;
  lpId: number;
  lpNumber: string;
}

interface TraceItem {
  level: number;
  lp_id: number;
  lp_number: string;
  quantity: number;
  uom: string;
  operation_id: number | null;
  created_at: string;
}

interface LPDetails {
  id: number;
  lp_number: string;
  product_id: number;
  quantity: number;
  qa_status: string;
  stage_suffix?: string;
  origin_type: string;
  origin_ref: any;
  product: {
    part_number: string;
    description: string;
    uom: string;
  };
}

export function TraceLPModal({ isOpen, onClose, lpId, lpNumber }: TraceLPModalProps) {
  const [lpDetails, setLpDetails] = useState<LPDetails | null>(null);
  const [forwardTrace, setForwardTrace] = useState<TraceItem[]>([]);
  const [backwardTrace, setBackwardTrace] = useState<TraceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'forward' | 'backward'>('backward');

  useEffect(() => {
    if (isOpen && lpId) {
      fetchTraceData();
    }
  }, [isOpen, lpId]);

  const fetchTraceData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch LP details
      const detailsResponse = await fetch(`/api/scanner/lp/${lpId}`);
      if (!detailsResponse.ok) {
        throw new Error('Failed to fetch LP details');
      }
      const detailsData = await detailsResponse.json();
      setLpDetails(detailsData.lp);

      // Fetch backward trace
      const backwardResponse = await fetch(`/api/scanner/lp/${lpId}?direction=backward`);
      if (backwardResponse.ok) {
        const backwardData = await backwardResponse.json();
        setBackwardTrace(backwardData.trace || []);
      }

      // Fetch forward trace
      const forwardResponse = await fetch(`/api/scanner/lp/${lpId}?direction=forward`);
      if (forwardResponse.ok) {
        const forwardData = await forwardResponse.json();
        setForwardTrace(forwardData.trace || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (qaStatus: string) => {
    switch (qaStatus) {
      case 'Passed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Quarantine':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOriginTypeColor = (originType: string) => {
    switch (originType) {
      case 'WO_OUTPUT':
        return 'bg-blue-100 text-blue-800';
      case 'WO_ISSUE':
        return 'bg-purple-100 text-purple-800';
      case 'SPLIT':
        return 'bg-amber-100 text-amber-800';
      case 'GRN_IN':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                LP Trace Analysis
              </h2>
              <p className="text-sm text-slate-600">
                {lpNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <X className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* LP Details */}
            {lpDetails && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">LP Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-600">LP Number</div>
                    <div className="font-medium">{lpDetails.lp_number}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Product</div>
                    <div className="font-medium">
                      {lpDetails.product.part_number} - {lpDetails.product.description}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Quantity</div>
                    <div className="font-medium">
                      {lpDetails.quantity} {lpDetails.product.uom}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">QA Status</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(lpDetails.qa_status)}`}>
                      {lpDetails.qa_status}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Origin Type</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOriginTypeColor(lpDetails.origin_type)}`}>
                      {lpDetails.origin_type}
                    </span>
                  </div>
                  {lpDetails.stage_suffix && (
                    <div>
                      <div className="text-sm text-slate-600">Stage Suffix</div>
                      <div className="font-medium">{lpDetails.stage_suffix}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trace Tabs */}
            <div>
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('backward')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'backward'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Backward Trace ({backwardTrace.length})
                </button>
                <button
                  onClick={() => setActiveTab('forward')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'forward'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ArrowRight className="w-4 h-4" />
                  Forward Trace ({forwardTrace.length})
                </button>
              </div>

              {/* Trace Content */}
              <div className="mt-4">
                {activeTab === 'backward' ? (
                  <div className="space-y-3">
                    {backwardTrace.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>No backward trace data available</p>
                      </div>
                    ) : (
                      backwardTrace.map((item, index) => (
                        <div
                          key={`${item.lp_id}-${index}`}
                          className="border border-slate-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: item.level }).map((_, i) => (
                                    <div key={i} className="w-4 h-0.5 bg-slate-300"></div>
                                  ))}
                                  <ArrowRight className="w-4 h-4 text-slate-400" />
                                </div>
                                <span className="font-medium text-slate-900">
                                  {item.lp_number}
                                </span>
                                <span className="text-sm text-slate-600">
                                  ({item.quantity} {item.uom})
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(item.created_at)}
                                </span>
                                {item.operation_id && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    Op #{item.operation_id}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-slate-500">
                              Level {item.level}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {forwardTrace.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>No forward trace data available</p>
                      </div>
                    ) : (
                      forwardTrace.map((item, index) => (
                        <div
                          key={`${item.lp_id}-${index}`}
                          className="border border-slate-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: item.level }).map((_, i) => (
                                    <div key={i} className="w-4 h-0.5 bg-slate-300"></div>
                                  ))}
                                  <ArrowRight className="w-4 h-4 text-slate-400" />
                                </div>
                                <span className="font-medium text-slate-900">
                                  {item.lp_number}
                                </span>
                                <span className="text-sm text-slate-600">
                                  ({item.quantity} {item.uom})
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(item.created_at)}
                                </span>
                                {item.operation_id && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    Op #{item.operation_id}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-slate-500">
                              Level {item.level}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
