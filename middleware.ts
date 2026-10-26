import { NextResponse, type NextRequest } from 'next/server';
import { INTRO_COOKIE } from '@/lib/session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/intro') return NextResponse.next();

  if (!request.cookies.has(INTRO_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = '/intro';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico|icon.svg|manifest.json|.*\\..*).*)'],
};
