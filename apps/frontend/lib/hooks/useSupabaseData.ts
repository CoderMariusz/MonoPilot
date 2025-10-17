'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import type { WorkOrder, PurchaseOrder, TransferOrder, Product, GRN, LicensePlate } from '../types';

// Hook to load Work Orders from Supabase
export function useSupabaseWorkOrders() {
  const [data, setData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
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
  }, []);

  return { data, loading, error };
}

// Hook to load Purchase Orders from Supabase
export function useSupabasePurchaseOrders() {
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: pos, error } = await supabase
          .from('purchase_orders')
          .select(`
            *,
            supplier:suppliers(*),
            items:purchase_order_items(*)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped: PurchaseOrder[] = (pos || []).map(po => ({
          id: po.id,
          po_number: po.po_number,
          supplier_id: po.supplier_id,
          warehouse_id: po.warehouse_id,
          status: po.status,
          request_delivery_date: po.request_delivery_date,
          expected_delivery_date: po.expected_delivery_date,
          due_date: po.due_date,
          order_date: po.request_delivery_date, // Use request_delivery_date as order_date
          expected_delivery: po.expected_delivery_date, // Use expected_delivery_date as expected_delivery
          currency: po.currency || 'USD',
          exchange_rate: po.exchange_rate,
          total_amount: 0, // TODO: Calculate from items
          buyer_id: po.buyer_id,
          buyer_name: po.buyer_name,
          notes: po.notes,
          created_at: po.created_at,
          updated_at: po.updated_at,
          supplier: po.supplier ? {
            id: po.supplier.id,
            name: po.supplier.name,
            legal_name: po.supplier.legal_name,
            vat_number: po.supplier.vat_number,
            country: po.supplier.country,
            currency: po.supplier.currency,
            is_active: po.supplier.is_active,
            created_at: po.supplier.created_at || new Date().toISOString(),
            updated_at: po.supplier.updated_at || new Date().toISOString()
          } : undefined,
          items: (po.items || []).map((item: any) => ({
            id: item.id,
            po_id: item.po_id,
            product_id: item.product_id,
            uom: item.uom,
            quantity_ordered: parseFloat(item.quantity_ordered),
            quantity_received: parseFloat(item.quantity_received || 0),
            unit_price: parseFloat(item.unit_price),
            confirmed: item.confirmed
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
  }, []);

  return { data, loading, error };
}

// Hook to load Transfer Orders from Supabase
export function useSupabaseTransferOrders() {
  const [data, setData] = useState<TransferOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: tos, error } = await supabase
          .from('transfer_orders')
          .select(`
            *,
            from_warehouse:from_warehouse_id(code, name),
            to_warehouse:to_warehouse_id(code, name),
            items:transfer_order_items(*)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped: TransferOrder[] = (tos || []).map(to => ({
          id: to.id,
          to_number: to.to_number,
          from_warehouse_id: to.from_warehouse_id,
          to_warehouse_id: to.to_warehouse_id,
          status: to.status,
          planned_ship_date: to.planned_ship_date,
          actual_ship_date: to.actual_ship_date,
          transfer_date: to.planned_ship_date, // Use planned_ship_date as transfer_date
          planned_receive_date: to.planned_receive_date,
          actual_receive_date: to.actual_receive_date,
          created_at: to.created_at,
          updated_at: to.updated_at,
          items: (to.items || []).map((item: any) => ({
            id: item.id,
            to_id: item.to_id,
            product_id: item.product_id,
            uom: item.uom,
            quantity: parseFloat(item.quantity)
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
    }

    loadData();
  }, []);

  return { data, loading, error };
}

