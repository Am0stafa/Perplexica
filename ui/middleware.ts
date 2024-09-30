import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const authEnabled = request.cookies.get('authEnabled')?.value === 'true';
  
  if (authEnabled) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic' },
      });
    }

    const authValue = authHeader.split(' ')[1];
    const [username, password] = atob(authValue).split(':');

    const storedUsername = request.cookies.get('authUsername')?.value;
    const storedPassword = request.cookies.get('authPassword')?.value;

    if (username !== storedUsername || password !== storedPassword) {
      return new NextResponse('Authentication failed', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic' },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};