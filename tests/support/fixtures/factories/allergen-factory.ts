import { faker } from '@faker-js/faker';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Allergen {
  id?: string;
  org_id: string;
  code: string;
  name: string;
  is_major: boolean;
  is_custom: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductAllergen {
  product_id: string;
  allergen_id: string;
  relation_type: 'contains' | 'may_contain';
  org_id: string;
  created_by?: string | null;
  created_at?: string;
}

// EU 14 Major Allergens (Regulation EU 1169/2011)
export const EU_MAJOR_ALLERGENS = [
  { code: 'GLUTEN', name: 'Cereals containing gluten' },
  { code: 'CRUSTACEANS', name: 'Crustaceans' },
  { code: 'EGGS', name: 'Eggs' },
  { code: 'FISH', name: 'Fish' },
  { code: 'PEANUTS', name: 'Peanuts' },
  { code: 'SOYBEANS', name: 'Soybeans' },
  { code: 'MILK', name: 'Milk' },
  { code: 'NUTS', name: 'Tree nuts' },
  { code: 'CELERY', name: 'Celery' },
  { code: 'MUSTARD', name: 'Mustard' },
  { code: 'SESAME', name: 'Sesame seeds' },
  { code: 'SULPHITES', name: 'Sulphur dioxide and sulphites' },
  { code: 'LUPIN', name: 'Lupin' },
  { code: 'MOLLUSCS', name: 'Molluscs' },
];

/**
 * AllergenFactory - creates test allergens for Epic 2 tests.
 *
 * Features:
 * - Pre-defined EU 14 major allergens
 * - Support for custom allergens
 * - Product-allergen relationships (contains/may_contain)
 * - Tracks created allergens for automatic cleanup
 */
export class AllergenFactory {
  private createdAllergens: string[] = [];
  private createdProductAllergens: Array<{ product_id: string; allergen_id: string; relation_type: string }> = [];
  private sequence = 0;

  /**
   * Create a custom allergen
   */
  async createAllergen(overrides: Partial<Allergen> = {}): Promise<Allergen> {
    this.sequence++;

    const allergen: Omit<Allergen, 'id' | 'created_at' | 'updated_at'> = {
      org_id: process.env.TEST_ORG_ID || '',
      code: `CUSTOM-${this.sequence.toString().padStart(3, '0')}`,
      name: faker.commerce.productMaterial() + ' allergen',
      is_major: false,
      is_custom: true,
      ...overrides,
    };

    const { data, error } = await supabase
      .from('allergens')
      .insert(allergen)
      .select()
      .single();

    if (error) throw new Error(`AllergenFactory: ${error.message}`);

    this.createdAllergens.push(data.id);
    return data;
  }

  /**
   * Create an EU major allergen (from predefined list)
   */
  async createMajorAllergen(code: string): Promise<Allergen> {
    const euAllergen = EU_MAJOR_ALLERGENS.find(a => a.code === code);
    if (!euAllergen) {
      throw new Error(`AllergenFactory: Unknown EU allergen code: ${code}`);
    }

    return this.createAllergen({
      code: euAllergen.code,
      name: euAllergen.name,
      is_major: true,
      is_custom: false,
    });
  }

  /**
   * Create all 14 EU major allergens
   */
  async createAllMajorAllergens(): Promise<Allergen[]> {
    const allergens: Allergen[] = [];
    for (const eu of EU_MAJOR_ALLERGENS) {
      const allergen = await this.createAllergen({
        code: eu.code,
        name: eu.name,
        is_major: true,
        is_custom: false,
      });
      allergens.push(allergen);
    }
    return allergens;
  }

  /**
   * Assign an allergen to a product
   */
  async assignToProduct(
    productId: string,
    allergenId: string,
    relationType: 'contains' | 'may_contain',
    userId?: string
  ): Promise<ProductAllergen> {
    const assignment: ProductAllergen = {
      product_id: productId,
      allergen_id: allergenId,
      relation_type: relationType,
      org_id: process.env.TEST_ORG_ID || '',
      created_by: userId || null,
    };

    const { data, error } = await supabase
      .from('product_allergens')
      .insert(assignment)
      .select()
      .single();

    if (error) throw new Error(`AllergenFactory assignToProduct: ${error.message}`);

    this.createdProductAllergens.push({
      product_id: productId,
      allergen_id: allergenId,
      relation_type: relationType,
    });

    return data;
  }

  /**
   * Mark product as "contains" allergen
   */
  async productContains(productId: string, allergenId: string, userId?: string): Promise<ProductAllergen> {
    return this.assignToProduct(productId, allergenId, 'contains', userId);
  }

  /**
   * Mark product as "may contain" allergen
   */
  async productMayContain(productId: string, allergenId: string, userId?: string): Promise<ProductAllergen> {
    return this.assignToProduct(productId, allergenId, 'may_contain', userId);
  }

  /**
   * Get or create a specific major allergen
   */
  async getOrCreateMajorAllergen(code: string): Promise<Allergen> {
    // Check if already exists in org
    const { data: existing } = await supabase
      .from('allergens')
      .select()
      .eq('org_id', process.env.TEST_ORG_ID || '')
      .eq('code', code)
      .single();

    if (existing) return existing;

    return this.createMajorAllergen(code);
  }

  /**
   * Cleanup all created allergens and assignments
   */
  async cleanup(): Promise<void> {
    // Delete product-allergen assignments first
    for (const pa of this.createdProductAllergens) {
      const { error } = await supabase
        .from('product_allergens')
        .delete()
        .eq('product_id', pa.product_id)
        .eq('allergen_id', pa.allergen_id)
        .eq('relation_type', pa.relation_type);

      if (error) {
        console.error(`[AllergenFactory] Assignment cleanup error: ${error.message}`);
      }
    }

    // Delete allergens
    if (this.createdAllergens.length > 0) {
      const { error } = await supabase
        .from('allergens')
        .delete()
        .in('id', this.createdAllergens);

      if (error) {
        console.error(`[AllergenFactory] Allergen cleanup error: ${error.message}`);
      }
    }

    console.log(`[AllergenFactory] Cleanup: ${this.createdAllergens.length} allergens, ${this.createdProductAllergens.length} assignments removed`);
    this.createdAllergens = [];
    this.createdProductAllergens = [];
    this.sequence = 0;
  }

  getCreatedAllergenIds(): string[] {
    return [...this.createdAllergens];
  }
}
