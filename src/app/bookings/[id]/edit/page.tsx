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
    return <div className="min-h-screen bg-[#2c1810] text-[#faf8f5] p-8">Loading...</div>
  }

  return (
    <main className="min-h-screen bg-[#2c1810] text-[#faf8f5]">
      <div className="p-6 max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-[#a89080] hover:text-[#faf8f5] transition-colors mb-4 cursor-pointer font-bold"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold mb-1">Edit Booking</h1>
        <p className="text-[#a89080] text-sm mb-6">
          {date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select a date from the calendar'}
        </p>
        {/* Booking Form */}
        <form onSubmit={handleUpdateBooking} className="bg-[#1a0f09] rounded-xl border border-[#4a3228] p-6 shadow-lg space-y-6">
          {/* User Info */}
          <div className="bg-[#4a3228] p-4 rounded-lg">
            <label className="block text-sm font-bold text-[#a89080]">Booked as</label>
            <input
              type="text"
              disabled
              className="w-full border border-[#4a3228] p-2 rounded bg-[#4a3228] text-[#faf8f5]"
              value={user.user_metadata?.full_name || user.email}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-bold text-[#a89080]">Date</label>
            <input
              type="date"
              required
              min={todayStr}
              max={maxDateStr}
              className="w-full border border-[#4a3228] p-2 rounded bg-[#2c1810] text-[#faf8f5]"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#a89080]">Start Time</label>
              <input
                type="time"
                required
                className="w-full border border-[#4a3228] p-2 rounded bg-[#2c1810] text-[#faf8f5]"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#a89080]">End Time</label>
              <input
                type="time"
                required
                className="w-full border border-[#4a3228] p-2 rounded bg-[#2c1810] text-[#faf8f5]"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-bold text-[#a89080]">
              Note <span className="text-[#a89080]">(optional, private to admin)</span>
            </label>
            <input
              type="text"
              maxLength={200}
              className="w-full border border-[#4a3228] p-2 rounded bg-[#2c1810] text-[#faf8f5]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a private note..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              loading
                ? 'bg-[#d4c5b5] text-[#8b7355] cursor-not-allowed'
                : 'bg-[#2c1810] hover:bg-[#3d2518] text-[#faf8f5] cursor-pointer'
            }`}
          >
            {loading ? 'Updating...' : 'Update Booking'}
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDeleteBooking}
            className="w-full py-3 rounded-lg font-semibold bg-[#8b5e3c] hover:bg-[#6b4530] text-[#faf8f5] transition-colors cursor-pointer"
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
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f5] text-[#2c1810] p-8">Loading...</div>}>
      <EditBookingForm />
    </Suspense>
  )
}
