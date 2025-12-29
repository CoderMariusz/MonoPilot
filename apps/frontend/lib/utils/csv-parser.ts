/**
 * CSV Parser Utility
 *
 * Utilities for parsing CSV files with support for:
 * - Quoted values with commas
 * - Various data types (string, number, boolean, JSON)
 * - Empty value handling
 * - Error reporting
 */

/**
 * Parse a single CSV line, handling quoted values
 * @param line - Raw CSV line
 * @returns Array of parsed values
 */
export function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  values.push(current)

  return values.map((v) => v.replace(/^"|"$/g, ''))
}

/**
 * Parse CSV text into array of objects
 * @param text - Full CSV text content
 * @param headerMap - Map of CSV headers to object keys
 * @param rowParser - Function to parse each row into desired type
 * @returns Array of parsed objects
 */
export function parseCSV<T>(
  text: string,
  rowParser: (values: string[], headers: string[]) => T | null
): { data: T[]; errors: Array<{ row: number; error: string }> } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  const errors: Array<{ row: number; error: string }> = []
  const data: T[] = []

  if (lines.length < 2) {
    errors.push({ row: 0, error: 'CSV file must have a header row and at least one data row' })
    return { data, errors }
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase())

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i])
      if (values.length === 0 || values.every((v) => !v.trim())) continue

      const parsed = rowParser(values, headers)
      if (parsed !== null) {
        data.push(parsed)
      }
    } catch (err) {
      errors.push({
        row: i + 1,
        error: err instanceof Error ? err.message : 'Unknown parsing error',
      })
    }
  }

  return { data, errors }
}

/**
 * Helper to parse boolean values from CSV
 * @param value - String value from CSV
 * @returns Boolean or undefined
 */
export function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value || value.trim() === '' || value.toLowerCase() === 'null') return undefined
  return value.toLowerCase() === 'true' || value === '1'
}

/**
 * Helper to parse number values from CSV
 * @param value - String value from CSV
 * @returns Number or undefined
 */
export function parseNumber(value: string | undefined): number | undefined {
  if (!value || value.trim() === '' || value.toLowerCase() === 'null') return undefined
  const num = parseFloat(value)
  return isNaN(num) ? undefined : num
}

/**
 * Helper to parse integer values from CSV
 * @param value - String value from CSV
 * @returns Integer or undefined
 */
export function parseInt(value: string | undefined): number | undefined {
  if (!value || value.trim() === '' || value.toLowerCase() === 'null') return undefined
  const num = Number.parseInt(value, 10)
  return isNaN(num) ? undefined : num
}

/**
 * Helper to parse JSON values from CSV
 * @param value - String value from CSV (JSON or semicolon-separated)
 * @returns Parsed object or undefined
 */
export function parseJSON<T = any>(value: string | undefined): T | undefined {
  if (!value || value.trim() === '' || value.toLowerCase() === 'null') return undefined

  try {
    return JSON.parse(value) as T
  } catch {
    return undefined
  }
}

/**
 * Helper to parse array values from CSV (JSON or semicolon-separated)
 * @param value - String value from CSV
 * @returns Array or undefined
 */
export function parseArray(value: string | undefined): string[] | undefined {
  if (!value || value.trim() === '' || value.toLowerCase() === 'null') return undefined

  // Try JSON first
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // Fall back to semicolon-separated
  }

  // Parse semicolon-separated values
  const arr = value.split(';').filter(Boolean).map((v) => v.trim())
  return arr.length > 0 ? arr : undefined
}

/**
 * Helper to parse key:value pairs from CSV (JSON or semicolon-separated)
 * @param value - String value from CSV
 * @returns Record object or undefined
 */
export function parseKeyValuePairs(value: string | undefined): Record<string, boolean> | undefined {
  if (!value || value.trim() === '' || value.toLowerCase() === 'null') return undefined

  // Try JSON first
  try {
    return JSON.parse(value) as Record<string, boolean>
  } catch {
    // Fall back to semicolon-separated key:value pairs
  }

  // Parse key:value pairs
  const flags: Record<string, boolean> = {}
  value.split(';').forEach((pair) => {
    const [key, val] = pair.split(':')
    if (key) flags[key.trim()] = val?.trim() !== 'false'
  })

  return Object.keys(flags).length > 0 ? flags : undefined
}
