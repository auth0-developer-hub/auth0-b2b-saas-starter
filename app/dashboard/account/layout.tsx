import { SidebarNav } from "@/components/sidebar-nav"

const sidebarNavItems = [
  {
    title: "Profile",
    href: "/dashboard/account/profile",
  },
  {
    title: "Security",
    href: "/dashboard/account/security",
  },
]

interface AccountLayoutProps {
  children: React.ReactNode
}

export default async function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <div className="space-y-1">
      <div className="flex min-h-full flex-col space-y-8 lg:flex-row lg:space-x-4 lg:space-y-0">
        <aside className="lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="rounded-2xl border border-border bg-field p-2 shadow-sm lg:w-4/5">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </div>
    </div>
  )
}
