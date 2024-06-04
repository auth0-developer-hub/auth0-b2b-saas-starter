import Link from "next/link"
import { ArrowLeftIcon } from "@radix-ui/react-icons"

import { appClient } from "@/lib/auth0"
import { getOrCreateDomainVerificationToken } from "@/lib/domain-verification"
import { Button } from "@/components/ui/button"

import { CreateOidcConnectionForm } from "./create-oidc-connection-form"

export default async function CreateOidcConnection() {
  const session = await appClient.getSession()

  const domainVerificationToken = await getOrCreateDomainVerificationToken(
    session!.user.org_id
  )

  return (
    <div className="space-y-6">
      <div>
        <Button variant="link" className="px-0 text-muted-foreground" asChild>
          <Link href="/dashboard/organization/sso">
            <ArrowLeftIcon className="mr-1.5 size-4" /> Back to connections
          </Link>
        </Button>
      </div>

      <CreateOidcConnectionForm
        domainVerificationToken={domainVerificationToken}
      />
    </div>
  )
}
