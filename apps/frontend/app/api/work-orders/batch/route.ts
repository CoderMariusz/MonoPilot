/**
 * Batch Work Orders Creation API
 * POST /api/work-orders/batch
 *
 * Creates multiple work orders atomically in a single transaction.
 * All WOs succeed or all fail (rollback on any error).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface BatchWOInput {
  product_id: number;
  quantity: number;
  uom: string;
  line_id?: number;
  scheduled_start: string;
  scheduled_end?: string;
  due_date?: string;
  shift?: 'day' | 'night' | 'overtime';
  priority?: number;
  notes?: string;
  bom_id?: number;
}

export interface BatchWOResult {
  success: boolean;
  created: number;
  failed: number;
  workOrders?: Array<{ id: number; number: string; product_id: number }>;
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
    const { workOrders } = (await request.json()) as { workOrders: BatchWOInput[] };

    if (!workOrders || !Array.isArray(workOrders) || workOrders.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: workOrders array is required' },
        { status: 400 }
      );
    }

    if (workOrders.length > 100) {
      return NextResponse.json(
        { error: 'Batch size limit exceeded: maximum 100 work orders per request' },
        { status: 400 }
      );
    }

    // Validate all WOs before creating any
    const validationErrors: Array<{ index: number; error: string }> = [];

    workOrders.forEach((wo, idx) => {
      // Required fields validation
      if (!wo.product_id) {
        validationErrors.push({ index: idx, error: 'product_id is required' });
      }
      if (!wo.quantity || wo.quantity <= 0) {
        validationErrors.push({ index: idx, error: 'quantity must be > 0' });
      }
      if (!wo.uom) {
        validationErrors.push({ index: idx, error: 'uom is required' });
      }
      if (!wo.scheduled_start) {
        validationErrors.push({ index: idx, error: 'scheduled_start is required' });
      }

      // Date validation
      if (wo.scheduled_start) {
        const startDate = new Date(wo.scheduled_start);
        if (isNaN(startDate.getTime())) {
          validationErrors.push({ index: idx, error: 'Invalid scheduled_start date format' });
        }
      }

      if (wo.due_date) {
        const dueDate = new Date(wo.due_date);
        if (isNaN(dueDate.getTime())) {
          validationErrors.push({ index: idx, error: 'Invalid due_date format' });
        }
      }
    });

    // If validation errors, return them without creating anything
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          created: 0,
          failed: workOrders.length,
          errors: validationErrors,
        } as BatchWOResult,
        { status: 400 }
      );
    }

    // Create all WOs in a transaction using RPC
    // Note: Supabase doesn't support multi-statement transactions via REST API,
    // so we use a database function for atomicity
    const { data: createdWOs, error: createError } = await supabase.rpc('batch_create_work_orders', {
      p_work_orders: workOrders.map((wo, idx) => ({
        product_id: wo.product_id,
        quantity: wo.quantity,
        uom: wo.uom,
        line_id: wo.line_id || null,
        scheduled_start: wo.scheduled_start,
        scheduled_end: wo.scheduled_end || null,
        due_date: wo.due_date || null,
        shift: wo.shift || 'day',
        priority: wo.priority !== undefined ? wo.priority : idx + 1, // Default priority = row order
        notes: wo.notes || null,
        bom_id: wo.bom_id || null,
        status: 'planned',
        created_by: user.id,
      })),
    });

    if (createError) {
      console.error('Batch WO creation failed:', createError);

      // If error is due to database constraint, provide helpful message
      if (createError.message.includes('foreign key')) {
        return NextResponse.json(
          {
            success: false,
            created: 0,
            failed: workOrders.length,
            errors: [{ index: -1, error: 'Invalid reference: product_id, line_id, or bom_id not found' }],
            rollback: true,
          } as BatchWOResult,
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          created: 0,
          failed: workOrders.length,
          errors: [{ index: -1, error: createError.message }],
          rollback: true,
        } as BatchWOResult,
        { status: 500 }
      );
    }

    // Success - all WOs created
    return NextResponse.json(
      {
        success: true,
        created: createdWOs?.length || workOrders.length,
        failed: 0,
        workOrders: createdWOs || [],
      } as BatchWOResult,
      { status: 201 }
    );
  } catch (error) {
    console.error('Batch WO creation error:', error);
    return NextResponse.json(
      {
        success: false,
        created: 0,
        failed: -1,
        errors: [{ index: -1, error: error instanceof Error ? error.message : 'Unknown error' }],
      } as BatchWOResult,
      { status: 500 }
    );
  }
}
