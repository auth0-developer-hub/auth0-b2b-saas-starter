"use server"

import { Session } from "@auth0/nextjs-auth0"

import { verifyDnsRecords } from "@/lib/domain-verification"
import { withServerActionAuth } from "@/lib/with-server-action-auth"

export const verifyDomain = withServerActionAuth(
  async function verifyDomain(domain: string, session: Session) {
    if (!domain || typeof domain !== "string") {
      return {
        error: "Domain is required.",
      }
    }

    try {
      const verified = await verifyDnsRecords(domain, session.user.org_id)

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

export const getTicketUrl = withServerActionAuth(
  async function getTicketUrl(
    name: string,
    assign_membership_on_login: boolean,
    show_as_button: boolean,
    button_display_name: string | null,
    session: Session
  ) {
    const payload = {
      name,
      assign_membership_on_login,
      show_as_button,
      button_display_name,
    }

    const result = await fetch("http://localhost:3001/org/providers/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await session.accessToken}`, // if needed
      },
      body: JSON.stringify(payload),
    })

    if (!result.ok) {
      const errorBody = await result.text()
      throw new Error(`Failed: ${result.status} ${errorBody}`)
    }
    const data = await result.json()
    return data.ticket
  },
  { role: "admin" }
)
