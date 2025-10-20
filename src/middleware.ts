import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

function requireAuthForPage(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const token = req.cookies.get('admin_token')?.value
  if (!token) {
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('next', pathname + search)
    return NextResponse.redirect(loginUrl)
  }
  const envUser = process.env.ADMIN_USERNAME || 'admin'
  const envPass = process.env.ADMIN_PASSWORD || 'admin123'
  const secret = process.env.ADMIN_SESSION_SECRET || 'dev-secret'
  return sha256(`${envUser}:${envPass}:${secret}`).then((expected) => {
    if (token !== expected) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('next', pathname + search)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  })
}

async function requireAuthForApi(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  const envUser = process.env.ADMIN_USERNAME || 'admin'
  const envPass = process.env.ADMIN_PASSWORD || 'admin123'
  const secret = process.env.ADMIN_SESSION_SECRET || 'dev-secret'
  const expected = await sha256(`${envUser}:${envPass}:${secret}`)
  if (token !== expected) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  return NextResponse.next()
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const method = req.method

  const attachNonce = (res: NextResponse) => {
    try {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      const b64 = Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      res.headers.set('x-nonce', b64)
    } catch {}
    return res
  }

  // Allow admin login page
  if (pathname === '/admin/login') {
    return attachNonce(NextResponse.next())
  }

  // Allow login/logout API routes explicitly
  if (pathname.startsWith('/api/admin/login') || pathname.startsWith('/api/admin/logout')) {
    return attachNonce(NextResponse.next())
  }

  // Protect Admin UI
  if (pathname.startsWith('/admin')) {
    const res = await requireAuthForPage(req)
    return attachNonce(res)
  }

  // Protect Admin APIs (all methods)
  if (pathname.startsWith('/api/admin')) {
    const res = await requireAuthForApi(req)
    return attachNonce(res)
  }

  // Allow public helpful/not_helpful voting on site reviews (rate-limited in route)
  if (pathname.startsWith('/api/site-reviews/') && method === 'PATCH') {
    return attachNonce(NextResponse.next())
  }

  // Allow public comment creation
  if (pathname.startsWith('/api/site-reviews') && method === 'POST') {
    return attachNonce(NextResponse.next())
  }

  // Protect write requests on non-admin APIs
  if (pathname.startsWith('/api')) {
    if (method === 'GET' || method === 'OPTIONS') {
      return attachNonce(NextResponse.next())
    }
    const res = await requireAuthForApi(req)
    return attachNonce(res)
  }

  return attachNonce(NextResponse.next())
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}