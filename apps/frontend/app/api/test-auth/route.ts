import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Get session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // Get user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // Try to read from settings_tax_codes
  let taxCodesTest = null;
  let taxCodesError = null;
  if (user) {
    const { data, error } = await supabase
      .from('settings_tax_codes')
      .select('*')
      .limit(5);

    taxCodesTest = data;
    taxCodesError = error;
  }

  return NextResponse.json({
    authenticated: !!user,
    user: user ? {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'unknown',
    } : null,
    session: session ? {
      expires_at: session.expires_at,
      token_preview: session.access_token?.substring(0, 20) + '...',
    } : null,
    errors: {
      sessionError: sessionError?.message,
      userError: userError?.message,
    },
    taxCodesTest: {
      data: taxCodesTest,
      error: taxCodesError?.message || taxCodesError,
    }
  }, { status: 200 });
}
