'use client'
import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/src/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

interface Booking {
  id: string
  user_id: string
  user_name: string
  start_time: string
  end_time: string
  note: string
}

function EditBookingForm() {
  const [user, setUser] = useState<any>(null)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  // Calculate min (today) and max (2 years from now) dates for the date input
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const maxDate = new Date(today)
  maxDate.setFullYear(maxDate.getFullYear() + 2)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Fetch the booking by ID
      const bookingId = params?.id as string
      if (!bookingId) {
        router.push('/bookings')
        return
      }

      let bookingQuery = supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
      if (user.app_metadata?.role !== 'admin') {
        bookingQuery = bookingQuery.eq('user_id', user.id)
      }
      const { data, error } = await bookingQuery.single()

      if (error || !data) {
        alert('Booking not found')
        router.push('/bookings')
        return
      }

      setBooking(data)
      
      // Extract date and time from the booking
      const startDate = new Date(data.start_time)
      const endDate = new Date(data.end_time)
      
      setDate(startDate.toISOString().split('T')[0])
      setStartTime(
        `${String(startDate.getUTCHours()).padStart(2, '0')}:${String(startDate.getUTCMinutes()).padStart(2, '0')}`
      )
      setEndTime(
        `${String(endDate.getUTCHours()).padStart(2, '0')}:${String(endDate.getUTCMinutes()).padStart(2, '0')}`
      )
      setNote(data.note || '')
      setFetching(false)
    }
    loadData()
  }, [params])

  async function handleUpdateBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!date) return alert('Please select a date')
    if (!startTime || !endTime) return alert('Please select start and end times')
    if (!booking) return

    if (endTime <= startTime) {
      return alert('End time must be later than start time')
    }

    setLoading(true)

    const start = `${date}T${startTime}:00Z`
    const end = `${date}T${endTime}:00Z`

    const { data: existingBookings, error: availabilityError } = await supabase
      .from('bookings')
      .select('id')
      .neq('id', booking.id)
      .lt('start_time', end)
      .gt('end_time', start)

    if (availabilityError) {
      alert('Unable to check availability: ' + availabilityError.message)
      setLoading(false)
      return
    }
    if (existingBookings.length > 0) {
      alert('That time overlaps another booking.')
      setLoading(false)
      return
    }

    const updateResponse = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_time: start, end_time: end, note }),
    })

    if (!updateResponse.ok) {
      const result = await updateResponse.json().catch(() => null)
      alert(
        'Failed to update booking: ' +
          (result?.error || 'No booking was updated.')
      )
      setLoading(false)
      return
    }

    // Send update notification
    try {
      const notifyResponse = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Booking Updated', bookingId: booking.id,
        }),
      })
      if (!notifyResponse.ok) {
        console.error('Notification failed:', await notifyResponse.text())
      }
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError)
    }

    setLoading(false)
    router.push(`/bookings/${date}`)
  }

  async function handleDeleteBooking() {
    if (!booking) return
    if (!confirm('Are you sure you want to delete this booking?')) return

    setLoading(true)

    try {
      const notifyResponse = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'Booking Deleted', bookingId: booking.id }),
      })
      if (!notifyResponse.ok) console.error('Notification failed:', await notifyResponse.text())
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError)
    }

    const deleteResponse = await fetch(`/api/bookings/${booking.id}`, { method: 'DELETE' })

    if (!deleteResponse.ok) {
      const result = await deleteResponse.json().catch(() => null)
      alert('Failed to delete booking: ' + (result?.error || 'Request failed'))
      setLoading(false)
      return
    }

    router.push(`/bookings/${date}`)
  }

  if (fetching || !user) {
    return <div className="min-h-screen bg-[#1b120d] text-[#f9f0e8] p-8">Loading...</div>
  }

  return (
    <main className="min-h-screen bg-[#1b120d] text-[#f9f0e8]">
      <div className="p-6 max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-[#d9b997] hover:text-[#fffaf5] transition-colors mb-4 cursor-pointer font-bold"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold mb-1 text-[#fffaf5]">Edit Booking</h1>
        <p className="text-[#d9b997] text-sm mb-6">
          {date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select a date from the calendar'}
        </p>
        <form onSubmit={handleUpdateBooking} className="bg-[#231612] rounded-xl border border-[#d99a4a]/25 p-6 shadow-[0_16px_30px_rgba(0,0,0,0.2)] space-y-6">
          <div className="bg-[#4a3124] p-4 rounded-lg">
            <label className="block text-sm font-bold text-[#f0c98d]">Booked as</label>
            <input
              type="text"
              disabled
              className="w-full border border-[#d99a4a]/30 p-2 rounded bg-[#4a3124] text-[#fffaf5]"
              value={user.user_metadata?.full_name || user.email}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#f0c98d]">Date</label>
            <input
              type="date"
              required
              min={todayStr}
              max={maxDateStr}
              className="w-full border border-[#d99a4a]/35 p-2 rounded bg-[#2a1d16] text-[#fffaf5]"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#f0c98d]">Start Time</label>
              <input
                type="time"
                required
                className="w-full border border-[#d99a4a]/35 p-2 rounded bg-[#2a1d16] text-[#fffaf5]"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#f0c98d]">End Time</label>
              <input
                type="time"
                required
                className="w-full border border-[#d99a4a]/35 p-2 rounded bg-[#2a1d16] text-[#fffaf5]"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#f0c98d]">
              Note <span className="text-[#d9b997]">(optional, private to admin)</span>
            </label>
            <input
              type="text"
              maxLength={200}
              className="w-full border border-[#d99a4a]/35 p-2 rounded bg-[#2a1d16] text-[#fffaf5]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a private note..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              loading
                ? 'bg-[#d9b997] text-[#4a3124] cursor-not-allowed'
                : 'bg-[#4a3124] hover:bg-[#5d3b2d] text-[#fffaf5] cursor-pointer'
            }`}
          >
            {loading ? 'Updating...' : 'Update Booking'}
          </button>

          <button
            type="button"
            onClick={handleDeleteBooking}
            className="w-full py-3 rounded-lg font-semibold bg-[#b7682d] hover:bg-[#9a5627] text-[#fffaf5] transition-colors cursor-pointer"
          >
            Delete Booking
          </button>
        </form>
      </div>
    </main>
  )
}

export default function EditBookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1b120d] text-[#f9f0e8] p-8">Loading...</div>}>
      <EditBookingForm />
    </Suspense>
  )
}
