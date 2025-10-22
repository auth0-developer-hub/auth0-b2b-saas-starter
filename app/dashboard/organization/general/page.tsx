"use client"

import { OrgDetailsEdit } from "@auth0-web-ui-components/react"

import { PageHeader } from "@/components/page-header"

export default async function GeneralSettings() {
  return (
    <div className="space-y-2">
      <PageHeader
        title="General Settings"
        description="Update your organization's general settings."
      />

      <OrgDetailsEdit 
        hideHeader={true}
        customMessages={{
          details: {
            sections: {
              settings: {
                title: 'Organization Details'
              }
            }
          }
        }}
      />
    </div>
  )
}
