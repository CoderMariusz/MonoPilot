'use client';

import { useState } from 'react';
import { Loader2, Eye, Edit, Trash2 } from 'lucide-react';
import { useTransferOrders, deleteTransferOrder } from '@/lib/clientState';
import { TransferOrderDetailsModal } from '@/components/TransferOrderDetailsModal';
import { EditTransferOrderModal } from '@/components/EditTransferOrderModal';
import type { TransferOrder } from '@/lib/types';

export function TransferOrdersTable() {
  const transferOrders = useTransferOrders();
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [selectedTOId, setSelectedTOId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleViewDetails = (toId: number) => {
    setSelectedTOId(toId);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (toId: number) => {
    setSelectedTOId(toId);
    setIsEditModalOpen(true);
  };

  const handleDelete = (toId: number) => {
    deleteTransferOrder(toId);
    setDeleteConfirmId(null);
  };

  const handleEditSuccess = () => {
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
        Error loading transfer orders: {error}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">TO Number</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">From Location</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">To Location</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Total Items</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transferOrders.length === 0 ? (
              <tr className="border-b border-slate-100">
                <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">
                  No transfer orders found
                </td>
              </tr>
            ) : (
              transferOrders.map(to => (
                <tr key={to.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm">{to.to_number}</td>
                  <td className="py-3 px-4 text-sm">{to.from_location?.name || '-'}</td>
                  <td className="py-3 px-4 text-sm">{to.to_location?.name || '-'}</td>
                  <td className="py-3 px-4 text-sm">
                    {to.created_at ? new Date(to.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      to.status === 'received' ? 'bg-green-100 text-green-800' :
                      to.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                      to.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      to.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {to.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{to.transfer_order_items?.length || 0}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(to.id)}
                        className="text-slate-600 hover:text-slate-900 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(to.id)}
                        className="text-slate-600 hover:text-slate-900 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {deleteConfirmId === to.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(to.id)}
                            className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-300 rounded"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-slate-600 hover:text-slate-800 text-xs px-2 py-1 border border-slate-300 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(to.id)}
                          className="text-slate-600 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TransferOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        transferOrderId={selectedTOId}
      />
      <EditTransferOrderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        transferOrderId={selectedTOId}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
