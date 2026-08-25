'use client'
import { useState } from 'react'
import { createClient } from '@/src/lib/supabase'
import { useRouter } from 'next/navigation'

const ALLOWED_USERNAMES = ['golden_dawn_debcaf', 'user1', 'user2']

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedUsername = username.trim().toLowerCase()
    if (!ALLOWED_USERNAMES.includes(trimmedUsername)) {
      alert('Access denied: Username not authorised')
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
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-lg border border-slate-700">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-3">{isSigningUp ? 'Sign Up' : 'Log In'}</h1>
          <div className="bg-slate-700 rounded-lg p-4 mb-4 space-y-2">
            <p className="text-slate-200 text-sm font-medium">
              Enter your Instagram username to book a timeslot to hang out with DEBCAF.
            </p>
            <p className="text-slate-400 text-xs">
              Only authorised Instagram accounts can access this site.
            </p>
            <p className="text-slate-400 text-xs">
              {isSigningUp
                ? 'New here? Create an account with your IG username and a password of your choice.'
                : 'Use your IG username and password to sign in.'}
            </p>
          </div>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Username</label>
            <input
              type="text"
              required
              className="w-full border border-slate-600 p-2 rounded bg-slate-700 text-white placeholder-slate-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Password</label>
            <input
              type="password"
              required
              className="w-full border border-slate-600 p-2 rounded bg-slate-700 text-white placeholder-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-medium transition-colors">
            {isSigningUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <button
          onClick={() => setIsSigningUp(!isSigningUp)}
          className="w-full text-center text-sm text-blue-400 mt-4 underline hover:text-blue-300"
        >
          {isSigningUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
        </button>
      </div>
    </main>
  )
}