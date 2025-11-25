"use client"

import { useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { SsoProviderEdit } from "@auth0/web-ui-components-react/rwa"

export default function SsoProviderEditPage() {
  const router = useRouter()
  const params = useParams()
  const idpId = params.idpid as string

  const handleBack = useCallback((): void => {
    router.push("/dashboard/organization/sso")
  }, [router])


  return (
    <div className="space-y-6 p-6 pt-8">
      <SsoProviderEdit
        providerId={idpId!}
        sso={{
          deleteAction: {
            onAfter: () => {
              router.push("/dashboard/organization/sso")
            },
          },
          deleteFromOrgAction: {
            onAfter: () => {
              router.push("/dashboard/organization/sso")
            },
          },
        }}
        backButton={{ onClick: handleBack }}
      />
    </div>
  )
}
