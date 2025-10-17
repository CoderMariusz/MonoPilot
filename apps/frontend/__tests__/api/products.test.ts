import { ProductsAPI } from '@/lib/api/products';
import { supabase } from '@/lib/supabase/client';
import { shouldUseMockData } from '@/lib/api/config';

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 1, part_number: 'TEST-001' },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { id: 1, part_number: 'TEST-001' },
              error: null
            }))
          }))
        }))
      }))
    }))
  }
}));

// Mock the config
jest.mock('@/lib/api/config', () => ({
  shouldUseMockData: jest.fn(() => false)
}));

describe('ProductsAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    test('should fetch all products when not in mock mode', async () => {
      const mockData = [
        { id: 1, part_number: 'TEST-001', description: 'Test Product 1' },
        { id: 2, part_number: 'TEST-002', description: 'Test Product 2' }
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              data: mockData,
              error: null
            }))
          }))
        }))
      });

      const result = await ProductsAPI.getAll();
      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('products');
    });

    test('should return empty array in mock mode', async () => {
      (shouldUseMockData as jest.Mock).mockReturnValue(true);

      const result = await ProductsAPI.getAll();
      expect(result).toEqual([]);
    });

    test('should handle database errors', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      });

      await expect(ProductsAPI.getAll()).rejects.toThrow('Failed to fetch products');
    });
  });

  describe('getById', () => {
    test('should fetch product by ID', async () => {
      const mockProduct = { id: 1, part_number: 'TEST-001', description: 'Test Product' };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockProduct,
              error: null
            }))
          }))
        }))
      });

      const result = await ProductsAPI.getById(1);
      expect(result).toEqual(mockProduct);
    });

    test('should return null when product not found', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'Product not found' }
            }))
          }))
        }))
      });

      const result = await ProductsAPI.getById(999);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    test('should create product without BOM', async () => {
      const productData = {
        part_number: 'TEST-001',
        description: 'Test Product',
        category: 'MEAT',
        type: 'RM',
        uom: 'kg'
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { id: 1, ...productData },
              error: null
            }))
          }))
        }))
      });

      const result = await ProductsAPI.create(productData);
      expect(result).toEqual({ id: 1, ...productData });
    });

    test('should create product with BOM', async () => {
      const productData = {
        part_number: 'TEST-001',
        description: 'Test Product',
        category: 'PROCESS',
        type: 'PR',
        uom: 'kg',
        bom_items: [
          {
            material_id: 1,
            quantity: 1.0,
            uom: 'kg',
            one_to_one: true
          }
        ]
      };

      // Mock BOM creation
      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: { id: 1, ...productData },
                error: null
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: { id: 1, product_id: 1, version: '1.0' },
                error: null
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          insert: jest.fn(() => ({
            data: null,
            error: null
          }))
        });

      const result = await ProductsAPI.create(productData);
      expect(result).toEqual({ id: 1, ...productData });
    });

    test('should throw error in mock mode', async () => {
      (shouldUseMockData as jest.Mock).mockReturnValue(true);

      const productData = {
        part_number: 'TEST-001',
        description: 'Test Product',
        category: 'MEAT',
        type: 'RM',
        uom: 'kg'
      };

      await expect(ProductsAPI.create(productData)).rejects.toThrow('Cannot create products in mock mode');
    });
  });

  describe('update', () => {
    test('should update product without BOM changes', async () => {
      const updateData = {
        description: 'Updated Test Product'
      };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: { id: 1, ...updateData },
                error: null
              }))
            }))
          }))
        }))
      });

      const result = await ProductsAPI.update(1, updateData);
      expect(result).toEqual({ id: 1, ...updateData });
    });

    test('should update product with BOM changes', async () => {
      const updateData = {
        description: 'Updated Test Product',
        bom_items: [
          {
            material_id: 1,
            quantity: 2.0,
            uom: 'kg',
            one_to_one: false
          }
        ]
      };

      // Mock existing BOM
      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: { id: 1, product_id: 1 },
                error: null
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { id: 1, ...updateData },
                  error: null
                }))
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          delete: jest.fn(() => ({
            eq: jest.fn(() => ({
              data: null,
              error: null
            }))
          }))
        })
        .mockReturnValueOnce({
          insert: jest.fn(() => ({
            data: null,
            error: null
          }))
        });

      const result = await ProductsAPI.update(1, updateData);
      expect(result).toEqual({ id: 1, ...updateData });
    });

    test('should throw error in mock mode', async () => {
      (shouldUseMockData as jest.Mock).mockReturnValue(true);

      const updateData = {
        description: 'Updated Test Product'
      };

      await expect(ProductsAPI.update(1, updateData)).rejects.toThrow('Cannot update products in mock mode');
    });
  });

  describe('delete', () => {
    test('should delete product', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: null,
            error: null
          }))
        }))
      });

      await ProductsAPI.delete(1);
      expect(supabase.from).toHaveBeenCalledWith('products');
    });

    test('should throw error in mock mode', async () => {
      (shouldUseMockData as jest.Mock).mockReturnValue(true);

      await expect(ProductsAPI.delete(1)).rejects.toThrow('Cannot delete products in mock mode');
    });
  });

  describe('getByCategory', () => {
    test('should fetch products by category', async () => {
      const mockProducts = [
        { id: 1, part_number: 'MEAT-001', category: 'MEAT' },
        { id: 2, part_number: 'MEAT-002', category: 'MEAT' }
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              data: mockProducts,
              error: null
            }))
          }))
        }))
      });

      const result = await ProductsAPI.getByCategory('MEAT');
      expect(result).toEqual(mockProducts);
    });
  });
});
