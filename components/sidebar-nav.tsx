"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon, Dot } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "ml-0 mt-8 flex min-h-full space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname.includes(item.href) && "text-accent-foreground",
            "hover:bg-muted",
            "justify-between pl-2.5 pr-1"
          )}
        >
          {item.title}
          {pathname.includes(item.href) && <Dot className="h-6 w-6" />}
        </Link>
      ))}
    </nav>
  )
}
