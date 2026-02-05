import { NextResponse } from "next/server";

export function GET(request: Request) {
  const url = new URL("/login", request.url);
  const res = NextResponse.redirect(url);
  res.cookies.set({ name: "auth", value: "", maxAge: 0, path: "/" });
  return res;
}


