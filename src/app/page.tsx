'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/src/lib/supabase'
import { useRouter } from 'next/navigation'

interface Booking {
  id: string
  user_id: string
  user_name: string
  start_time: string
  end_time: string
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
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
    const { data } = await supabase.from('bookings').select('id, user_id, user_name, start_time, end_time')
    if (data) setBookings(data)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthNum = now.getMonth()

  const maxDate = new Date(currentYear, currentMonthNum + 24, 1)
  const maxYear = maxDate.getFullYear()
  const maxMonth = maxDate.getMonth()

  const isCurrentMonth = year === currentYear && month === currentMonthNum
  const isMaxMonth = year === maxYear && month === maxMonth

  const canGoPrev = !isCurrentMonth
  const canGoNext = !(year > maxYear || (year === maxYear && month >= maxMonth))

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {}
    for (const b of bookings) {
      const date = new Date(b.start_time).toISOString().split('T')[0]
      if (!map[date]) map[date] = []
      map[date].push(b)
    }
    return map
  }, [bookings])

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

  const goToDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    router.push(`/bookings/${dateStr}`)
  }

  const hasBookings = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return bookingsByDate[dateStr] && bookingsByDate[dateStr].length > 0
  }

  const getBookingCount = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return bookingsByDate[dateStr] ? bookingsByDate[dateStr].length : 0
  }

  const isPastDate = (day: number) => {
    if (!isCurrentMonth) return false
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    return dateStr < todayStr
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (!user) return <div className="p-8 text-[#faf8f5]">Loading...</div>

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)

  return (
    <main className="min-h-screen text-[#f9f0e8]">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-[#f0c98d]/15 bg-[#231612] shadow-[0_24px_70px_rgba(29,17,14,0.75)] overflow-hidden ring-1 ring-[#f0c98d]/10">
          <div className="flex justify-between items-center p-4 border-b border-[#f0c98d]/10 bg-[radial-gradient(circle_at_top_left,_rgba(217,154,74,0.22),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]">
            <button
              onClick={prevMonth}
              disabled={!canGoPrev}
              className={`px-3 py-2 rounded-lg font-bold transition-colors ${
                !canGoPrev
                  ? 'text-[#7a5e4a] cursor-not-allowed'
                  : 'text-[#f0c98d] hover:text-[#fffaf5] hover:bg-[#4a3124] cursor-pointer'
              }`}
            >
              ← Prev
            </button>
            <h2 className="text-xl font-bold text-[#fffaf5]">{monthName}</h2>
            <button
              onClick={nextMonth}
              disabled={!canGoNext}
              className={`px-3 py-2 rounded-lg font-bold transition-colors ${
                !canGoNext
                  ? 'text-[#7a5e4a] cursor-not-allowed'
                  : 'text-[#f0c98d] hover:text-[#fffaf5] hover:bg-[#4a3124] cursor-pointer'
              }`}
            >
              Next →
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-[#f0c98d]/10 bg-[#351f18]">
            {dayNames.map((day) => (
              <div key={day} className="text-center py-3 text-sm font-bold text-[#f0d9b8] border-r border-[#f0c98d]/10 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="min-h-[110px] border-r border-b border-[#f0c98d]/10 bg-[#1d120d]/80" />
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const count = getBookingCount(day)
              const has = hasBookings(day)
              const past = isPastDate(day)

              return (
                <button
                  key={day}
                  onClick={past ? undefined : () => goToDate(day)}
                  className={`
                    min-h-[110px] p-2 border-r border-b border-[#f0c98d]/10 text-left transition-all font-bold
                    ${past
                      ? 'bg-[#17100d] text-[#7a5e4a] cursor-not-allowed opacity-50'
                      : has
                        ? 'bg-[linear-gradient(180deg,rgba(217,154,74,0.18),rgba(54,33,25,0.98))] hover:bg-[linear-gradient(180deg,rgba(217,154,74,0.28),rgba(69,47,35,1))] cursor-pointer'
                        : 'bg-[#1d120d] hover:bg-[#3a261c] cursor-pointer'}
                  `}
                >
                  <span className={`text-lg font-bold ${past ? 'text-[#7a5e4a]' : has ? 'text-[#f0c98d]' : 'text-[#f5e4ce]'}`}>
                    {day}
                  </span>
                  {has && (
                    <div className="mt-1 space-y-1">
                      {bookingsByDate[dateStr]?.slice(0, 2).map((b) => (
                        <div key={b.id} className="text-[11px] text-[#f8ecdf] truncate rounded-md bg-[#4d3023]/80 px-1.5 py-0.5">
                          {b.user_name} · {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                        </div>
                      ))}
                      {count > 2 && (
                        <div className="text-[11px] text-[#f0c98d] font-bold">+{count - 2} more</div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
