import { NextRequest, NextResponse } from 'next/server'
import { calculateBOMYield } from '@/lib/services/bom-service'

/**
 * GET /api/technical/boms/:id/yield
 * FR-2.34: Calculate BOM yield (simple version)
 *
 * Query params:
 *   - quantity: Planned production quantity (default: 1)
 *
 * Returns:
 *   - plannedQuantity: Input quantity
 *   - yieldPercent: BOM yield percentage
 *   - actualQuantity: Expected output after waste
 *   - wasteQuantity: Expected waste amount
 */
export async function GET(request: NextRequest) {
  // Extract dynamic param `id` from the request pathname (route: /api/technical/boms/:id/yield)
  const pathSegments = request.nextUrl.pathname.split('/').filter(Boolean)
  const id = pathSegments[pathSegments.length - 2]
  try {
    const searchParams = request.nextUrl.searchParams
    const quantity = parseFloat(searchParams.get('quantity') || '1')

    // Validate quantity
    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: 'Invalid quantity parameter. Must be a positive number.' },
        { status: 400 }
      )
    }

    // Calculate yield
    const result = await calculateBOMYield(id, quantity)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error calculating BOM yield:', error)

    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch BOM')) {
        return NextResponse.json(
          { error: 'BOM not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
