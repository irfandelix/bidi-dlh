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
                        request.nextUrl.pathname.startsWith('/pengaduan/token') ||
                        request.nextUrl.pathname.startsWith('/perizinan/arus') ||
                        request.nextUrl.pathname.startsWith('/checklist-perizinan') ||
                        request.nextUrl.pathname.startsWith('/privacy')

  // Jika belum login dan mencoba mengakses halaman selain login, api, atau public route
  if (!bidiSession && !isLoginPage && !isApiRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Jika sudah login dan mencoba mengakses halaman login
  if (bidiSession && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Perpanjang masa aktif sesi 6 jam hanya saat ada navigasi halaman (bukan polling API).
  if (bidiSession && !isApiRoute) {
    response.cookies.set('bidi_session', bidiSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 6,
      path: '/',
    })
  }

  return response
}
