/**
 * Warehouse Dashboard - Inventory KPIs Endpoint
 * GET /api/warehouse/dashboard/inventory-kpis
 *
 * Returns summary KPIs for inventory browser page header
 * Uses direct queries instead of RPC for reliability
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
    const today = new Date().toISOString().split('T')[0];
    const warningDate = new Date(Date.now() + expiryWarningDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Execute all queries in parallel using direct queries for reliability
    // (RPC function may have schema drift issues)
    const [totalResult, valueResult, expiringSoonResult, expiredResult] = await Promise.all([
      // 1. Total active LPs (not consumed)
      supabase
        .from('license_plates')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', org_id)
        .not('status', 'ilike', 'consumed'),

      // 2. Total inventory value - get LPs with product cost
      supabase
        .from('license_plates')
        .select('quantity, products!inner(cost_per_unit)')
        .eq('org_id', org_id)
        .not('status', 'ilike', 'consumed'),

      // 3. Expiring soon (within warning days, only available)
      supabase
        .from('license_plates')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', org_id)
        .ilike('status', 'available')
        .not('expiry_date', 'is', null)
        .gt('expiry_date', today)
        .lte('expiry_date', warningDate),

      // 4. Expired (past expiry, only available)
      supabase
        .from('license_plates')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', org_id)
        .ilike('status', 'available')
        .not('expiry_date', 'is', null)
        .lt('expiry_date', today),
    ]);

    // Calculate total value from the LP data
    let totalValue = 0;
    if (!valueResult.error && valueResult.data) {
      for (const lp of valueResult.data) {
        const qty = Number(lp.quantity) || 0;
        const cost = Number((lp.products as { cost_per_unit?: number })?.cost_per_unit) || 0;
        totalValue += qty * cost;
      }
    }

    // Build response with graceful fallbacks
    const kpis = {
      total_lps: totalResult.error ? 0 : (totalResult.count ?? 0),
      total_value: totalValue,
      expiring_soon: expiringSoonResult.error ? 0 : (expiringSoonResult.count ?? 0),
      expired: expiredResult.error ? 0 : (expiredResult.count ?? 0),
    };

    // Log any errors for debugging (but don't fail the request)
    if (totalResult.error) console.error('[inventory-kpis] total_lps error:', totalResult.error);
    if (valueResult.error) console.error('[inventory-kpis] value error:', valueResult.error);
    if (expiringSoonResult.error) console.error('[inventory-kpis] expiring_soon error:', expiringSoonResult.error);
    if (expiredResult.error) console.error('[inventory-kpis] expired error:', expiredResult.error);

    return NextResponse.json(kpis, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Unexpected error in inventory KPIs endpoint:', error);
    // Return zeros instead of 500 for graceful degradation
    return NextResponse.json(
      {
        total_lps: 0,
        total_value: 0,
        expiring_soon: 0,
        expired: 0,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=30',
        },
      }
    );
  }
}
