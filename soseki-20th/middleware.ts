import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'gate'
const SKIP_PREFIXES = ['/gate', '/_next', '/favicon.ico', '/ogp.png', '/yosegaki', '/music', '/games']

async function expectedToken(): Promise<string> {
  const secret = process.env.SECRET_WORD ?? ''
  const data = new TextEncoder().encode(secret)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function middleware(req: NextRequest) {
  if (!process.env.SECRET_WORD) return NextResponse.next()

  const { pathname } = req.nextUrl
  if (SKIP_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (token && token === (await expectedToken())) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = '/gate'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
