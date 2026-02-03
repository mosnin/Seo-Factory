import { NextRequest, NextResponse } from "next/server";

const COGNITO_ISSUER = `https://cognito-idp.${process.env.NEXT_PUBLIC_COGNITO_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID}`;

const PUBLIC_PATHS = ["/", "/auth/signin", "/auth/signup", "/auth/reset-password"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/api/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Amplify stores tokens as cookies with a key that includes the user pool client ID.
  // The last-auth-user cookie tells us if a session exists on the client side.
  // We look for any cookie that contains "CognitoIdentityServiceProvider" and "idToken".
  const cookies = request.cookies.getAll();
  const idTokenCookie = cookies.find(
    (c) =>
      c.name.includes("CognitoIdentityServiceProvider") &&
      c.name.endsWith(".idToken")
  );

  if (!idTokenCookie?.value) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Validate the JWT structure (3 base64-encoded parts).
  // Full cryptographic verification happens server-side in API routes;
  // the middleware performs a lightweight structural check to gate access.
  const parts = idTokenCookie.value.split(".");
  if (parts.length !== 3) {
    const signInUrl = new URL("/auth/signin", request.url);
    return NextResponse.redirect(signInUrl);
  }

  try {
    const payload = JSON.parse(atob(parts[1]));

    // Check token expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check issuer matches our Cognito user pool
    if (payload.iss && payload.iss !== COGNITO_ISSUER) {
      const signInUrl = new URL("/auth/signin", request.url);
      return NextResponse.redirect(signInUrl);
    }
  } catch {
    const signInUrl = new URL("/auth/signin", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
