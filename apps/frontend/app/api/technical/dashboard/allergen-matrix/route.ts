// GET /api/technical/dashboard/allergen-matrix - Allergen Matrix API (Story 2.24)
import { NextRequest, NextResponse } from 'next/server'
import { allergenMatrixQuerySchema } from '@/lib/validation/dashboard-schemas'
import { getAllergenMatrix } from '@/lib/services/dashboard-service'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || 'mock-org-id'

    const searchParams = request.nextUrl.searchParams

    // Parse product_types properly
    const productTypesParam = searchParams.get('product_types')
    const productTypes = productTypesParam
      ? productTypesParam.split(',').filter(t => ['RM', 'WIP', 'FG'].includes(t)) as ('RM' | 'WIP' | 'FG')[]
      : undefined

    const query = allergenMatrixQuerySchema.parse({
      product_types: productTypes,
      allergen_ids: searchParams.get('allergen_ids')?.split(',').filter(Boolean),
      allergen_count_min: searchParams.get('allergen_count_min')
        ? parseInt(searchParams.get('allergen_count_min')!)
        : undefined,
      allergen_count_max: searchParams.get('allergen_count_max')
        ? parseInt(searchParams.get('allergen_count_max')!)
        : undefined,
      has_allergens: (searchParams.get('has_allergens') as 'all' | 'with' | 'without' | 'missing') || 'all',
      sort_by: (searchParams.get('sort_by') as 'code' | 'name' | 'allergen_count' | 'type') || 'code',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'asc',
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '50')
    })

    const result = await getAllergenMatrix(orgId, query)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
