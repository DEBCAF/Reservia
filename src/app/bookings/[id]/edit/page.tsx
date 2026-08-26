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

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

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
        startDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      )
      setEndTime(
        endDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
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

    const { count, error } = await supabase
      .from('bookings')
      .update({
        start_time: start,
        end_time: end,
        note,
      }, { count: 'exact' })
      .eq('id', booking.id)

    if (error || count !== 1) {
      alert(
        'Failed to update booking: ' +
          (error?.message || 'No booking was updated. Check your Supabase UPDATE policy.')
      )
      setLoading(false)
      return
    }

    // Send update notification
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Booking Updated',
          userName: booking.user_name,
          date: date,
          startTime: startTime,
          endTime: endTime,
          note: note,
          bookingId: booking.id,
        }),
      })
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

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', booking.id)

    if (error) {
      alert('Failed to delete booking: ' + error.message)
      setLoading(false)
      return
    }

    // Send delete notification
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Booking Deleted',
          userName: booking.user_name,
          date: date,
          startTime: startTime,
          endTime: endTime,
          note: note,
          bookingId: booking.id,
        }),
      })
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError)
    }

    router.push(`/bookings/${date}`)
  }

  if (fetching || !user) {
    return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white transition-colors mb-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Edit Booking</h1>
          <p className="text-slate-400 text-sm mt-1">
            {date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select a date from the calendar'}
          </p>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleUpdateBooking} className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg space-y-6">
          {/* User Info */}
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <label className="block text-sm mb-2 text-slate-300">Booked as</label>
            <input
              type="text"
              disabled
              className="w-full border border-slate-600 p-2 rounded bg-slate-600 text-white"
              value={user.user_metadata?.full_name || user.email}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm mb-2 text-slate-300">Date</label>
            <input
              type="date"
              required
              className="w-full border border-slate-600 p-2 rounded bg-slate-700 text-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-slate-300">Start Time</label>
              <input
                type="time"
                required
                className="w-full border border-slate-600 p-2 rounded bg-slate-700 text-white"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-slate-300">End Time</label>
              <input
                type="time"
                required
                className="w-full border border-slate-600 p-2 rounded bg-slate-700 text-white"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm mb-2 text-slate-300">
              Note <span className="text-slate-500">(optional, private to admin)</span>
            </label>
            <input
              type="text"
              className="w-full border border-slate-600 p-2 rounded bg-slate-700 text-white"
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
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {loading ? 'Updating...' : 'Update Booking'}
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDeleteBooking}
            className="w-full py-3 rounded-lg font-semibold bg-red-900/50 hover:bg-red-800/50 text-red-300 transition-colors"
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
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>}>
      <EditBookingForm />
    </Suspense>
  )
}
