import Link from "next/link"
import { redirect } from "next/navigation"
import { UserProvider } from "@auth0/nextjs-auth0/client"

import { appClient } from "@/lib/auth0"
import { Separator } from "@/components/ui/separator"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await appClient.getSession()

  // if the user is not authenticated, redirect to login
  if (!session?.user) {
    redirect("/api/auth/login")
  }

  return (
    <UserProvider>
      <main className="mx-auto grid min-h-[100svh]">{children}</main>
    </UserProvider>
  )
}
