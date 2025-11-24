#!/usr/bin/env node
/**
 * Fix Next.js 15 Async Params in API Routes
 *
 * This script automatically converts all API route handlers to use async params
 * as required by Next.js 15.
 *
 * Changes:
 * 1. { params }: { params: { id: string } } => { params }: { params: Promise<{ id: string }> }
 * 2. Adds `const { id, ... } = await params` at start of function
 * 3. Replaces all `params.xxx` with `xxx`
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const apiDir = path.join(__dirname, '..', 'app', 'api')

// Find all route.ts files with dynamic params
function findRouteFiles(dir, files = []) {
  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      findRouteFiles(fullPath, files)
    } else if (item === 'route.ts' && fullPath.includes('[')) {
      files.push(fullPath)
    }
  }

  return files
}

// Extract param names from path (e.g., [id], [lineId])
function extractParamNames(filePath) {
  const matches = filePath.match(/\[([^\]]+)\]/g)
  if (!matches) return []
  return matches.map(m => m.slice(1, -1))
}

// Fix a single file
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
  const paramNames = extractParamNames(filePath)

  if (paramNames.length === 0) return false

  let changed = false

  // Build param type (e.g., { id: string; lineId: string })
  const paramType = paramNames.map(name => `${name}: string`).join('; ')
  const paramDestructure = paramNames.join(', ')

  // Pattern to match function signatures
  const oldPattern = new RegExp(
    `\\{ params \\}: \\{ params: \\{ ${paramType} \\} \\}`,
    'g'
  )

  const newPattern = `{ params }: { params: Promise<{ ${paramType} }> }`

  // Check if file needs updating
  if (!content.match(oldPattern)) {
    // Check if already fixed
    if (content.includes('Promise<{')) {
      console.log(`✓ ${path.relative(apiDir, filePath)} - already fixed`)
      return false
    }
    console.log(`⚠ ${path.relative(apiDir, filePath)} - no matching pattern found`)
    return false
  }

  // Replace function signatures
  content = content.replace(oldPattern, newPattern)
  changed = true

  // Add await params at start of each function
  const methodPattern = /export async function (GET|POST|PUT|PATCH|DELETE)\([^)]+\) \{[\s\n]+try \{/g

  content = content.replace(methodPattern, (match, method) => {
    // Check if already has await params
    if (content.slice(content.indexOf(match), content.indexOf(match) + 200).includes('await params')) {
      return match
    }
    return match + `\n    const { ${paramDestructure} } = await params`
  })

  // Replace params.xxx with xxx
  for (const paramName of paramNames) {
    const paramUsagePattern = new RegExp(`params\\.${paramName}\\b`, 'g')
    content = content.replace(paramUsagePattern, paramName)
  }

  fs.writeFileSync(filePath, content, 'utf-8')
  console.log(`✓ ${path.relative(apiDir, filePath)} - fixed`)
  return true
}

// Main
console.log('🔍 Finding API route files...\n')
const routeFiles = findRouteFiles(apiDir)
console.log(`Found ${routeFiles.length} route files with dynamic params\n`)

let fixedCount = 0
for (const file of routeFiles) {
  if (fixFile(file)) {
    fixedCount++
  }
}

console.log(`\n✨ Fixed ${fixedCount} files`)
