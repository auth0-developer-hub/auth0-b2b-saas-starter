import { readFileSync } from "fs"
import { $ } from "execa"
import ora from "ora"

/**
 * Configure Universal Login branding
 * Best effort - will not fail the entire bootstrap if this fails
 */
export async function configureBranding() {
  const spinner = ora({
    text: `Configuring branding`,
  }).start()

  try {
    const themeData = readFileSync("./themes/universal-login.json", "utf8")

    // prettier-ignore
    const createBrandingThemeArgs = [
      "api", "post", "branding/themes/default",
      "--data", themeData,
    ];

    await $`auth0 ${createBrandingThemeArgs}`
    spinner.succeed()
  } catch (e) {
    // Branding is best effort - don't fail the entire bootstrap if this fails
    spinner.warn(`Failed to configure branding (non-critical): ${e.message}`)
  }
}
