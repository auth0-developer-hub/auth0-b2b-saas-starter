"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { appClient, managementClient } from "@/lib/auth0"

export async function updateDisplayName(formData: FormData) {
  const session = await appClient.getSession()

  if (!session) {
    return redirect("/api/auth/login")
  }

  const displayName = formData.get("display_name")

  if (!displayName || typeof displayName !== "string") {
    return {
      error: "Display name is required.",
    }
  }

  try {
    await managementClient.users.update(
      {
        id: session.user.sub,
      },
      {
        name: displayName,
      }
    )

    // update the cached local session to reflect the new display name across the app
    await appClient.updateSession({
      ...session,
      user: {
        ...session.user,
        name: displayName,
      },
    })
    revalidatePath("/", "layout")
  } catch (error) {
    console.error("failed to update display name", error)
    return {
      error: "Failed to update your display name.",
    }
  }

  return {}
}

export async function deleteAccount() {
  const session = await appClient.getSession()

  if (!session) {
    return redirect("/api/auth/login")
  }

  try {
    await managementClient.users.delete({
      id: session.user.sub,
    })

    return {}
  } catch (error) {
    console.error("failed to delete account", error)
    return {
      error: "Failed to delete your account.",
    }
  }
}
