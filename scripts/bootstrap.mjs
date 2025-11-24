#!/usr/bin/env node
import ora from "ora"

import {
  ensureAddDefaultRoleAction,
  ensureAddRoleToTokensAction,
  ensureSecurityPoliciesAction,
  updateActionTriggerBindings,
} from "./utils/actions.mjs"
import { configureBranding } from "./utils/branding.mjs"
import {
  APP_BASE_URL,
  DASHBOARD_CLIENT_NAME,
  ensureDashboardClient,
  ensureManagementClient,
  ensureManagementClientGrant,
  ensureMyOrgClientGrant,
  MANAGEMENT_CLIENT_NAME,
} from "./utils/clients.mjs"
import {
  CONNECTION_PROFILE_NAME_PREFIX,
  DEFAULT_CONNECTION_NAME,
  ensureConnectionProfile,
  ensureDatabaseConnection,
} from "./utils/connections.mjs"
import {
  discoverExistingResources,
  displayPlan,
  planChanges,
  structureResources,
} from "./utils/discovery.mjs"
import { writeEnvFile } from "./utils/env-writer.mjs"
import { confirmWithUser } from "./utils/helpers.mjs"
import {
  ensureUserAttributeProfile,
  USER_ATTRIBUTE_PROFILE_NAME,
} from "./utils/profiles.mjs"
import { ensureMyOrgResourceServer } from "./utils/resource-servers.mjs"
import { ensureAdminRole, ensureMemberRole } from "./utils/roles.mjs"
import {
  configureEmailTemplates,
  configurePromptSettings,
  configureTenantSettings,
  enableMFAFactors,
} from "./utils/tenant-config.mjs"
import {
  checkAuth0CLI,
  checkNodeVersion,
  validateTenant,
} from "./utils/validation.mjs"

// ============================================================================
// Main Bootstrap Flow
// ============================================================================

async function main() {
  console.log("\n🚀 Auth0 B2B SaaS Starter - Bootstrap Script\n")

  // Step 1: Validation
  console.log("📋 Step 1: Pre-flight Checks")
  checkNodeVersion()
  await checkAuth0CLI()
  const domain = await validateTenant()
  console.log("")

  // Step 2: Discovery
  console.log("🔍 Step 2: Resource Discovery")
  const rawResources = await discoverExistingResources(domain)

  // Create constants object for discovery functions
  const constants = {
    MANAGEMENT_CLIENT_NAME,
    DASHBOARD_CLIENT_NAME,
    DEFAULT_CONNECTION_NAME,
    CONNECTION_PROFILE_NAME_PREFIX,
    USER_ATTRIBUTE_PROFILE_NAME,
  }

  const existing = structureResources(rawResources, domain, constants)
  console.log("")

  // Step 3: Planning
  console.log("📝 Step 3: Change Planning")
  const plan = planChanges(existing, domain, constants)
  displayPlan(plan)
  console.log("")

  // Step 4: User Confirmation
  const confirmed = await confirmWithUser(
    "Do you want to proceed with these changes? (yes/no): "
  )
  if (!confirmed) {
    console.log("\n❌ Bootstrap cancelled by user.\n")
    process.exit(0)
  }
  console.log("")

  // Step 5: Execute Changes
  console.log("⚙️  Step 5: Applying Changes\n")

  // 5a. Tenant Configuration
  console.log("Configuring Tenant Settings...")
  await configureTenantSettings()
  await configurePromptSettings()
  await configureEmailTemplates()
  await enableMFAFactors()
  console.log("")

  // 5b. Branding (best effort)
  console.log("Configuring Branding...")
  await configureBranding()
  console.log("")

  // 5c. Connection Profile & User Attribute Profile (needed for Dashboard Client)
  console.log("Configuring Profiles...")
  const connectionProfile = await ensureConnectionProfile(
    existing,
    rawResources
  )
  const userAttributeProfile = await ensureUserAttributeProfile(
    existing,
    rawResources
  )
  console.log("")

  // 5d. Clients
  console.log("Configuring Clients...")
  const managementClient = await ensureManagementClient(
    existing,
    rawResources,
    domain
  )
  await ensureManagementClientGrant(
    managementClient.client_id,
    rawResources,
    domain
  )

  const dashboardClient = await ensureDashboardClient(
    existing,
    rawResources,
    domain,
    connectionProfile.id,
    userAttributeProfile.id
  )
  console.log("")

  // 5e. Resource Server (My Organization API)
  console.log("Configuring Resource Server...")
  const myOrgResourceServer = await ensureMyOrgResourceServer(
    rawResources,
    domain
  )
  console.log("")

  // 5f. Grant My Org API access to Dashboard Client
  console.log("Granting My Organization API access to Dashboard Client...")
  await ensureMyOrgClientGrant(dashboardClient.client_id, rawResources, domain)
  console.log("")

  // 5g. Database Connection
  console.log("Configuring Database Connection...")
  const connection = await ensureDatabaseConnection(
    existing,
    rawResources,
    dashboardClient.client_id,
    managementClient.client_id
  )
  console.log("")

  // 5h. Roles
  console.log("Configuring Roles...")
  const adminRole = await ensureAdminRole(
    existing,
    rawResources,
    myOrgResourceServer,
    domain
  )
  const memberRole = await ensureMemberRole(existing, rawResources)
  console.log("")

  // 5i. Actions
  console.log("Configuring Actions...")
  const securityPoliciesAction = await ensureSecurityPoliciesAction(
    existing,
    rawResources,
    dashboardClient.client_id
  )
  const addDefaultRoleAction = await ensureAddDefaultRoleAction(
    existing,
    rawResources,
    domain,
    managementClient.client_id,
    managementClient.client_secret,
    memberRole.id
  )
  const addRoleToTokensAction = await ensureAddRoleToTokensAction(
    existing,
    rawResources
  )
  console.log("")

  // 5j. Action Trigger Bindings
  console.log("Configuring Action Trigger Bindings...")
  await updateActionTriggerBindings(
    securityPoliciesAction,
    addDefaultRoleAction,
    addRoleToTokensAction
  )
  console.log("")

  // Step 6: Generate .env.local
  console.log("📝 Step 6: Generating .env.local file\n")
  await writeEnvFile(
    domain,
    managementClient.client_id,
    managementClient.client_secret,
    dashboardClient.client_id,
    dashboardClient.client_secret,
    myOrgResourceServer.identifier,
    connection.id
  )

  // Done!
  console.log("\n✅ Bootstrap complete!\n")
  console.log("Next steps:")
  console.log("  1. Review the generated .env.local file")
  console.log("  2. Run 'npm run dev' to start the development server")
  console.log("  3. Navigate to http://localhost:3000\n")
}

// Run the main function
main().catch((error) => {
  console.error("\n❌ Bootstrap failed:", error.message)
  process.exit(1)
})
