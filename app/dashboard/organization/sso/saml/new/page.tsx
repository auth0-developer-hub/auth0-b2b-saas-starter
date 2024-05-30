import Link from "next/link"
import { ArrowLeftIcon } from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"

import { CreateSamlConnectionForm } from "./create-saml-connection-form"

export default async function CreateSamlConnection() {
  return (
    <div className="space-y-6">
      <div>
        <Button variant="link" className="px-0 text-muted-foreground" asChild>
          <Link href="/dashboard/organization/sso">
            <ArrowLeftIcon className="mr-1.5 size-4" /> Back to connections
          </Link>
        </Button>
      </div>

      <CreateSamlConnectionForm />
    </div>
  )
}
