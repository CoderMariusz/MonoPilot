/**
 * Quality Holds Filter Options API
 * Story: 06.2 - Quality Holds CRUD (Enhancement)
 * 
 * Routes:
 * - GET /api/quality/holds/filters/reasons - Get distinct reasons from holds
 * - GET /api/quality/holds/filters/products - Get distinct products from holds
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthenticatedOrgId, handleError } from '@/lib/utils/api-helpers'

/**
 * GET /api/quality/holds/filters/reasons
 * Get list of distinct reasons from quality holds for filter dropdown
 * 
 * @response {200} Success
 *   @content {object}
 *   - reasons {string[]} Array of distinct reasons from holds
 * @response {401} Unauthorized
 * @response {500} Internal Server Error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { filter?: string } }
) {
  try {
    const auth = await getAuthenticatedOrgId()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const filterType = searchParams.get('type') || 'reasons'

    const supabase = await createServerSupabase()

    if (filterType === 'reasons') {
      // Get distinct reasons from quality_holds
      const { data: reasons, error } = await supabase
        .from('quality_holds')
        .select('reason')
        .eq('org_id', auth.orgId)
        .order('reason')

      if (error) {
        throw new Error(`Failed to fetch reasons: ${error.message}`)
      }

      // Extract unique reasons and filter out empty ones
      const uniqueReasons = Array.from(
        new Set(
          (reasons || [])
            .map(r => r.reason?.trim())
            .filter(r => r && r.length > 0)
        )
      ).sort()

      return NextResponse.json({ reasons: uniqueReasons })
    } else if (filterType === 'products') {
      try {
        // Get distinct products from holds via hold_items and license_plates
        const { data: products, error } = await supabase
          .from('quality_hold_items')
          .select(`
            reference_id,
            quality_holds!inner(org_id)
          `)
          .eq('reference_type', 'lp')
          .eq('quality_holds.org_id', auth.orgId)

        if (error) {
          console.warn('First query failed, trying simplified query:', error.message)
          // Fallback to simplified query
          return NextResponse.json({ products: [] })
        }

        // Get LP details with product info
        if (!products || products.length === 0) {
          return NextResponse.json({ products: [] })
        }

        const lpIds = products.map(p => p.reference_id).filter(id => id)
        
        if (lpIds.length === 0) {
          return NextResponse.json({ products: [] })
        }

        const { data: lps, error: lpError } = await supabase
          .from('license_plates')
          .select(`
            id,
            product_id,
            product:products(id, product_code, product_name)
          `)
          .in('id', lpIds)

        if (lpError) {
          console.warn('Failed to fetch product data:', lpError.message)
          return NextResponse.json({ products: [] })
        }

        // Extract unique products
        const uniqueProducts = Array.from(
          new Set(
            (lps || [])
              .filter(lp => lp.product)
              .map(lp => JSON.stringify({
                id: (lp.product as any).id,
                code: (lp.product as any).product_code,
                name: (lp.product as any).product_name,
              }))
          )
        )
          .map(p => JSON.parse(p))
          .sort((a, b) => a.name.localeCompare(b.name))

        return NextResponse.json({ products: uniqueProducts })
      } catch (productError) {
        console.error('Error fetching products:', productError)
        return NextResponse.json({ products: [] })
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid filter type' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in GET /api/quality/holds/filters:', error)
    return handleError(error)
  }
}
