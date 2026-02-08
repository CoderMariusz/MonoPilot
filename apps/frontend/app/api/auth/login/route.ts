import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

interface LoginRequest {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Collect cookies that @supabase/ssr wants to set during auth
    const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach((cookie) => pendingCookies.push(cookie))
          },
        },
      }
    )

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('[Login] Auth error:', error)
      return NextResponse.json(
        { error: error.message || 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'Session creation failed' },
        { status: 500 }
      )
    }

    // Create response and apply auth cookies in @supabase/ssr format
    // This ensures middleware and layout can read the session correctly
    const response = NextResponse.json(
      { success: true, message: 'Login successful' },
      { status: 200 }
    )

    pendingCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    )

    return response
  } catch (error) {
    console.error('[Login] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
