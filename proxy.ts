import type { NextRequest } from "next/server"

import { appClient, onboardingClient } from "./lib/auth0"

export async function proxy(request: NextRequest) {
  if (request.url.includes("/onboarding")) {
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
