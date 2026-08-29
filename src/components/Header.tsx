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
    <header className="border-b border-[#6e4c3a]/40 bg-[#20120d]/95 backdrop-blur-md shadow-[0_8px_24px_rgba(29,17,14,0.45)]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f0c98d] via-[#d99a4a] to-[#b7682d] shadow-[0_10px_24px_rgba(183,104,45,0.4)] flex items-center justify-center cursor-pointer ring-2 ring-[#f7e2bf]/30 group-hover:scale-105">
            <svg className="w-5 h-5 text-[#1b120d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#fffaf5]">Reservini</h1>
            <p className="text-xs text-[#d9b997]">Book your time with DEBCAF</p>
          </div>
        </Link>

        {user ? (
          <Link
            href="/profile"
            className="flex items-center gap-2 bg-[#452d1e] hover:bg-[#5a3728] text-[#fffaf5] px-3 py-2 rounded-xl transition-colors cursor-pointer font-bold shadow-[0_8px_20px_rgba(69,45,30,0.35)] ring-1 ring-[#f0c98d]/20"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#f0c98d] to-[#d99a4a] text-[#1b120d] flex items-center justify-center text-xs font-black">
              {initials}
            </div>
            <span className="text-sm hidden sm:inline">{userName}</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-gradient-to-r from-[#f0c98d] to-[#d99a4a] hover:from-[#f6d89f] hover:to-[#df9d58] text-[#1b120d] px-4 py-2 rounded-xl transition-colors text-sm font-black cursor-pointer shadow-[0_10px_20px_rgba(217,154,74,0.25)]"
          >
            Log In
          </Link>
        )}
      </div>
    </header>
  )
}
