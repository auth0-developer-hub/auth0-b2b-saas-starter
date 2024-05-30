import { appClient } from "@/lib/auth0"
import { Separator } from "@/components/ui/separator"

import { DisplayNameForm } from "./display-name-form"

export default appClient.withPageAuthRequired(
  async function Profile() {
    const session = await appClient.getSession()

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Profile</h3>
          <p className="text-sm text-muted-foreground">
            Manage your personal information.
          </p>
        </div>

        <Separator />

        <DisplayNameForm displayName={session?.user.name} />
      </div>
    )
  },
  { returnTo: "/dashboard/account/profile" }
)
