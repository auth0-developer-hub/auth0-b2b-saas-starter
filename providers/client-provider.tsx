"use client"

import React from "react"
import { Auth0ComponentProvider } from "@auth0/web-ui-components-react"

interface ClientProviderProps {
  children: React.ReactNode
}

export function ClientProvider({ children }: ClientProviderProps) {
  return (
    <Auth0ComponentProvider
      authDetails={
        {
          authProxyUrl: "/", // Use the auth proxy base (For example, MFA service will add /mfa/authenticators)
        }
      }
      themeSettings={{
        mode: "light",
        theme: "default",
      }}
    >
      {children}
    </Auth0ComponentProvider>
  )
}
