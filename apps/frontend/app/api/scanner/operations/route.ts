// API Route: Scanner Operations Menu
// Epic 5 Story 5.26: Scanner Operations Menu
// GET /api/scanner/operations

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WORKFLOW_DEFINITIONS } from '@/lib/scanner/workflow-definitions'

interface OperationMenuItem {
  id: string
  name: string
  description: string
  icon: string
  workflow_type: string
  requires_permissions: string[]
  enabled: boolean
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          sound: 'error',
          vibrate: false,
        },
        { status: 401 }
      )
    }

    // Get user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
          sound: 'error',
          vibrate: false,
        },
        { status: 404 }
      )
    }

    // Get user's warehouses (for permission filtering)
    // TODO: Implement warehouse-level permissions when available
    const userRole = currentUser.role.toLowerCase()

    // Build operations menu based on user role
    const operations: OperationMenuItem[] = []

    Object.entries(WORKFLOW_DEFINITIONS).forEach(([key, workflow]) => {
      // Check if user has permission for this workflow
      let hasPermission = true
      if (workflow.requires_permissions) {
        hasPermission = workflow.requires_permissions.some(
          perm => userRole === perm || userRole === 'admin'
        )
      }

      operations.push({
        id: key,
        name: workflow.name,
        description: workflow.description,
        icon: getWorkflowIcon(key),
        workflow_type: key,
        requires_permissions: workflow.requires_permissions || [],
        enabled: hasPermission,
      })
    })

    // Filter to only enabled operations
    const enabledOperations = operations.filter(op => op.enabled)

    return NextResponse.json({
      success: true,
      message: 'Operations retrieved',
      sound: 'success',
      vibrate: false,
      data: {
        operations: enabledOperations,
        user_role: userRole,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/scanner/operations:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        sound: 'error',
        vibrate: false,
      },
      { status: 500 }
    )
  }
}

function getWorkflowIcon(workflowType: string): string {
  const icons: Record<string, string> = {
    receive: 'package-check',
    move: 'move',
    pick: 'hand',
    putaway: 'warehouse',
    count: 'calculator',
    lookup: 'search',
  }
  return icons[workflowType] || 'circle'
}
