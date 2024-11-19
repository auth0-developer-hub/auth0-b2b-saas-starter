"use server"

import { revalidatePath } from "next/cache"
import { Session } from "@auth0/nextjs-auth0"

import { managementClient } from "@/lib/auth0"
import { Client } from "@/lib/clients"
import { withServerActionAuth } from "@/lib/with-server-action-auth"

interface CreateApiClientError {
  error: string
}
export interface CreateApiClientSuccess {
  clientId: string
  clientSecret: string
}

export const createApiClient = withServerActionAuth(
  async function createApiClient(formData: FormData, _: Session) {
    const name = formData.get("name") as Client["name"]
    const app_type = formData.get("app_type") as Client["app_type"]

    if (!name) {
      return {
        error: "Client name is required.",
      } as CreateApiClientError
    }

    if (!app_type) {
      return {
        error: "Application type is required.",
      } as CreateApiClientError
    }

    try {
      const { data: newClient } = await managementClient.clients.create({
        name,
        app_type,
        is_first_party: true,
      })

      revalidatePath("/dashboard/organization/api-clients")
      return {
        clientId: newClient.client_id,
        clientSecret: newClient.client_secret,
      } as CreateApiClientSuccess
    } catch (error) {
      console.error("Failed to create API client", error)
      return {
        error: "Failed to create API client.",
      } as CreateApiClientError
    }
  },
  {
    role: "admin",
  }
)

export const deleteApiClient = withServerActionAuth(
  async function deleteApiClient(client_id: string, _: Session) {
    try {
      await managementClient.clients.delete({ client_id })

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
  async function updateApiClient(
    clientId: string,
    formData: FormData,
    _: Session
  ) {
    const name = formData.get("name") as Client["name"]
    const app_type = formData.get("app_type") as Client["app_type"]

    if (!name) {
      return {
        error: "Client name is required.",
      }
    }

    if (!app_type) {
      return {
        error: "Application type is required.",
      }
    }

    try {
      await managementClient.clients.update(
        { client_id: clientId },
        {
          name,
          app_type,
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
  async function rotateApiClientSecret(client_id: string, _: Session) {
    try {
      const { data: result } =
        await managementClient.clients.rotateClientSecret({
          client_id,
        })

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
