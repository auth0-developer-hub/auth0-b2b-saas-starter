import Link from "next/link"
import { ArrowRightIcon } from "@radix-ui/react-icons"

import { appClient, managementClient } from "@/lib/auth0"
import { Button } from "@/components/ui/button"
import { Auth0Logo } from "@/components/auth0-logo"
import { ModeToggle } from "@/components/mode-toggle"
import { OrganizationSwitcher } from "@/components/organization-switcher"
import { UserNav } from "@/components/user-nav"

export default async function DashboardHome() {
  const session = await appClient.getSession()

  const { data: orgs } = await managementClient.users.getUserOrganizations({
    id: session?.user.sub,
  })

  return (
    <div>
      <header className="mx-auto px-2 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard">
              <Auth0Logo className="size-5" />
            </Link>
            <div className="font-mono font-semibold">
              <Link href="/">SaaStart</Link>
            </div>
            <div className="flex">
              <Button variant="link" asChild>
                <Link href="/">Home</Link>
              </Button>

              <Button variant="link" asChild>
                <Link
                  href="https://github.com/auth0-developer-hub/auth0-b2b-saas-starter"
                  target="_blank"
                >
                  Source
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-row gap-x-4">
            <OrganizationSwitcher
              className="flex"
              organizations={orgs.map((o) => ({
                id: o.id,
                slug: o.name,
                displayName: o.display_name!,
                logoUrl: o.branding?.logo_url,
              }))}
              currentOrgId={session?.user.org_id}
            />
            <Button variant="link" asChild>
              <Link href="/dashboard/organization/general">Settings</Link>
            </Button>
            <div className="items-center gap-x-2">
              <ModeToggle />
            </div>
            <UserNav />
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-grow flex-col gap-4 pb-8 pl-8 pr-8 lg:gap-6">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold md:text-2xl">
            Logged in application view
          </h1>
          <p>Edit /dashboard/page.tsx to change this view</p>
        </div>
        <div className="flex min-h-[calc(100svh-200px)] flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex max-w-[500px] flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              Explore the SaaS Starter
            </h3>
            <p className="mt-1 text-muted-foreground">
              This reference app demonstrates how to build a fully-fledged
              multi-tenant B2B SaaS application using a modern technology stack,
              including Auth0 by Okta.
            </p>
            <p className="mt-1 text-muted-foreground">
              The content that you have access to depends on the logged in user's role
              in their Organization. This can be modified by anyone with the
              admin role, in the settings dashboard.
            </p>
            <div className="mt-4">
              <Link href="/dashboard/organization/general" className="w-full">
                <Button className="w-full">
                  Navigate to Settings
                  <ArrowRightIcon className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
