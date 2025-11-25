import { $ } from "execa"
import ora from "ora"

import { auth0ApiCall } from "./auth0-api.mjs"
import { ChangeAction, createChangeItem } from "./change-plan.mjs"

// ============================================================================
// CHECK FUNCTIONS - Determine what changes are needed
// ============================================================================

/**
 * Check if Admin Role needs changes
 * NOTE: This function DOES make an API call to get current permissions
 * because we need to know which permissions are missing
 */
export async function checkAdminRoleChanges(
  existingRoles,
  domain,
  myOrgApiScopes
) {
  const existingRole = existingRoles.find((r) => r.name === "admin")

  if (!existingRole) {
    return createChangeItem(ChangeAction.CREATE, {
      resource: "Admin Role",
      name: "admin",
      permissions: myOrgApiScopes,
      domain,
    })
  }

  // Get current permissions for the role
  const currentPermissions = await auth0ApiCall(
    "get",
    `roles/${existingRole.id}/permissions`
  )
  // API returns array directly, not wrapped in a permissions property
  const currentPerms = Array.isArray(currentPermissions)
    ? currentPermissions
    : currentPermissions?.permissions || []

  const myOrgPerms = currentPerms.filter(
    (p) => p.resource_server_identifier === `https://${domain}/my-org/`
  )

  const existingPermNames = new Set(myOrgPerms.map((p) => p.permission_name))
  const missingPerms = myOrgApiScopes.filter(
    (scope) => !existingPermNames.has(scope)
  )

  if (missingPerms.length > 0) {
    return createChangeItem(ChangeAction.UPDATE, {
      resource: "Admin Role",
      name: "admin",
      existing: existingRole,
      updates: {
        missingPermissions: missingPerms,
      },
      domain,
      summary: `Add ${missingPerms.length} permission(s)`,
    })
  }

  return createChangeItem(ChangeAction.SKIP, {
    resource: "Admin Role",
    name: "admin",
    existing: existingRole,
  })
}

/**
 * Check if Member Role needs changes
 */
export function checkMemberRoleChanges(existingRoles) {
  const existingRole = existingRoles.find((r) => r.name === "member")

  if (!existingRole) {
    return createChangeItem(ChangeAction.CREATE, {
      resource: "Member Role",
      name: "member",
    })
  }

  return createChangeItem(ChangeAction.SKIP, {
    resource: "Member Role",
    name: "member",
    existing: existingRole,
  })
}

// ============================================================================
// APPLY FUNCTIONS - Execute changes based on cached plan
// ============================================================================

/**
 * Apply Admin Role changes
 */
export async function applyAdminRoleChanges(changePlan) {
  if (changePlan.action === ChangeAction.SKIP) {
    const spinner = ora({
      text: `Admin role permissions are up to date`,
    }).start()
    spinner.succeed()
    return changePlan.existing
  }

  if (changePlan.action === ChangeAction.CREATE) {
    const spinner = ora({
      text: `Creating admin role`,
    }).start()

    try {
      // prettier-ignore
      const createRoleArgs = [
        "roles", "create",
        "--name", "admin",
        "--description", "Manage the organization's configuration.",
        "--json", "--no-input"
      ];

      const { stdout } = await $`auth0 ${createRoleArgs}`
      const role = JSON.parse(stdout)

      // Add My Org API permissions to the role
      const permissionsData = {
        permissions: changePlan.permissions.map((scope) => ({
          permission_name: scope,
          resource_server_identifier: `https://${changePlan.domain}/my-org/`,
        })),
      }

      await auth0ApiCall(
        "post",
        `roles/${role.id}/permissions`,
        permissionsData
      )

      spinner.succeed(`Created admin role`)
      return role
    } catch (e) {
      spinner.fail(`Failed to create the admin role`)
      throw e
    }
  }

  if (changePlan.action === ChangeAction.UPDATE) {
    const spinner = ora({
      text: `Adding ${changePlan.updates.missingPermissions.length} missing permission(s) to admin role`,
    }).start()

    try {
      const { existing, updates, domain } = changePlan

      // Add the missing My Org API permissions
      const permissionsData = {
        permissions: updates.missingPermissions.map((scope) => ({
          permission_name: scope,
          resource_server_identifier: `https://${domain}/my-org/`,
        })),
      }

      await auth0ApiCall(
        "post",
        `roles/${existing.id}/permissions`,
        permissionsData
      )
      spinner.succeed(
        `Updated admin role with ${updates.missingPermissions.length} new permission(s)`
      )
      return existing
    } catch (e) {
      spinner.fail(`Failed to update admin role permissions`)
      throw e
    }
  }
}

/**
 * Apply Member Role changes
 */
export async function applyMemberRoleChanges(changePlan) {
  if (changePlan.action === ChangeAction.SKIP) {
    const spinner = ora({
      text: `Member role is up to date`,
    }).start()
    spinner.succeed()
    return changePlan.existing
  }

  if (changePlan.action === ChangeAction.CREATE) {
    const spinner = ora({
      text: `Creating member role`,
    }).start()

    try {
      // prettier-ignore
      const createRoleArgs = [
        "roles", "create",
        "--name", "member",
        "--description", "Member of an organization.",
        "--json", "--no-input"
      ];

      const { stdout } = await $`auth0 ${createRoleArgs}`
      const role = JSON.parse(stdout)
      spinner.succeed("Created member role")
      return role
    } catch (e) {
      spinner.fail(`Failed to create the member role`)
      throw e
    }
  }
}
