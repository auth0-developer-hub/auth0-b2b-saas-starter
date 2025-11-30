import { $ } from "execa"
import ora from "ora"

import {
  checkActionTriggerBindingsChanges,
  checkAddDefaultRoleActionChanges,
  checkAddRoleToTokensActionChanges,
  checkSecurityPoliciesActionChanges,
} from "./actions.mjs"
import { auth0ApiCall } from "./auth0-api.mjs"
import { checkBrandingChanges } from "./branding.mjs"
import { createChangePlan } from "./change-plan.mjs"
import {
  checkDashboardClientChanges,
  checkManagementClientChanges,
  checkManagementClientGrantChanges,
  checkMyOrgClientGrantChanges,
} from "./clients.mjs"
import {
  checkConnectionProfileChanges,
  checkDatabaseConnectionChanges,
} from "./connections.mjs"
import { checkUserAttributeProfileChanges } from "./profiles.mjs"
import {
  checkMyOrgResourceServerChanges,
  MYORG_API_SCOPES,
} from "./resource-servers.mjs"
import { checkAdminRoleChanges, checkMemberRoleChanges } from "./roles.mjs"
import {
  checkEmailTemplatesChanges,
  checkMFAFactorsChanges,
  checkPromptSettingsChanges,
  checkTenantSettingsChanges,
} from "./tenant-config.mjs"

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
 * Check all resources and build comprehensive change plan
 */
export async function buildChangePlan(resources, domain) {
  const spinner = ora({
    text: `Analyzing required changes`,
  }).start()

  try {
    const plan = createChangePlan()

    // Profiles (needed first for Dashboard Client)
    plan.connectionProfile = checkConnectionProfileChanges(
      resources.connectionProfiles
    )
    plan.userAttributeProfile = checkUserAttributeProfileChanges(
      resources.userAttributeProfiles
    )

    // Get profile IDs (either existing or will be created)
    const connectionProfileId =
      plan.connectionProfile.existing?.id || "TO_BE_CREATED"
    const userAttributeProfileId =
      plan.userAttributeProfile.existing?.id || "TO_BE_CREATED"

    // Clients (both fetch full details including secrets)
    plan.clients.management = await checkManagementClientChanges(
      resources.clients
    )
    plan.clients.dashboard = await checkDashboardClientChanges(
      resources.clients,
      connectionProfileId,
      userAttributeProfileId
    )

    // Get client IDs (either existing or will be created)
    const managementClientId =
      plan.clients.management.existing?.client_id || "TO_BE_CREATED"
    const dashboardClientId =
      plan.clients.dashboard.existing?.client_id || "TO_BE_CREATED"

    // Client Grants
    plan.clientGrants.management = checkManagementClientGrantChanges(
      managementClientId,
      resources.clientGrants,
      domain
    )

    // Resource Server
    plan.resourceServer = checkMyOrgResourceServerChanges(
      resources.resourceServers,
      domain
    )

    // My Org Client Grant (Dashboard to My Org API)
    plan.clientGrants.myOrg = checkMyOrgClientGrantChanges(
      dashboardClientId,
      resources.clientGrants,
      domain,
      MYORG_API_SCOPES
    )

    // Connection
    plan.connection = checkDatabaseConnectionChanges(
      resources.connections,
      dashboardClientId,
      managementClientId
    )

    // Roles (admin role check makes API call to get current permissions)
    plan.roles.admin = await checkAdminRoleChanges(
      resources.roles,
      domain,
      MYORG_API_SCOPES
    )
    plan.roles.member = checkMemberRoleChanges(resources.roles)

    // Get member role ID for actions
    const memberRoleId = plan.roles.member.existing?.id || "TO_BE_CREATED"

    // Actions (will compare code to detect changes)
    plan.actions.securityPolicies = await checkSecurityPoliciesActionChanges(
      resources.actions
    )
    plan.actions.addDefaultRole = await checkAddDefaultRoleActionChanges(
      resources.actions
    )
    plan.actions.addRoleToTokens = await checkAddRoleToTokensActionChanges(
      resources.actions
    )
    plan.actions.bindings = await checkActionTriggerBindingsChanges(
      resources.actions
    )

    // Tenant Configuration (these make API calls to check current state)
    plan.tenantConfig.settings = await checkTenantSettingsChanges()
    plan.tenantConfig.prompts = await checkPromptSettingsChanges()
    plan.tenantConfig.emailTemplates = await checkEmailTemplatesChanges()
    plan.tenantConfig.mfaFactors = await checkMFAFactorsChanges()

    // Branding
    plan.branding = await checkBrandingChanges()

    spinner.succeed("Change analysis complete")
    return plan
  } catch (e) {
    spinner.fail("Failed to analyze changes")
    console.error(e)
    throw e
  }
}

/**
 * Display the comprehensive change plan to the user
 */
export function displayChangePlan(plan) {
  const creates = []
  const updates = []
  const skips = []

  // Helper to categorize changes
  function categorize(item) {
    if (!item) return
    if (item.action === "create") {
      const nameStr = item.name ? ` (${item.name})` : ""
      const summaryStr = item.summary ? `: ${item.summary}` : ""
      creates.push(`${item.resource}${nameStr}${summaryStr}`)
    } else if (item.action === "update") {
      const nameStr = item.name ? ` (${item.name})` : ""
      const summaryStr = item.summary ? `: ${item.summary}` : ""
      updates.push(`${item.resource}${nameStr}${summaryStr}`)
    } else if (item.action === "skip") {
      skips.push(`${item.resource}${item.name ? ` (${item.name})` : ""}`)
    }
  }

  // Categorize all plan items
  categorize(plan.clients.management)
  categorize(plan.clients.dashboard)
  categorize(plan.clientGrants.management)
  categorize(plan.clientGrants.myOrg)
  categorize(plan.connection)
  categorize(plan.connectionProfile)
  categorize(plan.userAttributeProfile)
  categorize(plan.resourceServer)
  categorize(plan.roles.admin)
  categorize(plan.roles.member)
  categorize(plan.actions.securityPolicies)
  categorize(plan.actions.addDefaultRole)
  categorize(plan.actions.addRoleToTokens)
  categorize(plan.actions.bindings)
  categorize(plan.tenantConfig.settings)
  categorize(plan.tenantConfig.prompts)
  categorize(plan.tenantConfig.emailTemplates)
  categorize(plan.tenantConfig.mfaFactors)
  categorize(plan.branding)

  console.log("\n" + "=".repeat(80))
  console.log("BOOTSTRAP PLAN")
  console.log("=".repeat(80))

  // Check if there are no changes needed
  if (creates.length === 0 && updates.length === 0) {
    console.log(
      "\n✅ No changes needed! All resources are already configured correctly."
    )
    console.log("\n" + "=".repeat(80))
    console.log("")
    return
  }

  if (creates.length > 0) {
    console.log("\n📝 Resources to CREATE:")
    creates.forEach((item) => console.log(`   • ${item}`))
  }

  if (updates.length > 0) {
    console.log("\n🔄 Resources to UPDATE:")
    updates.forEach((item) => console.log(`   • ${item}`))
  }

  if (skips.length > 0) {
    console.log("\n✓ Resources already up to date:")
    skips.forEach((item) => console.log(`   • ${item}`))
  }

  console.log("\n" + "=".repeat(80))

  // Show detailed breakdown if there are updates
  if (updates.length > 0) {
    console.log("\nDetailed Changes:")
    console.log("-".repeat(80))

    const showDetails = (item, label) => {
      if (!item || item.action !== "update") return

      let hasDetails = false

      if (item.updates) {
        // Dashboard Client
        if (item.updates.missingCallbacks?.length > 0) {
          if (!hasDetails) {
            console.log(`\n${label}:`)
            hasDetails = true
          }
          console.log(
            `  • Add callback URLs: ${item.updates.missingCallbacks.join(", ")}`
          )
        }
        if (item.updates.missingLogoutUrls?.length > 0) {
          if (!hasDetails) {
            console.log(`\n${label}:`)
            hasDetails = true
          }
          console.log(
            `  • Add logout URLs: ${item.updates.missingLogoutUrls.join(", ")}`
          )
        }
        if (item.updates.wrongAppType) {
          if (!hasDetails) {
            console.log(`\n${label}:`)
            hasDetails = true
          }
          console.log(`  • Set app_type to: regular_web`)
        }
        if (item.updates.myOrgConfigNeedsUpdate) {
          if (!hasDetails) {
            console.log(`\n${label}:`)
            hasDetails = true
          }
          // Show what specifically needs updating in my_org_configuration
          const details = []
          if (item.updates.connectionProfileId === "TO_BE_CREATED") {
            details.push("set connection_profile_id (will be created)")
          } else if (item.updates.connectionProfileId) {
            details.push(
              `update connection_profile_id to ${item.updates.connectionProfileId}`
            )
          }
          if (item.updates.userAttributeProfileId === "TO_BE_CREATED") {
            details.push("set user_attribute_profile_id (will be created)")
          } else if (item.updates.userAttributeProfileId) {
            details.push(
              `update user_attribute_profile_id to ${item.updates.userAttributeProfileId}`
            )
          }
          if (details.length > 0) {
            console.log(
              `  • Update My Org configuration: ${details.join(", ")}`
            )
          } else {
            console.log(`  • Update My Org configuration`)
          }
        }
        if (item.updates.organizationSettingsNeedUpdate) {
          if (!hasDetails) {
            console.log(`\n${label}:`)
            hasDetails = true
          }
          console.log(
            `  • Update organization settings (organization_usage: require, organization_require_behavior: post_login_prompt)`
          )
        }

        // Client Grants
        if (item.updates.missingScopes?.length > 0) {
          if (!hasDetails) {
            console.log(`\n${label}:`)
            hasDetails = true
          }
          console.log(
            `  • Add scopes: ${item.updates.missingScopes.join(", ")}`
          )
        }

        // Roles
        if (item.updates.missingPermissions?.length > 0) {
          if (!hasDetails) {
            console.log(`\n${label}:`)
            hasDetails = true
          }
          console.log(
            `  • Add permissions: ${item.updates.missingPermissions.join(", ")}`
          )
        }

        // Connection
        if (item.updates.missingEnabledClients?.length > 0) {
          if (!hasDetails) {
            console.log(`\n${label}:`)
            hasDetails = true
          }
          console.log(
            `  • Enable for ${item.updates.missingEnabledClients.length} additional client(s)`
          )
        }

        // MFA Factors
        if (item.updates.webauthnNeedsUpdate) {
          if (!hasDetails) {
            console.log(`\n${label}:`)
            hasDetails = true
          }
          console.log(`  • Enable WebAuthn (Passkeys/Security Keys)`)
        }
        if (item.updates.otpNeedsUpdate) {
          if (!hasDetails) {
            console.log(`\n${label}:`)
            hasDetails = true
          }
          console.log(`  • Enable OTP (Authenticator Apps)`)
        }

        // Connection Profile
        if (item.updates.changes?.length > 0) {
          if (!hasDetails) {
            console.log(`\n${label}:`)
            hasDetails = true
          }
          item.updates.changes.forEach((change) => console.log(`  • ${change}`))
        }
      }
    }

    showDetails(plan.clients.management, "Management Client")
    showDetails(plan.clients.dashboard, "Dashboard Client")
    showDetails(plan.clientGrants.management, "Management API Client Grant")
    showDetails(plan.clientGrants.myOrg, "My Org API Client Grant")
    showDetails(plan.connection, "Database Connection")
    showDetails(plan.connectionProfile, "Connection Profile")
    showDetails(plan.resourceServer, "My Organization API")
    showDetails(plan.roles.admin, "Admin Role")
    showDetails(plan.roles.member, "Member Role")
    showDetails(plan.tenantConfig.mfaFactors, "MFA Factors")

    // Action bindings
    if (plan.actions.bindings?.action === "update") {
      console.log(`\nAction Trigger Bindings:`)
      console.log(
        `  • Set post-login flow: Add Default Role → Add Role to Tokens → Security Policies`
      )
    }

    // Branding
    if (plan.branding?.action === "update") {
      console.log(`\nBranding:`)
      console.log(
        `  • Update Universal Login theme with custom colors and fonts`
      )
    }

    console.log("\n" + "=".repeat(80))
  }

  console.log("")
}
