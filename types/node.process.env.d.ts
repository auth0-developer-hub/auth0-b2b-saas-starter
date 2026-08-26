/// <reference types="node" />

declare namespace NodeJS {
  export interface ProcessEnv {
    APP_BASE_URL: string

    // Global Auth0 SDK configuration
    NEXT_PUBLIC_AUTH0_DOMAIN: string // The domain used to make authentication requests (can be a custom domain)
    AUTH0_MANAGEMENT_API_DOMAIN: string // The domain used to make management API requests
    SESSION_ENCRYPTION_SECRET: string

    // Client ID and secret for the application within the context of an organization
    AUTH0_CLIENT_ID: string
    AUTH0_CLIENT_SECRET: string

    // Client ID and secret for the application used to allow a user to manage organizations
    AUTH0_MANAGEMENT_CLIENT_ID: string
    AUTH0_MANAGEMENT_CLIENT_SECRET: string

    // Roles assigned to the members of an organization
    AUTH0_ADMIN_ROLE_ID: string
    AUTH0_MEMBER_ROLE_ID: string

    // The default connection ID users will use to create an account with during onboarding
    DEFAULT_CONNECTION_ID: string

    // The namespace used to prefix custom claims
    CUSTOM_CLAIMS_NAMESPACE: string

    // Overrides detection of the Auth0 "Agents as Principal" capability. Optional: when unset the
    // tenant is probed. "true"/"false" force the AI Agents section on or off without touching the
    // tenant.
    AUTH0_AGENTS_ENABLED?: "auto" | "true" | "false"
  }
}
