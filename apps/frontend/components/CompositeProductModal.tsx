"use client";
import { useEffect, useState } from 'react';
import { createComposite } from '@/lib/api/products.createComposite';
import type { ProductInsert, BomItemInput, ExpiryPolicy, Product } from '@/lib/types';
import { supabase } from '@/lib/supabase/client-browser';
import { toast } from '@/lib/toast';
import ProductSelect from '@/components/ProductSelect';
import AllergenChips from '@/components/AllergenChips';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product;
}

export default function CompositeProductModal({ isOpen, onClose, onSuccess, product: editingProduct }: Props) {
  const [product, setProduct] = useState<Partial<ProductInsert>>({ product_group: 'COMPOSITE', uom: 'ea' });
  const [bomStatus, setBomStatus] = useState<'draft' | 'active' | 'archived'>('draft');
  const [bomVersion, setBomVersion] = useState<string>('1.0');
  const [currentBomId, setCurrentBomId] = useState<number | null>(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [newVersionNumber, setNewVersionNumber] = useState<string>('');
  const [items, setItems] = useState<BomItemInput[]>([]);
  
  // Store initial state for change detection
  const [initialProduct, setInitialProduct] = useState<Partial<ProductInsert>>({});
  const [initialItems, setInitialItems] = useState<BomItemInput[]>([]);
  const [initialAllergens, setInitialAllergens] = useState<number[]>([]);
  
  // Debug: log items when they change
  useEffect(() => {
    console.log('Items state updated:', items);
  }, [items]);
  
  // Debug: log BOM status when it changes
  useEffect(() => {
    console.log('BOM Status updated:', bomStatus);
  }, [bomStatus]);
  const [itemNames, setItemNames] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [components, setComponents] = useState<Array<{ id: number; part_number: string; description: string; uom: string }>>([]);

  const handleReset = () => {
    setProduct({ product_group: 'COMPOSITE', uom: 'ea' });
    setItems([]);
    setItemNames({});
    setError(null);
    setSelectedAllergens([]);
    setInheritedAllergens([]);
  };

  // Calculate inherited allergens from BOM components
  const calculateInheritedAllergens = async () => {
    if (items.length === 0) {
      setInheritedAllergens([]);
      return;
    }

    const materialIds = items.map(item => item.material_id).filter(id => id !== null);
    if (materialIds.length === 0) {
      setInheritedAllergens([]);
      return;
    }

    const { data } = await supabase
      .from('product_allergens')
      .select('allergen_id')
      .in('product_id', materialIds)
      .eq('contains', true);

    const allergenIds = [...new Set(data?.map(pa => pa.allergen_id) || [])];
    setInheritedAllergens(allergenIds);
  };

  // Update inherited allergens when items change
  useEffect(() => {
    calculateInheritedAllergens();
  }, [items]);

  const handleClose = () => {
    handleReset();
    onClose();
  };
  const [routings, setRoutings] = useState<Array<{ id: number; name: string }>>([]);
  const [allergens, setAllergens] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<number[]>([]);
  const [inheritedAllergens, setInheritedAllergens] = useState<number[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    (async () => {
      setLoadingData(true);
      try {
        const [{ data: rData }, { data: aData }, { data: cData }] = await Promise.all([
          supabase.from('routings').select('id,name').order('name'),
          supabase.from('allergens').select('id,code,name').order('code'),
          supabase.from('products')
            .select('id, part_number, description, uom')
            .in('product_group', ['MEAT', 'DRYGOODS', 'COMPOSITE'])
            .eq('is_active', true)
            .order('part_number')
        ]);
        setRoutings(rData || []);
        setAllergens(aData || []);
        setComponents(cData || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingData(false);
      }
    })();
    
    // Fill form when editing existing product
    if (editingProduct) {
      console.log('Editing product:', editingProduct);
      const productData = {
        part_number: editingProduct.part_number,
        description: editingProduct.description,
        product_group: editingProduct.product_group,
        product_type: editingProduct.product_type,
        uom: editingProduct.uom,
        expiry_policy: editingProduct.expiry_policy as ExpiryPolicy,
        shelf_life_days: editingProduct.shelf_life_days,
        std_price: editingProduct.std_price,
        preferred_supplier_id: editingProduct.preferred_supplier_id,
        tax_code_id: editingProduct.tax_code_id,
        lead_time_days: editingProduct.lead_time_days,
        moq: editingProduct.moq,
        production_lines: editingProduct.production_lines,
      };
      setProduct(productData);
      setInitialProduct(JSON.parse(JSON.stringify(productData))); // Deep copy
      
      // Load existing allergens
      if (editingProduct.allergens) {
        const allergenIds = editingProduct.allergens.map(a => a.allergen_id);
        setSelectedAllergens(allergenIds);
        setInitialAllergens(JSON.parse(JSON.stringify(allergenIds))); // Deep copy
      }
    } else {
      // Reset form for new product
      setProduct({ product_group: 'COMPOSITE', uom: 'ea' });
      setBomStatus('draft');
      setItems([]);
      setItemNames({});
      setSelectedAllergens([]);
      setInheritedAllergens([]);
    }
  }, [isOpen, editingProduct]);

  // Fill form when components are loaded and we have editingProduct
  useEffect(() => {
    if (editingProduct && components.length > 0) {
      console.log('Filling form with components loaded:', components.length);
      console.log('Editing product:', editingProduct);
      
      // Load BOM items directly from database based on product_id
      (async () => {
        const { data: bomsData, error: bomsError } = await supabase
          .from('boms')
          .select('id, status, version')
          .eq('product_id', editingProduct.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (bomsError) {
          console.error('Failed to load BOM:', bomsError);
          return;
        }
        
        if (bomsData && bomsData.length > 0) {
          const bom = bomsData[0];
          console.log('Found BOM:', bom);
          setCurrentBomId(bom.id);
          setBomVersion(bom.version);
          setBomStatus(bom.status as 'draft' | 'active' | 'archived');
          
          // Load BOM items with material details
          const { data: bomItemsData, error: bomItemsError } = await supabase
            .from('bom_items')
            .select(`
              id,
              material_id,
              quantity,
              uom,
              sequence,
              priority,
              production_lines,
              production_line_restrictions,
              scrap_std_pct,
              is_optional,
              is_phantom,
              consume_whole_lp,
              unit_cost_std,
              tax_code_id,
              lead_time_days,
              moq,
              material:products!bom_items_material_id_fkey(
                id,
                part_number,
                description,
                uom,
                is_active
              )
            `)
            .eq('bom_id', bom.id)
            .order('sequence');
          
          if (bomItemsError) {
            console.error('Failed to load BOM items:', bomItemsError);
            return;
          }
          
          console.log('BOM Items from database:', bomItemsData);
          
          if (bomItemsData && bomItemsData.length > 0) {
            const mappedItems = bomItemsData.map(item => ({
              material_id: item.material_id,
              quantity: item.quantity,
              uom: item.uom,
              sequence: item.sequence,
              priority: item.priority,
              production_lines: item.production_lines || [],
              production_line_restrictions: item.production_line_restrictions || [],
              scrap_std_pct: item.scrap_std_pct,
              is_optional: item.is_optional,
              is_phantom: item.is_phantom,
              consume_whole_lp: item.consume_whole_lp,
              unit_cost_std: item.unit_cost_std,
              tax_code_id: item.tax_code_id,
              lead_time_days: item.lead_time_days,
              moq: item.moq
            }));
            console.log('Mapped items:', mappedItems);
            setItems(mappedItems);
            setInitialItems(JSON.parse(JSON.stringify(mappedItems))); // Deep copy for change detection
            
            // Set item names
            const names: Record<number, string> = {};
            bomItemsData.forEach((item: any, idx: number) => {
              if (item.material?.description) {
                names[idx] = item.material.description;
              }
            });
            console.log('Item names:', names);
            setItemNames(names);
          }
        }
      })();
    }
  }, [editingProduct, components]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems(prev => [...prev, { material_id: null, quantity: 1, uom: product.uom || 'ea', sequence: prev.length + 1 }]);
    // Don't need to reset itemNames as new items start without names
  };
  
  const calculateNextVersion = (currentVersion: string, isMajor: boolean = false): string => {
    const parts = currentVersion.split('.');
    if (parts.length !== 2) return '1.0';
    
    const [major, minor] = parts.map(Number);
    if (isMajor) {
      return `${major + 1}.0`;
    } else {
      return `${major}.${minor + 1}`;
    }
  };

  const detectChanges = (): { hasMinorChanges: boolean; hasMajorChanges: boolean } => {
    if (!editingProduct) return { hasMinorChanges: false, hasMajorChanges: false };
    
    // Minor changes: Description, Std Price, Default Routing, Expiry Policy, Shelf Life, Allergens
    const minorChangeFields = ['description', 'std_price', 'expiry_policy', 'shelf_life_days'] as const;
    const hasMinorChanges = minorChangeFields.some(field => 
      JSON.stringify(initialProduct[field]) !== JSON.stringify(product[field])
    ) || JSON.stringify(initialAllergens.sort()) !== JSON.stringify(selectedAllergens.sort());
    
    // Major changes: BOM items (added, removed, or modified)
    const hasMajorChanges = JSON.stringify(initialItems) !== JSON.stringify(items);
    
    console.log('Change detection:', { 
      hasMinorChanges, 
      hasMajorChanges,
      initialProduct,
      currentProduct: product,
      initialItems,
      currentItems: items,
      initialAllergens,
      currentAllergens: selectedAllergens
    });
    
    return { hasMinorChanges, hasMajorChanges };
  };

  const getNewVersion = (): string => {
    const { hasMinorChanges, hasMajorChanges } = detectChanges();
    
    if (hasMajorChanges) {
      // Major change: increment major version
      return calculateNextVersion(bomVersion, true);
    } else if (hasMinorChanges) {
      // Minor change: increment minor version
      return calculateNextVersion(bomVersion, false);
    }
    
    // No changes
    return bomVersion;
  };

  const handleChangeVersion = async () => {
    if (!editingProduct || !currentBomId) return;
    
    // Calculate suggested next versions
    const nextMinor = calculateNextVersion(bomVersion, false);
    const nextMajor = calculateNextVersion(bomVersion, true);
    
    setNewVersionNumber(nextMinor);
    setShowVersionModal(true);
  };
  
  const handleChangeItem = (idx: number, field: keyof BomItemInput, value: any) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const handleSelectComponent = (idx: number, componentId: string) => {
    const component = components.find(c => c.id === parseInt(componentId));
    if (component) {
      setItems(prev => prev.map((it, i) => i === idx ? { ...it, material_id: component.id, uom: component.uom || it.uom } : it));
      setItemNames(prev => ({ ...prev, [idx]: component.description }));
    } else {
      setItems(prev => prev.map((it, i) => i === idx ? { ...it, material_id: null } : it));
      setItemNames(prev => {
        const newNames = { ...prev };
        delete newNames[idx];
        return newNames;
      });
    }
  };
  const handleRemoveItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sequence: i + 1 })));
    setItemNames(prev => {
      const newNames = { ...prev };
      delete newNames[idx];
      // Reindex remaining names
      const reindexed: Record<number, string> = {};
      Object.entries(newNames).forEach(([key, value]) => {
        const oldIdx = parseInt(key);
        if (oldIdx > idx) {
          reindexed[oldIdx - 1] = value;
        } else if (oldIdx < idx) {
          reindexed[oldIdx] = value;
        }
      });
      return reindexed;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (!product.part_number || !product.description || !product.uom) {
        setError('part_number, description and uom are required');
        setSubmitting(false);
        return;
      }
      if (!(product.product_type === 'PR' || product.product_type === 'FG')) {
        setError('product_type must be PR or FG');
        setSubmitting(false);
        return;
      }
      if (!items.length) {
        setError('At least one BOM item required');
        setSubmitting(false);
        return;
      }
      // Validate that all BOM items have material_id
      const invalidItems = items.filter(item => !item.material_id);
      if (invalidItems.length > 0) {
        setError('All BOM items must have a product selected');
        setSubmitting(false);
        return;
      }
      const payload = {
        product: {
          type: product.product_type as 'PR' | 'FG',
          part_number: product.part_number!,
          description: product.description!,
          uom: product.uom!,
          product_group: 'COMPOSITE' as const,
          product_type: product.product_type,
          expiry_policy: product.expiry_policy ?? null,
          shelf_life_days: product.shelf_life_days ?? null,
          std_price: product.std_price ?? null,
          production_lines: product.production_lines ?? [],
          preferred_supplier_id: product.preferred_supplier_id ?? null,
          tax_code_id: product.tax_code_id ?? null,
          lead_time_days: product.lead_time_days ?? null,
          moq: product.moq ?? null,
        },
        bom: { version: '1.0', status: bomStatus, default_routing_id: (product as any).default_routing_id ?? null },
        items,
      };
      if (editingProduct) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(payload.product)
          .eq('id', editingProduct.id);
        
        if (updateError) throw updateError;
        
        // Update allergens
        await supabase.from('product_allergens').delete().eq('product_id', editingProduct.id);
        const allAllergens = [...new Set([...inheritedAllergens, ...selectedAllergens])];
        if (allAllergens.length > 0) {
          const rows = allAllergens.map((allergen_id) => ({ product_id: editingProduct.id, allergen_id, contains: true }));
          const { error: paErr } = await supabase.from('product_allergens').insert(rows);
          if (paErr) console.warn('Failed to save allergens', paErr);
        }
        
        // Find existing BOM for this product
        const { data: existingBoms } = await supabase
          .from('boms')
          .select('id')
          .eq('product_id', editingProduct.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (existingBoms && existingBoms.length > 0) {
          const bomId = existingBoms[0].id;
          
          // Detect changes and get new version
          const newVersion = getNewVersion();
          const hasChanges = newVersion !== bomVersion;
          
          console.log('Version check:', { currentVersion: bomVersion, newVersion, hasChanges });
          
          // Update BOM with new version and status
          await supabase
            .from('boms')
            .update({ 
              status: bomStatus,
              version: newVersion
            })
            .eq('id', bomId);
          
          // Update product is_active based on BOM status
          const isActive = bomStatus === 'active';
          await supabase
            .from('products')
            .update({ is_active: isActive })
            .eq('id', editingProduct.id);
          
          // Update existing BOM items
          await supabase.from('bom_items').delete().eq('bom_id', bomId);
          if (items.length > 0) {
            const bomItems = items.map(item => ({
              bom_id: bomId,
              material_id: item.material_id,
              quantity: item.quantity,
              uom: item.uom,
              sequence: item.sequence,
              priority: item.priority,
              production_lines: item.production_lines,
              production_line_restrictions: item.production_line_restrictions,
              scrap_std_pct: item.scrap_std_pct,
              is_optional: item.is_optional,
              is_phantom: item.is_phantom,
              consume_whole_lp: item.consume_whole_lp,
              unit_cost_std: item.unit_cost_std,
              tax_code_id: item.tax_code_id,
              lead_time_days: item.lead_time_days,
              moq: item.moq
            }));
            await supabase.from('bom_items').insert(bomItems);
          }
        }
        
        toast.success('Composite product updated successfully');
      } else {
        // Create new product
        const result = await createComposite(payload);
        
        // Update product is_active based on BOM status
        if (result?.product_id) {
          const isActive = bomStatus === 'active';
          await supabase
            .from('products')
            .update({ is_active: isActive })
            .eq('id', result.product_id);
        }
        
        // Combine inherited and selected allergens
        const allAllergens = [...new Set([...inheritedAllergens, ...selectedAllergens])];
        if (allAllergens.length > 0 && result?.product_id) {
          const rows = allAllergens.map((allergen_id) => ({ product_id: result.product_id, allergen_id, contains: true }));
          const { error: paErr } = await supabase.from('product_allergens').insert(rows);
          if (paErr) console.warn('Failed to save allergens', paErr);
        }
        toast.success('Composite product created successfully');
      }
      onSuccess();
      handleClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to create composite');
      toast.error(e?.message || 'Failed to create composite');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {editingProduct ? 'Edit Composite Product' : 'Add Composite Product'}
          </h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="px-6 pt-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Type</label>
            <select
              value={product.product_type ?? ''}
              onChange={e => setProduct(p => ({ ...p, product_type: e.target.value as any }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              <option value="PR">PR</option>
              <option value="FG">FG</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Status (is_active)</label>
            <select
              value={product.is_active ? 'active' : 'inactive'}
              onChange={e => setProduct(p => ({ ...p, is_active: e.target.value === 'active' }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Part Number</label>
            <input
              value={product.part_number ?? ''}
              onChange={e => setProduct(p => ({ ...p, part_number: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              value={product.description ?? ''}
              onChange={e => setProduct(p => ({ ...p, description: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">UoM</label>
            <input
              value={product.uom ?? ''}
              onChange={e => setProduct(p => ({ ...p, uom: e.target.value }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Std Price</label>
            <input
              type="number"
              value={product.std_price ?? ''}
              onChange={e => setProduct(p => ({ ...p, std_price: e.target.value ? Number(e.target.value) : null }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Default Routing</label>
            <select
              value={(product as any).default_routing_id ?? ''}
              onChange={e => setProduct(p => ({ ...p, default_routing_id: e.target.value ? Number(e.target.value) : null }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              {routings.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Policy</label>
            <select
              value={(product.expiry_policy as string) ?? ''}
              onChange={e => setProduct(p => ({ ...p, expiry_policy: e.target.value as ExpiryPolicy }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              {(['DAYS_STATIC','FROM_MFG_DATE','FROM_DELIVERY_DATE','FROM_CREATION_DATE'] as ExpiryPolicy[]).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Shelf Life (days)</label>
            <input
              type="number"
              value={product.shelf_life_days ?? ''}
              onChange={e => setProduct(p => ({ ...p, shelf_life_days: e.target.value ? Number(e.target.value) : null }))}
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Allergens</label>
              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                  <span className="ml-3 text-sm text-slate-600">Loading allergens...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {inheritedAllergens.length > 0 && (
                    <div className="text-xs text-slate-600">
                      <span className="font-medium">Inherited from components:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {inheritedAllergens.map(allergenId => {
                          const allergen = allergens.find(a => a.id === allergenId);
                          return allergen ? (
                            <span key={allergenId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {allergen.code}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  <AllergenChips
                    allergens={allergens}
                    selectedIds={selectedAllergens}
                    onToggle={(id) => setSelectedAllergens(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                  />
                  <div className="text-xs text-slate-500 italic">
                    Select additional allergens or override inherited ones
                  </div>
                </div>
              )}
            </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              {/* BOM Version Management */}
              {editingProduct && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-sm font-medium text-slate-900 mb-3">BOM Management</h3>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Version:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {bomVersion}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        bomStatus === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : bomStatus === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {bomStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => setBomStatus('active')}
                      disabled={bomStatus === 'active'}
                      className="px-3 py-1.5 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set Active
                    </button>
                    <button
                      onClick={() => setBomStatus('draft')}
                      disabled={bomStatus === 'draft'}
                      className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set Draft
                    </button>
                    <button
                      onClick={() => setBomStatus('archived')}
                      disabled={bomStatus === 'archived'}
                      className="px-3 py-1.5 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Archive
                    </button>
                    <button
                      onClick={handleChangeVersion}
                      className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200"
                    >
                      Change Version
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-900">BOM Items</h3>
                <button 
                  onClick={handleAddItem} 
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                  Add Item
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg">
                {items.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <p className="text-sm">No BOM items added yet</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Add Item" to start building your BOM</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-50 grid grid-cols-9 gap-2 p-3 text-xs font-medium text-slate-600 border-b">
                      <div>Item Number</div>
                      <div>Item Name</div>
                      <div>Qty</div>
                      <div>UoM</div>
                      <div>Seq</div>
                      <div>Optional</div>
                      <div>Phantom</div>
                      <div>1:1</div>
                      <div>Actions</div>
                    </div>
                    {items.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-9 gap-2 p-3 border-b border-slate-100 items-center hover:bg-slate-50">
                        <div>
                          <select
                            value={it.material_id || ''}
                            onChange={(e) => handleSelectComponent(idx, e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select component...</option>
                            {components.map(component => (
                              <option key={component.id} value={component.id}>
                                {component.part_number} — {component.description} ({component.uom})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="text-slate-600 text-sm">
                          {itemNames[idx] || '-'}
                        </div>
                        <input 
                          type="number" 
                          className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          value={it.quantity}
                          onChange={e => handleChangeItem(idx, 'quantity', Number(e.target.value))} 
                          placeholder="Qty" 
                        />
                        <input 
                          className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          value={it.uom}
                          onChange={e => handleChangeItem(idx, 'uom', e.target.value)} 
                          placeholder="UoM" 
                        />
                        <input 
                          type="number" 
                          className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          value={it.sequence ?? idx + 1}
                          onChange={e => handleChangeItem(idx, 'sequence', Number(e.target.value))} 
                          placeholder="Seq" 
                        />
                        <div className="flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={it.is_optional || false} 
                            onChange={e => handleChangeItem(idx, 'is_optional', e.target.checked)} 
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" 
                          />
                        </div>
                        <div className="flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={it.is_phantom || false} 
                            onChange={e => handleChangeItem(idx, 'is_phantom', e.target.checked)} 
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" 
                          />
                        </div>
                        <div className="flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={it.consume_whole_lp || false} 
                            onChange={e => handleChangeItem(idx, 'consume_whole_lp', e.target.checked)} 
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" 
                          />
                        </div>
                        <button 
                          onClick={() => handleRemoveItem(idx)} 
                          className="px-3 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <button onClick={handleClose} className="px-6 py-3 border border-slate-300 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-6 py-3 bg-slate-900 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            {submitting ? 'Saving…' : (editingProduct ? 'Update Composite' : 'Save Composite')}
          </button>
        </div>
      </div>
    </div>
  );
}


