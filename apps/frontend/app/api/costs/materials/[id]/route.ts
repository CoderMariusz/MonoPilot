/**
 * Material Cost Delete API Route - EPIC-003 Phase 1
 * Delete a material cost entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/costs/materials/[id] - Delete material cost entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const costId = parseInt(params.id);

    if (isNaN(costId)) {
      return NextResponse.json(
        { error: 'Invalid cost ID' },
        { status: 400 }
      );
    }

    // Delete the material cost
    const { error } = await supabase
      .from('material_costs')
      .delete()
      .eq('id', costId);

    if (error) {
      console.error('Error deleting material cost:', error);
      return NextResponse.json(
        { error: 'Failed to delete material cost' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Material cost deleted successfully',
    });

  } catch (error) {
    console.error('Material cost DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
