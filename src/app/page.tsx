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
    <main className="min-h-screen text-[#eef4ff]">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(19,29,47,0.96),rgba(14,22,37,0.96))] shadow-[0_24px_70px_rgba(2,6,23,0.7)] overflow-hidden ring-1 ring-white/5">
          <div className="flex justify-between items-center p-4 border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,184,87,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]">
            <button
              onClick={prevMonth}
              disabled={!canGoPrev}
              className={`px-3 py-2 rounded-lg font-bold transition-colors ${
                !canGoPrev
                  ? 'text-slate-500 cursor-not-allowed'
                  : 'text-[#f6d08d] hover:text-white hover:bg-[#2d3d5d] cursor-pointer'
              }`}
            >
              ← Prev
            </button>
            <h2 className="text-xl font-bold text-white">{monthName}</h2>
            <button
              onClick={nextMonth}
              disabled={!canGoNext}
              className={`px-3 py-2 rounded-lg font-bold transition-colors ${
                !canGoNext
                  ? 'text-slate-500 cursor-not-allowed'
                  : 'text-[#7ef0d1] hover:text-white hover:bg-[#2d3d5d] cursor-pointer'
              }`}
            >
              Next →
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-white/10 bg-[#1d2b42]">
            {dayNames.map((day) => (
              <div key={day} className="text-center py-3 text-sm font-bold text-[#dfeafc] border-r border-white/10 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="min-h-[110px] border-r border-b border-white/10 bg-[#101a2c]/70" />
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
                    min-h-[110px] p-2 border-r border-b border-white/10 text-left transition-all font-bold
                    ${past
                      ? 'bg-[#0f1729] text-slate-500 cursor-not-allowed opacity-50'
                      : has
                        ? 'bg-[linear-gradient(180deg,rgba(255,184,87,0.18),rgba(30,41,59,0.95))] hover:bg-[linear-gradient(180deg,rgba(255,184,87,0.24),rgba(39,49,72,0.98))] cursor-pointer'
                        : 'bg-[#101a2c] hover:bg-[#1b2941] cursor-pointer'}
                  `}
                >
                  <span className={`text-lg font-bold ${past ? 'text-slate-500' : has ? 'text-[#ffb857]' : 'text-[#dfeafc]'}`}>
                    {day}
                  </span>
                  {has && (
                    <div className="mt-1 space-y-1">
                      {bookingsByDate[dateStr]?.slice(0, 2).map((b) => (
                        <div key={b.id} className="text-[11px] text-slate-200 truncate rounded-md bg-white/5 px-1.5 py-0.5">
                          {b.user_name} · {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                        </div>
                      ))}
                      {count > 2 && (
                        <div className="text-[11px] text-[#7ef0d1] font-bold">+{count - 2} more</div>
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
