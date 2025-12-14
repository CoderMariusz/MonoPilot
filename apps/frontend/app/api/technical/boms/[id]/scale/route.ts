import { NextRequest, NextResponse } from 'next/server'
import { scaleBOM } from '@/lib/services/bom-service'

/**
 * GET /api/technical/boms/:id/scale
 * FR-2.35: Scale BOM quantities (simple version)
 *
 * Query params:
 *   - multiplier: Scaling factor (e.g., 2.5 for 2.5x batch size)
 *
 * Returns:
 *   - originalOutputQty: Original BOM output quantity
 *   - newOutputQty: Scaled output quantity
 *   - multiplier: Scaling factor used
 *   - scaledItems: Array of scaled ingredient quantities
 *
 * Note: This is a read-only calculation. To save scaled BOM,
 *       use the clone endpoint with custom quantities.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const multiplierParam = searchParams.get('multiplier')

    // Validate multiplier parameter
    if (!multiplierParam) {
      return NextResponse.json(
        { error: 'Missing required parameter: multiplier' },
        { status: 400 }
      )
    }

    const multiplier = parseFloat(multiplierParam)

    // Validate multiplier value
    if (isNaN(multiplier) || multiplier <= 0) {
      return NextResponse.json(
        { error: 'Invalid multiplier parameter. Must be a positive number.' },
        { status: 400 }
      )
    }

    // Calculate scaled quantities
    const result = await scaleBOM(params.id, multiplier)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error scaling BOM:', error)

    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch BOM')) {
        return NextResponse.json(
          { error: 'BOM not found' },
          { status: 404 }
        )
      }

      if (error.message === 'BOM not found') {
        return NextResponse.json(
          { error: 'BOM not found' },
          { status: 404 }
        )
      }

      if (error.message === 'Multiplier must be positive') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
