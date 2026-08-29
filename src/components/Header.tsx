'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/src/lib/supabase'

export default function Header() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const userName = user?.user_metadata?.full_name || user?.email || 'User'
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="border-b border-white/10 bg-[#0e1728]/90 backdrop-blur-md shadow-[0_12px_30px_rgba(15,23,42,0.35)]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffb857] via-[#ff8a3d] to-[#f97316] shadow-[0_10px_24px_rgba(255,138,61,0.45)] flex items-center justify-center cursor-pointer ring-2 ring-white/10 group-hover:scale-105 group-hover:ring-[#7ef0d1]/50">
            <svg className="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Reservini</h1>
            <p className="text-xs text-slate-300">Book your time with DEBCAF</p>
          </div>
        </Link>

        {user ? (
          <Link
            href="/profile"
            className="flex items-center gap-2 bg-gradient-to-r from-[#263859] to-[#1b2d49] hover:from-[#2e426d] hover:to-[#1e3358] text-white px-3 py-2 rounded-xl transition-colors cursor-pointer font-bold shadow-[0_8px_24px_rgba(30,51,88,0.45)] ring-1 ring-white/10"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7ef0d1] to-[#46d9b1] text-slate-950 flex items-center justify-center text-xs font-black">
              {initials}
            </div>
            <span className="text-sm hidden sm:inline">{userName}</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-gradient-to-r from-[#ffb857] to-[#ff8a3d] hover:from-[#ffc76d] hover:to-[#ff9a4a] text-slate-950 px-4 py-2 rounded-xl transition-colors text-sm font-black cursor-pointer shadow-[0_10px_20px_rgba(255,138,61,0.3)]"
          >
            Log In
          </Link>
        )}
      </div>
    </header>
  )
}
