// GET /api/technical/dashboard/allergen-matrix - Allergen Matrix API (Story 2.24)
import { NextRequest, NextResponse } from 'next/server'
import { allergenMatrixQuerySchema } from '@/lib/validation/dashboard-schemas'
import { getAllergenMatrix } from '@/lib/services/dashboard-service'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id') || 'mock-org-id'

    const searchParams = request.nextUrl.searchParams
    const query = allergenMatrixQuerySchema.parse({
      product_types: searchParams.get('product_types')?.split(','),
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0')
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
