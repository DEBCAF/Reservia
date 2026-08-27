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
  note: string
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
    const { data } = await supabase.from('bookings').select('*')
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

  // 2 years from now
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
    // Only relevant for current month
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
    <main className="min-h-screen bg-[#2c1810] text-[#faf8f5]">
      <div className="p-6 max-w-5xl mx-auto">
        {/* Calendar */}
        <div className="bg-[#1a0f09] rounded-xl border border-[#4a3228] shadow-lg overflow-hidden">
          {/* Month Navigation */}
          <div className="flex justify-between items-center p-4 border-b border-[#4a3228]">
            <button
              onClick={prevMonth}
              disabled={!canGoPrev}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                !canGoPrev
                  ? 'text-[#4a3228] cursor-not-allowed'
                  : 'text-[#a89080] hover:text-[#faf8f5] hover:bg-[#4a3228] cursor-pointer'
              }`}
            >
              ← Prev
            </button>
            <h2 className="text-xl font-bold">{monthName}</h2>
            <button
              onClick={nextMonth}
              disabled={!canGoNext}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                !canGoNext
                  ? 'text-[#4a3228] cursor-not-allowed'
                  : 'text-[#a89080] hover:text-[#faf8f5] hover:bg-[#4a3228] cursor-pointer'
              }`}
            >
              Next →
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 border-b border-[#4a3228]">
            {dayNames.map((day) => (
              <div key={day} className="text-center py-3 text-sm font-bold text-[#a89080] border-r border-[#4a3228] last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="min-h-[100px] border-r border-b border-[#4a3228] bg-[#1a0f09]/50" />
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
                    min-h-[100px] p-2 border-r border-b border-[#4a3228] text-left transition-all font-bold
                    ${past
                      ? 'bg-[#2c1810] text-[#4a3228] cursor-not-allowed opacity-50'
                      : has
                        ? 'bg-[#4a3228] hover:bg-[#5c3d30] cursor-pointer'
                        : 'bg-[#1a0f09] hover:bg-[#4a3228] cursor-pointer'}
                  `}
                >
                  <span className={`text-lg font-bold ${past ? 'text-[#4a3228]' : has ? 'text-[#8b5e3c]' : 'text-[#a89080]'}`}>
                    {day}
                  </span>
                  {has && (
                    <div className="mt-1 space-y-1">
                      {bookingsByDate[dateStr]?.slice(0, 2).slice(0, 2).map((b) => (
                        <div key={b.id} className="text-xs text-[#a89080] truncate">
                          {b.user_name} · {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                        </div>
                      ))}
                      {count > 2 && (
                        <div className="text-xs text-[#8b5e3c] font-bold">+{count - 2} more</div>
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
