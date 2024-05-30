import { appClient, managementClient } from "@/lib/auth0"
import { Separator } from "@/components/ui/separator"

import { DisplayNameForm } from "./display-name-form"

export default async function GeneralSettings() {
  const session = await appClient.getSession()
  const { data: org } = await managementClient.organizations.get({
    id: session!.user.org_id,
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">General Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage the organization display name and branding.
        </p>
      </div>

      <Separator />

      <DisplayNameForm
        organization={{
          id: org.id,
          slug: org.name,
          displayName: org.display_name,
        }}
      />
    </div>
  )
}
