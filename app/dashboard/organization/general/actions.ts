"use server"

import { revalidatePath } from "next/cache"
import { Session } from "@auth0/nextjs-auth0"

import { managementClient } from "@/lib/auth0"
import { withServerActionAuth } from "@/lib/with-server-action-auth"

export const updateDisplayName = withServerActionAuth(
  async function updateDisplayName(formData: FormData, session: Session) {
    const displayName = formData.get("display_name")

    if (!displayName || typeof displayName !== "string") {
      return {
        error: "Display name is required.",
      }
    }

    try {
      await managementClient.organizations.update(
        {
          id: session.user.org_id,
        },
        {
          display_name: displayName,
        }
      )

      revalidatePath("/", "layout")
    } catch (error) {
      console.error("failed to update organization display name", error)
      return {
        error: "Failed to update the organization's display name.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)
