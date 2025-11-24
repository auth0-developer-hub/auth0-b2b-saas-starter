import { $ } from "execa"
import ora from "ora"

import { auth0ApiCall } from "./auth0-api.mjs"

/**
 * Compare permission arrays - checks if all desired permissions are present
 */
function hasAllPermissions(existing, desired, domain) {
  if (!existing) return false

  const existingSet = new Set(
    existing
      .filter(
        (p) => p.resource_server_identifier === `https://${domain}/my-org/`
      )
      .map((p) => p.permission_name)
  )

  // Check if all desired permissions are present
  for (const perm of desired) {
    if (!existingSet.has(perm)) return false
  }

  return true
}

/**
 * Ensure admin role exists and has My Org API permissions
 */
export async function ensureAdminRole(existing, domain, myOrgApiScopes) {
  const existingRole = existing.roles.find((r) => r.name === "admin")

  if (existingRole) {
    // Get current permissions for the role
    const currentPermissions = await auth0ApiCall(
      "get",
      `roles/${existingRole.id}/permissions`
    )
    const currentPerms = currentPermissions?.permissions || []

    const myOrgPerms = currentPerms.filter(
      (p) => p.resource_server_identifier === `https://${domain}/my-org/`
    )

    const existingPermNames = new Set(myOrgPerms.map((p) => p.permission_name))
    const missingPerms = myOrgApiScopes.filter(
      (scope) => !existingPermNames.has(scope)
    )

    if (missingPerms.length > 0) {
      const spinner = ora({
        text: `Adding ${missingPerms.length} missing permission(s) to admin role`,
      }).start()

      try {
        // Add the missing My Org API permissions
        const permissionsData = {
          permissions: missingPerms.map((scope) => ({
            permission_name: scope,
            resource_server_identifier: `https://${domain}/my-org/`,
          })),
        }

        await auth0ApiCall(
          "post",
          `roles/${existingRole.id}/permissions`,
          permissionsData
        )
        spinner.succeed(
          `Updated admin role with ${missingPerms.length} new permission(s)`
        )
        return existingRole
      } catch (e) {
        spinner.fail(`Failed to update admin role permissions`)
        throw e
      }
    } else {
      const spinner = ora({
        text: `Admin role permissions are up to date`,
      }).start()
      spinner.succeed()
      return existingRole
    }
  }

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
      permissions: myOrgApiScopes.map((scope) => ({
        permission_name: scope,
        resource_server_identifier: `https://${domain}/my-org/`,
      })),
    }

    await auth0ApiCall("post", `roles/${role.id}/permissions`, permissionsData)

    spinner.succeed(`Created admin role`)
    return role
  } catch (e) {
    spinner.fail(`Failed to create the admin role`)
    throw e
  }
}

/**
 * Ensure member role exists
 */
export async function ensureMemberRole(existing) {
  const existingRole = existing.roles.find((r) => r.name === "member")

  if (existingRole) {
    const spinner = ora({
      text: `Using existing member role`,
    }).start()
    spinner.succeed()
    return existingRole
  }

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
    spinner.succeed()
    return role
  } catch (e) {
    spinner.fail(`Failed to create the member role`)
    throw e
  }
}
