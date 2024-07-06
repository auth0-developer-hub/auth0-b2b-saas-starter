"use server"

import { revalidatePath } from "next/cache"
import { Session } from "@auth0/nextjs-auth0"

import { managementClient } from "@/lib/auth0"
import { verifyDnsRecords } from "@/lib/domain-verification"
import { withServerActionAuth } from "@/lib/with-server-action-auth"

export const updateConnection = withServerActionAuth(
  async function updateConnection(
    connectionId: string,
    formData: FormData,
    session: Session
  ) {
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
      await Promise.all([
        managementClient.connections.update(
          { id: connectionId },
          {
            display_name: displayName,
            options: {
              type,
              discovery_url: discoveryUrl,
              client_id: clientId,
              client_secret: clientSecret,
              domain_aliases: parsedDomains,
              scope,
            },
          }
        ),
        managementClient.organizations.updateEnabledConnection(
          {
            id: session.user.org_id,
            connectionId,
          },
          {
            assign_membership_on_login:
              assignMembershipOnLogin === "enabled" ? true : false,
          }
        ),
      ])

      revalidatePath("/dashboard/organization/sso")
    } catch (error) {
      console.error("failed to update the SSO connection", error)
      return {
        error: "Failed to update the SSO connection.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)
