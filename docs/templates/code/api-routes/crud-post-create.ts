// API Route: POST Create
// Location: apps/frontend/app/api/{module}/{resources}/route.ts
// Replace: {Resource}, {resource}, {module}

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { create{Resource}Schema } from '@/lib/validation/{resource}-schemas'
import { create{Resource} } from '@/lib/services/{resource}-service'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const supabase = await createServerSupabase()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const input = create{Resource}Schema.parse(body)

    // 3. Delegate to service layer
    const result = await create{Resource}(input)

    // 4. Return response
    if (result.success) {
      return NextResponse.json({ data: result.data }, { status: 201 })
    } else {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 }
      )
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('{Resource} creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
