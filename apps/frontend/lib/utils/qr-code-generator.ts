import QRCode from 'qrcode'

/**
 * QR Code Generator Utility
 * Story: 1.3 User Invitations
 * Task 3: QR Code Generation (AC-003.5)
 *
 * Generates QR codes for invitation signup URLs
 */

/**
 * Generate QR code as base64 data URL
 *
 * AC-003.5: QR code contains signup URL, displayed in modal and email
 *
 * @param signupUrl - Full signup URL with token (e.g., https://app.com/signup?token=...)
 * @returns Base64 data URL (e.g., data:image/png;base64,...)
 */
export async function generateQRCode(signupUrl: string): Promise<string> {
  try {
    // Generate QR code as data URL
    const dataUrl = await QRCode.toDataURL(signupUrl, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M', // Medium error correction
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    return dataUrl
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Build signup URL with invitation token
 *
 * AC-003.5: QR code format {APP_URL}/signup?token={jwt}&email={email}
 *
 * @param token - JWT invitation token
 * @param email - User email address
 * @returns Full signup URL
 */
export function buildSignupUrl(token: string, email: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const url = new URL('/signup', baseUrl)
  url.searchParams.set('token', token)
  url.searchParams.set('email', email)
  return url.toString()
}

/**
 * Generate QR code for invitation token
 * Convenience function combining buildSignupUrl + generateQRCode
 *
 * @param token - JWT invitation token
 * @param email - User email address
 * @returns Base64 QR code data URL
 */
export async function generateInvitationQRCode(
  token: string,
  email: string
): Promise<string> {
  const signupUrl = buildSignupUrl(token, email)
  return generateQRCode(signupUrl)
}
