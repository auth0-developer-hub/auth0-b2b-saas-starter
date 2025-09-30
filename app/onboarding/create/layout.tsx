import { redirect } from "next/navigation"
import { Auth0Provider } from "@auth0/nextjs-auth0"

import { onboardingClient } from "@/lib/auth0"

export default async function CreateLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await onboardingClient.getSession()

  if (!session) {
    redirect("/onboarding/signup")
  }

  // fetch the latest user data to ensure that the `email_verified` is not stale
  const user = await fetch(
    new URL("/userinfo", `https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}`),
    {
      headers: {
        Authorization: `Bearer ${(await onboardingClient.getAccessToken()).token}`,
      },
    }
  ).then((res) => res.json())

  // user must verify their e-mail first to create your account
  if (!user.email_verified) {
    redirect("/onboarding/verify")
  }

  return (
    <Auth0Provider>
      <main className="min-h-screen">{children}</main>
    </Auth0Provider>
  )
}
