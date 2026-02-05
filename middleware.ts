import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login route and static assets
  const isLoginRoute = pathname.startsWith("/login");
  const isStaticAsset =
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    /\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|css|js|txt|xml|mp4|webm)$/i.test(
      pathname
    );

  // If already authenticated and trying to access /login, send to home
  const isAuthenticated = request.cookies.get("auth")?.value === "1";
  if (isLoginRoute) {
    if (isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isStaticAsset) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(.*)"],
};


