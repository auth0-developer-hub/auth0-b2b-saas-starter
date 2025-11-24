import ora from "ora"

import { auth0ApiCall } from "./auth0-api.mjs"
import { ChangeAction, createChangeItem } from "./change-plan.mjs"

// Constants
export const USER_ATTRIBUTE_PROFILE_NAME = "SaaStart User Attribute Profile"

// ============================================================================
// CHECK FUNCTIONS - Determine what changes are needed
// ============================================================================

/**
 * Check if User Attribute Profile needs changes
 */
export function checkUserAttributeProfileChanges(
  existingUserAttributeProfiles
) {
  const existingProfile = existingUserAttributeProfiles.find(
    (uap) => uap.name === USER_ATTRIBUTE_PROFILE_NAME
  )

  if (!existingProfile) {
    return createChangeItem(ChangeAction.CREATE, {
      resource: "User Attribute Profile",
      name: USER_ATTRIBUTE_PROFILE_NAME,
    })
  }

  return createChangeItem(ChangeAction.SKIP, {
    resource: "User Attribute Profile",
    name: USER_ATTRIBUTE_PROFILE_NAME,
    existing: existingProfile,
  })
}

// ============================================================================
// APPLY FUNCTIONS - Execute changes based on cached plan
// ============================================================================

/**
 * Apply User Attribute Profile changes
 */
export async function applyUserAttributeProfileChanges(changePlan) {
  if (changePlan.action === ChangeAction.SKIP) {
    const spinner = ora({
      text: `User Attribute Profile is up to date: ${changePlan.name}`,
    }).start()
    spinner.succeed()
    return changePlan.existing
  }

  if (changePlan.action === ChangeAction.CREATE) {
    const spinner = ora({
      text: `Creating User Attribute Profile`,
    }).start()

    try {
      // First, get the template
      const templates = await auth0ApiCall(
        "get",
        "user-attribute-profiles/templates"
      )

      if (
        !templates ||
        !templates.user_attribute_profile_templates ||
        templates.user_attribute_profile_templates.length === 0
      ) {
        throw new Error("No user attribute profile templates available")
      }

      const templateWrapper = templates.user_attribute_profile_templates[0]
      const template = templateWrapper.template

      // Set the name
      template.name = USER_ATTRIBUTE_PROFILE_NAME

      // Create the profile
      const result = await auth0ApiCall(
        "post",
        "user-attribute-profiles",
        template
      )

      if (!result) {
        throw new Error("Failed to create user attribute profile")
      }

      spinner.succeed("Created User Attribute Profile")
      return result
    } catch (e) {
      spinner.fail(`Failed to create User Attribute Profile`)
      throw e
    }
  }
}
