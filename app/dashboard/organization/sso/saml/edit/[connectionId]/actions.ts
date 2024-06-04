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
    const signInUrl = formData.get("sign_in_url")
    const signOutUrl = formData.get("sign_out_url") // optional
    const certificate = formData.get("certificate")
    const userIdAttribute = formData.get("user_id_attribute") // optional
    const protocolBinding = formData.get("protocol_binding")
    const domainAliases = formData.get("domains")
    const signRequest = formData.get("sign_request") === "on"
    const assignMembershipOnLogin = formData.get("assign_membership_on_login")

    if (!displayName || typeof displayName !== "string") {
      return {
        error: "Connection name is required.",
      }
    }

    if (!signInUrl || typeof signInUrl !== "string") {
      return {
        error: "Sign-in URL is required.",
      }
    }

    if (!certificate || !(certificate instanceof File)) {
      return {
        error: "Certificate is required.",
      }
    }

    if (!protocolBinding || typeof protocolBinding !== "string") {
      return {
        error: "Protocol binding is required.",
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
    const [{ data: enabledConnection }, { data: connection }] =
      await Promise.all([
        managementClient.organizations.getEnabledConnection({
          id: session.user.org_id,
          connectionId: connectionId,
        }),
        managementClient.connections.get({
          id: connectionId,
        }),
      ])

    if (!enabledConnection) {
      return {
        error: "Connection not found.",
      }
    }

    try {
      const samlOptions = {
        signInEndpoint: signInUrl,
        signOutEndpoint: signOutUrl,
        disableSignout: !!!signOutUrl,
        user_id_attribute: userIdAttribute,
        protocolBinding,
        domain_aliases: parsedDomains,
        signSAMLRequest: signRequest,
        signatureAlgorithm: signRequest ? "rsa-sha256" : null,
        digestAlgorithm: signRequest ? "sha256" : null,
        signingCert:
          certificate.size > 0
            ? btoa(await certificate.text())
            : connection.options.signingCert,
      }

      await Promise.all([
        managementClient.connections.update(
          { id: connectionId },
          {
            display_name: displayName,
            options: samlOptions,
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
