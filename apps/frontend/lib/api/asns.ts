/**
 * ASNs API Client
 * EPIC-002 Scanner & Warehouse v2 - Phase 1: ASN & Receiving
 * 
 * Manages Advanced Shipping Notices (ASN) - pre-notifications of incoming shipments.
 * ASNs prefill receiving (GRN) with expected quantities, batches, and expiry dates.
 * 
 * @module api/asns
 */

import { supabase } from '../supabase/client';
import type { 
  ASN, 
  ASNItem, 
  CreateASNData, 
  UpdateASNData, 
  ASNForReceiving,
  ASNStatus 
} from '../types';

export const ASNsAPI = {
  /**
   * Get all ASNs with filtering, sorting, and relationships
   * @param filters Optional filters for status, supplier, date range
   * @returns Array of ASNs with supplier and items populated
   */
  async getAll(filters?: {
    status?: ASNStatus | ASNStatus[];
    supplier_id?: number;
    from_date?: string; // expected_arrival >= from_date
    to_date?: string; // expected_arrival <= to_date
    po_id?: number;
  }): Promise<ASN[]> {
    try {
      let query = supabase
        .from('asns')
        .select(`
          *,
          supplier:supplier_id(id, name, code, is_active),
          purchase_order:po_id(id, number, status),
          asn_items(
            *,
            product:product_id(id, code, name, uom)
          )
        `)
        .order('expected_arrival', { ascending: false });

      // Apply filters
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters?.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }

      if (filters?.from_date) {
        query = query.gte('expected_arrival', filters.from_date);
      }

      if (filters?.to_date) {
        query = query.lte('expected_arrival', filters.to_date);
      }

      if (filters?.po_id) {
        query = query.eq('po_id', filters.po_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching ASNs:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error in ASNsAPI.getAll():', error);
      throw error;
    }
  },

  /**
   * Get single ASN by ID with all relationships
   * @param id ASN ID
   * @returns ASN with supplier, PO, and items
   */
  async getById(id: number): Promise<ASN | null> {
    try {
      const { data, error } = await supabase
        .from('asns')
        .select(`
          *,
          supplier:supplier_id(id, name, code, email, phone, is_active),
          purchase_order:po_id(id, number, status, order_date),
          asn_items(
            *,
            product:product_id(id, code, name, uom, product_type, product_group)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Error fetching ASN by ID:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error in ASNsAPI.getById():', error);
      throw error;
    }
  },

  /**
   * Get ASN by ASN number
   * @param asnNumber ASN number (unique identifier)
   * @returns ASN or null if not found
   */
  async getByNumber(asnNumber: string): Promise<ASN | null> {
    try {
      const { data, error } = await supabase
        .from('asns')
        .select(`
          *,
          supplier:supplier_id(id, name, code),
          asn_items(
            *,
            product:product_id(id, code, name, uom)
          )
        `)
        .eq('asn_number', asnNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching ASN by number:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error in ASNsAPI.getByNumber():', error);
      throw error;
    }
  },

  /**
   * Get ASNs ready for receiving (submitted status)
   * Uses RPC function for optimized query
   * @returns Array of ASNs with summary info
   */
  async getForReceiving(): Promise<ASNForReceiving[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_asns_for_receiving');

      if (error) {
        console.error('Error fetching ASNs for receiving:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error in ASNsAPI.getForReceiving():', error);
      throw error;
    }
  },

  /**
   * Create new ASN with items
   * @param data ASN data with items
   * @returns Created ASN with ID
   */
  async create(data: CreateASNData): Promise<ASN> {
    try {
      // 1. Create ASN header
      const { data: asnHeader, error: asnError } = await supabase
        .from('asns')
        .insert({
          asn_number: data.asn_number,
          po_id: data.po_id || null,
          supplier_id: data.supplier_id,
          expected_arrival: data.expected_arrival,
          status: data.status || 'draft',
          notes: data.notes || null,
          attachments: data.attachments || null,
        })
        .select()
        .single();

      if (asnError) {
        console.error('Error creating ASN header:', asnError);
        throw new Error(asnError.message);
      }

      // 2. Create ASN items (if provided)
      if (data.asn_items && data.asn_items.length > 0) {
        const itemsToInsert = data.asn_items.map((item) => ({
          asn_id: asnHeader.id,
          product_id: item.product_id,
          quantity: item.quantity,
          uom: item.uom,
          batch: item.batch || null,
          expiry_date: item.expiry_date || null,
          lp_number: item.lp_number || null,
          notes: item.notes || null,
        }));

        const { error: itemsError } = await supabase
          .from('asn_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error creating ASN items:', itemsError);
          // Rollback ASN header
          await supabase.from('asns').delete().eq('id', asnHeader.id);
          throw new Error(itemsError.message);
        }
      }

      // 3. Fetch complete ASN with relationships
      const createdASN = await this.getById(asnHeader.id);
      if (!createdASN) {
        throw new Error('Failed to fetch created ASN');
      }

      return createdASN;
    } catch (error) {
      console.error('Error in ASNsAPI.create():', error);
      throw error;
    }
  },

  /**
   * Update ASN (header only, items updated separately)
   * @param id ASN ID
   * @param data Partial ASN data to update
   * @returns Updated ASN
   */
  async update(id: number, data: Partial<Omit<CreateASNData, 'asn_number' | 'asn_items'>> & { actual_arrival?: string }): Promise<ASN> {
    try {
      const updatePayload: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.expected_arrival !== undefined) updatePayload.expected_arrival = data.expected_arrival;
      if (data.actual_arrival !== undefined) updatePayload.actual_arrival = data.actual_arrival;
      if (data.status !== undefined) updatePayload.status = data.status;
      if (data.notes !== undefined) updatePayload.notes = data.notes;
      if (data.attachments !== undefined) updatePayload.attachments = data.attachments;

      const { data: updated, error } = await supabase
        .from('asns')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating ASN:', error);
        throw new Error(error.message);
      }

      // Fetch complete ASN with relationships
      const updatedASN = await this.getById(id);
      if (!updatedASN) {
        throw new Error('Failed to fetch updated ASN');
      }

      return updatedASN;
    } catch (error) {
      console.error('Error in ASNsAPI.update():', error);
      throw error;
    }
  },

  /**
   * Delete ASN (and cascade delete items)
   * @param id ASN ID
   */
  async delete(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('asns')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting ASN:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error in ASNsAPI.delete():', error);
      throw error;
    }
  },

  /**
   * Submit ASN (change status from draft to submitted)
   * @param id ASN ID
   * @returns Updated ASN
   */
  async submit(id: number): Promise<ASN> {
    try {
      return await this.update(id, { status: 'submitted' });
    } catch (error) {
      console.error('Error in ASNsAPI.submit():', error);
      throw error;
    }
  },

  /**
   * Mark ASN as received (set actual_arrival and status)
   * @param id ASN ID
   * @returns Updated ASN
   */
  async markReceived(id: number): Promise<ASN> {
    try {
      const now = new Date().toISOString();
      return await this.update(id, {
        status: 'received',
        actual_arrival: now,
      });
    } catch (error) {
      console.error('Error in ASNsAPI.markReceived():', error);
      throw error;
    }
  },

  /**
   * Cancel ASN
   * @param id ASN ID
   * @returns Updated ASN
   */
  async cancel(id: number): Promise<ASN> {
    try {
      return await this.update(id, { status: 'cancelled' });
    } catch (error) {
      console.error('Error in ASNsAPI.cancel():', error);
      throw error;
    }
  },

  /**
   * Generate ASN number (simple auto-increment)
   * Format: ASN-YYYY-NNN
   * @returns Generated ASN number
   */
  async generateASNNumber(): Promise<string> {
    try {
      const year = new Date().getFullYear();
      const prefix = `ASN-${year}-`;

      // Get max ASN number for this year
      const { data, error } = await supabase
        .from('asns')
        .select('asn_number')
        .like('asn_number', `${prefix}%`)
        .order('asn_number', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error generating ASN number:', error);
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        return `${prefix}001`;
      }

      // Extract number and increment
      const lastNumber = data[0].asn_number.replace(prefix, '');
      const nextNumber = (parseInt(lastNumber, 10) + 1).toString().padStart(3, '0');

      return `${prefix}${nextNumber}`;
    } catch (error) {
      console.error('Error in ASNsAPI.generateASNNumber():', error);
      throw error;
    }
  },

  // ============================================================================
  // ASN ITEMS CRUD (for editing individual items)
  // ============================================================================

  /**
   * Add item to existing ASN
   * @param asnId ASN ID
   * @param item Item data
   * @returns Created item
   */
  async addItem(asnId: number, item: Omit<CreateASNData['asn_items'][number], 'asn_id'>): Promise<ASNItem> {
    try {
      const { data, error } = await supabase
        .from('asn_items')
        .insert({
          asn_id: asnId,
          product_id: item.product_id,
          quantity: item.quantity,
          uom: item.uom,
          batch: item.batch || null,
          expiry_date: item.expiry_date || null,
          lp_number: item.lp_number || null,
          notes: item.notes || null,
        })
        .select(`
          *,
          product:product_id(id, code, name, uom)
        `)
        .single();

      if (error) {
        console.error('Error adding ASN item:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error in ASNsAPI.addItem():', error);
      throw error;
    }
  },

  /**
   * Update ASN item
   * @param itemId Item ID
   * @param updates Partial item data
   * @returns Updated item
   */
  async updateItem(itemId: number, updates: Partial<ASNItem>): Promise<ASNItem> {
    try {
      const { data, error } = await supabase
        .from('asn_items')
        .update({
          quantity: updates.quantity,
          uom: updates.uom,
          batch: updates.batch,
          expiry_date: updates.expiry_date,
          lp_number: updates.lp_number,
          notes: updates.notes,
        })
        .eq('id', itemId)
        .select(`
          *,
          product:product_id(id, code, name, uom)
        `)
        .single();

      if (error) {
        console.error('Error updating ASN item:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error in ASNsAPI.updateItem():', error);
      throw error;
    }
  },

  /**
   * Delete ASN item
   * @param itemId Item ID
   */
  async deleteItem(itemId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('asn_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting ASN item:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error in ASNsAPI.deleteItem():', error);
      throw error;
    }
  },
};
