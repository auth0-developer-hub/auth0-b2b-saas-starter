"use server"

import { revalidatePath } from "next/cache"
import { Session } from "@auth0/nextjs-auth0"

import { managementClient } from "@/lib/auth0"
import { DEFAULT_MFA_POLICY, SUPPORTED_PROVIDERS } from "@/lib/mfa-policy"
import { withServerActionAuth } from "@/lib/with-server-action-auth"

export const updateMfaPolicy = withServerActionAuth(
  async function updateMfaPolicy(formData: FormData, session: Session) {
    const enforce = !!formData.get("enforce")
    const skipForDomains = formData.get("skip_for_domains")
    const providers = SUPPORTED_PROVIDERS.map((p) => formData.get(p)).filter(
      Boolean
    )

    const parsedSkipForDomains =
      skipForDomains && typeof skipForDomains === "string"
        ? skipForDomains.split(",").map((d) => d.trim())
        : []

    try {
      await managementClient.organizations.update(
        {
          id: session.user.org_id,
        },
        {
          metadata: {
            mfaPolicy: JSON.stringify({
              ...DEFAULT_MFA_POLICY,
              enforce,
              skipForDomains: parsedSkipForDomains,
              providers,
            }),
          },
        }
      )

      revalidatePath("/dashboard/organization/security-policies")
    } catch (error) {
      console.error("failed to update the organization's MFA policy", error)
      return {
        error: "Failed to update the organization's MFA policy.",
      }
    }

    return {}
  },
  {
    role: "admin",
  }
)
