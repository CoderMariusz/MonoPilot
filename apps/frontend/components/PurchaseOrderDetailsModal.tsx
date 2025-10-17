'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Check, CheckCircle } from 'lucide-react';
import { usePurchaseOrders, useGRNs, updatePurchaseOrder, closePurchaseOrder } from '@/lib/clientState';
import { PurchaseOrdersAPI } from '@/lib/api';
import { UploadASNModal } from './UploadASNModal';
import type { PurchaseOrder, GRN, PurchaseOrderItem } from '@/lib/types';
import { toast } from '@/lib/toast';

interface PurchaseOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderId: number | null;
}

export function PurchaseOrderDetailsModal({ isOpen, onClose, purchaseOrderId }: PurchaseOrderDetailsModalProps) {
  const allPurchaseOrders = usePurchaseOrders();
  const allGrns = useGRNs();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [grns, setGrns] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isASNModalOpen, setIsASNModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && purchaseOrderId) {
      loadDetails();
    }
  }, [isOpen, purchaseOrderId, allPurchaseOrders, allGrns]);

  const loadDetails = () => {
    if (!purchaseOrderId) return;
    
    setLoading(true);
    setError(null);
    try {
      const po = allPurchaseOrders.find(p => p.id === purchaseOrderId);
      if (!po) {
        throw new Error('Purchase order not found');
      }
      
      const poGrns = allGrns.filter(g => g.po_id === purchaseOrderId);
      
      setPurchaseOrder(po);
      setGrns(poGrns);
    } catch (err: any) {
      setError(err.message || 'Failed to load purchase order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-slate-700 text-white';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const calculateTotal = () => {
    if (!purchaseOrder?.purchase_order_items) return 0;
    return purchaseOrder.purchase_order_items.reduce((sum, item) => {
      return sum + (item.quantity_ordered * item.unit_price);
    }, 0);
  };

  const getQuantityReceived = (productId: number): number => {
    let totalReceived = 0;
    grns.forEach(grn => {
      grn.grn_items?.forEach(grnItem => {
        if (grnItem.product_id === productId) {
          totalReceived += parseFloat(grnItem.quantity_received || '0');
        }
      });
    });
    return totalReceived;
  };

  const handleConfirmToggle = (item: PurchaseOrderItem) => {
    if (!purchaseOrder) return;
    
    const updatedItems = purchaseOrder.purchase_order_items?.map(poi => 
      poi.id === item.id ? { ...poi, confirmed: !poi.confirmed } : poi
    );
    
    const updatedPO = {
      ...purchaseOrder,
      purchase_order_items: updatedItems
    };
    
    updatePurchaseOrder(purchaseOrder.id, {
      purchase_order_items: updatedItems
    });
    
    setPurchaseOrder(updatedPO);
  };

  const handleClosePO = async () => {
    if (!purchaseOrder) return;
    
    setIsClosing(true);
    try {
      const result = closePurchaseOrder(purchaseOrder.id);
      
      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to close purchase order');
    } finally {
      setIsClosing(false);
    }
  };

  const handleCancelPO = async () => {
    if (!purchaseOrder) return;
    
    if (!confirm('Are you sure you want to cancel this purchase order?')) return;
    
    const reason = prompt('Cancellation reason (optional):');
    
    const result = await PurchaseOrdersAPI.cancel(purchaseOrder.id, reason);
    
    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  const handleUploadASN = () => {
    setIsASNModalOpen(true);
  };

  const canClosePO = () => {
    if (!purchaseOrder) return false;
    if (purchaseOrder.status === 'closed' || purchaseOrder.status === 'cancelled') return false;
    if (!purchaseOrder.purchase_order_items || purchaseOrder.purchase_order_items.length === 0) return false;
    
    return purchaseOrder.purchase_order_items.every(item => item.confirmed === true);
  };

  const canCancelPO = () => {
    if (!purchaseOrder) return false;
    if (purchaseOrder.status === 'closed' || purchaseOrder.status === 'cancelled') return false;
    
    // Check if PO has any GRNs
    const hasGRNs = grns.length > 0;
    return !hasGRNs;
  };

  const getConfirmationStatus = () => {
    if (!purchaseOrder?.purchase_order_items) return { confirmed: 0, total: 0 };
    const confirmed = purchaseOrder.purchase_order_items.filter(item => item.confirmed).length;
    const total = purchaseOrder.purchase_order_items.length;
    return { confirmed, total };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Purchase Order Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          </div>
        ) : purchaseOrder ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-slate-600 mb-1">PO Number</div>
                  <div className="text-lg font-semibold text-slate-900">{purchaseOrder.po_number}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Status</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(purchaseOrder.status)}`}>
                    {purchaseOrder.status}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Supplier</div>
                  <div className="text-base font-medium text-slate-900">{purchaseOrder.supplier?.name}</div>
                </div>
                {purchaseOrder.due_date && (
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Due Date</div>
                    <div className="text-base font-medium text-slate-900">
                      {new Date(purchaseOrder.due_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-slate-600 mb-1">Total Items</div>
                  <div className="text-base font-medium text-slate-900">
                    {purchaseOrder.purchase_order_items?.length || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Total Amount</div>
                  <div className="text-base font-medium text-slate-900">
                    ${calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Line Items</h3>
              
              {!purchaseOrder.purchase_order_items || purchaseOrder.purchase_order_items.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No line items found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Product</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Qty Ordered</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Qty Received</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Unit Price</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Confirmed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrder.purchase_order_items.map((item) => {
                        const total = item.quantity_ordered * item.unit_price;
                        const quantityOrdered = item.quantity_ordered;
                        const quantityReceived = getQuantityReceived(item.product_id);
                        const uom = item.product?.uom || '';
                        const isFullyReceived = quantityReceived >= quantityOrdered;
                        
                        return (
                          <tr 
                            key={item.id} 
                            className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                              item.confirmed ? 'bg-green-50' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-sm">
                              <div className="flex items-center gap-2">
                                {item.confirmed && (
                                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                )}
                                <div>
                                  <div className="font-medium text-slate-900">
                                    {item.product?.part_number || '-'}
                                  </div>
                                  <div className="text-slate-600 text-xs">
                                    {item.product?.description || '-'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-slate-700">
                              {quantityOrdered} {uom}
                            </td>
                            <td className="py-3 px-4 text-sm text-right">
                              <div className={`font-medium ${
                                quantityReceived === 0 ? 'text-slate-400' :
                                isFullyReceived ? 'text-green-600' : 'text-amber-600'
                              }`}>
                                {quantityReceived} {uom}
                              </div>
                              {quantityReceived > 0 && (
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {((quantityReceived / quantityOrdered) * 100).toFixed(0)}% received
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-slate-700">
                              ${item.unit_price.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-medium text-slate-900">
                              ${total.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={item.confirmed || false}
                                onChange={() => handleConfirmToggle(item)}
                                className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500 cursor-pointer"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="p-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {purchaseOrder && (
                <div className="text-sm text-slate-600">
                  Items Confirmed: <span className="font-semibold text-slate-900">
                    {getConfirmationStatus().confirmed} / {getConfirmationStatus().total}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              
              {/* Cancel PO Button */}
              {purchaseOrder && canCancelPO() && (
                <button
                  onClick={handleCancelPO}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Cancel PO
                </button>
              )}
              
              {/* Upload ASN Button */}
              {purchaseOrder && purchaseOrder.status !== 'closed' && purchaseOrder.status !== 'cancelled' && (
                <button
                  onClick={handleUploadASN}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Upload ASN
                </button>
              )}
              
              {/* Accept & Close PO Button */}
              {purchaseOrder && purchaseOrder.status !== 'closed' && purchaseOrder.status !== 'cancelled' && (
                <button
                  onClick={handleClosePO}
                  disabled={!canClosePO() || isClosing}
                  className={`
                    px-4 py-2 rounded-md transition-colors flex items-center gap-2
                    ${canClosePO() && !isClosing
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }
                  `}
                >
                  {isClosing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Closing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Accept & Close PO
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <UploadASNModal
        isOpen={isASNModalOpen}
        onClose={() => setIsASNModalOpen(false)}
        poId={purchaseOrder?.id}
        poNumber={purchaseOrder?.po_number}
        supplierId={purchaseOrder?.supplier_id}
      />
    </div>
  );
}
