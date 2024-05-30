import { appClient, managementClient } from "@/lib/auth0"
import { Separator } from "@/components/ui/separator"

import { ConnectionsList } from "./connections-list"

export default async function SSO() {
  const session = await appClient.getSession()
  const { data: connections } =
    await managementClient.organizations.getEnabledConnections({
      id: session!.user.org_id,
    })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Single Sign-On (SSO)</h3>
        <p className="text-sm text-muted-foreground">
          Configure an OIDC or SAML single sign-on connection for your
          application.
        </p>
      </div>

      <Separator />

      <ConnectionsList
        connections={connections
          // filter out the default connection ID assigned to all organizations
          .filter((c) => c.connection_id !== process.env.DEFAULT_CONNECTION_ID)
          .map((c) => ({
            id: c.connection_id,
            name: c.connection.name,
            strategy: c.connection.strategy,
            assignMembershipOnLogin: c.assign_membership_on_login,
          }))}
      />
    </div>
  )
}
