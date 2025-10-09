'use client';

import { useState } from 'react';
import { Loader2, Eye, Edit, Trash2 } from 'lucide-react';
import { usePurchaseOrders, deletePurchaseOrder } from '@/lib/clientState';
import { PurchaseOrderDetailsModal } from '@/components/PurchaseOrderDetailsModal';
import { EditPurchaseOrderModal } from '@/components/EditPurchaseOrderModal';
import type { PurchaseOrder } from '@/lib/types';

export function PurchaseOrdersTable() {
  const purchaseOrders = usePurchaseOrders();
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [selectedPOId, setSelectedPOId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleViewDetails = (poId: number) => {
    setSelectedPOId(poId);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (poId: number) => {
    setSelectedPOId(poId);
    setIsEditModalOpen(true);
  };

  const handleDelete = (poId: number) => {
    deletePurchaseOrder(poId);
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
        Error loading purchase orders: {error}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">PO Number</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Supplier</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Total Items</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.length === 0 ? (
              <tr className="border-b border-slate-100">
                <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                  No purchase orders found
                </td>
              </tr>
            ) : (
              purchaseOrders.map(po => (
                <tr key={po.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm">{po.po_number}</td>
                  <td className="py-3 px-4 text-sm">{po.supplier}</td>
                  <td className="py-3 px-4 text-sm">
                    {po.due_date ? new Date(po.due_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      po.status === 'received' ? 'bg-green-100 text-green-800' :
                      po.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      po.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      po.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{po.purchase_order_items?.length || 0}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(po.id)}
                        className="text-slate-600 hover:text-slate-900 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(po.id)}
                        className="text-slate-600 hover:text-slate-900 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {deleteConfirmId === po.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(po.id)}
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
                          onClick={() => setDeleteConfirmId(po.id)}
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
      <PurchaseOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        purchaseOrderId={selectedPOId}
      />
      <EditPurchaseOrderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        purchaseOrderId={selectedPOId}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
