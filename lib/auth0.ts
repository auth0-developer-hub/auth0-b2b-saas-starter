import { Auth0Client } from "@auth0/nextjs-auth0/server"
import { ManagementClient } from "auth0"

export const managementClient = new ManagementClient({
  domain: process.env.AUTH0_MANAGEMENT_API_DOMAIN,
  clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
  clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
})

export const onboardingClient = new Auth0Client({
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
  clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
  clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
  appBaseUrl: process.env.APP_BASE_URL,
  secret: process.env.SESSION_ENCRYPTION_SECRET,
  routes: {
    callback: "/onboarding/callback",
    login: "/onboarding/signup",
    logout: "/",
  },
  authorizationParameters: {
    screen_hint: "signup",
  },
})

export const appClient = new Auth0Client({
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  appBaseUrl: process.env.APP_BASE_URL,
  secret: process.env.SESSION_ENCRYPTION_SECRET,
})
