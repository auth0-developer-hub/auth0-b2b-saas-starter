import { $ } from "execa"
import ora from "ora"

import { auth0ApiCall } from "./auth0-api.mjs"

// Constants
export const DEFAULT_CONNECTION_NAME = "SaaStart-Shared-Database"
export const CONNECTION_PROFILE_NAME_PREFIX = "SaaStart-Connection-Profile"

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
 * Ensure Database Connection exists and is configured correctly
 */
export async function ensureDatabaseConnection(
  existing,
  dashboardClientId,
  managementClientId
) {
  const existingConnection = existing.connections.find(
    (c) => c.name === DEFAULT_CONNECTION_NAME
  )

  const desiredEnabledClients = [dashboardClientId, managementClientId]

  if (existingConnection) {
    // Check if we need to add any missing enabled clients
    const existingEnabledClients = existingConnection.enabled_clients || []
    const missingClients = desiredEnabledClients.filter(
      (clientId) => !existingEnabledClients.includes(clientId)
    )

    if (missingClients.length > 0) {
      const spinner = ora({
        text: `Adding missing enabled clients to ${DEFAULT_CONNECTION_NAME} connection`,
      }).start()

      try {
        const updatedClients = [...existingEnabledClients, ...missingClients]
        await auth0ApiCall("patch", `connections/${existingConnection.id}`, {
          enabled_clients: updatedClients,
        })
        spinner.succeed(
          `Updated ${DEFAULT_CONNECTION_NAME} connection with ${missingClients.length} new enabled client(s)`
        )

        // Fetch updated connection
        const updated = await auth0ApiCall(
          "get",
          `connections/${existingConnection.id}`
        )
        return updated || existingConnection
      } catch (e) {
        spinner.fail(`Failed to update ${DEFAULT_CONNECTION_NAME} connection`)
        throw e
      }
    } else {
      const spinner = ora({
        text: `${DEFAULT_CONNECTION_NAME} connection is up to date`,
      }).start()
      spinner.succeed()
      return existingConnection
    }
  }

  const spinner = ora({
    text: `Creating ${DEFAULT_CONNECTION_NAME} connection`,
  }).start()

  try {
    // prettier-ignore
    const createConnectionArgs = [
      "api", "post", "connections",
      "--data", JSON.stringify({
        strategy: "auth0",
        name: DEFAULT_CONNECTION_NAME,
        display_name: "SaaStart",
        enabled_clients: desiredEnabledClients,
      }),
    ];

    const { stdout } = await $`auth0 ${createConnectionArgs}`
    const connection = JSON.parse(stdout)
    spinner.succeed(`Created ${DEFAULT_CONNECTION_NAME} connection`)
    return connection
  } catch (e) {
    spinner.fail(`Failed to create the ${DEFAULT_CONNECTION_NAME} connection`)
    throw e
  }
}

/**
 * Create or update Connection Profile
 */
export async function ensureConnectionProfile(existing) {
  const existingProfile = existing.connectionProfiles.find((cp) =>
    cp.name?.startsWith(CONNECTION_PROFILE_NAME_PREFIX)
  )

  const desiredConfig = {
    organization: {
      show_as_button: "optional",
      assign_membership_on_login: "optional",
    },
    connection_name_prefix_template: "con-{org_id}-",
    enabled_features: ["scim", "universal_logout"],
  }

  if (existingProfile) {
    // Check if the profile needs updates
    const needsUpdate =
      existingProfile.organization?.show_as_button !==
        desiredConfig.organization.show_as_button ||
      existingProfile.organization?.assign_membership_on_login !==
        desiredConfig.organization.assign_membership_on_login ||
      existingProfile.connection_name_prefix_template !==
        desiredConfig.connection_name_prefix_template ||
      !arraysEqual(
        existingProfile.enabled_features || [],
        desiredConfig.enabled_features
      )

    if (needsUpdate) {
      const spinner = ora({
        text: `Updating Connection Profile: ${existingProfile.name}`,
      }).start()

      try {
        await auth0ApiCall(
          "patch",
          `connection-profiles/${existingProfile.id}`,
          desiredConfig
        )
        spinner.succeed(`Updated Connection Profile`)

        // Fetch updated profile
        const updated = await auth0ApiCall(
          "get",
          `connection-profiles/${existingProfile.id}`
        )
        return updated || existingProfile
      } catch (e) {
        spinner.fail(`Failed to update Connection Profile`)
        throw e
      }
    } else {
      const spinner = ora({
        text: `Connection Profile is up to date: ${existingProfile.name}`,
      }).start()
      spinner.succeed()
      return existingProfile
    }
  }

  const spinner = ora({
    text: `Creating Connection Profile`,
  }).start()

  try {
    const timestamp = Date.now()
    const profileData = {
      name: `${CONNECTION_PROFILE_NAME_PREFIX}-${timestamp}`,
      ...desiredConfig,
    }

    const result = await auth0ApiCall(
      "post",
      "connection-profiles",
      profileData
    )

    if (!result) {
      throw new Error("Failed to create connection profile")
    }

    spinner.succeed("Created Connection Profile")
    return result
  } catch (e) {
    spinner.fail(`Failed to create Connection Profile`)
    throw e
  }
}
