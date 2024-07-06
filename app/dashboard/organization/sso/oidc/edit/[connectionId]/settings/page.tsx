import { redirect } from "next/navigation"

import { appClient, managementClient } from "@/lib/auth0"
import { getOrCreateDomainVerificationToken } from "@/lib/domain-verification"

import { UpdateOidcConnectionForm } from "./update-oidc-connection-form"

export default async function UpdateOidcConnection({
  params,
}: {
  params: { connectionId: string }
}) {
  const session = await appClient.getSession()

  if (!session) {
    return redirect("/api/auth/login")
  }

  // ensure that the connection ID being fetched is owned by the organization
  const { data: enabledConnection } =
    await managementClient.organizations.getEnabledConnection({
      id: session.user.org_id,
      connectionId: params.connectionId,
    })

  if (!enabledConnection) {
    redirect("/dashboard/organization/sso")
  }

  const [domainVerificationToken, { data: connection }] = await Promise.all([
    getOrCreateDomainVerificationToken(session!.user.org_id),
    managementClient.connections.get({ id: params.connectionId }),
  ])

  return (
    <div>
      <UpdateOidcConnectionForm
        connection={{
          id: connection.id,
          name: connection.name,
          displayName: connection.display_name,
          assignMembershipOnLogin: enabledConnection.assign_membership_on_login,
          options: {
            discoveryUrl: connection.options.discovery_url,
            domainAliases: connection.options.domain_aliases,
            clientId: connection.options.client_id,
            clientSecret: connection.options.client_secret,
            scope: connection.options.scope,
            type: connection.options.type,
          },
        }}
        domainVerificationToken={domainVerificationToken}
      />
    </div>
  )
}
