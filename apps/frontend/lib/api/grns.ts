/**
 * GRNs (Goods Receipt Notes) API
 * Story 1.7.1 - Single-Screen Scanner
 *
 * Handles GRN creation from ASN receiving workflow.
 */

import { supabase } from '../supabase/client';
import type { GRN } from '../types';

export interface CreateGRNData {
  asn_id: number;
  po_id: number;
  warehouse_id: number;
  received_by: string;
  received_at: string;
  status: 'completed' | 'partial' | 'pending';
  notes?: string;
}

export class GRNsAPI {
  /**
   * Create a new GRN from ASN receiving
   */
  static async create(data: CreateGRNData): Promise<GRN> {
    // Generate GRN number (format: GRN-YYYYMMDD-NNN)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    // Get last GRN number for today to determine sequence
    const todayStart = `${year}-${month}-${day}T00:00:00`;
    const { data: lastGRN } = await supabase
      .from('grns')
      .select('grn_number')
      .gte('created_at', todayStart)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let sequence = 1;
    if (lastGRN?.grn_number) {
      const match = lastGRN.grn_number.match(/GRN-\d{8}-(\d{3})/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }

    const grnNumber = `GRN-${year}${month}${day}-${String(sequence).padStart(3, '0')}`;

    // Create GRN
    const { data: grn, error } = await supabase
      .from('grns')
      .insert({
        asn_id: data.asn_id,
        po_id: data.po_id,
        grn_number: grnNumber,
        received_date: data.received_at,
        status: data.status,
        notes: data.notes,
        created_by: data.received_by,
      })
      .select()
      .single();

    if (error) {
      console.error('[GRNsAPI.create] Error:', error);
      throw new Error(`Failed to create GRN: ${error.message}`);
    }

    return grn as GRN;
  }

  /**
   * Get GRN by ID
   */
  static async getById(id: number): Promise<GRN | null> {
    const { data, error } = await supabase
      .from('grns')
      .select('*, po:purchase_orders(*), asn:asns(asn_number, status)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('[GRNsAPI.getById] Error:', error);
      throw new Error(`Failed to get GRN: ${error.message}`);
    }

    return data as GRN;
  }

  /**
   * Get all GRNs
   */
  static async getAll(): Promise<GRN[]> {
    const { data, error } = await supabase
      .from('grns')
      .select('*, po:purchase_orders(*), asn:asns(asn_number, status)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GRNsAPI.getAll] Error:', error);
      throw new Error(`Failed to get GRNs: ${error.message}`);
    }

    return data as GRN[];
  }
}
