import { NextResponse, type NextRequest } from 'next/server'

// First line of defence: no session cookie, no app. Pages and actions still verify the session itself.
export function middleware(req: NextRequest) {
  if (req.cookies.has('dd_hq_session')) return NextResponse.next()
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!login|_next/|favicon|icon|apple-icon).*)'],
}
