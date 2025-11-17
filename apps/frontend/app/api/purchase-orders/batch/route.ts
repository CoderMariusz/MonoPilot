/**
 * Batch Purchase Orders Creation API
 * POST /api/purchase-orders/batch
 *
 * Creates multiple purchase orders atomically in a single transaction.
 * Groups products by supplier and creates one PO per supplier.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface BatchPOInput {
  product_id: number;
  quantity: number;
  unit_price?: number;
  currency?: string;
  requested_delivery_date?: string;
  notes?: string;
  // Derived from product lookup (backend will populate)
  supplier_id?: number;
  uom?: string;
}

export interface BatchPOResult {
  success: boolean;
  created: number; // Number of PO headers created
  totalLines: number; // Number of PO lines created
  failed: number;
  purchaseOrders?: Array<{
    id: number;
    number: string;
    supplier_id: number;
    supplier_name?: string;
    lineCount: number;
  }>;
  errors?: Array<{ index: number; error: string }>;
  rollback?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { purchaseOrders, warehouse_id } = (await request.json()) as {
      purchaseOrders: BatchPOInput[];
      warehouse_id: number;
    };

    if (!purchaseOrders || !Array.isArray(purchaseOrders) || purchaseOrders.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: purchaseOrders array is required' },
        { status: 400 }
      );
    }

    if (!warehouse_id) {
      return NextResponse.json(
        { error: 'Invalid request: warehouse_id is required' },
        { status: 400 }
      );
    }

    if (purchaseOrders.length > 100) {
      return NextResponse.json(
        { error: 'Batch size limit exceeded: maximum 100 lines per request' },
        { status: 400 }
      );
    }

    // Validate all PO lines before creating any
    const validationErrors: Array<{ index: number; error: string }> = [];

    purchaseOrders.forEach((po, idx) => {
      // Required fields validation
      if (!po.product_id) {
        validationErrors.push({ index: idx, error: 'product_id is required' });
      }
      if (!po.quantity || po.quantity <= 0) {
        validationErrors.push({ index: idx, error: 'quantity must be > 0' });
      }

      // Optional fields validation
      if (po.unit_price !== undefined && po.unit_price < 0) {
        validationErrors.push({ index: idx, error: 'unit_price must be >= 0' });
      }

      if (po.requested_delivery_date) {
        const deliveryDate = new Date(po.requested_delivery_date);
        if (isNaN(deliveryDate.getTime())) {
          validationErrors.push({ index: idx, error: 'Invalid requested_delivery_date format' });
        }
      }
    });

    // If validation errors, return them without creating anything
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          created: 0,
          totalLines: 0,
          failed: purchaseOrders.length,
          errors: validationErrors,
        } as BatchPOResult,
        { status: 400 }
      );
    }

    // Create POs using RPC function that groups by supplier
    // This RPC will:
    // 1. Look up products to get supplier_id and uom
    // 2. Group by supplier_id
    // 3. Create one PO header per supplier
    // 4. Create PO lines for each product
    // 5. All in a single atomic transaction
    const { data: createdPOs, error: createError } = await supabase.rpc('batch_create_purchase_orders', {
      p_warehouse_id: warehouse_id,
      p_lines: purchaseOrders.map((po) => ({
        product_id: po.product_id,
        quantity: po.quantity,
        unit_price: po.unit_price || null,
        currency: po.currency || 'USD',
        requested_delivery_date: po.requested_delivery_date || null,
        notes: po.notes || null,
      })),
      p_created_by: user.id,
    });

    if (createError) {
      console.error('Batch PO creation failed:', createError);

      // Provide helpful error messages
      if (createError.message.includes('foreign key')) {
        return NextResponse.json(
          {
            success: false,
            created: 0,
            totalLines: 0,
            failed: purchaseOrders.length,
            errors: [
              {
                index: -1,
                error: 'Invalid reference: product_id, warehouse_id, or supplier not found',
              },
            ],
            rollback: true,
          } as BatchPOResult,
          { status: 400 }
        );
      }

      if (createError.message.includes('supplier')) {
        return NextResponse.json(
          {
            success: false,
            created: 0,
            totalLines: 0,
            failed: purchaseOrders.length,
            errors: [
              {
                index: -1,
                error: 'One or more products have no supplier assigned',
              },
            ],
            rollback: true,
          } as BatchPOResult,
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          created: 0,
          totalLines: 0,
          failed: purchaseOrders.length,
          errors: [{ index: -1, error: createError.message }],
          rollback: true,
        } as BatchPOResult,
        { status: 500 }
      );
    }

    // Success - all POs created
    return NextResponse.json(
      {
        success: true,
        created: createdPOs?.length || 0,
        totalLines: purchaseOrders.length,
        failed: 0,
        purchaseOrders: createdPOs || [],
      } as BatchPOResult,
      { status: 201 }
    );
  } catch (error) {
    console.error('Batch PO creation error:', error);
    return NextResponse.json(
      {
        success: false,
        created: 0,
        totalLines: 0,
        failed: -1,
        errors: [{ index: -1, error: error instanceof Error ? error.message : 'Unknown error' }],
      } as BatchPOResult,
      { status: 500 }
    );
  }
}
