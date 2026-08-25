'use client'
import { useState } from 'react'
import { createClient } from '@/src/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [fullName, setFullName] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSigningUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
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
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md border">
        <h1 className="text-2xl font-bold text-center mb-6">{isSigningUp ? 'Sign Up' : 'Log In'}</h1>
        <form onSubmit={handleAuth} className="space-y-4">
          {isSigningUp && (
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full border p-2 rounded"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full border p-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full border p-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium">
            {isSigningUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <button
          onClick={() => setIsSigningUp(!isSigningUp)}
          className="w-full text-center text-sm text-blue-600 mt-4 underline"
        >
          {isSigningUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
        </button>
      </div>
    </main>
  )
}