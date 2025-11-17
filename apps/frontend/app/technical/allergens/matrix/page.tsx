'use client';

import { useState, useEffect, useMemo } from 'react';
import { AllergenMatrix } from '@/components/AllergenMatrix';
import { exportAllergenMatrixToPDF } from '@/lib/utils/allergenPdfExport';
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

// Mock production lines data
const MOCK_PRODUCTION_LINES: ProductionLine[] = [
  {
    id: 1,
    code: 'LINE-A',
    name: 'Line A',
    status: 'active',
    warehouse_id: 1,
    is_active: true,
    created_at: '',
    updated_at: ''
  },
  {
    id: 2,
    code: 'LINE-B',
    name: 'Line B (Gluten-Free)',
    status: 'active',
    warehouse_id: 1,
    is_active: true,
    created_at: '',
    updated_at: ''
  },
  {
    id: 3,
    code: 'LINE-C',
    name: 'Line C',
    status: 'active',
    warehouse_id: 1,
    is_active: true,
    created_at: '',
    updated_at: ''
  },
  {
    id: 4,
    code: 'LINE-D',
    name: 'Line D (Nut-Free)',
    status: 'active',
    warehouse_id: 1,
    is_active: true,
    created_at: '',
    updated_at: ''
  },
];

// Mock products data with allergens
const MOCK_PRODUCTS = [
  // Line A - Mixed products
  { id: 1, name: 'Wheat Bread', line_id: 1, allergens: ['gluten', 'milk'] },
  { id: 2, name: 'Chocolate Cookie', line_id: 1, allergens: ['gluten', 'milk', 'eggs', 'soybeans'] },
  { id: 3, name: 'Peanut Butter Bar', line_id: 1, allergens: ['peanuts', 'gluten', 'milk'] },
  { id: 4, name: 'Almond Croissant', line_id: 1, allergens: ['nuts', 'gluten', 'milk', 'eggs'] },
  { id: 5, name: 'Fish Nuggets', line_id: 1, allergens: ['fish', 'gluten'] },

  // Line B - Gluten-free (but has some violations)
  { id: 6, name: 'Rice Crackers (Gluten-Free)', line_id: 2, allergens: [] },
  { id: 7, name: 'Corn Tortilla (Gluten-Free)', line_id: 2, allergens: [] },
  { id: 8, name: 'Gluten-Free Bread', line_id: 2, allergens: ['milk', 'eggs'] },
  { id: 9, name: 'Potato Chips (Gluten-Free)', line_id: 2, allergens: [] },
  // VIOLATION: Gluten product on gluten-free line
  { id: 10, name: 'Whole Wheat Pasta', line_id: 2, allergens: ['gluten'] },

  // Line C - High allergen load
  { id: 11, name: 'Shrimp Pasta', line_id: 3, allergens: ['crustaceans', 'gluten', 'milk'] },
  { id: 12, name: 'Cheese Pizza', line_id: 3, allergens: ['milk', 'gluten'] },
  { id: 13, name: 'Egg Noodles', line_id: 3, allergens: ['eggs', 'gluten'] },
  { id: 14, name: 'Soy Sauce Mix', line_id: 3, allergens: ['soybeans', 'gluten'] },
  { id: 15, name: 'Sesame Crackers', line_id: 3, allergens: ['sesame', 'gluten'] },
  { id: 16, name: 'Mustard Pretzels', line_id: 3, allergens: ['mustard', 'gluten'] },

  // Line D - Nut-free
  { id: 17, name: 'Sunflower Cookies (Nut-Free)', line_id: 4, allergens: ['gluten', 'milk', 'eggs'] },
  { id: 18, name: 'Oat Bars (Nut-Free)', line_id: 4, allergens: ['gluten'] },
  { id: 19, name: 'Rice Cereal (Nut-Free)', line_id: 4, allergens: [] },

  // More products to increase risk scores
  { id: 20, name: 'Peanut Granola', line_id: 1, allergens: ['peanuts', 'gluten', 'nuts'] },
  { id: 21, name: 'Walnut Brownies', line_id: 1, allergens: ['nuts', 'gluten', 'milk', 'eggs'] },
  { id: 22, name: 'Cashew Bars', line_id: 1, allergens: ['nuts', 'gluten'] },
  { id: 23, name: 'Hazelnut Spread', line_id: 1, allergens: ['nuts', 'milk'] },
  { id: 24, name: 'Mackerel Sausage', line_id: 1, allergens: ['fish'] },
  { id: 25, name: 'Salmon Patties', line_id: 1, allergens: ['fish', 'eggs'] },
];

export default function AllergenMatrixPage() {
  const [loading, setLoading] = useState(false);

  // Calculate risk matrix for PDF export
  const riskMatrix = useMemo(() => {
    const matrix: any[][] = [];

    EU_ALLERGENS.forEach((allergen) => {
      const row: any[] = [];

      MOCK_PRODUCTION_LINES.forEach((line) => {
        const productsWithAllergen = MOCK_PRODUCTS.filter(
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
  }, []);

  // Calculate warnings for PDF export
  const warnings = useMemo(() => {
    const detectedWarnings: string[] = [];

    MOCK_PRODUCTION_LINES.forEach((line) => {
      EU_ALLERGENS.forEach((allergen) => {
        const productsWithAllergen = MOCK_PRODUCTS.filter(
          (p) => p.line_id === line.id && p.allergens.includes(allergen.id)
        );
        const productsWithoutAllergen = MOCK_PRODUCTS.filter(
          (p) =>
            p.line_id === line.id &&
            !p.allergens.includes(allergen.id) &&
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

    return detectedWarnings;
  }, []);

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      await exportAllergenMatrixToPDF({
        productionLines: MOCK_PRODUCTION_LINES,
        products: MOCK_PRODUCTS,
        allergens: EU_ALLERGENS,
        riskMatrix,
        warnings,
        generatedBy: 'Demo User',
        orgName: 'MonoPilot Demo',
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Allergen Matrix Analysis</h1>
        <p className="text-slate-600 mt-2">
          Visual cross-contamination risk assessment across production lines and allergens
        </p>
      </div>

      {/* Instructions */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-bold text-blue-900 mb-2">How to use the Allergen Matrix:</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>
            <strong>Color coding:</strong> Green (safe/low risk), Yellow (medium risk), Red (high risk)
          </li>
          <li>
            <strong>Click any cell</strong> to see detailed product list and cross-contamination warnings
          </li>
          <li>
            <strong>Hover over cells</strong> to see quick tooltip with product count
          </li>
          <li>
            <strong>Risk Score:</strong> (# products with allergen) × (allergen severity weight)
          </li>
          <li>
            <strong>Cross-contamination warnings:</strong> Automatically detected when allergen-free products run on
            same line as allergen-containing products
          </li>
        </ul>
      </div>

      {/* Demo Notice */}
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-yellow-900 mb-1">Demo Data Notice</h3>
            <p className="text-sm text-yellow-800">
              This page is using mock data for demonstration. In production, data will be fetched from the database
              via ProductionLinesAPI and ProductsAPI with real allergen associations.
            </p>
          </div>
        </div>
      </div>

      {/* Allergen Matrix */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading allergen data...</div>
        </div>
      ) : (
        <AllergenMatrix
          productionLines={MOCK_PRODUCTION_LINES}
          products={MOCK_PRODUCTS}
          onExportPDF={handleExportPDF}
        />
      )}
    </div>
  );
}
