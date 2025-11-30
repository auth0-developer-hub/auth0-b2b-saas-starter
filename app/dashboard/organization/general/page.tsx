"use client"

import { OrgDetailsEdit } from "@auth0/web-ui-components-react/rwa"

import { PageHeader } from "@/components/page-header"

export default function GeneralSettings() {
  return (
    <div className="space-y-2">
      <PageHeader
        title="General Settings"
        description="Update your organization's general settings."
      />

      <OrgDetailsEdit 
        hideHeader={true}
      />
    </div>
  )
}