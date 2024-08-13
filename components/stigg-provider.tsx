"use client"

import * as React from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { StiggProvider as ReactStiggProvider } from "@stigg/react-sdk"

import { providerTheme } from "@/components/stigg-theme"

type StiggProviderProps = {
  customerId?: string | undefined
  customerToken?: string | undefined
  children: React.ReactNode
}

export function StiggProvider({
  children,
  customerId,
  customerToken,
}: StiggProviderProps) {
  return (
    <ReactStiggProvider
      theme={providerTheme}
      apiKey={process.env.NEXT_PUBLIC_STIGG_CLIENT_API_KEY}
      customerId={customerId}
      customerToken={customerToken}
    >
      {children}
    </ReactStiggProvider>
  )
}
