import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeftIcon } from "@radix-ui/react-icons"

import { appClient, managementClient } from "@/lib/auth0"
import { Button } from "@/components/ui/button"

import { UpdateSamlConnectionForm } from "./update-saml-connection-form"

export default async function UpdateSamlConnection({
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

      <UpdateSamlConnectionForm
        connection={{
          id: connection.id,
          name: connection.name,
          displayName: connection.display_name,
          assignMembershipOnLogin: enabledConnection.assign_membership_on_login,
          options: {
            signInUrl: connection.options.signInEndpoint,
            signOutUrl: connection.options.signOutEndpoint,
            userIdAttribute: connection.options.user_id_attribute,
            protocolBinding: connection.options.protocolBinding,
            domainAliases: connection.options.domain_aliases,
            signRequest: connection.options.signSAMLRequest,
          },
        }}
      />
    </div>
  )
}
