import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  // Cek cookie custom login
  const bidiSession = request.cookies.get('bidi_session')?.value

  const isLoginPage = request.nextUrl.pathname.startsWith('/login')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isRootPath = request.nextUrl.pathname === '/'

  if (isRootPath) {
    return NextResponse.redirect(new URL('/perizinan', request.url))
  }

  // Jika belum login dan mencoba mengakses halaman selain login atau api
  if (!bidiSession && !isLoginPage && !isApiRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Jika sudah login dan mencoba mengakses halaman login
  if (bidiSession && isLoginPage) {
    return NextResponse.redirect(new URL('/perizinan', request.url))
  }

  return response
}
