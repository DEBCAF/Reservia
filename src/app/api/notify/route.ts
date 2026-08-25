import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { action, userName, date, startTime, endTime, note } = await request.json()

    // Configure email message details
    const subject = `[Booking Alert] ${userName} - ${action.toUpperCase()}`
    const htmlContent = `
      <h2>Booking Notification</h2>
      <p><strong>Action:</strong> ${action}</p>
      <p><strong>User:</strong> ${userName}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
      <p><strong>Note:</strong> ${note || 'None'}</p>
    `

    // Send email using Resend
    // Note: 'onboarding@resend.dev' is the default free sender domain provided by Resend
    const data = await resend.emails.send({
      from: 'Booking App <onboarding@resend.dev>',
      to: ['your-email@example.com'], // REPLACE WITH YOUR ACTUAL EMAIL ADDRESS
      subject: subject,
      html: htmlContent,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}
