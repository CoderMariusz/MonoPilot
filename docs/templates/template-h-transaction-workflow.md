# Template H: Transaction Workflow Pattern

**Use Case:** Multi-step business transactions (PO→GRN→LP, WO→Consumption→Output, TO→Shipment→Receipt)
**Token Savings:** ~7,500 tokens per workflow (vs 10,000 bez template)
**Stories Using:** ~15 transaction stories (receiving, production, transfers, shipments)

---

## Pattern Overview

Complex workflows wymagają:
- ✅ Multi-step execution (sequential operations)
- ✅ Transaction safety (BEGIN/COMMIT/ROLLBACK)
- ✅ Rollback handlers (undo on failure)
- ✅ Status transitions (draft → confirmed → in_progress → completed)
- ✅ Related record creation (PO → GRN → LP hierarchy)
- ✅ Inventory updates (atomic quantity changes)

---

## Template Structure

### 1. Transaction Executor (Core Pattern)

```typescript
// lib/services/transaction-executor.ts

import { createServerSupabaseAdmin } from '@/lib/supabase/server-admin'

export interface TransactionStep {
  name: string
  execute: (context: TransactionContext) => Promise<StepResult>
  rollback?: (context: TransactionContext, result: StepResult) => Promise<void>
}

export interface TransactionContext {
  supabase: SupabaseClient
  orgId: string
  userId: string
  data: Record<string, any>
  results: Record<string, StepResult>
}

export interface StepResult {
  success: boolean
  data?: any
  error?: string
}

export interface TransactionConfig {
  steps: TransactionStep[]
  context: Partial<TransactionContext>
}

export async function executeTransaction(
  config: TransactionConfig
): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = createServerSupabaseAdmin()
  const executedSteps: Array<{ step: TransactionStep; result: StepResult }> = []

  const context: TransactionContext = {
    supabase,
    orgId: config.context.orgId!,
    userId: config.context.userId!,
    data: config.context.data || {},
    results: {},
  }

  try {
    // Execute all steps sequentially
    for (const step of config.steps) {
      console.log(`[Transaction] Executing step: ${step.name}`)

      const result = await step.execute(context)

      if (!result.success) {
        console.error(`[Transaction] Step failed: ${step.name}`, result.error)
        throw new Error(`Step '${step.name}' failed: ${result.error}`)
      }

      // Store result for next steps
      context.results[step.name] = result
      executedSteps.push({ step, result })

      console.log(`[Transaction] Step completed: ${step.name}`)
    }

    // All steps succeeded
    console.log(`[Transaction] All ${config.steps.length} steps completed successfully`)

    return {
      success: true,
      data: context.results,
    }
  } catch (error) {
    console.error('[Transaction] Transaction failed, rolling back...', error)

    // Rollback in reverse order
    for (let i = executedSteps.length - 1; i >= 0; i--) {
      const { step, result } = executedSteps[i]

      if (step.rollback) {
        try {
          console.log(`[Transaction] Rolling back step: ${step.name}`)
          await step.rollback(context, result)
        } catch (rollbackError) {
          console.error(`[Transaction] Rollback failed for step: ${step.name}`, rollbackError)
          // Continue rollback despite error
        }
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    }
  }
}
```

---

### 2. Example: Purchase Order → GRN → License Plate

```typescript
// lib/services/receiving-workflow.ts

import { executeTransaction, TransactionStep } from './transaction-executor'
import { getCurrentOrgId } from './org-service'

interface ReceiveOrderInput {
  po_id: string
  po_line_id: string
  received_qty: number
  batch_number?: string
  expiry_date?: string
  location_id: string
  user_id: string
}

export async function executeReceivingWorkflow(
  input: ReceiveOrderInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  const orgId = await getCurrentOrgId()

  // Define workflow steps
  const steps: TransactionStep[] = [
    // Step 1: Validate PO exists and is receivable
    {
      name: 'validate_po',
      execute: async (ctx) => {
        const { data: po } = await ctx.supabase
          .from('purchase_orders')
          .select('id, status, supplier_id')
          .eq('id', input.po_id)
          .eq('org_id', ctx.orgId)
          .single()

        if (!po) {
          return { success: false, error: 'Purchase Order not found' }
        }

        if (!['confirmed', 'receiving'].includes(po.status)) {
          return { success: false, error: `Cannot receive PO with status: ${po.status}` }
        }

        return { success: true, data: po }
      },
    },

    // Step 2: Validate PO line and check over-receipt
    {
      name: 'validate_po_line',
      execute: async (ctx) => {
        const { data: poLine } = await ctx.supabase
          .from('po_lines')
          .select('id, product_id, ordered_qty, received_qty')
          .eq('id', input.po_line_id)
          .eq('po_id', input.po_id)
          .single()

        if (!poLine) {
          return { success: false, error: 'PO Line not found' }
        }

        const newReceivedQty = (poLine.received_qty || 0) + input.received_qty
        if (newReceivedQty > poLine.ordered_qty) {
          // Check if over-receipt is allowed (from settings)
          // For now, allow with warning
          console.warn(
            `[Receiving] Over-receipt: ordered ${poLine.ordered_qty}, receiving ${newReceivedQty}`
          )
        }

        return { success: true, data: poLine }
      },
    },

    // Step 3: Create GRN (Goods Receipt Note)
    {
      name: 'create_grn',
      execute: async (ctx) => {
        const poLine = ctx.results['validate_po_line'].data

        const { data: grn, error } = await ctx.supabase
          .from('goods_receipts')
          .insert({
            org_id: ctx.orgId,
            po_id: input.po_id,
            po_line_id: input.po_line_id,
            product_id: poLine.product_id,
            received_qty: input.received_qty,
            location_id: input.location_id,
            batch_number: input.batch_number,
            expiry_date: input.expiry_date,
            status: 'completed',
            received_by: ctx.userId,
            received_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          return { success: false, error: `Failed to create GRN: ${error.message}` }
        }

        return { success: true, data: grn }
      },
      rollback: async (ctx, result) => {
        if (result.data?.id) {
          await ctx.supabase
            .from('goods_receipts')
            .delete()
            .eq('id', result.data.id)
        }
      },
    },

    // Step 4: Create License Plate (LP)
    {
      name: 'create_license_plate',
      execute: async (ctx) => {
        const grn = ctx.results['create_grn'].data
        const poLine = ctx.results['validate_po_line'].data

        // Generate LP number
        const lpNumber = await generateLPNumber(ctx.orgId)

        const { data: lp, error } = await ctx.supabase
          .from('license_plates')
          .insert({
            org_id: ctx.orgId,
            lp_number: lpNumber,
            product_id: poLine.product_id,
            qty: input.received_qty,
            uom: poLine.uom,
            batch_number: input.batch_number,
            expiry_date: input.expiry_date,
            location_id: input.location_id,
            status: 'available',
            source_type: 'grn',
            source_id: grn.id,
            created_by: ctx.userId,
          })
          .select()
          .single()

        if (error) {
          return { success: false, error: `Failed to create LP: ${error.message}` }
        }

        return { success: true, data: lp }
      },
      rollback: async (ctx, result) => {
        if (result.data?.id) {
          await ctx.supabase
            .from('license_plates')
            .delete()
            .eq('id', result.data.id)
        }
      },
    },

    // Step 5: Update PO line received quantity
    {
      name: 'update_po_line',
      execute: async (ctx) => {
        const poLine = ctx.results['validate_po_line'].data
        const newReceivedQty = (poLine.received_qty || 0) + input.received_qty

        const { data, error } = await ctx.supabase
          .from('po_lines')
          .update({
            received_qty: newReceivedQty,
            status: newReceivedQty >= poLine.ordered_qty ? 'completed' : 'partial',
          })
          .eq('id', input.po_line_id)
          .select()
          .single()

        if (error) {
          return { success: false, error: `Failed to update PO line: ${error.message}` }
        }

        return { success: true, data }
      },
      rollback: async (ctx, result) => {
        const poLine = ctx.results['validate_po_line'].data
        await ctx.supabase
          .from('po_lines')
          .update({
            received_qty: poLine.received_qty, // Restore original
            status: poLine.status,
          })
          .eq('id', input.po_line_id)
      },
    },

    // Step 6: Update PO status (if all lines completed)
    {
      name: 'update_po_status',
      execute: async (ctx) => {
        // Check if all lines are completed
        const { data: lines } = await ctx.supabase
          .from('po_lines')
          .select('status')
          .eq('po_id', input.po_id)

        const allCompleted = lines?.every((line) => line.status === 'completed')

        if (allCompleted) {
          const { data, error } = await ctx.supabase
            .from('purchase_orders')
            .update({ status: 'completed' })
            .eq('id', input.po_id)
            .select()
            .single()

          if (error) {
            return { success: false, error: `Failed to update PO status: ${error.message}` }
          }

          return { success: true, data }
        }

        return { success: true, data: { status: 'receiving' } }
      },
    },

    // Step 7: Create movement history
    {
      name: 'create_movement',
      execute: async (ctx) => {
        const lp = ctx.results['create_license_plate'].data

        const { data, error } = await ctx.supabase
          .from('lp_movements')
          .insert({
            org_id: ctx.orgId,
            lp_id: lp.id,
            to_location_id: input.location_id,
            movement_type: 'receive',
            qty: input.received_qty,
            created_by: ctx.userId,
          })
          .select()
          .single()

        if (error) {
          return { success: false, error: `Failed to create movement: ${error.message}` }
        }

        return { success: true, data }
      },
      rollback: async (ctx, result) => {
        if (result.data?.id) {
          await ctx.supabase
            .from('lp_movements')
            .delete()
            .eq('id', result.data.id)
        }
      },
    },
  ]

  // Execute transaction
  return await executeTransaction({
    steps,
    context: {
      orgId,
      userId: input.user_id,
      data: input,
    },
  })
}

async function generateLPNumber(orgId: string): Promise<string> {
  // Generate LP number: LP-YYYY-NNNNNN
  const year = new Date().getFullYear()
  const { count } = await createServerSupabaseAdmin()
    .from('license_plates')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .like('lp_number', `LP-${year}-%`)

  const nextNumber = (count || 0) + 1
  return `LP-${year}-${String(nextNumber).padStart(6, '0')}`
}
```

---

### 3. Example: Work Order Execution (Material Consumption)

```typescript
// lib/services/wo-execution-workflow.ts

interface ConsumematerialsInput {
  wo_id: string
  consumptions: Array<{
    bom_item_id: string
    lp_id: string
    qty_consumed: number
  }>
  user_id: string
}

export async function executeConsumeMaterialsWorkflow(
  input: ConsumeaterialsInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  const orgId = await getCurrentOrgId()

  const steps: TransactionStep[] = [
    // Step 1: Validate WO exists and is in progress
    {
      name: 'validate_wo',
      execute: async (ctx) => {
        const { data: wo } = await ctx.supabase
          .from('work_orders')
          .select('id, status, bom_id, product_id')
          .eq('id', input.wo_id)
          .eq('org_id', ctx.orgId)
          .single()

        if (!wo) {
          return { success: false, error: 'Work Order not found' }
        }

        if (wo.status !== 'in_progress') {
          return { success: false, error: `Cannot consume materials for WO with status: ${wo.status}` }
        }

        return { success: true, data: wo }
      },
    },

    // Step 2: Validate all LPs exist and have sufficient qty
    {
      name: 'validate_lps',
      execute: async (ctx) => {
        for (const consumption of input.consumptions) {
          const { data: lp } = await ctx.supabase
            .from('license_plates')
            .select('id, lp_number, product_id, qty, status')
            .eq('id', consumption.lp_id)
            .eq('org_id', ctx.orgId)
            .single()

          if (!lp) {
            return { success: false, error: `LP not found: ${consumption.lp_id}` }
          }

          if (lp.status !== 'available') {
            return { success: false, error: `LP ${lp.lp_number} not available (status: ${lp.status})` }
          }

          if (lp.qty < consumption.qty_consumed) {
            return {
              success: false,
              error: `Insufficient qty on LP ${lp.lp_number}: has ${lp.qty}, need ${consumption.qty_consumed}`,
            }
          }
        }

        return { success: true }
      },
    },

    // Step 3: For each consumption, deduct LP qty
    {
      name: 'consume_lps',
      execute: async (ctx) => {
        const updates = []

        for (const consumption of input.consumptions) {
          const { data: lp } = await ctx.supabase
            .from('license_plates')
            .select('qty')
            .eq('id', consumption.lp_id)
            .single()

          const newQty = lp.qty - consumption.qty_consumed
          const newStatus = newQty === 0 ? 'consumed' : 'available'

          const { data: updated, error } = await ctx.supabase
            .from('license_plates')
            .update({
              qty: newQty,
              status: newStatus,
            })
            .eq('id', consumption.lp_id)
            .select()
            .single()

          if (error) {
            return { success: false, error: `Failed to update LP: ${error.message}` }
          }

          updates.push({ lp_id: consumption.lp_id, old_qty: lp.qty, new_qty: newQty })
        }

        return { success: true, data: updates }
      },
      rollback: async (ctx, result) => {
        if (result.data) {
          for (const update of result.data) {
            await ctx.supabase
              .from('license_plates')
              .update({
                qty: update.old_qty,
                status: 'available',
              })
              .eq('id', update.lp_id)
          }
        }
      },
    },

    // Step 4: Record material consumption
    {
      name: 'record_consumption',
      execute: async (ctx) => {
        const consumptions = input.consumptions.map((c) => ({
          org_id: ctx.orgId,
          wo_id: input.wo_id,
          bom_item_id: c.bom_item_id,
          lp_id: c.lp_id,
          qty_consumed: c.qty_consumed,
          consumed_by: ctx.userId,
          consumed_at: new Date().toISOString(),
        }))

        const { data, error } = await ctx.supabase
          .from('wo_material_consumptions')
          .insert(consumptions)
          .select()

        if (error) {
          return { success: false, error: `Failed to record consumption: ${error.message}` }
        }

        return { success: true, data }
      },
      rollback: async (ctx, result) => {
        if (result.data) {
          const ids = result.data.map((c: any) => c.id)
          await ctx.supabase
            .from('wo_material_consumptions')
            .delete()
            .in('id', ids)
        }
      },
    },

    // Step 5: Update WO consumed quantities
    {
      name: 'update_wo_bom_items',
      execute: async (ctx) => {
        for (const consumption of input.consumptions) {
          const { data: bomItem } = await ctx.supabase
            .from('wo_bom_items')
            .select('consumed_qty, required_qty')
            .eq('wo_id', input.wo_id)
            .eq('bom_item_id', consumption.bom_item_id)
            .single()

          const newConsumedQty = (bomItem?.consumed_qty || 0) + consumption.qty_consumed

          await ctx.supabase
            .from('wo_bom_items')
            .update({ consumed_qty: newConsumedQty })
            .eq('wo_id', input.wo_id)
            .eq('bom_item_id', consumption.bom_item_id)
        }

        return { success: true }
      },
    },
  ]

  return await executeTransaction({
    steps,
    context: {
      orgId,
      userId: input.user_id,
      data: input,
    },
  })
}
```

---

## API Endpoint Pattern

```typescript
// app/api/warehouse/receive/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { executeReceivingWorkflow } from '@/lib/services/receiving-workflow'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Execute transaction workflow
    const result = await executeReceivingWorkflow({
      ...body,
      user_id: session.user.id,
    })

    if (result.success) {
      return NextResponse.json({ data: result.data }, { status: 201 })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('[Receive] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    )
  }
}
```

---

## Customization Examples

### Example 1: Add Email Notification Step

```typescript
{
  name: 'send_notification',
  execute: async (ctx) => {
    const grn = ctx.results['create_grn'].data
    const po = ctx.results['validate_po'].data

    await sendEmail({
      to: po.supplier_email,
      subject: 'Goods Received',
      body: `GRN ${grn.grn_number} created for PO ${po.po_number}`,
    })

    return { success: true }
  },
  // No rollback for notification (can't un-send email)
}
```

### Example 2: Add Inventory Adjustment

```typescript
{
  name: 'update_inventory_balance',
  execute: async (ctx) => {
    const lp = ctx.results['create_license_plate'].data

    const { data, error } = await ctx.supabase.rpc('update_inventory_balance', {
      p_org_id: ctx.orgId,
      p_product_id: lp.product_id,
      p_location_id: lp.location_id,
      p_qty_change: lp.qty,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  },
  rollback: async (ctx, result) => {
    const lp = ctx.results['create_license_plate'].data
    await ctx.supabase.rpc('update_inventory_balance', {
      p_org_id: ctx.orgId,
      p_product_id: lp.product_id,
      p_location_id: lp.location_id,
      p_qty_change: -lp.qty, // Reverse
    })
  },
}
```

---

## Token Savings

**Without Template H:**
- Write 300+ lines of transaction logic
- Manually handle rollback for each step
- Repeat pattern for each workflow
- **Total:** ~10,000 tokens per workflow

**With Template H:**
- Reference template + define steps
- **Total:** ~2,500 tokens (75% reduction)

**Project-Wide:**
- 15 workflows × 7,500 tokens saved = 112,500 tokens saved

---

**END OF TEMPLATE H**
