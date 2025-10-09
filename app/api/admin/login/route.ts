import { NextRequest, NextResponse } from 'next/server'
import { clearAdminSessionCookie, setAdminSessionCookie, validateAdminCredentials } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null) as { email?: string; password?: string } | null

    const email = body?.email ?? ''
    const password = body?.password ?? ''

    if (!email.trim() || !password) {
      return NextResponse.json({ error: 'Podaj adres e-mail oraz hasło.' }, { status: 400 })
    }

    if (!validateAdminCredentials(email, password)) {
      const response = NextResponse.json({ error: 'Nieprawidłowe dane logowania.' }, { status: 401 })
      clearAdminSessionCookie(response)
      return response
    }

    const response = NextResponse.json({ success: true })
    setAdminSessionCookie(response)
    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Błąd logowania.' }, { status: 500 })
  }
}
