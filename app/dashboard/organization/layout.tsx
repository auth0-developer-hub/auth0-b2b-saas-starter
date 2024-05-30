import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeftIcon } from "@radix-ui/react-icons"

import { appClient } from "@/lib/auth0"
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
import { SidebarNav } from "@/components/sidebar-nav"

const sidebarNavItems = [
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

interface AccountLayoutProps {
  children: React.ReactNode
}

export default async function AccountLayout({ children }: AccountLayoutProps) {
  const session = await appClient.getSession()

  // if the user is not authenticated, redirect to login
  if (!session?.user) {
    redirect("/api/auth/login")
  }

  if (getRole(session.user) !== "admin") {
    return (
      <div className="flex items-center justify-center">
        <Card className="w-[450px]">
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription className="space-y-1.5">
              <p>You’re currently logged in with the role of <span className="font-semibold">{getRole(session.user)}</span>.</p>
              <p>Log in as an Organization member with the <span className="font-semibold">admin</span> role to manage your Organization&apos;s settings.</p>
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">
        Organization Settings
      </h2>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
