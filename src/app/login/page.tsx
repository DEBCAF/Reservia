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
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_rgba(217,154,74,0.25),transparent_28%),linear-gradient(180deg,#1b120d_0%,#2c1d16_50%,#1a120d_100%)]">
      <div className="w-full max-w-md p-8 bg-[#120d0a] rounded-xl shadow-[0_28px_60px_rgba(10,6,4,0.7)] border border-[#d99a4a]/60">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#fffaf5] mb-3">{isSigningUp ? 'Sign Up' : 'Log In'}</h1>
          <div className="bg-gradient-to-r from-[#d99a4a]/18 to-[#7c4d32]/20 rounded-lg p-4 mb-4 space-y-2 border border-[#d99a4a]/35">
            <p className="text-[#f0c98d] text-sm font-medium">
              Enter your Instagram username to book a timeslot to hang out with DEBCAF.
            </p>
            <p className="text-[#d9b997] text-xs">
              Only authorised Instagram accounts can access this site.
            </p>
            <p className="text-[#f3d8b5] text-xs">
              {isSigningUp
                ? 'New here? Create an account with your IG username and a password of your choice.'
                : 'Use your IG username and password to sign in.'}
            </p>
          </div>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[#f0c98d]">Username</label>
            <input
              type="text"
              required
              className="w-full border border-[#d99a4a]/70 p-2 rounded bg-[#2c1d16] text-[#fffaf5] placeholder-[#d9b997] focus:ring-2 focus:ring-[#f0c98d] focus:border-transparent outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[#f0c98d]">Password</label>
            <input
              type="password"
              required
              className="w-full border border-[#d99a4a]/70 p-2 rounded bg-[#2c1d16] text-[#fffaf5] placeholder-[#d9b997] focus:ring-2 focus:ring-[#f0c98d] focus:border-transparent outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-[#f0c98d] to-[#b7682d] hover:from-[#f7d9a0] hover:to-[#c87839] text-[#1b120d] py-2 rounded font-bold transition-all cursor-pointer shadow-lg hover:shadow-xl">
            {isSigningUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <button
          onClick={() => setIsSigningUp(!isSigningUp)}
          className="w-full text-center text-sm text-[#f0c98d] mt-4 underline hover:text-[#fffaf5] cursor-pointer font-bold transition-colors"
        >
          {isSigningUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
        </button>
      </div>
    </main>
  )
}