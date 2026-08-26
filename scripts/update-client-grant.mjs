import { readFile } from "node:fs/promises"
import { $ } from "execa"
import ora from "ora"

import { managementApiScopes } from "./management-api-scopes.mjs"

/**
 * Tops up the Management API client grant with any scopes the app has come to need since the tenant
 * was bootstrapped.
 *
 * `bootstrap.mjs` creates that grant once and is not safe to re-run against a configured tenant, so
 * this script exists for tenants that are already set up. It only ever adds scopes — anything
 * already granted is left alone — which makes it safe to run repeatedly.
 *
 * Requires `read:client_grants` and `update:client_grants` on the Auth0 CLI's own token. See the
 * `auth0 login --scopes` line in the README.
 */

const MANAGEMENT_CLIENT_NAME = "SaaStart Management"
const LOGIN_HINT = `Re-run the "auth0 login --scopes ..." command from the README — it needs read:client_grants and update:client_grants.`

if (process.version.replace("v", "").split(".")[0] < 20) {
  console.error("Node.js version 20 or later is required to run this script.")
  process.exit(1)
}

const cliCheck = ora({
  text: `Checking that the Auth0 CLI has been installed`,
}).start()
try {
  await $`auth0 --version`
  cliCheck.succeed()
} catch (e) {
  cliCheck.fail(
    "The Auth0 CLI must be installed: https://github.com/auth0/auth0-cli"
  )
  process.exit(1)
}

// NOTE: we're outputting as CSV here due to a bug in the Auth0 CLI that doesn't respect the --json flag
// https://github.com/auth0/auth0-cli/pull/1002
const { stdout: tenants } = await $`auth0 ${["tenants", "list", "--csv"]}`

const AUTH0_DOMAIN = tenants
  .split("\n")
  .slice(1)
  .find((line) => line.includes("→"))
  .split(",")[1]
  .trim()

// the client whose grant we're updating

const resolveClient = ora({
  text: `Resolving the ${MANAGEMENT_CLIENT_NAME} client`,
}).start()
let clientId
try {
  clientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID ?? (await readEnvLocal())

  // fall back to a lookup by name, for a checkout without a .env.local
  if (!clientId) {
    const { stdout } = await $`auth0 ${[
      "api",
      "get",
      `clients?fields=client_id,name&include_fields=true&per_page=100`,
    ]}`

    clientId = toArray(JSON.parse(stdout), "clients").find(
      (client) => client.name === MANAGEMENT_CLIENT_NAME
    )?.client_id
  }

  if (!clientId) {
    throw new Error(
      `Could not find a "${MANAGEMENT_CLIENT_NAME}" client. Set AUTH0_MANAGEMENT_CLIENT_ID or run "npm run auth0:bootstrap" first.`
    )
  }

  resolveClient.succeed(`Resolved the ${MANAGEMENT_CLIENT_NAME} client`)
} catch (e) {
  resolveClient.fail(`Failed to resolve the ${MANAGEMENT_CLIENT_NAME} client`)
  console.log(e.message ?? e)
  process.exit(1)
}

// the existing grant

const audience = `https://${AUTH0_DOMAIN}/api/v2/`

const readGrant = ora({ text: `Reading Management API Client Grant` }).start()
let grant
try {
  const { stdout } = await $`auth0 ${[
    "api",
    "get",
    `client-grants?client_id=${encodeURIComponent(
      clientId
    )}&audience=${encodeURIComponent(audience)}`,
  ]}`

  grant = toArray(JSON.parse(stdout), "client_grants")[0]

  if (!grant) {
    throw new Error(
      `No Management API grant exists for client ${clientId}. This tenant hasn't been bootstrapped — run "npm run auth0:bootstrap".`
    )
  }

  readGrant.succeed()
} catch (e) {
  readGrant.fail(`Failed to read Management API Client Grant`)
  console.log(e.message ?? e)
  console.log(LOGIN_HINT)
  process.exit(1)
}

// the delta

const existing = grant.scope ?? []
const missing = managementApiScopes.filter((scope) => !existing.includes(scope))

if (!missing.length) {
  ora(
    `Management API Client Grant is already up to date (${existing.length} scopes)`
  ).succeed()
  process.exit(0)
}

const updateGrant = ora({
  text: `Adding ${missing.length} scope(s) to the Management API Client Grant`,
}).start()
try {
  // prettier-ignore
  const updateGrantArgs = [
    "api", "patch", `client-grants/${grant.id}`,
    "--data", JSON.stringify({
      // union rather than replace: scopes granted for anything else in this tenant stay granted
      scope: [...existing, ...missing],
    }),
  ];

  await $`auth0 ${updateGrantArgs}`
  updateGrant.succeed(`Added: ${missing.join(", ")}`)
} catch (e) {
  updateGrant.fail(`Failed to update Management API Client Grant`)
  console.log(e)
  console.log(LOGIN_HINT)
  process.exit(1)
}

async function readEnvLocal() {
  try {
    const contents = await readFile(".env.local", { encoding: "utf8" })

    return contents
      .split("\n")
      .find((line) => line.trim().startsWith("AUTH0_MANAGEMENT_CLIENT_ID="))
      ?.split("=")
      .slice(1)
      .join("=")
      .trim()
  } catch {
    return undefined
  }
}

/**
 * Management API list endpoints return either a bare array or an `include_totals` envelope keyed by
 * the resource name, depending on the query. Accept both.
 */
function toArray(body, key) {
  if (Array.isArray(body)) {
    return body
  }

  return Array.isArray(body?.[key]) ? body[key] : []
}
