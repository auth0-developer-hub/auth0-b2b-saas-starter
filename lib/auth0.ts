import { initAuth0 } from "@auth0/nextjs-auth0"
import { ManagementClient } from "auth0"

export const managementClient = new ManagementClient({
  domain: process.env.AUTH0_MANAGEMENT_API_DOMAIN,
  clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
  clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
})

export const onboardingClient = initAuth0({
  clientID: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
  clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
  baseURL: process.env.APP_BASE_URL,
  issuerBaseURL: `https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}`,
  secret: process.env.SESSION_ENCRYPTION_SECRET,
  routes: {
    callback: "/onboarding/callback",
    postLogoutRedirect: "/",
  },
})

export const appClient = initAuth0({
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  baseURL: process.env.APP_BASE_URL,
  issuerBaseURL: `https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}`,
  secret: process.env.SESSION_ENCRYPTION_SECRET,
  idpLogout: true,
})
