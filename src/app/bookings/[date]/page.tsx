'use client'
import { useEffect, useState } from 'react'
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

export default function DateDetailPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [date, setDate] = useState('')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      const dateParam = params?.date as string
      if (dateParam) {
        setDate(dateParam)
        fetchBookings(dateParam)
      }
    }
    loadUser()
  }, [params])

  async function fetchBookings(dateParam: string) {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .gte('start_time', `${dateParam}T00:00:00Z`)
      .lt('start_time', `${dateParam}T23:59:59Z`)
      .order('start_time', { ascending: true })
    if (data) setBookings(data)
  }

  async function handleDeleteBooking(bookingId: string) {
    if (!confirm('Are you sure you want to delete this booking?')) return

    let deleteQuery = supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId)
    if (user?.app_metadata?.role !== 'admin') {
      deleteQuery = deleteQuery.eq('user_id', user.id)
    }
    const { error } = await deleteQuery
    
    if (error) {
      alert('Failed to delete booking: ' + error.message)
      return
    }

    // Send delete notification
    const deletedBooking = bookings.find(b => b.id === bookingId)
    if (deletedBooking) {
      try {
        const notifyResponse = await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'Booking Deleted',
            userName: deletedBooking.user_name,
            date: date,
            startTime: new Date(deletedBooking.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }),
            endTime: new Date(deletedBooking.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }),
            note: deletedBooking.note,
            bookingId: bookingId,
          }),
        })
        if (!notifyResponse.ok) {
          console.error('Notification failed:', await notifyResponse.text())
        }
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError)
      }
    }
    
    // Refresh the bookings list
    fetchBookings(date)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <main className="min-h-screen bg-[#2c1810] text-[#faf8f5]">
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="text-[#a89080] hover:text-[#faf8f5] transition-colors mb-4 cursor-pointer font-bold"
        >
          ← Back to Calendar
        </button>
        <h1 className="text-3xl font-bold">{formatDate(date)}</h1>
        <p className="text-[#a89080] text-sm mb-6">
          {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} for this date
        </p>
        <div className="flex justify-end mb-6">
          <button
            onClick={() => router.push(`/bookings/new?date=${date}`)}
            className="bg-[#4a3228] hover:bg-[#5c3d30] text-[#faf8f5] px-6 py-3 rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-bold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Booking
          </button>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-[#1a0f09] rounded-xl border border-[#4a3228] p-12 text-center">
            <p className="text-[#a89080] text-lg font-bold">No bookings for this date</p>
            <button
              onClick={() => router.push(`/bookings/new?date=${date}`)}
              className="mt-4 bg-[#4a3228] hover:bg-[#5c3d30] text-[#faf8f5] px-6 py-2 rounded-lg transition-colors cursor-pointer font-bold"
            >
              Create First Booking
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-[#1a0f09] rounded-xl border border-[#4a3228] p-6 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-[#faf8f5] mb-2">
                      {booking.user_name}
                    </h3>
                    <div className="flex items-center gap-4 text-[#a89080] text-sm">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} - {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                      </span>
                    </div>
                    {booking.note && (
                      <p className="text-[#a89080] mt-3 text-sm bg-[#4a3228] p-3 rounded font-bold break-words max-w-xs">
                        {booking.note}
                      </p>
                    )}
                  </div>
                  {(user?.id === booking.user_id || user?.app_metadata?.role === 'admin') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/bookings/${booking.id}/edit`)}
                        className="bg-[#4a3228] hover:bg-[#5c3d30] text-[#faf8f5] px-3 py-1 rounded transition-colors text-sm cursor-pointer font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="bg-[#8b5e3c] hover:bg-[#6b4530] text-[#faf8f5] px-3 py-1 rounded transition-colors text-sm cursor-pointer font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
