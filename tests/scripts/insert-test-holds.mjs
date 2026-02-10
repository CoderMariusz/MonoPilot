#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function insertTestHolds() {
  try {
    // First, get an existing org_id and admin user_id
    const { data: existingHold } = await supabase
      .from('quality_holds')
      .select('org_id, held_by')
      .limit(1)
      .single()

    if (!existingHold) {
      console.error('No existing hold found to get org_id')
      return
    }

    const orgId = existingHold.org_id
    const userId = existingHold.held_by

    console.log(`Creating 22 test holds for org ${orgId} with user ${userId}...`)

    const holdsToInsert = []
    for (let i = 1; i <= 22; i++) {
      holdsToInsert.push({
        org_id: orgId,
        hold_number: `QH-TEST-${String(1000 + i).padStart(4, '0')}`,
        reason: `Test Hold ${i} for pagination testing`,
        hold_type: ['qa_pending', 'investigation', 'recall', 'quarantine'][i % 4],
        status: 'active',
        priority: ['critical', 'high', 'medium', 'low'][i % 4],
        held_by: userId,
        created_by: userId,
        updated_by: userId,
        held_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    const { data, error } = await supabase
      .from('quality_holds')
      .insert(holdsToInsert)
      .select()

    if (error) {
      console.error('Error inserting holds:', error)
      return
    }

    console.log(`✓ Successfully inserted ${data?.length || 0} test holds`)

    // Verify total count
    const { count } = await supabase
      .from('quality_holds')
      .select('*', { count: 'exact', head: true })

    console.log(`Total holds now: ${count}`)
  } catch (error) {
    console.error('Error:', error)
  }
}

insertTestHolds()
