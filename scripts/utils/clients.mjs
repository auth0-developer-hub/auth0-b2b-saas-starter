import { $ } from "execa"
import ora from "ora"

import { auth0ApiCall } from "./auth0-api.mjs"
import { ChangeAction, createChangeItem } from "./change-plan.mjs"

// Constants
export const APP_BASE_URL = "http://localhost:3000"
export const MANAGEMENT_CLIENT_NAME = "SaaStart Management"
export const DASHBOARD_CLIENT_NAME = "SaaStart Dashboard"

const MANAGEMENT_API_SCOPES = [
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

// ============================================================================
// CHECK FUNCTIONS - Determine what changes are needed
// ============================================================================

/**
 * Check if Management Client needs changes
 * Fetches full client details including client_secret
 */
export async function checkManagementClientChanges(existingClients) {
  const existingClient = existingClients.find(
    (c) => c.name === MANAGEMENT_CLIENT_NAME
  )

  const desiredCallbacks = [`${APP_BASE_URL}/onboarding/callback`]
  const desiredLogoutUrls = [APP_BASE_URL]

  if (!existingClient) {
    return createChangeItem(ChangeAction.CREATE, {
      resource: "Management Client",
      name: MANAGEMENT_CLIENT_NAME,
    })
  }

  // Fetch full client details including client_secret
  const { stdout } =
    await $`auth0 api get clients/${existingClient.client_id}?fields=client_id,name,client_secret,app_type,callbacks,allowed_logout_urls`
  const fullClient = JSON.parse(stdout)

  // Check if updates are needed - only add missing URLs
  const missingCallbacks = desiredCallbacks.filter(
    (cb) => !fullClient.callbacks?.includes(cb)
  )
  const missingLogoutUrls = desiredLogoutUrls.filter(
    (url) => !fullClient.allowed_logout_urls?.includes(url)
  )
  const wrongAppType = fullClient.app_type !== "regular_web"

  const needsUpdate =
    missingCallbacks.length > 0 || missingLogoutUrls.length > 0 || wrongAppType

  if (needsUpdate) {
    const changes = []
    if (missingCallbacks.length > 0)
      changes.push(`Add ${missingCallbacks.length} callback(s)`)
    if (missingLogoutUrls.length > 0)
      changes.push(`Add ${missingLogoutUrls.length} logout URL(s)`)
    if (wrongAppType) changes.push("Set app_type to regular_web")

    return createChangeItem(ChangeAction.UPDATE, {
      resource: "Management Client",
      name: MANAGEMENT_CLIENT_NAME,
      existing: fullClient,
      updates: {
        missingCallbacks,
        missingLogoutUrls,
        wrongAppType,
      },
      summary: changes.join(", "),
    })
  }

  return createChangeItem(ChangeAction.SKIP, {
    resource: "Management Client",
    name: MANAGEMENT_CLIENT_NAME,
    existing: fullClient,
  })
}

/**
 * Check if Management API Client Grant needs changes
 */
export function checkManagementClientGrantChanges(
  clientId,
  existingGrants,
  domain
) {
  const existingGrant = existingGrants.find(
    (g) =>
      g.client_id === clientId && g.audience === `https://${domain}/api/v2/`
  )

  if (!existingGrant) {
    return createChangeItem(ChangeAction.CREATE, {
      resource: "Management API Client Grant",
      clientId,
      scopes: MANAGEMENT_API_SCOPES,
    })
  }

  // Check if we need to add any missing scopes
  const existingScopes = existingGrant.scope || []
  const missingScopes = MANAGEMENT_API_SCOPES.filter(
    (scope) => !existingScopes.includes(scope)
  )

  if (missingScopes.length > 0) {
    return createChangeItem(ChangeAction.UPDATE, {
      resource: "Management API Client Grant",
      existing: existingGrant,
      updates: {
        missingScopes,
      },
      summary: `Add ${missingScopes.length} scope(s)`,
    })
  }

  return createChangeItem(ChangeAction.SKIP, {
    resource: "Management API Client Grant",
    existing: existingGrant,
  })
}

/**
 * Check if Dashboard Client needs changes
 */
export async function checkDashboardClientChanges(
  existingClients,
  connectionProfileId,
  userAttributeProfileId
) {
  const existingClient = existingClients.find(
    (c) => c.name === DASHBOARD_CLIENT_NAME
  )

  const desiredCallbacks = [`${APP_BASE_URL}/auth/callback`]
  const desiredLogoutUrls = [APP_BASE_URL]

  if (!existingClient) {
    return createChangeItem(ChangeAction.CREATE, {
      resource: "Dashboard Client",
      name: DASHBOARD_CLIENT_NAME,
      connectionProfileId,
      userAttributeProfileId,
    })
  }

  // Fetch full client details to get my_organization_configuration
  // (not included in the list response)
  const fullClient = await auth0ApiCall(
    "get",
    `clients/${existingClient.client_id}`
  )
  const clientToCheck = fullClient || existingClient

  // Check if updates are needed
  const missingCallbacks = desiredCallbacks.filter(
    (cb) => !clientToCheck.callbacks?.includes(cb)
  )
  const missingLogoutUrls = desiredLogoutUrls.filter(
    (url) => !clientToCheck.allowed_logout_urls?.includes(url)
  )
  const wrongAppType = clientToCheck.app_type !== "regular_web"

  // Check if my_org config needs update
  // If profiles are TO_BE_CREATED, we'll need to update after creating them
  // Otherwise, check if current config matches desired IDs
  const myOrgConfigNeedsUpdate =
    connectionProfileId === "TO_BE_CREATED" ||
    userAttributeProfileId === "TO_BE_CREATED" ||
    !clientToCheck.my_organization_configuration ||
    clientToCheck.my_organization_configuration.connection_profile_id !==
      connectionProfileId ||
    clientToCheck.my_organization_configuration.user_attribute_profile_id !==
      userAttributeProfileId

  const organizationSettingsNeedUpdate =
    clientToCheck.organization_require_behavior !== "post_login_prompt" ||
    clientToCheck.organization_usage !== "require"

  const needsUpdate =
    missingCallbacks.length > 0 ||
    missingLogoutUrls.length > 0 ||
    wrongAppType ||
    myOrgConfigNeedsUpdate ||
    organizationSettingsNeedUpdate

  if (needsUpdate) {
    const changes = []
    if (missingCallbacks.length > 0)
      changes.push(`Add ${missingCallbacks.length} callback(s)`)
    if (missingLogoutUrls.length > 0)
      changes.push(`Add ${missingLogoutUrls.length} logout URL(s)`)
    if (wrongAppType) changes.push("Set app_type to regular_web")
    if (myOrgConfigNeedsUpdate) changes.push("Update My Org configuration")
    if (organizationSettingsNeedUpdate)
      changes.push("Update organization settings")

    return createChangeItem(ChangeAction.UPDATE, {
      resource: "Dashboard Client",
      name: DASHBOARD_CLIENT_NAME,
      existing: clientToCheck,
      updates: {
        missingCallbacks,
        missingLogoutUrls,
        wrongAppType,
        myOrgConfigNeedsUpdate,
        organizationSettingsNeedUpdate,
        connectionProfileId,
        userAttributeProfileId,
      },
      summary: changes.join(", "),
    })
  }

  return createChangeItem(ChangeAction.SKIP, {
    resource: "Dashboard Client",
    name: DASHBOARD_CLIENT_NAME,
    existing: clientToCheck,
  })
}

/**
 * Check if My Org API Client Grant needs changes
 */
export function checkMyOrgClientGrantChanges(
  clientId,
  existingGrants,
  domain,
  myOrgApiScopes
) {
  const existingGrant = existingGrants.find(
    (g) =>
      g.client_id === clientId && g.audience === `https://${domain}/my-org/`
  )

  if (!existingGrant) {
    return createChangeItem(ChangeAction.CREATE, {
      resource: "My Org API Client Grant",
      clientId,
      scopes: myOrgApiScopes,
    })
  }

  // Check if we need to add any missing scopes
  const existingScopes = existingGrant.scope || []
  const missingScopes = myOrgApiScopes.filter(
    (scope) => !existingScopes.includes(scope)
  )

  if (missingScopes.length > 0) {
    return createChangeItem(ChangeAction.UPDATE, {
      resource: "My Org API Client Grant",
      existing: existingGrant,
      updates: {
        missingScopes,
      },
      summary: `Add ${missingScopes.length} scope(s)`,
    })
  }

  return createChangeItem(ChangeAction.SKIP, {
    resource: "My Org API Client Grant",
    existing: existingGrant,
  })
}

// ============================================================================
// APPLY FUNCTIONS - Execute changes based on cached plan
// ============================================================================

/**
 * Apply Management Client changes
 */
export async function applyManagementClientChanges(changePlan) {
  if (changePlan.action === ChangeAction.SKIP) {
    const spinner = ora({
      text: `${MANAGEMENT_CLIENT_NAME} client is up to date`,
    }).start()
    spinner.succeed()
    return changePlan.existing
  }

  if (changePlan.action === ChangeAction.CREATE) {
    const spinner = ora({
      text: `Creating ${MANAGEMENT_CLIENT_NAME} client`,
    }).start()

    try {
      const desiredCallbacks = [`${APP_BASE_URL}/onboarding/callback`]
      const desiredLogoutUrls = [APP_BASE_URL]

      // prettier-ignore
      const createClientArgs = [
        "apps", "create",
        "--name", MANAGEMENT_CLIENT_NAME,
        "--description", "The SaaStart client to manage tenant resources and facilitate account creation.",
        "--callbacks", desiredCallbacks[0],
        "--logout-urls", desiredLogoutUrls[0],
        "--type", "regular",
        "--reveal-secrets", "--json", "--no-input"
      ];

      const { stdout } = await $`auth0 ${createClientArgs}`
      const client = JSON.parse(stdout)

      // Fetch full client details including client_secret to ensure we have it
      const { stdout: fullClientStdout } =
        await $`auth0 api get clients/${client.client_id}?fields=client_id,name,client_secret,app_type,callbacks,allowed_logout_urls`
      const fullClient = JSON.parse(fullClientStdout)

      spinner.succeed(`Created ${MANAGEMENT_CLIENT_NAME} client`)
      return fullClient
    } catch (e) {
      spinner.fail(`Failed to create the ${MANAGEMENT_CLIENT_NAME} client`)
      throw e
    }
  }

  if (changePlan.action === ChangeAction.UPDATE) {
    const spinner = ora({
      text: `Updating ${MANAGEMENT_CLIENT_NAME} client configuration`,
    }).start()

    try {
      const { existing, updates } = changePlan
      const updateData = {}

      if (updates.missingCallbacks.length > 0) {
        updateData.callbacks = [
          ...(existing.callbacks || []),
          ...updates.missingCallbacks,
        ]
      }

      if (updates.missingLogoutUrls.length > 0) {
        updateData.allowed_logout_urls = [
          ...(existing.allowed_logout_urls || []),
          ...updates.missingLogoutUrls,
        ]
      }

      if (updates.wrongAppType) {
        updateData.app_type = "regular_web"
      }

      await auth0ApiCall("patch", `clients/${existing.client_id}`, updateData)
      spinner.succeed(`Updated ${MANAGEMENT_CLIENT_NAME} client`)

      // Fetch updated client with client_secret to return
      const { stdout } =
        await $`auth0 api get clients/${existing.client_id}?fields=client_id,name,client_secret,app_type,callbacks,allowed_logout_urls`
      const updated = JSON.parse(stdout)
      return updated
    } catch (e) {
      spinner.fail(`Failed to update ${MANAGEMENT_CLIENT_NAME} client`)
      throw e
    }
  }
}

/**
 * Apply Management API Client Grant changes
 */
export async function applyManagementClientGrantChanges(
  changePlan,
  domain,
  clientId
) {
  if (changePlan.action === ChangeAction.SKIP) {
    const spinner = ora({
      text: `Management API Client Grant is up to date`,
    }).start()
    spinner.succeed()
    return changePlan.existing
  }

  if (changePlan.action === ChangeAction.CREATE) {
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
          scope: MANAGEMENT_API_SCOPES
        }),
      ];

      await $`auth0 ${createClientGrantArgs}`
      spinner.succeed(`Created Management API Client Grant`)
    } catch (e) {
      spinner.fail(`Failed to create Management API Client Grant`)
      throw e
    }
  }

  if (changePlan.action === ChangeAction.UPDATE) {
    const spinner = ora({
      text: `Adding missing scopes to Management API Client Grant`,
    }).start()

    try {
      const { existing, updates } = changePlan
      const existingScopes = existing.scope || []
      const updatedScopes = [...existingScopes, ...updates.missingScopes]

      await auth0ApiCall("patch", `client-grants/${existing.id}`, {
        scope: updatedScopes,
      })
      spinner.succeed(
        `Updated Management API Client Grant with ${updates.missingScopes.length} new scope(s)`
      )
      return existing
    } catch (e) {
      spinner.fail(`Failed to update Management API Client Grant`)
      throw e
    }
  }
}

/**
 * Apply Dashboard Client changes
 */
export async function applyDashboardClientChanges(
  changePlan,
  connectionProfileId,
  userAttributeProfileId
) {
  if (changePlan.action === ChangeAction.SKIP) {
    const spinner = ora({
      text: `${DASHBOARD_CLIENT_NAME} client is up to date`,
    }).start()
    spinner.succeed()
    return changePlan.existing
  }

  if (changePlan.action === ChangeAction.CREATE) {
    const spinner = ora({
      text: `Creating ${DASHBOARD_CLIENT_NAME} client`,
    }).start()

    try {
      const desiredCallbacks = [`${APP_BASE_URL}/auth/callback`]
      const desiredLogoutUrls = [APP_BASE_URL]

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

      // Fetch full client details including client_secret
      const { stdout: fullClientStdout } =
        await $`auth0 api get clients/${client.client_id}?fields=client_id,name,client_secret,app_type,callbacks,allowed_logout_urls,my_organization_configuration,organization_require_behavior,organization_usage`
      const fullClient = JSON.parse(fullClientStdout)

      spinner.succeed(`Created ${DASHBOARD_CLIENT_NAME} client`)
      return fullClient
    } catch (e) {
      spinner.fail(`Failed to create the ${DASHBOARD_CLIENT_NAME} client`)
      throw e
    }
  }

  if (changePlan.action === ChangeAction.UPDATE) {
    const spinner = ora({
      text: `Updating ${DASHBOARD_CLIENT_NAME} client configuration`,
    }).start()

    try {
      const { existing, updates } = changePlan
      const updateData = {}

      if (updates.missingCallbacks.length > 0) {
        updateData.callbacks = [
          ...(existing.callbacks || []),
          ...updates.missingCallbacks,
        ]
      }

      if (updates.missingLogoutUrls.length > 0) {
        updateData.allowed_logout_urls = [
          ...(existing.allowed_logout_urls || []),
          ...updates.missingLogoutUrls,
        ]
      }

      if (updates.wrongAppType) {
        updateData.app_type = "regular_web"
      }

      if (updates.organizationSettingsNeedUpdate) {
        updateData.organization_require_behavior = "post_login_prompt"
        updateData.organization_usage = "require"
      }

      if (updates.myOrgConfigNeedsUpdate) {
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

      await auth0ApiCall("patch", `clients/${existing.client_id}`, updateData)
      spinner.succeed(`Updated ${DASHBOARD_CLIENT_NAME} client`)

      // Fetch updated client with client_secret to return
      const { stdout } =
        await $`auth0 api get clients/${existing.client_id}?fields=client_id,name,client_secret,app_type,callbacks,allowed_logout_urls,my_organization_configuration,organization_require_behavior,organization_usage`
      const updated = JSON.parse(stdout)
      return updated
    } catch (e) {
      spinner.fail(`Failed to update ${DASHBOARD_CLIENT_NAME} client`)
      throw e
    }
  }
}

/**
 * Apply My Org API Client Grant changes
 */
export async function applyMyOrgClientGrantChanges(
  changePlan,
  domain,
  clientId
) {
  if (changePlan.action === ChangeAction.SKIP) {
    const spinner = ora({
      text: `My Org API Client Grant is up to date`,
    }).start()
    spinner.succeed()
    return changePlan.existing
  }

  if (changePlan.action === ChangeAction.CREATE) {
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
          scope: changePlan.scopes,
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

  if (changePlan.action === ChangeAction.UPDATE) {
    const spinner = ora({
      text: `Adding missing scopes to My Org API Client Grant`,
    }).start()

    try {
      const { existing, updates } = changePlan
      const existingScopes = existing.scope || []
      const updatedScopes = [...existingScopes, ...updates.missingScopes]

      await auth0ApiCall("patch", `client-grants/${existing.id}`, {
        scope: updatedScopes,
      })
      spinner.succeed(
        `Updated My Org API Client Grant with ${updates.missingScopes.length} new scope(s)`
      )
      return existing
    } catch (e) {
      spinner.fail(`Failed to update My Org API Client Grant`)
      throw e
    }
  }
}
