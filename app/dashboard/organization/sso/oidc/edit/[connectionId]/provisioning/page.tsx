import { redirect } from "next/navigation"

import { appClient, managementClient } from "@/lib/auth0"

import { ScimForm } from "../../../../components/provisioning/scim-form"

export default async function Provisioning({
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

  let scimConfig
  let scimTokens
  try {
    ;[{ data: scimConfig }, { data: scimTokens }] = await Promise.all([
      managementClient.connections.getScimConfiguration({
        id: params.connectionId,
      }),
      managementClient.connections.getScimTokens({
        id: params.connectionId,
      }),
    ])
  } catch (e: any) {
    // Throw if error is not 404 (SCIM is not enabled for this connection)
    if (e.statusCode !== 404) {
      throw e
    }
  }

  return (
    <div>
      <ScimForm
        scimConfig={
          scimConfig
            ? {
                userIdAttribute: scimConfig.user_id_attribute,
              }
            : null
        }
        scimTokens={(scimTokens || []).map((tkn) => ({
          id: tkn.token_id,
          lastUsedAt: tkn.last_used_at,
          createdAt: tkn.created_at,
        }))}
      />
    </div>
  )
}
