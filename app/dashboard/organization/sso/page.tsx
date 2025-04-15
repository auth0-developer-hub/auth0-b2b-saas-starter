import { appClient, managementClient } from "@/lib/auth0"
import { PageHeader } from "@/components/page-header"

import { ConnectionsList } from "./connections-list"

export interface Connection {
  id: string
  name: string
  strategy: string
  assign_membership_on_login: boolean
}

export default async function SSO() {
  const session = await appClient.getSession()
  const { connections } = await (async () => {
    const result = await fetch("http://localhost:3001/org/providers", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.accessToken}`, // if needed
      },
    })

    if (!result.ok) {
      const errorBody = await result.text()
      throw new Error(`Failed: ${result.status} ${errorBody}`)
    }

    return (await result.json()) as { connections: Connection[] }
  })()

  const componentConfig = await (async () => {
    const result = await fetch("http://localhost:3001/org/config/providers", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.accessToken}`, // if needed
      },
    })

    if (!result.ok) {
      const errorBody = await result.text()
      throw new Error(`Failed: ${result.status} ${errorBody}`)
    }

    return await result.json()
  })()

  return (
    <div className="space-y-2">
      <PageHeader
        title="Single Sign-On"
        description="Configure SSO for your organization."
      />

      <ConnectionsList
        connections={connections
          // filter out the default connection ID assigned to all organizations
          .filter((c) => c.id !== process.env.DEFAULT_CONNECTION_ID)
          .map((c) => ({
            id: c.id,
            name: c.name,
            strategy: c.strategy,
            assignMembershipOnLogin: c.assign_membership_on_login,
          }))}
        componentConfig={componentConfig}
      />
    </div>
  )
}
