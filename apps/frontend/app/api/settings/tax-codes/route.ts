import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
}

// GET /api/settings/tax-codes - Get all tax codes
export async function GET() {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from('settings_tax_codes')
    .select('*')
    .order('code');

  if (error) {
    console.error('Error fetching tax codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax codes', details: error },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}

// POST /api/settings/tax-codes - Create new tax code
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseClient();

  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('settings_tax_codes')
      .insert({
        code: body.code,
        description: body.description || null,
        rate: body.rate,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tax code:', error);
      return NextResponse.json(
        { error: 'Failed to create tax code', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error parsing request:', err);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// PUT /api/settings/tax-codes?id=123 - Update tax code
export async function PUT(request: NextRequest) {
  const supabase = await getSupabaseClient();

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Tax code ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from('settings_tax_codes')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('Error updating tax code:', error);
      return NextResponse.json(
        { error: 'Failed to update tax code', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error parsing request:', err);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// DELETE /api/settings/tax-codes?id=123 - Delete tax code
export async function DELETE(request: NextRequest) {
  const supabase = await getSupabaseClient();

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Tax code ID is required' },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('settings_tax_codes')
    .delete()
    .eq('id', parseInt(id));

  if (error) {
    console.error('Error deleting tax code:', error);
    return NextResponse.json(
      { error: 'Failed to delete tax code', details: error },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
