import dotenv from "dotenv"
import { $ } from "execa"
import ora from "ora"

/**
 * Check Node.js version
 */
export function checkNodeVersion() {
  if (process.version.replace("v", "").split(".")[0] < 20) {
    console.error(
      "❌ Node.js version 20 or later is required to run this script."
    )
    process.exit(1)
  }
}

/**
 * Check Auth0 CLI is installed
 */
export async function checkAuth0CLI() {
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
}

/**
 * Validate tenant configuration
 */
export async function validateTenant() {
  const spinner = ora({
    text: `Validating tenant configuration`,
  }).start()

  try {
    // Load .env.local if it exists (using dotenv)
    const envConfig = dotenv.config({ path: ".env.local" })
    const envDomain = envConfig.parsed?.AUTH0_MANAGEMENT_API_DOMAIN

    // Get current tenant from CLI
    // NOTE: we're outputting as CSV here due to a bug in the Auth0 CLI that doesn't respect the --json flag
    // https://github.com/auth0/auth0-cli/pull/1002
    const tenantSettingsArgs = ["tenants", "list", "--csv"]
    const { stdout } = await $`auth0 ${tenantSettingsArgs}`

    // parse the CSV to get the current active tenant (skip the first line)
    // and get the one that starts with the "→" symbol
    const cliDomain = stdout
      .split("\n")
      .slice(1)
      .find((line) => line.includes("→"))
      ?.split(",")[1]
      ?.trim()

    if (!cliDomain) {
      spinner.fail("No active tenant found in Auth0 CLI")
      console.error("\n❌ Please login to Auth0 CLI first:")
      console.error("   1. Run: auth0 login")
      console.error(
        "   2. If you have multiple tenants, run: auth0 tenants use <tenant-domain>"
      )
      console.error(
        "\nNote: If you're on a private cloud instance, you may need to pass --domain flag"
      )
      process.exit(1)
    }

    // If .env.local exists with a domain, verify it matches
    if (envDomain && envDomain !== cliDomain) {
      spinner.fail("Tenant mismatch detected")
      console.error(`\n❌ Tenant mismatch:`)
      console.error(`   .env.local has: ${envDomain}`)
      console.error(`   CLI is using:   ${cliDomain}`)
      console.error("\nPlease ensure you're using the correct tenant:")
      console.error(`   Run: auth0 tenants use ${envDomain}`)
      process.exit(1)
    }

    spinner.succeed(`Using tenant: ${cliDomain}`)
    return cliDomain
  } catch (e) {
    spinner.fail("Failed to validate tenant")
    console.error(e)
    process.exit(1)
  }
}
