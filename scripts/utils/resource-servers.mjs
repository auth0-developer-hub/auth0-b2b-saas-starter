import { $ } from "execa"
import ora from "ora"

import { auth0ApiCall } from "./auth0-api.mjs"

// Constants
export const MYORG_API_SCOPES = [
  "read:my_org:details",
  "update:my_org:details",
  "create:my_org:identity_providers",
  "read:my_org:identity_providers",
  "update:my_org:identity_providers",
  "delete:my_org:identity_providers",
  "update:my_org:identity_providers_detach",
  "read:my_org:domains",
  "delete:my_org:domains",
  "create:my_org:domains",
  "update:my_org:domains",
  "read:my_org:identity_providers_domains",
  "create:my_org:identity_provider_domains",
  "delete:my_org:identity_provider_domains",
  "read:my_org:scim_tokens",
  "create:my_org:scim_tokens",
  "delete:my_org:scim_tokens",
  "create:my_org:identity_provider_provisioning",
  "read:my_org:identity_provider_provisioning",
  "delete:my_org:identity_provider_provisioning",
  "read:my_org:configuration",
]

/**
 * Ensure My Organization Resource Server exists
 */
export async function ensureMyOrgResourceServer(existing, domain) {
  const existingRS = existing.resourceServers.find(
    (rs) => rs.identifier === `https://${domain}/my-org/`
  )

  if (existingRS) {
    // Check if skip_consent_for_verifiable_first_party_clients needs updating
    const needsUpdate =
      existingRS.skip_consent_for_verifiable_first_party_clients !== true

    if (needsUpdate) {
      const spinner = ora({
        text: `Updating My Organization API configuration`,
      }).start()

      try {
        await auth0ApiCall("patch", `resource-servers/${existingRS.id}`, {
          skip_consent_for_verifiable_first_party_clients: true,
        })
        spinner.succeed(`Updated My Organization API configuration`)

        // Fetch updated resource server
        const updated = await auth0ApiCall(
          "get",
          `resource-servers/${existingRS.id}`
        )
        return updated || existingRS
      } catch (e) {
        spinner.fail(`Failed to update My Organization API configuration`)
        throw e
      }
    } else {
      const spinner = ora({
        text: `My Organization API is up to date`,
      }).start()
      spinner.succeed()
      return existingRS
    }
  }

  const spinner = ora({
    text: `Enabling My Organization API`,
  }).start()

  try {
    // prettier-ignore
    const createMyOrgResourceServerArgs = [
      "api", "post", "resource-servers",
      "--data", JSON.stringify({
        identifier: `https://${domain}/my-org/`,
        name: "Auth0 My Organization API",
        skip_consent_for_verifiable_first_party_clients: true,
        token_dialect: "rfc9068_profile",
      }),
    ];

    const { stdout } = await $`auth0 ${createMyOrgResourceServerArgs}`
    const rs = JSON.parse(stdout)
    spinner.succeed()
    return rs
  } catch (e) {
    spinner.fail(`Failed to enable My Organization API on Tenant`)
    throw e
  }
}
