import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

let cachedAuthSettings: any = null;
let lastFetchTime = 0;

async function getAuthSettings() {
  const now = Date.now();
  if (cachedAuthSettings && now - lastFetchTime < 60000) {
    return cachedAuthSettings;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth-settings`, {
      next: { revalidate: 60 },
    });
    cachedAuthSettings = await response.json();
    lastFetchTime = now;
    return cachedAuthSettings;
  } catch (error) {
    console.error('Error fetching auth settings:', error);
    return { isEnabled: false };
  }
}

export async function middleware(request: NextRequest) {
  const authSettings = await getAuthSettings();

  if (!authSettings.isEnabled) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const authValue = authHeader.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    if (user === authSettings.username && pwd === authSettings.password) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};