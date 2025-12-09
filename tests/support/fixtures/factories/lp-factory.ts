import { faker } from '@faker-js/faker';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type LPStatus = 'available' | 'reserved' | 'consumed' | 'quarantine' | 'shipped' | 'merged' | 'deleted';

export interface LicensePlate {
  id?: string;
  org_id: string;
  lp_number: string;
  product_id: string;
  quantity: number;
  uom: string;
  status: LPStatus;
  location_id?: string | null;
  warehouse_id?: string | null;
  manufacturing_date?: string | null;
  expiry_date?: string | null;
  received_date?: string | null;
  supplier_batch_number?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  merged_into_lp_id?: string | null;
}

/**
 * LPFactory - STUB for Epic 2 testing.
 * Full implementation will be in Epic 5.
 *
 * This factory creates minimal LP records needed for
 * Epic 2 traceability tests (BOM → LP consumption).
 *
 * Features:
 * - Creates basic LP records for testing
 * - Supports common LP statuses
 * - Tracks created LPs for automatic cleanup
 */
export class LPFactory {
  private createdLPs: string[] = [];
  private sequence = 0;

  /**
   * Create a test license plate
   */
  async createLP(overrides: Partial<LicensePlate> = {}): Promise<LicensePlate> {
    this.sequence++;
    const year = new Date().getFullYear();

    const lp: Omit<LicensePlate, 'id' | 'created_at' | 'updated_at'> = {
      org_id: process.env.TEST_ORG_ID || '',
      lp_number: `LP-${year}-TEST-${this.sequence.toString().padStart(5, '0')}`,
      product_id: '', // Must be provided
      quantity: faker.number.float({ min: 1, max: 1000, fractionDigits: 2 }),
      uom: faker.helpers.arrayElement(['KG', 'L', 'PCS', 'BOX']),
      status: 'available',
      location_id: null,
      warehouse_id: null,
      manufacturing_date: new Date().toISOString().split('T')[0],
      expiry_date: null,
      received_date: new Date().toISOString().split('T')[0],
      supplier_batch_number: null,
      created_by: null,
      deleted_at: null,
      merged_into_lp_id: null,
      ...overrides,
    };

    if (!lp.product_id) {
      throw new Error('LPFactory: product_id is required');
    }

    const { data, error } = await supabase
      .from('license_plates')
      .insert(lp)
      .select()
      .single();

    if (error) throw new Error(`LPFactory: ${error.message}`);

    this.createdLPs.push(data.id);
    return data;
  }

  /**
   * Create LP with specific quantity (for BOM consumption tests)
   */
  async createWithQuantity(
    productId: string,
    quantity: number,
    uom: string = 'KG'
  ): Promise<LicensePlate> {
    return this.createLP({
      product_id: productId,
      quantity,
      uom,
    });
  }

  /**
   * Create LP with expiry date (for shelf life tests)
   */
  async createWithExpiry(
    productId: string,
    expiryDate: Date,
    quantity: number = 100
  ): Promise<LicensePlate> {
    return this.createLP({
      product_id: productId,
      quantity,
      expiry_date: expiryDate.toISOString().split('T')[0],
    });
  }

  /**
   * Create LP in quarantine status
   */
  async createQuarantined(
    productId: string,
    quantity: number = 100
  ): Promise<LicensePlate> {
    return this.createLP({
      product_id: productId,
      quantity,
      status: 'quarantine',
    });
  }

  /**
   * Create LP with supplier batch number (for traceability tests)
   */
  async createWithBatchNumber(
    productId: string,
    batchNumber: string,
    quantity: number = 100
  ): Promise<LicensePlate> {
    return this.createLP({
      product_id: productId,
      quantity,
      supplier_batch_number: batchNumber,
    });
  }

  /**
   * Create multiple LPs for a product
   */
  async createMultiple(
    productId: string,
    count: number,
    overrides: Partial<LicensePlate> = {}
  ): Promise<LicensePlate[]> {
    const lps: LicensePlate[] = [];
    for (let i = 0; i < count; i++) {
      lps.push(await this.createLP({ product_id: productId, ...overrides }));
    }
    return lps;
  }

  /**
   * Cleanup all created LPs
   */
  async cleanup(): Promise<void> {
    if (this.createdLPs.length === 0) return;

    const { error } = await supabase
      .from('license_plates')
      .delete()
      .in('id', this.createdLPs);

    if (error) {
      console.error(`[LPFactory] Cleanup error: ${error.message}`);
    } else {
      console.log(`[LPFactory] Cleanup: ${this.createdLPs.length} LPs removed`);
    }

    this.createdLPs = [];
    this.sequence = 0;
  }

  getCreatedLPIds(): string[] {
    return [...this.createdLPs];
  }
}
