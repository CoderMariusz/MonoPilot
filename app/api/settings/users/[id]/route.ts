import { createClient } from '@/lib/supabase/server';
import { UpdateUserSchema } from '@/lib/schemas/user';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to check if user is the last admin in organization
async function isLastAdmin(supabase: any, userId: string, orgId: string): Promise<boolean> {
  const { data: adminUsers, error } = await supabase
    .from('users')
    .select('id')
    .eq('org_id', orgId)
    .eq('role', 'admin')
    .eq('status', 'active');

  if (error) {
    console.error('Error checking last admin:', error);
    return false;
  }

  return adminUsers.length === 1 && adminUsers[0].id === userId;
}

// Helper function to terminate all user sessions
async function terminateUserSessions(userId: string): Promise<void> {
  // TODO: Implement Redis-based JWT blacklist when Redis is available
  // For now, this is a placeholder that will be implemented in Story 1.4
  console.log(`Session termination requested for user: ${userId}`);
  // Future implementation:
  // 1. Get all JTI tokens for this user from auth.refresh_tokens
  // 2. Add them to Redis blacklist with TTL
  // 3. Force client-side logout on next API call
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const userId = params.id;

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user to check role
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', user.id)
      .single();

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    // Validate input
    const body = await request.json();
    const validatedData = UpdateUserSchema.parse(body);

    // Get target user to validate changes
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('role, status, org_id')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure user belongs to same organization
    if (targetUser.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // AC-002.5: Cannot change role or deactivate last admin
    if (targetUser.role === 'admin' && targetUser.status === 'active') {
      const isLast = await isLastAdmin(supabase, userId, currentUser.org_id);

      if (isLast) {
        // Check if trying to change role away from admin
        if (validatedData.role && validatedData.role !== 'admin') {
          return NextResponse.json(
            { error: 'Cannot change role of last active admin in organization' },
            { status: 400 }
          );
        }

        // Check if trying to deactivate
        if (validatedData.status && validatedData.status !== 'active') {
          return NextResponse.json(
            { error: 'Cannot deactivate last active admin in organization' },
            { status: 400 }
          );
        }
      }
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        ...validatedData,
        updated_by: user.id,
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const userId = params.id;

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user to check role
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', user.id)
      .single();

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    // Get target user
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('role, status, org_id')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure user belongs to same organization
    if (targetUser.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // AC-002.5: Cannot deactivate last admin
    if (targetUser.role === 'admin' && targetUser.status === 'active') {
      const isLast = await isLastAdmin(supabase, userId, currentUser.org_id);

      if (isLast) {
        return NextResponse.json(
          { error: 'Cannot deactivate last active admin in organization' },
          { status: 400 }
        );
      }
    }

    // Deactivate user (soft delete)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        status: 'inactive',
        updated_by: user.id,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error deactivating user:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Terminate all user sessions
    await terminateUserSessions(userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deactivating user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
