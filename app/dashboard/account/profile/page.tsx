import React from "react"

import { AppRouterPageRoute } from "@auth0/nextjs-auth0/server"
import { appClient } from "@/lib/auth0"
import { PageHeader } from "@/components/page-header"

import { DeleteAccountForm } from "./delete-account-form"
import { DisplayNameForm } from "./display-name-form"

export default appClient.withPageAuthRequired(
  async function Profile() {
    const session = await appClient.getSession()

    return (
      <div className="space-y-2">
        <PageHeader
          title="Profile"
          description="Manage your personal information."
        />

        <DisplayNameForm displayName={session?.user.name!} />

        <DeleteAccountForm />
      </div>
    )
    // TODO: Let's verify why this is needed, it is possible this roots to Auth0 Next.js SDK
  } as AppRouterPageRoute,
  { returnTo: "/dashboard/account/profile" }
) as React.FC
