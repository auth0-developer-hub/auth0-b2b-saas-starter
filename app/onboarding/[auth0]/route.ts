import { onboardingClient } from "@/lib/auth0"

export const GET = onboardingClient.handleAuth({
  signup: onboardingClient.handleLogin((request) => {
    // NOTE: this is a typing issue. The request Object here is of type NextRequest (not NextApiRequest)
    // as this is a route handler.
    // See: https://nextjs.org/docs/app/building-your-application/routing/route-handlers#url-query-parameters
    // @ts-ignore
    const searchParams = request.nextUrl.searchParams
    const loginHint = searchParams.get("login_hint")

    return {
      authorizationParams: {
        screen_hint: "signup",
        login_hint: loginHint,
      },
      returnTo: "/onboarding/verify",
    }
  }),
})
