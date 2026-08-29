import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

const allowedActions = new Set(['Booking Created', 'Booking Updated', 'Booking Deleted'])

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character]!)
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false }, { status: 401 })

    if (!process.env.RESEND_API_KEY || !process.env.NOTIFICATION_EMAIL || !process.env.NOTIFICATION_FROM) {
      return NextResponse.json(
        { success: false, error: 'Notification service is not configured' },
        { status: 500 }
      )
    }

    const { action, bookingId } = await request.json()
    if (typeof action !== 'string' || !allowedActions.has(action) || typeof bookingId !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid notification' }, { status: 400 })
    }

    let bookingQuery = supabase.from('bookings').select('id, user_id, user_name, start_time, end_time, note').eq('id', bookingId)
    if (user.app_metadata?.role !== 'admin') bookingQuery = bookingQuery.eq('user_id', user.id)
    const { data: booking } = await bookingQuery.single()
    if (!booking) return NextResponse.json({ success: false }, { status: 404 })

    const userName = escapeHtml(booking.user_name)
    const date = escapeHtml(booking.start_time.slice(0, 10))
    const startTime = escapeHtml(booking.start_time.slice(11, 16))
    const endTime = escapeHtml(booking.end_time.slice(11, 16))
    const note = escapeHtml(booking.note || 'None')
    const safeAction = escapeHtml(action)

    const subject = `[Booking Alert] ${userName} - ${safeAction.toUpperCase()}`
    let htmlContent = `
      <h2>Booking Notification</h2>
      <p><strong>Action:</strong> ${safeAction}</p>
      <p><strong>User:</strong> ${userName}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
      <p><strong>Note:</strong> ${note}</p>
    `

    if (action === 'Booking Updated' || action === 'Booking Deleted') {
      htmlContent += `<p><strong>Booking ID:</strong> ${escapeHtml(bookingId)}</p>`
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const data = await resend.emails.send({
      from: process.env.NOTIFICATION_FROM,
      to: [process.env.NOTIFICATION_EMAIL],
      subject: subject,
      html: htmlContent,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to send notification'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}