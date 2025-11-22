import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

/**
 * SendGrid Test Endpoint
 *
 * Test email sending with SendGrid (Single Sender Verification)
 *
 * Usage:
 *   POST /api/test-sendgrid
 *   Body: { "to": "recipient@example.com" }
 *
 * Make sure you have:
 * 1. Verified Single Sender in SendGrid (Settings → Sender Authentication)
 * 2. Created API Key (Settings → API Keys → Create)
 * 3. Added SENDGRID_API_KEY to .env.local
 */

export async function POST(request: NextRequest) {
  try {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json(
        {
          error: 'SendGrid not configured',
          message: 'SENDGRID_API_KEY environment variable is missing',
          instructions: [
            '1. Go to SendGrid → Settings → API Keys',
            '2. Create API Key with Full Access or Mail Send permission',
            '3. Copy the key (starts with SG.)',
            '4. Add to .env.local: SENDGRID_API_KEY=SG.your_key_here',
          ],
        },
        { status: 500 }
      )
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      return NextResponse.json(
        {
          error: 'SendGrid FROM email not configured',
          message: 'SENDGRID_FROM_EMAIL environment variable is missing',
          instructions: [
            '1. Go to SendGrid → Settings → Sender Authentication',
            '2. Click "Verify a Single Sender"',
            '3. Fill out the form with your email',
            '4. Click verification link in email',
            '5. Add to .env.local: SENDGRID_FROM_EMAIL=your-verified-email@gmail.com',
          ],
        },
        { status: 500 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { to } = body

    if (!to) {
      return NextResponse.json(
        { error: 'Missing "to" field in request body' },
        { status: 400 }
      )
    }

    // Set SendGrid API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    // Send test email
    const msg = {
      to: to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.SENDGRID_FROM_NAME || 'MonoPilot',
      },
      subject: '✅ SendGrid Test Email - MonoPilot',
      text: `Hello from MonoPilot!

This is a test email to verify that SendGrid is working correctly.

If you received this email, your SendGrid configuration is successful! 🎉

Configuration:
- API Key: ✅ Valid
- Single Sender: ${process.env.SENDGRID_FROM_EMAIL}
- Mail sending: ✅ Working

Next steps:
- You can now send user invitation emails
- Daily limit (free plan): 100 emails/day
- Consider upgrading to paid plan for higher limits

---
MonoPilot Manufacturing Execution System
Powered by SendGrid`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">✅ SendGrid Test Email</h1>

          <p>Hello from <strong>MonoPilot</strong>!</p>

          <p>This is a test email to verify that SendGrid is working correctly.</p>

          <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>If you received this email, your SendGrid configuration is successful! 🎉</strong></p>
          </div>

          <h2 style="color: #1e40af;">Configuration Details:</h2>
          <ul>
            <li><strong>API Key:</strong> ✅ Valid</li>
            <li><strong>Single Sender:</strong> ${process.env.SENDGRID_FROM_EMAIL}</li>
            <li><strong>Mail sending:</strong> ✅ Working</li>
          </ul>

          <h2 style="color: #1e40af;">Next Steps:</h2>
          <ul>
            <li>You can now send user invitation emails</li>
            <li>Daily limit (free plan): 100 emails/day</li>
            <li>Consider upgrading to paid plan for higher limits</li>
          </ul>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            <strong>MonoPilot</strong> Manufacturing Execution System<br>
            Powered by SendGrid
          </p>
        </div>
      `,
    }

    const [response] = await sgMail.send(msg)

    return NextResponse.json(
      {
        success: true,
        message: 'Test email sent successfully!',
        details: {
          to: to,
          from: process.env.SENDGRID_FROM_EMAIL,
          statusCode: response.statusCode,
          messageId: response.headers['x-message-id'],
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('SendGrid test error:', error)

    // Handle SendGrid-specific errors
    if (error.code === 403) {
      return NextResponse.json(
        {
          error: 'SendGrid API Key invalid or unauthorized',
          message: error.message,
          instructions: [
            '1. Verify your API Key is correct',
            '2. Make sure the API Key has "Mail Send" permission',
            '3. Check if the API Key is still active in SendGrid dashboard',
          ],
        },
        { status: 403 }
      )
    }

    if (error.code === 400) {
      return NextResponse.json(
        {
          error: 'SendGrid request error',
          message: error.message,
          details: error.response?.body?.errors || [],
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to send test email',
        message: error.message,
        code: error.code,
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check SendGrid configuration
export async function GET() {
  const isConfigured = !!(
    process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL
  )

  return NextResponse.json({
    configured: isConfigured,
    hasApiKey: !!process.env.SENDGRID_API_KEY,
    hasFromEmail: !!process.env.SENDGRID_FROM_EMAIL,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || null,
    fromName: process.env.SENDGRID_FROM_NAME || null,
    instructions: isConfigured
      ? 'SendGrid is configured. Send POST request with {"to": "email@example.com"} to test.'
      : 'SendGrid is not configured. Follow setup instructions.',
  })
}
