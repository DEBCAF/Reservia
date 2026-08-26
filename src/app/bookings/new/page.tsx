'use client'
import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/src/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function NewBookingForm() {
  const [user, setUser] = useState<any>(null)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Get date from query parameter
      const dateParam = searchParams.get('date')
      if (dateParam) {
        setDate(dateParam)
      }
    }
    loadData()
  }, [searchParams])

  async function handleCreateBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!date) return alert('Please select a date')
    if (!startTime || !endTime) return alert('Please select start and end times')

    setLoading(true)

    const start = `${date}T${startTime}:00Z`
    const end = `${date}T${endTime}:00Z`
    const userName = user?.user_metadata?.full_name || user?.email || 'Unknown'

    const { error } = await supabase.from('bookings').insert({
      user_id: user.id,
      user_name: userName,
      start_time: start,
      end_time: end,
      note,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    // Call backend notify API
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Booking Created',
          userName: userName,
          date: date,
          startTime: startTime,
          endTime: endTime,
          note: note,
        }),
      })
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError)
    }

    setLoading(false)
    router.push(`/bookings/${date}`)
  }

  if (!user) return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="p-6 max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white transition-colors mb-4"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold mb-1">Create Booking</h1>
        <p className="text-slate-400 text-sm mb-6">
          {date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select a date from the calendar'}
        </p>
        {/* Booking Form */}
        <form onSubmit={handleCreateBooking} className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg space-y-6">
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
            {loading ? 'Creating...' : 'Create Booking'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>}>
      <NewBookingForm />
    </Suspense>
  )
}
