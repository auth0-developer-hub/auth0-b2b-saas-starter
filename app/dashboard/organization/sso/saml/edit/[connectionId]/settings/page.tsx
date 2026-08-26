import { redirect } from "next/navigation"

import { appClient, managementClient } from "@/lib/auth0"
import { getOrCreateDomainVerificationToken } from "@/lib/domain-verification"

import { UpdateSamlConnectionForm } from "./update-saml-connection-form"

export default async function UpdateSamlConnection({
  params,
}: {
  params: Promise<{ connectionId: string }>
}) {
  const session = await appClient.getSession()

  if (!session) {
    return redirect("/auth/login")
  }

  const { connectionId } = await params
  // ensure that the connection ID being fetched is owned by the organization
  const enabledConnection =
    await managementClient.organizations.enabledConnections.get(
      session.user.org_id!,
      connectionId
    )

  if (!enabledConnection) {
    redirect("/dashboard/organization/sso")
  }

  const [domainVerificationToken, connection] = await Promise.all([
    getOrCreateDomainVerificationToken(session!.user.org_id!),
    managementClient.connections.get(connectionId),
  ])

  // the options shape is strategy-specific and typed as a generic record by the SDK
  const options = connection.options as {
    signInEndpoint: string
    signOutEndpoint?: string
    user_id_attribute?: string
    protocolBinding:
      | "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
      | "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
    domain_aliases: string[]
    signSAMLRequest: boolean
  }

  return (
    <div>
      <UpdateSamlConnectionForm
        connection={{
          id: connection.id!,
          name: connection.name!,
          displayName: connection.display_name!,
          assignMembershipOnLogin:
            enabledConnection.assign_membership_on_login!,
          options: {
            signInUrl: options.signInEndpoint,
            signOutUrl: options.signOutEndpoint,
            userIdAttribute: options.user_id_attribute,
            protocolBinding: options.protocolBinding,
            domainAliases: options.domain_aliases,
            signRequest: options.signSAMLRequest,
          },
        }}
        domainVerificationToken={domainVerificationToken}
      />
    </div>
  )
}
