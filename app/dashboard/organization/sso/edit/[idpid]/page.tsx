"use client"

import { useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { SsoProviderEdit } from "@auth0/web-ui-components-react/rwa"

export default function SsoProviderEditPage() {
  const router = useRouter()
  const params = useParams()
  const idpId = params.idpId as string

  const handleUpdate = useCallback((): void => {
    router.push("/dashboard/organization/sso")
  }, [router])

  const handleBack = useCallback((): void => {
    router.push("/dashboard/organization/sso")
  }, [router])


  return (
    <div className="space-y-6 p-6 pt-8">
      <SsoProviderEdit
        providerId={idpId!}
        sso={{
          updateAction: useMemo(
            () => ({
              onAfter: handleUpdate,
            }),
            [handleUpdate]
          ),
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
