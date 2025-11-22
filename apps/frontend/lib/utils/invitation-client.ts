import jwt from 'jsonwebtoken'

/**
 * Client-safe invitation utilities
 * Can be imported in Client Components
 */

export interface InvitationTokenPayload {
  email: string
  role: string
  org_id: string
  exp: number // Unix timestamp
}

/**
 * Validate invitation token (client-safe)
 * Does NOT use server-only imports
 */
export function validateInvitationToken(token: string): InvitationTokenPayload {
  // Get JWT secret at runtime, not at module load time
  const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || process.env.JWT_SECRET || ''

  if (!JWT_SECRET) {
    const errorMsg = '⚠️  JWT_SECRET not set. This is REQUIRED for invitation tokens.'
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SECURITY ERROR: JWT_SECRET must be set in production. Invitation tokens cannot be validated securely without it.')
    }
    console.warn(errorMsg + ' Using empty secret in development only.')
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as InvitationTokenPayload

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('This invitation has expired. Please request a new one.')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid invitation token. Please request a new one.')
    }
    throw new Error('Failed to validate invitation token.')
  }
}
