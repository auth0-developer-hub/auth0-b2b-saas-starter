import { createHmac } from "crypto"

import { appClient } from "@/lib/auth0"
import { PageHeader } from "@/components/page-header"

import { CustomerPortal } from "./customer-portal"

function generateCustomerToken(customerId: string) {
  const secret = process.env.STIGG_CUSTOMER_TOKEN_SIGNING_SECRET || ""
  const signature = createHmac("sha256", secret)
    .update(customerId)
    .digest("hex")
  return `HMAC-SHA256 ${customerId}:${signature}`
}

export default async function Billing() {
  const session = await appClient.getSession()

  const customerId = session!.user.org_id
  const customerToken = generateCustomerToken(customerId)

  return (
    <div className="space-y-2">
      <PageHeader
        title="Billing"
        description="Manage your organization's billing settings."
      />
      <CustomerPortal customerId={customerId} customerToken={customerToken} />
    </div>
  )
}
