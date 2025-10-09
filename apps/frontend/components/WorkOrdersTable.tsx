'use client';

import { useState, useEffect } from 'react';
import { Loader2, Eye } from 'lucide-react';
import { mockWorkOrders } from '@/lib/mockData';
import { WorkOrderDetailsModal } from '@/components/WorkOrderDetailsModal';
import type { WorkOrder } from '@/lib/types';

export function WorkOrdersTable() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    setWorkOrders(mockWorkOrders);
    setLoading(false);
  }, []);

  const handleViewDetails = (workOrderId: number) => {
    setSelectedWorkOrderId(workOrderId);
    setIsDetailsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 px-6 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
        Error loading work orders: {error}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">WO Number</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Product</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Quantity</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Due Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Material Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.length === 0 ? (
              <tr className="border-b border-slate-100">
                <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">
                  No work orders found
                </td>
              </tr>
            ) : (
              workOrders.map(wo => (
                <tr key={wo.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm">{wo.wo_number}</td>
                  <td className="py-3 px-4 text-sm">{wo.product?.description || '-'}</td>
                  <td className="py-3 px-4 text-sm">{wo.quantity}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      wo.status === 'completed' ? 'bg-green-100 text-green-800' :
                      wo.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      wo.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {wo.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {wo.due_date ? new Date(wo.due_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <button
                      onClick={() => handleViewDetails(wo.id)}
                      className="text-slate-600 hover:text-slate-900 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <WorkOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        workOrderId={selectedWorkOrderId}
      />
    </>
  );
}
