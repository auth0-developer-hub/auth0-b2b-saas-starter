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

const MY_ORG_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "read:my_org:details",
  "update:my_org:details",
  "create:my_org:identity_providers",
  "read:my_org:identity_providers",
  "update:my_org:identity_providers",
  "delete:my_org:identity_providers",
  "update:my_org:identity_providers_detach",
]
export const appClient = new Auth0Client({
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  appBaseUrl: process.env.APP_BASE_URL,
  secret: process.env.SESSION_ENCRYPTION_SECRET,
  authorizationParameters: {
    audience: `https://metcodermyorg.test-iamda-myorgapipocweek1.auth0c.com/my-org/`,
    scope: MY_ORG_SCOPES.join(" "),
  },
  async beforeSessionSaved(session) {
    // For some reason is needed to delay the session persistance
    // and custom claim to have be stored within the session
    return { ...session }
  },
})
