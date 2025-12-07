// API Route: Process Scan in Workflow
// Epic 5 Story 5.23: Scanner Guided Workflows
// POST /api/scanner/workflows/[id]/scan

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getWorkflowDefinition, getNextStep } from '@/lib/scanner/workflow-definitions'
import { sessions } from '../../start/route'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
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

    const params = await context.params
    const workflow_id = params.id

    // Get session
    const scannerSession = sessions.get(workflow_id)
    if (!scannerSession) {
      return NextResponse.json(
        {
          success: false,
          message: 'Workflow session not found or expired',
          sound: 'error',
          vibrate: false,
        },
        { status: 404 }
      )
    }

    // Check session ownership
    if (scannerSession.user_id !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized to access this workflow session',
          sound: 'error',
          vibrate: false,
        },
        { status: 403 }
      )
    }

    // Check session expiration
    if (new Date() > new Date(scannerSession.expires_at)) {
      sessions.delete(workflow_id)
      return NextResponse.json(
        {
          success: false,
          message: 'Workflow session expired',
          sound: 'error',
          vibrate: false,
        },
        { status: 410 }
      )
    }

    // Parse body
    const body = await request.json()
    const { barcode, step_id } = body as { barcode: string; step_id: string }

    if (!barcode || !step_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Barcode and step_id are required',
          sound: 'error',
          vibrate: false,
        },
        { status: 400 }
      )
    }

    // Verify step matches current step
    if (step_id !== scannerSession.current_step) {
      return NextResponse.json(
        {
          success: false,
          message: 'Step mismatch - please follow workflow order',
          sound: 'error',
          vibrate: false,
        },
        { status: 400 }
      )
    }

    // Get workflow definition
    const workflow = getWorkflowDefinition(scannerSession.workflow_type)
    if (!workflow) {
      return NextResponse.json(
        {
          success: false,
          message: 'Workflow definition not found',
          sound: 'error',
          vibrate: false,
        },
        { status: 500 }
      )
    }

    const currentStep = workflow.steps.find(s => s.id === step_id)
    if (!currentStep) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid step',
          sound: 'error',
          vibrate: false,
        },
        { status: 400 }
      )
    }

    // Validate barcode (basic validation - detailed in validate-barcode endpoint)
    const expectedType = currentStep.expected_scan_type
    let isValid = false
    let entityId: string | null = null

    // Parse barcode format
    if (barcode.startsWith('LP-')) {
      isValid = expectedType === 'lp'
      entityId = barcode
    } else if (barcode.startsWith('LOC-')) {
      isValid = expectedType === 'location'
      entityId = barcode
    } else if (barcode.startsWith('PRD-')) {
      isValid = expectedType === 'product'
      entityId = barcode
    } else if (barcode.startsWith('PLT-')) {
      isValid = expectedType === 'pallet'
      entityId = barcode
    } else if (barcode.startsWith('PO-')) {
      isValid = expectedType === 'po'
      entityId = barcode
    } else if (barcode.startsWith('WO-')) {
      isValid = expectedType === 'wo'
      entityId = barcode
    } else if (barcode.startsWith('ASN-')) {
      isValid = expectedType === 'asn'
      entityId = barcode
    }

    if (!isValid) {
      return NextResponse.json({
        success: false,
        message: `Expected ${expectedType.toUpperCase()} barcode, got ${barcode}`,
        sound: 'error',
        vibrate: true,
      })
    }

    // Store scan data
    scannerSession.step_data[step_id] = {
      barcode,
      entityId,
      scannedAt: new Date().toISOString(),
    }

    // Get next step
    const nextStep = getNextStep(scannerSession.workflow_type, step_id)

    if (nextStep) {
      // Move to next step
      scannerSession.current_step = nextStep.id

      // Update session expiry
      const now = new Date()
      scannerSession.expires_at = new Date(now.getTime() + 30 * 60 * 1000).toISOString()

      sessions.set(workflow_id, scannerSession)

      return NextResponse.json({
        success: true,
        message: `Scanned ${barcode}`,
        sound: 'success',
        vibrate: true,
        next_action: 'continue',
        data: {
          workflow_id,
          current_step: {
            id: nextStep.id,
            order: nextStep.order,
            name: nextStep.name,
            instruction: nextStep.instruction,
            expected_scan_type: nextStep.expected_scan_type,
            optional: nextStep.optional || false,
            allow_manual_entry: nextStep.allow_manual_entry || false,
          },
          session_expires_at: scannerSession.expires_at,
        },
      })
    } else {
      // Workflow complete
      const completedData = scannerSession.step_data
      sessions.delete(workflow_id)

      return NextResponse.json({
        success: true,
        message: 'Workflow completed successfully',
        sound: 'success',
        vibrate: true,
        next_action: 'complete',
        data: {
          workflow_id,
          workflow_type: scannerSession.workflow_type,
          completed_data: completedData,
        },
      })
    }
  } catch (error) {
    console.error('Error in POST /api/scanner/workflows/[id]/scan:', error)
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
