import sgMail from '@sendgrid/mail'
import { buildSignupUrl } from '../utils/qr-code-generator'

/**
 * Email Service
 * Story: 1.3 User Invitations
 * Task 5: SendGrid Email Integration (AC-002.6, AC-003.6)
 *
 * Handles sending invitation emails via SendGrid
 */

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@monopilot.com'
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'MonoPilot'

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
} else {
  console.warn('⚠️  SENDGRID_API_KEY not set. Email sending will fail.')
}

export interface SendInvitationEmailParams {
  email: string
  token: string
  qrCodeDataUrl: string
  orgName: string
  role: string
  expiresAt: Date
}

/**
 * Build invitation email HTML template
 *
 * AC-003.6: Invitation email template with org name, role, link, QR code, expiry
 *
 * @param params - Email template parameters
 * @returns HTML email content
 */
function buildInvitationEmailHTML(params: SendInvitationEmailParams): string {
  const signupUrl = buildSignupUrl(params.token, params.email)
  const expiryDate = params.expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to ${params.orgName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #0066cc; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">MonoPilot</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">You've been invited to ${params.orgName}</h2>

              <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">Hi there!</p>

              <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                You've been invited to join <strong>${params.orgName}</strong> on MonoPilot as <strong>${params.role}</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${signupUrl}"
                       style="background-color: #0066cc; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; display: inline-block;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- QR Code Section -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <p style="color: #666666; font-size: 14px; margin: 0 0 15px 0;">
                      <strong>Or scan this QR code on your mobile device:</strong>
                    </p>
                    <img src="${params.qrCodeDataUrl}"
                         alt="QR Code"
                         width="200"
                         height="200"
                         style="display: block; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 4px;" />
                  </td>
                </tr>
              </table>

              <!-- Expiry Notice -->
              <p style="color: #999999; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                This invitation expires on <strong>${expiryDate}</strong> (7 days from now).
              </p>

              <!-- Alternative Link -->
              <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 15px 0 0 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${signupUrl}" style="color: #0066cc; word-break: break-all;">${signupUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Powered by <strong>MonoPilot MES</strong><br>
                Food Manufacturing Excellence Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Build plain text version of invitation email
 *
 * @param params - Email template parameters
 * @returns Plain text email content
 */
function buildInvitationEmailText(params: SendInvitationEmailParams): string {
  const signupUrl = buildSignupUrl(params.token, params.email)
  const expiryDate = params.expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
You've been invited to ${params.orgName}

Hi there!

You've been invited to join ${params.orgName} on MonoPilot as ${params.role}.

Accept your invitation by clicking this link:
${signupUrl}

Or scan the QR code included in the HTML version of this email on your mobile device.

This invitation expires on ${expiryDate} (7 days from now).

Powered by MonoPilot MES
Food Manufacturing Excellence Platform
  `.trim()
}

/**
 * Send invitation email via SendGrid
 *
 * AC-002.6: Invitation email sent within 5s
 * AC-003.6: Email template with org name, role, link, QR code
 *
 * @param params - Email parameters
 * @returns Success status
 * @throws Error if email fails to send after retries
 */
export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY not configured')
    throw new Error('Email service not configured')
  }

  const msg = {
    to: params.email,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: `You've been invited to ${params.orgName} on MonoPilot`,
    text: buildInvitationEmailText(params),
    html: buildInvitationEmailHTML(params),
  }

  // Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now()
      await sgMail.send(msg)
      const elapsed = Date.now() - startTime

      console.log(
        `✅ Invitation email sent to ${params.email} in ${elapsed}ms (attempt ${attempt}/${maxRetries})`
      )

      // AC-002.6: Email sent within 5s
      if (elapsed > 5000) {
        console.warn(
          `⚠️  Email took ${elapsed}ms (exceeds 5s target). Consider investigating SendGrid performance.`
        )
      }

      return true
    } catch (error) {
      lastError = error as Error
      console.error(
        `❌ Failed to send invitation email (attempt ${attempt}/${maxRetries}):`,
        error
      )

      // If not the last attempt, wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt - 1) * 1000 // 1s, 2s, 4s
        console.log(`⏳ Retrying in ${delayMs}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to send invitation email after ${maxRetries} attempts: ${lastError?.message}`
  )
}

/**
 * Send test email (for development/testing)
 *
 * @param toEmail - Recipient email
 * @returns Success status
 */
export async function sendTestEmail(toEmail: string): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('⚠️  SENDGRID_API_KEY not set, skipping test email')
    return false
  }

  const msg = {
    to: toEmail,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: 'MonoPilot Test Email',
    text: 'This is a test email from MonoPilot.',
    html: '<p>This is a test email from <strong>MonoPilot</strong>.</p>',
  }

  try {
    await sgMail.send(msg)
    console.log(`✅ Test email sent to ${toEmail}`)
    return true
  } catch (error) {
    console.error('❌ Failed to send test email:', error)
    throw error
  }
}
