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
      alert('Access denied: Username not authorised! Use your Instagram username!! Only works for friends btw')
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
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#faf8f5]">
      <div className="w-full max-w-md p-8 bg-[#f5efe8] rounded-xl shadow-lg border border-[#d4c5b5]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#2c1810] mb-3">{isSigningUp ? 'Sign Up' : 'Log In'}</h1>
          <div className="bg-[#ede4d8] rounded-lg p-4 mb-4 space-y-2">
            <p className="text-[#5c3d30] text-sm font-medium">
              Enter your Instagram username to book a timeslot to hang out with DEBCAF.
            </p>
            <p className="text-[#8b7355] text-xs">
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
            <label className="block text-sm font-medium mb-1 text-[#5c3d30]">Username</label>
            <input
              type="text"
              required
              className="w-full border border-[#d4c5b5] p-2 rounded bg-[#f5efe8] text-[#2c1810] placeholder-[#8b7355]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[#5c3d30]">Password</label>
            <input
              type="password"
              required
              className="w-full border border-[#d4c5b5] p-2 rounded bg-[#f5efe8] text-[#2c1810] placeholder-[#8b7355]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-[#2c1810] hover:bg-[#3d2518] text-[#faf8f5] py-2 rounded font-medium transition-colors cursor-pointer">
            {isSigningUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <button
          onClick={() => setIsSigningUp(!isSigningUp)}
          className="w-full text-center text-sm text-[#8b5e3c] mt-4 underline hover:text-[#6b4530] cursor-pointer"
        >
          {isSigningUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
        </button>
      </div>
    </main>
  )
}