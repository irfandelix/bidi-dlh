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
  const isPublicRoute = request.nextUrl.pathname.startsWith('/pengawasan/link/') || 
                        request.nextUrl.pathname.startsWith('/pengaduan/hasil/') || 
                        request.nextUrl.pathname.startsWith('/pengaduan/token')

  // Jika belum login dan mencoba mengakses halaman selain login, api, atau public route
  if (!bidiSession && !isLoginPage && !isApiRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Jika sudah login dan mencoba mengakses halaman login
  if (bidiSession && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}
