#!/usr/bin/env node

import { readFileSync } from 'fs'

const BASE_URL = 'http://localhost:3000'

// Read cookies from cookies.txt (Netscape format)
function parseCookies() {
  try {
    const content = readFileSync('cookies.txt', 'utf-8')
    const cookies = {}
    content.split('\n').forEach(line => {
      if (!line.startsWith('#') && line.trim()) {
        const parts = line.split('\t')
        if (parts.length >= 7) {
          const name = parts[5]
          const value = parts[6]
          cookies[name] = value
        }
      }
    })
    return Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
  } catch (error) {
    console.error('Failed to read cookies.txt:', error)
    return ''
  }
}

async function createHold(reason, priority = 'medium') {
  try {
    const response = await fetch(`${BASE_URL}/api/quality/holds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': parseCookies(),
      },
      body: JSON.stringify({
        reason,
        hold_type: 'qa_pending',
        priority,
        items: [], // Create without items for now
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Failed to create hold: ${response.status}`, error)
      return null
    }

    const data = await response.json()
    return data.hold
  } catch (error) {
    console.error('Error creating hold:', error)
    return null
  }
}

async function main() {
  console.log('Creating test holds for pagination testing...')
  
  // Create 25 holds to trigger pagination (limit is 20 per page)
  for (let i = 1; i <= 25; i++) {
    const hold = await createHold(`Test Hold ${i} - Pagination Test`, i % 4 === 0 ? 'critical' : 'medium')
    if (hold) {
      console.log(`✓ Created hold ${i}: ${hold.hold_number}`)
    } else {
      console.error(`✗ Failed to create hold ${i}`)
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log('\nDone! Holds created. Pagination should now be visible.')
}

main().catch(console.error)
