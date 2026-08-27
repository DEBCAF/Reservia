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

  if (!user) return <div className="min-h-screen bg-[#faf8f5] text-[#2c1810] p-8">Loading...</div>

  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#2c1810]">
      <div className="p-6 max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-[#8b7355] hover:text-[#2c1810] transition-colors mb-4 cursor-pointer"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold mb-1">Create Booking</h1>
        <p className="text-[#8b7355] text-sm mb-6">
          {date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select a date from the calendar'}
        </p>
        {/* Booking Form */}
        <form onSubmit={handleCreateBooking} className="bg-[#f5efe8] rounded-xl border border-[#d4c5b5] p-6 shadow-lg space-y-6">
          {/* User Info */}
          <div className="bg-[#ede4d8] p-4 rounded-lg">
            <label className="block text-sm mb-2 text-[#5c3d30]">Booked as</label>
            <input
              type="text"
              disabled
              className="w-full border border-[#d4c5b5] p-2 rounded bg-[#ede4d8] text-[#2c1810]"
              value={user.user_metadata?.full_name || user.email}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm mb-2 text-[#5c3d30]">Date</label>
            <input
              type="date"
              required
              className="w-full border border-[#d4c5b5] p-2 rounded bg-[#f5efe8] text-[#2c1810]"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-[#5c3d30]">Start Time</label>
              <input
                type="time"
                required
                className="w-full border border-[#d4c5b5] p-2 rounded bg-[#f5efe8] text-[#2c1810]"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-[#5c3d30]">End Time</label>
              <input
                type="time"
                required
                className="w-full border border-[#d4c5b5] p-2 rounded bg-[#f5efe8] text-[#2c1810]"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm mb-2 text-[#5c3d30]">
              Note <span className="text-[#8b7355]">(optional, private to admin)</span>
            </label>
            <input
              type="text"
              className="w-full border border-[#d4c5b5] p-2 rounded bg-[#f5efe8] text-[#2c1810]"
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
            {loading ? 'Creating...' : 'Create Booking'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f5] text-[#2c1810] p-8">Loading...</div>}>
      <NewBookingForm />
    </Suspense>
  )
}
