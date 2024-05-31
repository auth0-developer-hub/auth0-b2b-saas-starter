import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeftIcon } from "@radix-ui/react-icons"

import { appClient, managementClient } from "@/lib/auth0"
import { getRole } from "@/lib/roles"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Auth0Logo } from "@/components/auth0-logo"
import { OrganizationSwitcher } from "@/components/organization-switcher"
import { SidebarNav } from "@/components/sidebar-nav"

interface AccountLayoutProps {
  children: React.ReactNode
}

export default async function AccountLayout({ children }: AccountLayoutProps) {
  const session = await appClient.getSession()

  const { data: orgs } = await managementClient.users.getUserOrganizations({
    id: session?.user.sub,
  })

  // if the user is not authenticated, redirect to login
  if (!session?.user) {
    redirect("/api/auth/login")
  }

  const adminSidebarNavItems = [
    {
      title: "General Settings",
      href: "/dashboard/organization/general",
    },
    {
      title: "Members",
      href: "/dashboard/organization/members",
    },
    {
      title: "SSO",
      href: "/dashboard/organization/sso",
    },
    {
      title: "Security Policies",
      href: "/dashboard/organization/security-policies",
    },
  ]

  const userRole = getRole(session.user)
  const isAdmin = userRole === "admin"

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center">
        <Card className="w-[450px]">
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription className="space-y-1.5">
              <p>
                You’re currently logged in with the role of{" "}
                <span className="font-semibold">{getRole(session.user)}</span>.
              </p>
              <p>
                Log in as an Organization member with the{" "}
                <span className="font-semibold">admin</span> role to manage your
                Organization&apos;s settings.
              </p>
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/dashboard" className="w-full">
              <Button className="w-full">
                <ArrowLeftIcon className="mr-2 h-4 w-4" /> Go Back to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="wrapper flex">
      <aside className="flex flex-col p-8 lg:w-1/5">
        <div className="flex items-center gap-2 pb-8">
          <Link href="/dashboard">
            <Auth0Logo className="size-5" />
          </Link>
          <Link
            href="/dashboard"
            className="text-lg font-medium transition-colors hover:text-muted-foreground"
          >
            SaaStart
          </Link>
        </div>
        <OrganizationSwitcher
          className="flex"
          organizations={orgs.map((o) => ({
            id: o.id,
            slug: o.name,
            displayName: o.display_name!,
            logoUrl: o.branding?.logo_url,
          }))}
          currentOrgId={session.user.org_id}
        />
        <Separator orientation="horizontal" className="my-4" />
        <SidebarNav items={adminSidebarNavItems} className="grow" />
        <div className="flex flex-col space-y-2">
          <Link href="/dashboard/account/profile">Profile</Link>
          <Link href="/api/auth/logout">Log Out</Link>
        </div>
      </aside>
      <div className="workspace p-8 lg:w-4/5">
        <nav className="mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-6"></div>
          </div>

          <div className="flex items-center space-x-4"></div>
        </nav>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
