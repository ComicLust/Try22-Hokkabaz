import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

async function sha256(input: string): Promise<string> {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function attachNonce(res: NextResponse) {
  try {
    // keep original headers untouched; add CSP nonce if needed
    res.headers.set('x-powered-by', 'nextjs')
  } catch {}
  return res
}

function requireAuthForPage(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  // Bypass admin auth in development or when explicitly disabled
  const bypassAdmin = process.env.ADMIN_AUTH_DISABLED === 'true' || process.env.NODE_ENV !== 'production'
  if (bypassAdmin) {
    return NextResponse.next()
  }
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
  // Bypass admin auth in development or when explicitly disabled
  const bypassAdmin = process.env.ADMIN_AUTH_DISABLED === 'true' || process.env.NODE_ENV !== 'production'
  if (bypassAdmin) {
    return NextResponse.next()
  }
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

  // Allow admin login page (redirect to dashboard if already authenticated)
  if (pathname === '/admin/login') {
    const adminToken = req.cookies.get('admin_token')?.value
    if (adminToken) {
      const dash = new URL('/admin', req.url)
      return attachNonce(NextResponse.redirect(dash))
    }
    return attachNonce(NextResponse.next())
  }

  // Allow brand login page (redirect to dashboard if already authenticated)
  if (pathname === '/brand/login') {
    const brandToken = req.cookies.get('brand_token')?.value
    if (brandToken) {
      const dash = new URL('/brand', req.url)
      return attachNonce(NextResponse.redirect(dash))
    }
    return attachNonce(NextResponse.next())
  }

  // Allow login/logout API routes explicitly
  if (pathname.startsWith('/api/admin/login') || pathname.startsWith('/api/admin/logout') || pathname.startsWith('/api/brand/login') || pathname.startsWith('/api/brand/logout')) {
    return attachNonce(NextResponse.next())
  }

  // Protect Admin UI
  if (pathname.startsWith('/admin')) {
    const res = await requireAuthForPage(req)
    return attachNonce(res)
  }

  // Protect Brand UI
  if (pathname.startsWith('/brand')) {
    const token = req.cookies.get('brand_token')?.value
    if (!token) {
      const loginUrl = new URL('/brand/login', req.url)
      loginUrl.searchParams.set('next', pathname)
      return attachNonce(NextResponse.redirect(loginUrl))
    }
    return attachNonce(NextResponse.next())
  }

  // Protect Admin APIs (all methods)
  if (pathname.startsWith('/api/admin')) {
    const res = await requireAuthForApi(req)
    return attachNonce(res)
  }

  // Protect Brand APIs (all methods)
  if (pathname.startsWith('/api/brand')) {
    const token = req.cookies.get('brand_token')?.value
    if (!token) {
      return attachNonce(new NextResponse('Unauthorized', { status: 401 }))
    }
    return attachNonce(NextResponse.next())
  }

  return attachNonce(NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|robots.txt|public).*)'],
}