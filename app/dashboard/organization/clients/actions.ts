import { revalidatePath } from "next/cache"
import { Session } from "@auth0/nextjs-auth0"
import { ClientCreateAppTypeEnum } from "auth0"

import { managementClient } from "@/lib/auth0"
import { withServerActionAuth } from "@/lib/with-server-action-auth"

type CreateApiClientResult = 
  | { error: string }
  | { clientId: string; clientSecret: string }

export const createApiClient = withServerActionAuth(
  async function createApiClient(formData: FormData, session: Session): Promise<CreateApiClientResult> {
    const name = formData.get("name")
    const appType = formData.get("app_type")

    if (!name || typeof name !== "string") {
      return {
        error: "Client name is required.",
      }
    }

    if (!appType || typeof appType !== "string" || !isValidAppType(appType)) {
      return {
        error: "Application type is required and must be valid.",
      }
    }

    try {
      const newClient = await managementClient.clients.create({
        name,
        app_type: appType as ClientCreateAppTypeEnum,
        is_first_party: true,
      })

      revalidatePath("/dashboard/organization/api-clients")
      return { 
        clientId: newClient.client_id!, 
        clientSecret: newClient.client_secret! 
      }
    } catch (error) {
      console.error("Failed to create API client", error)
      return {
        error: "Failed to create API client.",
      }
    }
  },
  {
    role: "admin",
  }
)

function isValidAppType(appType: string): appType is ClientCreateAppTypeEnum {
  return ['native', 'spa', 'regular_web', 'non_interactive'].includes(appType)
}

export const deleteApiClient = withServerActionAuth(
  async function deleteApiClient(clientId: string, session: Session) {
    try {
      await managementClient.clients.delete({ client_id: clientId })

      revalidatePath("/dashboard/organization/api-clients")
    } catch (error) {
      console.error("Failed to delete API client", error)
      return {
        error: "Failed to delete API client.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)

export const updateApiClient = withServerActionAuth(
  async function updateApiClient(clientId: string, formData: FormData, session: Session) {
    const name = formData.get("name")
    const appType = formData.get("app_type")

    if (!name || typeof name !== "string") {
      return {
        error: "Client name is required.",
      }
    }

    if (!appType || typeof appType !== "string" || !["native", "spa", "regular_web", "non_interactive"].includes(appType)) {
      return {
        error: "Application type is required and must be valid.",
      }
    }

    try {
      await managementClient.clients.update(
        { client_id: clientId },
        {
          name,
          app_type: appType,
        }
      )

      revalidatePath("/dashboard/organization/api-clients")
    } catch (error) {
      console.error("Failed to update API client", error)
      return {
        error: "Failed to update API client.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)

export const rotateApiClientSecret = withServerActionAuth(
  async function rotateApiClientSecret(clientId: string, session: Session) {
    try {
      const result = await managementClient.clients.rotateSecret({ client_id: clientId })

      revalidatePath("/dashboard/organization/api-clients")
      return { clientSecret: result.client_secret }
    } catch (error) {
      console.error("Failed to rotate API client secret", error)
      return {
        error: "Failed to rotate API client secret.",
      }
    }
  },
  {
    role: "admin",
  }
)