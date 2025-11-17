'use client';

import { useState, useMemo } from 'react';
import { AllergenDrillDownModal } from './AllergenDrillDownModal';
import type { ProductionLine } from '@/lib/types';

// 14 EU Allergens (Regulation 1169/2011)
const EU_ALLERGENS = [
  { id: 'gluten', name: 'Gluten', severity: 1 },
  { id: 'crustaceans', name: 'Crustaceans', severity: 2 },
  { id: 'eggs', name: 'Eggs', severity: 2 },
  { id: 'fish', name: 'Fish', severity: 2 },
  { id: 'peanuts', name: 'Peanuts', severity: 3 },
  { id: 'soybeans', name: 'Soybeans', severity: 1 },
  { id: 'milk', name: 'Milk (Lactose)', severity: 2 },
  { id: 'nuts', name: 'Nuts', severity: 3 },
  { id: 'celery', name: 'Celery', severity: 1 },
  { id: 'mustard', name: 'Mustard', severity: 1 },
  { id: 'sesame', name: 'Sesame', severity: 2 },
  { id: 'sulphites', name: 'Sulphur dioxide/sulphites', severity: 1 },
  { id: 'lupin', name: 'Lupin', severity: 2 },
  { id: 'molluscs', name: 'Molluscs', severity: 2 },
];

// Extended ProductionLine type with allergen_rules (for Task 5)
interface ProductionLineWithAllergenRules extends ProductionLine {
  allergen_rules?: string[]; // List of allergens this line is restricted to (e.g., ['gluten-free'])
}

interface Product {
  id: number;
  name: string;
  line_id: number;
  allergens: string[]; // e.g., ['gluten', 'milk']
}

interface AllergenMatrixProps {
  productionLines: ProductionLineWithAllergenRules[];
  products: Product[];
  onCellClick?: (lineId: number, allergen: string, products: Product[]) => void;
  onExportPDF?: () => void;
}

interface RiskCell {
  lineId: number;
  allergen: string;
  productCount: number;
  riskScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high';
  products: Product[];
}

export function AllergenMatrix({
  productionLines,
  products,
  onCellClick,
  onExportPDF,
}: AllergenMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{ lineId: number; allergen: string } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [drillDownModal, setDrillDownModal] = useState<{
    lineId: number;
    lineName: string;
    allergen: string;
    allergenName: string;
    products: Product[];
  } | null>(null);

  // Calculate risk matrix
  const riskMatrix = useMemo((): RiskCell[][] => {
    const matrix: RiskCell[][] = [];

    EU_ALLERGENS.forEach((allergen) => {
      const row: RiskCell[] = [];

      productionLines.forEach((line) => {
        const productsWithAllergen = products.filter(
          (p) => p.line_id === line.id && p.allergens.includes(allergen.id)
        );

        const productCount = productsWithAllergen.length;
        const riskScore = productCount * allergen.severity;

        let riskLevel: 'safe' | 'low' | 'medium' | 'high' = 'safe';
        if (riskScore === 0) {
          riskLevel = 'safe';
        } else if (riskScore <= 5) {
          riskLevel = 'low';
        } else if (riskScore <= 15) {
          riskLevel = 'medium';
        } else {
          riskLevel = 'high';
        }

        row.push({
          lineId: line.id,
          allergen: allergen.id,
          productCount,
          riskScore,
          riskLevel,
          products: productsWithAllergen,
        });
      });

      matrix.push(row);
    });

    return matrix;
  }, [productionLines, products]);

  // Detect cross-contamination warnings
  useMemo(() => {
    const detectedWarnings: string[] = [];

    productionLines.forEach((line) => {
      EU_ALLERGENS.forEach((allergen) => {
        const productsWithAllergen = products.filter(
          (p) => p.line_id === line.id && p.allergens.includes(allergen.id)
        );
        const productsWithoutAllergen = products.filter(
          (p) =>
            p.line_id === line.id &&
            !p.allergens.includes(allergen.id) &&
            // Check if product is explicitly allergen-free (name contains "free")
            p.name.toLowerCase().includes(`${allergen.name.toLowerCase()}-free`)
        );

        if (productsWithAllergen.length > 0 && productsWithoutAllergen.length > 0) {
          detectedWarnings.push(
            `Line ${line.name}: Runs both ${allergen.name}-containing (${productsWithAllergen.length} products) ` +
              `and ${allergen.name}-free products (${productsWithoutAllergen.length}). Risk of cross-contamination!`
          );
        }
      });
    });

    setWarnings(detectedWarnings);
  }, [productionLines, products]);

  const getRiskColor = (level: 'safe' | 'low' | 'medium' | 'high'): string => {
    switch (level) {
      case 'safe':
        return 'bg-green-100 hover:bg-green-200 border-green-300';
      case 'low':
        return 'bg-green-200 hover:bg-green-300 border-green-400';
      case 'medium':
        return 'bg-yellow-200 hover:bg-yellow-300 border-yellow-400';
      case 'high':
        return 'bg-red-200 hover:bg-red-300 border-red-400';
      default:
        return 'bg-gray-100 hover:bg-gray-200 border-gray-300';
    }
  };

  const getRiskTextColor = (level: 'safe' | 'low' | 'medium' | 'high'): string => {
    switch (level) {
      case 'safe':
      case 'low':
        return 'text-green-900';
      case 'medium':
        return 'text-yellow-900';
      case 'high':
        return 'text-red-900';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Allergen Cross-Contamination Matrix</h2>
          <p className="text-sm text-slate-600 mt-1">
            Risk assessment across {productionLines.length} production lines and 14 EU allergens
          </p>
        </div>
        {onExportPDF && (
          <button
            onClick={onExportPDF}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Export to PDF
          </button>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
              <h3 className="text-sm font-bold text-red-900 mb-2">
                Cross-Contamination Warnings ({warnings.length})
              </h3>
              <ul className="space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm text-red-800">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Risk Levels</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-slate-700">Safe (0 products)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 border border-green-400 rounded"></div>
            <span className="text-sm text-slate-700">Low (Risk 1-5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
            <span className="text-sm text-slate-700">Medium (Risk 6-15)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
            <span className="text-sm text-slate-700">High (Risk 16+)</span>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-2">
          Risk Score = (# products with allergen) × (allergen severity weight)
        </p>
      </div>

      {/* Matrix Heatmap */}
      <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 sticky left-0 bg-slate-100 z-10">
                Allergen
              </th>
              {productionLines.map((line) => (
                <th
                  key={line.id}
                  className="px-4 py-3 text-center text-xs font-bold text-slate-700 min-w-[120px]"
                >
                  <div>{line.name}</div>
                  {line.allergen_rules && line.allergen_rules.length > 0 && (
                    <div className="text-[10px] font-normal text-blue-600 mt-1">
                      {line.allergen_rules.join(', ')}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {riskMatrix.map((row, rowIdx) => (
              <tr key={EU_ALLERGENS[rowIdx].id} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900 sticky left-0 bg-white z-10">
                  {EU_ALLERGENS[rowIdx].name}
                  <span className="ml-2 text-xs text-slate-500">(severity: {EU_ALLERGENS[rowIdx].severity})</span>
                </td>
                {row.map((cell) => {
                  const isHovered =
                    hoveredCell?.lineId === cell.lineId && hoveredCell?.allergen === cell.allergen;

                  return (
                    <td
                      key={`${cell.lineId}-${cell.allergen}`}
                      className="p-1 relative"
                      onMouseEnter={() => setHoveredCell({ lineId: cell.lineId, allergen: cell.allergen })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <button
                        onClick={() => {
                          const line = productionLines.find((l) => l.id === cell.lineId);
                          const allergenData = EU_ALLERGENS.find((a) => a.id === cell.allergen);

                          if (line && allergenData) {
                            setDrillDownModal({
                              lineId: cell.lineId,
                              lineName: line.name,
                              allergen: cell.allergen,
                              allergenName: allergenData.name,
                              products: cell.products,
                            });
                          }

                          onCellClick?.(cell.lineId, cell.allergen, cell.products);
                        }}
                        className={`w-full h-full px-3 py-4 border-2 rounded transition-all ${getRiskColor(
                          cell.riskLevel
                        )} ${getRiskTextColor(cell.riskLevel)}`}
                      >
                        <div className="text-lg font-bold">{cell.productCount}</div>
                        <div className="text-[10px] uppercase opacity-75">
                          {cell.riskLevel === 'safe' ? 'Safe' : `Risk: ${cell.riskScore}`}
                        </div>
                      </button>

                      {/* Tooltip */}
                      {isHovered && cell.productCount > 0 && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-20">
                          <div className="bg-slate-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg">
                            <div className="font-bold mb-1">
                              {productionLines.find((l) => l.id === cell.lineId)?.name}
                            </div>
                            <div>
                              {cell.productCount} product{cell.productCount !== 1 ? 's' : ''} contain{' '}
                              {EU_ALLERGENS[rowIdx].name}
                            </div>
                            <div className="text-yellow-300 mt-1">Click to view details</div>
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                              <div className="border-4 border-transparent border-t-slate-900"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-slate-900">
            {riskMatrix.flat().filter((c) => c.riskLevel === 'high').length}
          </div>
          <div className="text-sm text-red-600">High Risk Cells</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-slate-900">
            {riskMatrix.flat().filter((c) => c.riskLevel === 'medium').length}
          </div>
          <div className="text-sm text-yellow-600">Medium Risk Cells</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-slate-900">{warnings.length}</div>
          <div className="text-sm text-red-600">Cross-Contamination Warnings</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-slate-900">{products.length}</div>
          <div className="text-sm text-slate-600">Total Products Analyzed</div>
        </div>
      </div>

      {/* Drill-Down Modal */}
      {drillDownModal && (
        <AllergenDrillDownModal
          isOpen={!!drillDownModal}
          onClose={() => setDrillDownModal(null)}
          lineId={drillDownModal.lineId}
          lineName={drillDownModal.lineName}
          allergen={drillDownModal.allergen}
          allergenName={drillDownModal.allergenName}
          products={drillDownModal.products}
        />
      )}
    </div>
  );
}
