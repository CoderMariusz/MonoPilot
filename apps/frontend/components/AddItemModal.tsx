'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, ArrowLeft, Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/lib/toast';
import { mockProducts } from '@/lib/mockData';
import { useAllergens, useProducts } from '@/lib/clientState';
import type { Product, Allergen } from '@/lib/types';
import type { BomComponent } from '@/lib/validation/productSchema';

type CategoryType = 'MEAT' | 'DRYGOODS' | 'FINISHED_GOODS' | 'PROCESS';
type ExpiryPolicy = 'DAYS_STATIC' | 'FROM_MFG_DATE' | 'FROM_DELIVERY_DATE' | 'FROM_CREATION_DATE';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product;
}

export default function AddItemModal({ isOpen, onClose, onSuccess, product }: AddItemModalProps) {
  const isEditMode = !!product;
  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();
  const allergens = useAllergens();
  const allProducts = useProducts();

  const [formData, setFormData] = useState({
    part_number: '',
    description: '',
    uom: '',
    std_price: '',
    notes: '',
    subtype: '',
    expiry_policy: '' as ExpiryPolicy | '',
    shelf_life_days: '',
    allergen_ids: [] as number[],
    rate: '',
  });

  const [bomComponents, setBomComponents] = useState<Array<{
    product_id: string;
    quantity: string;
    uom: string;
  }>>([{ product_id: '', quantity: '', uom: '' }]);

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (isEditMode && product && isOpen) {
      setStep(2);
      setCategory(product.category || null);
      
      setFormData({
        part_number: product.part_number || '',
        description: product.description || '',
        uom: product.uom || '',
        std_price: product.std_price || '',
        notes: '',
        subtype: product.subtype || '',
        expiry_policy: (product.expiry_policy as ExpiryPolicy) || '',
        shelf_life_days: product.shelf_life_days?.toString() || '',
        allergen_ids: product.allergen_ids || [],
        rate: product.rate?.toString() || '',
      });

      if (product.activeBom?.bomItems && product.activeBom.bomItems.length > 0) {
        setBomComponents(
          product.activeBom.bomItems.map((item: any) => ({
            product_id: item.material_id?.toString() || '',
            quantity: item.quantity?.toString() || '',
            uom: item.uom || '',
          }))
        );
      }
    } else if (isOpen && !product) {
      setStep(1);
      setCategory(null);
    }
  }, [isEditMode, product, isOpen]);

  useEffect(() => {
    if (isOpen && (category === 'FINISHED_GOODS' || category === 'PROCESS')) {
      fetchAvailableProducts();
    }
  }, [isOpen, category]);

  const fetchAvailableProducts = async () => {
    try {
      if (category === 'PROCESS') {
        const rmProducts = mockProducts.filter(p => p.type === 'RM');
        setAvailableProducts(rmProducts);
      } else if (category === 'FINISHED_GOODS') {
        const rmProducts = mockProducts.filter(p => p.type === 'RM');
        const prProducts = mockProducts.filter(p => p.type === 'PR');
        setAvailableProducts([...rmProducts, ...prProducts]);
      }
    } catch (error) {
      showToast('Failed to load products', 'error');
    }
  };

  const getInheritedAllergens = useMemo(() => {
    if (!category || (category !== 'FINISHED_GOODS' && category !== 'PROCESS')) {
      return [];
    }

    const inheritedAllergens: Array<{ allergen: Allergen; source: Product }> = [];
    const allergenMap = new Map<number, { allergen: Allergen; sources: Product[] }>();

    bomComponents.forEach(component => {
      if (component.product_id) {
        const material = allProducts.find(p => p.id === parseInt(component.product_id));
        if (material && material.allergens && material.allergens.length > 0) {
          material.allergens.forEach(allergen => {
            if (!allergenMap.has(allergen.id)) {
              allergenMap.set(allergen.id, { allergen, sources: [] });
            }
            allergenMap.get(allergen.id)!.sources.push(material);
          });
        }
      }
    });

    allergenMap.forEach(({ allergen, sources }) => {
      sources.forEach(source => {
        inheritedAllergens.push({ allergen, source });
      });
    });

    return inheritedAllergens;
  }, [category, bomComponents, allProducts]);

  const resetForm = () => {
    setStep(1);
    setCategory(null);
    setFormData({
      part_number: '',
      description: '',
      uom: '',
      std_price: '',
      notes: '',
      subtype: '',
      expiry_policy: '',
      shelf_life_days: '',
      allergen_ids: [],
      rate: '',
    });
    setBomComponents([{ product_id: '', quantity: '', uom: '' }]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCategorySelect = (selectedCategory: CategoryType) => {
    setCategory(selectedCategory);
    setStep(2);
    setErrors({});

    if (selectedCategory === 'PROCESS') {
      setFormData(prev => ({ ...prev, expiry_policy: 'FROM_CREATION_DATE' }));
    }
  };

  const handleBack = () => {
    setStep(1);
    setErrors({});
  };

  const updateFormField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleAllergen = (allergenId: number) => {
    setFormData(prev => ({
      ...prev,
      allergen_ids: prev.allergen_ids.includes(allergenId)
        ? prev.allergen_ids.filter(id => id !== allergenId)
        : [...prev.allergen_ids, allergenId]
    }));
  };

  const addBomComponent = () => {
    setBomComponents(prev => [...prev, { product_id: '', quantity: '', uom: '' }]);
  };

  const removeBomComponent = (index: number) => {
    if (bomComponents.length > 1) {
      setBomComponents(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateBomComponent = (index: number, field: string, value: string) => {
    setBomComponents(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    if (errors[`bom_${index}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`bom_${index}`];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.part_number.trim()) {
      newErrors.part_number = 'Item number is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Name is required';
    }
    if (!formData.uom.trim()) {
      newErrors.uom = 'UoM is required';
    }
    
    const price = parseFloat(formData.std_price);
    if (!formData.std_price || isNaN(price) || price < 0) {
      newErrors.std_price = 'Price must be a number >= 0';
    }

    if (category === 'DRYGOODS' && !formData.subtype) {
      newErrors.subtype = 'Subtype is required';
    }

    if (category === 'MEAT' || category === 'DRYGOODS') {
      if (!formData.expiry_policy) {
        newErrors.expiry_policy = 'Expiry policy is required';
      }
      if (formData.expiry_policy === 'DAYS_STATIC' && !formData.shelf_life_days) {
        newErrors.shelf_life_days = 'Shelf life is required when policy is DAYS_STATIC';
      }
      if (formData.shelf_life_days) {
        const shelfLife = parseFloat(formData.shelf_life_days);
        if (isNaN(shelfLife) || shelfLife <= 0) {
          newErrors.shelf_life_days = 'Shelf life must be a number > 0';
        }
      }
    }

    if (category === 'PROCESS') {
      if (!formData.shelf_life_days) {
        newErrors.shelf_life_days = 'Shelf life is required';
      } else {
        const shelfLife = parseFloat(formData.shelf_life_days);
        if (isNaN(shelfLife) || shelfLife <= 0) {
          newErrors.shelf_life_days = 'Shelf life must be a number > 0';
        }
      }
    }

    if (category === 'FINISHED_GOODS' || category === 'PROCESS') {
      bomComponents.forEach((component, index) => {
        if (!component.product_id) {
          newErrors[`bom_${index}`] = 'Material is required';
        }
        if (!component.quantity) {
          newErrors[`bom_${index}_qty`] = 'Quantity is required';
        } else {
          const qty = parseFloat(component.quantity);
          if (isNaN(qty) || qty <= 0) {
            newErrors[`bom_${index}_qty`] = 'Quantity must be a number > 0';
          }
        }
        if (!component.uom) {
          newErrors[`bom_${index}_uom`] = 'UoM is required';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setLoading(true);
    try {
      const { addProduct, updateProduct } = await import('@/lib/clientState');
      const payload: any = {
        part_number: formData.part_number,
        description: formData.description,
        uom: formData.uom,
        std_price: parseFloat(formData.std_price),
        notes: formData.notes || undefined,
        category: category,
        allergen_ids: formData.allergen_ids,
      };

      if (category === 'MEAT') {
        payload.type = 'RM';
        payload.expiry_policy = formData.expiry_policy;
        if (formData.shelf_life_days) {
          payload.shelf_life_days = parseInt(formData.shelf_life_days);
        }
      } else if (category === 'DRYGOODS') {
        payload.type = 'RM';
        payload.subtype = formData.subtype;
        payload.expiry_policy = formData.expiry_policy;
        if (formData.shelf_life_days) {
          payload.shelf_life_days = parseInt(formData.shelf_life_days);
        }
      } else if (category === 'FINISHED_GOODS') {
        payload.type = 'FG';
        if (formData.rate) {
          payload.rate = parseFloat(formData.rate);
        }
        payload.bom_items = bomComponents.map(c => ({
          material_id: parseInt(c.product_id),
          quantity: parseFloat(c.quantity),
          uom: c.uom,
        }));
      } else if (category === 'PROCESS') {
        payload.type = 'PR';
        payload.expiry_policy = 'FROM_CREATION_DATE';
        payload.shelf_life_days = parseInt(formData.shelf_life_days);
        payload.bom_items = bomComponents.map(c => ({
          material_id: parseInt(c.product_id),
          quantity: parseFloat(c.quantity),
          uom: c.uom,
        }));
      }

      if (isEditMode && product) {
        updateProduct(product.id, payload);
        showToast('Product updated successfully', 'success');
      } else {
        addProduct(payload);
        showToast('Product created successfully', 'success');
      }
      
      handleClose();
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} product`;
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {step === 2 && !isEditMode && (
              <button
                onClick={handleBack}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
                disabled={loading}
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-slate-900">
              {isEditMode 
                ? 'Edit Item' 
                : (step === 1 ? 'Add Item - Select Category' : 'Add Item - Item Details')
              }
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-6">
                Select a category to continue:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleCategorySelect('MEAT')}
                  className="p-6 border-2 border-slate-200 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="text-lg font-semibold text-slate-900">Meat</div>
                  <div className="text-sm text-slate-600 mt-1">Raw meat products</div>
                </button>
                <button
                  onClick={() => handleCategorySelect('DRYGOODS')}
                  className="p-6 border-2 border-slate-200 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="text-lg font-semibold text-slate-900">Dry Goods</div>
                  <div className="text-sm text-slate-600 mt-1">Lab, Film, Ingredients, etc.</div>
                </button>
                <button
                  onClick={() => handleCategorySelect('FINISHED_GOODS')}
                  className="p-6 border-2 border-slate-200 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="text-lg font-semibold text-slate-900">Finished Goods</div>
                  <div className="text-sm text-slate-600 mt-1">Final products with BOM</div>
                </button>
                <button
                  onClick={() => handleCategorySelect('PROCESS')}
                  className="p-6 border-2 border-slate-200 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="text-lg font-semibold text-slate-900">Process</div>
                  <div className="text-sm text-slate-600 mt-1">Work-in-progress items</div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Item Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.part_number}
                    onChange={(e) => updateFormField('part_number', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                      errors.part_number ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="e.g., MT-001"
                  />
                  {errors.part_number && (
                    <p className="text-xs text-red-600 mt-1">{errors.part_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => updateFormField('description', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                      errors.description ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="Product name"
                  />
                  {errors.description && (
                    <p className="text-xs text-red-600 mt-1">{errors.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    UoM <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.uom}
                    onChange={(e) => updateFormField('uom', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                      errors.uom ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="e.g., KG, LB, EA"
                  />
                  {errors.uom && (
                    <p className="text-xs text-red-600 mt-1">{errors.uom}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Standard Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.std_price}
                    onChange={(e) => updateFormField('std_price', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                      errors.std_price ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.std_price && (
                    <p className="text-xs text-red-600 mt-1">{errors.std_price}</p>
                  )}
                </div>
              </div>

              {category === 'DRYGOODS' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Subtype <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subtype}
                    onChange={(e) => updateFormField('subtype', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                      errors.subtype ? 'border-red-300' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select subtype...</option>
                    <option value="Lab">Lab</option>
                    <option value="Flm">Film</option>
                    <option value="Ing">Ingredient</option>
                    <option value="C">C</option>
                  </select>
                  {errors.subtype && (
                    <p className="text-xs text-red-600 mt-1">{errors.subtype}</p>
                  )}
                </div>
              )}

              {(category === 'MEAT' || category === 'DRYGOODS') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Expiry Policy <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.expiry_policy}
                      onChange={(e) => updateFormField('expiry_policy', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                        errors.expiry_policy ? 'border-red-300' : 'border-slate-300'
                      }`}
                    >
                      <option value="">Select policy...</option>
                      <option value="DAYS_STATIC">Days Static</option>
                      <option value="FROM_MFG_DATE">From Mfg Date</option>
                      <option value="FROM_DELIVERY_DATE">From Delivery Date</option>
                    </select>
                    {errors.expiry_policy && (
                      <p className="text-xs text-red-600 mt-1">{errors.expiry_policy}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Shelf Life (days) {formData.expiry_policy === 'DAYS_STATIC' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.shelf_life_days}
                      onChange={(e) => updateFormField('shelf_life_days', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                        errors.shelf_life_days ? 'border-red-300' : 'border-slate-300'
                      }`}
                      placeholder="e.g., 30"
                    />
                    {errors.shelf_life_days && (
                      <p className="text-xs text-red-600 mt-1">{errors.shelf_life_days}</p>
                    )}
                  </div>
                </div>
              )}

              {category === 'PROCESS' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Expiry Policy
                    </label>
                    <input
                      type="text"
                      value="From Creation Date"
                      disabled
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50 text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Shelf Life (days) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.shelf_life_days}
                      onChange={(e) => updateFormField('shelf_life_days', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                        errors.shelf_life_days ? 'border-red-300' : 'border-slate-300'
                      }`}
                      placeholder="e.g., 7"
                    />
                    {errors.shelf_life_days && (
                      <p className="text-xs text-red-600 mt-1">{errors.shelf_life_days}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Allergens
                </label>
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  {allergens.length === 0 ? (
                    <p className="text-sm text-slate-500">No allergens available</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {allergens.map(allergen => (
                        <button
                          key={allergen.id}
                          type="button"
                          onClick={() => toggleAllergen(allergen.id)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            formData.allergen_ids.includes(allergen.id)
                              ? 'bg-amber-500 text-white'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {allergen.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {category === 'FINISHED_GOODS' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Rate (units/hour)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.rate}
                    onChange={(e) => updateFormField('rate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="e.g., 100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Production rate in units per hour</p>
                </div>
              )}

              {(category === 'FINISHED_GOODS' || category === 'PROCESS') && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                      BOM Components <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={addBomComponent}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Component
                    </button>
                  </div>

                  <div className="space-y-3 border border-slate-200 rounded-lg p-4 bg-slate-50">
                    {bomComponents.map((component, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div>
                            <select
                              value={component.product_id}
                              onChange={(e) => updateBomComponent(index, 'product_id', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white ${
                                errors[`bom_${index}`] ? 'border-red-300' : 'border-slate-300'
                              }`}
                            >
                              <option value="">Select material...</option>
                              {availableProducts.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.part_number} - {product.description}
                                </option>
                              ))}
                            </select>
                            {errors[`bom_${index}`] && (
                              <p className="text-xs text-red-600 mt-1">{errors[`bom_${index}`]}</p>
                            )}
                          </div>

                          <div>
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={component.quantity}
                              onChange={(e) => updateBomComponent(index, 'quantity', e.target.value)}
                              placeholder="Quantity"
                              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                                errors[`bom_${index}_qty`] ? 'border-red-300' : 'border-slate-300'
                              }`}
                            />
                            {errors[`bom_${index}_qty`] && (
                              <p className="text-xs text-red-600 mt-1">{errors[`bom_${index}_qty`]}</p>
                            )}
                          </div>

                          <div>
                            <input
                              type="text"
                              value={component.uom}
                              onChange={(e) => updateBomComponent(index, 'uom', e.target.value)}
                              placeholder="UoM"
                              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                                errors[`bom_${index}_uom`] ? 'border-red-300' : 'border-slate-300'
                              }`}
                            />
                            {errors[`bom_${index}_uom`] && (
                              <p className="text-xs text-red-600 mt-1">{errors[`bom_${index}_uom`]}</p>
                            )}
                          </div>
                        </div>

                        {bomComponents.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBomComponent(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {(category === 'FINISHED_GOODS' || category === 'PROCESS') && (
                      <p className="text-xs text-slate-500 italic mt-2">
                        Note: Per-line settings can be configured after creation
                      </p>
                    )}
                  </div>
                </div>
              )}

              {(category === 'FINISHED_GOODS' || category === 'PROCESS') && getInheritedAllergens.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <label className="block text-sm font-medium text-slate-700">
                      Inherited Allergens
                    </label>
                  </div>
                  <div className="border border-amber-200 rounded-lg p-3 bg-amber-50">
                    <div className="space-y-1">
                      {getInheritedAllergens.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-amber-800">{item.allergen.name}</span>
                          <span className="text-slate-600">from</span>
                          <span className="text-slate-700">{item.source.part_number} {item.source.description}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-amber-700 mt-2">
                      These allergens are inherited from BOM materials
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => updateFormField('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          {step === 2 && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
