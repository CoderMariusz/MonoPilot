// API Route: Start Scanner Workflow
// Epic 5 Story 5.23: Scanner Guided Workflows
// POST /api/scanner/workflows/start

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getWorkflowDefinition, type WorkflowType } from '@/lib/scanner/workflow-definitions'

const SESSION_TIMEOUT_MINUTES = 30

interface ScannerSession {
  workflow_id: string
  workflow_type: WorkflowType
  user_id: string
  org_id: string
  current_step: string
  step_data: Record<string, any>
  created_at: string
  expires_at: string
}

// Store sessions in memory (in production, use Redis)
const sessions = new Map<string, ScannerSession>()

export async function POST(request: NextRequest) {
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

    // Parse body
    const body = await request.json()
    const { workflow_type } = body as { workflow_type: WorkflowType }

    if (!workflow_type) {
      return NextResponse.json(
        {
          success: false,
          message: 'Workflow type is required',
          sound: 'error',
          vibrate: false,
        },
        { status: 400 }
      )
    }

    // Get workflow definition
    const workflow = getWorkflowDefinition(workflow_type)
    if (!workflow) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid workflow type',
          sound: 'error',
          vibrate: false,
        },
        { status: 400 }
      )
    }

    // Check permissions
    if (workflow.requires_permissions) {
      const userRole = currentUser.role.toLowerCase()
      const hasPermission = workflow.requires_permissions.some(
        perm => userRole === perm || userRole === 'admin'
      )

      if (!hasPermission) {
        return NextResponse.json(
          {
            success: false,
            message: 'Insufficient permissions for this workflow',
            sound: 'error',
            vibrate: false,
          },
          { status: 403 }
        )
      }
    }

    // Create session
    const workflow_id = `WF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    const expiresAt = new Date(now.getTime() + SESSION_TIMEOUT_MINUTES * 60 * 1000)

    const scannerSession: ScannerSession = {
      workflow_id,
      workflow_type,
      user_id: session.user.id,
      org_id: currentUser.org_id,
      current_step: workflow.steps[0].id,
      step_data: {},
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    }

    sessions.set(workflow_id, scannerSession)

    const currentStep = workflow.steps[0]

    return NextResponse.json({
      success: true,
      message: `Started ${workflow.name}`,
      sound: 'success',
      vibrate: true,
      data: {
        workflow_id,
        workflow_type,
        workflow_name: workflow.name,
        current_step: {
          id: currentStep.id,
          order: currentStep.order,
          name: currentStep.name,
          instruction: currentStep.instruction,
          expected_scan_type: currentStep.expected_scan_type,
          optional: currentStep.optional || false,
          allow_manual_entry: currentStep.allow_manual_entry || false,
        },
        session_expires_at: expiresAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error in POST /api/scanner/workflows/start:', error)
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

// Export sessions for other routes (in production, use shared store)
export { sessions }
