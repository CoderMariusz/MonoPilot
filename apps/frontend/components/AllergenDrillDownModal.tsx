'use client';

import { useMemo } from 'react';

interface Product {
  id: number;
  name: string;
  line_id: number;
  allergens: string[];
}

interface AllergenDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineId: number;
  lineName: string;
  allergen: string;
  allergenName: string;
  products: Product[];
}

export function AllergenDrillDownModal({
  isOpen,
  onClose,
  lineId,
  lineName,
  allergen,
  allergenName,
  products,
}: AllergenDrillDownModalProps) {
  // Check if there are allergen-free products on same line
  const allergenFreeProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.line_id === lineId &&
        !p.allergens.includes(allergen) &&
        p.name.toLowerCase().includes(`${allergenName.toLowerCase()}-free`)
    );
  }, [products, lineId, allergen, allergenName]);

  const hasCrossContaminationRisk = allergenFreeProducts.length > 0;

  // Mitigation suggestions
  const mitigationSuggestions = useMemo(() => {
    const suggestions: string[] = [];

    if (hasCrossContaminationRisk) {
      suggestions.push(
        `Run ${allergenName}-free products FIRST, then ${allergenName}-containing products to minimize cross-contamination`
      );
      suggestions.push(
        `Perform thorough line cleaning (CIP/COP) between ${allergenName}-containing and ${allergenName}-free production runs`
      );
      suggestions.push(
        `Consider dedicating a separate production line exclusively for ${allergenName}-free products`
      );
      suggestions.push(
        `Implement allergen swab testing after cleaning to verify ${allergenName} removal before ${allergenName}-free runs`
      );
    } else {
      suggestions.push(
        `No ${allergenName}-free products on this line - cross-contamination risk is minimized`
      );
      suggestions.push(
        `Continue monitoring product mix to prevent future scheduling conflicts`
      );
    }

    return suggestions;
  }, [hasCrossContaminationRisk, allergenName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {allergenName} on {lineName}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {products.length} product{products.length !== 1 ? 's' : ''} contain {allergenName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Cross-Contamination Warning */}
          {hasCrossContaminationRisk && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-900 mb-1">
                    Cross-Contamination Risk Detected!
                  </h3>
                  <p className="text-sm text-red-800">
                    This line runs {allergenFreeProducts.length} {allergenName}-free product
                    {allergenFreeProducts.length !== 1 ? 's' : ''} AND {products.length} {allergenName}
                    -containing product{products.length !== 1 ? 's' : ''}. Risk of allergen cross-contamination!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Products with Allergen */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Products Containing {allergenName} ({products.length})
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                      All Allergens
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {product.name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {product.allergens.map((allergenId) => (
                              <span
                                key={allergenId}
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                                  allergenId === allergen
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {allergenId}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              // TODO: Navigate to product details
                              console.log('Navigate to product:', product.id);
                            }}
                            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            View Product
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Allergen-Free Products (if any) */}
          {allergenFreeProducts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                {allergenName}-Free Products on Same Line ({allergenFreeProducts.length})
              </h3>
              <div className="border border-yellow-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-yellow-50 border-b border-yellow-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-yellow-900 uppercase">
                        Product Name
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-yellow-900 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-200 bg-yellow-50">
                    {allergenFreeProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-yellow-100">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              // TODO: Navigate to product details
                              console.log('Navigate to product:', product.id);
                            }}
                            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            View Product
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mitigation Suggestions */}
          <div className={`border rounded-lg p-4 ${
            hasCrossContaminationRisk
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-green-50 border-green-200'
          }`}>
            <h3 className={`text-sm font-bold mb-3 ${
              hasCrossContaminationRisk ? 'text-yellow-900' : 'text-green-900'
            }`}>
              {hasCrossContaminationRisk ? 'Risk Mitigation Recommendations' : 'Best Practices'}
            </h3>
            <ul className={`space-y-2 text-sm ${
              hasCrossContaminationRisk ? 'text-yellow-800' : 'text-green-800'
            }`}>
              {mitigationSuggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                // TODO: Navigate to WO scheduling
                console.log('Navigate to WO scheduling for line:', lineId);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Schedule Work Order
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
