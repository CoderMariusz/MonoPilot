'use client';

import { useState, useEffect, useMemo } from 'react';
import { ProductsAPI } from '@/lib/api/products';
import { AllergensAPI } from '@/lib/api/allergens';
import type { Product, Allergen, ProductType } from '@/lib/types';

type GroupTab = 'raw-materials' | 'finished-products' | 'settings';

type ColumnKey = 'sku' | 'name' | 'type' | 'uom' | 'allergens' | 'status';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  visible: boolean;
}

export default function TechnicalPage() {
  const [activeTab, setActiveTab] = useState<GroupTab>('raw-materials');
  const [products, setProducts] = useState<Product[]>([]);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [productsData, allergensData] = await Promise.all([
        ProductsAPI.getAll(),
        AllergensAPI.getAll(),
      ]);
      setProducts(productsData);
      setAllergens(allergensData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // Filter products by group
  const rawMaterialsTypes: ProductType[] = ['RM_MEAT', 'DG_WEB', 'DG_LABEL', 'DG_BOX', 'DG_ING', 'DG_SAUCE'];
  const finishedProductsTypes: ProductType[] = ['FG', 'PR'];

  const rawMaterials = products.filter(p => rawMaterialsTypes.includes(p.product_type));
  const finishedProducts = products.filter(p => finishedProductsTypes.includes(p.product_type));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Technical</h1>
        <p className="text-sm text-slate-600 mt-1">
          Product Catalog, BOMs, Routings, and Allergen Management
        </p>
      </div>

      {/* 3-Group Horizontal Tabs */}
      <div className="mb-6">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('raw-materials')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${
                  activeTab === 'raw-materials'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              Raw Materials
              <span className="ml-2 py-0.5 px-2 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                {rawMaterials.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('finished-products')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${
                  activeTab === 'finished-products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              Finished Products
              <span className="ml-2 py-0.5 px-2 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                {finishedProducts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              Settings
              <span className="ml-2 py-0.5 px-2 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                {allergens.length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading...</div>
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'raw-materials' && (
            <SmartProductsTable
              products={rawMaterials}
              title="Raw Materials"
              description="Meat, Dry Goods, Ingredients, and Packaging Materials"
            />
          )}
          {activeTab === 'finished-products' && (
            <SmartProductsTable
              products={finishedProducts}
              title="Finished Products"
              description="Finished Goods and Process Intermediates"
            />
          )}
          {activeTab === 'settings' && (
            <SettingsGroup allergens={allergens} />
          )}
        </>
      )}
    </div>
  );
}

// Smart Products Table with Filters, Search, and Column Visibility
function SmartProductsTable({
  products,
  title,
  description,
}: {
  products: Product[];
  title: string;
  description: string;
}) {
  // Column visibility state
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: 'sku', label: 'SKU', visible: true },
    { key: 'name', label: 'Name', visible: true },
    { key: 'type', label: 'Type', visible: true },
    { key: 'uom', label: 'UoM', visible: true },
    { key: 'allergens', label: 'Allergens', visible: true },
    { key: 'status', label: 'Status', visible: true },
  ]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [allergensFilter, setAllergensFilter] = useState<'all' | 'with-allergens' | 'no-allergens'>('all');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Selected products for bulk actions
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [showColumnToggle, setShowColumnToggle] = useState(false);

  // View mode state (table or card)
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Toggle column visibility
  const toggleColumn = (key: ColumnKey) => {
    setColumns(prev =>
      prev.map(col => (col.key === key ? { ...col, visible: !col.visible } : col))
    );
  };

  // Filter and search products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter (fuzzy search)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          product.part_number.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Active/Inactive filter (for now, all products are considered active)
      if (activeFilter === 'active') {
        // Assuming all products are active for now
      } else if (activeFilter === 'inactive') {
        return false; // No inactive products in current implementation
      }

      // Allergens filter
      if (allergensFilter === 'with-allergens') {
        if (!product.allergens || product.allergens.length === 0) return false;
      } else if (allergensFilter === 'no-allergens') {
        if (product.allergens && product.allergens.length > 0) return false;
      }

      // Low stock filter (placeholder - would need actual stock data)
      if (lowStockFilter) {
        // For now, this filter doesn't exclude anything since we don't have stock data
      }

      return true;
    });
  }, [products, searchQuery, activeFilter, allergensFilter, lowStockFilter]);

  // Toggle product selection
  const toggleProduct = (id: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  // Select/deselect all products
  const toggleAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  // Bulk actions
  const handleMarkInactive = () => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product');
      return;
    }
    alert(`Marking ${selectedProducts.size} products as inactive (not implemented)`);
  };

  const handleExportExcel = () => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product');
      return;
    }
    alert(`Exporting ${selectedProducts.size} products to Excel (not implemented)`);
  };

  const handlePrintLabels = () => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product');
      return;
    }
    alert(`Printing labels for ${selectedProducts.size} products (not implemented)`);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      {/* Toolbar: Search, Filters, Column Toggle, Bulk Actions */}
      <div className="mb-4 space-y-3">
        {/* Search and View Toggle */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by SKU, name, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* View Mode Toggle */}
          <div className="flex border border-slate-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'table'
                  ? 'bg-blue-50 text-blue-700 border-r border-blue-200'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-r border-slate-300'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'card'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Cards
            </button>
          </div>
          {viewMode === 'table' && (
            <div className="relative">
              <button
                onClick={() => setShowColumnToggle(!showColumnToggle)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Columns
              </button>
            {showColumnToggle && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-10">
                <div className="p-2">
                  {columns.map(col => (
                    <label key={col.key} className="flex items-center px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleColumn(col.key)}
                        className="mr-2"
                      />
                      <span className="text-sm text-slate-700">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            </div>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex gap-3 items-center flex-wrap">
          <span className="text-sm font-medium text-slate-700">Filters:</span>

          {/* Active/Inactive */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Allergens */}
          <select
            value={allergensFilter}
            onChange={(e) => setAllergensFilter(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm"
          >
            <option value="all">All Allergens</option>
            <option value="with-allergens">Has Allergens</option>
            <option value="no-allergens">No Allergens</option>
          </select>

          {/* Low Stock */}
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="mr-2"
            />
            Low Stock (&lt;100)
          </label>

          <span className="ml-auto text-sm text-slate-600">
            {filteredProducts.length} of {products.length} products
          </span>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.size > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium text-slate-700">{selectedProducts.size} selected:</span>
            <button
              onClick={handleMarkInactive}
              className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md text-sm font-medium hover:bg-yellow-100"
            >
              Mark as Inactive
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm font-medium hover:bg-green-100"
            >
              Export to Excel
            </button>
            <button
              onClick={handlePrintLabels}
              className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100"
            >
              Print Labels
            </button>
          </div>
        )}
      </div>

      {/* Table or Card View */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-slate-500">
            {searchQuery || activeFilter !== 'all' || allergensFilter !== 'all' || lowStockFilter
              ? 'No products match your filters'
              : 'No products found in this category'}
          </p>
        </div>
      ) : viewMode === 'card' ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isSelected={selectedProducts.has(product.id)}
              onToggleSelect={() => toggleProduct(product.id)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                </th>
                {columns.find(c => c.key === 'sku')?.visible && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    SKU
                  </th>
                )}
                {columns.find(c => c.key === 'name')?.visible && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                )}
                {columns.find(c => c.key === 'type')?.visible && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                )}
                {columns.find(c => c.key === 'uom')?.visible && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    UoM
                  </th>
                )}
                {columns.find(c => c.key === 'allergens')?.visible && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Allergens
                  </th>
                )}
                {columns.find(c => c.key === 'status')?.visible && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className={`hover:bg-slate-50 ${selectedProducts.has(product.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      className="cursor-pointer"
                    />
                  </td>
                  {columns.find(c => c.key === 'sku')?.visible && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {product.part_number}
                    </td>
                  )}
                  {columns.find(c => c.key === 'name')?.visible && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {product.description}
                    </td>
                  )}
                  {columns.find(c => c.key === 'type')?.visible && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.product_type}
                      </span>
                    </td>
                  )}
                  {columns.find(c => c.key === 'uom')?.visible && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {product.uom}
                    </td>
                  )}
                  {columns.find(c => c.key === 'allergens')?.visible && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {product.allergens && product.allergens.length > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          {product.allergens.length} allergen{product.allergens.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                  )}
                  {columns.find(c => c.key === 'status')?.visible && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Product Card Component
function ProductCard({
  product,
  isSelected,
  onToggleSelect,
}: {
  product: Product;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
      }`}
    >
      {/* Header with checkbox */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="mr-3 cursor-pointer"
          />
          <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 text-xs">
            IMG
          </div>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      </div>

      {/* Product Info */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">{product.part_number}</h3>
        <p className="text-sm text-slate-600 mb-2">{product.description}</p>
        <div className="flex gap-2 flex-wrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {product.product_type}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
            {product.uom}
          </span>
          {product.allergens && product.allergens.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              {product.allergens.length} allergen{product.allergens.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Stock Level (placeholder) */}
      <div className="mb-3 pb-3 border-b border-slate-200">
        <div className="text-xs text-slate-500 mb-1">Stock Level</div>
        <div className="text-sm font-medium text-slate-900">—</div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100">
          Edit
        </button>
        <button className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100">
          View BOMs
        </button>
        <button className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100">
          Routings
        </button>
        <button className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100">
          Duplicate
        </button>
      </div>
    </div>
  );
}

// Settings Group Component (Allergens, Tax Codes, Suppliers)
function SettingsGroup({ allergens }: { allergens: Allergen[] }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-600">Allergens, Tax Codes, and Suppliers</p>
      </div>

      {/* Allergens Table */}
      <div className="mb-8">
        <h3 className="text-md font-medium text-slate-800 mb-3">Allergens (EU Regulation 1169/2011)</h3>
        {allergens.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-500">No allergens configured</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {allergens.map((allergen) => (
                  <tr key={allergen.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {allergen.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {allergen.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {allergen.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Placeholder for Tax Codes and Suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
          <h3 className="text-md font-medium text-slate-800 mb-2">Tax Codes</h3>
          <p className="text-sm text-slate-600">Coming soon...</p>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
          <h3 className="text-md font-medium text-slate-800 mb-2">Suppliers</h3>
          <p className="text-sm text-slate-600">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
