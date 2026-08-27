import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase-server'

type RouteContext = { params: Promise<{ id: string }> }

function isValidBookingInput(value: unknown): value is {
  start_time: string
  end_time: string
  note: string
} {
  if (!value || typeof value !== 'object') return false
  const input = value as Record<string, unknown>
  if (typeof input.start_time !== 'string' || typeof input.end_time !== 'string') return false
  if (typeof input.note !== 'string' || input.note.length > 200) return false

  const start = new Date(input.start_time)
  const end = new Date(input.end_time)
  return Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && start < end
}

async function getAuthorizedBooking(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { supabase, user: null, query: null }

  let query = supabase.from('bookings').select('id, user_id').eq('id', id)
  if (user.app_metadata?.role !== 'admin') query = query.eq('user_id', user.id)

  return { supabase, user, query }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params
  const { supabase, user, query } = await getAuthorizedBooking(id)
  if (!user || !query) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!isValidBookingInput(body)) {
    return NextResponse.json({ error: 'Invalid booking data' }, { status: 400 })
  }

  const { data: booking } = await query.single()
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const { error } = await supabase
    .from('bookings')
    .update({
      start_time: body.start_time,
      end_time: body.end_time,
      note: body.note,
    })
    .eq('id', id)

  if (error) {
    const status = error.code === '23P01' ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const { supabase, user, query } = await getAuthorizedBooking(id)
  if (!user || !query) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: booking } = await query.single()
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}