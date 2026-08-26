import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { username } = await request.json()
    const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : ''
    const allowedUsernames = (process.env.ALLOWED_USERNAMES || '')
      .split(',')
      .map((allowedUsername) => allowedUsername.trim().toLowerCase())
      .filter(Boolean)

    if (!normalizedUsername || !allowedUsernames.includes(normalizedUsername)) {
      return NextResponse.json({ authorized: false }, { status: 403 })
    }

    return NextResponse.json({ authorized: true })
  } catch {
    return NextResponse.json({ authorized: false }, { status: 400 })
  }
}