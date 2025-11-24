import { writeFileSync } from "fs"
import ora from "ora"

/**
 * Write .env.local file with all required environment variables
 */
export async function writeEnvFile(
  domain,
  managementClientId,
  managementClientSecret,
  dashboardClientId,
  dashboardClientSecret,
  myOrgResourceServerId,
  connectionId
) {
  const spinner = ora({
    text: `Writing .env.local file`,
  }).start()

  try {
    const envContent = `# Auth0 Configuration
AUTH0_SECRET='${generateRandomSecret()}'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://${domain}'
AUTH0_CLIENT_ID='${dashboardClientId}'
AUTH0_CLIENT_SECRET='${dashboardClientSecret}'

# Organizations Configuration
NEXT_PUBLIC_ENABLE_ORGANIZATIONS=true

# Management API Configuration
AUTH0_MANAGEMENT_CLIENT_ID='${managementClientId}'
AUTH0_MANAGEMENT_CLIENT_SECRET='${managementClientSecret}'

# My Organization API Configuration
AUTH0_MYORG_RESOURCE_SERVER_ID='${myOrgResourceServerId}'

# Database Connection Configuration
AUTH0_DATABASE_CONNECTION_ID='${connectionId}'
`

    writeFileSync(".env.local", envContent)
    spinner.succeed()
  } catch (e) {
    spinner.fail(`Failed to write .env.local file`)
    throw e
  }
}

/**
 * Generate a random secret for AUTH0_SECRET
 */
function generateRandomSecret() {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0")
  ).join("")
}
