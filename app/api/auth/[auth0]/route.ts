import { redirect } from "next/navigation"
import { NextRequest } from "next/server"
import { HandlerError } from "@auth0/nextjs-auth0"

import { appClient } from "@/lib/auth0"

export const GET = appClient.handleAuth({
  login: appClient.handleLogin((request) => {
    // NOTE: this is a typing issue. The request Object here is of type NextRequest (not NextApiRequest)
    // as this is a route handler.
    // See: https://nextjs.org/docs/app/building-your-application/routing/route-handlers#url-query-parameters
    // @ts-ignore
    const searchParams = request.nextUrl.searchParams
    const organization = searchParams.get("organization")
    const invitation = searchParams.get("invitation")

    return {
      authorizationParams: {
        // if the user is accepting an invite, we need to forward it to Auth0
        organization,
        invitation,
      },
      returnTo: "/dashboard",
    }
  }),
  signup: appClient.handleLogin({
    authorizationParams: {
      screen_hint: "signup",
    },
    returnTo: "/",
  }),
  onError(_req: NextRequest, error: HandlerError) {
    redirect(
      `/api/auth/error?error=${error.cause?.message || "An error occured while authenticating the user."}`
    )
  },
})
