"use client"

// @ts-expect-error
import { DomainTable } from "@auth0-web-ui-components/react"

import { PageHeader } from "@/components/page-header"

export default async function Domains() {
  return (
    <div className="space-y-2">
      <PageHeader
        title="Domains"
        description="Configure Domains for your organization."
      />

      <DomainTable />
    </div>
  )
}
