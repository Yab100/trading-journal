import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value
              )
            }
          )

          response = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              )
            }
          )
        },
      },
    }
  )

  const { pathname } =
    request.nextUrl

  // Don't interfere with static files,
  // API routes, or files.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return response
  }

  const {
    data: { user },
  } =
    await supabase.auth.getUser()

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/auth')

  // Require login everywhere except
  // authentication routes.
  if (!user && !isAuthPage) {
    const url =
      request.nextUrl.clone()

    url.pathname = '/login'

    return NextResponse.redirect(url)
  }

  // Don't let an authenticated user
  // return to login/signup.
  if (
    user &&
    (pathname === '/login' ||
      pathname === '/signup')
  ) {
    const url =
      request.nextUrl.clone()

    url.pathname = '/'

    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}