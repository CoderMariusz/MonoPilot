'use client';

/**
 * WOByProductsTable Component
 * Epic: EPIC-001 BOM Complexity v2 - Phase 1 (By-Products)
 * 
 * Purpose: Display by-products for a Work Order with expected vs actual quantities
 * Use case: Production Manager views by-product output for a WO
 * 
 * Features:
 * - Display all by-products for WO
 * - Show expected vs actual quantities
 * - Variance calculation with color coding
 * - Status indicators (recorded/not recorded)
 * - Button to record output (opens RecordByProductModal)
 * - Link to LP for recorded by-products
 */

import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, Clock, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { WorkOrdersAPI } from '../lib/api/workOrders';
import RecordByProductModal from './RecordByProductModal';
import type { WOByProduct } from '../lib/types';

interface WOByProductsTableProps {
  woId: number;
  woStatus: string;
}

export default function WOByProductsTable({ woId, woStatus }: WOByProductsTableProps) {
  const [byProducts, setByProducts] = useState<WOByProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedByProduct, setSelectedByProduct] = useState<WOByProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadByProducts();
  }, [woId]);

  const loadByProducts = async () => {
    try {
      setIsLoading(true);
      const data = await WorkOrdersAPI.getByProducts(woId);
      setByProducts(data);
    } catch (err) {
      console.error('Error loading by-products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordOutput = (byProduct: WOByProduct) => {
    setSelectedByProduct(byProduct);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedByProduct(null);
  };

  const handleSuccess = () => {
    loadByProducts(); // Refresh data
  };

  const calculateVariance = (byProduct: WOByProduct) => {
    const variance = byProduct.actual_quantity - byProduct.expected_quantity;
    const variancePct =
      byProduct.expected_quantity > 0
        ? (variance / byProduct.expected_quantity) * 100
        : 0;

    return {
      variance,
      variancePct,
      isOver: variance > 0,
      isUnder: variance < 0,
      isOnTarget: Math.abs(variancePct) <= 5, // Within ±5%
    };
  };

  const isRecorded = (byProduct: WOByProduct) => {
    return byProduct.lp_id !== null && byProduct.actual_quantity > 0;
  };

  const canRecord = () => {
    return woStatus === 'in_progress' || woStatus === 'completed';
  };

  if (isLoading) {
    return (
      <div className="border border-slate-300 rounded-lg p-6 bg-white">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (byProducts.length === 0) {
    return (
      <div className="border border-slate-300 rounded-lg p-6 bg-white">
        <div className="text-center py-8 text-slate-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="font-medium">No by-products defined for this Work Order</p>
          <p className="text-sm mt-1">
            This BOM does not produce any secondary outputs (bones, trim, etc.)
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border border-slate-300 rounded-lg bg-white overflow-hidden">
        {/* Header */}
        <div className="bg-slate-100 px-6 py-4 border-b border-slate-300">
          <h3 className="text-lg font-semibold text-slate-900">By-Products Output</h3>
          <p className="text-sm text-slate-600 mt-1">
            Secondary products created during production
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  By-Product
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                  Expected
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                  Actual
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                  Variance
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  License Plate
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {byProducts.map((byProduct) => {
                const recorded = isRecorded(byProduct);
                const variance = recorded ? calculateVariance(byProduct) : null;

                return (
                  <tr
                    key={byProduct.id}
                    className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    {/* Status */}
                    <td className="py-3 px-4">
                      {recorded ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Recorded</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600">
                          <Clock className="w-5 h-5" />
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                      )}
                    </td>

                    {/* By-Product */}
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {byProduct.product?.product_code}
                        </p>
                        <p className="text-sm text-slate-600">
                          {byProduct.product?.description}
                        </p>
                      </div>
                    </td>

                    {/* Expected */}
                    <td className="py-3 px-4 text-right">
                      <p className="font-medium text-slate-900">
                        {byProduct.expected_quantity.toFixed(2)} {byProduct.uom}
                      </p>
                    </td>

                    {/* Actual */}
                    <td className="py-3 px-4 text-right">
                      {recorded ? (
                        <p className="font-medium text-slate-900">
                          {byProduct.actual_quantity.toFixed(2)} {byProduct.uom}
                        </p>
                      ) : (
                        <p className="text-slate-400">—</p>
                      )}
                    </td>

                    {/* Variance */}
                    <td className="py-3 px-4 text-right">
                      {variance ? (
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
                            variance.isOnTarget
                              ? 'bg-green-100 text-green-700'
                              : variance.isOver
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {variance.isOver ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {variance.isOver ? '+' : ''}
                          {variance.variancePct.toFixed(1)}%
                        </div>
                      ) : (
                        <p className="text-slate-400">—</p>
                      )}
                    </td>

                    {/* License Plate */}
                    <td className="py-3 px-4">
                      {byProduct.lp ? (
                        <a
                          href={`/warehouse/license-plates/${byProduct.lp.id}`}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="font-mono text-sm">
                            {byProduct.lp.lp_number}
                          </span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <p className="text-slate-400">Not created</p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      {!recorded && canRecord() && (
                        <button
                          onClick={() => handleRecordOutput(byProduct)}
                          className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm font-medium"
                        >
                          Record Output
                        </button>
                      )}
                      {!canRecord() && !recorded && (
                        <p className="text-sm text-slate-400">WO not started</p>
                      )}
                      {recorded && (
                        <span className="text-sm text-green-600 font-medium">✓ Done</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700">
              <span className="font-semibold">
                {byProducts.filter(isRecorded).length} of {byProducts.length}
              </span>{' '}
              by-products recorded
            </div>
            {byProducts.every(isRecorded) && (
              <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                <CheckCircle className="w-5 h-5" />
                All by-products recorded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Modal */}
      {selectedByProduct && (
        <RecordByProductModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          byProduct={selectedByProduct}
          woId={woId}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

