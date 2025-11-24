import { $ } from "execa"
import ora from "ora"

import { auth0ApiCall } from "./auth0-api.mjs"

// Constants
export const APP_BASE_URL = "http://localhost:3000"
export const MANAGEMENT_CLIENT_NAME = "SaaStart Management"
export const DASHBOARD_CLIENT_NAME = "SaaStart Dashboard"

/**
 * Compare arrays without regard to order
 */
function arraysEqual(arr1, arr2) {
  if (!arr1 || !arr2) return false
  if (arr1.length !== arr2.length) return false
  const sorted1 = [...arr1].sort()
  const sorted2 = [...arr2].sort()
  return sorted1.every((val, idx) => val === sorted2[idx])
}

/**
 * Check if all required items are present in an array (subset check)
 */
function arrayContainsAll(haystack, needles) {
  if (!haystack) return false
  if (!needles || needles.length === 0) return true
  return needles.every((needle) => haystack.includes(needle))
}

/**
 * Create or update Management Client
 */
export async function ensureManagementClient(existing, domain) {
  const existingClient = existing.clients.find(
    (c) => c.name === MANAGEMENT_CLIENT_NAME
  )

  const desiredCallbacks = [`${APP_BASE_URL}/onboarding/callback`]
  const desiredLogoutUrls = [APP_BASE_URL]

  if (existingClient) {
    // Check if updates are needed - only add missing URLs, don't require exact match
    const missingCallbacks = desiredCallbacks.filter(
      (cb) => !existingClient.callbacks?.includes(cb)
    )
    const missingLogoutUrls = desiredLogoutUrls.filter(
      (url) => !existingClient.allowed_logout_urls?.includes(url)
    )
    const wrongAppType = existingClient.app_type !== "regular_web"

    const needsUpdate =
      missingCallbacks.length > 0 ||
      missingLogoutUrls.length > 0 ||
      wrongAppType

    if (needsUpdate) {
      const spinner = ora({
        text: `Updating ${MANAGEMENT_CLIENT_NAME} client configuration`,
      }).start()

      try {
        const updateData = {}

        if (missingCallbacks.length > 0) {
          updateData.callbacks = [
            ...(existingClient.callbacks || []),
            ...missingCallbacks,
          ]
        }

        if (missingLogoutUrls.length > 0) {
          updateData.allowed_logout_urls = [
            ...(existingClient.allowed_logout_urls || []),
            ...missingLogoutUrls,
          ]
        }

        if (wrongAppType) {
          updateData.app_type = "regular_web"
        }

        await auth0ApiCall(
          "patch",
          `clients/${existingClient.client_id}`,
          updateData
        )
        spinner.succeed(`Updated ${MANAGEMENT_CLIENT_NAME} client`)

        // Fetch updated client to return
        const updated = await auth0ApiCall(
          "get",
          `clients/${existingClient.client_id}`
        )
        return updated || existingClient
      } catch (e) {
        spinner.fail(`Failed to update ${MANAGEMENT_CLIENT_NAME} client`)
        throw e
      }
    } else {
      const spinner = ora({
        text: `${MANAGEMENT_CLIENT_NAME} client is up to date`,
      }).start()
      spinner.succeed()
      return existingClient
    }
  }

  const spinner = ora({
    text: `Creating ${MANAGEMENT_CLIENT_NAME} client`,
  }).start()

  try {
    // prettier-ignore
    const createClientArgs = [
      "apps", "create",
      "--name", MANAGEMENT_CLIENT_NAME,
      "--description", "The SaaStart client to manage tenant resources and facilitate account creation.",
      "--callbacks", desiredCallbacks,
      "--logout-urls", desiredLogoutUrls,
      "--type", "regular",
      "--reveal-secrets", "--json", "--no-input"
    ];

    const { stdout } = await $`auth0 ${createClientArgs}`
    const client = JSON.parse(stdout)
    spinner.succeed(`Created ${MANAGEMENT_CLIENT_NAME} client`)
    return client
  } catch (e) {
    spinner.fail(`Failed to create the ${MANAGEMENT_CLIENT_NAME} client`)
    throw e
  }
}

/**
 * Create or update Management API Client Grant
 */
export async function ensureManagementClientGrant(clientId, existing, domain) {
  const desiredScopes = [
    // Users
    "read:users",
    "update:users",
    "delete:users",
    "create:users",
    // Connections
    "read:connections",
    "update:connections",
    "delete:connections",
    "create:connections",
    // Organizations
    "read:organizations_summary",
    "read:organizations",
    "update:organizations",
    "create:organizations",
    "delete:organizations",
    "create:organization_members",
    "read:organization_members",
    "delete:organization_members",
    "create:organization_connections",
    "read:organization_connections",
    "update:organization_connections",
    "delete:organization_connections",
    "create:organization_member_roles",
    "read:organization_member_roles",
    "delete:organization_member_roles",
    "create:organization_invitations",
    "read:organization_invitations",
    "delete:organization_invitations",
    // MFA Enrollment
    "read:guardian_factors",
    "read:authentication_methods",
    "delete:authentication_methods",
    "create:guardian_enrollment_tickets",
    // SCIM
    "create:scim_token",
    "read:scim_token",
    "delete:scim_token",
    "read:scim_config",
    "create:scim_config",
    "update:scim_config",
    "delete:scim_config",
  ]

  // Check if grant already exists
  const existingGrant = existing.clientGrants.find(
    (g) =>
      g.client_id === clientId && g.audience === `https://${domain}/api/v2/`
  )

  if (existingGrant) {
    // Check if we need to add any missing scopes
    const existingScopes = existingGrant.scope || []
    const missingScopes = desiredScopes.filter(
      (scope) => !existingScopes.includes(scope)
    )

    if (missingScopes.length > 0) {
      const spinner = ora({
        text: `Adding missing scopes to Management API Client Grant`,
      }).start()

      try {
        const updatedScopes = [...existingScopes, ...missingScopes]
        await auth0ApiCall("patch", `client-grants/${existingGrant.id}`, {
          scope: updatedScopes,
        })
        spinner.succeed(
          `Updated Management API Client Grant with ${missingScopes.length} new scope(s)`
        )
        return existingGrant
      } catch (e) {
        spinner.fail(`Failed to update Management API Client Grant`)
        throw e
      }
    } else {
      const spinner = ora({
        text: `Management API Client Grant is up to date`,
      }).start()
      spinner.succeed()
      return existingGrant
    }
  }

  const spinner = ora({
    text: `Creating Management API Client Grant`,
  }).start()

  try {
    // prettier-ignore
    const createClientGrantArgs = [
      "api", "post", "client-grants",
      "--data", JSON.stringify({
        client_id: clientId,
        audience: `https://${domain}/api/v2/`,
        scope: desiredScopes
      }),
    ];

    await $`auth0 ${createClientGrantArgs}`
    spinner.succeed(`Created Management API Client Grant`)
  } catch (e) {
    spinner.fail(`Failed to create Management API Client Grant`)
    throw e
  }
}

/**
 * Create or update Dashboard Client with My Org configuration
 */
export async function ensureDashboardClient(
  existing,
  domain,
  connectionProfileId,
  userAttributeProfileId
) {
  const existingClient = existing.clients.find(
    (c) => c.name === DASHBOARD_CLIENT_NAME
  )

  const desiredCallbacks = [`${APP_BASE_URL}/auth/callback`]
  const desiredLogoutUrls = [APP_BASE_URL]

  if (existingClient) {
    // Check if updates are needed - only add missing URLs, don't require exact match
    const missingCallbacks = desiredCallbacks.filter(
      (cb) => !existingClient.callbacks?.includes(cb)
    )
    const missingLogoutUrls = desiredLogoutUrls.filter(
      (url) => !existingClient.allowed_logout_urls?.includes(url)
    )
    const wrongAppType = existingClient.app_type !== "regular_web"
    const myOrgConfigNeedsUpdate =
      !existingClient.my_organization_configuration ||
      existingClient.my_organization_configuration.connection_profile_id !==
        connectionProfileId ||
      existingClient.my_organization_configuration.user_attribute_profile_id !==
        userAttributeProfileId
    const organizationSettingsNeedUpdate =
      existingClient.organization_require_behavior !== "post_login_prompt" ||
      existingClient.organization_usage !== "require"

    const needsUpdate =
      missingCallbacks.length > 0 ||
      missingLogoutUrls.length > 0 ||
      wrongAppType ||
      myOrgConfigNeedsUpdate ||
      organizationSettingsNeedUpdate

    if (needsUpdate) {
      const spinner = ora({
        text: `Updating ${DASHBOARD_CLIENT_NAME} client configuration`,
      }).start()

      try {
        const updateData = {}

        if (missingCallbacks.length > 0) {
          updateData.callbacks = [
            ...(existingClient.callbacks || []),
            ...missingCallbacks,
          ]
        }

        if (missingLogoutUrls.length > 0) {
          updateData.allowed_logout_urls = [
            ...(existingClient.allowed_logout_urls || []),
            ...missingLogoutUrls,
          ]
        }

        if (wrongAppType) {
          updateData.app_type = "regular_web"
        }

        if (organizationSettingsNeedUpdate) {
          updateData.organization_require_behavior = "post_login_prompt"
          updateData.organization_usage = "require"
        }

        if (myOrgConfigNeedsUpdate) {
          updateData.my_organization_configuration = {
            connection_profile_id: connectionProfileId,
            user_attribute_profile_id: userAttributeProfileId,
            connection_deletion_behavior: "allow_if_empty",
            allowed_strategies: [
              "pingfederate",
              "adfs",
              "waad",
              "google-apps",
              "okta",
              "oidc",
              "samlp",
            ],
          }
        }

        await auth0ApiCall(
          "patch",
          `clients/${existingClient.client_id}`,
          updateData
        )
        spinner.succeed(`Updated ${DASHBOARD_CLIENT_NAME} client`)

        // Fetch updated client to return
        const updated = await auth0ApiCall(
          "get",
          `clients/${existingClient.client_id}`
        )
        return updated || existingClient
      } catch (e) {
        spinner.fail(`Failed to update ${DASHBOARD_CLIENT_NAME} client`)
        throw e
      }
    } else {
      const spinner = ora({
        text: `${DASHBOARD_CLIENT_NAME} client is up to date`,
      }).start()
      spinner.succeed()
      return existingClient
    }
  }

  const spinner = ora({
    text: `Creating ${DASHBOARD_CLIENT_NAME} client`,
  }).start()

  try {
    // prettier-ignore
    const createClientArgs = [
      "api", "post", "clients",
      "--data", JSON.stringify({
        name: DASHBOARD_CLIENT_NAME,
        description: "The client to facilitate login to the dashboard in the context of an organization.",
        callbacks: desiredCallbacks,
        allowed_logout_urls: desiredLogoutUrls,
        initiate_login_uri: "https://example.com/auth/login",
        app_type: "regular_web",
        oidc_conformant: true,
        grant_types: ["authorization_code", "refresh_token"],
        organization_require_behavior: "post_login_prompt",
        organization_usage: "require",
        jwt_configuration: {
          alg: "RS256",
          lifetime_in_seconds: 36000,
          secret_encoded: false,
        },
        my_organization_configuration: {
          connection_profile_id: connectionProfileId,
          user_attribute_profile_id: userAttributeProfileId,
          connection_deletion_behavior: "allow_if_empty",
          allowed_strategies: [
            "pingfederate",
            "adfs",
            "waad",
            "google-apps",
            "okta",
            "oidc",
            "samlp",
          ],
        },
      }),
    ];

    const { stdout } = await $`auth0 ${createClientArgs}`
    const client = JSON.parse(stdout)
    spinner.succeed(`Created ${DASHBOARD_CLIENT_NAME} client`)
    return client
  } catch (e) {
    spinner.fail(`Failed to create the ${DASHBOARD_CLIENT_NAME} client`)
    throw e
  }
}

/**
 * Ensure My Org API Client Grant exists and has correct scopes
 */
export async function ensureMyOrgClientGrant(
  clientId,
  existing,
  domain,
  myOrgApiScopes
) {
  // Check if grant already exists
  const existingGrant = existing.clientGrants.find(
    (g) =>
      g.client_id === clientId &&
      g.audience === `https://${domain}/my-org/` &&
      g.subject_type === "user"
  )

  if (existingGrant) {
    // Check if we need to add any missing scopes
    const existingScopes = existingGrant.scope || []
    const missingScopes = myOrgApiScopes.filter(
      (scope) => !existingScopes.includes(scope)
    )

    if (missingScopes.length > 0) {
      const spinner = ora({
        text: `Adding missing scopes to My Org API Client Grant`,
      }).start()

      try {
        const updatedScopes = [...existingScopes, ...missingScopes]
        await auth0ApiCall("patch", `client-grants/${existingGrant.id}`, {
          scope: updatedScopes,
        })
        spinner.succeed(
          `Updated My Org API Client Grant with ${missingScopes.length} new scope(s)`
        )
        return existingGrant
      } catch (e) {
        spinner.fail(`Failed to update My Org API Client Grant`)
        throw e
      }
    } else {
      const spinner = ora({
        text: `My Org API Client Grant is up to date`,
      }).start()
      spinner.succeed()
      return existingGrant
    }
  }

  const spinner = ora({
    text: `Creating ${DASHBOARD_CLIENT_NAME} client grants for My Org API`,
  }).start()

  try {
    // prettier-ignore
    const createClientGrantArgs = [
      "api", "post", "client-grants",
      "--data", JSON.stringify({
        client_id: clientId,
        audience: `https://${domain}/my-org/`,
        scope: myOrgApiScopes,
        subject_type: "user"
      }),
    ];

    await $`auth0 ${createClientGrantArgs}`
    spinner.succeed(`Created My Org API Client Grant`)
  } catch (e) {
    spinner.fail(
      `Failed to create the ${DASHBOARD_CLIENT_NAME} client grants for My Organization API`
    )
    throw e
  }
}
