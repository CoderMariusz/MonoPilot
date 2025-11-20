import { createClient } from '@/lib/supabase/server';
import { CreateUserSchema } from '@/lib/schemas/user';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get filters from query params
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (role) {
      const roles = role.split(',');
      query = query.in('role', roles);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user to check role
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    // Validate input
    const body = await request.json();
    const validatedData = CreateUserSchema.parse(body);

    // Create user in Supabase Auth
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      email_confirm: false,
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // Get org_id from current user
    const { data: org } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single();

    // Create user in public.users
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authUser.user!.id,
        org_id: org!.org_id,
        email: validatedData.email,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        role: validatedData.role,
        status: 'invited',
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      // Rollback auth user creation if DB insert fails
      await supabase.auth.admin.deleteUser(authUser.user!.id);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
