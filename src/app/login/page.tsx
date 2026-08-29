'use client'
import { useState } from 'react'
import { createClient } from '@/src/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedUsername = username.trim().toLowerCase()

    const authorizationResponse = await fetch('/api/auth/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: trimmedUsername }),
    })

    if (!authorizationResponse.ok) {
      alert('Access denied: Username not authorised! Use your Instagram username!!')
      return
    }
    const email = `${trimmedUsername}@booking.internal`
    if (isSigningUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: trimmedUsername } }
      })
      if (error) alert(error.message)
      else alert('Account created! You can now log in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
      else router.push('/')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-[#1a0f09] via-[#2c1810] to-[#1a0f09]">
      <div className="w-full max-w-md p-8 bg-[#0d0704] rounded-xl shadow-2xl border-2 border-[#d4a054]">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-3">{isSigningUp ? 'Sign Up' : 'Log In'}</h1>
          <div className="bg-gradient-to-r from-[#d4a054]/20 to-[#8b5e3c]/20 rounded-lg p-4 mb-4 space-y-2 border border-[#d4a054]/30">
            <p className="text-[#d4a054] text-sm font-medium">
              Enter your Instagram username to book a timeslot to hang out with DEBCAF.
            </p>
            <p className="text-[#a89080] text-xs">
              Only authorised Instagram accounts can access this site.
            </p>
            <p className="text-[#8b7355] text-xs">
              {isSigningUp
                ? 'New here? Create an account with your IG username and a password of your choice.'
                : 'Use your IG username and password to sign in.'}
            </p>
          </div>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[#d4a054]">Username</label>
            <input
              type="text"
              required
              className="w-full border border-[#d4a054]/50 p-2 rounded bg-[#2c1810] text-white placeholder-[#8b7355] focus:ring-2 focus:ring-[#d4a054] focus:border-transparent outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[#d4a054]">Password</label>
            <input
              type="password"
              required
              className="w-full border border-[#d4a054]/50 p-2 rounded bg-[#2c1810] text-white placeholder-[#8b7355] focus:ring-2 focus:ring-[#d4a054] focus:border-transparent outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-[#d4a054] to-[#8b5e3c] hover:from-[#e0b060] hover:to-[#9b6e4c] text-[#0d0704] py-2 rounded font-bold transition-all cursor-pointer shadow-lg hover:shadow-xl">
            {isSigningUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <button
          onClick={() => setIsSigningUp(!isSigningUp)}
          className="w-full text-center text-sm text-[#d4a054] mt-4 underline hover:text-white cursor-pointer font-bold transition-colors"
        >
          {isSigningUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
        </button>
      </div>
    </main>
  )
}