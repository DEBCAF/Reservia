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

  if (!user) return <div className="min-h-screen bg-[#2c1810] text-[#faf8f5] p-8">Loading...</div>

  return (
    <main className="min-h-screen bg-[#2c1810] text-[#faf8f5]">
      <div className="p-6 max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-[#a89080] hover:text-[#faf8f5] transition-colors mb-4 cursor-pointer font-bold"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold mb-1">Create Booking</h1>
        <p className="text-[#a89080] text-sm mb-6">
          {date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select a date from the calendar'}
        </p>
        {/* Booking Form */}
        <form onSubmit={handleCreateBooking} className="bg-[#1a0f09] rounded-xl border border-[#4a3228] p-6 shadow-lg space-y-6">
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
            className={`w-full py-3 rounded-lg font-bold transition-colors ${
              loading
                ? 'bg-[#4a3228] text-[#8b7355] cursor-not-allowed'
                : 'bg-[#4a3228] hover:bg-[#5c3d30] text-[#faf8f5] cursor-pointer'
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
    <Suspense fallback={<div className="min-h-screen bg-[#2c1810] text-[#faf8f5] p-8">Loading...</div>}>
      <NewBookingForm />
    </Suspense>
  )
}
