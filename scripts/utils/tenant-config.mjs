import { $ } from "execa"
import ora from "ora"

import { auth0ApiCall } from "./auth0-api.mjs"

/**
 * Configure tenant settings - always updates to ensure correct configuration
 */
export async function configureTenantSettings() {
  const spinner = ora({
    text: `Configuring tenant settings`,
  }).start()

  try {
    // Get current settings to compare
    const current = await auth0ApiCall("get", "tenants/settings")

    const desiredSettings = {
      customize_mfa_in_postlogin_action: true,
      flags: { enable_client_connections: false },
      friendly_name: "SaaStart",
      picture_url: "https://cdn.auth0.com/blog/auth0_by_okta_logo_black.png",
    }

    const needsUpdate =
      current?.customize_mfa_in_postlogin_action !==
        desiredSettings.customize_mfa_in_postlogin_action ||
      current?.flags?.enable_client_connections !==
        desiredSettings.flags.enable_client_connections ||
      current?.friendly_name !== desiredSettings.friendly_name ||
      current?.picture_url !== desiredSettings.picture_url

    if (needsUpdate) {
      // prettier-ignore
      const tenantSettingsArgs = [
        "api", "patch", "tenants/settings",
        "--data", JSON.stringify(desiredSettings),
      ];

      await $`auth0 ${tenantSettingsArgs}`
      spinner.succeed("Updated tenant settings")
    } else {
      spinner.succeed("Tenant settings are up to date")
    }
  } catch (e) {
    spinner.fail(`Failed to configure tenant settings`)
    throw e
  }
}

/**
 * Configure prompt settings - always updates to ensure correct configuration
 */
export async function configurePromptSettings() {
  const spinner = ora({
    text: `Configuring prompt settings`,
  }).start()

  try {
    // Get current prompt settings
    const current = await auth0ApiCall("get", "prompts")

    const needsUpdate = current?.identifier_first !== true

    if (needsUpdate) {
      // prettier-ignore
      const promptSettingsArgs = [
        "api", "patch", "prompts",
        "--data", JSON.stringify({
          "identifier_first": true,
        }),
      ];

      await $`auth0 ${promptSettingsArgs}`
      spinner.succeed("Updated prompt settings")
    } else {
      spinner.succeed("Prompt settings are up to date")
    }
  } catch (e) {
    spinner.fail(`Failed to configure prompt settings`)
    throw e
  }
}

/**
 * Configure Email Templates - checks if template exists before creating
 */
export async function configureEmailTemplates() {
  const spinner = ora({
    text: `Configuring email verification template`,
  }).start()

  try {
    // Check if template already exists
    const existing = await auth0ApiCall("get", "email-templates/verify_email")

    if (existing && existing.template === "verify_email") {
      spinner.succeed("Email verification template already configured")
      return
    }

    // prettier-ignore
    const createVerifyEmailTemplateArgs = [
      "api", "post", "email-templates",
      "--data", JSON.stringify({
          "template": "verify_email",
          "syntax": "liquid",
          "body": `<html>\n  <head>\n    <style type=\"text/css\">\n      .ExternalClass,.ExternalClass div,.ExternalClass font,.ExternalClass p,.ExternalClass span,.ExternalClass td,img {line-height: 100%;}#outlook a {padding: 0;}.ExternalClass,.ReadMsgBody {width: 100%;}a,blockquote,body,li,p,table,td {-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;}table,td {mso-table-lspace: 0;mso-table-rspace: 0;}img {-ms-interpolation-mode: bicubic;border: 0;height: auto;outline: 0;text-decoration: none;}table {border-collapse: collapse !important;}#bodyCell,#bodyTable,body {height: 100% !important;margin: 0;padding: 0;font-family: ProximaNova, sans-serif;}#bodyCell {padding: 20px;}#bodyTable {width: 600px;}@font-face {font-family: ProximaNova;src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-regular-webfont-webfont.eot);src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-regular-webfont-webfont.eot?#iefix)format(\"embedded-opentype\"),url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-regular-webfont-webfont.woff) format(\"woff\");font-weight: 400;font-style: normal;}@font-face {font-family: ProximaNova;src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-semibold-webfont-webfont.eot);src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-semibold-webfont-webfont.eot?#iefix)format(\"embedded-opentype\"),url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-semibold-webfont-webfont.woff) format(\"woff\");font-weight: 600;font-style: normal;}@media only screen and (max-width: 480px) {#bodyTable,body {width: 100% !important;}a,blockquote,body,li,p,table,td {-webkit-text-size-adjust: none !important;}body {min-width: 100% !important;}#bodyTable {max-width: 600px !important;}#signIn {max-width: 280px !important;}}\n    </style>\n  </head>\n  <body>\n    <center>\n      <table\n        style='width: 600px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;margin: 0;padding: 0;font-family: \"ProximaNova\", sans-serif;border-collapse: collapse !important;height: 100% !important;'\n        align=\"center\"\n        border=\"0\"\n        cellpadding=\"0\"\n        cellspacing=\"0\"\n        height=\"100%\"\n        width=\"100%\"\n        id=\"bodyTable\"\n      >\n        <tr>\n          <td\n            align=\"center\"\n            valign=\"top\"\n            id=\"bodyCell\"\n            style='-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;margin: 0;padding: 20px;font-family: \"ProximaNova\", sans-serif;height: 100% !important;'\n          >\n            <div class=\"main\">\n              <p\n                style=\"text-align: center;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%; margin-bottom: 30px;\"\n              >\n                <img\n                  src=\"https://cdn.auth0.com/styleguide/2.0.9/lib/logos/img/badge.png\"\n                  width=\"50\"\n                  alt=\"Your logo goes here\"\n                  style=\"-ms-interpolation-mode: bicubic;border: 0;height: auto;line-height: 100%;outline: none;text-decoration: none;\"\n                />\n              </p>\n\n              <h1>Welcome to {{ application.name}}!</h1>\n\n              <p>Thank you for signing up. Please verify your email address by clicking the following link:</p>\n\n              <p><a href=\"{{ url }}\">Confirm my account</a></p>\n\n              <p>\n                If you are having any issues with your account, please don't hesitate to contact us by replying to\n                this mail.\n              </p>\n\n              <br />\n              Thanks!\n              <br />\n\n              <strong>{{ application.name }}</strong>\n\n              <br /><br />\n              <hr style=\"border: 2px solid #EAEEF3; border-bottom: 0; margin: 20px 0;\" />\n              <p style=\"text-align: center;color: #A9B3BC;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;\">\n                If you did not make this request, please contact us by replying to this mail.\n              </p>\n            </div>\n          </td>\n        </tr>\n      </table>\n    </center>\n  </body>\n</html>`,
          "from": "",
          "subject": "",
          "resultUrl": `{{ application.callback_domain }}/onboarding/create`,
          "urlLifetimeInSeconds": 432000,
          "enabled": true
      }),
    ];

    await $`auth0 ${createVerifyEmailTemplateArgs}`
    spinner.succeed("Created email verification template")
  } catch (e) {
    // Template creation might fail if it already exists
    if (e.message && e.message.includes("already exists")) {
      spinner.succeed("Email verification template already configured")
    } else {
      spinner.fail(`Failed to create email verification template`)
      throw e
    }
  }
}

/**
 * Enable MFA factors - checks current state before enabling
 */
export async function enableMFAFactors() {
  // WebAuthn Roaming
  const spinner1 = ora({
    text: `Configuring webauthn-roaming MFA factor`,
  }).start()

  try {
    // Check current state
    const current = await auth0ApiCall(
      "get",
      "guardian/factors/webauthn-roaming"
    )

    if (current?.enabled === true) {
      spinner1.succeed("WebAuthn-roaming MFA factor already enabled")
    } else {
      // prettier-ignore
      const enableWebAuthNRoamingArgs = [
        "api", "put", "guardian/factors/webauthn-roaming",
        "--data", JSON.stringify({
          "enabled": true
        }),
      ];

      await $`auth0 ${enableWebAuthNRoamingArgs}`
      spinner1.succeed("Enabled webauthn-roaming MFA factor")
    }
  } catch (e) {
    spinner1.fail(`Failed to enable webauthn-roaming MFA factor`)
    throw e
  }

  // OTP
  const spinner2 = ora({
    text: `Configuring OTP MFA factor`,
  }).start()

  try {
    // Check current state
    const current = await auth0ApiCall("get", "guardian/factors/otp")

    if (current?.enabled === true) {
      spinner2.succeed("OTP MFA factor already enabled")
    } else {
      // prettier-ignore
      const enableOtpArgs = [
        "api", "put", "guardian/factors/otp",
        "--data", JSON.stringify({
          "enabled": true
        }),
      ];

      await $`auth0 ${enableOtpArgs}`
      spinner2.succeed("Enabled OTP MFA factor")
    }
  } catch (e) {
    spinner2.fail(`Failed to enable OTP MFA factor`)
    throw e
  }
}
