'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/src/lib/supabase'
import { useRouter } from 'next/navigation'

interface Booking {
  id: string
  user_id: string
  user_name: string
  start_time: string
  end_time: string
  note: string
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [note, setNote] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      fetchBookings()
    }
    loadData()
  }, [])

  async function fetchBookings() {
    const { data } = await supabase.from('bookings').select('*')
    if (data) setBookings(data)
  }

  async function handleCreateBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate) return alert('Select a date')

    const start = `${selectedDate}T${startTime}:00Z`
    const end = `${selectedDate}T${endTime}:00Z`
    const userName = user.user_metadata?.full_name || user.email

    const { error } = await supabase.from('bookings').insert({
      user_id: user.id,
      user_name: userName,
      start_time: start,
      end_time: end,
      note,
    })

    if (error) {
      alert(error.message)
    } else {
      // Call backend notify API
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Booking Created',
          userName: userName,
          date: selectedDate,
          startTime: startTime,
          endTime: endTime,
          note: note,
        }),
      })

      setNote('')
      fetchBookings()
    }
  }


  async function handleDelete(booking: Booking) {
    const { error } = await supabase.from('bookings').delete().eq('id', booking.id)
    
    if (!error) {
      const userName = user.user_metadata?.full_name || user.email

      // Call backend notify API
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Booking Cancelled',
          userName: userName,
          date: new Date(booking.start_time).toLocaleDateString(),
          startTime: new Date(booking.start_time).toLocaleTimeString(),
          endTime: new Date(booking.end_time).toLocaleTimeString(),
          note: booking.note,
        }),
      })

      fetchBookings()
    }
  }


  if (!user) return <div className="p-8 text-white">Loading...</div>

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Booking Dashboard</h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <form onSubmit={handleCreateBooking} className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-sm space-y-4">
            <h2 className="text-xl font-semibold text-white">Make a Booking</h2>
            <div>
              <label className="block text-sm mb-1 text-slate-300">Logged in as</label>
              <input type="text" disabled className="w-full border border-slate-600 p-2 rounded bg-slate-700 text-white" value={user.user_metadata?.full_name || user.email} />
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-300">Date</label>
              <input type="date" required className="w-full border border-slate-600 p-2 rounded bg-slate-700 text-white" onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-sm mb-1 text-slate-300">Start Time</label>
                <input type="time" className="w-full border border-slate-600 p-2 rounded bg-slate-700 text-white" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="w-1/2">
                <label className="block text-sm mb-1 text-slate-300">End Time</label>
                <input type="time" className="w-full border border-slate-600 p-2 rounded bg-slate-700 text-white" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-300">Note (Private to Admin)</label>
              <input type="text" className="w-full border border-slate-600 p-2 rounded bg-slate-700 text-white" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded transition-colors">Book Slot</button>
          </form>

          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-white">Existing Bookings</h2>
            <div className="space-y-3">
              {bookings.map((b) => {
                const isOwner = b.user_id === user.id
                return (
                  <div key={b.id} className="border border-slate-600 p-3 rounded flex justify-between items-center bg-slate-700">
                    <div>
                      <p className="font-semibold text-white">{new Date(b.start_time).toLocaleDateString()} ({new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(b.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</p>
                      <p className="text-sm text-slate-300">{isOwner ? `Booked by You (${b.note})` : 'Slot Occupied'}</p>
                    </div>
                    {isOwner && (
                      <button onClick={() => handleDelete(b)} className="text-red-400 hover:text-red-300 text-sm transition-colors">Delete</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
