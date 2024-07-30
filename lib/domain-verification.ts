import { randomBytes } from "node:crypto"
import { resolveTxt } from "node:dns/promises"

import { managementClient } from "./auth0"
import { DOMAIN_VERIFICATION_RECORD_IDENTIFIER } from "./constants"

/**
 * getOrCreateDomainVerificationToken tries to fetch a domain verification token for an organization, if one exists.
 * If one does not exist, it creates a new one and returns it.
 */
export async function getOrCreateDomainVerificationToken(
  organizationId: string
) {
  const { data: organization } = await managementClient.organizations.get({
    id: organizationId,
  })

  if (organization.metadata?.domainVerificationToken) {
    return organization.metadata.domainVerificationToken
  }

  const domainVerificationToken = randomBytes(32).toString("hex")

  await managementClient.organizations.update(
    {
      id: organizationId,
    },
    {
      metadata: {
        ...organization.metadata,
        domainVerificationToken,
      },
    }
  )

  return domainVerificationToken
}

export async function verifyDnsRecords(domain: string, organizationId: string) {
  if (process.env.NODE_ENV === "development" && domain === "example.com") {
    return true
  }

  const { data: organization } = await managementClient.organizations.get({
    id: organizationId,
  })

  const txtRecords = await resolveTxt(domain)

  for (const record of txtRecords) {
    const joinedRecord = record.join("")

    if (joinedRecord.startsWith(`${DOMAIN_VERIFICATION_RECORD_IDENTIFIER}=`)) {
      const token = joinedRecord.replace(
        `${DOMAIN_VERIFICATION_RECORD_IDENTIFIER}=`,
        ""
      )

      if (token === organization.metadata.domainVerificationToken) {
        return true
      }
    }
  }

  return false
}
