import ora from "ora"

import { auth0ApiCall } from "./auth0-api.mjs"

// Constants
export const USER_ATTRIBUTE_PROFILE_NAME = "SaaStart User Attribute Profile"

/**
 * Create User Attribute Profile
 */
export async function ensureUserAttributeProfile(existing) {
  const existingProfile = existing.userAttributeProfiles.find(
    (uap) => uap.name === USER_ATTRIBUTE_PROFILE_NAME
  )

  if (existingProfile) {
    const spinner = ora({
      text: `Using existing User Attribute Profile: ${existingProfile.name}`,
    }).start()
    spinner.succeed()
    return existingProfile
  }

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

    spinner.succeed()
    return result
  } catch (e) {
    spinner.fail(`Failed to create User Attribute Profile`)
    throw e
  }
}
