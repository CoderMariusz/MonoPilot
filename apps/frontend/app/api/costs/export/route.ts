/**
 * Cost Data Export API Route - EPIC-003 Phase 1
 * Export cost data to Excel format
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/costs/export?type=materials&product_id=123
 * Export cost data to Excel (returns blob)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { error: 'Missing required parameter: type (materials, bom, prices, wo_variance)' },
        { status: 400 }
      );
    }

    let data: any[] = [];
    let filename = 'cost-export.csv';

    switch (type) {
      case 'materials': {
        filename = 'material-costs.csv';
        const productId = searchParams.get('product_id');

        let query = supabase
          .from('material_costs')
          .select(`
            *,
            product:products(name, sku)
          `)
          .order('effective_from', { ascending: false });

        if (productId) {
          query = query.eq('product_id', productId);
        }

        const { data: costs, error } = await query;
        if (error) throw error;
        data = costs || [];
        break;
      }

      case 'bom': {
        filename = 'bom-costs.csv';
        const bomId = searchParams.get('bom_id');

        let query = supabase
          .from('bom_costs')
          .select(`
            *,
            bom:boms(name, version, product_id, products(name, sku))
          `)
          .order('created_at', { ascending: false });

        if (bomId) {
          query = query.eq('bom_id', bomId);
        }

        const { data: bomCosts, error } = await query;
        if (error) throw error;
        data = bomCosts || [];
        break;
      }

      case 'prices': {
        filename = 'product-prices.csv';
        const productId = searchParams.get('product_id');

        let query = supabase
          .from('product_prices')
          .select(`
            *,
            product:products(name, sku)
          `)
          .order('effective_from', { ascending: false });

        if (productId) {
          query = query.eq('product_id', productId);
        }

        const { data: prices, error } = await query;
        if (error) throw error;
        data = prices || [];
        break;
      }

      case 'wo_variance': {
        filename = 'wo-cost-variance.csv';
        const status = searchParams.get('status');

        let query = supabase
          .from('wo_costs')
          .select(`
            *,
            work_order:work_orders(
              wo_number,
              status,
              qty_planned,
              qty_produced,
              products(name, sku)
            )
          `)
          .order('created_at', { ascending: false });

        const { data: woCosts, error } = await query;
        if (error) throw error;

        // Filter by status if provided
        data = status
          ? (woCosts || []).filter((wc: any) => wc.work_order?.status === status)
          : (woCosts || []);
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be: materials, bom, prices, or wo_variance' },
          { status: 400 }
        );
    }

    // Convert to CSV
    if (data.length === 0) {
      return NextResponse.json(
        { error: 'No data to export' },
        { status: 404 }
      );
    }

    // Simple CSV generation
    const headers = Object.keys(data[0]).filter(key => typeof data[0][key] !== 'object');
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      });
      csvRows.push(values.join(','));
    }

    const csv = csvRows.join('\n');

    // Return as CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Cost export GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
