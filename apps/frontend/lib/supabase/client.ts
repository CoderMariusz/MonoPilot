import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Parse all cookies from document.cookie
          const cookies: Array<{ name: string; value: string }> = []
          if (typeof document === 'undefined') {
            return cookies
          }
          
          document.cookie.split(';').forEach((cookie) => {
            const [name, ...rest] = cookie.split('=')
            const trimmedName = name.trim()
            const value = rest.join('=').trim()
            if (trimmedName) {
              cookies.push({
                name: trimmedName,
                value: decodeURIComponent(value)
              })
            }
          })
          return cookies
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') {
            return
          }
          
          // Set each cookie returned from Supabase auth operations
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${encodeURIComponent(value)}`
            
            if (options?.maxAge) {
              cookieString += `; Max-Age=${options.maxAge}`
            }
            if (options?.domain) {
              cookieString += `; Domain=${options.domain}`
            }
            if (options?.path) {
              cookieString += `; Path=${options.path}`
            }
            if (options?.secure) {
              cookieString += '; Secure'
            }
            if (options?.sameSite) {
              cookieString += `; SameSite=${options.sameSite}`
            }
            
            document.cookie = cookieString
          })
        }
      }
    }
  )
}
