import { redirect } from "next/navigation"

import { appClient, managementClient } from "@/lib/auth0"

import { ScimForm } from "./scim-form"

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

  // const scimConfig = await managementClient.connections.getScimConfig({
  //   id: params.connectionId,
  // })

  return (
    <div>
      <ScimForm
        scimConfig={{
          externalId: "externalId",
        }}
      />
    </div>
  )
}
