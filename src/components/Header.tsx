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
  }, [])

  const userName = user?.user_metadata?.full_name || user?.email || 'User'
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="bg-slate-800 border-b border-slate-700 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Branding / Banner Text */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Reservini</h1>
            <p className="text-xs text-slate-400">Book your time with DEBCAF</p>
          </div>
        </Link>

        {/* Right: Profile */}
        {user ? (
          <Link
            href="/profile"
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <span className="text-sm hidden sm:inline">{userName}</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            Log In
          </Link>
        )}
      </div>
    </header>
  )
}
