import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Immediately bypass static assets, API handlers, auth pages, and public media
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/cad-models') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('favicon.ico')
  ) {
    return NextResponse.next();
  }

  // 2. Fetch session token from NextAuth JWT or fallback campus switcher cookie
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'campus_share_super_secret_jwt_key_2026_uvce',
  });

  const demoUserId = req.cookies.get('campus_user_id')?.value;
  const isAuthenticated = Boolean(token || demoUserId);

  // 3. Define protected route categories
  const isProtectedPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/upload');
  const isAdminPage = pathname.startsWith('/admin');

  // 4. Protect authenticated routes: redirect to signin if not logged in
  if (isProtectedPage && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url));
  }

  // 5. Protect Admin / Lab Coordinator routes (Requires LAB_ADMIN role)
  if (isAdminPage) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=/admin', req.url));
    }

    const userRole = (token as any)?.role;
    const isLabAdmin = userRole === 'LAB_ADMIN' || demoUserId === 'usr_labadmin';

    if (!isLabAdmin) {
      return NextResponse.redirect(new URL('/dashboard?error=admin_access_required', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all application routes except:
     * - api (API routes and auth endpoints)
     * - _next/static & _next/image (Next.js assets)
     * - favicon.ico (icon)
     * - auth (signin, signup)
     * - cad-models & uploads (media / mesh files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth|cad-models|uploads).*)',
  ],
};
