import Link from "next/link"
import { ArrowLeftIcon } from "@radix-ui/react-icons"

import { appClient } from "@/lib/auth0"
import { getOrCreateDomainVerificationToken } from "@/lib/domain-verification"
import { Button } from "@/components/ui/button"
import { AppBreadcrumb } from "@/components/app-breadcrumb"

import { CreateSamlConnectionForm } from "./create-saml-connection-form"

export default async function CreateSamlConnection() {
  const session = await appClient.getSession()

  const domainVerificationToken = await getOrCreateDomainVerificationToken(
    session!.user.org_id
  )

  return (
    <div className="space-y-1">
      <div className="px-2 py-3">
        <AppBreadcrumb
          title="Back to connections"
          href="/dashboard/organization/sso"
        />
      </div>

      <CreateSamlConnectionForm
        domainVerificationToken={domainVerificationToken}
      />
    </div>
  )
}
