import { redirect } from "next/navigation"

import { appClient, managementClient } from "@/lib/auth0"
import { getOrCreateDomainVerificationToken } from "@/lib/domain-verification"

import { UpdateOidcConnectionForm } from "./update-oidc-connection-form"

export default async function UpdateOidcConnection({
  params,
}: {
  params: Promise<{ connectionId: string }>
}) {
  const session = await appClient.getSession()

  if (!session) {
    return redirect("/auth/login")
  }

  // ensure that the connection ID being fetched is owned by the organization
  const { connectionId } = await params
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
    discovery_url: string
    domain_aliases: string[]
    client_id: string
    client_secret: string
    scope: string
    type: "front_channel" | "back_channel"
  }

  return (
    <div>
      <UpdateOidcConnectionForm
        connection={{
          id: connection.id!,
          name: connection.name!,
          displayName: connection.display_name!,
          assignMembershipOnLogin:
            enabledConnection.assign_membership_on_login!,
          options: {
            discoveryUrl: options.discovery_url,
            domainAliases: options.domain_aliases,
            clientId: options.client_id,
            clientSecret: options.client_secret,
            scope: options.scope,
            type: options.type,
          },
        }}
        domainVerificationToken={domainVerificationToken}
      />
    </div>
  )
}
