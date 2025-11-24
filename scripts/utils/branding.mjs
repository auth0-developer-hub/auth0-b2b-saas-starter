import { readFileSync } from "fs"
import { $ } from "execa"
import ora from "ora"

import { ChangeAction, createChangeItem } from "./change-plan.mjs"

// ============================================================================
// CHECK FUNCTIONS - Determine what changes are needed
// ============================================================================

/**
 * Check if Branding needs changes
 * Compares theme file with current branding
 */
export async function checkBrandingChanges() {
  try {
    // Read desired theme
    const themeData = readFileSync("./themes/universal-login.json", "utf8")
    const desiredTheme = JSON.parse(themeData)

    // Get current branding theme
    const { stdout } = await $`auth0 api get branding/themes/default`
    const currentTheme = JSON.parse(stdout)

    // Helper to do deep comparison ignoring key order
    const deepEqual = (obj1, obj2) => {
      if (obj1 === obj2) return true
      if (!obj1 || !obj2) return false
      if (typeof obj1 !== "object" || typeof obj2 !== "object")
        return obj1 === obj2

      const keys1 = Object.keys(obj1).sort()
      const keys2 = Object.keys(obj2).sort()

      if (keys1.length !== keys2.length) return false
      if (keys1.join(",") !== keys2.join(",")) return false

      return keys1.every((key) => deepEqual(obj1[key], obj2[key]))
    }

    const colorsMatch = deepEqual(currentTheme.colors, desiredTheme.colors)
    const fontsMatch = deepEqual(currentTheme.fonts, desiredTheme.fonts)

    if (colorsMatch && fontsMatch) {
      return createChangeItem(ChangeAction.SKIP, {
        resource: "Branding",
        summary: "Universal Login theme already up-to-date",
        existing: currentTheme,
      })
    }

    return createChangeItem(ChangeAction.UPDATE, {
      resource: "Branding",
      summary: "Update Universal Login theme",
      existing: currentTheme,
    })
  } catch (e) {
    // If we can't fetch current theme (404), we need to create one
    if (e.message && e.message.includes("404")) {
      return createChangeItem(ChangeAction.CREATE, {
        resource: "Branding",
        summary: "Create Universal Login theme",
      })
    }

    // Other errors - log warning and try to update anyway
    console.warn(
      `⚠️  Warning: Could not check current branding theme: ${e.message}`
    )
    return createChangeItem(ChangeAction.UPDATE, {
      resource: "Branding",
      summary: "Update Universal Login theme (couldn't verify current)",
    })
  }
}

// ============================================================================
// APPLY FUNCTIONS - Execute changes based on cached plan
// ============================================================================

/**
 * Apply Branding changes
 * Note: Will not fail the entire bootstrap if this fails
 */
export async function applyBrandingChanges(changePlan) {
  if (changePlan.action === ChangeAction.SKIP) {
    const spinner = ora({
      text: `Universal Login theme is up to date`,
    }).start()
    spinner.succeed()
    return
  }

  const spinner = ora({
    text: `Configuring Universal Login theme`,
  }).start()

  try {
    const themeData = readFileSync("./themes/universal-login.json", "utf8")

    if (changePlan.action === ChangeAction.CREATE) {
      // Create a new theme
      // prettier-ignore
      const createBrandingThemeArgs = [
        "api", "post", "branding/themes",
        "--data", themeData,
      ];

      await $`auth0 ${createBrandingThemeArgs}`
      spinner.succeed("Created Universal Login theme")
    } else {
      // UPDATE: Patch the existing theme using its ID
      // prettier-ignore
      const updateBrandingThemeArgs = [
        "api", "patch", `branding/themes/${changePlan.existing.themeId}`,
        "--data", themeData,
      ];

      await $`auth0 ${updateBrandingThemeArgs}`
      spinner.succeed("Updated Universal Login theme")
    }
  } catch (e) {
    // Branding is best effort - don't fail the entire bootstrap if this fails
    spinner.warn(`Failed to configure branding (non-critical): ${e.message}`)
  }
}
