"use server"

import { SessionData } from "@auth0/nextjs-auth0/types"

import { verifyDnsRecords } from "@/lib/domain-verification"
import { withServerActionAuth } from "@/lib/with-server-action-auth"

export const verifyDomain = withServerActionAuth(
  async function verifyDomain(domain: string, session: SessionData) {
    if (!domain || typeof domain !== "string") {
      return {
        error: "Domain is required.",
      }
    }

    try {
      const verified = await verifyDnsRecords(domain, session.user.org_id!)

      return { verified }
    } catch (error) {
      console.error("failed to validate the domain", error)
      return {
        error: "Failed to validate the domain.",
      }
    }
  },
  {
    role: "admin",
  }
)
