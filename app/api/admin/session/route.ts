import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, isAdminSessionValid } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null
  return NextResponse.json({ authenticated: isAdminSessionValid(token) })
}
