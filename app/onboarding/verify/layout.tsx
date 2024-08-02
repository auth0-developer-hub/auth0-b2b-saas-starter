import { redirect } from "next/navigation"
import { UserProvider } from "@auth0/nextjs-auth0/client"

import { onboardingClient } from "@/lib/auth0"

export default async function VerifyLayout({
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
        Authorization: `Bearer ${(await onboardingClient.getAccessToken()).accessToken}`,
      },
    }
  ).then((res) => res.json())

  // user already verified their account, redirect to the create step
  if (user.email_verified) {
    redirect("/onboarding/create")
  }

  return (
    <UserProvider profileUrl="/onboarding/me">
      <main className="flex min-h-screen items-center">{children}</main>
    </UserProvider>
  )
}
