'use client';

import { useState, useEffect, useMemo } from 'react';
import { Package, Beef, ShoppingBag, FlaskConical, Plus, Loader2, Trash2, Pencil, Search } from 'lucide-react';
import type { Product, ProductGroup, ProductType } from '@/lib/types';
import { ProductsAPI } from '@/lib/api/products';
import { BomsAPI } from '@/lib/api/boms';
import { supabase } from '@/lib/supabase/client-browser';
import SingleProductModal from '@/components/SingleProductModal';
import CompositeProductModal from '@/components/CompositeProductModal';

type CategoryType = 'MEAT' | 'DRYGOODS' | 'FINISHED_GOODS' | 'PROCESS' | 'ARCHIVE';

interface TabConfig {
  id: CategoryType;
  label: string;
  icon: any;
  group: ProductGroup;
  productTypes: ProductType[];
}

interface ProductsResponse {
  data: Product[];
  current_page: number;
  last_page: number;
  total: number;
}

interface BomCatalogClientProps {
  initialData: {
    meat: ProductsResponse;
    dryGoods: ProductsResponse;
    finishedGoods: ProductsResponse;
    process: ProductsResponse;
  };
}

export default function BomCatalogClient({ initialData }: BomCatalogClientProps) {
  const [activeTab, setActiveTab] = useState<CategoryType>('MEAT');
  const [isSingleOpen, setIsSingleOpen] = useState(false);
  const [isCompositeOpen, setIsCompositeOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const tabs: TabConfig[] = [
    { id: 'MEAT', label: 'Meat', icon: Beef, group: 'MEAT', productTypes: ['RM_MEAT'] },
    { id: 'DRYGOODS', label: 'Dry Goods', icon: ShoppingBag, group: 'DRYGOODS', productTypes: ['DG_WEB', 'DG_LABEL', 'DG_BOX', 'DG_ING', 'DG_SAUCE'] },
    { id: 'FINISHED_GOODS', label: 'Finished Goods', icon: Package, group: 'COMPOSITE', productTypes: ['FG'] },
    { id: 'PROCESS', label: 'Process', icon: FlaskConical, group: 'COMPOSITE', productTypes: ['PR'] },
    { id: 'ARCHIVE', label: 'Archive', icon: Package, group: 'COMPOSITE', productTypes: [] },
  ];

  const handleModalSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleClose = () => {
    setIsSingleOpen(false);
    setIsCompositeOpen(false);
    setEditingProduct(undefined);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    if (product.product_group === 'COMPOSITE') {
      setIsCompositeOpen(true);
    } else {
      setIsSingleOpen(true);
    }
  };

  const getInitialDataForCategory = (category: CategoryType): ProductsResponse => {
    switch (category) {
      case 'MEAT':
        return initialData.meat;
      case 'DRYGOODS':
        return initialData.dryGoods;
      case 'FINISHED_GOODS':
        return initialData.finishedGoods;
      case 'PROCESS':
        return initialData.process;
      case 'ARCHIVE':
        return { data: [], current_page: 1, last_page: 1, total: 0 };
      default:
        return { data: [], current_page: 1, last_page: 1, total: 0 };
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">BOM & Items Catalog</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSingleOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Single
          </button>
          <button 
            onClick={() => setIsCompositeOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Composite
          </button>
        </div>
      </div>
      
      <SingleProductModal 
        isOpen={isSingleOpen} 
        onClose={handleClose} 
        onSuccess={handleModalSuccess}
        product={editingProduct}
      />
      <CompositeProductModal 
        isOpen={isCompositeOpen} 
        onClose={handleClose} 
        onSuccess={handleModalSuccess}
        product={editingProduct}
      />
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex space-x-1 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-base font-medium transition-colors
                    ${isActive 
                      ? 'bg-slate-900 text-white' 
                      : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="p-6">
          <ProductsTable 
            category={activeTab} 
            initialData={getInitialDataForCategory(activeTab)}
            refreshTrigger={refreshTrigger}
            onEditProduct={handleEditProduct}
          />
        </div>
      </div>
    </div>
  );
}

function ProductsTable({ 
  category, 
  initialData,
  refreshTrigger,
  onEditProduct
}: { 
  category: CategoryType; 
  initialData: ProductsResponse;
  refreshTrigger: number;
  onEditProduct: (product: Product) => void;
}) {
  const [localProducts, setLocalProducts] = useState<Product[]>(initialData.data || []);
  const [loading, setLoading] = useState(false);

  // Hard refresh list when refreshTrigger changes (after create)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await ProductsAPI.getAll();
        setLocalProducts(data || []);
      } catch (e) {
        console.warn('Failed to refresh products after create', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshTrigger]);
  
  // Get the tab configuration for filtering
  const tabs: TabConfig[] = [
    { id: 'MEAT', label: 'Meat', icon: Beef, group: 'MEAT', productTypes: ['RM_MEAT'] },
    { id: 'DRYGOODS', label: 'Dry Goods', icon: ShoppingBag, group: 'DRYGOODS', productTypes: ['DG_WEB', 'DG_LABEL', 'DG_BOX', 'DG_ING', 'DG_SAUCE'] },
    { id: 'FINISHED_GOODS', label: 'Finished Goods', icon: Package, group: 'COMPOSITE', productTypes: ['FG'] },
    { id: 'PROCESS', label: 'Process', icon: FlaskConical, group: 'COMPOSITE', productTypes: ['PR'] },
    { id: 'ARCHIVE', label: 'Archive', icon: Package, group: 'COMPOSITE', productTypes: [] },
  ];
  
  const currentTab = tabs.find(tab => tab.id === category);
  const products = (localProducts || []).filter(p => {
    if (!currentTab) return false;
    
    // For MEAT: product_group === 'MEAT' AND is_active === true
    if (category === 'MEAT') {
      return p.product_group === 'MEAT' && p.is_active === true;
    }
    
    // For DRYGOODS: product_group === 'DRYGOODS' AND is_active === true
    if (category === 'DRYGOODS') {
      return p.product_group === 'DRYGOODS' && p.is_active === true;
    }
    
    // For FINISHED_GOODS: product_group === 'COMPOSITE' AND product_type === 'FG' AND BOM not archived
    if (category === 'FINISHED_GOODS') {
      return p.product_group === 'COMPOSITE' && p.product_type === 'FG' && p.activeBom?.status !== 'archived';
    }
    
    // For PROCESS: product_group === 'COMPOSITE' AND product_type === 'PR' AND BOM not archived
    if (category === 'PROCESS') {
      return p.product_group === 'COMPOSITE' && p.product_type === 'PR' && p.activeBom?.status !== 'archived';
    }
    
    // For ARCHIVE: 
    // - MEAT/DRYGOODS with is_active = false
    // - COMPOSITE (FG/PR) with activeBom.status = 'archived'
    if (category === 'ARCHIVE') {
      if (p.product_group === 'MEAT' || p.product_group === 'DRYGOODS') {
        return p.is_active === false;
      }
      if (p.product_group === 'COMPOSITE') {
        return p.activeBom?.status === 'archived';
      }
    }
    
    return false;
  }) || [];
  
  const error = null;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Product | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [bomActionLoading, setBomActionLoading] = useState<number | null>(null);

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
  }, [category]);

  const handleSort = (column: keyof Product) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedProducts = useMemo(() => {
    if (!sortColumn) return products;

    return [...products].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [products, sortColumn, sortDirection]);

  const formatPrice = (price: string | null | undefined) => {
    if (!price) return '-';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.description}" (${product.part_number})?`)) {
      return;
    }

    try {
      setDeletingId(product.id);
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', product.id);
      
      if (error) throw error;
      
      // Remove from local list
      setLocalProducts(prev => prev.filter(p => p.id !== product.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const handleActivateBom = async (product: Product) => {
    if (!product.activeBom) return;
    
    try {
      setBomActionLoading(product.id);
      await BomsAPI.activate(product.activeBom.id);
      
      // Refresh the product data
      const updatedData = await ProductsAPI.getAll();
      setLocalProducts(updatedData);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to activate BOM');
    } finally {
      setBomActionLoading(null);
    }
  };

  const handleArchiveBom = async (product: Product) => {
    if (!product.activeBom) return;
    
    try {
      setBomActionLoading(product.id);
      await BomsAPI.archive(product.activeBom.id);
      
      // Refresh the product data
      const updatedData = await ProductsAPI.getAll();
      setLocalProducts(updatedData);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to archive BOM');
    } finally {
      setBomActionLoading(null);
    }
  };

  const getTypeBadgeColor = (productType: ProductType) => {
    switch (productType) {
      case 'RM_MEAT': return 'bg-red-100 text-red-800';
      case 'PR': return 'bg-purple-100 text-purple-800';
      case 'FG': return 'bg-green-100 text-green-800';
      case 'DG_WEB': return 'bg-blue-100 text-blue-800';
      case 'DG_LABEL': return 'bg-yellow-100 text-yellow-800';
      case 'DG_BOX': return 'bg-orange-100 text-orange-800';
      case 'DG_ING': return 'bg-indigo-100 text-indigo-800';
      case 'DG_SAUCE': return 'bg-pink-100 text-pink-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const formatExpiryPolicy = (policy: string | null | undefined) => {
    if (!policy) return '-';
    return policy.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-600">Loading products...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-semibold">Error loading products</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by item # or name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
      </div>

      {sortedProducts.length === 0 ? (
        <div className="py-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No products found</p>
          <p className="text-slate-400 text-xs mt-1">Try adjusting your search or add a new item</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th 
                    className="text-left py-3 px-4 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                    onClick={() => handleSort('part_number')}
                  >
                    Item # {sortColumn === 'part_number' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                    onClick={() => handleSort('description')}
                  >
                    Name {sortColumn === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">UoM</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Expiry Policy</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Shelf Life</th>
                  <th 
                    className="text-left py-3 px-4 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                    onClick={() => handleSort('std_price')}
                  >
                    Std. Price {sortColumn === 'std_price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Is Active</th>
                  {(category === 'FINISHED_GOODS' || category === 'PROCESS') && (
                    <>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Active BOM</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">BOM Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">BOM Actions</th>
                    </>
                  )}
                  <th 
                    className="text-left py-3 px-4 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                    onClick={() => handleSort('updated_at')}
                  >
                    Updated At {sortColumn === 'updated_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product) => (
                  <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">
                      {product.part_number}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      {product.description}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {product.uom}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeBadgeColor(product.product_type)}`}>
                        {product.product_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {formatExpiryPolicy(product.expiry_policy)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {product.shelf_life_days ? `${product.shelf_life_days} days` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">
                      {formatPrice(
                        typeof product.std_price === "number"
                          ? product.std_price.toString()
                          : product.std_price ?? undefined
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        product.is_active 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {(category === 'FINISHED_GOODS' || category === 'PROCESS') && (
                      <>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {product.activeBom ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                              v{product.activeBom.version}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {product.activeBom ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              product.activeBom.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : product.activeBom.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.activeBom.status}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {product.activeBom ? (
                            <div className="flex items-center gap-1">
                              {product.activeBom.status === 'draft' && (
                                <button
                                  onClick={() => handleActivateBom(product)}
                                  disabled={bomActionLoading === product.id}
                                  className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200 disabled:opacity-50"
                                  title="Activate BOM"
                                >
                                  {bomActionLoading === product.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    'Activate'
                                  )}
                                </button>
                              )}
                              {product.activeBom.status === 'active' && (
                                <button
                                  onClick={() => handleArchiveBom(product)}
                                  disabled={bomActionLoading === product.id}
                                  className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200 disabled:opacity-50"
                                  title="Archive BOM"
                                >
                                  {bomActionLoading === product.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    'Archive'
                                  )}
                                </button>
                              )}
                              {product.activeBom.status === 'archived' && (
                                <span className="text-slate-400 text-xs">No actions</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">No BOM</span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {formatDate(product.updated_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onEditProduct(product)}
                          className="p-1 hover:bg-blue-100 rounded transition-colors"
                          title="Edit Product"
                        >
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </button>

                        <button 
                          onClick={() => handleDelete(product)}
                          disabled={deletingId === product.id}
                          className="p-1 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                          title="Delete product"
                        >
                          {deletingId === product.id ? (
                            <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
