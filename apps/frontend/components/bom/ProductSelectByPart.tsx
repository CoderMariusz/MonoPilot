"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client-browser';

interface ProductOption {
  id: number;
  part_number: string;
  description: string;
  uom: string;
  product_group?: string;
  product_type?: string;
}

interface ProductSelectByPartProps {
  value?: number | null;
  onChange: (product: ProductOption | null) => void;
  placeholder?: string;
  allowedGroups?: Array<'MEAT' | 'DRYGOODS' | 'COMPOSITE'>;
  className?: string;
}

export default function ProductSelectByPart({ 
  value, 
  onChange, 
  placeholder = 'Select product...',
  allowedGroups = ['MEAT', 'DRYGOODS', 'COMPOSITE'],
  className = ''
}: ProductSelectByPartProps) {
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);

  const groups = allowedGroups;

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, part_number, description, uom, product_group, product_type')
          .in('product_group', groups)
          .eq('is_active', true)
          .order('part_number')
          .limit(100);

        if (error) {
          console.error('Product load error:', error);
          setOptions([]);
        } else {
          setOptions(data as ProductOption[]);
        }
      } catch (err) {
        console.error('Product load error:', err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [groups]); // Load when groups change

  useEffect(() => {
    if (value && options.length > 0) {
      const product = options.find(p => p.id === value);
      setSelectedProduct(product || null);
    } else {
      setSelectedProduct(null);
    }
  }, [value, options]);

  const handleSelect = (product: ProductOption) => {
    setSelectedProduct(product);
    onChange(product);
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedProduct?.id || ''}
        onChange={(e) => {
          const productId = e.target.value ? parseInt(e.target.value) : null;
          const product = productId ? options.find(p => p.id === productId) : null;
          handleSelect(product || null);
        }}
        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={loading}
      >
        <option value="">{loading ? 'Loading...' : placeholder}</option>
        {options.map((product) => (
          <option key={product.id} value={product.id}>
            {product.part_number} — {product.description} ({product.uom})
          </option>
        ))}
      </select>
    </div>
  );
}
