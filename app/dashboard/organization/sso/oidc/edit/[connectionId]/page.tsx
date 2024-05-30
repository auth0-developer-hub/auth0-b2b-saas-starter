import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeftIcon } from "@radix-ui/react-icons"

import { appClient, managementClient } from "@/lib/auth0"
import { Button } from "@/components/ui/button"

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

  const { data: connection } = await managementClient.connections.get({
    id: params.connectionId,
  })

  return (
    <div className="space-y-6">
      <div>
        <Button variant="link" className="px-0 text-muted-foreground" asChild>
          <Link href="/dashboard/organization/sso">
            <ArrowLeftIcon className="mr-1.5 size-4" /> Back to connections
          </Link>
        </Button>
      </div>

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
      />
    </div>
  )
}
