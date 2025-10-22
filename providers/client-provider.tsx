"use client"

import React from "react"
import { Auth0ComponentProvider } from "@auth0-web-ui-components/react"

interface ClientProviderProps {
  children: React.ReactNode
}

export function ClientProvider({ children }: ClientProviderProps) {
  return (
    <Auth0ComponentProvider
      authDetails={{
        authProxyUrl: "/api", // Use the auth proxy base (For example, MFA service will add /mfa/authenticators)
        servicesConfig: {
          myAccount: {
            enabled: false,
          },
          myOrg: {
            enabled: true
          },
        },
      }}
      themeSettings={{
        mode: "light",
        theme: "default",
      }}
    >
      {children}
    </Auth0ComponentProvider>
  )
}
