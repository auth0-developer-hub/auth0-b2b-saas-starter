import type { NextRequest } from "next/server"

import { appClient, onboardingClient } from "./lib/auth0" // Adjust path if your auth0 client is elsewhere

export async function middleware(request: NextRequest) {
  console.log('hello>?', request.url)
  if (request.url.includes("/onboarding")) {
    console.log('using onboarding client?')
    return await onboardingClient.middleware(request)
  } else {
    return await appClient.middleware(request)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icon.png).*)",
  ],
}
