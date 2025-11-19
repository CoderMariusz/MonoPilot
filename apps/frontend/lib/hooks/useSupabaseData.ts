'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase/client-browser';
import type { WorkOrder, PurchaseOrder, TransferOrder, Product, GRN, LicensePlate } from '../types';
import { useAuth } from '../auth/AuthContext';

// Hook to load Work Orders from Supabase
export function useSupabaseWorkOrders() {
  const [data, setData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to be ready before fetching
    if (authLoading) {
      console.log('[useSupabaseWorkOrders] Auth still loading, waiting...');
      return;
    }

    async function loadData() {
      try {
        console.log('[useSupabaseWorkOrders] Auth ready, fetching work orders...');
        const { data: workOrders, error } = await supabase
          .from('work_orders')
          .select(`
            *,
            product:products(*)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped: WorkOrder[] = (workOrders || []).map(wo => ({
          id: wo.id.toString(),
          wo_number: wo.wo_number,
          product_id: wo.product_id,
          bom_id: wo.bom_id,
          quantity: parseFloat(wo.quantity),
          uom: wo.uom,
          priority: wo.priority || 3,
          status: wo.status,
          scheduled_start: wo.scheduled_start,
          scheduled_end: wo.scheduled_end,
          due_date: wo.scheduled_end, // Use scheduled_end as due_date
          actual_start: wo.actual_start,
          actual_end: wo.actual_end,
          machine_id: wo.machine_id,
          line_number: wo.line_number,
          created_at: wo.created_at,
          updated_at: wo.updated_at,
          product: wo.product ? {
            id: wo.product.id.toString(),
            part_number: wo.product.part_number,
            description: wo.product.description,
            type: wo.product.type,
            uom: wo.product.uom,
            expiry_policy: wo.product.expiry_policy,
            shelf_life_days: wo.product.shelf_life_days,
            production_lines: wo.product.production_lines || [],
            is_active: wo.product.is_active,
            created_at: wo.product.created_at,
            updated_at: wo.product.updated_at
          } : undefined
        }));

        setData(mapped);
        setError(null);
      } catch (err: any) {
        console.error('Error loading work orders:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authLoading]);

  return { data, loading, error };
}

// Hook to load Purchase Orders from Supabase using new schema
export function useSupabasePurchaseOrders() {
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to be ready before fetching
    if (authLoading) {
      console.log('[useSupabasePurchaseOrders] Auth still loading, waiting...');
      return;
    }

    async function loadData() {
      try {
        console.log('[useSupabasePurchaseOrders] Auth ready, fetching purchase orders...');
        // Use new po_header table
        const { data: pos, error } = await supabase
          .from('po_header')
          .select(`
            *,
            supplier:suppliers(*),
            warehouse:warehouses(id, code, name),
            po_lines:po_line(*, item:products(*))
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Map to PurchaseOrder for backward compatibility
        const mapped: PurchaseOrder[] = (pos || []).map(po => ({
          id: po.id,
          number: po.number,
          po_number: po.number,
          supplier_id: po.supplier_id,
          warehouse_id: po.warehouse_id,
          status: po.status,
          requested_delivery_date: po.requested_delivery_date,
          promised_delivery_date: po.promised_delivery_date,
          request_delivery_date: po.requested_delivery_date,
          expected_delivery_date: po.promised_delivery_date,
          due_date: po.promised_delivery_date,
          order_date: po.order_date,
          expected_delivery: po.promised_delivery_date,
          currency: po.currency || 'USD',
          exchange_rate: po.exchange_rate,
          net_total: po.net_total || 0,
          vat_total: po.vat_total || 0,
          gross_total: po.gross_total || 0,
          total_amount: po.gross_total || 0,
          created_at: po.created_at,
          updated_at: po.updated_at,
          supplier: po.supplier ? {
            id: po.supplier.id,
            code: po.supplier.code,
            name: po.supplier.name,
            legal_name: po.supplier.legal_name,
            vat_number: po.supplier.vat_number,
            tax_number: po.supplier.tax_number,
            country: po.supplier.country,
            currency: po.supplier.currency,
            is_active: po.supplier.is_active,
            created_at: po.supplier.created_at || new Date().toISOString(),
            updated_at: po.supplier.updated_at || new Date().toISOString()
          } : undefined,
          warehouse: po.warehouse ? {
            id: po.warehouse.id,
            code: po.warehouse.code,
            name: po.warehouse.name,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } : undefined,
          purchase_order_items: (po.po_lines || []).map((line: any) => ({
            id: line.id,
            po_id: line.po_id,
            product_id: line.item_id,
            item_id: line.item_id,
            uom: line.uom,
            quantity: line.qty_ordered,
            quantity_ordered: parseFloat(line.qty_ordered),
            quantity_received: parseFloat(line.qty_received || 0),
            unit_price: parseFloat(line.unit_price),
            tax_rate: line.vat_rate || 0
          }))
        }));

        setData(mapped);
        setError(null);
      } catch (err: any) {
        console.error('Error loading purchase orders:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authLoading]);

  return { data, loading, error };
}

// Hook to load Transfer Orders from Supabase using new schema
export function useSupabaseTransferOrders() {
  const [data, setData] = useState<TransferOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loading: authLoading } = useAuth();

  const loadData = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    try {
      const { data: tos, error } = await supabase
        .from('to_header')
        .select(`
          *,
          from_warehouse:warehouses!to_header_from_wh_id_fkey(id, code, name),
          to_warehouse:warehouses!to_header_to_wh_id_fkey(id, code, name),
          to_lines:to_line(
            *,
            item:products(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: TransferOrder[] = (tos || []).map(to => ({
        id: to.id,
        number: to.number,
        to_number: to.number,
        from_wh_id: to.from_wh_id,
        to_wh_id: to.to_wh_id,
        from_warehouse_id: to.from_wh_id,
        to_warehouse_id: to.to_wh_id,
        status: to.status,
        requested_date: to.requested_date,
        planned_ship_date: to.planned_ship_date,
        planned_receive_date: to.planned_receive_date,
        actual_ship_date: to.actual_ship_date,
        actual_receive_date: to.actual_receive_date,
        transfer_date: to.planned_ship_date || to.requested_date,
        created_at: to.created_at,
        updated_at: to.updated_at,
        created_by: to.created_by,
        updated_by: to.updated_by,
        from_warehouse: to.from_warehouse || undefined,
        to_warehouse: to.to_warehouse || undefined,
        transfer_order_items: (to.to_lines || []).map((line: any) => ({
          id: line.id,
          to_id: line.to_id,
          product_id: line.item_id,
          item_id: line.item_id,
          uom: line.uom,
          quantity: parseFloat(line.qty_planned),
          quantity_planned: parseFloat(line.qty_planned),
          quantity_actual: parseFloat(line.qty_moved || 0),
          lp_id: line.lp_id ?? undefined,
          batch: line.batch ?? undefined,
          product: line.item || undefined,
        }))
      }));

      setData(mapped);
      setError(null);
    } catch (err: any) {
      console.error('Error loading transfer orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authLoading]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  return { data, loading, error, refetch: loadData };
}

