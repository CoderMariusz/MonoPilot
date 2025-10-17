import { ClientState } from '@/lib/clientState';
import { ProductsAPI } from '@/lib/api/products';
import { shouldUseMockData } from '@/lib/api/config';

// Mock the ProductsAPI
jest.mock('@/lib/api/products', () => ({
  ProductsAPI: {
    create: jest.fn(),
    update: jest.fn(),
    getAll: jest.fn()
  }
}));

// Mock the config
jest.mock('@/lib/api/config', () => ({
  shouldUseMockData: jest.fn(() => false)
}));

describe('ClientState', () => {
  let clientState: ClientState;

  beforeEach(() => {
    clientState = new ClientState();
    jest.clearAllMocks();
  });

  describe('addProduct', () => {
    test('should use real API when not in mock mode', async () => {
      const productData = {
        part_number: 'TEST-001',
        description: 'Test Product',
        category: 'MEAT',
        type: 'RM',
        uom: 'kg'
      };

      const mockProduct = { id: 1, ...productData };
      (ProductsAPI.create as jest.Mock).mockResolvedValue(mockProduct);
      (ProductsAPI.getAll as jest.Mock).mockResolvedValue([mockProduct]);

      const result = await clientState.addProduct(productData);

      expect(ProductsAPI.create).toHaveBeenCalledWith(productData);
      expect(ProductsAPI.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });

    test('should use mock logic when in mock mode', async () => {
      (shouldUseMockData as jest.Mock).mockReturnValue(true);

      const productData = {
        part_number: 'TEST-001',
        description: 'Test Product',
        category: 'MEAT',
        type: 'RM',
        uom: 'kg'
      };

      const result = await clientState.addProduct(productData);

      expect(ProductsAPI.create).not.toHaveBeenCalled();
      expect(result.part_number).toBe('TEST-001');
      expect(result.id).toBeDefined();
    });

    test('should handle BOM items correctly', async () => {
      (shouldUseMockData as jest.Mock).mockReturnValue(true);

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
            one_to_one: true,
            is_optional: false,
            is_phantom: false,
            scrap_std_pct: 5.0,
            unit_cost_std: 25.50
          }
        ]
      };

      const result = await clientState.addProduct(productData);

      expect(result.activeBom).toBeDefined();
      expect(result.activeBom?.bomItems).toHaveLength(1);
      expect(result.activeBom?.bomItems[0].one_to_one).toBe(true);
      expect(result.activeBom?.bomItems[0].scrap_std_pct).toBe(5.0);
    });
  });

  describe('updateProduct', () => {
    test('should use real API when not in mock mode', async () => {
      const updateData = {
        description: 'Updated Test Product'
      };

      const mockProduct = { id: 1, ...updateData };
      (ProductsAPI.update as jest.Mock).mockResolvedValue(mockProduct);
      (ProductsAPI.getAll as jest.Mock).mockResolvedValue([mockProduct]);

      const result = await clientState.updateProduct(1, updateData);

      expect(ProductsAPI.update).toHaveBeenCalledWith(1, updateData);
      expect(ProductsAPI.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });

    test('should use mock logic when in mock mode', async () => {
      (shouldUseMockData as jest.Mock).mockReturnValue(true);

      // Add a product first
      const productData = {
        part_number: 'TEST-001',
        description: 'Test Product',
        category: 'MEAT',
        type: 'RM',
        uom: 'kg'
      };

      await clientState.addProduct(productData);
      const product = clientState.products[0];

      // Update the product
      const updateData = {
        description: 'Updated Test Product'
      };

      const result = await clientState.updateProduct(product.id, updateData);

      expect(ProductsAPI.update).not.toHaveBeenCalled();
      expect(result?.description).toBe('Updated Test Product');
    });

    test('should handle BOM updates correctly', async () => {
      (shouldUseMockData as jest.Mock).mockReturnValue(true);

      // Add a product with BOM first
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
            one_to_one: false
          }
        ]
      };

      await clientState.addProduct(productData);
      const product = clientState.products[0];

      // Update with new BOM
      const updateData = {
        bom_items: [
          {
            material_id: 1,
            quantity: 2.0,
            uom: 'kg',
            one_to_one: true,
            is_optional: true,
            is_phantom: false,
            scrap_std_pct: 10.0,
            unit_cost_std: 30.00
          }
        ]
      };

      const result = await clientState.updateProduct(product.id, updateData);

      expect(result?.activeBom?.bomItems).toHaveLength(1);
      expect(result?.activeBom?.bomItems[0].quantity).toBe('2.0');
      expect(result?.activeBom?.bomItems[0].one_to_one).toBe(true);
      expect(result?.activeBom?.bomItems[0].is_optional).toBe(true);
      expect(result?.activeBom?.bomItems[0].scrap_std_pct).toBe(10.0);
    });
  });

  describe('BOM Component Handling', () => {
    test('should handle all BOM component fields', async () => {
      (shouldUseMockData as jest.Mock).mockReturnValue(true);

      const productData = {
        part_number: 'TEST-001',
        description: 'Test Product',
        category: 'PROCESS',
        type: 'PR',
        uom: 'kg',
        bom_items: [
          {
            material_id: 1,
            quantity: 1.5,
            uom: 'kg',
            sequence: 1,
            priority: 1,
            production_lines: ['Line 1', 'Line 2'],
            scrap_std_pct: 5.5,
            is_optional: true,
            is_phantom: false,
            one_to_one: true,
            unit_cost_std: 25.75
          }
        ]
      };

      const result = await clientState.addProduct(productData);

      expect(result.activeBom?.bomItems[0]).toEqual(
        expect.objectContaining({
          material_id: 1,
          quantity: '1.5',
          uom: 'kg',
          sequence: 1,
          priority: 1,
          production_lines: ['Line 1', 'Line 2'],
          scrap_std_pct: 5.5,
          is_optional: true,
          is_phantom: false,
          one_to_one: true,
          unit_cost_std: 25.75
        })
      );
    });

    test('should handle empty BOM items', async () => {
      (shouldUseMockData as jest.Mock).mockReturnValue(true);

      const productData = {
        part_number: 'TEST-001',
        description: 'Test Product',
        category: 'MEAT',
        type: 'RM',
        uom: 'kg',
        bom_items: []
      };

      const result = await clientState.addProduct(productData);

      expect(result.activeBom).toBeNull();
    });

    test('should handle undefined BOM items', async () => {
      (shouldUseMockData as jest.Mock).mockReturnValue(true);

      const productData = {
        part_number: 'TEST-001',
        description: 'Test Product',
        category: 'MEAT',
        type: 'RM',
        uom: 'kg'
        // bom_items is undefined
      };

      const result = await clientState.addProduct(productData);

      expect(result.activeBom).toBeNull();
    });
  });

  describe('Product Categories', () => {
    test('should handle MEAT products', async () => {
      (shouldUseMockData as jest.Mock).mockReturnValue(true);

      const productData = {
        part_number: 'MEAT-001',
        description: 'Premium Beef',
        category: 'MEAT',
        type: 'RM',
        uom: 'kg',
        subtype: 'RM_MEAT',
        expiry_policy: 'FROM_DELIVERY_DATE',
        shelf_life_days: 7,
        preferred_supplier_id: 1
      };

      const result = await clientState.addProduct(productData);

      expect(result.category).toBe('MEAT');
      expect(result.type).toBe('RM');
      expect(result.subtype).toBe('RM_MEAT');
      expect(result.expiry_policy).toBe('FROM_DELIVERY_DATE');
    });

    test('should handle DRYGOODS products', async () => {
      (shouldUseMockData as jest.Mock).mockReturnValue(true);

      const productData = {
        part_number: 'DG-001',
        description: 'Premium Flour',
        category: 'DRYGOODS',
        type: 'RM',
        uom: 'kg',
        subtype: 'DG_ING',
        expiry_policy: 'DAYS_STATIC',
        shelf_life_days: 365,
        preferred_supplier_id: 2
      };

      const result = await clientState.addProduct(productData);

      expect(result.category).toBe('DRYGOODS');
      expect(result.type).toBe('RM');
      expect(result.subtype).toBe('DG_ING');
    });

    test('should handle PROCESS products', async () => {
      (shouldUseMockData as jest.Mock).mockReturnValue(true);

      const productData = {
        part_number: 'PR-001',
        description: 'Processed Meat',
        category: 'PROCESS',
        type: 'PR',
        uom: 'kg',
        expiry_policy: 'FROM_CREATION_DATE',
        shelf_life_days: 5,
        production_lines: ['Line 1', 'Line 2']
      };

      const result = await clientState.addProduct(productData);

      expect(result.category).toBe('PROCESS');
      expect(result.type).toBe('PR');
      expect(result.expiry_policy).toBe('FROM_CREATION_DATE');
      expect(result.production_lines).toEqual(['Line 1', 'Line 2']);
    });

    test('should handle FINISHED_GOODS products', async () => {
      (shouldUseMockData as jest.Mock).mockReturnValue(true);

      const productData = {
        part_number: 'FG-001',
        description: 'Premium Sausage',
        category: 'FINISHED_GOODS',
        type: 'FG',
        uom: 'kg',
        rate: 100,
        production_lines: ['Line 1', 'Line 2']
      };

      const result = await clientState.addProduct(productData);

      expect(result.category).toBe('FINISHED_GOODS');
      expect(result.type).toBe('FG');
      expect(result.rate).toBe(100);
      expect(result.production_lines).toEqual(['Line 1', 'Line 2']);
    });
  });
});
