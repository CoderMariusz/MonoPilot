'use client';

/**
 * BOMByProductsSection Component
 * Epic: EPIC-001 BOM Complexity v2 - Phase 1 (By-Products)
 * 
 * Purpose: Add/edit by-products in BOM (Bill of Materials)
 * Use case: Product Manager defines expected by-products (e.g., bones, trim) for a production recipe
 * 
 * Features:
 * - Display list of by-products in BOM
 * - Add new by-product with yield percentage
 * - Edit existing by-product
 * - Remove by-product
 * - Validation: yield_percentage must be 0.01-100.00
 */

import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import type { BomItemInput } from '../lib/types';

interface BOMByProductsSectionProps {
  byProducts: BomItemInput[];
  onByProductsChange: (byProducts: BomItemInput[]) => void;
  availableProducts: Array<{
    id: number;
    product_code: string;
    description: string;
    product_type: string;
  }>;
  disabled?: boolean;
}

export default function BOMByProductsSection({
  byProducts,
  onByProductsChange,
  availableProducts,
  disabled = false,
}: BOMByProductsSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [errors, setErrors] = useState<Record<number, string>>({});

  // Filter products to show only by-products or raw materials
  const byProductsList = availableProducts.filter(
    (p) => p.product_type === 'BY-PRODUCT' || p.product_type === 'RM_MEAT'
  );

  const handleAddByProduct = () => {
    const newByProduct: BomItemInput = {
      material_id: null,
      quantity: 0, // Not used for by-products
      uom: 'kg',
      is_by_product: true,
      yield_percentage: null,
      sequence: byProducts.length + 1,
    };

    onByProductsChange([...byProducts, newByProduct]);
    setShowAddForm(true);
  };

  const handleRemoveByProduct = (index: number) => {
    const updated = byProducts.filter((_, i) => i !== index);
    onByProductsChange(updated);

    // Remove error for this index
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const handleUpdateByProduct = (index: number, field: keyof BomItemInput, value: any) => {
    const updated = [...byProducts];
    updated[index] = { ...updated[index], [field]: value };

    // Validation for yield_percentage
    if (field === 'yield_percentage') {
      const yieldPct = parseFloat(value);
      if (isNaN(yieldPct) || yieldPct <= 0 || yieldPct > 100) {
        setErrors({
          ...errors,
          [index]: 'Yield percentage must be between 0.01 and 100.00',
        });
      } else {
        const newErrors = { ...errors };
        delete newErrors[index];
        setErrors(newErrors);
      }
    }

    onByProductsChange(updated);
  };

  const getProductName = (productId: number | null) => {
    if (!productId) return 'Select by-product';
    const product = availableProducts.find((p) => p.id === productId);
    return product ? `${product.product_code} - ${product.description}` : 'Unknown';
  };

  const getTotalYield = () => {
    return byProducts.reduce((sum, bp) => {
      const yieldPct = bp.yield_percentage || 0;
      return sum + yieldPct;
    }, 0);
  };

  const totalYield = getTotalYield();
  const yieldWarning = totalYield > 50; // Warning if total by-product yield > 50%

  return (
    <div className="border border-slate-300 rounded-lg p-4 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">By-Products</h3>
          <p className="text-sm text-slate-600 mt-1">
            Define secondary outputs from this production (e.g., bones, trim, fat)
          </p>
        </div>
        <button
          onClick={handleAddByProduct}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add By-Product
        </button>
      </div>

      {/* Total Yield Info */}
      {byProducts.length > 0 && (
        <div
          className={`flex items-center gap-2 p-3 rounded-md mb-4 ${
            yieldWarning
              ? 'bg-amber-50 border border-amber-300'
              : 'bg-blue-50 border border-blue-300'
          }`}
        >
          <AlertCircle
            className={`w-5 h-5 ${yieldWarning ? 'text-amber-600' : 'text-blue-600'}`}
          />
          <div className="text-sm">
            <span className="font-semibold">Total By-Product Yield: {totalYield.toFixed(2)}%</span>
            {yieldWarning && (
              <span className="text-amber-700 ml-2">
                (Warning: High by-product yield may indicate incorrect BOM)
              </span>
            )}
          </div>
        </div>
      )}

      {/* By-Products List */}
      {byProducts.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>No by-products defined.</p>
          <p className="text-sm mt-1">
            Click "Add By-Product" to define secondary outputs for this BOM.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {byProducts.map((byProduct, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded-md p-4 hover:border-slate-400 transition-colors"
            >
              <div className="grid grid-cols-12 gap-4 items-start">
                {/* Product Selection */}
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    By-Product
                  </label>
                  <select
                    value={byProduct.material_id || ''}
                    onChange={(e) =>
                      handleUpdateByProduct(
                        index,
                        'material_id',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select by-product</option>
                    {byProductsList.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.product_code} - {product.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Yield Percentage */}
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Yield %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    value={byProduct.yield_percentage || ''}
                    onChange={(e) =>
                      handleUpdateByProduct(index, 'yield_percentage', e.target.value)
                    }
                    disabled={disabled}
                    placeholder="e.g., 15.00"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed ${
                      errors[index] ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {errors[index] && (
                    <p className="text-xs text-red-600 mt-1">{errors[index]}</p>
                  )}
                </div>

                {/* UOM */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    UOM
                  </label>
                  <select
                    value={byProduct.uom}
                    onChange={(e) => handleUpdateByProduct(index, 'uom', e.target.value)}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="pcs">pcs</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                  </select>
                </div>

                {/* Delete Button */}
                <div className="col-span-2 flex items-end">
                  <button
                    onClick={() => handleRemoveByProduct(index)}
                    disabled={disabled}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    title="Remove by-product"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>

              {/* Calculated Expected Quantity (for 100 units of main output) */}
              {byProduct.yield_percentage && (
                <div className="mt-2 text-sm text-slate-600">
                  <span className="font-medium">Example:</span> For 100 kg main output →{' '}
                  {((100 * byProduct.yield_percentage) / 100).toFixed(2)} {byProduct.uom} of{' '}
                  {getProductName(byProduct.material_id)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md">
        <p className="text-sm text-slate-700">
          <strong>ℹ️ How it works:</strong> By-products are secondary outputs created during
          production. For example, when producing ribeye steaks from primal cuts, you may get
          15% bones and 10% fat trim. Define the expected yield percentage here, and the system
          will automatically track these outputs during production.
        </p>
      </div>
    </div>
  );
}

