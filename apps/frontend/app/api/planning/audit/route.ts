// Audit API Route - Phase 1 Planning Module
// Handles audit logging for all planning operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/planning/audit - Get audit logs
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const entity = searchParams.get('entity');
    const entity_id = searchParams.get('entity_id');
    const action = searchParams.get('action');
    const actor_id = searchParams.get('actor_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('audit_log')
      .select(`
        *,
        actor:users(*)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (entity) {
      query = query.eq('entity', entity);
    }
    
    if (entity_id) {
      query = query.eq('entity_id', entity_id);
    }
    
    if (action) {
      query = query.eq('action', action);
    }
    
    if (actor_id) {
      query = query.eq('actor_id', actor_id);
    }
    
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    
    const { data: auditLogs, error, count } = await query;
    
    if (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
    
    return NextResponse.json({
      data: auditLogs,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('Audit GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/planning/audit - Create audit log entry
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const {
      entity,
      entity_id,
      action,
      before,
      after,
      actor_id
    } = body;
    
    // Validate required fields
    if (!entity || !entity_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: entity, entity_id, action' },
        { status: 400 }
      );
    }
    
    // Create audit log entry
    const { data: auditLog, error: auditError } = await supabase
      .from('audit_log')
      .insert({
        entity,
        entity_id,
        action,
        before,
        after,
        actor_id: actor_id || (await supabase.auth.getUser()).data.user?.id,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        actor:users(*)
      `)
      .single();
    
    if (auditError) {
      console.error('Error creating audit log:', auditError);
      return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'Audit log created successfully',
      data: auditLog
    }, { status: 201 });
    
  } catch (error) {
    console.error('Audit POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
