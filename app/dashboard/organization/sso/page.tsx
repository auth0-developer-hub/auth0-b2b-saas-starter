"use client"

import { useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  IdentityProvider,
  SsoProviderTable,
  UseSsoProviderTableReturn,
} from "@auth0/web-ui-components-react"

import { PageHeader } from "@/components/page-header"

export default async function SSO() {
  const router = useRouter()
  const handleCreate = useCallback((): void => {
    router.push("/dashboard/organization/sso/create/")
  }, [])

  const handleEdit = useCallback((provider: IdentityProvider): void => {
    router.push(`/dashboard/organization/sso/edit/${provider.id}`)
  }, [])

  const createAction = useMemo(
    () => ({
      onAfter: handleCreate,
      disabled: false,
    }),
    [handleCreate]
  )

  const editAction = useMemo(
    () => ({
      onAfter: handleEdit,
      disabled: false,
    }),
    [handleEdit]
  )
  return (
    <div className="space-y-2">
      <PageHeader
        title="Single Sign-On"
        description="Configure SSO for your organization."
      />

      <SsoProviderTable
        customMessages={{
          header: {
            title: "SSO Providers",
            description: "",
          },
        }}
        createAction={createAction}
        editAction={editAction}
      />
    </div>
  )
}
