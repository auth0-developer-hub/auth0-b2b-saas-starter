"use server"

import { revalidatePath } from "next/cache"
import { Session } from "@auth0/nextjs-auth0"

import { managementClient } from "@/lib/auth0"
import { withServerActionAuth } from "@/lib/with-server-action-auth"

const connStrategyToSlug: {
  [key: string]: string
} = {
  oidc: "oidc",
  samlp: "saml",
}

export const createScimConfig = withServerActionAuth(
  async function createScimConfig(connectionId: string, session: Session) {
    // ensure that the connection ID being updated is owned by the organization
    const { data: enabledConnection } =
      await managementClient.organizations.getEnabledConnection({
        id: session.user.org_id,
        connectionId: connectionId,
      })

    if (!enabledConnection) {
      return {
        error: "Connection not found.",
      }
    }

    try {
      await managementClient.connections.createScimConfiguration(
        { id: connectionId },
        {
          user_id_attribute: "externalId",
        }
      )

      revalidatePath(
        `/dashboard/organization/sso/${connStrategyToSlug[enabledConnection.connection.strategy]}/edit/${connectionId}/provisioning`
      )
    } catch (error) {
      console.error("failed to create a SCIM configuration", error)
      return {
        error: "Failed to create a SCIM configuration.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)

export const deleteScimConfig = withServerActionAuth(
  async function deleteScimConfig(connectionId: string, session: Session) {
    // ensure that the connection ID being updated is owned by the organization
    const { data: enabledConnection } =
      await managementClient.organizations.getEnabledConnection({
        id: session.user.org_id,
        connectionId: connectionId,
      })

    if (!enabledConnection) {
      return {
        error: "Connection not found.",
      }
    }

    try {
      await managementClient.connections.deleteScimConfiguration({
        id: connectionId,
      })

      revalidatePath(
        `/dashboard/organization/sso/${connStrategyToSlug[enabledConnection.connection.strategy]}/edit/${connectionId}/provisioning`
      )
    } catch (error) {
      console.error("failed to delete a SCIM configuration", error)
      return {
        error: "Failed to delete a SCIM configuration.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)

export const updateScimConfig = withServerActionAuth(
  async function updateScimConfig(
    connectionId: string,
    formData: FormData,
    session: Session
  ) {
    const userIdAttribute = formData.get("user_id_attribute") as string

    if (!userIdAttribute || typeof userIdAttribute !== "string") {
      return {
        error: "User ID attribute is required.",
      }
    }

    // ensure that the connection ID being updated is owned by the organization
    const { data: enabledConnection } =
      await managementClient.organizations.getEnabledConnection({
        id: session.user.org_id,
        connectionId: connectionId,
      })

    if (!enabledConnection) {
      return {
        error: "Connection not found.",
      }
    }

    try {
      const { data: scimConfig } =
        await managementClient.connections.getScimConfiguration({
          id: connectionId,
        })

      await managementClient.connections.updateScimConfiguration(
        { id: connectionId },
        {
          user_id_attribute: userIdAttribute,
          mapping: scimConfig.mapping,
        }
      )

      revalidatePath(
        `/dashboard/organization/sso/${connStrategyToSlug[enabledConnection.connection.strategy]}/edit/${connectionId}/provisioning`
      )
    } catch (error) {
      console.error("failed to update SCIM configuration", error)
      return {
        error: "Failed to update SCIM configuration.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)

export const createScimToken = withServerActionAuth(
  async function createScimToken(connectionId: string, session: Session) {
    // ensure that the connection ID being updated is owned by the organization
    const { data: enabledConnection } =
      await managementClient.organizations.getEnabledConnection({
        id: session.user.org_id,
        connectionId: connectionId,
      })

    if (!enabledConnection) {
      return {
        error: "Connection not found.",
      }
    }

    try {
      const { data: token } =
        await managementClient.connections.createScimToken(
          {
            id: connectionId,
          },
          {}
        )

      revalidatePath(
        `/dashboard/organization/sso/${connStrategyToSlug[enabledConnection.connection.strategy]}/edit/${connectionId}/provisioning`
      )

      return {
        token: token.token,
      }
    } catch (error) {
      console.error("failed to create a SCIM token", error)
      return {
        error: "Failed to create a SCIM token.",
      }
    }
  },
  {
    role: "admin",
  }
)

export const deleteScimToken = withServerActionAuth(
  async function deleteScimToken(
    connectionId: string,
    tokenId: string,
    session: Session
  ) {
    // ensure that the connection ID being updated is owned by the organization
    const { data: enabledConnection } =
      await managementClient.organizations.getEnabledConnection({
        id: session.user.org_id,
        connectionId: connectionId,
      })

    if (!enabledConnection) {
      return {
        error: "Connection not found.",
      }
    }

    try {
      await managementClient.connections.deleteScimToken({
        id: connectionId,
        tokenId,
      })

      revalidatePath(
        `/dashboard/organization/sso/${connStrategyToSlug[enabledConnection.connection.strategy]}/edit/${connectionId}/provisioning`
      )
    } catch (error) {
      console.error("failed to delete a SCIM token", error)
      return {
        error: "Failed to delete a SCIM token.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)
