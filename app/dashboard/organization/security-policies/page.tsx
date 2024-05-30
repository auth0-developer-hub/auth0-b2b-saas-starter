import { appClient, managementClient } from "@/lib/auth0"
import { Separator } from "@/components/ui/separator"

import { DEFAULT_MFA_POLICY } from "./mfa-policy"
import { MfaPolicyForm } from "./mfa-policy-form"

export default async function SecurityPolicies() {
  const session = await appClient.getSession()
  const { data: org } = await managementClient.organizations.get({
    id: session!.user.org_id,
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security Policies</h3>
        <p className="text-sm text-muted-foreground">
          Manage the security policies of your organization.
        </p>
      </div>

      <Separator />

      <MfaPolicyForm
        organization={{
          id: org.id,
          slug: org.name,
          displayName: org.display_name,
          mfaPolicy: org.metadata?.mfaPolicy
            ? JSON.parse(org.metadata.mfaPolicy)
            : DEFAULT_MFA_POLICY,
        }}
      />
    </div>
  )
}
