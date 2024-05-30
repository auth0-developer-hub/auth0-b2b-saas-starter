import Link from "next/link"
import { redirect } from "next/navigation"
import { UserProvider } from "@auth0/nextjs-auth0/client"

import { appClient, managementClient } from "@/lib/auth0"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Auth0Logo } from "@/components/auth0-logo"
import { ModeToggle } from "@/components/mode-toggle"
import { OrganizationSwitcher } from "@/components/organization-switcher"
import { UserNav } from "@/components/user-nav"

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

  const { data: orgs } = await managementClient.users.getUserOrganizations({
    id: session.user.sub,
  })

  return (
    <UserProvider>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard">
              <Auth0Logo className="size-9" />
            </Link>

            <Separator orientation="vertical" className="h-8" />

            <OrganizationSwitcher
              organizations={orgs.map((o) => ({
                id: o.id,
                slug: o.name,
                displayName: o.display_name!,
                logoUrl: o.branding?.logo_url,
              }))}
              currentOrgId={session.user.org_id}
            />

            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/organization/general"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Settings
          </Link>
          <UserNav />
        </div>
      </nav>

      <main className="grid mx-auto min-h-[calc(100svh-153px)] max-w-7xl px-2 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <Separator />

      <footer className="mx-auto max-w-7xl px-2 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <div className="font-mono font-semibold">
              <Link href="/">SaaStart</Link>
            </div>

            <div>
              <Button variant="link" asChild>
                <Link href="/">Home</Link>
              </Button>

              <Button variant="link" asChild>
                <Link href="https://github.com/auth0-developer-hub/auth0-b2b-saas-starter" target="_blank">Source</Link>
              </Button>
            </div>
          </div>

          <div className="items-center gap-x-2">
            <ModeToggle />
          </div>
        </div>
      </footer>
    </UserProvider>
  )
}
