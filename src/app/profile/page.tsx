'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/src/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    loadUser()
  }, [])

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setMessageType('')

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.')
      setMessageType('error')
      return
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.')
      setMessageType('error')
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      setMessage('Failed to update password: ' + error.message)
      setMessageType('error')
    } else {
      setMessage('Password updated successfully!')
      setMessageType('success')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') {
      setMessage('Type "DELETE" to confirm account deletion.')
      setMessageType('error')
      return
    }

    const { error } = await supabase.auth.admin.deleteUser(user.id)
    if (error) {
      setMessage('Failed to delete account: ' + error.message)
      setMessageType('error')
    } else {
      await supabase.auth.signOut()
      router.push('/login')
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>

  const displayName = user?.user_metadata?.full_name || user?.email || 'Unknown'

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white transition-colors mb-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>

        {/* User Info */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-lg font-bold">
              {displayName
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{displayName}</h2>
              <p className="text-slate-400 text-sm">{user.email}</p>
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
            <p className="text-slate-300 text-sm">
              <span className="font-medium">Account ID:</span> {user.id}
            </p>
            <p className="text-slate-300 text-sm">
              <span className="font-medium">Joined:</span>{' '}
              {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg text-sm ${
              messageType === 'success'
                ? 'bg-green-900/50 text-green-300 border border-green-700'
                : 'bg-red-900/50 text-red-300 border border-red-700'
            }`}
          >
            {message}
          </div>
        )}

        {/* Change Password */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-slate-600 p-2 rounded bg-slate-700 text-white placeholder-slate-400"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-slate-600 p-2 rounded bg-slate-700 text-white placeholder-slate-400"
                placeholder="Confirm new password"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-medium transition-colors"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-slate-800 rounded-xl border border-red-900/50 p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300">Log Out</p>
                <p className="text-slate-400 text-sm">Sign out of your account on this device</p>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors text-sm"
              >
                Log Out
              </button>
            </div>
            <hr className="border-slate-700" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-red-400 font-medium">Delete Account</p>
                <p className="text-slate-400 text-sm">
                  Permanently delete your account and all your bookings. This action cannot be undone.
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="border border-slate-600 p-2 rounded bg-slate-700 text-white text-sm w-28"
                  placeholder="Type DELETE"
                />
                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-900/50 hover:bg-red-800/50 text-red-300 px-4 py-2 rounded transition-colors text-sm"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
