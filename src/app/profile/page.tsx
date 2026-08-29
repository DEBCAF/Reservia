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

  if (loading) return <div className="min-h-screen bg-[#1b120d] text-[#f9f0e8] p-8">Loading...</div>

  const displayName = user?.user_metadata?.full_name || user?.email || 'Unknown'

  return (
    <main className="min-h-screen bg-[#1b120d] text-[#f9f0e8]">
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-[#d9b997] hover:text-[#fffaf5] transition-colors mb-2 cursor-pointer font-bold"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-[#fffaf5]">Profile</h1>
        </div>

        <div className="bg-[#231612] rounded-xl border border-[#d99a4a]/25 p-6 mb-6 shadow-[0_16px_30px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f0c98d] to-[#b7682d] flex items-center justify-center text-lg font-bold text-[#1b120d]">
              {displayName
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#fffaf5]">{displayName}</h2>
              <p className="text-[#d9b997] text-sm">{user.email}</p>
            </div>
          </div>
          <div className="bg-[#4a3124] rounded-lg p-4 space-y-2">
            <p className="text-[#f3d8b5] text-sm">
              <span className="font-bold">Account ID:</span> {user.id}
            </p>
            <p className="text-[#f3d8b5] text-sm">
              <span className="font-bold">Joined:</span>{' '}
              {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg text-sm font-bold ${
              messageType === 'success'
                ? 'bg-[#1f3d2b] text-[#d4f2db] border border-[#4b8b66]'
                : 'bg-[#3a1e1e] text-[#f7d5d5] border border-[#a96161]'
            }`}
          >
            {message}
          </div>
        )}

        <div className="bg-[#231612] rounded-xl border border-[#d99a4a]/25 p-6 mb-6 shadow-[0_16px_30px_rgba(0,0,0,0.2)]">
          <h3 className="text-lg font-bold mb-4 text-[#fffaf5]">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1 text-[#f0c98d]">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-[#d99a4a]/50 p-2 rounded bg-[#2a1d16] text-[#fffaf5] placeholder-[#d9b997]"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[#f0c98d]">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-[#d99a4a]/50 p-2 rounded bg-[#2a1d16] text-[#fffaf5] placeholder-[#d9b997]"
                placeholder="Confirm new password"
              />
            </div>
            <button
              type="submit"
              className="bg-[#4a3124] hover:bg-[#5d3b2d] text-[#fffaf5] px-6 py-2 rounded font-medium transition-colors cursor-pointer"
            >
              Update Password
            </button>
          </form>
        </div>

        <div className="bg-[#231612] rounded-xl border border-[#d99a4a]/25 p-6 mb-6 shadow-[0_16px_30px_rgba(0,0,0,0.2)]">
          <h3 className="text-lg font-bold mb-4 text-[#fffaf5]">Danger Zone</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#f3d8b5]">Log Out</p>
                <p className="text-[#d9b997] text-sm">Sign out of your account on this device</p>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-[#4a3124] hover:bg-[#5d3b2d] text-[#fffaf5] px-6 py-2 rounded font-medium transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
            <hr className="border-[#d99a4a]/20" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[#f3d8b5] font-medium">Delete Account</p>
                <p className="text-[#d9b997] text-sm">
                  Permanently delete your account and all your bookings. This action cannot be undone.
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="border border-[#d99a4a]/40 p-2 rounded bg-[#2a1d16] text-[#fffaf5] text-sm w-28"
                  placeholder="Type DELETE"
                />
                <button
                  onClick={handleDeleteAccount}
                  className="bg-[#4a3124] hover:bg-[#5d3b2d] text-[#fffaf5] px-6 py-2 rounded font-medium transition-colors cursor-pointer"
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
