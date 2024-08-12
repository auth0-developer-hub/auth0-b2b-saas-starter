import { appClient, managementClient } from "@/lib/auth0"
import { checkAccess } from "@/lib/entitlements"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"

import { ConnectionsList } from "./connections-list"

function NoAccess() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Premium feature</CardTitle>
        <CardDescription>
          To access this feature, please upgrade your subscription.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="default">Go to Billing</Button>
      </CardContent>
    </Card>
  )
}

export default async function SSO() {
  const session = await appClient.getSession()

  const hasAccess = await checkAccess(session!.user, "sso")

  const { data: connections } =
    await managementClient.organizations.getEnabledConnections({
      id: session!.user.org_id,
    })

  return (
    <div className="space-y-2">
      <PageHeader
        title="Single Sign-On"
        description="Configure SSO for your organization."
      />
      {!hasAccess ? (
        <NoAccess />
      ) : (
        <ConnectionsList
          connections={connections
            // filter out the default connection ID assigned to all organizations
            .filter(
              (c) => c.connection_id !== process.env.DEFAULT_CONNECTION_ID
            )
            .map((c) => ({
              id: c.connection_id,
              name: c.connection.name,
              strategy: c.connection.strategy,
              assignMembershipOnLogin: c.assign_membership_on_login,
            }))}
        />
      )}
    </div>
  )
}
