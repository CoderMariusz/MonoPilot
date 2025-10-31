// TO API Routes - Phase 1 Planning Module
// Handles CRUD operations for Transfer Orders

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/planning/to - List all TOs
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const from_wh_id = searchParams.get('from_wh_id');
    const to_wh_id = searchParams.get('to_wh_id');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('to_header')
      .select(`
        *,
        from_warehouse:warehouses!to_header_from_wh_id_fkey(*),
        to_warehouse:warehouses!to_header_to_wh_id_fkey(*),
        to_lines:to_line(*, item:products(*), from_location:locations(*), to_location:locations(*))
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (from_wh_id) {
      query = query.eq('from_wh_id', from_wh_id);
    }
    
    if (to_wh_id) {
      query = query.eq('to_wh_id', to_wh_id);
    }
    
    if (search) {
      query = query.or(`number.ilike.%${search}%`);
    }
    
    const { data: tos, error, count } = await query;
    
    if (error) {
      console.error('Error fetching TOs:', error);
      return NextResponse.json({ error: 'Failed to fetch transfer orders' }, { status: 500 });
    }
    
    return NextResponse.json({
      data: tos,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('TO GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/planning/to - Create new TO
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const {
      from_wh_id,
      to_wh_id,
      requested_date,
      lines = []
    } = body;
    
    // Validate required fields
    if (!from_wh_id || !to_wh_id) {
      return NextResponse.json(
        { error: 'Missing required fields: from_wh_id, to_wh_id' },
        { status: 400 }
      );
    }
    
    // Generate TO number
    const { data: toNumber } = await supabase.rpc('generate_to_number');
    
    // Create TO header
    const { data: toHeader, error: toError } = await supabase
      .from('to_header')
      .insert({
        number: toNumber,
        status: 'draft',
        from_wh_id,
        to_wh_id,
        requested_date,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    
    if (toError) {
      console.error('Error creating TO header:', toError);
      return NextResponse.json({ error: 'Failed to create transfer order' }, { status: 500 });
    }
    
    // Create TO lines if provided
    if (lines.length > 0) {
      const toLines = lines.map((line: any, index: number) => ({
        to_id: toHeader.id,
        line_no: index + 1,
        item_id: line.item_id,
        uom: line.uom,
        qty_planned: line.qty_planned,
        from_location_id: line.from_location_id,
        to_location_id: line.to_location_id,
        scan_required: line.scan_required || false,
        approved_line: line.approved_line || false
      }));
      
      const { error: linesError } = await supabase
        .from('to_line')
        .insert(toLines);
      
      if (linesError) {
        console.error('Error creating TO lines:', linesError);
        // Rollback TO header
        await supabase.from('to_header').delete().eq('id', toHeader.id);
        return NextResponse.json({ error: 'Failed to create TO lines' }, { status: 500 });
      }
    }
    
    // Fetch complete TO with lines
    const { data: completeTO } = await supabase
      .from('to_header')
      .select(`
        *,
        from_warehouse:warehouses!to_header_from_wh_id_fkey(*),
        to_warehouse:warehouses!to_header_to_wh_id_fkey(*),
        to_lines:to_line(*, item:products(*), from_location:locations(*), to_location:locations(*))
      `)
      .eq('id', toHeader.id)
      .single();
    
    return NextResponse.json({
      message: 'Transfer order created successfully',
      data: completeTO
    }, { status: 201 });
    
  } catch (error) {
    console.error('TO POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
