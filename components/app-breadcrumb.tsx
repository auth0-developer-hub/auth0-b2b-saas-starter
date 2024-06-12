import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AppBreadcrumbProps {
  href: string
  title: string
}

export const AppBreadcrumb = ({ href, title }: AppBreadcrumbProps) => {
  return (
    <Button variant="link" asChild>
      <Link
        href={href}
        className={cn(
          "flex items-center text-sm text-muted-foreground",
          "hover:text-accent-foreground"
        )}
      >
        <ArrowLeftIcon className="mr-1.5 size-4" />
        {title}
      </Link>
    </Button>
  )
}
