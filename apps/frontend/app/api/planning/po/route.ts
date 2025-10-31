// PO API Routes - Phase 1 Planning Module
// Handles CRUD operations for Purchase Orders

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { POHeader, POLine } from '@/lib/types';

// GET /api/planning/po - List all POs
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const supplier_id = searchParams.get('supplier_id');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('po_header')
      .select(`
        *,
        supplier:suppliers(*),
        po_lines:po_line(*, item:products(*))
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id);
    }
    
    if (search) {
      query = query.or(`number.ilike.%${search}%,snapshot_supplier_name.ilike.%${search}%`);
    }
    
    const { data: pos, error, count } = await query;
    
    if (error) {
      console.error('Error fetching POs:', error);
      return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
    }
    
    return NextResponse.json({
      data: pos,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('PO GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/planning/po - Create new PO
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const {
      supplier_id,
      currency = 'USD',
      exchange_rate,
      order_date,
      requested_delivery_date,
      promised_delivery_date,
      asn_ref,
      lines = []
    } = body;
    
    // Validate required fields
    if (!supplier_id || !order_date) {
      return NextResponse.json(
        { error: 'Missing required fields: supplier_id, order_date' },
        { status: 400 }
      );
    }
    
    // Generate PO number
    const { data: poNumber } = await supabase.rpc('generate_po_number');
    
    // Get supplier details for snapshot
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('name, vat_number, address')
      .eq('id', supplier_id)
      .single();
    
    // Create PO header
    const { data: poHeader, error: poError } = await supabase
      .from('po_header')
      .insert({
        number: poNumber,
        supplier_id,
        status: 'draft',
        currency,
        exchange_rate,
        order_date,
        requested_delivery_date,
        promised_delivery_date,
        snapshot_supplier_name: supplier?.name,
        snapshot_supplier_vat: supplier?.vat_number,
        snapshot_supplier_address: supplier?.address,
        asn_ref,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    
    if (poError) {
      console.error('Error creating PO header:', poError);
      return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 });
    }
    
    // Create PO lines if provided
    if (lines.length > 0) {
      const poLines = lines.map((line: any, index: number) => ({
        po_id: poHeader.id,
        line_no: index + 1,
        item_id: line.item_id,
        uom: line.uom,
        qty_ordered: line.qty_ordered,
        unit_price: line.unit_price,
        vat_rate: line.vat_rate || 0,
        requested_delivery_date: line.requested_delivery_date,
        promised_delivery_date: line.promised_delivery_date,
        default_location_id: line.default_location_id,
        note: line.note
      }));
      
      const { error: linesError } = await supabase
        .from('po_line')
        .insert(poLines);
      
      if (linesError) {
        console.error('Error creating PO lines:', linesError);
        // Rollback PO header
        await supabase.from('po_header').delete().eq('id', poHeader.id);
        return NextResponse.json({ error: 'Failed to create PO lines' }, { status: 500 });
      }
    }
    
    // Fetch complete PO with lines
    const { data: completePO } = await supabase
      .from('po_header')
      .select(`
        *,
        supplier:suppliers(*),
        po_lines:po_line(*, item:products(*))
      `)
      .eq('id', poHeader.id)
      .single();
    
    return NextResponse.json({
      message: 'Purchase order created successfully',
      data: completePO
    }, { status: 201 });
    
  } catch (error) {
    console.error('PO POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
