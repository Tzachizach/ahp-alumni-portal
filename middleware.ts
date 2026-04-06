import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Not logged in — NextAuth handles redirect to /login
  if (!token) return NextResponse.next();

  // If user must change password, redirect to change-password page
  if (token.mustChangePassword && !req.nextUrl.pathname.startsWith('/profile/change-password') && !req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/profile/change-password', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)'],
};
