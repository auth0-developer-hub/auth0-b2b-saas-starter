import { randomBytes } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"
import { $ } from "execa"
import ora from "ora"

const APP_BASE_URL = "http://localhost:3000"
const MANAGEMENT_CLIENT_NAME = "SaaStart Management"
const DASHBOARD_CLIENT_NAME = "SaaStart Dashboard"
const DEFAULT_CONNECTION_NAME = "SaaStart-Shared-Database"
const CUSTOM_CLAIMS_NAMESPACE = "https://example.com"

// checks

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
const tenantSettingsArgs = ["tenants", "list", "--csv"]

const { stdout } = await $`auth0 ${tenantSettingsArgs}`

// parse the CSV to get the current active tenant (skip the first line)
// and get the one that starts with the "→" symbol
const AUTH0_DOMAIN = stdout
  .split("\n")
  .slice(1)
  .find((line) => line.includes("→"))
  .split(",")[1]
  .trim()

// tenant settings

const tenantSettings = ora({
  text: `Initialize tenant settings`,
}).start()
try {
  // prettier-ignore
  const tenantSettingsArgs = [
    "api", "patch", "tenants/settings",
    "--data", JSON.stringify({
      "customize_mfa_in_postlogin_action": true,
      "flags": { "enable_client_connections": false },
      "friendly_name": "SaaStart",
      "picture_url": "https://cdn.auth0.com/blog/auth0_by_okta_logo_black.png",
    }),
  ];

  await $`auth0 ${tenantSettingsArgs}`
  tenantSettings.succeed()
} catch (e) {
  tenantSettings.fail(`Failed to initialize tenant settings`)
  console.log(e)
  process.exit(1)
}

// prompt settings

const promptSettings = ora({
  text: `Configuring prompt settings`,
}).start()
try {
  // prettier-ignore
  const promptSettingsArgs = [
    "api", "patch", "prompts",
    "--data", JSON.stringify({
      "identifier_first": true,
    }),
  ];

  await $`auth0 ${promptSettingsArgs}`
  promptSettings.succeed()
} catch (e) {
  promptSettings.fail(`Failed to configure prompt settings`)
  console.log(e)
  process.exit(1)
}

// clients

const createManagementClient = ora({
  text: `Creating ${MANAGEMENT_CLIENT_NAME} client`,
}).start()
let managementClient
try {
  // prettier-ignore
  const createClientArgs = [
    "apps", "create",
    "--name", MANAGEMENT_CLIENT_NAME,
    "--description", "The SaaStart client to manage tenant resources and facilitate account creation.",
    "--callbacks", `${APP_BASE_URL}/onboarding/callback`,
    "--logout-urls", APP_BASE_URL,
    "--type", "regular",
    "--reveal-secrets", "--json", "--no-input"
  ];

  const { stdout } = await $`auth0 ${createClientArgs}`
  managementClient = JSON.parse(stdout)
  createManagementClient.succeed()
} catch (e) {
  createManagementClient.fail(
    `Failed to create the ${MANAGEMENT_CLIENT_NAME} client`
  )
  console.log(e)
  process.exit(1)
}

const createClientGrant = ora({
  text: `Creating Management API Client Grant`,
}).start()
try {
  // prettier-ignore
  const createClientGrantArgs = [
    "api", "post", "client-grants",
    "--data", JSON.stringify({
      client_id: managementClient.client_id,
      audience: `https://${AUTH0_DOMAIN}/api/v2/`,
      scope: [
        // Users
        "read:users",
        "update:users",
        "delete:users",
        "create:users",
        // Connections
        "read:connections",
        "update:connections",
        "delete:connections",
        "create:connections",
        // Organizations
        "read:organizations_summary",
        "read:organizations",
        "update:organizations",
        "create:organizations",
        "delete:organizations",
        "create:organization_members",
        "read:organization_members",
        "delete:organization_members",
        "create:organization_connections",
        "read:organization_connections",
        "update:organization_connections",
        "delete:organization_connections",
        "create:organization_member_roles",
        "read:organization_member_roles",
        "delete:organization_member_roles",
        "create:organization_invitations",
        "read:organization_invitations",
        "delete:organization_invitations",
        // MFA Enrollment
        "read:guardian_factors",
        "read:authentication_methods",
        "delete:authentication_methods",
        "create:guardian_enrollment_tickets",
        // SCIM
        "create:scim_token",
        "read:scim_token",
        "delete:scim_token",
        "read:scim_config",
        "create:scim_config",
        "update:scim_config",
        "delete:scim_config",
      ]
    }),
  ];

  await $`auth0 ${createClientGrantArgs}`
  createClientGrant.succeed()
} catch (e) {
  createClientGrant.fail(`Failed to create Management API Client Grant`)
  console.log(e)
  process.exit(1)
}

const createDashboardClient = ora({
  text: `Creating ${DASHBOARD_CLIENT_NAME} client`,
}).start()
let dashboardClient
try {
  // prettier-ignore
  const createClientArgs = [
    "api", "post", "clients",
    "--data", JSON.stringify({
      "name": DASHBOARD_CLIENT_NAME,
      "description": "The client to facilitate login to the dashboard in the context of an organization.",
      "callbacks": [`${APP_BASE_URL}/api/auth/callback`],
      "allowed_logout_urls": [APP_BASE_URL],
      "initiate_login_uri": "https://example.com/api/auth/login",
      "app_type": "regular_web",
      "oidc_conformant": true,
      "grant_types": ["authorization_code","refresh_token"],
      "organization_require_behavior": "post_login_prompt",
      "organization_usage": "require",
      "jwt_configuration": {
        "alg": "RS256",
        "lifetime_in_seconds": 36000,
        "secret_encoded": false
      },
    }),
  ];

  const { stdout } = await $`auth0 ${createClientArgs}`
  dashboardClient = JSON.parse(stdout)
  createDashboardClient.succeed()
} catch (e) {
  createDashboardClient.fail(
    `Failed to create the ${DASHBOARD_CLIENT_NAME} client`
  )
  console.log(e)
  process.exit(1)
}

// connections

const createDatabaseConnection = ora({
  text: `Creating ${DEFAULT_CONNECTION_NAME} connection`,
}).start()
let defaultConnection
try {
  // prettier-ignore
  const createConnectionArgs = [
    "api", "post", "connections",
    "--data", JSON.stringify({
      strategy: "auth0",
      name: DEFAULT_CONNECTION_NAME,
      display_name: "SaaStart",
      enabled_clients: [dashboardClient.client_id, managementClient.client_id],
    }),
  ];

  const { stdout } = await $`auth0 ${createConnectionArgs}`
  defaultConnection = JSON.parse(stdout)
  createDatabaseConnection.succeed()
} catch (e) {
  createDatabaseConnection.fail(
    `Failed to create the ${DEFAULT_CONNECTION_NAME} connection`
  )
  console.log(e)
  process.exit(1)
}

// roles

const createAdminRole = ora({
  text: `Creating admin role`,
}).start()
let adminRole
try {
  // prettier-ignore
  const createRoleArgs = [
    "roles", "create",
    "--name", "admin",
    "--description", "Manage the organization's configuration.",
    "--json", "--no-input"
  ];

  const { stdout } = await $`auth0 ${createRoleArgs}`
  adminRole = JSON.parse(stdout)
  createAdminRole.succeed()
} catch (e) {
  createAdminRole.fail(`Failed to create the admin role`)
  console.log(e)
  process.exit(1)
}

const createMemberRole = ora({
  text: `Creating member role`,
}).start()
let memberRole
try {
  // prettier-ignore
  const createRoleArgs = [
    "roles", "create",
    "--name", "member",
    "--description", "Member of an organization.",
    "--json", "--no-input"
  ];

  const { stdout } = await $`auth0 ${createRoleArgs}`
  memberRole = JSON.parse(stdout)
  createMemberRole.succeed()
} catch (e) {
  createMemberRole.fail(`Failed to create the member role`)
  console.log(e)
  process.exit(1)
}

// actions

const createSecurityPoliesAction = ora({
  text: `Creating Security Policies Action`,
}).start()
let securityPoliciesAction
try {
  const code = await readFile("./actions/security-policies.js", {
    encoding: "utf-8",
  })

  // prettier-ignore
  const createActionArgs = [
    "actions", "create",
    "--name", "Security Policies",
    "--code", code,
    "--trigger", "post-login",
    "--secret", `DASHBOARD_CLIENT_ID=${dashboardClient.client_id}`,
    "--json", "--no-input"
  ];

  const { stdout } = await $`auth0 ${createActionArgs}`
  securityPoliciesAction = JSON.parse(stdout)

  await waitUntilActionIsBuilt(securityPoliciesAction.id)

  // prettier-ignore
  const deployActionArgs = [
    "actions", "deploy", securityPoliciesAction.id,
    "--json", "--no-input"
  ];
  await $`auth0 ${deployActionArgs}`

  createSecurityPoliesAction.succeed()
} catch (e) {
  createSecurityPoliesAction.fail(
    `Failed to create the Security Policies Action`
  )
  console.log(e)
  process.exit(1)
}

const createAddDefaultRoleAction = ora({
  text: `Creating Add Default Role Action`,
}).start()
let addDefaultRoleAction
try {
  const code = await readFile("./actions/add-default-role.js", {
    encoding: "utf-8",
  })

  // prettier-ignore
  const createActionArgs = [
    "actions", "create",
    "--name", "Add Default Role",
    "--code", code,
    "--trigger", "post-login",
    "--secret", `DOMAIN=${AUTH0_DOMAIN}`,
    "--secret", `CLIENT_ID=${managementClient.client_id}`,
    "--secret", `CLIENT_SECRET=${managementClient.client_secret}`,
    "--secret", `MEMBER_ROLE_ID=${memberRole.id}`,
    "--dependency", "auth0=4.4.0",
    "--json", "--no-input"
  ];

  const { stdout } = await $`auth0 ${createActionArgs}`
  addDefaultRoleAction = JSON.parse(stdout)

  await waitUntilActionIsBuilt(addDefaultRoleAction.id)

  // prettier-ignore
  const deployActionArgs = [
    "actions", "deploy", addDefaultRoleAction.id,
    "--json", "--no-input"
  ];
  await $`auth0 ${deployActionArgs}`
  createAddDefaultRoleAction.succeed()
} catch (e) {
  createAddDefaultRoleAction.fail(
    `Failed to create the Add Default Role Action`
  )
  console.log(e)
  process.exit(1)
}

const createAddRoleToTokensAction = ora({
  text: `Creating Add Role to Tokens Action`,
}).start()
let addRoleToTokensAction
try {
  const code = await readFile("./actions/add-role-to-tokens.js", {
    encoding: "utf-8",
  })

  // prettier-ignore
  const createActionArgs = [
    "actions", "create",
    "--name", "Add Role to Tokens",
    "--code", code,
    "--trigger", "post-login",
    "--secret", `CUSTOM_CLAIMS_NAMESPACE=${CUSTOM_CLAIMS_NAMESPACE}`,
    "--json", "--no-input"
  ];

  const { stdout } = await $`auth0 ${createActionArgs}`
  addRoleToTokensAction = JSON.parse(stdout)

  await waitUntilActionIsBuilt(addRoleToTokensAction.id)

  // prettier-ignore
  const deployActionArgs = [
    "actions", "deploy", addRoleToTokensAction.id,
    "--json", "--no-input"
  ];
  await $`auth0 ${deployActionArgs}`

  createAddRoleToTokensAction.succeed()
} catch (e) {
  createAddRoleToTokensAction.fail(
    `Failed to create the Add Role to Tokens Action`
  )
  console.log(e)
  process.exit(1)
}

const updateTriggerBindings = ora({
  text: `Updating trigger bindings for Actions`,
}).start()
try {
  // prettier-ignore
  const updateTriggerBindingsArgs = [
    "api", "patch", "actions/triggers/post-login/bindings",
    "--data", JSON.stringify({
      "bindings": [
        {
          "ref": {
            "type": "action_name",
            "value": addDefaultRoleAction.name
          },
          display_name: addDefaultRoleAction.name
        },
        {
          "ref": {
            "type": "action_name",
            "value": addRoleToTokensAction.name
          },
          display_name: addRoleToTokensAction.name
        },
        {
          "ref": {
            "type": "action_name",
            "value": securityPoliciesAction.name
          },
          display_name: securityPoliciesAction.name
        }
      ]
    }),
  ];

  await $`auth0 ${updateTriggerBindingsArgs}`
  updateTriggerBindings.succeed()
} catch (e) {
  updateTriggerBindings.fail(`Failed to update trigger bindings for Actions`)
  console.log(e)
  process.exit(1)
}

const writeEnvVars = ora({
  text: `Saving environment variables to .env.local`,
}).start()
try {
  await writeFile(
    ".env.local",
    `
APP_BASE_URL=${APP_BASE_URL}

# Global Auth0 SDK configuration
NEXT_PUBLIC_AUTH0_DOMAIN=${AUTH0_DOMAIN}
AUTH0_MANAGEMENT_API_DOMAIN=${AUTH0_DOMAIN}
SESSION_ENCRYPTION_SECRET=${randomBytes(32).toString("hex")}

# Client ID and secret for the application within the context of an organization
AUTH0_CLIENT_ID=${dashboardClient.client_id}
AUTH0_CLIENT_SECRET=${dashboardClient.client_secret}

# Client ID and secret for the application used to allow a user to manage organizations
AUTH0_MANAGEMENT_CLIENT_ID=${managementClient.client_id}
AUTH0_MANAGEMENT_CLIENT_SECRET=${managementClient.client_secret}

# Roles assigned to the members of an organization
AUTH0_ADMIN_ROLE_ID=${adminRole.id}
AUTH0_MEMBER_ROLE_ID=${memberRole.id}

# The default connection ID users will use to create an account with during onboarding
DEFAULT_CONNECTION_ID=${defaultConnection.id}

# The namespace used to prefix custom claims
CUSTOM_CLAIMS_NAMESPACE=${CUSTOM_CLAIMS_NAMESPACE}
  `.trim()
  )

  writeEnvVars.succeed()
} catch (e) {
  writeEnvVars.fail(`Failed to save environment variables to .env.local file`)
  console.log(e)
  process.exit(1)
}

// universal login theme

const createUniversalLoginTheme = ora({
  text: `Creating theme for Universal Login`,
}).start()

try {
  const theme = await readFile("./themes/universal-login.json", {
    encoding: "utf-8",
  })

  // prettier-ignore
  const createUniversalLoginThemeArgs = [
    "api", "post", "branding/themes",
    "--data", theme,
  ];

  await $`auth0 ${createUniversalLoginThemeArgs}`

  createUniversalLoginTheme.succeed()
} catch (e) {
  createUniversalLoginTheme.fail(`Failed to create theme for Universal Login`)
  console.log(e)
  process.exit(1)
}

// email templates

const createVerifyEmailTemplate = ora({
  text: `Create email verification template`,
}).start()
try {
  // prettier-ignore
  const createVerifyEmailTemplateArgs = [
    "api", "post", "email-templates",
    "--data", JSON.stringify({
        "template": "verify_email",
        "syntax": "liquid",
        "body": `<html>\n  <head>\n    <style type=\"text/css\">\n      .ExternalClass,.ExternalClass div,.ExternalClass font,.ExternalClass p,.ExternalClass span,.ExternalClass td,img {line-height: 100%;}#outlook a {padding: 0;}.ExternalClass,.ReadMsgBody {width: 100%;}a,blockquote,body,li,p,table,td {-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;}table,td {mso-table-lspace: 0;mso-table-rspace: 0;}img {-ms-interpolation-mode: bicubic;border: 0;height: auto;outline: 0;text-decoration: none;}table {border-collapse: collapse !important;}#bodyCell,#bodyTable,body {height: 100% !important;margin: 0;padding: 0;font-family: ProximaNova, sans-serif;}#bodyCell {padding: 20px;}#bodyTable {width: 600px;}@font-face {font-family: ProximaNova;src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-regular-webfont-webfont.eot);src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-regular-webfont-webfont.eot?#iefix)format(\"embedded-opentype\"),url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-regular-webfont-webfont.woff) format(\"woff\");font-weight: 400;font-style: normal;}@font-face {font-family: ProximaNova;src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-semibold-webfont-webfont.eot);src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-semibold-webfont-webfont.eot?#iefix)format(\"embedded-opentype\"),url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-semibold-webfont-webfont.woff) format(\"woff\");font-weight: 600;font-style: normal;}@media only screen and (max-width: 480px) {#bodyTable,body {width: 100% !important;}a,blockquote,body,li,p,table,td {-webkit-text-size-adjust: none !important;}body {min-width: 100% !important;}#bodyTable {max-width: 600px !important;}#signIn {max-width: 280px !important;}}\n    </style>\n  </head>\n  <body>\n    <center>\n      <table\n        style='width: 600px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;margin: 0;padding: 0;font-family: \"ProximaNova\", sans-serif;border-collapse: collapse !important;height: 100% !important;'\n        align=\"center\"\n        border=\"0\"\n        cellpadding=\"0\"\n        cellspacing=\"0\"\n        height=\"100%\"\n        width=\"100%\"\n        id=\"bodyTable\"\n      >\n        <tr>\n          <td\n            align=\"center\"\n            valign=\"top\"\n            id=\"bodyCell\"\n            style='-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;margin: 0;padding: 20px;font-family: \"ProximaNova\", sans-serif;height: 100% !important;'\n          >\n            <div class=\"main\">\n              <p\n                style=\"text-align: center;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%; margin-bottom: 30px;\"\n              >\n                <img\n                  src=\"https://cdn.auth0.com/styleguide/2.0.9/lib/logos/img/badge.png\"\n                  width=\"50\"\n                  alt=\"Your logo goes here\"\n                  style=\"-ms-interpolation-mode: bicubic;border: 0;height: auto;line-height: 100%;outline: none;text-decoration: none;\"\n                />\n              </p>\n\n              <h1>Welcome to {{ application.name}}!</h1>\n\n              <p>Thank you for signing up. Please verify your email address by clicking the following link:</p>\n\n              <p><a href=\"{{ url }}\">Confirm my account</a></p>\n\n              <p>\n                If you are having any issues with your account, please don’t hesitate to contact us by replying to\n                this mail.\n              </p>\n\n              <br />\n              Thanks!\n              <br />\n\n              <strong>{{ application.name }}</strong>\n\n              <br /><br />\n              <hr style=\"border: 2px solid #EAEEF3; border-bottom: 0; margin: 20px 0;\" />\n              <p style=\"text-align: center;color: #A9B3BC;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;\">\n                If you did not make this request, please contact us by replying to this mail.\n              </p>\n            </div>\n          </td>\n        </tr>\n      </table>\n    </center>\n  </body>\n</html>`,
        "from": "",
        "subject": "",
        "resultUrl": `{{ application.callback_domain }}/onboarding/create`,
        "urlLifetimeInSeconds": 432000,
        "enabled": true
    }),
  ];

  await $`auth0 ${createVerifyEmailTemplateArgs}`
  createVerifyEmailTemplate.succeed()
} catch (e) {
  createVerifyEmailTemplate.fail(`Failed to create email verification template`)
  console.log(e)
  process.exit(1)
}

// MFA

const enableWebAuthNRoaming = ora({
  text: `Enabling webauthn-roaming MFA factor`,
}).start()
try {
  // prettier-ignore
  const enableWebAuthNRoamingArgs = [
    "api", "put", "guardian/factors/webauthn-roaming",
    "--data", JSON.stringify({
      "enabled": true
    }),
  ];

  await $`auth0 ${enableWebAuthNRoamingArgs}`
  enableWebAuthNRoaming.succeed()
} catch (e) {
  enableWebAuthNRoaming.fail(`Failed to enable webauthn-roaming MFA factor`)
  console.log(e)
  process.exit(1)
}

const enableOtp = ora({
  text: `Enabling OTP MFA factor`,
}).start()
try {
  // prettier-ignore
  const enableOtpArgs = [
    "api", "put", "guardian/factors/otp",
    "--data", JSON.stringify({
      "enabled": true
    }),
  ];

  await $`auth0 ${enableOtpArgs}`
  enableOtp.succeed()
} catch (e) {
  enableOtp.fail(`Failed to enable OTP MFA factor`)
  console.log(e)
  process.exit(1)
}

async function waitUntilActionIsBuilt(actionId) {
  while (true) {
    const { stdout } = await $`auth0 actions show ${actionId} --json`
    const action = JSON.parse(stdout)
    if (action.status === "built") {
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }
}
