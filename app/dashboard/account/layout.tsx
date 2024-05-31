import Link from "next/link"
import { appClient, managementClient } from "@/lib/auth0"
import { Auth0Logo } from "@/components/auth0-logo"
import { OrganizationSwitcher } from "@/components/organization-switcher"
import { Separator } from "@/components/ui/separator"
import { SidebarNav } from "@/components/sidebar-nav"

const sidebarNavItems = [
  {
    title: "Profile",
    href: "/dashboard/account/profile",
  },
]

interface AccountLayoutProps {
  children: React.ReactNode
}

export default async function AccountLayout({ children }: AccountLayoutProps) {

  const session = await appClient.getSession();

  const { data: orgs } = await managementClient.users.getUserOrganizations({
    id: session?.user.sub,
  });

  return (
    <div className="p-8">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
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
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
