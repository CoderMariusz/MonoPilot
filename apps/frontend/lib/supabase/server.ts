import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
  const cookieStore = await cookies()

  // Debug: Check what Supabase instance we're connecting to
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isCloud = url?.includes('supabase.co')
  console.log('[Supabase] Creating server client:', {
    url: url?.substring(0, 50),
    isCloud,
    cookiesCount: cookieStore.getAll().length,
    cookies: cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
  })

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Create Supabase client with service role key for admin operations
 * WARNING: Only use this in API routes, never in client components!
 */
export function createServerSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Debug logging
  console.log('🔑 Creating admin client...')
  console.log('   URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING')
  console.log('   Service Role Key:', serviceRoleKey ? `${serviceRoleKey.substring(0, 30)}... (length: ${serviceRoleKey.length})` : 'MISSING')

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set!')
  }

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set!')
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    }
  )
}
