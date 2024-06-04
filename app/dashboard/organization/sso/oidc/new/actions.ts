"use server"

import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { Session } from "@auth0/nextjs-auth0"
import slugify from "@sindresorhus/slugify"

import { managementClient } from "@/lib/auth0"
import { verifyDnsRecords } from "@/lib/domain-verification"
import { withServerActionAuth } from "@/lib/with-server-action-auth"

export const createConnection = withServerActionAuth(
  async function createConnection(formData: FormData, session: Session) {
    const displayName = formData.get("display_name")
    const discoveryUrl = formData.get("discovery_url")
    const clientId = formData.get("client_id")
    const clientSecret = formData.get("client_secret")
    const domainAliases = formData.get("domains")
    const type = formData.get("type")
    const scope = formData.get("scope")
    const assignMembershipOnLogin = formData.get("assign_membership_on_login")

    if (!displayName || typeof displayName !== "string") {
      return {
        error: "Connection name is required.",
      }
    }

    if (!discoveryUrl || typeof discoveryUrl !== "string") {
      return {
        error: "Discovery URL is required.",
      }
    }

    if (!clientId || typeof clientId !== "string") {
      return {
        error: "Client ID is required.",
      }
    }

    if (!type || typeof type !== "string") {
      return {
        error: "Type is required.",
      }
    }

    if (!scope || typeof scope !== "string") {
      return {
        error: "Scope is required.",
      }
    }

    if (
      !assignMembershipOnLogin ||
      typeof assignMembershipOnLogin !== "string"
    ) {
      return {
        error: "Auto-membership is required.",
      }
    }

    const parsedDomains =
      domainAliases && typeof domainAliases === "string"
        ? domainAliases.split(",").map((d) => d.trim())
        : []

    // ensure that the domains are verified
    for (const domain of parsedDomains) {
      const verified = await verifyDnsRecords(domain, session.user.org_id)

      if (!verified) {
        return {
          error: `The domain ${domain} is not verified.`,
        }
      }
    }

    try {
      const { data: connection } = await managementClient.connections.create({
        display_name: displayName,
        // we append a suffix to the connection identifier as they must be globally
        // unique and we want to avoid collisions when supplied by the user
        name: `${slugify(displayName)}-${crypto.randomBytes(4).toString("hex")}`,
        strategy: "oidc",
        enabled_clients: [process.env.AUTH0_CLIENT_ID],
        options: {
          type,
          discovery_url: discoveryUrl,
          client_id: clientId,
          client_secret: clientSecret,
          domain_aliases: parsedDomains,
          scope,
        },
      })

      await managementClient.organizations.addEnabledConnection(
        { id: session.user.org_id },
        {
          connection_id: connection.id,
          assign_membership_on_login:
            assignMembershipOnLogin === "enabled" ? true : false,
        }
      )

      revalidatePath("/dashboard/organization/sso")
    } catch (error) {
      console.error("failed to create the SSO connection", error)
      return {
        error: "Failed to create the SSO connection.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)

export const deleteConnection = withServerActionAuth(
  async function deleteConnection(connectionId: string, session: Session) {
    if (!connectionId || typeof connectionId !== "string") {
      return {
        error: "Connection ID is required.",
      }
    }

    try {
      // ensure that the connection being removed belongs to the organization
      const { data: connection } =
        await managementClient.organizations.getEnabledConnection({
          id: session.user.org_id,
          connectionId,
        })

      if (!connection) {
        return {
          error: "Connection not found.",
        }
      }

      await managementClient.connections.delete({
        id: connectionId,
      })

      revalidatePath("/dashboard/organization/sso")

      return {}
    } catch (error) {
      console.error("failed to delete the SSO connection", error)
      return {
        error: "Failed to delete the SSO connection.",
      }
    }
  },
  {
    role: "admin",
  }
)
