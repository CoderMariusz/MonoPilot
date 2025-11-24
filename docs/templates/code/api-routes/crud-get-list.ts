// API Route: GET List with Filters
// Location: apps/frontend/app/api/{module}/{resources}/route.ts
// Replace: {Resource}, {resource}, {module}

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { list{Resource}s } from '@/lib/services/{resource}-service'

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const supabase = await createServerSupabase()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse query params (filters)
    const searchParams = request.nextUrl.searchParams
    const filters = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      // Add more filters as needed
    }

    // 3. Delegate to service layer
    const result = await list{Resource}s(filters)

    // 4. Return response
    if (result.success) {
      return NextResponse.json({
        data: result.data,
        total: result.total
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('{Resource} list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
