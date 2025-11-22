import { UAParser } from 'ua-parser-js'

/**
 * Device Info Parser Utility
 * Story: 1.4 Session Management
 * Task 4: Device Info Parser (AC-003.1, AC-003.5)
 *
 * Parses user agent strings to extract browser, OS, and device type
 */

export interface DeviceInfo {
  browser: string
  os: string
  deviceType: string
  formatted: string // "Chrome 120 on Windows 10 (Desktop)"
}

/**
 * Parse user agent string to extract device information
 *
 * AC-003.1: Device Info column shows browser name, OS, device type
 * AC-003.5: Device info captured on login
 *
 * @param userAgent - User agent string from HTTP header
 * @returns Parsed device info with formatted string
 *
 * @example
 * parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...')
 * // Returns: {
 * //   browser: 'Chrome 120',
 * //   os: 'Windows 10',
 * //   deviceType: 'Desktop',
 * //   formatted: 'Chrome 120 on Windows 10 (Desktop)'
 * // }
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      deviceType: 'Unknown',
      formatted: 'Unknown browser on Unknown OS (Unknown)',
    }
  }

  try {
    const parser = new UAParser(userAgent)
    const result = parser.getResult()

    // Extract browser info
    const browserName = result.browser.name || 'Unknown Browser'
    const browserVersion = result.browser.version
      ? result.browser.version.split('.')[0]
      : ''
    const browser = browserVersion
      ? `${browserName} ${browserVersion}`
      : browserName

    // Extract OS info
    const osName = result.os.name || 'Unknown OS'
    const osVersion = result.os.version || ''
    const os = osVersion ? `${osName} ${osVersion}` : osName

    // Determine device type
    let deviceType = 'Desktop'
    if (result.device.type === 'mobile') {
      deviceType = 'Mobile'
    } else if (result.device.type === 'tablet') {
      deviceType = 'Tablet'
    } else if (result.device.type === 'smarttv') {
      deviceType = 'Smart TV'
    } else if (result.device.type === 'wearable') {
      deviceType = 'Wearable'
    } else if (result.device.type === 'embedded') {
      deviceType = 'Embedded'
    } else if (result.device.type === 'console') {
      deviceType = 'Console'
    }

    // Format: "Chrome 120 on Windows 10 (Desktop)"
    const formatted = `${browser} on ${os} (${deviceType})`

    return {
      browser,
      os,
      deviceType,
      formatted,
    }
  } catch (error) {
    console.error('Failed to parse user agent:', error)
    return {
      browser: 'Unknown',
      os: 'Unknown',
      deviceType: 'Unknown',
      formatted: 'Unknown browser on Unknown OS (Unknown)',
    }
  }
}

/**
 * Extract IP address from request
 * Handles various proxy headers (X-Forwarded-For, X-Real-IP, CF-Connecting-IP)
 *
 * @param request - Next.js request object
 * @returns Client IP address or '0.0.0.0' if not found
 */
export function getClientIP(request: Request | any): string {
  // Try common proxy headers first
  const headers = request.headers

  // Cloudflare
  const cfIP = headers.get?.('cf-connecting-ip') || headers['cf-connecting-ip']
  if (cfIP) return cfIP

  // Standard proxy headers
  const forwardedFor =
    headers.get?.('x-forwarded-for') || headers['x-forwarded-for']
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = headers.get?.('x-real-ip') || headers['x-real-ip']
  if (realIP) return realIP

  // Fallback to socket IP (Next.js doesn't expose this easily)
  // In production behind proxy, this will be the proxy IP, not useful
  return '0.0.0.0'
}
