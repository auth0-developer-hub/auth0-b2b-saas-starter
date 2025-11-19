"use client"

import React from "react"
// import "@auth0/web-ui-components-react/styles"
import { Auth0ComponentProvider } from "@auth0/web-ui-components-react/rwa"

interface ClientProviderProps {
  children: React.ReactNode
}

export function ClientProvider({ children }: ClientProviderProps) {
  return (
    <Auth0ComponentProvider
      authDetails={
        {
          authProxyUrl: "/", // Use the auth proxy base (For example, MFA service will add /mfa/authenticators)
          domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN
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
