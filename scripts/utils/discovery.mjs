import { $ } from "execa"
import ora from "ora"

import { auth0ApiCall } from "./auth0-api.mjs"

/**
 * Get existing resources from tenant
 */
export async function discoverExistingResources(domain) {
  const spinner = ora({
    text: `Discovering existing resources in tenant`,
  }).start()

  try {
    const resources = {
      clients: [],
      roles: [],
      connections: [],
      resourceServers: [],
      actions: [],
      clientGrants: [],
      connectionProfiles: [],
      userAttributeProfiles: [],
    }

    // Get clients
    const { stdout: clientsStdout } = await $`auth0 apps list --json`
    resources.clients = JSON.parse(clientsStdout) || []

    // Get roles
    const { stdout: rolesStdout } = await $`auth0 roles list --json`
    resources.roles = JSON.parse(rolesStdout) || []

    // Get connections
    const { stdout: connectionsStdout } = await $`auth0 api get connections`
    resources.connections = JSON.parse(connectionsStdout) || []

    // Get resource servers
    const { stdout: rsStdout } = await $`auth0 apis list --json`
    resources.resourceServers = JSON.parse(rsStdout) || []

    // Get actions
    const { stdout: actionsStdout } = await $`auth0 actions list --json`
    resources.actions = JSON.parse(actionsStdout) || []

    // Get client grants
    const { stdout: grantsStdout } = await $`auth0 api get client-grants`
    resources.clientGrants = JSON.parse(grantsStdout) || []

    // Get connection profiles (using generic API)
    const connectionProfiles = await auth0ApiCall("get", "connection-profiles")
    resources.connectionProfiles = connectionProfiles?.connection_profiles || []

    // Get user attribute profiles (using generic API)
    const userAttributeProfiles = await auth0ApiCall(
      "get",
      "user-attribute-profiles"
    )
    resources.userAttributeProfiles =
      userAttributeProfiles?.user_attribute_profiles || []

    spinner.succeed("Resource discovery complete")
    return resources
  } catch (e) {
    spinner.fail("Failed to discover existing resources")
    console.error(e)
    process.exit(1)
  }
}

/**
 * Transform raw resources into a structured format for easier lookup
 */
export function structureResources(resources, domain, constants) {
  const {
    MANAGEMENT_CLIENT_NAME,
    DASHBOARD_CLIENT_NAME,
    DEFAULT_CONNECTION_NAME,
    CONNECTION_PROFILE_NAME_PREFIX,
    USER_ATTRIBUTE_PROFILE_NAME,
  } = constants

  return {
    clients: {
      management: resources.clients.find(
        (c) => c.name === MANAGEMENT_CLIENT_NAME
      ),
      dashboard: resources.clients.find(
        (c) => c.name === DASHBOARD_CLIENT_NAME
      ),
    },
    roles: {
      admin: resources.roles.find((r) => r.name === "admin"),
      member: resources.roles.find((r) => r.name === "member"),
    },
    connection: resources.connections.find(
      (c) => c.name === DEFAULT_CONNECTION_NAME
    ),
    resourceServer: resources.resourceServers.find(
      (rs) => rs.identifier === `https://${domain}/my-org/`
    ),
    connectionProfile: resources.connectionProfiles.find((cp) =>
      cp.name?.startsWith(CONNECTION_PROFILE_NAME_PREFIX)
    ),
    userAttributeProfile: resources.userAttributeProfiles.find(
      (uap) => uap.name === USER_ATTRIBUTE_PROFILE_NAME
    ),
    actions: {
      securityPolicies: resources.actions.find(
        (a) => a.name === "Security Policies"
      ),
      addDefaultRole: resources.actions.find(
        (a) => a.name === "Add Default Role"
      ),
      addRoleToTokens: resources.actions.find(
        (a) => a.name === "Add Role to Tokens"
      ),
    },
    clientGrants: resources.clientGrants,
    raw: resources, // Keep raw data for functions that need full arrays
  }
}

/**
 * Plan what changes will be made
 */
export async function planChanges(existing, domain, constants) {
  const {
    MANAGEMENT_CLIENT_NAME,
    DASHBOARD_CLIENT_NAME,
    DEFAULT_CONNECTION_NAME,
    CONNECTION_PROFILE_NAME_PREFIX,
    USER_ATTRIBUTE_PROFILE_NAME,
  } = constants

  const plan = {
    create: [],
    update: [],
    skip: [],
  }

  // Check Management Client
  const mgmtClient = existing.clients.find(
    (c) => c.name === MANAGEMENT_CLIENT_NAME
  )
  if (mgmtClient) {
    plan.skip.push(`Client: ${MANAGEMENT_CLIENT_NAME} (already exists)`)
  } else {
    plan.create.push(`Client: ${MANAGEMENT_CLIENT_NAME}`)
  }

  // Check Dashboard Client
  const dashClient = existing.clients.find(
    (c) => c.name === DASHBOARD_CLIENT_NAME
  )
  if (dashClient) {
    plan.update.push(
      `Client: ${DASHBOARD_CLIENT_NAME} (update my_organization_configuration)`
    )
  } else {
    plan.create.push(`Client: ${DASHBOARD_CLIENT_NAME}`)
  }

  // Check Resource Server (My Org API)
  const myOrgApi = existing.resourceServers.find(
    (rs) => rs.identifier === `https://${domain}/my-org/`
  )
  if (myOrgApi) {
    plan.skip.push(
      `Resource Server: Auth0 My Organization API (already exists)`
    )
  } else {
    plan.create.push(`Resource Server: Auth0 My Organization API`)
  }

  // Check Connection
  const connection = existing.connections.find(
    (c) => c.name === DEFAULT_CONNECTION_NAME
  )
  if (connection) {
    plan.skip.push(`Connection: ${DEFAULT_CONNECTION_NAME} (already exists)`)
  } else {
    plan.create.push(`Connection: ${DEFAULT_CONNECTION_NAME}`)
  }

  // Check Roles
  const adminRole = existing.roles.find((r) => r.name === "admin")
  if (adminRole) {
    plan.update.push(`Role: admin (add My Org API permissions)`)
  } else {
    plan.create.push(`Role: admin`)
  }

  const memberRole = existing.roles.find((r) => r.name === "member")
  if (memberRole) {
    plan.skip.push(`Role: member (already exists)`)
  } else {
    plan.create.push(`Role: member`)
  }

  // Check Actions
  const securityPoliciesAction = existing.actions.find(
    (a) => a.name === "Security Policies"
  )
  if (!securityPoliciesAction) {
    plan.create.push(`Action: Security Policies`)
  } else {
    plan.skip.push(`Action: Security Policies (already exists)`)
  }

  const addDefaultRoleAction = existing.actions.find(
    (a) => a.name === "Add Default Role"
  )
  if (!addDefaultRoleAction) {
    plan.create.push(`Action: Add Default Role`)
  } else {
    plan.skip.push(`Action: Add Default Role (already exists)`)
  }

  const addRoleToTokensAction = existing.actions.find(
    (a) => a.name === "Add Role to Tokens"
  )
  if (!addRoleToTokensAction) {
    plan.create.push(`Action: Add Role to Tokens`)
  } else {
    plan.skip.push(`Action: Add Role to Tokens (already exists)`)
  }

  // Check Connection Profile
  const connectionProfile = existing.connectionProfiles.find((cp) =>
    cp.name?.startsWith(CONNECTION_PROFILE_NAME_PREFIX)
  )
  if (connectionProfile) {
    plan.skip.push(
      `Connection Profile: ${connectionProfile.name} (already exists)`
    )
  } else {
    plan.create.push(
      `Connection Profile: ${CONNECTION_PROFILE_NAME_PREFIX}-<timestamp>`
    )
  }

  // Check User Attribute Profile
  const userAttributeProfile = existing.userAttributeProfiles.find(
    (uap) => uap.name === USER_ATTRIBUTE_PROFILE_NAME
  )
  if (userAttributeProfile) {
    plan.skip.push(
      `User Attribute Profile: ${USER_ATTRIBUTE_PROFILE_NAME} (already exists)`
    )
  } else {
    plan.create.push(`User Attribute Profile: ${USER_ATTRIBUTE_PROFILE_NAME}`)
  }

  // Always update these
  plan.update.push("Tenant Settings (MFA, flags, branding)")
  plan.update.push("Prompt Settings (identifier_first)")
  plan.update.push("MFA Factors (webauthn-roaming, OTP)")
  plan.update.push("Email Templates (verify_email)")
  plan.create.push("Universal Login Theme (best effort)")

  return plan
}

/**
 * Display the plan to the user
 */
export function displayPlan(plan) {
  console.log("\n" + "=".repeat(80))
  console.log("BOOTSTRAP PLAN")
  console.log("=".repeat(80))

  if (plan.create.length > 0) {
    console.log("\n📝 Resources to CREATE:")
    plan.create.forEach((item) => console.log(`   • ${item}`))
  }

  if (plan.update.length > 0) {
    console.log("\n🔄 Resources to UPDATE:")
    plan.update.forEach((item) => console.log(`   • ${item}`))
  }

  if (plan.skip.length > 0) {
    console.log("\n⏭️  Resources to SKIP (already exist):")
    plan.skip.forEach((item) => console.log(`   • ${item}`))
  }

  console.log("\n" + "=".repeat(80) + "\n")
}
