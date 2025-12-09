import { faker } from '@faker-js/faker';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type ProductType =
  | 'Raw Material' | 'Semi-Finished' | 'Finished Good' | 'Packaging' | 'By-Product'
  | 'RM_MEAT' | 'DG_WEB' | 'DG_LABEL' | 'DG_BOX' | 'DG_ING' | 'DG_SAUCE' | 'DG_OTHER'
  | 'PR' | 'FG' | 'RM' | 'WIP' | 'PKG' | 'BP' | 'CUSTOM';

export interface Product {
  id?: string;
  code: string;
  name: string;
  type: ProductType;
  description?: string;
  category?: string;
  uom: string;
  version?: number;
  status?: 'active' | 'inactive' | 'obsolete';
  shelf_life_days?: number;
  min_stock_qty?: number;
  max_stock_qty?: number;
  reorder_point?: number;
  cost_per_unit?: number;
  org_id: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

/**
 * ProductFactory - creates test products for Epic 2 tests.
 *
 * Features:
 * - Generates realistic product data using Faker
 * - Tracks created products for automatic cleanup
 * - Supports all product types from DB schema
 * - Integrates with Supabase for product creation
 */
export class ProductFactory {
  private createdProducts: string[] = [];
  private sequence = 0;

  /**
   * Create a test product with optional field overrides
   */
  async createProduct(overrides: Partial<Product> = {}): Promise<Product> {
    this.sequence++;
    const typePrefix = this.getTypePrefix(overrides.type || 'Raw Material');

    const product: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
      code: `${typePrefix}-TEST-${this.sequence.toString().padStart(4, '0')}`,
      name: faker.commerce.productName(),
      type: 'Raw Material',
      description: faker.commerce.productDescription(),
      category: faker.commerce.department(),
      uom: faker.helpers.arrayElement(['KG', 'L', 'PCS', 'M', 'BOX']),
      version: 1.0,
      status: 'active',
      shelf_life_days: faker.number.int({ min: 7, max: 365 }),
      org_id: process.env.TEST_ORG_ID || '',
      ...overrides,
    };

    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw new Error(`ProductFactory: ${error.message}`);

    this.createdProducts.push(data.id);
    return data;
  }

  /**
   * Create multiple products at once
   */
  async createProducts(count: number, overrides: Partial<Product> = {}): Promise<Product[]> {
    const products: Product[] = [];
    for (let i = 0; i < count; i++) {
      products.push(await this.createProduct(overrides));
    }
    return products;
  }

  /**
   * Create a Raw Material product
   */
  async createRawMaterial(overrides: Partial<Product> = {}): Promise<Product> {
    return this.createProduct({ ...overrides, type: 'Raw Material' });
  }

  /**
   * Create a Semi-Finished product (intermediate)
   */
  async createSemiFinished(overrides: Partial<Product> = {}): Promise<Product> {
    return this.createProduct({ ...overrides, type: 'Semi-Finished' });
  }

  /**
   * Create a Finished Good product
   */
  async createFinishedGood(overrides: Partial<Product> = {}): Promise<Product> {
    return this.createProduct({ ...overrides, type: 'Finished Good' });
  }

  /**
   * Create a Packaging product
   */
  async createPackaging(overrides: Partial<Product> = {}): Promise<Product> {
    return this.createProduct({ ...overrides, type: 'Packaging' });
  }

  /**
   * Create a By-Product
   */
  async createByProduct(overrides: Partial<Product> = {}): Promise<Product> {
    return this.createProduct({ ...overrides, type: 'By-Product' });
  }

  /**
   * Create product with specific code (for immutability tests)
   */
  async createWithCode(code: string, overrides: Partial<Product> = {}): Promise<Product> {
    return this.createProduct({ ...overrides, code });
  }

  private getTypePrefix(type: ProductType): string {
    const prefixes: Record<string, string> = {
      'Raw Material': 'RM',
      'Semi-Finished': 'SF',
      'Finished Good': 'FG',
      'Packaging': 'PKG',
      'By-Product': 'BP',
    };
    return prefixes[type] || type.substring(0, 3).toUpperCase();
  }

  /**
   * Cleanup all created products (called automatically by fixture)
   */
  async cleanup(): Promise<void> {
    if (this.createdProducts.length === 0) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', this.createdProducts);

    if (error) {
      console.error(`[ProductFactory] Cleanup error: ${error.message}`);
    } else {
      console.log(`[ProductFactory] Cleanup: ${this.createdProducts.length} products removed`);
    }

    this.createdProducts = [];
    this.sequence = 0;
  }

  /**
   * Get IDs of all created products
   */
  getCreatedIds(): string[] {
    return [...this.createdProducts];
  }
}
