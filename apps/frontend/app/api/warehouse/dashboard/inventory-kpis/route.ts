/**
 * Warehouse Dashboard - Inventory KPIs Endpoint
 * GET /api/warehouse/dashboard/inventory-kpis
 *
 * Returns summary KPIs for inventory browser page header
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's org_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const org_id = userProfile.org_id;

    // Get warehouse settings for expiry_warning_days
    const { data: settings } = await supabase
      .from('warehouse_settings')
      .select('expiry_warning_days')
      .eq('org_id', org_id)
      .single();

    const expiryWarningDays = settings?.expiry_warning_days || 30;

    // Query inventory KPIs
    const { data: kpis, error: kpisError } = await supabase.rpc('get_inventory_kpis', {
      p_org_id: org_id,
      p_expiry_warning_days: expiryWarningDays,
    });

    if (kpisError) {
      console.error('KPIs query error:', kpisError);
      return NextResponse.json(
        { error: 'Failed to fetch inventory KPIs' },
        { status: 500 }
      );
    }

    // Return KPIs
    return NextResponse.json(
      {
        total_lps: kpis?.total_lps || 0,
        total_value: kpis?.total_value || 0,
        expiring_soon: kpis?.expiring_soon || 0,
        expired: kpis?.expired || 0,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in inventory KPIs endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
