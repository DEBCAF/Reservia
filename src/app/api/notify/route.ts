import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'RESEND_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const { action, userName, date, startTime, endTime, note, bookingId } = await request.json()

    // Configure email message details
    let subject = `[Booking Alert] ${userName} - ${action.toUpperCase()}`
    let htmlContent = `
      <h2>Booking Notification</h2>
      <p><strong>Action:</strong> ${action}</p>
      <p><strong>User:</strong> ${userName}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
      <p><strong>Note:</strong> ${note || 'None'}</p>
    `

    // Add booking ID for update/delete actions
    if (action === 'Booking Updated' || action === 'Booking Deleted') {
      htmlContent += `<p><strong>Booking ID:</strong> ${bookingId}</p>`
    }

    // Send email using Resend
    // Note: 'onboarding@resend.dev' is the default free sender domain provided by Resend
    const data = await resend.emails.send({
      from: 'Booking App <onboarding@resend.dev>',
      to: ['shinjitakamiya450@gmail.com'], // REPLACE WITH YOUR ACTUAL EMAIL ADDRESS
      subject: subject,
      html: htmlContent,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to send notification'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
