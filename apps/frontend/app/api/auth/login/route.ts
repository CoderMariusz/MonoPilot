import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { email, password } = loginSchema.parse(json)

    const supabase = await createServerSupabase()

    console.log('[Login API] Attempting login for:', email)

    // Sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.log('[Login API] Login failed:', error.message)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!data.session) {
      console.log('[Login API] No session returned')
      return NextResponse.json(
        { error: 'No session created' },
        { status: 500 }
      )
    }

    console.log('[Login API] Login successful, user ID:', data.user.id)

    // Session cookies are automatically set by createServerSupabase
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch (error) {
    console.error('[Login API] Unexpected error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
