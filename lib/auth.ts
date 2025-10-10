import { NextRequest, NextResponse } from 'next/server'
import { cookies as nextCookies } from 'next/headers'
import { createHash, timingSafeEqual } from 'crypto'

export const ADMIN_SESSION_COOKIE = 'ssm_admin_session'

function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    return null
  }

  return { email, password }
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? 'ssm-admin-secret'
}

export function computeAdminSessionToken(): string | null {
  const creds = getAdminCredentials()
  if (!creds) {
    return null
  }

  const secret = getSessionSecret()
  return createHash('sha256').update(`${creds.email}:${creds.password}:${secret}`).digest('hex')
}

export function validateAdminCredentials(email: string, password: string): boolean {
  const creds = getAdminCredentials()
  if (!creds) {
    return false
  }

  try {
    const providedEmail = Buffer.from(email.trim().toLowerCase())
    const storedEmail = Buffer.from(creds.email.trim().toLowerCase())
    const providedPassword = Buffer.from(password)
    const storedPassword = Buffer.from(creds.password)

    return (
      providedEmail.length === storedEmail.length &&
      providedPassword.length === storedPassword.length &&
      timingSafeEqual(providedEmail, storedEmail) &&
      timingSafeEqual(providedPassword, storedPassword)
    )
  } catch {
    return false
  }
}

export function isAdminSessionValid(token?: string | null): boolean {
  const expected = computeAdminSessionToken()
  if (!expected || !token) {
    return false
  }

  try {
    const received = Buffer.from(token)
    const expectedBuffer = Buffer.from(expected)
    return received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer)
  } catch {
    return false
  }
}

export function ensureAdminRequest(request: NextRequest): NextResponse | null {
  if (!isAdminSessionValid(request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export function setAdminSessionCookie(response: NextResponse) {
  const token = computeAdminSessionToken()
  if (!token) {
    throw new Error('Admin credentials are not configured')
  }

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  })
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export async function isAdminSessionActive() {
  const cookieStore = await nextCookies()
  return isAdminSessionValid(cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null)
}
